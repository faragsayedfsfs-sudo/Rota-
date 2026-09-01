import React from 'react';
import { User } from 'firebase/auth';
import { 
  Calendar, 
  FileSpreadsheet, 
  Sparkles, 
  Download, 
  Printer, 
  Plus, 
  RotateCcw,
  LogOut,
  Clock,
  ShieldCheck,
  Search,
  X,
  Coffee,
  BookmarkCheck,
  AlertTriangle
} from 'lucide-react';
import { RotaConfig } from '../types';
import { analyzeRotaBreaks } from '../utils/breakCompliance';

interface HeaderProps {
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: User | null;
  hasGoogleAuth: boolean;
  isLoggingIn: boolean;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenBulkScheduleModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenCsvModal: () => void;
  onOpenPrintModal: () => void;
  onOpenMandatoryBreaksModal: () => void;
  onAddStaff: () => void;
  onResetToDefault: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rota,
  setRota,
  searchQuery,
  onSearchChange,
  currentUser,
  hasGoogleAuth,
  isLoggingIn,
  onGoogleSignIn,
  onLogout,
  onOpenGoogleSheetsModal,
  onOpenBulkScheduleModal,
  onOpenTemplatesModal,
  onOpenCsvModal,
  onOpenPrintModal,
  onOpenMandatoryBreaksModal,
  onAddStaff,
  onResetToDefault
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const dateObj = new Date(newDate + 'T00:00:00');
    const dayOfWeek = isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    setRota(prev => ({
      ...prev,
      date: newDate,
      dayOfWeek: dayOfWeek || prev.dayOfWeek,
      title: `TCA Shift Rota - ${dayOfWeek || newDate}`
    }));
  };

  const filteredCount = searchQuery.trim()
    ? rota.rows.filter(r => {
        const q = searchQuery.trim().toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q)
        );
      }).length
    : rota.rows.length;

  const breakReport = analyzeRotaBreaks(rota);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between py-3 gap-3">
          {/* Left Title & Department */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Assistant Shift Rota
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  4 Slot Groups (09:00 – 18:30)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {rota.department} &bull; {rota.rows.length} Assistants
              </p>
            </div>
          </div>

          {/* Center: Search Bar & Date / Min Target Controller */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Staff Search Bar */}
            <div className="relative flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
              <input
                id="staff-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search staff by name or ID..."
                className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full pr-5"
              />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-white rounded transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
              {searchQuery.trim() && (
                <span className="absolute right-7 text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1 rounded border border-blue-800/60">
                  {filteredCount}/{rota.rows.length}
                </span>
              )}
            </div>

            {/* Date Picker */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-inner">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="date"
                value={rota.date}
                onChange={handleDateChange}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-blue-400 ml-1.5 pl-1.5 border-l border-slate-700">
                {rota.dayOfWeek}
              </span>
            </div>

            {/* Min Coverage Target */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <span>Min:</span>
              <input
                type="number"
                min="1"
                max="24"
                value={rota.targetMinCoverage}
                onChange={(e) => setRota(prev => ({ ...prev, targetMinCoverage: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-9 ml-1 bg-slate-900 text-center font-bold text-emerald-400 rounded border border-slate-700 text-xs py-0.5 focus:outline-none focus:border-emerald-500"
                title="Target minimum active staff on duty"
              />
            </div>
          </div>

          {/* Right Actions & Google Auth */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mandatory Breaks Utility Button */}
            <button
              onClick={onOpenMandatoryBreaksModal}
              id="mandatory-breaks-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all border cursor-pointer ${
                breakReport.flaggedCount > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/80 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-600/40'
              }`}
              title="Mandatory Breaks Compliance Manager"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Mandatory Breaks</span>
              {breakReport.flaggedCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 text-[10px] font-bold border border-amber-400/50">
                  {breakReport.flaggedCount} Flagged
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  100%
                </span>
              )}
            </button>

            {/* Google Sheets Sync Button */}
            <button
              onClick={onOpenGoogleSheetsModal}
              id="google-sheets-sync-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Sync or Export directly to Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets</span>
              {hasGoogleAuth && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Rota Templates Button */}
            <button
              onClick={onOpenTemplatesModal}
              id="rota-templates-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Load shift patterns (Early, Late, Weekend Peak) or save current rota"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            {/* Smart Auto-Scheduler */}
            <button
              onClick={onOpenBulkScheduleModal}
              id="auto-schedule-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Schedule helper tools"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill</span>
            </button>

            {/* CSV / Excel Export */}
            <button
              onClick={onOpenCsvModal}
              id="export-csv-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Import or Export CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV/XLSX</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={onOpenPrintModal}
              id="print-rota-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Print Rota Table"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Add Staff */}
            <button
              onClick={onAddStaff}
              id="add-staff-btn"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium transition-colors cursor-pointer"
              title="Add TCA Staff Member"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add TCA</span>
            </button>

            {/* Google Auth Indicator / Login */}
            <div className="pl-2 border-l border-slate-700/80">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full ring-1 ring-emerald-400"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                      {currentUser.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[100px]">
                      {currentUser.displayName || currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onGoogleSignIn}
                  disabled={isLoggingIn}
                  className="gsi-material-button text-xs py-1 px-2.5 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  id="google-signin-btn"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isLoggingIn ? 'Connecting...' : 'Sign in'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
