import { StaffRow, RotaConfig } from '../types';
import { TIME_SLOTS, findActivity } from '../constants/activities';
import { getSlotDurationHours } from '../services/googleSheetsService';

export interface StaffBreakAnalysis {
  staffId: string;
  staffName: string;
  totalWorkingHours: number;
  totalBreakMinutes: number;
  shiftSpanHours: number;
  isLongShift: boolean; // Shift span or working hours >= 6.0h (e.g. 8-hour shift blocks)
  hasMandatoryBreak: boolean; // Has >= 30m break
  longestContinuousWorkHours: number;
  isFlagged: boolean;
  status: 'COMPLIANT' | 'FLAGGED_NO_BREAK' | 'FLAGGED_SHORT_BREAK' | 'FLAGGED_EXCESSIVE_STRETCH' | 'NOT_APPLICABLE';
  violationMessage?: string;
  breakSlots: string[];
  suggestedSlot?: string;
}

export interface RotaBreakReport {
  totalStaff: number;
  compliantCount: number;
  flaggedCount: number;
  notApplicableCount: number;
  compliancePercentage: number;
  flaggedStaff: StaffBreakAnalysis[];
  allAnalyses: Record<string, StaffBreakAnalysis>;
}

// Check if a slot value represents a break
export const isBreakDuty = (value: string): boolean => {
  if (!value) return false;
  const valLower = value.trim().toLowerCase();
  if (valLower === 'tca break' || valLower.includes('break') || valLower.includes('lunch') || valLower.includes('rest')) {
    return true;
  }
  const act = findActivity(value);
  return act ? act.isBreak : false;
};

// Check if a slot value represents active duty
export const isActiveWorkingDuty = (value: string): boolean => {
  if (!value || value === 'OFF') return false;
  return !isBreakDuty(value);
};

// Get duration of slot in minutes
export const getSlotDurationMinutes = (slot: string): number => {
  return Math.round(getSlotDurationHours(slot) * 60);
};

/**
 * Analyzes break compliance for an individual assistant
 */
export const analyzeStaffBreak = (
  row: StaffRow,
  allSlots: string[] = TIME_SLOTS,
  mandatoryBreakMinutes: number = 30,
  minShiftHoursForBreak: number = 6.0
): StaffBreakAnalysis => {
  if (row.isUnavailable) {
    return {
      staffId: row.id,
      staffName: row.name,
      totalWorkingHours: 0,
      totalBreakMinutes: 0,
      shiftSpanHours: 0,
      isLongShift: false,
      hasMandatoryBreak: true,
      longestContinuousWorkHours: 0,
      isFlagged: false,
      status: 'NOT_APPLICABLE',
      violationMessage: `${row.name} is on ${row.unavailableReason || 'Day Off / Unavailable'}`,
      breakSlots: []
    };
  }

  let totalWorkingHours = 0;
  let totalBreakMinutes = 0;
  const breakSlots: string[] = [];
  let firstActiveIdx = -1;
  let lastActiveIdx = -1;

  let currentContinuousHours = 0;
  let maxContinuousHours = 0;

  allSlots.forEach((slot, idx) => {
    const val = row.slots[slot] || '';
    const durationHours = getSlotDurationHours(slot);
    const durationMinutes = Math.round(durationHours * 60);

    if (val && val !== 'OFF') {
      if (firstActiveIdx === -1) firstActiveIdx = idx;
      lastActiveIdx = idx;
    }

    if (isBreakDuty(val)) {
      totalBreakMinutes += durationMinutes;
      breakSlots.push(slot);
      currentContinuousHours = 0; // Break resets continuous working stretch
    } else if (isActiveWorkingDuty(val)) {
      totalWorkingHours += durationHours;
      currentContinuousHours += durationHours;
      if (currentContinuousHours > maxContinuousHours) {
        maxContinuousHours = currentContinuousHours;
      }
    } else {
      // Off or unassigned empty slot within shift
      currentContinuousHours = 0;
    }
  });

  // Shift span in hours from first duty to last duty
  let shiftSpanHours = 0;
  if (firstActiveIdx !== -1 && lastActiveIdx !== -1) {
    for (let i = firstActiveIdx; i <= lastActiveIdx; i++) {
      shiftSpanHours += getSlotDurationHours(allSlots[i]);
    }
  }

  const isLongShift = shiftSpanHours >= minShiftHoursForBreak || totalWorkingHours >= minShiftHoursForBreak;
  const hasMandatoryBreak = totalBreakMinutes >= mandatoryBreakMinutes;

  let status: StaffBreakAnalysis['status'] = 'COMPLIANT';
  let isFlagged = false;
  let violationMessage: string | undefined;

  if (!isLongShift) {
    status = totalWorkingHours === 0 ? 'NOT_APPLICABLE' : 'COMPLIANT';
  } else if (totalBreakMinutes === 0) {
    status = 'FLAGGED_NO_BREAK';
    isFlagged = true;
    violationMessage = `No break scheduled within ${totalWorkingHours.toFixed(1)}h shift (30m mandatory)`;
  } else if (totalBreakMinutes < mandatoryBreakMinutes) {
    status = 'FLAGGED_SHORT_BREAK';
    isFlagged = true;
    violationMessage = `Only ${totalBreakMinutes}m break scheduled (needs ${mandatoryBreakMinutes - totalBreakMinutes}m more to meet 30m rule)`;
  } else if (maxContinuousHours > 5.0) {
    status = 'FLAGGED_EXCESSIVE_STRETCH';
    isFlagged = true;
    violationMessage = `${maxContinuousHours.toFixed(1)}h continuous work without a break (exceeds 5h limit)`;
  }

  // Find suggested 30m slot for quick-fix (prefer around 12:00 - 14:30)
  let suggestedSlot: string | undefined;
  if (isFlagged) {
    const preferredSlots = [
      '12:00 - 12:30',
      '01:00 - 01:30',
      '01:30 - 02:00',
      '02:00 - 02:30',
      '11:00 - 11:30',
      '02:30 - 03:00'
    ];

    // Pick first candidate in shift span that is not already a break
    for (const pref of preferredSlots) {
      if (allSlots.includes(pref)) {
        const val = row.slots[pref] || '';
        if (!isBreakDuty(val)) {
          suggestedSlot = pref;
          break;
        }
      }
    }
  }

  return {
    staffId: row.id,
    staffName: row.name,
    totalWorkingHours,
    totalBreakMinutes,
    shiftSpanHours,
    isLongShift,
    hasMandatoryBreak,
    longestContinuousWorkHours: maxContinuousHours,
    isFlagged,
    status,
    violationMessage,
    breakSlots,
    suggestedSlot
  };
};

