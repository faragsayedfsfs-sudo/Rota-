import React, { useEffect, useRef, useState } from 'react';
import { 
  Copy, 
  ClipboardPaste, 
  Trash2, 
  Coffee, 
  Sparkles, 
  Layers, 
  Check, 
  Edit2, 
  RotateCcw,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  BookmarkCheck,
  ChevronRight,
  CalendarOff,
  CalendarCheck,
  UserX,
  UserCheck,
  ShieldAlert,
  Tag
} from 'lucide-react';
import { StaffRow, StaffShiftPattern } from '../types';
import { BUILT_IN_STAFF_SHIFT_PATTERNS } from '../constants/defaultTemplates';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  staffRow: StaffRow;
  slot?: string; // If right-clicked on a specific time slot
}

export interface CopiedShiftData {
  sourceStaffId: string;
  sourceStaffName: string;
  slots: Record<string, string>;
  activeDutyCount: number;
  timestamp: number;
}

interface RotaContextMenuProps {
  menuState: ContextMenuState | null;
  onClose: () => void;
  copiedShift: CopiedShiftData | null;
  onCopyRowShift: (row: StaffRow) => void;
  onPasteRowShift: (targetRow: StaffRow, mergeOnly?: boolean) => void;
  onClearRowShifts: (targetRow: StaffRow) => void;
  onDuplicateRow: (row: StaffRow) => void;
  onRenameRow: (row: StaffRow) => void;
  onScheduleBreak: (staffId: string) => void;
  onApplyShiftPattern?: (targetRow: StaffRow, pattern: StaffShiftPattern) => void;
  onToggleAvailability?: (targetRow: StaffRow, isUnavailable: boolean, reason?: string) => void;
  onCopySingleCell?: (slot: string, value: string) => void;
  onPasteSingleCell?: (targetRow: StaffRow, slot: string) => void;
  copiedSingleCell?: { value: string; slot: string } | null;
  onOpenSmartSuggest?: (staffId: string, staffName: string, slot: string) => void;
  onEditNotes?: (row: StaffRow) => void;
  onEditProfile?: (row: StaffRow) => void;
}

