import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { ActivityPalette } from './components/ActivityPalette';
import { RotaGrid } from './components/RotaGrid';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { BulkScheduleModal } from './components/BulkScheduleModal';
import { CsvModal } from './components/CsvModal';
import { PrintViewModal } from './components/PrintViewModal';
import { MandatoryBreaksModal } from './components/MandatoryBreaksModal';
import { RotaTemplatesModal } from './components/RotaTemplatesModal';
import { RotaConfig, StaffRow, ShiftActivity } from './types';
import { ACTIVITIES } from './constants/activities';
import { createDefaultRota, createDefaultStaffRow } from './constants/defaultRota';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import { calculateSlotCoverage } from './services/googleSheetsService';
import { analyzeRotaBreaks, autoScheduleAllMissingBreaks } from './utils/breakCompliance';
import { detectRotaConflicts } from './utils/conflictDetection';
import { AlertCircle, Plus, Coffee, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';

const STORAGE_KEY = 'tca_assistant_rota_format_v2';
const ACTIVITIES_STORAGE_KEY = 'tca_custom_activities_v1';

export default function App() {
  // Customized activities palette state
  const [activities, setActivities] = useState<ShiftActivity[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading custom activities:', e);
    }
    return ACTIVITIES;
  });

  // Rota State (Initialized from LocalStorage or default assistant rota)
  const [rota, setRota] = useState<RotaConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.rows && parsed.rows.length > 0 && parsed.timeSlots && parsed.timeSlots.length === 23) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved rota:', e);
    }
    return createDefaultRota();
  });

  // Active brush tool
  const [selectedActivityId, setSelectedActivityId] = useState<string>('CORRIDOR');

  // Staff search query filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isMandatoryBreaksModalOpen, setIsMandatoryBreaksModalOpen] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setCurrentUser(user);
        setHasGoogleAuth(true);
      },
      () => {
        setHasGoogleAuth(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Save to LocalStorage whenever rota changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rota));
    } catch (e) {
      console.error('Error persisting rota:', e);
    }
  }, [rota]);

  // Save customized activities whenever they change
  const handleSaveActivities = (newActivities: ShiftActivity[]) => {
    setActivities(newActivities);
    try {
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(newActivities));
    } catch (e) {
      console.error('Error saving activities:', e);
    }
  };

  const handleResetActivities = () => {
    setActivities(ACTIVITIES);
    try {
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
    } catch (e) {
      console.error('Error resetting activities:', e);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setHasGoogleAuth(true);
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setHasGoogleAuth(false);
  };

  // Add a new staff row
  const handleAddStaff = () => {
    const newIndex = rota.rows.length;
    const newStaff = createDefaultStaffRow(newIndex, `TCA ${String(newIndex + 1).padStart(2, '0')}`);
    setRota(prev => ({
      ...prev,
      rows: [...prev.rows, newStaff]
    }));
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('Reset all 24 TCA staff shifts to default template?')) {
      const defaultData = createDefaultRota();
      setRota(defaultData);
    }
  };

  // Calculate understaffed intervals
  const coverage = calculateSlotCoverage(rota.rows);
  const understaffedSlots = coverage.filter(c => c.working < rota.targetMinCoverage);

  // Break compliance analysis
  const breakReport = analyzeRotaBreaks(rota);

  // Overlapping activity conflict analysis
  const conflictReport = detectRotaConflicts(rota);

  const handleAutoFixAllBreaks = () => {
    const { updatedRota, fixedCount } = autoScheduleAllMissingBreaks(rota);
    setRota(updatedRota);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <Header
        rota={rota}
        setRota={setRota}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        hasGoogleAuth={hasGoogleAuth}
        isLoggingIn={isLoggingIn}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
        onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenBulkScheduleModal={() => setIsBulkModalOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenMandatoryBreaksModal={() => setIsMandatoryBreaksModalOpen(true)}
        onAddStaff={handleAddStaff}
        onResetToDefault={handleResetToDefault}
      />

      {/* Activity Paint Palette & Quick Presets */}
      <ActivityPalette
        selectedActivityId={selectedActivityId}
        onSelectActivity={setSelectedActivityId}
        activities={activities}
        onSaveActivities={handleSaveActivities}
        onResetActivities={handleResetActivities}
      />

      {/* Overlapping Activity Conflict Alert Banner */}
      {conflictReport.hasAnyConflicts && (
        <div className="bg-rose-950/95 border-b border-rose-700 px-4 py-2.5 text-xs text-rose-100 shadow-md animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
              <span>
                <strong className="font-bold text-rose-300">Schedule Conflict Alert:</strong>{' '}
                {conflictReport.totalConflicts} overlapping or clashing shift cell(s) detected across {conflictReport.conflictedStaffCount} assistant(s) (highlighted in red in the grid below).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-rose-300/80 hidden md:inline">
                Double-click highlighted cells or right-click to fix
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Breaks Compliance Alert Banner */}
      {breakReport.flaggedCount > 0 && (
        <div className="bg-amber-950/80 border-b border-amber-800/90 px-4 py-2 text-xs text-amber-200 shadow-sm">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="font-bold text-amber-300">Mandatory Breaks Alert:</strong>{' '}
                {breakReport.flaggedCount} assistant(s) on long shifts (&ge; 6–8h) do not have a 30-minute break scheduled ({breakReport.flaggedStaff.map(f => f.staffName).join(', ')}).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAutoFixAllBreaks}
                className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Assign 30m Breaks</span>
              </button>
              <button
                onClick={() => setIsMandatoryBreaksModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-700/60 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                Manage Breaks &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Understaffed Warning Alert (if any slot is below target coverage) */}
      {understaffedSlots.length > 0 && (
        <div className="bg-rose-950/70 border-b border-rose-800/80 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>
                <strong className="font-semibold text-rose-300">Coverage Warning:</strong>{' '}
                {understaffedSlots.length} slot(s) below target minimum of {rota.targetMinCoverage} staff ({understaffedSlots.map(s => `${s.slot}: ${s.working}`).join(', ')})
              </span>
            </div>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="text-[11px] underline font-semibold text-rose-300 hover:text-white cursor-pointer ml-3 shrink-0"
            >
              Auto-Rebalance Shifts
            </button>
          </div>
        </div>
      )}

      {/* Main Rota Spreadsheet Grid */}
      <main className="flex-1 flex flex-col">
        <RotaGrid
          rota={rota}
          setRota={setRota}
          selectedActivityId={selectedActivityId}
          activities={activities}
          searchQuery={searchQuery}
          onOpenMandatoryBreaksModal={() => setIsMandatoryBreaksModalOpen(true)}
          onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        />
      </main>

      {/* Mandatory Breaks Compliance Modal */}
      <MandatoryBreaksModal
        isOpen={isMandatoryBreaksModalOpen}
        onClose={() => setIsMandatoryBreaksModalOpen(false)}
        rota={rota}
        setRota={setRota}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        rota={rota}
        setRota={setRota}
        currentUser={currentUser}
        hasGoogleAuth={hasGoogleAuth}
        onGoogleSignIn={handleGoogleSignIn}
      />

      {/* Rota Shift Templates & Patterns Modal */}
      <RotaTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        rota={rota}
        setRota={setRota}
      />

      {/* Bulk Scheduler Modal */}
      <BulkScheduleModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        rota={rota}
        setRota={setRota}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
      />

      {/* CSV & Excel Exporter/Importer Modal */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        rota={rota}
        setRota={setRota}
      />

      {/* Print / PDF Modal */}
      <PrintViewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        rota={rota}
      />
    </div>
  );
}
