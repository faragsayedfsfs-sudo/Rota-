import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  User, 
  Award, 
  Tag, 
  Plus, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Heart,
  Globe,
  Star,
  Flame,
  BookOpen,
  Footprints,
  Layers,
  CalendarOff
} from 'lucide-react';
import { StaffRow } from '../types';

interface StaffMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffRow: StaffRow | null;
  onSaveStaff: (updatedRow: StaffRow) => void;
}

export const PRESET_SKILLS = [
  { name: 'Senior', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Star },
  { name: 'First Aid', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: Heart },
  { name: 'Bilingual', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Globe },
  { name: 'Team Lead', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Award },
  { name: 'Fire Warden', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: Flame },
  { name: 'Classroom', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: BookOpen },
  { name: 'Hallways', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Footprints },
  { name: 'Reception', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: Layers }
];

export const getSkillBadgeStyle = (skill: string) => {
  const lower = skill.toLowerCase();
  if (lower.includes('senior')) return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  if (lower.includes('first aid') || lower.includes('medic')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (lower.includes('bilingual') || lower.includes('arabic') || lower.includes('french') || lower.includes('spanish')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  if (lower.includes('lead') || lower.includes('manager') || lower.includes('supervisor')) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (lower.includes('fire') || lower.includes('safety')) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  if (lower.includes('class') || lower.includes('teach')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
};

export const StaffMetadataModal: React.FC<StaffMetadataModalProps> = ({
  isOpen,
  onClose,
  staffRow,
  onSaveStaff
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('TCA Staff');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [notes, setNotes] = useState('');
  const [targetHours, setTargetHours] = useState(7.5);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState('Day Off');

  useEffect(() => {
    if (staffRow) {
      setName(staffRow.name || '');
      setRole(staffRow.role || 'TCA Staff');
      setSkills(Array.isArray(staffRow.skills) ? [...staffRow.skills] : []);
      setNotes(staffRow.notes || '');
      setTargetHours(staffRow.targetHours || 7.5);
      setIsUnavailable(Boolean(staffRow.isUnavailable));
      setUnavailableReason(staffRow.unavailableReason || 'Day Off');
    }
  }, [staffRow, isOpen]);

  if (!isOpen || !staffRow) return null;

  const handleAddSkill = (skillToAdd?: string) => {
    const rawSkill = (skillToAdd !== undefined ? skillToAdd : newSkillInput).trim();
    if (!rawSkill) return;

    // Handle comma-separated skills
    const splitSkills = rawSkill.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...skills];

    splitSkills.forEach(s => {
      if (!updated.some(existing => existing.toLowerCase() === s.toLowerCase())) {
        updated.push(s);
      }
    });

    setSkills(updated);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleTogglePreset = (presetName: string) => {
    if (skills.some(s => s.toLowerCase() === presetName.toLowerCase())) {
      setSkills(skills.filter(s => s.toLowerCase() !== presetName.toLowerCase()));
    } else {
      setSkills([...skills, presetName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveStaff({
      ...staffRow,
      name: name.trim(),
      role: role.trim() || 'TCA Staff',
      skills,
      notes: notes.trim() || undefined,
      targetHours: Number(targetHours) || 7.5,
      isUnavailable,
      unavailableReason: isUnavailable ? unavailableReason : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Staff Profile &amp; Skills Editor</h2>
              <p className="text-xs text-slate-400">
                Manage roles, specialized skill tags, notes, and availability
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assistant Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Assistant 01 / Sarah Jenkins"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. TCA Staff, Senior Assistant"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Skills Tagging Section */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Specialized Skills &amp; Qualifications:</span>
              </label>
              <span className="text-[11px] text-slate-400">{skills.length} tagged</span>
            </div>

            {/* Input to add skills */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type skill tag (e.g. 'Senior', 'First Aid', 'Bilingual') and press Enter..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Current Skills Tags Display */}
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 shadow-xs ${getSkillBadgeStyle(skill)}`}
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                      title="Remove skill tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-1">
                No skill tags assigned yet. Select from quick suggestions below or type a custom tag above.
              </div>
            )}

            {/* Quick Preset Skill Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Preset Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SKILLS.map((preset) => {
                  const isSelected = skills.some(s => s.toLowerCase() === preset.name.toLowerCase());
                  const Icon = preset.icon;
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleTogglePreset(preset.name)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? `${preset.color} ring-1 ring-white/30 font-bold shadow-xs`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{preset.name}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 ml-0.5" />
                      ) : (
                        <Plus className="w-3 h-3 ml-0.5 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes / Custom Preferences */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Staff Notes &amp; Work Preferences</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires quiet environment, Part-time shift, Prefers Floor 1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Target Hours & Availability Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Shift Hours</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="12"
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <CalendarOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Availability Status</span>
              </label>
              <select
                value={isUnavailable ? unavailableReason : 'active'}
                onChange={(e) => {
                  if (e.target.value === 'active') {
                    setIsUnavailable(false);
                  } else {
                    setIsUnavailable(true);
                    setUnavailableReason(e.target.value);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="active">Active (On Duty)</option>
                <option value="Day Off">Day Off</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Staff Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
