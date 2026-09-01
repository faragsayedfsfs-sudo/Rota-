import React from 'react';
import { 
  Clock, 
  Scale, 
  Coffee, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { StaffWorkloadAnalysis } from '../utils/workDistribution';

interface StaffWorkloadTooltipProps {
  analysis: StaffWorkloadAnalysis;
  skills?: string[];
  notes?: string;
  isFlaggedBreak?: boolean;
  breakViolationMessage?: string;
  hasConflicts?: boolean;
  conflictCount?: number;
  position?: { x: number; y: number } | null;
}

export const StaffWorkloadTooltip: React.FC<StaffWorkloadTooltipProps> = ({
  analysis,
  skills,
  notes,
  isFlaggedBreak = false,
  breakViolationMessage,
  hasConflicts = false,
  conflictCount = 0,
  position
}) => {
  if (!analysis) return null;

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: Math.min(position.x + 14, window.innerWidth - 320),
        top: Math.max(10, Math.min(position.y - 40, window.innerHeight - 360)),
        zIndex: 9999,
        pointerEvents: 'none'
      }
    : {};

  return (
    <div
      style={style}
      className="w-72 bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150 select-none ring-1 ring-white/10"
    >
      {/* Header: Assistant Name & Total Hours */}
      <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Assistant Shift &amp; Hours
          </div>
          <div className="font-bold text-sm text-white flex items-center gap-1.5">
            <span className="truncate max-w-[140px]">{analysis.staffName}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-base font-black text-emerald-400 font-mono">
            {analysis.totalWorkingHours.toFixed(1)}h
          </div>
          <div className="text-[10px] text-slate-400">Total Work</div>
        </div>
      </div>

      {/* Staff Skills Tags */}
      {skills && skills.length > 0 && (
        <div className="mb-2 flex items-center gap-1 flex-wrap">
          {skills.map((skill) => (
            <span
              key={skill}
              className="text-[9.5px] px-1.5 py-0.5 rounded font-bold bg-purple-950/70 border border-purple-800/80 text-purple-300 shadow-2xs"
            >
              {skill}
            </span>
          ))}
          {notes && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded font-medium bg-blue-950/70 border border-blue-800/80 text-blue-300 truncate max-w-[120px]">
              {notes}
            </span>
          )}
        </div>
      )}

      {/* Fairness & Team Work Distribution Benchmark */}
      <div className="mb-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Workload Distribution:</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${analysis.fairnessBadgeClass}`}>
            {analysis.fairnessLabel}
          </span>
        </div>

        {/* Visual Progress Bar comparing against Standard 8h Shift */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px] text-slate-400">
            <span>Progress of 8.0h Shift</span>
            <span className="font-mono">{analysis.workloadPercentageOfStandard}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                analysis.totalWorkingHours > 8.5
                  ? 'bg-rose-500'
                  : analysis.totalWorkingHours >= 7.0
                  ? 'bg-emerald-500'
                  : analysis.totalWorkingHours >= 4.0
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(analysis.workloadPercentageOfStandard, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60">
          <span>Team Average: <strong className="text-slate-300">{analysis.teamAverageHours.toFixed(1)}h</strong></span>
          <span>
            Variance:{' '}
            <strong className={analysis.differenceFromAverage >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {analysis.differenceFromAverage >= 0 ? `+${analysis.differenceFromAverage.toFixed(1)}h` : `${analysis.differenceFromAverage.toFixed(1)}h`}
            </strong>
          </span>
        </div>
      </div>

      {/* Shift Timespan & Break Stats */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <div className="bg-slate-950/50 border border-slate-800 rounded-md p-1.5">
          <div className="text-[9.5px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Shift Window</span>
          </div>
          <div className="font-semibold text-white text-[11px] mt-0.5">
            {analysis.shiftStartSlot && analysis.shiftEndSlot
              ? `${analysis.shiftStartSlot} - ${analysis.shiftEndSlot}`
              : 'No Active Slots'}
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-md p-1.5">
          <div className="text-[9.5px] text-slate-400 flex items-center gap-1">
            <Coffee className="w-3 h-3 text-amber-400" />
            <span>Rest Break</span>
          </div>
          <div className="font-semibold text-white text-[11px] mt-0.5 flex items-center gap-1">
            <span>{analysis.totalBreakMinutes} mins</span>
            {analysis.totalBreakMinutes >= 30 ? (
              <span className="text-[9px] text-emerald-400 font-normal">(OK)</span>
            ) : analysis.totalWorkingHours >= 8.0 ? (
              <span className="text-[9px] text-amber-400 font-bold">(&lt;30m)</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Duty Hours Breakdown */}
      {analysis.dutyBreakdown.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Scheduled Activities Breakdown</span>
            <span>{analysis.activeSlotCount} slots</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {analysis.dutyBreakdown.map((duty, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-800/60"
              >
                <span className={`truncate max-w-[170px] ${duty.isBreak ? 'text-amber-300' : 'text-slate-300'}`}>
                  {duty.dutyName}
                </span>
                <span className="font-mono text-slate-200 font-bold shrink-0 ml-1">
                  {duty.hours.toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance / Conflict Status footer */}
      <div className="pt-2 border-t border-slate-800 text-[10px]">
        {hasConflicts ? (
          <div className="flex items-center gap-1.5 text-rose-300 font-medium">
            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 animate-pulse" />
            <span>{conflictCount} overlapping duty clash(es) detected</span>
          </div>
        ) : isFlaggedBreak ? (
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Missing 30m break for shift block</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Schedule verified &amp; fair distribution</span>
          </div>
        )}
      </div>
    </div>
  );
};
