import { StaffRow, RotaConfig } from '../types';
import { TIME_SLOTS, findActivity } from '../constants/activities';
import { isBreakDuty, isActiveWorkingDuty } from './breakCompliance';

export type ConflictType = 
  | 'MULTI_DUTY_CELL'
  | 'BREAK_OVERLAP'
  | 'DOUBLE_BOOKED_STAFF'
  | 'TIME_SPAN_OVERLAP'
  | 'INVALID_DUTY_COMBINATION';

export interface ConflictDetail {
  isConflicting: boolean;
  severity: 'error' | 'warning';
  type: ConflictType;
  title: string;
  description: string;
  conflictingDuties: string[];
  relatedStaffRowId?: string;
  relatedStaffName?: string;
  relatedSlot?: string;
}

export interface CellConflictMap {
  // staffId -> slot -> ConflictDetail
  [staffId: string]: {
    [slot: string]: ConflictDetail;
  };
}

export interface ConflictReport {
  totalConflicts: number;
  conflictedStaffCount: number;
  conflictedCellsCount: number;
  hasAnyConflicts: boolean;
  conflictMap: CellConflictMap;
  staffConflictCounts: Record<string, number>;
  conflictList: {
    staffId: string;
    staffName: string;
    slot: string;
    conflict: ConflictDetail;
  }[];
}

// Extract multiple duty tokens if a cell contains delimiters like /, +, &, comma, 'and'
export const extractDutyTokens = (cellValue: string): string[] => {
  if (!cellValue) return [];
  const trimmed = cellValue.trim();
  if (!trimmed || trimmed === 'OFF') return [];

  // Match delimiters: slash, plus, ampersand, comma, pipe, or standalone 'and'
  // But be careful not to split known activity names that legitimately contain slashes if registered as a single ID
  const known = findActivity(trimmed);
  if (known) {
    // If it's an exact match for a single recognized activity (like "Help desk/ Card creation"), don't split unless clearly compound
    if (!trimmed.includes(' + ') && !trimmed.includes(' & ') && !trimmed.includes(', ')) {
      return [trimmed];
    }
  }

  const rawTokens = trimmed
    .split(/(?:\s*[+,&|]\s*|\s*\/\s*(?!(?:Card|CS))\s*|\s+and\s+)/i)
    .map(t => t.trim())
    .filter(t => Boolean(t) && t !== '-');

  return rawTokens.length > 0 ? rawTokens : [trimmed];
};

// Check if a time string exists in activity title (e.g., "09:30-11:30" or "09:30 - 11:30")
export const extractTimeSpanFromActivity = (activityStr: string): { start: string; end: string } | null => {
  if (!activityStr) return null;
  const match = activityStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (match) {
    return {
      start: match[1],
      end: match[2]
    };
  }
  return null;
};

// Convert HH:MM to minutes from midnight (assumes 24h or AM/PM daytime schedule)
const parseTimeToMinutes = (timeStr: string): number => {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  
  // Normalization for afternoon slots if written in 12h without PM (e.g. 01:00 -> 13:00)
  if (h >= 1 && h <= 6) {
    h += 12;
  }
  return h * 60 + m;
};

// Check if a slot falls within a time span
const isSlotWithinSpan = (slot: string, span: { start: string; end: string }): boolean => {
  const slotParts = slot.split('-').map(s => s.trim());
  if (slotParts.length !== 2) return false;
  
  const slotStartMins = parseTimeToMinutes(slotParts[0]);
  const slotEndMins = parseTimeToMinutes(slotParts[1]);
  const spanStartMins = parseTimeToMinutes(span.start);
  const spanEndMins = parseTimeToMinutes(span.end);

  return slotStartMins >= spanStartMins && slotEndMins <= spanEndMins;
};

export interface ConflictOptions {
  allowDuplicateDutiesForTCAS?: boolean;
}

/**
 * Evaluates all staff rows in a RotaConfig for overlapping and conflicting activities.
 */