/**
 * Analyzes full rota for break compliance
 */
export const analyzeRotaBreaks = (rota: RotaConfig): RotaBreakReport => {
  const allAnalyses: Record<string, StaffBreakAnalysis> = {};
  const flaggedStaff: StaffBreakAnalysis[] = [];
  let compliantCount = 0;
  let notApplicableCount = 0;

  rota.rows.forEach(row => {
    const analysis = analyzeStaffBreak(row, rota.timeSlots);
    allAnalyses[row.id] = analysis;

    if (analysis.isFlagged) {
      flaggedStaff.push(analysis);
    } else if (analysis.status === 'NOT_APPLICABLE') {
      notApplicableCount++;
    } else {
      compliantCount++;
    }
  });

  const totalEvaluated = rota.rows.length - notApplicableCount;
  const compliancePercentage = totalEvaluated > 0
    ? Math.round((compliantCount / totalEvaluated) * 100)
    : 100;

  return {
    totalStaff: rota.rows.length,
    compliantCount,
    flaggedCount: flaggedStaff.length,
    notApplicableCount,
    compliancePercentage,
    flaggedStaff,
    allAnalyses
  };
};

/**
 * Auto-schedules a 30m break for a single assistant
 */
export const autoScheduleBreakForStaff = (row: StaffRow, rota: RotaConfig): StaffRow => {
  const analysis = analyzeStaffBreak(row, rota.timeSlots);
  const targetSlot = analysis.suggestedSlot || '12:00 - 12:30';

  return {
    ...row,
    slots: {
      ...row.slots,
      [targetSlot]: 'TCA Break'
    }
  };
};

/**
 * Auto-schedules 30m breaks for all flagged assistants in the rota
 */
export const autoScheduleAllMissingBreaks = (
  rota: RotaConfig
): { updatedRota: RotaConfig; fixedCount: number } => {
  let fixedCount = 0;

  // Stagger break assignments to maintain coverage across 12:00-14:30
  const staggerPool = [
    '12:00 - 12:30',
    '01:00 - 01:30',
    '01:30 - 02:00',
    '02:00 - 02:30',
    '11:00 - 11:30',
    '02:30 - 03:00'
  ];

  const updatedRows = rota.rows.map((row, idx) => {
    const analysis = analyzeStaffBreak(row, rota.timeSlots);
    if (!analysis.isFlagged) return row;

    fixedCount++;
    const chosenSlot = staggerPool[idx % staggerPool.length];

    return {
      ...row,
      slots: {
        ...row.slots,
        [chosenSlot]: 'TCA Break'
      }
    };
  });

  return {
    updatedRota: {
      ...rota,
      rows: updatedRows
    },
    fixedCount
  };
};
