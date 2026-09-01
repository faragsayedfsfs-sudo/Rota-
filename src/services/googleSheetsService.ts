import { RotaConfig, StaffRow, GoogleSpreadsheetMeta } from '../types';
import { TIME_SLOTS, SLOT_GROUPS, ACTIVITIES, findActivity } from '../constants/activities';
import { getAccessToken } from './firebaseAuth';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';

// Calculate duration in hours of a time slot
export const getSlotDurationHours = (slot: string): number => {
  const clean = slot.toLowerCase().replace(/\s+/g, '');
  if (
    clean.includes('09:00-09:15') ||
    clean.includes('9:15-9:30') ||
    clean.includes('09:15-09:30') ||
    clean.includes('11:30-11:45') ||
    clean.includes('11:45-12:00') ||
    clean.includes('12:30-12:45') ||
    clean.includes('12:45-1:00') ||
    clean.includes('12:45-01:00') ||
    clean.includes('3:00-3:15') ||
    clean.includes('03:00-03:15') ||
    clean.includes('3:15-3:30') ||
    clean.includes('03:15-03:30')
  ) {
    return 0.25; // 15 mins
  }
  return 0.5; // 30 mins
};

// Calculate working hours for a staff row
export const calculateStaffHours = (slots: Record<string, string>, isUnavailable?: boolean): number => {
  if (isUnavailable) return 0;
  let totalHours = 0;
  TIME_SLOTS.forEach(slot => {
    const val = slots[slot];
    if (!val || val === 'OFF') return;
    const act = findActivity(val);
    if (!act || act.isWorking) {
      totalHours += getSlotDurationHours(slot);
    }
  });
  return totalHours;
};

// Calculate total staff coverage per time slot
export const calculateSlotCoverage = (rows: StaffRow[]) => {
  return TIME_SLOTS.map(slot => {
    let working = 0;
    let breakCount = 0;
    let offCount = 0;

    rows.forEach(r => {
      if (r.isUnavailable) {
        offCount++;
        return;
      }
      const val = r.slots[slot];
      if (!val || val === 'OFF') {
        offCount++;
        return;
      }
      const act = findActivity(val);
      if (act?.isBreak || val.toLowerCase().includes('break')) {
        breakCount++;
      } else {
        working++;
      }
    });

    return {
      slot,
      working,
      breakCount,
      offCount,
      total: rows.length
    };
  });
};

/**
 * Creates a brand new, beautifully styled Google Sheet with the exact multi-tier slot layout
 */
