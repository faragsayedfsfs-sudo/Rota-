import React from 'react';
import { 
  Sparkles, 
  X, 
  Users, 
  RotateCcw,
  CheckCircle2,
  BookmarkCheck,
  ArrowRight
} from 'lucide-react';
import { RotaConfig } from '../types';
import { createDefaultRota } from '../constants/defaultRota';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
  onOpenTemplatesModal?: () => void;
}

export const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({
  isOpen,
  onClose,
  rota,
  setRota,
  onOpenTemplatesModal
}) => {
  if (!isOpen) return null;

  const handleApplyDefaultTemplate = () => {
    const defaultData = createDefaultRota();
    setRota(prev => ({
      ...prev,
      rows: defaultData.rows
    }));
    onClose();
  };

  const handleClearAllShifts = () => {
    if (window.confirm('Clear all duty assignments across all staff?')) {
      setRota(prev => ({
        ...prev,
        rows: prev.rows.map(r => ({
          ...r,
          slots: {}
        }))
      }));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Assistant Rota Schedule Tools
              </h2>
              <p className="text-xs text-slate-400">
                Manage duties across First Slot, Prayer Break, Second &amp; Third Slot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Current Assistants on Roster:</span>
            </span>
            <span className="font-bold text-sm text-white font-mono">
              {rota.rows.length} Assistants
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Open Templates Library */}
            {onOpenTemplatesModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTemplatesModal();
                }}
                className="w-full p-4 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300">
                        Browse Shift Templates &amp; Patterns
                      </h3>
                      <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Load preset shift configurations: Early Shift, Late Shift, Weekend Peak, Skeleton Crew, or custom saved rosters.
                    </p>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleApplyDefaultTemplate}
              className="w-full p-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300">
                    Apply Standard 12-Assistant Roster
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Preloads the balanced baseline roster with Classroom Starters, Line up, Floating, Corridors, and Prayer Breaks.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleClearAllShifts}
              className="w-full p-4 rounded-xl bg-slate-950/60 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-700/50 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-rose-400 shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-rose-300">
                    Clear All Slot Assignments
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Resets all cells to empty while keeping all assistant names intact.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
