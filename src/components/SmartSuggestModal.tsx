import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Bot, 
  RotateCw, 
  ThumbsUp, 
  User, 
  Clock, 
  Coffee, 
  AlertCircle, 
  Zap,
  Tag,
  Wand2
} from 'lucide-react';
import { RotaConfig, StaffRow, ShiftActivity } from '../types';
import { AISlotSuggestion, getSlotAISuggestions, smartFillRotaWithAI } from '../services/aiSuggestService';
import { ACTIVITIES } from '../constants/activities';

interface SmartSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
  onApplySlotSuggestion: (staffId: string, slot: string, activityCode: string) => void;
  onApplySmartFill: (updatedRows: StaffRow[], summary: string) => void;
  targetSlot?: {
    staffId: string;
    staffName: string;
    slot: string;
  } | null;
  activities?: ShiftActivity[];
}

export const SmartSuggestModal: React.FC<SmartSuggestModalProps> = ({
  isOpen,
  onClose,
  rota,
  onApplySlotSuggestion,
  onApplySmartFill,
  targetSlot,
  activities = ACTIVITIES
}) => {
  const [activeMode, setActiveMode] = useState<'single_slot' | 'smart_fill'>(
    targetSlot ? 'single_slot' : 'smart_fill'
  );

  // Single Slot Suggestions State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(targetSlot?.staffId || rota.rows[0]?.id || '');
  const [selectedSlot, setSelectedSlot] = useState<string>(targetSlot?.slot || rota.timeSlots[0] || '');
  const [suggestions, setSuggestions] = useState<AISlotSuggestion[]>([]);
  const [suggestionSource, setSuggestionSource] = useState<string>('gemini');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Full Rota Smart Fill State
  const [isFilling, setIsFilling] = useState(false);
  const [fillSummary, setFillSummary] = useState<string | null>(null);

  // Sync if targetSlot changes
  useEffect(() => {
    if (targetSlot) {
      setSelectedStaffId(targetSlot.staffId);
      setSelectedSlot(targetSlot.slot);
      setActiveMode('single_slot');
    }
  }, [targetSlot]);

  const currentStaff = rota.rows.find(r => r.id === selectedStaffId) || rota.rows[0];

  // Fetch slot suggestions when staff/slot changes
  useEffect(() => {
    if (!isOpen || activeMode !== 'single_slot' || !currentStaff || !selectedSlot) return;

    let isMounted = true;
    setIsLoadingSuggestions(true);

    getSlotAISuggestions({
      slot: selectedSlot,
      staff: currentStaff,
      rota,
      allActivities: activities
    }).then(res => {
      if (isMounted) {
        setSuggestions(res.suggestions);
        setSuggestionSource(res.source);
        setIsLoadingSuggestions(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingSuggestions(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeMode, selectedStaffId, selectedSlot, rota, activities]);

  if (!isOpen) return null;

  const handleApply = (sug: AISlotSuggestion) => {
    onApplySlotSuggestion(selectedStaffId, selectedSlot, sug.shortCode || sug.activityName);
    onClose();
  };

  const handleRunSmartFill = async () => {
    setIsFilling(true);
    setFillSummary(null);
    try {
      const result = await smartFillRotaWithAI(rota, activities);
      if (result.success) {
        setFillSummary(result.summary);
        onApplySmartFill(result.updatedRows, result.summary);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Smart Suggest</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  Gemini 3.7
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Workload-aware duty recommendations &amp; empty slot optimization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveMode('single_slot')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'single_slot'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Single Slot Recommendations</span>
          </button>
          <button
            onClick={() => setActiveMode('smart_fill')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'smart_fill'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Smart Auto-Fill Schedule</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar-thin">
          {activeMode === 'single_slot' ? (
            <div className="space-y-4">
              {/* Context Selector: Assistant & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-400" />
                    <span>Staff Member:</span>
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {rota.rows.map(r => (
                      <option key={r.id} value={r.id} disabled={r.isUnavailable}>
                        {r.name} {r.isUnavailable ? '(Off Duty)' : ''} {r.notes ? `[${r.notes}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>Time Slot:</span>
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {rota.timeSlots.map(s => (
                      <option key={s} value={s}>
                        {s} {currentStaff?.slots[s] ? `(${currentStaff.slots[s]})` : '(Empty)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Metadata Pill / Custom Notes */}
              {currentStaff?.notes && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs text-blue-300">
                  <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-medium">Staff Note:</span>
                  <span className="italic text-slate-300">{currentStaff.notes}</span>
                </div>
              )}

              {/* Suggestions List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span>Recommended Duties:</span>
                  </span>
                  {isLoadingSuggestions && (
                    <span className="text-[11px] text-purple-400 flex items-center gap-1 font-semibold animate-pulse">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      Analyzing workload patterns...
                    </span>
                  )}
                </div>

                {isLoadingSuggestions ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="h-16 bg-slate-950/60 rounded-xl border border-slate-800 animate-pulse" />
                    ))}
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((sug, idx) => (
                    <div
                      key={sug.activityId + idx}
                      className="p-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-blue-500/60 rounded-xl transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex flex-col items-center justify-center shrink-0 w-10">
                          <span className="text-xs font-black text-blue-400">
                            {sug.confidenceScore}%
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Match</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{sug.activityName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-blue-300 border border-slate-700">
                              {sug.shortCode}
                            </span>
                            {sug.isBreak && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                <Coffee className="w-2.5 h-2.5" />
                                Rest Break
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-snug">{sug.reason}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApply(sug)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    No immediate suggestions for this slot. Select another slot or assistant.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Smart Auto-Fill Mode */
            <div className="space-y-4 text-center py-2">
              <div className="max-w-md mx-auto space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-1">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Automated Schedule Optimization</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI will analyze team coverage across all 23 time slots, respect staff custom notes &amp; preferences, enforce mandatory 30-minute prayer/lunch breaks between 12:00–13:30, and balance hallway &amp; desk duty fatigue.
                </p>
              </div>

              {fillSummary && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 text-left flex items-start gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Optimization Applied:</span>
                    <span>{fillSummary}</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleRunSmartFill}
                  disabled={isFilling}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer transition-all hover:scale-102"
                >
                  {isFilling ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing Rota Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Fill All Empty Slots</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