export const createGoogleSheetRota = async (rota: RotaConfig, customTitle?: string): Promise<{ id: string; url: string }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('You must be signed in with Google to export to Google Sheets.');
  }

  const title = customTitle || `${rota.title} (${rota.date})`;

  // Row 0: Group Headers (First slot, Prayer break, Second slot, Third slot)
  const headerRow0: string[] = [''];
  SLOT_GROUPS.forEach(group => {
    headerRow0.push(group.name);
    for (let i = 1; i < group.slots.length; i++) {
      headerRow0.push('');
    }
  });
  headerRow0.push(''); // For Total Hours

  // Row 1: Sub-headers (Assistant Name, slot1, slot2..., Total Hours)
  const headerRow1 = ['Assistant Name', ...TIME_SLOTS, 'Total Hours'];

  const dataRows = rota.rows.map((row) => {
    const slotCells = TIME_SLOTS.map(slot => {
      return row.slots[slot] || '';
    });

    const hours = calculateStaffHours(row.slots);
    return [
      row.name,
      ...slotCells,
      `${hours.toFixed(2)} hrs`
    ];
  });

  // Calculate coverage for summary row
  const coverage = calculateSlotCoverage(rota.rows);
  const summaryRow = [
    'Active Staff Count',
    ...coverage.map(c => `${c.working}`),
    ''
  ];

  const allValues = [headerRow0, headerRow1, ...dataRows, summaryRow];

  // 2. Create the spreadsheet with formatting
  const createPayload = {
    properties: {
      title,
      locale: 'en_US',
      autoRecalc: 'ON_CHANGE'
    },
    sheets: [
      {
        properties: {
          title: 'Assistant Shift Rota',
          gridProperties: {
            rowCount: allValues.length + 10,
            columnCount: TIME_SLOTS.length + 4,
            frozenRowCount: 2,
            frozenColumnCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: allValues.map((row, rIdx) => ({
              values: row.map((cell) => {
                const isGroupHeader = rIdx === 0;
                const isSubHeader = rIdx === 1;
                const isSummary = rIdx === allValues.length - 1;

                return {
                  userEnteredValue: {
                    stringValue: String(cell)
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: isGroupHeader || isSubHeader || isSummary,
                      fontSize: isGroupHeader ? 11 : (isSubHeader ? 9 : 8.5),
                      foregroundColor: isGroupHeader
                        ? { red: 1, green: 1, blue: 1 }
                        : (isSubHeader
                          ? { red: 0.95, green: 0.95, blue: 0.95 }
                          : (isSummary ? { red: 0.1, green: 0.1, blue: 0.1 } : { red: 0.15, green: 0.15, blue: 0.15 }))
                    },
                    backgroundColor: isGroupHeader
                      ? { red: 0.12, green: 0.23, blue: 0.38 } // Deep Navy
                      : (isSubHeader
                        ? { red: 0.18, green: 0.31, blue: 0.49 } // Slate Blue
                        : (isSummary
                          ? { red: 0.9, green: 0.95, blue: 1.0 } // Soft ice blue
                          : (rIdx % 2 === 0
                            ? { red: 0.98, green: 0.98, blue: 0.99 }
                            : { red: 1, green: 1, blue: 1 }
                          )
                        )
                      ),
                    horizontalAlignment: isGroupHeader || isSubHeader ? 'CENTER' : 'LEFT',
                    verticalAlignment: 'MIDDLE'
                  }
                };
              })
            }))
          }
        ]
      }
    ]
  };

  const response = await fetch(SHEETS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Sheet (${response.status})`);
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { id: spreadsheetId, url };
};

/**
 * Updates an existing Google Spreadsheet with current Rota data
 */
export const updateGoogleSheetRota = async (
  spreadsheetId: string,
  rota: RotaConfig,
  sheetName: string = 'Assistant Shift Rota'
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('You must be signed in with Google to update Google Sheets.');
  }

  const headerRow0: string[] = [''];
  SLOT_GROUPS.forEach(group => {
    headerRow0.push(group.name);
    for (let i = 1; i < group.slots.length; i++) {
      headerRow0.push('');
    }
  });
  headerRow0.push('');

  const headerRow1 = ['Assistant Name', ...TIME_SLOTS, 'Total Hours'];

  const dataRows = rota.rows.map((row) => {
    const slotCells = TIME_SLOTS.map(slot => {
      return row.slots[slot] || '';
    });

    const hours = calculateStaffHours(row.slots);
    return [
      row.name,
      ...slotCells,
      `${hours.toFixed(2)} hrs`
    ];
  });

  const coverage = calculateSlotCoverage(rota.rows);
  const summaryRow = [
    'Active Staff Count',
    ...coverage.map(c => `${c.working}`),
    ''
  ];

  const allValues = [headerRow0, headerRow1, ...dataRows, summaryRow];

  const range = `${sheetName}!A1:Z${allValues.length + 5}`;
  const updateUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: allValues
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to update Google Sheet (${response.status})`);
  }
};

/**
 * List recent spreadsheets from the user's Google Drive
 */
export const listRecentSpreadsheets = async (): Promise<GoogleSpreadsheetMeta[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const url = `${DRIVE_API}/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=15`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching Google Drive spreadsheets:', error);
    return [];
  }
};

/**
 * Imports rota structure from an existing Google Sheet
 */
export const importFromGoogleSheet = async (spreadsheetId: string): Promise<StaffRow[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required to import spreadsheet');
  }

  const url = `${SHEETS_API}/${spreadsheetId}/values/A1:Z100`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Could not fetch spreadsheet data');
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  if (rows.length < 2) {
    throw new Error('Spreadsheet does not contain enough rows to import as a Rota.');
  }

  // Find header row with time slots
  let headerRowIndex = 1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if (rows[i].some(cell => cell && String(cell).includes(':'))) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = rows[headerRowIndex] || [];
  const importedStaff: StaffRow[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[0] || String(row[0]).toLowerCase().includes('count') || String(row[0]).toLowerCase().includes('total')) {
      continue;
    }

    const name = String(row[0]).trim();
    const slots: Record<string, string> = {};

    TIME_SLOTS.forEach((slot, slotIdx) => {
      // Find matching column in header
      const colIdx = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === slot.toLowerCase());
      if (colIdx !== -1 && row[colIdx] !== undefined) {
        slots[slot] = String(row[colIdx]).trim();
      } else if (row[slotIdx + 1] !== undefined) {
        slots[slot] = String(row[slotIdx + 1]).trim();
      } else {
        slots[slot] = '';
      }
    });

    importedStaff.push({
      id: `imported-${r}-${Date.now().toString(36)}`,
      name,
      role: 'TCA Staff',
      skills: ['Classroom', 'Hallways'],
      slots,
      notes: ''
    });
  }

  return importedStaff;
};
