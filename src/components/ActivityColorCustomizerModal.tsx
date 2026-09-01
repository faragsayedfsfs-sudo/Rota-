import React, { useState } from 'react';
import { X, Palette, RotateCcw, Check, Sparkles } from 'lucide-react';
import { ShiftActivity } from '../types';
import { ACTIVITIES } from '../constants/activities';

interface ActivityColorCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ShiftActivity[];
  onSaveActivities: (updatedActivities: ShiftActivity[]) => void;
  onResetToDefault: () => void;
}

const PRESET_PALETTES = [
  {
    name: 'Blue / Indigo',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/50',
    color: '#3b82f6'
  },
  {
    name: 'Emerald / Green',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    color: '#10b981'
  },
  {
    name: 'Purple / Violet',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/50',
    color: '#8b5cf6'
  },
  {
    name: 'Amber / Yellow',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/50',
    color: '#f59e0b'
  },
  {
    name: 'Rose / Crimson',
    bgColor: 'bg-rose-500/20',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/50',
    color: '#f43f5e'
  },
  {
    name: 'Cyan / Teal',
    bgColor: 'bg-cyan-500/20',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/50',
    color: '#06b6d4'
  },
  {
    name: 'Orange / Coral',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/50',
    color: '#f97316'
  },
  {
    name: 'Fuchsia / Magenta',
    bgColor: 'bg-fuchsia-500/20',
    textColor: 'text-fuchsia-300',
    borderColor: 'border-fuchsia-500/50',
    color: '#d946ef'
  }
];

export const ActivityColorCustomizerModal: React.FC<ActivityColorCustomizerModalProps> = ({
  isOpen,
  onClose,
  activities,
  onSaveActivities,
  onResetToDefault
}) => {
  const [editedActivities, setEditedActivities] = useState<ShiftActivity[]>(activities);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const currentActivity = editedActivities.find(a => a.id === selectedActivityId) || editedActivities[0];

  const handleApplyPreset = (preset: typeof PRESET_PALETTES[0]) => {
    if (!currentActivity) return;
    const updated = editedActivities.map(act => {
      if (act.id === currentActivity.id) {
        return {
          ...act,
          color: preset.color,
          bgColor: preset.bgColor,
          textColor: preset.textColor,
          borderColor: preset.borderColor
        };
      }
      return act;
    });
    setEditedActivities(updated);
  };

  const handleSave = () => {
    onSaveActivities(editedActivities);
    onClose();
  };

  const filteredList = editedActivities.filter(a =>
    a.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (a.shortCode || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (a.category || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Activity Color &amp; Palette Customizer</h2>
              <p className="text-xs text-slate-400">
                Personalize the background, text, and border styling for every shift duty
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

        {/* Body Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Activity List */}
          <div className="md:col-span-5 p-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Select Activity to Edit:</span>
              <span className="text-[11px] text-slate-500">{filteredList.length} duties</span>
            </div>

            <input
              type="text"
              placeholder="Search activities..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin max-h-[360px]">
              {filteredList.map((act) => {
                const isSelected = act.id === currentActivity?.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => setSelectedActivityId(act.id)}
                    className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border truncate ${act.bgColor} ${act.borderColor} ${act.textColor}`}
                      >
                        {act.shortCode || act.name}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{act.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{act.category || 'General'}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Customization Editor */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between overflow-y-auto max-h-[500px]">
            {currentActivity ? (
              <div className="space-y-5">
                {/* Live Preview Card */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Live Grid Preview:
                  </span>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-4 py-2.5 rounded-lg border text-sm font-bold shadow-md transition-all ${currentActivity.bgColor} ${currentActivity.borderColor} ${currentActivity.textColor}`}
                    >
                      {currentActivity.name} ({currentActivity.shortCode || currentActivity.name})
                    </div>
                    <span className="text-xs text-slate-400">
                      Category: <span className="text-slate-200 font-semibold">{currentActivity.category || 'Duty'}</span>
                    </span>
                  </div>
                </div>

                {/* Color Palette Presets */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    Quick Preset Themes:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_PALETTES.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${preset.bgColor} ${preset.borderColor} ${preset.textColor} hover:scale-102 hover:shadow-md`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[11px]">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct HEX / Custom color adjustment */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Custom Color Accent:
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentActivity.color || '#3b82f6'}
                      onChange={(e) => {
                        const newHex = e.target.value;
                        const updated = editedActivities.map(act => {
                          if (act.id === currentActivity.id) {
                            return { ...act, color: newHex };
                          }
                          return act;
                        });
                        setEditedActivities(updated);
                      }}
                      className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-slate-300 font-mono">{currentActivity.color}</p>
                      <p className="text-[11px] text-slate-500">Pick any custom HEX color accent</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                Select an activity from the left list to customize its styling
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 mt-4">
              <button
                onClick={() => {
                  onResetToDefault();
                  setEditedActivities(ACTIVITIES);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Restore default original color themes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Color Customization</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
