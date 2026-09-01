import { RotaConfig, StaffRow, ShiftActivity } from '../types';
import { ACTIVITIES } from '../constants/activities';

export interface AISlotSuggestion {
  activityId: string;
  activityName: string;
  shortCode: string;
  confidenceScore: number;
  reason: string;
  isBreak?: boolean;
}

export interface SuggestSlotParams {
  slot: string;
  staff: StaffRow;
  rota: RotaConfig;
  allActivities?: ShiftActivity[];
  breakStatus?: {
    totalBreakMinutes: number;
    needsBreak: boolean;
    isMandatoryBreakWindow: boolean;
  };
}

export async function getSlotAISuggestions(params: SuggestSlotParams): Promise<{ source: string; suggestions: AISlotSuggestion[] }> {
  const { slot, staff, rota, allActivities = ACTIVITIES, breakStatus } = params;

  // Extract scheduled duties of this staff today
  const staffScheduledDuties = Object.entries(staff.slots)
    .filter(([_, val]) => Boolean(val) && val !== 'OFF')
    .map(([_, val]) => val);

  // Extract team duties assigned in this specific slot
  const teamDutiesInSlot = rota.rows
    .filter(r => r.id !== staff.id && !r.isUnavailable)
    .map(r => r.slots[slot])
    .filter(Boolean);

  try {
    const res = await fetch('/api/suggest-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        staffSkills: staff.skills || [],
        staffNotes: staff.notes,
        staffScheduledDuties,
        teamDutiesInSlot,
        allActivities: allActivities.map(a => ({
          id: a.id,
          name: a.name,
          shortCode: a.shortCode,
          category: a.category,
          isBreak: a.isBreak,
          isWorking: a.isWorking
        })),
        breakStatus
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        return {
          source: data.source || 'gemini',
          suggestions: data.suggestions
        };
      }
    }
  } catch (err) {
    console.warn('Could not reach backend AI suggest endpoint, utilizing client-side heuristic engine:', err);
  }

  // Client-side fallback if fetch fails
  return {
    source: 'client-heuristic',
    suggestions: getClientHeuristicSuggestions(slot, staff, teamDutiesInSlot, staffScheduledDuties, allActivities, breakStatus)
  };
}

function getClientHeuristicSuggestions(
  slot: string,
  staff: StaffRow,
  teamDutiesInSlot: string[],
  staffScheduledDuties: string[],
  allActivities: ShiftActivity[],
  breakStatus?: { totalBreakMinutes: number; needsBreak: boolean; isMandatoryBreakWindow: boolean }
): AISlotSuggestion[] {
  const isBreakSlot = slot.includes('12:00') || slot.includes('12:30') || slot.includes('12:45') || slot.includes('01:00');
  const needsBreak = breakStatus?.needsBreak || (isBreakSlot && (breakStatus?.totalBreakMinutes || 0) < 30);
  const notesLower = (staff.notes || '').toLowerCase();
  const requiresQuiet = notesLower.includes('quiet') || notesLower.includes('desk') || notesLower.includes('admin');

  const suggestions: AISlotSuggestion[] = [];

  if (needsBreak && isBreakSlot) {
    const breakAct = allActivities.find(a => a.isBreak) || {
      id: 'PRAYER_LUNCH_BREAK',
      name: 'Prayer & Lunch Break',
      shortCode: 'Prayer/Lunch Break'
    };
    suggestions.push({
      activityId: breakAct.id,
      activityName: breakAct.name,
      shortCode: breakAct.shortCode || breakAct.name,
      confidenceScore: 98,
      reason: `Mandatory 30m break window compliance for ${staff.name}.`,
      isBreak: true
    });
  }

  const dutyCounts: Record<string, number> = {};
  staffScheduledDuties.forEach(d => {
    dutyCounts[d] = (dutyCounts[d] || 0) + 1;
  });

  const availableWorking = allActivities
    .filter(a => !a.isBreak)
    .sort((a, b) => {
      const cntA = dutyCounts[a.name] || dutyCounts[a.shortCode] || 0;
      const cntB = dutyCounts[b.name] || dutyCounts[b.shortCode] || 0;
      return cntA - cntB;
    });

  let candidates = availableWorking;
  if (requiresQuiet) {
    candidates = [
      ...availableWorking.filter(a => (a.category || '').includes('Admin') || a.name.includes('Desk')),
      ...availableWorking.filter(a => !(a.category || '').includes('Admin') && !a.name.includes('Desk'))
    ];
  }

  candidates.slice(0, 3).forEach((act, idx) => {
    if (suggestions.some(s => s.activityId === act.id)) return;
    suggestions.push({
      activityId: act.id,
      activityName: act.name,
      shortCode: act.shortCode || act.name,
      confidenceScore: 94 - idx * 6,
      reason: `Balances duty rotation and fills empty floor slot for ${staff.name}${staff.notes ? ` (${staff.notes})` : ''}.`,
      isBreak: false
    });
  });

  return suggestions.slice(0, 3);
}

export async function smartFillRotaWithAI(
  rota: RotaConfig,
  allActivities: ShiftActivity[] = ACTIVITIES
): Promise<{ success: boolean; updatedRows: StaffRow[]; summary: string }> {
  try {
    const res = await fetch('/api/smart-fill-rota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rotaTitle: rota.title,
        timeSlots: rota.timeSlots,
        rows: rota.rows.filter(r => !r.isUnavailable),
        availableActivities: allActivities.map(a => ({
          id: a.id,
          name: a.name,
          shortCode: a.shortCode,
          category: a.category,
          isBreak: a.isBreak
        }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.rows) {
        const mergedRows = rota.rows.map(originalRow => {
          if (originalRow.isUnavailable) return originalRow;
          const returnedRow = data.rows.find((r: any) => r.id === originalRow.id);
          if (returnedRow && returnedRow.slots) {
            return {
              ...originalRow,
              slots: { ...originalRow.slots, ...returnedRow.slots }
            };
          }
          return originalRow;
        });

        return {
          success: true,
          updatedRows: mergedRows,
          summary: data.summary || 'Rota intelligently auto-filled.'
        };
      }
    }
  } catch (err) {
    console.warn('Smart fill API failed, performing deterministic auto-fill:', err);
  }

  // Client-side auto-fill fallback
  const workingActs = allActivities.filter(a => !a.isBreak);
  const breakAct = allActivities.find(a => a.isBreak) || { id: 'PRAYER_LUNCH_BREAK', name: 'Prayer & Lunch Break', shortCode: 'Break' };

  let actCounter = 0;
  const updatedRows = rota.rows.map(row => {
    if (row.isUnavailable) return row;
    const newSlots = { ...row.slots };
    let hasBreak = Object.values(newSlots).some(v => v.toLowerCase().includes('break'));

    rota.timeSlots.forEach(slot => {
      if (!newSlots[slot] || newSlots[slot].trim() === '' || newSlots[slot] === 'OFF') {
        if (!hasBreak && (slot.includes('12:00') || slot.includes('12:30') || slot.includes('01:00'))) {
          newSlots[slot] = breakAct.shortCode || breakAct.name;
          hasBreak = true;
        } else if (workingActs.length > 0) {
          const act = workingActs[actCounter % workingActs.length];
          newSlots[slot] = act.shortCode || act.name;
          actCounter++;
        }
      }
    });

    return { ...row, slots: newSlots };
  });

  return {
    success: true,
    updatedRows,
    summary: 'Auto-filled all remaining empty slots with balanced shift rotation and prayer/lunch break requirements.'
  };
}
