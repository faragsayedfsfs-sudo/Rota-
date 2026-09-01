import { RotaConfig, StaffRow } from '../types';
import { TIME_SLOTS, findActivity } from '../constants/activities';
import { calculateStaffHours, getSlotDurationHours } from '../services/googleSheetsService';
import { isBreakDuty, isActiveWorkingDuty } from './breakCompliance';

export interface DutyHourBreakdown {
  dutyName: string;
  hours: number;
  slotCount: number;
  percentage: number;
  isBreak: boolean;
}

export interface StaffWorkloadAnalysis {
  staffId: string;
  staffName: string;
  totalWorkingHours: number;
  totalBreakMinutes: number;
  activeSlotCount: number;
  emptySlotCount: number;
  shiftStartSlot: string | null;
  shiftEndSlot: string | null;
  shiftSpanHours: number;
  dutyBreakdown: DutyHourBreakdown[];
  
  // Work distribution metrics compared to team
  teamAverageHours: number;
  differenceFromAverage: number;
  fairnessStatus: 'balanced' | 'above_average' | 'below_average' | 'unassigned' | 'overloaded';
  fairnessLabel: string;
  fairnessColor: string;
  fairnessBadgeClass: string;
  workloadPercentageOfStandard: number; // vs 8.0h standard shift
}

export interface TeamWorkloadReport {
  totalStaffCount: number;
  activeStaffCount: number;
  totalTeamHours: number;
  teamAverageHours: number;
  minHours: number;
  maxHours: number;
  staffAnalyses: Record<string, StaffWorkloadAnalysis>;
}

