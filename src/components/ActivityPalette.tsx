import React, { useState } from 'react';
import { 
  Footprints,
  Shuffle,
  DoorOpen,
  Users,
  CreditCard,
  PhoneCall,
  Coffee,
  Eraser,
  BookOpen,
  Info,
  ChevronDown,
  Palette
} from 'lucide-react';
import { ShiftActivity } from '../types';
import { ACTIVITIES } from '../constants/activities';
import { ActivityColorCustomizerModal } from './ActivityColorCustomizerModal';

const categoryIcons: Record<string, React.ReactNode> = {
  'Hallways': <Footprints className="w-3.5 h-3.5 text-blue-400" />,
  'Floating': <Shuffle className="w-3.5 h-3.5 text-purple-400" />,
  'Doors & Gates': <DoorOpen className="w-3.5 h-3.5 text-orange-400" />,
  'Support & Admin': <CreditCard className="w-3.5 h-3.5 text-cyan-400" />,
  'Line Up': <Users className="w-3.5 h-3.5 text-emerald-400" />,
  'Classroom': <BookOpen className="w-3.5 h-3.5 text-pink-400" />,
  'Breaks': <Coffee className="w-3.5 h-3.5 text-emerald-400" />
};

interface ActivityPaletteProps {
  selectedActivityId: string;
  onSelectActivity: (id: string) => void;
  activities?: ShiftActivity[];
  onSaveActivities?: (activities: ShiftActivity[]) => void;
  onResetActivities?: () => void;
}

export const ActivityPalette: React.FC<ActivityPaletteProps> = ({
  selectedActivityId,
  onSelectActivity,
  activities = ACTIVITIES,
  onSaveActivities,
  onResetActivities
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  const categories = ['All', 'Hallways', 'Floating', 'Doors & Gates', 'Support & Admin', 'Line Up', 'Classroom', 'Breaks'];

  const filteredActivities = activeCategory === 'All' 
    ? activities 
    : activities.filter(a => a.category === activeCategory);

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Duty Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {categoryIcons[cat]}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsColorModalOpen(true)}
              id="btn-customize-colors"
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="Customize the color coding and badge styling for each activity type"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Customize Colors</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 shrink-0 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Select brush &amp; click cell, or double-click cell to edit text directly</span>
            </div>
          </div>
        </div>

        {/* Duty Brush Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">
            Active Brush:
          </span>

          {filteredActivities.map((act) => {
            const isSelected = selectedActivityId === act.id;
            return (
              <button
                key={act.id}
                onClick={() => onSelectActivity(act.id)}
                id={`activity-brush-${act.id}`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-white shadow-md scale-105'
                    : 'opacity-85 hover:opacity-100'
                } ${act.bgColor} ${act.borderColor} ${act.textColor}`}
                title={act.name}
              >
                <span>{act.shortCode || act.name}</span>
              </button>
            );
          })}

          {/* Eraser / Clear Brush */}
          <button
            onClick={() => onSelectActivity('CLEAR')}
            id="activity-brush-clear"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
              selectedActivityId === 'CLEAR'
                ? 'bg-slate-700 text-white border-white ring-2 ring-white'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Cell</span>
          </button>
        </div>
      </div>

      {/* Activity Color Customizer Modal */}
      {isColorModalOpen && (
        <ActivityColorCustomizerModal
          isOpen={isColorModalOpen}
          onClose={() => setIsColorModalOpen(false)}
          activities={activities}
          onSaveActivities={(updated) => {
            if (onSaveActivities) onSaveActivities(updated);
          }}
          onResetToDefault={() => {
            if (onResetActivities) onResetActivities();
          }}
        />
      )}
    </div>
  );
};
