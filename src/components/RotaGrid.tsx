import React, { useState, useMemo } from 'react';
import { 
  User, 
  Trash2, 
  Copy, 
  Edit2, 
  Check, 
  Sparkles, 
  Plus, 
  HelpCircle,
  Clock,
  Briefcase,
  Coffee,
  AlertTriangle,
  Filter,
  CheckCircle2,
  ClipboardPaste,
  ClipboardCheck,
  X,
  Layers,
  MousePointer,
  Scale,
  Info,
  BarChart2,
  BookmarkCheck,
  CalendarOff,
  CalendarCheck,
  UserX,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  MoveHorizontal,
  Hand,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  Tag,
  Wand2,
  Settings2,
  Award
} from 'lucide-react';
import { RotaConfig, StaffRow, StaffShiftPattern, ShiftActivity } from '../types';
import { TIME_SLOTS, SLOT_GROUPS, ACTIVITIES, findActivity } from '../constants/activities';
import { calculateStaffHours, calculateSlotCoverage, getSlotDurationHours } from '../services/googleSheetsService';
import { analyzeRotaBreaks, autoScheduleBreakForStaff } from '../utils/breakCompliance';
import { detectRotaConflicts, ConflictReport } from '../utils/conflictDetection';
import { analyzeTeamWorkload, TeamWorkloadReport } from '../utils/workDistribution';
import { applyStaffPatternToRow } from '../utils/templateManager';
import { RotaContextMenu, ContextMenuState, CopiedShiftData } from './RotaContextMenu';
import { StaffWorkloadTooltip } from './StaffWorkloadTooltip';
import { SmartSuggestModal } from './SmartSuggestModal';
import { StaffMetadataModal, getSkillBadgeStyle } from './StaffMetadataModal';
import { useDragScroll } from '../hooks/useDragScroll';

interface RotaGridProps {
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
  selectedActivityId: string;
  activities?: ShiftActivity[];
  searchQuery?: string;
  onOpenMandatoryBreaksModal?: () => void;
  onOpenTemplatesModal?: () => void;
}