export const analyzeTeamWorkload = (rota: RotaConfig): TeamWorkloadReport => {
  const staffAnalyses: Record<string, StaffWorkloadAnalysis> = {};
  
  const staffHoursList: { id: string; name: string; hours: number }[] = [];
  let totalTeamHours = 0;

  // First pass: compute hours and duties for each staff member
  rota.rows.forEach(row => {
    const totalWorkingHours = calculateStaffHours(row.slots, row.isUnavailable);
    staffHoursList.push({ id: row.id, name: row.name, hours: totalWorkingHours });
    totalTeamHours += totalWorkingHours;
  });

  const activeStaff = staffHoursList.filter(s => s.hours > 0);
  const activeStaffCount = activeStaff.length;
  const teamAverageHours = activeStaffCount > 0 ? totalTeamHours / activeStaffCount : 0;
  const minHours = activeStaff.length > 0 ? Math.min(...activeStaff.map(s => s.hours)) : 0;
  const maxHours = activeStaff.length > 0 ? Math.max(...activeStaff.map(s => s.hours)) : 0;

  // Second pass: compute detailed breakdown and fairness comparison
  rota.rows.forEach(row => {
    const totalWorkingHours = calculateStaffHours(row.slots, row.isUnavailable);
    const dutyMap: Record<string, { hours: number; count: number; isBreak: boolean }> = {};
    let totalBreakMinutes = 0;
    let activeSlotCount = 0;
    let emptySlotCount = 0;
    let firstActiveSlotIdx = -1;
    let lastActiveSlotIdx = -1;

    if (!row.isUnavailable) {
      TIME_SLOTS.forEach((slot, idx) => {
        const val = (row.slots[slot] || '').trim();
        const slotDuration = getSlotDurationHours(slot);

        if (!val || val === 'OFF') {
          emptySlotCount++;
        } else {
          if (firstActiveSlotIdx === -1) firstActiveSlotIdx = idx;
          lastActiveSlotIdx = idx;
          activeSlotCount++;

          const isBreak = isBreakDuty(val);
          if (isBreak) {
            totalBreakMinutes += Math.round(slotDuration * 60);
          }

          const dutyName = val;
          if (!dutyMap[dutyName]) {
            dutyMap[dutyName] = { hours: 0, count: 0, isBreak };
          }
          dutyMap[dutyName].hours += slotDuration;
          dutyMap[dutyName].count += 1;
        }
      });
    } else {
      emptySlotCount = TIME_SLOTS.length;
    }

    const shiftStartSlot = firstActiveSlotIdx !== -1 ? TIME_SLOTS[firstActiveSlotIdx].split('-')[0].trim() : null;
    const shiftEndSlot = lastActiveSlotIdx !== -1 ? TIME_SLOTS[lastActiveSlotIdx].split('-')[1]?.trim() || TIME_SLOTS[lastActiveSlotIdx] : null;
    
    let shiftSpanHours = 0;
    if (firstActiveSlotIdx !== -1 && lastActiveSlotIdx !== -1) {
      // Calculate total span in hours from first to last slot
      for (let i = firstActiveSlotIdx; i <= lastActiveSlotIdx; i++) {
        shiftSpanHours += getSlotDurationHours(TIME_SLOTS[i]);
      }
    }

    const dutyBreakdown: DutyHourBreakdown[] = Object.entries(dutyMap)
      .map(([dutyName, data]) => ({
        dutyName,
        hours: data.hours,
        slotCount: data.count,
        percentage: totalWorkingHours > 0 ? (data.hours / (totalWorkingHours + (totalBreakMinutes / 60))) * 100 : 0,
        isBreak: data.isBreak
      }))
      .sort((a, b) => b.hours - a.hours);

    const diff = totalWorkingHours - teamAverageHours;
    let fairnessStatus: StaffWorkloadAnalysis['fairnessStatus'] = 'balanced';
    let fairnessLabel = 'Balanced Workload';
    let fairnessColor = '#10b981'; // emerald
    let fairnessBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';

    if (row.isUnavailable) {
      fairnessStatus = 'unassigned';
      fairnessLabel = row.unavailableReason ? `Off Duty (${row.unavailableReason})` : 'Day Off / Unavailable';
      fairnessColor = '#64748b'; // slate
      fairnessBadgeClass = 'bg-slate-800/80 text-slate-400 border-slate-700';
    } else if (totalWorkingHours === 0) {
      fairnessStatus = 'unassigned';
      fairnessLabel = 'No Duties Assigned (Off)';
      fairnessColor = '#64748b'; // slate
      fairnessBadgeClass = 'bg-slate-800/80 text-slate-400 border-slate-700';
    } else if (totalWorkingHours > 8.5) {
      fairnessStatus = 'overloaded';
      fairnessLabel = `Heavy Shift (${totalWorkingHours.toFixed(1)}h · +${diff.toFixed(1)}h vs avg)`;
      fairnessColor = '#f43f5e'; // rose
      fairnessBadgeClass = 'bg-rose-950/80 text-rose-300 border-rose-700/60';
    } else if (diff > 0.75) {
      fairnessStatus = 'above_average';
      fairnessLabel = `Above Team Avg (+${diff.toFixed(1)}h)`;
      fairnessColor = '#38bdf8'; // sky
      fairnessBadgeClass = 'bg-sky-950/80 text-sky-300 border-sky-700/60';
    } else if (diff < -0.75) {
      fairnessStatus = 'below_average';
      fairnessLabel = `Part/Light Shift (${diff.toFixed(1)}h vs avg)`;
      fairnessColor = '#fbbf24'; // amber
      fairnessBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
    } else {
      fairnessStatus = 'balanced';
      fairnessLabel = `Fair & Balanced (${diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}h vs avg)`;
      fairnessColor = '#34d399'; // emerald
      fairnessBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    }

    const workloadPercentageOfStandard = Math.min(Math.round((totalWorkingHours / 8.0) * 100), 125);

    staffAnalyses[row.id] = {
      staffId: row.id,
      staffName: row.name,
      totalWorkingHours,
      totalBreakMinutes,
      activeSlotCount,
      emptySlotCount,
      shiftStartSlot,
      shiftEndSlot,
      shiftSpanHours,
      dutyBreakdown,
      teamAverageHours,
      differenceFromAverage: diff,
      fairnessStatus,
      fairnessLabel,
      fairnessColor,
      fairnessBadgeClass,
      workloadPercentageOfStandard
    };
  });

  return {
    totalStaffCount: rota.rows.length,
    activeStaffCount,
    totalTeamHours,
    teamAverageHours,
    minHours,
    maxHours,
    staffAnalyses
  };
};