export const RotaContextMenu: React.FC<RotaContextMenuProps> = ({
  menuState,
  onClose,
  copiedShift,
  onCopyRowShift,
  onPasteRowShift,
  onClearRowShifts,
  onDuplicateRow,
  onRenameRow,
  onScheduleBreak,
  onApplyShiftPattern,
  onToggleAvailability,
  onCopySingleCell,
  onPasteSingleCell,
  copiedSingleCell,
  onOpenSmartSuggest,
  onEditNotes,
  onEditProfile
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPatternSubmenu, setShowPatternSubmenu] = useState<boolean>(false);
  const [showUnavailableSubmenu, setShowUnavailableSubmenu] = useState<boolean>(false);

  useEffect(() => {
    setShowPatternSubmenu(false);
    setShowUnavailableSubmenu(false);
  }, [menuState?.isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    if (menuState?.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuState?.isOpen, onClose]);

  if (!menuState || !menuState.isOpen) return null;

  const { staffRow, slot, x, y } = menuState;
  const currentSlotValue = slot ? (staffRow.slots[slot] || '') : '';

  // Calculate position to prevent menu overflowing the viewport
  const menuWidth = 250;
  const menuHeight = 360;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  const activeDutiesInRow = Object.values(staffRow.slots).filter(v => Boolean(v) && v !== 'OFF').length;

  return (
    <div
      ref={menuRef}
      id="rota-context-menu"
      style={{
        top: `${Math.max(10, adjustedY)}px`,
        left: `${Math.max(10, adjustedX)}px`
      }}
      className="fixed z-50 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Target Staff Header */}
      <div className="px-2.5 py-1.5 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs truncate max-w-[140px]">
            {staffRow.name}
          </span>
          {staffRow.isUnavailable ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-semibold font-mono flex items-center gap-1">
              <CalendarOff className="w-2.5 h-2.5 text-amber-400" />
              <span>{staffRow.unavailableReason || 'Day Off'}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">
              {activeDutiesInRow} {activeDutiesInRow === 1 ? 'duty' : 'duties'}
            </span>
          )}
        </div>
        {slot && (
          <div className="text-[10px] text-blue-400 font-mono mt-0.5">
            Slot: {slot} {currentSlotValue ? `(${currentSlotValue})` : '(Empty)'}
          </div>
        )}
      </div>

      {/* Availability / Day Off Status Toggle */}
      {onToggleAvailability && (
        <div className="py-1 space-y-0.5">
          {staffRow.isUnavailable ? (
            <button
              onClick={() => {
                onToggleAvailability(staffRow, false);
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">Set as Active / On Duty</span>
              </div>
              <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-900/60 text-emerald-200">
                Restore
              </span>
            </button>
          ) : (
            <div>
              <button
                onClick={() => setShowUnavailableSubmenu(!showUnavailableSubmenu)}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-slate-800 hover:text-amber-300 text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CalendarOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Mark as Day Off / Unavailable</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUnavailableSubmenu ? 'rotate-90' : ''}`} />
              </button>

              {showUnavailableSubmenu && (
                <div className="mt-1 pl-2 pr-1 py-1 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                  {[
                    { reason: 'Day Off', desc: 'Standard scheduled rest day' },
                    { reason: 'Unavailable', desc: 'General absence / unavailable' },
                    { reason: 'Annual Leave', desc: 'Approved holiday leave' },
                    { reason: 'Sick Leave', desc: 'Medical / sick absence' }
                  ].map(({ reason, desc }) => (
                    <button
                      key={reason}
                      onClick={() => {
                        onToggleAvailability(staffRow, true, reason);
                        onClose();
                      }}
                      className="w-full px-2 py-1 rounded flex items-center justify-between text-left hover:bg-amber-600 hover:text-white text-[11px] text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{reason}</span>
                      <span className="text-[9.5px] text-slate-500">{desc.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Primary Shift Copy/Paste Actions */}
      <div className="py-1 space-y-0.5">
        <button
          onClick={() => {
            onCopyRowShift(staffRow);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-blue-600 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
            <span className="font-semibold">Copy Full Shift Block</span>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-blue-100 font-mono">
            {activeDutiesInRow} slots
          </span>
        </button>

        <button
          disabled={!copiedShift}
          onClick={() => {
            if (copiedShift) {
              onPasteRowShift(staffRow, false);
              onClose();
            }
          }}
          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors group ${
            copiedShift
              ? 'hover:bg-emerald-600 hover:text-white cursor-pointer text-slate-100'
              : 'opacity-40 cursor-not-allowed text-slate-500'
          }`}
          title={copiedShift ? `Paste shift block from ${copiedShift.sourceStaffName}` : 'Copy a shift block first'}
        >
          <div className="flex items-center gap-2">
            <ClipboardPaste className={`w-3.5 h-3.5 ${copiedShift ? 'text-emerald-400 group-hover:text-white' : 'text-slate-500'}`} />
            <span className="font-semibold">Paste Full Shift Block</span>
          </div>
          {copiedShift && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-300 group-hover:bg-emerald-700 group-hover:text-white font-mono">
              From {copiedShift.sourceStaffName.slice(0, 8)}
            </span>
          )}
        </button>

        {copiedShift && (
          <button
            onClick={() => {
              onPasteRowShift(staffRow, true);
              onClose();
            }}
            className="w-full px-2.5 py-1 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-emerald-300 text-[11px] text-slate-300 transition-colors cursor-pointer"
            title="Only paste into slots that are currently empty"
          >
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Paste (Fill Empty Slots Only)</span>
          </button>
        )}
      </div>

      {/* Preset Shift Patterns Submenu */}
      {onApplyShiftPattern && (
        <div className="py-1 space-y-0.5">
          <button
            onClick={() => setShowPatternSubmenu(!showPatternSubmenu)}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-slate-800 hover:text-white text-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold">Apply Shift Pattern</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showPatternSubmenu ? 'rotate-90' : ''}`} />
          </button>

          {showPatternSubmenu && (
            <div className="mt-1 pl-2 pr-1 py-1 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
              {BUILT_IN_STAFF_SHIFT_PATTERNS.map((pattern) => {
                const PatternIcon = pattern.category === 'early' ? Sun : pattern.category === 'late' ? Moon : Clock;
                return (
                  <button
                    key={pattern.id}
                    onClick={() => {
                      onApplyShiftPattern(staffRow, pattern);
                      onClose();
                    }}
                    className="w-full px-2 py-1 rounded flex items-center justify-between text-left hover:bg-blue-600 hover:text-white text-[11px] text-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <PatternIcon className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">{pattern.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                      {pattern.shiftWindow.split(' - ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Single Slot Actions (if clicked on a specific slot) */}
      {slot && (
        <div className="py-1 space-y-0.5">
          {onOpenSmartSuggest && (
            <button
              onClick={() => {
                onOpenSmartSuggest(staffRow.id, staffRow.name, slot);
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left bg-gradient-to-r from-purple-950/60 to-blue-950/60 hover:from-purple-600 hover:to-blue-600 hover:text-white text-purple-200 transition-all cursor-pointer border border-purple-500/30"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold">✨ AI Smart Suggest</span>
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-300">Gemini</span>
            </button>
          )}

          {onCopySingleCell && onPasteSingleCell && currentSlotValue && (
            <button
              onClick={() => {
                onCopySingleCell(slot, currentSlotValue);
                onClose();
              }}
              className="w-full px-2.5 py-1 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-white text-slate-300 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy Duty "{currentSlotValue}"</span>
            </button>
          )}

          {onCopySingleCell && onPasteSingleCell && copiedSingleCell && (
            <button
              onClick={() => {
                onPasteSingleCell(staffRow, slot);
                onClose();
              }}
              className="w-full px-2.5 py-1 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-white text-slate-300 transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3 h-3 text-emerald-400" />
              <span>Paste "{copiedSingleCell.value}" here</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Row Adjustments & Helpers */}
      <div className="py-1 space-y-0.5">
        {onEditProfile && (
          <button
            onClick={() => {
              onEditProfile(staffRow);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-purple-300 text-slate-300 transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>Edit Staff Profile &amp; Skills</span>
          </button>
        )}

        {onEditNotes && (
          <button
            onClick={() => {
              onEditNotes(staffRow);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-blue-300 text-slate-300 transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>Quick Edit Notes</span>
          </button>
        )}

        <button
          onClick={() => {
            onScheduleBreak(staffRow.id);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-amber-600/30 hover:text-amber-200 text-slate-300 transition-colors cursor-pointer"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto-Assign 30m TCA Break</span>
        </button>

        <button
          onClick={() => {
            onRenameRow(staffRow);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-white text-slate-300 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Rename Assistant</span>
        </button>

        <button
          onClick={() => {
            onDuplicateRow(staffRow);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-800 hover:text-white text-slate-300 transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 text-slate-400" />
          <span>Duplicate Assistant Row</span>
        </button>

        <button
          onClick={() => {
            onClearRowShifts(staffRow);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>Clear This Staff's Shifts</span>
        </button>
      </div>
    </div>
  );
};