export const detectRotaConflicts = (rota: RotaConfig, options: ConflictOptions = {}): ConflictReport => {
  const { allowDuplicateDutiesForTCAS = true } = options;
  const conflictMap: CellConflictMap = {};
  const staffConflictCounts: Record<string, number> = {};
  const conflictList: ConflictReport['conflictList'] = [];

  let totalConflicts = 0;
  let conflictedCellsCount = 0;

  // Initialize map
  rota.rows.forEach(row => {
    conflictMap[row.id] = {};
    staffConflictCounts[row.id] = 0;
  });

  // 1. Check for Duplicate Staff Members double-booked across different rows in the same slot
  const staffByName: Record<string, StaffRow[]> = {};
  rota.rows.forEach(row => {
    if (row.isUnavailable) return;
    const cleanName = row.name.trim().toLowerCase();
    if (cleanName && cleanName !== 'unassigned' && cleanName !== 'vacant' && cleanName !== 'staff') {
      if (!staffByName[cleanName]) {
        staffByName[cleanName] = [];
      }
      staffByName[cleanName].push(row);
    }
  });

  // Find duplicate rows for the same staff person
  Object.entries(staffByName).forEach(([name, rows]) => {
    if (rows.length > 1) {
      TIME_SLOTS.forEach(slot => {
        const activeRowsInSlot = rows.filter(r => {
          if (r.isUnavailable) return false;
          const val = r.slots[slot];
          return Boolean(val) && val !== 'OFF';
        });

        if (activeRowsInSlot.length > 1) {
          // Double-booked in this slot!
          activeRowsInSlot.forEach((row, i) => {
            const otherRow = activeRowsInSlot[(i + 1) % activeRowsInSlot.length];
            const dutyA = row.slots[slot];
            const dutyB = otherRow.slots[slot];

            const conflict: ConflictDetail = {
              isConflicting: true,
              severity: 'error',
              type: 'DOUBLE_BOOKED_STAFF',
              title: 'Double-Booked Staff Member',
              description: `Assistant "${row.name}" is assigned concurrent duties across duplicate rows in this slot ("${dutyA}" and "${dutyB}").`,
              conflictingDuties: [dutyA, dutyB],
              relatedStaffRowId: otherRow.id,
              relatedStaffName: otherRow.name,
              relatedSlot: slot
            };

            conflictMap[row.id][slot] = conflict;
            staffConflictCounts[row.id] = (staffConflictCounts[row.id] || 0) + 1;
            totalConflicts++;
            conflictedCellsCount++;

            conflictList.push({
              staffId: row.id,
              staffName: row.name,
              slot,
              conflict
            });
          });
        }
      });
    }
  });

  // 2. Check for Single-Cell Overlapping / Multiple Activities (Compound assignments & Break overlaps)
  rota.rows.forEach(row => {
    if (row.isUnavailable) return;
    TIME_SLOTS.forEach(slot => {
      // If already flagged by double booking, don't overwrite if it's already an error
      if (conflictMap[row.id][slot]?.isConflicting) {
        return;
      }

      const cellValue = (row.slots[slot] || '').trim();
      if (!cellValue || cellValue === 'OFF') return;

      const tokens = extractDutyTokens(cellValue);

      if (tokens.length > 1) {
        const hasBreak = tokens.some(t => isBreakDuty(t));
        const hasWork = tokens.some(t => isActiveWorkingDuty(t));

        if (hasBreak && hasWork) {
          // Break overlapping with active work duty
          const conflict: ConflictDetail = {
            isConflicting: true,
            severity: 'error',
            type: 'BREAK_OVERLAP',
            title: 'Break & Duty Overlap',
            description: `Rest break is scheduled simultaneously with active work duty (${tokens.join(', ')}).`,
            conflictingDuties: tokens
          };
          conflictMap[row.id][slot] = conflict;
          staffConflictCounts[row.id] = (staffConflictCounts[row.id] || 0) + 1;
          totalConflicts++;
          conflictedCellsCount++;
          conflictList.push({
            staffId: row.id,
            staffName: row.name,
            slot,
            conflict
          });
        } else {
          // Multiple work duties in the same slot:
          // If allowDuplicateDutiesForTCAS is enabled, compound/dual duties are permitted for TCAS staff
          if (!allowDuplicateDutiesForTCAS) {
            const conflict: ConflictDetail = {
              isConflicting: true,
              severity: 'error',
              type: 'MULTI_DUTY_CELL',
              title: 'Multiple Overlapping Activities',
              description: `Staff member is assigned ${tokens.length} overlapping activities at the same time: ${tokens.map(t => `"${t}"`).join(', ')}.`,
              conflictingDuties: tokens
            };
            conflictMap[row.id][slot] = conflict;
            staffConflictCounts[row.id] = (staffConflictCounts[row.id] || 0) + 1;
            totalConflicts++;
            conflictedCellsCount++;
            conflictList.push({
              staffId: row.id,
              staffName: row.name,
              slot,
              conflict
            });
          }
        }
      }
    });

    // 3. Check for Time-Span Spanning Activities conflicting with other slots in the same row
    // (e.g. Activity has "09:30-11:30", but user placed another active duty at 10:00)
    TIME_SLOTS.forEach(slot => {
      const cellValue = (row.slots[slot] || '').trim();
      if (!cellValue || cellValue === 'OFF') return;

      const timeSpan = extractTimeSpanFromActivity(cellValue);
      if (timeSpan) {
        // Check other slots within this span in the same row
        TIME_SLOTS.forEach(otherSlot => {
          if (otherSlot === slot) return;
          if (isSlotWithinSpan(otherSlot, timeSpan)) {
            const otherVal = (row.slots[otherSlot] || '').trim();
            if (otherVal && otherVal !== 'OFF' && otherVal !== cellValue) {
              // Only flag if not already flagged
              if (!conflictMap[row.id][otherSlot]?.isConflicting) {
                const conflict: ConflictDetail = {
                  isConflicting: true,
                  severity: 'error',
                  type: 'TIME_SPAN_OVERLAP',
                  title: 'Multi-Hour Session Overlap',
                  description: `Assigned duty "${otherVal}" conflicts with the ongoing session "${cellValue}" spanning ${timeSpan.start} to ${timeSpan.end}.`,
                  conflictingDuties: [cellValue, otherVal],
                  relatedSlot: slot
                };
                conflictMap[row.id][otherSlot] = conflict;
                staffConflictCounts[row.id] = (staffConflictCounts[row.id] || 0) + 1;
                totalConflicts++;
                conflictedCellsCount++;
                conflictList.push({
                  staffId: row.id,
                  staffName: row.name,
                  slot: otherSlot,
                  conflict
                });
              }
            }
          }
        });
      }
    });
  });

  const conflictedStaffCount = Object.values(staffConflictCounts).filter(count => count > 0).length;

  return {
    totalConflicts,
    conflictedStaffCount,
    conflictedCellsCount,
    hasAnyConflicts: totalConflicts > 0,
    conflictMap,
    staffConflictCounts,
    conflictList
  };
};