export const RotaGrid: React.FC<RotaGridProps> = ({
  rota,
  setRota,
  selectedActivityId,
  activities = ACTIVITIES,
  searchQuery = '',
  onOpenMandatoryBreaksModal,
  onOpenTemplatesModal
}) => {
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingStaffName, setEditingStaffName] = useState<string>('');
  const [editingNotesStaffId, setEditingNotesStaffId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState<string>('');
  const [activeCellEdit, setActiveCellEdit] = useState<{ staffId: string; slot: string } | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>('');
  const [filterFlaggedBreaksOnly, setFilterFlaggedBreaksOnly] = useState<boolean>(false);
  const [filterConflictsOnly, setFilterConflictsOnly] = useState<boolean>(false);
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'active' | 'unavailable'>('all');
  const [allowDuplicateDutiesForTCAS, setAllowDuplicateDutiesForTCAS] = useState<boolean>(true);

  // AI Smart Suggest Modal State
  const [isSmartSuggestOpen, setIsSmartSuggestOpen] = useState<boolean>(false);
  const [smartSuggestInitialSlot, setSmartSuggestInitialSlot] = useState<{ staffId: string; staffName: string; slot: string } | undefined>(undefined);

  // Staff Metadata & Skills Editor Modal State
  const [selectedStaffForMetadata, setSelectedStaffForMetadata] = useState<StaffRow | null>(null);

  // Staff row hover tooltip for work distribution fairness
  const [hoveredStaffRowId, setHoveredStaffRowId] = useState<string | null>(null);
  const [hoverMousePos, setHoverMousePos] = useState<{ x: number; y: number } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [copiedShift, setCopiedShift] = useState<CopiedShiftData | null>(null);
  const [copiedSingleCell, setCopiedSingleCell] = useState<{ value: string; slot: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const breakReport = analyzeRotaBreaks(rota);
  const conflictReport = detectRotaConflicts(rota, { allowDuplicateDutiesForTCAS });
  const workloadReport = useMemo(() => analyzeTeamWorkload(rota), [rota]);

  // Drag to scroll timeline hook
  const {
    containerRef: gridScrollContainerRef,
    isMouseDown,
    isDragScrolling,
    scrollProgress,
    canScrollLeft,
    canScrollRight,
    scrollByAmount,
    scrollToStart,
    scrollToEnd,
    scrollToSlotIndex,
    events: dragEvents
  } = useDragScroll<HTMLDivElement>({
    dragThreshold: 5,
    momentumFriction: 0.94,
    dragSpeed: 1.2
  });

  // Toggle Day Off / Unavailable status for staff member
  const handleToggleAvailability = (targetRow: StaffRow, isUnavailable: boolean, reason: string = 'Day Off') => {
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === targetRow.id) {
          return {
            ...row,
            isUnavailable,
            unavailableReason: isUnavailable ? reason : undefined
          };
        }
        return row;
      })
    }));

    if (isUnavailable) {
      showToast(`${targetRow.name} marked as "${reason}". Row is grayed out to prevent accidental assignments.`);
    } else {
      showToast(`${targetRow.name} restored to Active / On Duty. Shift editing is re-enabled.`);
    }
  };

  // Auto-schedule break for single staff
  const handleAutoScheduleBreak = (staffId: string) => {
    const targetRow = rota.rows.find(r => r.id === staffId);
    if (targetRow?.isUnavailable) {
      showToast(`⚠️ ${targetRow.name} is on ${targetRow.unavailableReason || 'Day Off'}.`);
      return;
    }
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === staffId) {
          return autoScheduleBreakForStaff(row, prev);
        }
        return row;
      })
    }));
    showToast('Scheduled mandatory 30m break');
  };

  // Apply a preset staff shift pattern to a row
  const handleApplyShiftPattern = (targetRow: StaffRow, pattern: StaffShiftPattern) => {
    if (targetRow.isUnavailable) {
      showToast(`⚠️ Cannot apply pattern to ${targetRow.name} because they are marked as ${targetRow.unavailableReason || 'Day Off'}. Set them to Active first.`);
      return;
    }
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === targetRow.id) {
          return applyStaffPatternToRow(row, pattern, false);
        }
        return row;
      })
    }));
    showToast(`Applied "${pattern.name}" pattern to ${targetRow.name}`);
  };

  // Right click handlers
  const handleRowContextMenu = (e: React.MouseEvent, row: StaffRow, slot?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      staffRow: row,
      slot
    });
  };

  // Copy full shift block
  const handleCopyRowShift = (row: StaffRow) => {
    const activeCount = Object.values(row.slots).filter(v => Boolean(v) && v !== 'OFF').length;
    const shiftData: CopiedShiftData = {
      sourceStaffId: row.id,
      sourceStaffName: row.name,
      slots: { ...row.slots },
      activeDutyCount: activeCount,
      timestamp: Date.now()
    };
    setCopiedShift(shiftData);
    showToast(`Copied shift block from ${row.name} (${activeCount} duties). Right-click any assistant row to paste.`);
  };

  // Paste full shift block into target assistant row
  const handlePasteRowShift = (targetRow: StaffRow, mergeOnly: boolean = false) => {
    if (!copiedShift) return;

    if (targetRow.isUnavailable) {
      showToast(`⚠️ Cannot paste shift into ${targetRow.name} because they are on ${targetRow.unavailableReason || 'Day Off'}. Toggle availability first.`);
      return;
    }

    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === targetRow.id) {
          let updatedSlots = { ...row.slots };
          if (mergeOnly) {
            // Only fill empty slots
            TIME_SLOTS.forEach(slot => {
              if (!updatedSlots[slot] && copiedShift.slots[slot]) {
                updatedSlots[slot] = copiedShift.slots[slot];
              }
            });
          } else {
            // Replace entire shift pattern
            updatedSlots = { ...copiedShift.slots };
          }
          return {
            ...row,
            slots: updatedSlots
          };
        }
        return row;
      })
    }));

    showToast(
      mergeOnly
        ? `Merged shifts from ${copiedShift.sourceStaffName} into ${targetRow.name}`
        : `Pasted shift block from ${copiedShift.sourceStaffName} into ${targetRow.name}`
    );
  };

  // Clear a staff member's shifts
  const handleClearRowShifts = (targetRow: StaffRow) => {
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === targetRow.id) {
          return {
            ...row,
            slots: {}
          };
        }
        return row;
      })
    }));
    showToast(`Cleared all shift duties for ${targetRow.name}`);
  };

  // Copy single slot duty
  const handleCopySingleCell = (slot: string, value: string) => {
    if (!value) return;
    setCopiedSingleCell({ slot, value });
    showToast(`Copied duty "${value}"`);
  };

  // Paste single slot duty
  const handlePasteSingleCell = (targetRow: StaffRow, slot: string) => {
    if (!copiedSingleCell) return;
    if (targetRow.isUnavailable) {
      showToast(`⚠️ Cannot paste into ${targetRow.name} (${targetRow.unavailableReason || 'Day Off'}).`);
      return;
    }
    updateCell(targetRow.id, slot, copiedSingleCell.value);
    showToast(`Pasted "${copiedSingleCell.value}" into ${targetRow.name} (${slot})`);
  };

  // Handle single cell click (paint brush or select)
  const handleCellClick = (staffId: string, slot: string) => {
    if (activeCellEdit) return;

    const targetRow = rota.rows.find(r => r.id === staffId);
    if (targetRow?.isUnavailable) {
      showToast(`⚠️ ${targetRow.name} is on ${targetRow.unavailableReason || 'Day Off'}. Toggle availability in the staff column to assign duties.`);
      return;
    }

    if (selectedActivityId === 'CLEAR') {
      updateCell(staffId, slot, '');
      return;
    }

    const act = ACTIVITIES.find(a => a.id === selectedActivityId);
    if (act) {
      updateCell(staffId, slot, act.name);
    }
  };

  // Update cell value
  const updateCell = (staffId: string, slot: string, value: string) => {
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id === staffId) {
          return {
            ...row,
            slots: {
              ...row.slots,
              [slot]: value
            }
          };
        }
        return row;
      })
    }));
  };

  // Start cell inline text edit
  const handleCellDoubleClick = (staffId: string, slot: string, currentValue: string) => {
    const targetRow = rota.rows.find(r => r.id === staffId);
    if (targetRow?.isUnavailable) {
      showToast(`⚠️ ${targetRow.name} is marked as ${targetRow.unavailableReason || 'Day Off'}. Click the availability toggle to enable duty assignments.`);
      return;
    }
    setActiveCellEdit({ staffId, slot });
    setCellInputValue(currentValue || '');
  };

  const handleCellEditSave = () => {
    if (activeCellEdit) {
      updateCell(activeCellEdit.staffId, activeCellEdit.slot, cellInputValue.trim());
      setActiveCellEdit(null);
    }
  };

  // Delete staff row
  const handleDeleteRow = (staffId: string) => {
    if (rota.rows.length <= 1) {
      alert('You must have at least one staff row.');
      return;
    }
    setRota(prev => ({
      ...prev,
      rows: prev.rows.filter(r => r.id !== staffId)
    }));
  };

  // Duplicate staff row
  const handleDuplicateRow = (row: StaffRow) => {
    const newId = `assistant-${Date.now().toString(36)}`;
    const newName = `${row.name} (Copy)`;
    const newRow: StaffRow = {
      ...row,
      id: newId,
      name: newName,
      slots: { ...row.slots }
    };
    setRota(prev => ({
      ...prev,
      rows: [...prev.rows, newRow]
    }));
  };

  // Start editing staff name
  const handleStartEditName = (row: StaffRow) => {
    setEditingStaffId(row.id);
    setEditingStaffName(row.name);
  };

  // Save staff name
  const handleSaveStaffName = (staffId: string) => {
    if (!editingStaffName.trim()) return;
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === staffId ? { ...r, name: editingStaffName.trim() } : r)
    }));
    setEditingStaffId(null);
  };

  // Calculate coverage stats across full rota
  const coverageStats = calculateSlotCoverage(rota.rows);
  const totalStaffCount = rota.rows.length;
  const unavailableStaffCount = rota.rows.filter(r => r.isUnavailable).length;
  const activeStaffCount = totalStaffCount - unavailableStaffCount;

  // Start editing staff notes / tags
  const handleStartEditNotes = (row: StaffRow) => {
    setEditingNotesStaffId(row.id);
    setEditingNotesText(row.notes || '');
  };

  // Save staff notes
  const handleSaveStaffNotes = (staffId: string) => {
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === staffId ? { ...r, notes: editingNotesText.trim() || undefined } : r)
    }));
    setEditingNotesStaffId(null);
    showToast('Saved staff notes');
  };

  // Open Full Staff Metadata & Skills Editor Modal
  const handleOpenStaffMetadata = (row: StaffRow) => {
    setSelectedStaffForMetadata(row);
  };

  // Save updated staff metadata & skills
  const handleSaveStaffRowMetadata = (updatedRow: StaffRow) => {
    setRota(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === updatedRow.id ? updatedRow : r)
    }));
    setSelectedStaffForMetadata(null);
    showToast(`Updated profile & skills for ${updatedRow.name}`);
  };

  // Open Smart Suggest for a specific assistant and slot
  const handleOpenSmartSuggestForSlot = (staffId: string, staffName: string, slot: string) => {
    setSmartSuggestInitialSlot({ staffId, staffName, slot });
    setIsSmartSuggestOpen(true);
  };

  // Filter staff rows by searchQuery, filterFlaggedBreaksOnly, filterConflictsOnly, and filterAvailability
  const cleanQuery = searchQuery.trim().toLowerCase();
  const filteredRowsWithIndex = rota.rows
    .map((row, originalIdx) => ({ row, originalIdx }))
    .filter(({ row, originalIdx }) => {
      if (filterAvailability === 'active' && row.isUnavailable) {
        return false;
      }
      if (filterAvailability === 'unavailable' && !row.isUnavailable) {
        return false;
      }
      const analysis = breakReport.allAnalyses[row.id];
      if (filterFlaggedBreaksOnly && !analysis?.isFlagged) {
        return false;
      }
      if (filterConflictsOnly && (conflictReport.staffConflictCounts[row.id] || 0) === 0) {
        return false;
      }
      if (!cleanQuery) return true;
      const nameMatch = row.name.toLowerCase().includes(cleanQuery);
      const idMatch = row.id.toLowerCase().includes(cleanQuery);
      const notesMatch = (row.notes || '').toLowerCase().includes(cleanQuery);
      const skillsMatch = Array.isArray(row.skills) && row.skills.some(s => s.toLowerCase().includes(cleanQuery));
      const roleMatch = (row.role || '').toLowerCase().includes(cleanQuery);
      const numMatch = String(originalIdx + 1).includes(cleanQuery) ||
        `assistant ${originalIdx + 1}`.includes(cleanQuery);
      const slotsMatch = Object.values(row.slots).some(v => String(v || '').toLowerCase().includes(cleanQuery));
      return nameMatch || idMatch || notesMatch || skillsMatch || roleMatch || numMatch || slotsMatch;
    });

  // Cell style resolver (using customized activities colors when available)
  const getCellDisplayInfo = (value: string) => {
    if (!value) return null;
    // Check customized activities array first
    const customAct = activities.find(a => 
      a.id === value || 
      a.name.toLowerCase() === value.toLowerCase() || 
      (a.shortCode && a.shortCode.toLowerCase() === value.toLowerCase())
    );
    if (customAct) {
      return {
        text: customAct.shortCode || customAct.name,
        color: customAct.color,
        bgColor: customAct.bgColor,
        textColor: customAct.textColor,
        borderColor: customAct.borderColor
      };
    }

    const act = findActivity(value);
    if (act) {
      return {
        text: act.shortCode || act.name,
        color: act.color,
        bgColor: act.bgColor,
        textColor: act.textColor,
        borderColor: act.borderColor
      };
    }

    const valLower = value.toLowerCase();
    if (valLower.includes('break')) {
      return {
        text: value,
        color: '#10b981',
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/40'
      };
    } else if (valLower.includes('primary') || valLower.includes('room')) {
      return {
        text: value,
        color: '#ec4899',
        bgColor: 'bg-pink-500/20',
        textColor: 'text-pink-300',
        borderColor: 'border-pink-500/40'
      };
    } else if (valLower.includes('line up')) {
      return {
        text: value,
        color: '#10b981',
        bgColor: 'bg-emerald-500/15',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/40'
      };
    } else if (valLower.includes('floating')) {
      return {
        text: value,
        color: '#8b5cf6',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-300',
        borderColor: 'border-purple-500/40'
      };
    } else if (valLower.includes('door') || valLower.includes('usher')) {
      return {
        text: value,
        color: '#f97316',
        bgColor: 'bg-orange-500/20',
        textColor: 'text-orange-300',
        borderColor: 'border-orange-500/40'
      };
    } else if (valLower.includes('end of class')) {
      return {
        text: value,
        color: '#6366f1',
        bgColor: 'bg-indigo-500/20',
        textColor: 'text-indigo-300',
        borderColor: 'border-indigo-500/40'
      };
    }

    return {
      text: value,
      color: '#3b82f6',
      bgColor: 'bg-blue-500/15',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-500/40'
    };
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-950 p-3 sm:p-4 select-none space-y-2 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-5 duration-150">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Copied Shift Floating Clipboard Banner */}
      {copiedShift && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 px-3 py-2 rounded-xl text-xs text-emerald-200 shadow-lg flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">Shift Pattern Copied:</strong>{' '}
              <span className="text-emerald-300 font-semibold">{copiedShift.sourceStaffName}</span> ({copiedShift.activeDutyCount} active duty slots).
              <span className="text-emerald-400/80 ml-1.5 hidden sm:inline">
                Right-click any assistant row to paste full shift.
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCopiedShift(null);
                showToast('Cleared copied shift from clipboard');
              }}
              className="px-2 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear Clipboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Sub-toolbar / Break & Conflict Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Overlapping Activity Conflict Alert / Filter Button */}
          {conflictReport.hasAnyConflicts && (
            <button
              onClick={() => setFilterConflictsOnly(!filterConflictsOnly)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                filterConflictsOnly
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-1 ring-rose-300'
                  : 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border-rose-700 shadow-sm'
              }`}
              title="Highlight and filter only staff with overlapping or conflicting shift duties"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
              <span>
                {filterConflictsOnly 
                  ? `Filtering ${conflictReport.totalConflicts} Conflicts (${conflictReport.conflictedStaffCount} Staff)` 
                  : `${conflictReport.totalConflicts} Activity Conflict${conflictReport.totalConflicts > 1 ? 's' : ''} (${conflictReport.conflictedStaffCount} Staff)`}
              </span>
            </button>
          )}

          {breakReport.flaggedCount > 0 ? (
            <button
              onClick={() => setFilterFlaggedBreaksOnly(!filterFlaggedBreaksOnly)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                filterFlaggedBreaksOnly
                  ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border-amber-700/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {filterFlaggedBreaksOnly ? 'Showing Flagged Breaks Only' : `Filter Flagged Breaks (${breakReport.flaggedCount})`}
              </span>
            </button>
          ) : !conflictReport.hasAnyConflicts && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All shifts compliant &amp; 0 conflicts detected</span>
            </span>
          )}

          {/* Workload Distribution Fairness Metric Badge */}
          <div 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium shadow-xs"
            title={`Team Workload Distribution: ${workloadReport.totalTeamHours.toFixed(1)} scheduled hours across ${workloadReport.activeStaffCount} active assistants. Hover over any assistant row to view their full hours breakdown & fairness metrics.`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Team Avg: <strong className="text-white font-mono">{workloadReport.teamAverageHours.toFixed(1)}h</strong>/staff</span>
            <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
              ({workloadReport.activeStaffCount}/{workloadReport.totalStaffCount} active)
            </span>
          </div>

          {/* Availability Status Filter Pill Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterAvailability('all')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterAvailability === 'all'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show all assistants"
            >
              All ({totalStaffCount})
            </button>
            <button
              onClick={() => setFilterAvailability('active')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterAvailability === 'active'
                  ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-700/60 shadow-xs'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="Show only assistants on active duty"
            >
              <span>Active</span>
              <span className="font-mono text-[10px] text-emerald-400">({activeStaffCount})</span>
            </button>
            <button
              onClick={() => setFilterAvailability('unavailable')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterAvailability === 'unavailable'
                  ? 'bg-slate-800 text-amber-300 font-semibold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
              title="Show assistants on Day Off / Unavailable"
            >
              <CalendarOff className="w-3 h-3 text-amber-400" />
              <span>Day Off</span>
              {unavailableStaffCount > 0 && (
                <span className="font-mono text-[10px] text-amber-300">({unavailableStaffCount})</span>
              )}
            </button>
          </div>

          {(filterFlaggedBreaksOnly || filterConflictsOnly || filterAvailability !== 'all') && (
            <button
              onClick={() => {
                setFilterFlaggedBreaksOnly(false);
                setFilterConflictsOnly(false);
                setFilterAvailability('all');
              }}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Smart Suggest Button */}
          <button
            onClick={() => {
              setSmartSuggestInitialSlot(undefined);
              setIsSmartSuggestOpen(true);
            }}
            id="grid-smart-suggest-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-purple-950/50 transition-all cursor-pointer border border-purple-400/40"
            title="AI Smart Suggest & Auto-Fill empty shift slots with Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>✨ AI Smart Suggest</span>
            <span className="text-[9px] bg-purple-950/80 px-1 py-0.2 rounded text-purple-200 border border-purple-400/30">
              Gemini
            </span>
          </button>

          {/* Duplicate Duties for TCAS Toggle */}
          <label 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 cursor-pointer transition-colors select-none"
            title="When enabled, assigning duplicate TCAS duties will not flag conflict errors"
          >
            <input
              type="checkbox"
              checked={allowDuplicateDutiesForTCAS}
              onChange={(e) => setAllowDuplicateDutiesForTCAS(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer w-3.5 h-3.5"
            />
            <span className="text-[11px] font-medium">Allow Duplicate Duties</span>
          </label>

          {onOpenTemplatesModal && (
            <button
              onClick={onOpenTemplatesModal}
              id="grid-shift-templates-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Open Rota Templates & Shift Patterns"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Shift Templates</span>
            </button>
          )}

          <span className="text-[11px] text-slate-400 hidden lg:inline flex items-center gap-1">
            <MousePointer className="w-3 h-3 text-blue-400" />
            <span>Tip: Right-click row or click ✨ on empty slots for AI duties</span>
          </span>

          {onOpenMandatoryBreaksModal && (
            <button
              onClick={onOpenMandatoryBreaksModal}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5 text-blue-400" />
              <span>Break Rules &amp; Compliance Details &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline Quick Jump & Drag-to-Scroll Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visual Drag Indicator Pill */}
          <div 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isDragScrolling
                ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm shadow-blue-500/20'
                : isMouseDown
                ? 'bg-slate-800 border-blue-500/60 text-blue-300'
                : 'bg-slate-950/70 border-slate-800 text-slate-300'
            }`}
            title="Click and drag anywhere across the grid or use the timeline controls to pan through the 08:30-18:30 schedule"
          >
            {isDragScrolling ? (
              <>
                <Hand className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                <span className="text-blue-300 font-bold">Panning Timeline...</span>
              </>
            ) : (
              <>
                <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>Drag to Scroll</span>
              </>
            )}
            <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">| Hold &amp; drag grid</span>
          </div>

          {/* Quick Jump Buttons to Slot Groups */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 font-medium px-1.5 flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" />
              <span className="hidden md:inline">Jump:</span>
            </span>
            <button
              onClick={() => scrollToSlotIndex(0)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-blue-400 hover:bg-blue-950/80 hover:text-blue-200 transition-colors cursor-pointer border border-transparent hover:border-blue-800/60"
              title="Jump to 09:00 - First Slot (Morning)"
            >
              09:00 Morning
            </button>
            <button
              onClick={() => scrollToSlotIndex(8)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-400 hover:bg-emerald-950/80 hover:text-emerald-200 transition-colors cursor-pointer border border-transparent hover:border-emerald-800/60"
              title="Jump to 12:00 - Prayer & Rest Break interval"
            >
              12:00 Prayer &amp; Lunch
            </button>
            <button
              onClick={() => scrollToSlotIndex(11)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-purple-400 hover:bg-purple-950/80 hover:text-purple-200 transition-colors cursor-pointer border border-transparent hover:border-purple-800/60"
              title="Jump to 01:00 PM - Second Slot (Afternoon)"
            >
              01:00 PM Afternoon
            </button>
            <button
              onClick={() => scrollToSlotIndex(17)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-400 hover:bg-amber-950/80 hover:text-amber-200 transition-colors cursor-pointer border border-transparent hover:border-amber-800/60"
              title="Jump to 03:30 PM - Third Slot (Late Shift / Closing)"
            >
              03:30 PM Late Shift
            </button>
          </div>
        </div>

        {/* Scroll Controls & Progress Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
          {/* Step Scroll Left / Right Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={scrollToStart}
              disabled={!canScrollLeft}
              className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Scroll to start of schedule (09:00)"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollByAmount(-260)}
              disabled={!canScrollLeft}
              className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-semibold"
              title="Scroll timeline left by 250px"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Left</span>
            </button>
            <button
              onClick={() => scrollByAmount(260)}
              disabled={!canScrollRight}
              className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-semibold"
              title="Scroll timeline right by 250px"
            >
              <span className="hidden sm:inline">Right</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={scrollToEnd}
              disabled={!canScrollRight}
              className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Scroll to end of schedule (18:30)"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeline Viewport Scrubber Bar */}
          <div 
            className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full border border-slate-800 relative overflow-hidden shrink-0 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              if (gridScrollContainerRef.current) {
                const maxScroll = gridScrollContainerRef.current.scrollWidth - gridScrollContainerRef.current.clientWidth;
                gridScrollContainerRef.current.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
              }
            }}
            title={`Timeline Viewport: ${scrollProgress}% across 08:30-18:30 (Click to seek)`}
          >
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 rounded-full transition-all duration-75"
              style={{ width: `${Math.max(15, scrollProgress)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div 
          ref={gridScrollContainerRef}
          onMouseDown={dragEvents.onMouseDown}
          onMouseMove={dragEvents.onMouseMove}
          onMouseUp={dragEvents.onMouseUp}
          onMouseLeave={dragEvents.onMouseLeave}
          onClickCapture={dragEvents.onClickCapture}
          style={{
            touchAction: 'pan-x pan-y',
            overscrollBehaviorX: 'contain'
          }}
          className={`overflow-x-auto transition-colors ${
            isDragScrolling
              ? 'cursor-grabbing select-none'
              : isMouseDown
              ? 'cursor-grabbing'
              : 'cursor-grab'
          }`}
        >
          <table className="w-full border-collapse text-left">
            {/* Header Level 1: Category Groups */}
            <thead>
              <tr className="bg-slate-950/95 border-b border-slate-800 text-[11px] font-bold">
                {/* Empty corner above Assistant Name */}
                <th className="p-2 sticky left-0 z-20 bg-slate-950 border-r border-slate-800 min-w-[200px] max-w-[220px]">
                  <div className="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <span>Shift Structure</span>
                    <span className="text-blue-400 font-mono">4 Slots</span>
                  </div>
                </th>

                {/* 4 Slot Groups with Column Spans */}
                {SLOT_GROUPS.map((group) => (
                  <th
                    key={group.id}
                    colSpan={group.slots.length}
                    className="p-1.5 text-center border-r border-slate-800"
                  >
                    <div className={`px-2 py-1 rounded-md text-xs font-bold tracking-wide border flex items-center justify-center gap-1.5 shadow-xs ${group.badgeBg}`}>
                      <span>{group.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({group.slots.length} intervals)
                      </span>
                    </div>
                  </th>
                ))}

                {/* Total & Action header corner */}
                <th className="p-2 text-center bg-slate-950 border-r border-slate-800 min-w-[75px] text-[10px] text-slate-400 uppercase">
                  Hours &amp; Brk
                </th>
                <th className="p-2 text-center bg-slate-950 min-w-[65px] text-[10px] text-slate-400 uppercase">
                  Actions
                </th>
              </tr>

              {/* Header Level 2: Exact Time Slots */}
              <tr className="bg-slate-900/90 text-slate-300 text-[11px] font-semibold border-b border-slate-800">
                <th className="p-2.5 sticky left-0 z-20 bg-slate-900 border-r border-slate-800 min-w-[200px] max-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Assistant Name</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {cleanQuery || filterFlaggedBreaksOnly ? (
                        <span className="text-blue-400 font-medium">
                          {filteredRowsWithIndex.length}/{rota.rows.length}
                        </span>
                      ) : (
                        `${rota.rows.length} Total`
                      )}
                    </span>
                  </div>
                </th>

                {TIME_SLOTS.map((slot) => {
                  return (
                    <th
                      key={slot}
                      className="p-1 text-center border-r border-slate-800/80 min-w-[95px] max-w-[110px] bg-slate-900/90"
                    >
                      <div className="font-mono text-[10px] text-slate-300 font-bold whitespace-nowrap">
                        {slot}
                      </div>
                    </th>
                  );
                })}

                <th 
                  className="p-1.5 text-center border-r border-slate-800 min-w-[85px] text-[10px] font-bold text-slate-300 bg-slate-900"
                  title={`Total Scheduled Working Hours per Assistant (Team Average: ${workloadReport.teamAverageHours.toFixed(1)}h)`}
                >
                  <div>Total Hours</div>
                  <div className="text-[9px] text-blue-400 font-mono font-medium">Avg: {workloadReport.teamAverageHours.toFixed(1)}h</div>
                </th>
                <th className="p-2 text-center min-w-[65px] text-[10px] font-bold text-slate-400 bg-slate-900">
                  Manage
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredRowsWithIndex.length === 0 ? (
                <tr>
                  <td colSpan={26} className="py-12 text-center text-slate-400 bg-slate-900/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-300">
                        {filterFlaggedBreaksOnly 
                          ? 'No assistants currently flagged for missing breaks!' 
                          : `No assistants match "${searchQuery}"`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {filterFlaggedBreaksOnly 
                          ? 'All assistants on duty meet the 30-minute break mandate.' 
                          : 'Try searching by name or duty assignment.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRowsWithIndex.map(({ row, originalIdx }, displayIdx) => {
                  const totalHours = calculateStaffHours(row.slots, row.isUnavailable);
                  const analysis = breakReport.allAnalyses[row.id];
                  const isFlagged = !row.isUnavailable && analysis?.isFlagged;
                  const isSourceOfCopy = copiedShift?.sourceStaffId === row.id;
                  const rowConflictCount = conflictReport.staffConflictCounts[row.id] || 0;
                  const hasRowConflicts = !row.isUnavailable && rowConflictCount > 0;
                  const workloadAnalysis = workloadReport.staffAnalyses[row.id];
                  const isRowUnavailable = Boolean(row.isUnavailable);

                  return (
                    <tr
                      key={row.id}
                      onContextMenu={(e) => handleRowContextMenu(e, row)}
                      onMouseEnter={(e) => {
                        setHoveredStaffRowId(row.id);
                        setHoverMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setHoverMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => {
                        setHoveredStaffRowId(null);
                        setHoverMousePos(null);
                      }}
                      className={`transition-colors ${
                        isRowUnavailable
                          ? 'bg-slate-950/85 opacity-60 hover:opacity-85 border-l-4 border-l-slate-600 grayscale-[0.25]'
                          : isSourceOfCopy
                          ? 'bg-emerald-950/25 border-l-2 border-l-emerald-500 ring-1 ring-emerald-500/30'
                          : hasRowConflicts
                          ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-2 border-l-rose-500 ring-1 ring-rose-500/20'
                          : isFlagged 
                          ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-2 border-l-amber-500' 
                          : displayIdx % 2 === 0 ? 'bg-slate-900/30 hover:bg-slate-800/40' : 'bg-slate-900/80 hover:bg-slate-800/40'
                      }`}
                      title={
                        isRowUnavailable
                          ? `Assistant: ${row.name}\nStatus: ${row.unavailableReason || 'Day Off'} (Off Duty)\nRow is grayed out & protected from accidental assignments.\nRight-click or toggle availability to reactivate.`
                          : `Assistant: ${row.name}\nTotal Scheduled: ${totalHours.toFixed(1)} hrs (${workloadAnalysis?.fairnessLabel || ''})\nTeam Average: ${workloadReport.teamAverageHours.toFixed(1)} hrs\nShift Window: ${workloadAnalysis?.shiftStartSlot || 'None'} - ${workloadAnalysis?.shiftEndSlot || 'None'}\nRest Break: ${analysis?.totalBreakMinutes || 0} mins\n(Hover row for workload breakdown)`
                      }
                    >
                      {/* Sticky Assistant Name Column */}
                      <td 
                        onContextMenu={(e) => handleRowContextMenu(e, row)}
                        className={`p-2 sticky left-0 z-10 border-r border-slate-800 min-w-[200px] max-w-[220px] shadow-sm transition-colors ${
                          isRowUnavailable ? 'bg-slate-950/95' : 'bg-slate-900'
                        }`}
                      >
                        <div className="flex flex-col justify-center gap-1">
                          {editingStaffId === row.id ? (
                            <div className="flex items-center gap-1 w-full">
                              <input
                                type="text"
                                value={editingStaffName}
                                onChange={(e) => setEditingStaffName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveStaffName(row.id);
                                  if (e.key === 'Escape') setEditingStaffId(null);
                                }}
                                autoFocus
                                className="w-full bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveStaffName(row.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`w-5 text-[10px] font-mono shrink-0 ${isRowUnavailable ? 'text-slate-600' : 'text-slate-500'}`}>
                                  {String(originalIdx + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div
                                    onClick={() => handleStartEditName(row)}
                                    className={`font-semibold text-xs truncate hover:text-blue-300 cursor-pointer flex items-center gap-1 group ${
                                      isRowUnavailable ? 'text-slate-400 line-through' : 'text-slate-100'
                                    }`}
                                    title="Click to rename assistant (or right click for full options)"
                                  >
                                    <span className="truncate">{row.name}</span>
                                    <Edit2 className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              </div>

                              {/* Availability Quick-Toggle Pill / Flagged Break Button */}
                              {isRowUnavailable ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAvailability(row, false);
                                  }}
                                  className="px-1.5 py-0.5 rounded-md bg-slate-800/90 hover:bg-emerald-900/70 border border-amber-500/40 hover:border-emerald-500/50 text-amber-300 hover:text-emerald-200 text-[9px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title={`Marked as ${row.unavailableReason || 'Day Off'}. Click to restore to Active / On Duty.`}
                                >
                                  <CalendarOff className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                  <span className="truncate max-w-[65px]">{row.unavailableReason || 'Day Off'}</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">
                                  {isFlagged && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAutoScheduleBreak(row.id);
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-[9px] font-bold text-white shadow-xs cursor-pointer inline-flex items-center gap-0.5 transition-colors"
                                      title={`Add 30m break at ${analysis.suggestedSlot || '12:00 - 12:30'}\n${analysis.violationMessage}`}
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>+Break</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleAvailability(row, true, 'Day Off');
                                    }}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer text-[9px]"
                                    title="Mark assistant as Day Off / Unavailable"
                                  >
                                    <CalendarOff className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Staff Specialized Skills Tags (Prominently displayed) */}
                          <div className="flex items-center gap-1 pl-7 flex-wrap pt-0.5">
                            {Array.isArray(row.skills) && row.skills.length > 0 ? (
                              row.skills.map((skill) => (
                                <span
                                  key={skill}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenStaffMetadata(row);
                                  }}
                                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border flex items-center gap-0.5 cursor-pointer transition-all hover:scale-105 shadow-2xs ${getSkillBadgeStyle(skill)}`}
                                  title={`Skill: ${skill} (Click to manage profile & skills)`}
                                >
                                  <Award className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                  <span className="truncate max-w-[85px]">{skill}</span>
                                </span>
                              ))
                            ) : null}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStaffMetadata(row);
                              }}
                              className="text-[9px] text-purple-400/90 hover:text-purple-200 hover:bg-purple-950/70 px-1.5 py-0.2 rounded border border-purple-800/50 transition-all inline-flex items-center gap-0.5 opacity-70 hover:opacity-100 cursor-pointer shadow-2xs"
                              title="Manage staff profile & skills (e.g. 'Senior', 'First Aid', 'Bilingual')"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{(!row.skills || row.skills.length === 0) ? '+ Skill' : '+'}</span>
                            </button>
                          </div>

                          {/* Staff Custom Notes / Metadata Tags Edit & Display */}
                          {editingNotesStaffId === row.id ? (
                            <div className="flex items-center gap-1 w-full pl-7 mt-0.5">
                              <Tag className="w-3 h-3 text-blue-400 shrink-0" />
                              <input
                                type="text"
                                value={editingNotesText}
                                onChange={(e) => setEditingNotesText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveStaffNotes(row.id);
                                  if (e.key === 'Escape') setEditingNotesStaffId(null);
                                }}
                                placeholder="e.g. Requires quiet environment, Part-time"
                                autoFocus
                                className="w-full bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-[10.5px] text-blue-200 placeholder-slate-600 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveStaffNotes(row.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                title="Save Notes/Tags"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingNotesStaffId(null)}
                                className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : row.notes ? (
                            <div className="flex items-center gap-1 pl-7 flex-wrap">
                              <div 
                                onClick={() => handleStartEditNotes(row)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-950/70 hover:bg-blue-900 border border-blue-800/80 text-[9.5px] text-blue-300 font-medium cursor-pointer transition-colors group"
                                title={`Custom staff notes: "${row.notes}" (Click to edit)`}
                              >
                                <Tag className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                                <span className="truncate max-w-[125px]">{row.notes}</span>
                                <Edit2 className="w-2 h-2 opacity-0 group-hover:opacity-100 text-blue-300 shrink-0" />
                              </div>
                            </div>
                          ) : null}

                          {/* Sub-label for overlapping activity conflicts */}
                          {!editingStaffId && !isRowUnavailable && hasRowConflicts && (
                            <div className="text-[9.5px] text-rose-300 font-semibold flex items-center gap-1 pl-7">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0 animate-pulse" />
                              <span className="truncate" title={`${rowConflictCount} overlapping / conflicting shift activity assignment(s)`}>
                                {rowConflictCount} Activity Clash{rowConflictCount > 1 ? 'es' : ''}
                              </span>
                            </div>
                          )}

                          {/* Sub-label for break compliance */}
                          {!editingStaffId && !isRowUnavailable && !hasRowConflicts && isFlagged && (
                            <div className="text-[9.5px] text-amber-300 font-medium flex items-center gap-1 pl-7">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span className="truncate" title={analysis.violationMessage}>
                                {analysis.totalBreakMinutes === 0 ? 'No 30m Break (0m)' : `Short Break (${analysis.totalBreakMinutes}m/30m)`}
                              </span>
                            </div>
                          )}

                          {/* Sub-label for Workload Distribution Fairness & Scheduled Hours */}
                          {!editingStaffId && !isRowUnavailable && !hasRowConflicts && !isFlagged && (
                            <div className="text-[9.5px] text-slate-400 font-medium flex items-center gap-1 pl-7">
                              <Scale className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                              <span className="truncate" title={`Total Scheduled: ${totalHours.toFixed(1)}h (${workloadAnalysis?.fairnessLabel || ''})`}>
                                {totalHours > 0 
                                  ? `${totalHours.toFixed(1)}h · ${workloadAnalysis?.fairnessStatus === 'balanced' ? 'Balanced' : workloadAnalysis?.fairnessStatus === 'above_average' ? '+Load' : 'Light'}` 
                                  : 'Off (0h)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 23 Time Slot Cells */}
                      {TIME_SLOTS.map((slot) => {
                        const cellValue = row.slots[slot] || '';
                        const display = getCellDisplayInfo(cellValue);
                        const isEditingThis = activeCellEdit?.staffId === row.id && activeCellEdit?.slot === slot;
                        const conflict = !isRowUnavailable ? conflictReport.conflictMap[row.id]?.[slot] : undefined;
                        const isConflicting = Boolean(conflict?.isConflicting);

                        if (isRowUnavailable) {
                          return (
                            <td
                              key={slot}
                              onClick={() => handleCellClick(row.id, slot)}
                              onDoubleClick={() => handleCellDoubleClick(row.id, slot, cellValue)}
                              onContextMenu={(e) => handleRowContextMenu(e, row, slot)}
                              className="p-1 border-r border-slate-900/80 text-center transition-all cursor-not-allowed h-10 min-w-[95px] max-w-[110px] relative bg-slate-950/80 hover:bg-slate-900/50 opacity-60 select-none"
                              title={`${row.name} is on ${row.unavailableReason || 'Day Off'}. Accidental duty assignments are disabled.`}
                            >
                              <div className="w-full h-full flex items-center justify-center p-0.5 rounded text-[9.5px] font-medium text-slate-600 bg-slate-950/50 border border-slate-900/60">
                                {cellValue ? (
                                  <span className="line-through text-slate-600 truncate">{display?.text || cellValue}</span>
                                ) : (
                                  <span className="text-slate-600/70 text-[9px]">OFF</span>
                                )}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={slot}
                            onClick={() => handleCellClick(row.id, slot)}
                            onDoubleClick={() => handleCellDoubleClick(row.id, slot, cellValue)}
                            onContextMenu={(e) => handleRowContextMenu(e, row, slot)}
                            className={`p-1 border-r border-slate-800/80 text-center transition-all cursor-pointer h-10 min-w-[95px] max-w-[110px] relative ${
                              isConflicting
                                ? 'bg-rose-950/90 hover:bg-rose-900/90 border-rose-500 ring-2 ring-rose-500 shadow-md shadow-rose-950/80 z-10'
                                : display 
                                ? `${display.bgColor} hover:ring-1 hover:ring-blue-400/50` 
                                : 'hover:bg-slate-800/30 hover:ring-1 hover:ring-blue-400/50'
                            }`}
                            title={
                              isConflicting
                                ? `🚨 CONFLICT: ${conflict.title}\n${conflict.description}\nSlot: ${slot}\nStaff: ${row.name}\n\nTip: Double-click to edit duty or right-click to clear/paste.`
                                : `Right-click to copy/paste shift block\nDouble-click to edit duty\nSlot: ${slot}\nValue: ${cellValue || 'Empty'}`
                            }
                          >
                            {/* Conflicting cell top-corner alert badge */}
                            {isConflicting && !isEditingThis && (
                              <div
                                className="absolute -top-1.5 -right-1.5 z-20 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg ring-1 ring-white/80 animate-bounce"
                                style={{ animationDuration: '2s' }}
                                title={`🚨 Conflict: ${conflict.title}\n${conflict.description}`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}

                            {isEditingThis ? (
                              <div
                                className="absolute inset-0 z-30 p-0.5 bg-slate-900"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={cellInputValue}
                                  onChange={(e) => setCellInputValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellEditSave();
                                    if (e.key === 'Escape') setActiveCellEdit(null);
                                  }}
                                  onBlur={handleCellEditSave}
                                  autoFocus
                                  className="w-full h-full bg-slate-950 border border-blue-500 rounded text-[10px] px-1 text-white focus:outline-none"
                                />
                              </div>
                            ) : isConflicting ? (
                              <div
                                className="w-full h-full flex items-center justify-center p-0.5 rounded text-[10px] font-bold leading-tight line-clamp-2 break-words border border-rose-500 bg-rose-600/40 text-rose-100 ring-1 ring-rose-400/50 shadow-inner"
                              >
                                <span className="truncate">{display?.text || cellValue}</span>
                              </div>
                            ) : display ? (
                              <div
                                className={`w-full h-full flex items-center justify-center p-0.5 rounded text-[10px] font-bold leading-tight line-clamp-2 break-words border ${display.borderColor} ${display.textColor}`}
                              >
                                {display.text}
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center relative text-slate-700 text-[10px] group/empty">
                                <span className="group-hover/empty:opacity-0 transition-opacity">&mdash;</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSmartSuggestForSlot(row.id, row.name, slot);
                                  }}
                                  className="absolute inset-0 m-auto w-5 h-5 rounded bg-purple-950/90 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer"
                                  title={`✨ AI Smart Suggest duty for ${row.name} at ${slot}`}
                                >
                                  <Sparkles className="w-3 h-3 text-yellow-300" />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Working Hours & Break duration */}
                      <td 
                        className={`p-2 text-center border-r border-slate-800 font-mono text-xs cursor-help transition-colors ${
                          isRowUnavailable ? 'bg-slate-950/90 text-slate-600' : 'bg-slate-900/60 hover:bg-slate-800/80'
                        }`}
                        title={
                          isRowUnavailable
                            ? `${row.name} is on ${row.unavailableReason || 'Day Off'} (0.0 scheduled hrs)`
                            : `Total Scheduled: ${totalHours.toFixed(1)}h\nTeam Avg: ${workloadReport.teamAverageHours.toFixed(1)}h\nWorkload Status: ${workloadAnalysis?.fairnessLabel || ''}\nScheduled Break: ${analysis?.totalBreakMinutes || 0} mins`
                        }
                      >
                        <div className={`font-bold ${
                          isRowUnavailable
                            ? 'text-slate-600'
                            : totalHours > 8.5 
                            ? 'text-rose-400 font-black' 
                            : totalHours >= 7.0 
                            ? 'text-emerald-400' 
                            : totalHours > 0 
                            ? 'text-sky-300' 
                            : 'text-slate-500'
                        }`}>
                          {totalHours.toFixed(1)}h
                        </div>
                        <div 
                          className={`text-[9px] flex items-center justify-center gap-0.5 mt-0.5 ${
                            isRowUnavailable
                              ? 'text-slate-600 font-medium'
                              : hasRowConflicts
                              ? 'text-rose-400 font-bold'
                              : isFlagged 
                              ? 'text-amber-400 font-bold' 
                              : 'text-slate-400'
                          }`}
                          title={
                            isRowUnavailable
                              ? 'Day Off'
                              : hasRowConflicts
                              ? `${rowConflictCount} conflicting duty assignment(s)`
                              : `Scheduled Break: ${analysis?.totalBreakMinutes || 0} mins`
                          }
                        >
                          {isRowUnavailable ? (
                            <span>Day Off</span>
                          ) : hasRowConflicts ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                              <span className="text-rose-300">{rowConflictCount} clash</span>
                            </>
                          ) : (
                            <>
                              <Coffee className="w-2.5 h-2.5" />
                              <span>{analysis?.totalBreakMinutes || 0}m</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Actions (Toggle Availability / Duplicate / Delete / Context Menu trigger) */}
                      <td className="p-1 text-center bg-slate-900/60">
                        <div className="flex items-center justify-center gap-1">
                          {isRowUnavailable ? (
                            <button
                              onClick={() => handleToggleAvailability(row, false)}
                              className="p-1 rounded text-amber-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors cursor-pointer"
                              title={`Restore ${row.name} to Active / On Duty`}
                            >
                              <UserCheck className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleAvailability(row, true, 'Day Off')}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title={`Mark ${row.name} as Day Off / Unavailable`}
                            >
                              <CalendarOff className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicateRow(row)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Duplicate Assistant Row"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Assistant"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Coverage Heatmap & Headcount */}
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700 text-xs font-bold">
                <td className="p-2.5 sticky left-0 z-20 bg-slate-950 border-r border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200">Active Staff Count</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Min: {rota.targetMinCoverage})
                    </span>
                  </div>
                </td>

                {coverageStats.map(({ slot, working }) => {
                  const isUnderstaffed = working < rota.targetMinCoverage;
                  const isOptimal = working >= rota.targetMinCoverage;

                  return (
                    <td
                      key={slot}
                      className={`p-1 text-center font-mono border-r border-slate-800/80 transition-colors min-w-[95px] max-w-[110px] ${
                        isUnderstaffed
                          ? 'bg-rose-950/70 text-rose-300'
                          : isOptimal
                          ? 'bg-emerald-950/50 text-emerald-300'
                          : 'text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">{working}</div>
                    </td>
                  );
                })}

                <td className="p-2 text-center border-r border-slate-800 font-mono text-emerald-400 text-xs bg-slate-950">
                  {(coverageStats.reduce((acc, c) => acc + c.working * getSlotDurationHours(c.slot), 0)).toFixed(1)}h
                </td>
                <td className="p-1 bg-slate-950"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Staff Workload Distribution Hover Tooltip */}
      {hoveredStaffRowId && hoverMousePos && !contextMenu?.isOpen && workloadReport.staffAnalyses[hoveredStaffRowId] && (
        <StaffWorkloadTooltip
          analysis={workloadReport.staffAnalyses[hoveredStaffRowId]}
          skills={rota.rows.find(r => r.id === hoveredStaffRowId)?.skills}
          notes={rota.rows.find(r => r.id === hoveredStaffRowId)?.notes}
          isFlaggedBreak={breakReport.allAnalyses[hoveredStaffRowId]?.isFlagged}
          breakViolationMessage={breakReport.allAnalyses[hoveredStaffRowId]?.violationMessage}
          hasConflicts={(conflictReport.staffConflictCounts[hoveredStaffRowId] || 0) > 0}
          conflictCount={conflictReport.staffConflictCounts[hoveredStaffRowId] || 0}
          position={hoverMousePos}
        />
      )}

      {/* Right Click Context Menu */}
      <RotaContextMenu
        menuState={contextMenu}
        onClose={() => setContextMenu(null)}
        copiedShift={copiedShift}
        onCopyRowShift={handleCopyRowShift}
        onPasteRowShift={handlePasteRowShift}
        onClearRowShifts={handleClearRowShifts}
        onDuplicateRow={handleDuplicateRow}
        onRenameRow={handleStartEditName}
        onScheduleBreak={handleAutoScheduleBreak}
        onApplyShiftPattern={handleApplyShiftPattern}
        onToggleAvailability={handleToggleAvailability}
        onCopySingleCell={handleCopySingleCell}
        onPasteSingleCell={handlePasteSingleCell}
        copiedSingleCell={copiedSingleCell}
        onOpenSmartSuggest={handleOpenSmartSuggestForSlot}
        onEditNotes={handleStartEditNotes}
        onEditProfile={handleOpenStaffMetadata}
      />

      {/* Staff Metadata & Skills Editor Modal */}
      <StaffMetadataModal
        isOpen={Boolean(selectedStaffForMetadata)}
        onClose={() => setSelectedStaffForMetadata(null)}
        staffRow={selectedStaffForMetadata}
        onSaveStaff={handleSaveStaffRowMetadata}
      />

      {/* AI Smart Suggest & Auto Fill Modal */}
      <SmartSuggestModal
        isOpen={isSmartSuggestOpen}
        onClose={() => setIsSmartSuggestOpen(false)}
        rota={rota}
        setRota={setRota}
        initialSlot={smartSuggestInitialSlot}
      />
    </div>
  );
};
