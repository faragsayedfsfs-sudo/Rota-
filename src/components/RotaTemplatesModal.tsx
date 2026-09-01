import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookmarkCheck, 
  Bookmark, 
  Sparkles, 
  Sun, 
  Moon, 
  Flame, 
  Clock, 
  Layers, 
  Check, 
  Trash2, 
  Download, 
  Upload, 
  Copy, 
  Edit3, 
  Search, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Coffee, 
  AlertCircle, 
  HelpCircle,
  FolderDown,
  FileJson
} from 'lucide-react';
import { RotaConfig, RotaTemplate, StaffRow, StaffShiftPattern } from '../types';
import { 
  getAllRotaTemplates, 
  getAllStaffShiftPatterns, 
  saveRotaAsTemplate, 
  deleteCustomTemplate, 
  updateCustomTemplate,
  exportTemplatesAsJson, 
  importTemplatesFromJson, 
  applyTemplateToRota, 
  applyStaffPatternToRow,
  ApplyTemplateMode
} from '../utils/templateManager';
import { SLOT_GROUPS, TIME_SLOTS } from '../constants/activities';

interface RotaTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
  initialTab?: 'full_templates' | 'staff_patterns' | 'save_current';
}

export const RotaTemplatesModal: React.FC<RotaTemplatesModalProps> = ({
  isOpen,
  onClose,
  rota,
  setRota,
  initialTab = 'full_templates'
}) => {
  const [activeTab, setActiveTab] = useState<'full_templates' | 'staff_patterns' | 'save_current' | 'import_export'>(initialTab);
  
  // Search & Category filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Previewed Template
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Apply Mode
  const [applyMode, setApplyMode] = useState<ApplyTemplateMode>('pattern_only');

  // Notification / Toast inside modal
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Save Template Form State
  const [saveName, setSaveName] = useState<string>('');
  const [saveDescription, setSaveDescription] = useState<string>('');
  const [saveCategory, setSaveCategory] = useState<RotaTemplate['category']>('custom');
  const [saveTag, setSaveTag] = useState<string>('Custom Shift');

  // Staff Pattern Assignment State
  const [targetStaffId, setTargetStaffId] = useState<string>(rota.rows[0]?.id || '');
  const [patternMergeOnly, setPatternMergeOnly] = useState<boolean>(false);

  // Import JSON State
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Refresh trigger for local custom template updates
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Load templates and patterns
  const allTemplates = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey;
    return getAllRotaTemplates();
  }, [refreshKey]);

  const allStaffPatterns = useMemo(() => {
    return getAllStaffShiftPatterns();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  if (!isOpen) return null;

  // Filter templates
  const filteredTemplates = allTemplates.filter(t => {
    const matchesSearch = searchQuery.trim() === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === 'all' || 
      (selectedCategoryFilter === 'custom' && !t.isBuiltIn) ||
      t.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Handle Apply Full Template
  const handleApplyTemplate = (template: RotaTemplate) => {
    const updatedRota = applyTemplateToRota(rota, template, applyMode);
    setRota(updatedRota);
    showToast(`Successfully applied "${template.name}" (${applyMode === 'full_replace' ? 'Full Replace' : applyMode === 'pattern_only' ? 'Shift Patterns' : 'Filled Empty Slots'})!`, 'success');
  };

  // Handle Save Current Rota
  const handleSaveCurrentRota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    const saved = saveRotaAsTemplate(
      rota,
      saveName.trim(),
      saveDescription.trim(),
      saveCategory,
      saveTag.trim() || 'Custom'
    );

    setRefreshKey(prev => prev + 1);
    setSaveName('');
    setSaveDescription('');
    showToast(`Template "${saved.name}" successfully saved to your template library!`, 'success');
    setActiveTab('full_templates');
  };

  // Handle Delete Custom Template
  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (window.confirm(`Are you sure you want to delete the custom template "${templateName}"?`)) {
      const deleted = deleteCustomTemplate(templateId);
      if (deleted) {
        setRefreshKey(prev => prev + 1);
        if (previewTemplateId === templateId) {
          setPreviewTemplateId(null);
        }
        showToast(`Template "${templateName}" deleted.`, 'info');
      }
    }
  };

  // Handle Apply Staff Pattern to single staff
  const handleApplyStaffPattern = (pattern: StaffShiftPattern) => {
    if (!targetStaffId) {
      showToast('Please select a target assistant first', 'error');
      return;
    }

    const targetStaff = rota.rows.find(r => r.id === targetStaffId);
    if (!targetStaff) return;

    const updatedRows = rota.rows.map(r => {
      if (r.id === targetStaffId) {
        return applyStaffPatternToRow(r, pattern, patternMergeOnly);
      }
      return r;
    });

    setRota(prev => ({
      ...prev,
      rows: updatedRows
    }));

    showToast(`Applied "${pattern.name}" pattern to ${targetStaff.name}!`, 'success');
  };

  // Handle Apply Staff Pattern to ALL staff
  const handleApplyStaffPatternToAll = (pattern: StaffShiftPattern) => {
    if (window.confirm(`Apply "${pattern.name}" pattern to ALL ${rota.rows.length} assistants on the roster?`)) {
      const updatedRows = rota.rows.map(r => applyStaffPatternToRow(r, pattern, patternMergeOnly));
      setRota(prev => ({
        ...prev,
        rows: updatedRows
      }));
      showToast(`Applied "${pattern.name}" to all assistants!`, 'success');
    }
  };

  // Handle Export JSON Download
  const handleDownloadExport = () => {
    const jsonStr = exportTemplatesAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tca_rota_templates_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Templates exported to JSON file', 'success');
  };

  // Handle Import JSON
  const handleProcessImport = () => {
    if (!importJsonText.trim()) {
      setImportError('Please paste JSON template data or upload a file.');
      return;
    }
    const result = importTemplatesFromJson(importJsonText);
    if (result.error) {
      setImportError(result.error);
    } else {
      setImportError(null);
      setImportJsonText('');
      setRefreshKey(prev => prev + 1);
      showToast(`Successfully imported ${result.importedCount} template(s)!`, 'success');
      setActiveTab('full_templates');
    }
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        setImportError(null);
      }
    };
    reader.readAsText(file);
  };

  const previewTemplate = allTemplates.find(t => t.id === previewTemplateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-850 px-5 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Rota Shift Templates &amp; Patterns
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 hidden sm:inline">
                  {allTemplates.length} Templates Available
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Load curated shift patterns (Early Shift, Late Shift, Weekend Peak) or save your own
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toast / Notification */}
        {notification && (
          <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b transition-all ${
            notification.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
            notification.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
            'bg-blue-950 text-blue-200 border-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-900 border-b border-slate-800 px-5 sm:px-6 flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center space-x-1 sm:space-x-2 border-b border-transparent">
            <button
              onClick={() => setActiveTab('full_templates')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'full_templates'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Day Templates</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {allTemplates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('staff_patterns')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'staff_patterns'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Shift Patterns</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {allStaffPatterns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('save_current')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'save_current'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Current Rota</span>
            </button>

            <button
              onClick={() => setActiveTab('import_export')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'import_export'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Backup &amp; Share</span>
            </button>
          </div>

          {/* Quick Apply Mode Selector (shown on full templates tab) */}
          {activeTab === 'full_templates' && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-slate-400">
              <span className="hidden md:inline text-[11px]">Apply Mode:</span>
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setApplyMode('pattern_only')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-all ${
                    applyMode === 'pattern_only' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Keep existing assistant names and IDs, apply duty pattern down the roster"
                >
                  Keep Staff Names
                </button>
                <button
                  onClick={() => setApplyMode('full_replace')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-all ${
                    applyMode === 'full_replace' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Completely overwrite all assistants and names with template structure"
                >
                  Full Replace
                </button>
                <button
                  onClick={() => setApplyMode('merge_fill_empty')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-all ${
                    applyMode === 'merge_fill_empty' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Only populate empty cells with template duties"
                >
                  Fill Blanks
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Full Day Templates */}
        {activeTab === 'full_templates' && (
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* Search & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search templates (e.g. Early, Weekend, Skeleton, Custom)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'early_shift', label: 'Early Shift' },
                  { id: 'late_shift', label: 'Late Shift' },
                  { id: 'weekend_peak', label: 'Weekend Peak' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'custom', label: 'My Saved' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => {
                const isPreviewing = previewTemplateId === template.id;

                const getCategoryBadge = (cat: RotaTemplate['category']) => {
                  switch (cat) {
                    case 'early_shift':
                      return { bg: 'bg-sky-950/80 text-sky-300 border-sky-600/40', icon: Sun, label: 'Early Shift (Morning)' };
                    case 'late_shift':
                      return { bg: 'bg-purple-950/80 text-purple-300 border-purple-600/40', icon: Moon, label: 'Late Shift (Evening)' };
                    case 'weekend_peak':
                      return { bg: 'bg-amber-950/80 text-amber-300 border-amber-600/40', icon: Flame, label: 'Weekend Peak' };
                    case 'skeleton':
                      return { bg: 'bg-slate-800 text-slate-300 border-slate-600', icon: ShieldCheck, label: 'Skeleton Crew' };
                    case 'standard':
                      return { bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40', icon: Clock, label: 'Standard Weekday' };
                    default:
                      return { bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-600/40', icon: Bookmark, label: template.tag || 'Custom' };
                  }
                };

                const badge = getCategoryBadge(template.category);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={template.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isPreviewing 
                        ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500/40 shadow-lg' 
                        : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/70'
                    }`}
                  >
                    <div>
                      {/* Top Badges & Meta */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {template.isBuiltIn ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                              Built-in
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono">
                                Custom
                              </span>
                              <button
                                onClick={() => handleDeleteTemplate(template.id, template.name)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Delete custom template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-bold text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-3">
                        {template.description}
                      </p>

                      {/* Stats Pills */}
                      <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span>{template.staffCount} Assistants</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{template.totalHours} Total Hours</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          <span>Min {template.targetMinCoverage} Active</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => setPreviewTemplateId(isPreviewing ? null : template.id)}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {isPreviewing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isPreviewing ? 'Hide Preview' : 'Preview Staff'}</span>
                      </button>

                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                        title={`Apply this template using ${applyMode === 'full_replace' ? 'Full Replace' : applyMode === 'pattern_only' ? 'Shift Patterns' : 'Fill Blanks'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply Template</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No templates found</p>
                <p className="text-xs text-slate-500 mt-1">Try changing your search terms or filter.</p>
              </div>
            )}

            {/* In-Line Preview Drawer (if a template is selected) */}
            {previewTemplate && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-blue-500/40 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Previewing Template: <span className="text-blue-300">{previewTemplate.name}</span>
                    </h4>
                  </div>
                  <button
                    onClick={() => setPreviewTemplateId(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close Preview &times;
                  </button>
                </div>

                <div className="overflow-x-auto max-h-48 rounded-lg border border-slate-800 bg-slate-900/60 p-2">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="p-1 font-bold">Assistant</th>
                        <th className="p-1 font-bold">First Slot (09:00 - 12:00)</th>
                        <th className="p-1 font-bold">Prayer Break (12:00 - 01:00)</th>
                        <th className="p-1 font-bold">Second Slot (01:00 - 03:30)</th>
                        <th className="p-1 font-bold">Third Slot (03:30 - 06:30)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {previewTemplate.rows.slice(0, 8).map((row, rIdx) => {
                        const firstSlotDuty = row.slots['09:30 - 10:00'] || row.slots['09:00 - 09:15'] || '—';
                        const prayerSlotDuty = row.slots['12:00 - 12:30'] || row.slots['12:30 - 12:45'] || '—';
                        const secondSlotDuty = row.slots['01:00 - 01:30'] || row.slots['02:00 - 02:30'] || '—';
                        const thirdSlotDuty = row.slots['04:00 - 04:30'] || row.slots['05:00 - 05:30'] || '—';

                        return (
                          <tr key={rIdx} className="hover:bg-slate-800/40">
                            <td className="p-1 font-semibold text-white truncate max-w-[120px]">{row.name}</td>
                            <td className="p-1 text-slate-300 truncate max-w-[140px]">{firstSlotDuty}</td>
                            <td className="p-1 text-slate-300 truncate max-w-[140px]">{prayerSlotDuty}</td>
                            <td className="p-1 text-slate-300 truncate max-w-[140px]">{secondSlotDuty}</td>
                            <td className="p-1 text-slate-300 truncate max-w-[140px]">{thirdSlotDuty}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {previewTemplate.rows.length > 8 && (
                    <p className="text-[10px] text-slate-500 text-center mt-1">
                      + {previewTemplate.rows.length - 8} more assistants in this template
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => handleApplyTemplate(previewTemplate)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply This Template Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Staff Shift Patterns */}
        {activeTab === 'staff_patterns' && (
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* Target Assistant Picker Toolbar */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-white">Target Assistant:</span>
                <select
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {rota.rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name} ({row.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patternMergeOnly}
                    onChange={(e) => setPatternMergeOnly(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Fill blank slots only (do not overwrite existing duties)</span>
                </label>
              </div>
            </div>

            {/* Pattern Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {allStaffPatterns.map((pattern) => {
                const isEarly = pattern.category === 'early';
                const isLate = pattern.category === 'late';
                const isPeak = pattern.category === 'peak';

                const IconComponent = isEarly ? Sun : isLate ? Moon : isPeak ? Flame : Clock;

                return (
                  <div
                    key={pattern.id}
                    className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/70 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
                          style={{
                            backgroundColor: `${pattern.color || '#3b82f6'}20`,
                            color: pattern.color || '#38bdf8',
                            border: `1px solid ${pattern.color || '#3b82f6'}40`
                          }}
                        >
                          <IconComponent className="w-3 h-3" />
                          <span>{pattern.shiftWindow}</span>
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                          <span className="text-emerald-400 font-bold">{pattern.totalHours}h active</span>
                          <span>&bull;</span>
                          <span className="text-amber-300 font-semibold">{pattern.breakMinutes}m break</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1">
                        {pattern.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {pattern.description}
                      </p>

                      {/* Visual Duty Snippet */}
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                        <span>Includes:</span>
                        <span className="text-blue-300 font-medium truncate max-w-[240px]">
                          {Object.values(pattern.slots).filter(Boolean).slice(0, 3).join(', ')}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-700/60">
                      <button
                        onClick={() => handleApplyStaffPatternToAll(pattern)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                        title="Apply this exact pattern to all assistants in the rota"
                      >
                        Apply to All Staff
                      </button>

                      <button
                        onClick={() => handleApplyStaffPattern(pattern)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Apply to Selected</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Save Current Rota as Template */}
        {activeTab === 'save_current' && (
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
            <form onSubmit={handleSaveCurrentRota} className="max-w-xl mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-3">
                <Bookmark className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Save Current Rota as Reusable Template</p>
                  <p className="text-blue-300/90 mt-0.5 leading-relaxed">
                    This captures the current roster of {rota.rows.length} assistants, all duty assignments, and break intervals as a template in your library so you can reapply it anytime.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Friday Peak Schedule, Summer Morning Shift, Exam Day Roster"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pattern Category
                  </label>
                  <select
                    value={saveCategory}
                    onChange={(e) => setSaveCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="early_shift">Early Shift (Morning Focus)</option>
                    <option value="late_shift">Late Shift (Evening Focus)</option>
                    <option value="weekend_peak">Weekend Peak (High Footfall)</option>
                    <option value="standard">Standard Weekday</option>
                    <option value="skeleton">Skeleton Crew</option>
                    <option value="custom">Custom Pattern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tag / Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend Event, High Footfall"
                    value={saveTag}
                    onChange={(e) => setSaveTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Operational Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe when this template is best used (e.g. High arrival traffic, 6 classrooms active, extra floor security)..."
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Rota Summary Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-around text-xs">
                <div className="text-center">
                  <div className="text-slate-400 font-medium">Assistants</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{rota.rows.length}</div>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div className="text-center">
                  <div className="text-slate-400 font-medium">Time Slots</div>
                  <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">{TIME_SLOTS.length}</div>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div className="text-center">
                  <div className="text-slate-400 font-medium">Min Coverage</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{rota.targetMinCoverage} Staff</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('full_templates')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Save to Template Library</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Backup & Share (Import/Export) */}
        {activeTab === 'import_export' && (
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-w-2xl mx-auto">
            {/* Export Section */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderDown className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Export Templates to JSON File
                  </h3>
                </div>
                <button
                  onClick={handleDownloadExport}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JSON Backup</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Exports all built-in and user-created custom shift templates into a portable file for backup or sharing with team supervisors.
              </p>
            </div>

            {/* Import Section */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Import Templates from File or Paste
                  </h3>
                </div>

                <label className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {importError && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <textarea
                rows={5}
                placeholder="Or paste template JSON text here..."
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportError(null);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
              />

              <div className="flex justify-end">
                <button
                  disabled={!importJsonText.trim()}
                  onClick={handleProcessImport}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Import Templates into Library</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-850 px-5 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-blue-400" />
            <span>Templates persist automatically in local browser storage.</span>
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
