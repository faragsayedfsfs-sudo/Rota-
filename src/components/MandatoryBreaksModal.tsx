import React, { useState } from 'react';
import { 
  Coffee, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Clock, 
  User, 
  ShieldCheck,
  Zap,
  Filter,
  Check
} from 'lucide-react';
import { RotaConfig } from '../types';
import { 
  analyzeRotaBreaks, 
  autoScheduleBreakForStaff, 
  autoScheduleAllMissingBreaks 
} from '../utils/breakCompliance';

interface MandatoryBreaksModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
}

export const MandatoryBreaksModal: React.FC<MandatoryBreaksModalProps> = ({
  isOpen,
  onClose,
  rota,
  setRota
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'FLAGGED_ONLY' | 'COMPLIANT_ONLY'>('ALL');
  const [minShiftHours, setMinShiftHours] = useState<number>(6.0);
  const [mandatoryBreakMins, setMandatoryBreakMins] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const report = analyzeRotaBreaks(rota);

  const handleAutoFixSingle = (staffId: string) => {
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === staffId) {
          return autoScheduleBreakForStaff(row, prev);
        }
        return row;
      })
    }));

    setToastMessage(`Scheduled 30m TCA Break for assistant`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAutoFixAll = () => {
    const { updatedRota, fixedCount } = autoScheduleAllMissingBreaks(rota);
    setRota(updatedRota);
    setToastMessage(`Successfully scheduled 30m breaks for ${fixedCount} assistant(s)!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const displayList = rota.rows
    .map(row => ({
      row,
      analysis: report.allAnalyses[row.id]
    }))
    .filter(({ analysis }) => {
      if (filterMode === 'FLAGGED_ONLY') return analysis?.isFlagged;
      if (filterMode === 'COMPLIANT_ONLY') return !analysis?.isFlagged && analysis?.status !== 'NOT_APPLICABLE';
      return true;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-800/95 px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              report.flaggedCount > 0 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Mandatory Breaks Utility
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  report.flaggedCount > 0
                    ? 'bg-amber-950/80 border-amber-600/50 text-amber-300'
                    : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
                }`}>
                  {report.flaggedCount > 0 ? `${report.flaggedCount} Flagged` : '100% Compliant'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically detects and enforces 30-minute breaks within long / 8-hour shift blocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-900/90 border-b border-emerald-700 px-6 py-2 text-xs font-semibold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Overview Stats & Action Bar */}
        <div className="bg-slate-950/70 p-5 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Staff</p>
              <p className="text-base font-bold text-white">{report.totalStaff}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Compliant (&ge; 30m)</p>
              <p className="text-base font-bold text-emerald-400">{report.compliantCount}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              report.flaggedCount > 0 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Flagged (Missing Break)</p>
              <p className={`text-base font-bold ${report.flaggedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {report.flaggedCount}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            {report.flaggedCount > 0 ? (
              <button
                onClick={handleAutoFixAll}
                className="w-full h-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Auto-Assign All ({report.flaggedCount})</span>
              </button>
            ) : (
              <div className="w-full h-full p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span>All Staff Compliant</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filterMode === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Assistants ({rota.rows.length})
              </button>
              <button
                onClick={() => setFilterMode('FLAGGED_ONLY')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filterMode === 'FLAGGED_ONLY' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Flagged Only ({report.flaggedCount})
              </button>
              <button
                onClick={() => setFilterMode('COMPLIANT_ONLY')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filterMode === 'COMPLIANT_ONLY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Compliant Only ({report.compliantCount})
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Rule: <strong className="text-slate-200">&ge; 30m break</strong> for shifts <strong className="text-slate-200">&ge; 6.0h</strong>
          </div>
        </div>

        {/* Staff Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-white text-sm">No assistants in this view</p>
              <p className="text-xs text-slate-500 mt-0.5">Switch filter to see other assistants.</p>
            </div>
          ) : (
            displayList.map(({ row, analysis }, idx) => {
              if (!analysis) return null;
              const isFlagged = analysis.isFlagged;

              return (
                <div
                  key={row.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isFlagged
                      ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-600/80'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="w-6 text-xs text-slate-500 font-mono font-bold">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{row.name}</span>
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Missing Break</span>
                          </span>
                        ) : analysis.totalBreakMinutes >= 30 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Compliant</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                            Short shift / Off
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Working Hours: <strong className="text-slate-200">{analysis.totalWorkingHours.toFixed(1)}h</strong>
                        {' '}&bull;{' '}
                        Shift Span: <strong className="text-slate-200">{analysis.shiftSpanHours.toFixed(1)}h</strong>
                      </p>
                    </div>
                  </div>

                  {/* Middle breakdown */}
                  <div className="flex-1 px-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-300">
                        Scheduled Break:{' '}
                        <strong className={analysis.totalBreakMinutes >= 30 ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                          {analysis.totalBreakMinutes} mins
                        </strong>{' '}
                        {analysis.breakSlots.length > 0 && (
                          <span className="text-slate-400 text-[11px]">
                            ({analysis.breakSlots.join(', ')})
                          </span>
                        )}
                      </span>
                    </div>

                    {isFlagged && (
                      <p className="text-amber-300 font-medium text-[11px] mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{analysis.violationMessage}</span>
                      </p>
                    )}
                  </div>

                  {/* Right Action */}
                  <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isFlagged && (
                      <button
                        onClick={() => handleAutoFixSingle(row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        title={`Schedule 30m break at ${analysis.suggestedSlot || '12:00 - 12:30'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add 30m Break</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-blue-400" />
            <span>
              TCA Break activity is scheduled as <strong>"TCA Break"</strong> across designated intervals.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
