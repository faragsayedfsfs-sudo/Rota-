import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  FolderSearch, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw,
  FileCheck,
  AlertTriangle,
  LogIn
} from 'lucide-react';
import { RotaConfig, GoogleSpreadsheetMeta, StaffRow } from '../types';
import { 
  createGoogleSheetRota, 
  updateGoogleSheetRota, 
  listRecentSpreadsheets, 
  importFromGoogleSheet 
} from '../services/googleSheetsService';
import { User } from 'firebase/auth';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
  currentUser: User | null;
  hasGoogleAuth: boolean;
  onGoogleSignIn: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  rota,
  setRota,
  currentUser,
  hasGoogleAuth,
  onGoogleSignIn
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'update' | 'import'>('create');
  const [sheetTitle, setSheetTitle] = useState(`${rota.title} (${rota.date})`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [recentSheets, setRecentSheets] = useState<GoogleSpreadsheetMeta[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [customSheetId, setCustomSheetId] = useState<string>('');
  const [loadingDrive, setLoadingDrive] = useState(false);

  // Destructive Confirmation Dialog State (Mandatory per Workspace Skill Guidelines)
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);
  const [sheetNameToUpdate, setSheetNameToUpdate] = useState('Daily Rota');

  useEffect(() => {
    if (isOpen && hasGoogleAuth) {
      loadDriveSheets();
    }
  }, [isOpen, hasGoogleAuth]);

  useEffect(() => {
    setSheetTitle(`${rota.title} (${rota.date})`);
  }, [rota.title, rota.date]);

  const loadDriveSheets = async () => {
    setLoadingDrive(true);
    setError(null);
    try {
      const sheets = await listRecentSpreadsheets();
      setRecentSheets(sheets);
      if (sheets.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sheets[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDrive(false);
    }
  };

  if (!isOpen) return null;

  // 1. Handle Export to Brand New Google Sheet
  const handleCreateNewSheet = async () => {
    setLoading(true);
    setError(null);
    setSuccessUrl(null);
    try {
      const result = await createGoogleSheetRota(rota, sheetTitle.trim());
      setSuccessUrl(result.url);
      loadDriveSheets();
    } catch (err: any) {
      setError(err.message || 'Failed to create Google Sheet');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Update Existing Google Sheet (Triggered after user confirmation)
  const handleConfirmUpdateSheet = async () => {
    const targetId = customSheetId.trim() || selectedSheetId;
    if (!targetId) {
      setError('Please select or specify a Google Spreadsheet ID');
      return;
    }

    setLoading(true);
    setError(null);
    setShowConfirmUpdateModal(false);
    try {
      await updateGoogleSheetRota(targetId, rota, sheetNameToUpdate.trim() || 'Daily Rota');
      setSuccessUrl(`https://docs.google.com/spreadsheets/d/${targetId}/edit`);
    } catch (err: any) {
      setError(err.message || 'Failed to update Google Sheet');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Import from Google Sheet
  const handleImportSheet = async () => {
    const targetId = customSheetId.trim() || selectedSheetId;
    if (!targetId) {
      setError('Please select or enter a Google Spreadsheet ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const importedRows: StaffRow[] = await importFromGoogleSheet(targetId);
      setRota(prev => ({
        ...prev,
        rows: importedRows
      }));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Google Sheets Integration
              </h2>
              <p className="text-xs text-slate-400">
                Direct export, sync & import with Google Drive
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

        {/* Auth Check Warning if not signed in */}
        {!hasGoogleAuth ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                Sign in with Google to Connect Sheets
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Authorize Google Workspace access to export your 08:30–18:30 TCA Rota directly into formatted Google Sheets spreadsheets with live formulas.
              </p>
            </div>
            <button
              onClick={onGoogleSignIn}
              id="modal-google-signin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 shadow-md transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
              <button
                onClick={() => { setActiveTab('create'); setSuccessUrl(null); }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Create New Sheet</span>
              </button>
              <button
                onClick={() => { setActiveTab('update'); setSuccessUrl(null); }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'update'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Existing</span>
              </button>
              <button
                onClick={() => { setActiveTab('import'); setSuccessUrl(null); }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'import'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Import from Sheet</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successUrl && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/50 text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Spreadsheet ready on Google Drive!</span>
                  </div>
                  <p className="text-slate-300">
                    Your TCA Rota ({rota.rows.length} staff rows & 21 time slots) was synced successfully.
                  </p>
                  <a
                    href={successUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                  >
                    <span>Open in Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Tab 1: Create New */}
              {activeTab === 'create' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Spreadsheet Document Title
                    </label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>What will be exported:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                      <li>21 half-hour time columns: 08:30 to 18:30</li>
                      <li>{rota.rows.length} TCA Staff Members with assigned shift activities</li>
                      <li>Calculated Total Working Hours column per agent</li>
                      <li>Bottom Active Staff Headcount &amp; Coverage Summary Row</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleCreateNewSheet}
                    disabled={loading || !sheetTitle.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Spreadsheet on Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Export to New Google Sheet</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 2: Update Existing */}
              {activeTab === 'update' && (
                <div className="space-y-4">
                  {recentSheets.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Select from your recent Google Drive spreadsheets
                      </label>
                      <select
                        value={selectedSheetId}
                        onChange={(e) => {
                          setSelectedSheetId(e.target.value);
                          setCustomSheetId('');
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {recentSheets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Or enter Spreadsheet ID / URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      value={customSheetId}
                      onChange={(e) => setCustomSheetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Sheet Tab Name
                    </label>
                    <input
                      type="text"
                      value={sheetNameToUpdate}
                      onChange={(e) => setSheetNameToUpdate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => setShowConfirmUpdateModal(true)}
                    disabled={loading || (!selectedSheetId && !customSheetId.trim())}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Spreadsheet...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Update Existing Sheet</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 3: Import from Sheet */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  {recentSheets.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Select from your Google Drive spreadsheets
                      </label>
                      <select
                        value={selectedSheetId}
                        onChange={(e) => {
                          setSelectedSheetId(e.target.value);
                          setCustomSheetId('');
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {recentSheets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Or enter Spreadsheet ID
                    </label>
                    <input
                      type="text"
                      placeholder="Paste Spreadsheet ID"
                      value={customSheetId}
                      onChange={(e) => setCustomSheetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                    <p className="text-slate-400 text-[11px]">
                      Imports staff names, 08:30–18:30 intervals, and shift codes into your active workspace.
                    </p>
                  </div>

                  <button
                    onClick={handleImportSheet}
                    disabled={loading || (!selectedSheetId && !customSheetId.trim())}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reading Spreadsheet Data...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-4 h-4" />
                        <span>Load Rota into Grid</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Explicit Confirmation Dialog for Updating Workspace Data */}
      {showConfirmUpdateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-amber-600/50 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-100 animate-in fade-in duration-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Confirm Google Sheet Update
                </h3>
                <p className="text-xs text-slate-400">
                  You are about to modify existing spreadsheet data
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              This will overwrite the contents of sheet <span className="font-semibold text-amber-400">'{sheetNameToUpdate}'</span> in spreadsheet <span className="font-mono text-slate-200">{customSheetId || selectedSheetId}</span> with the current {rota.rows.length} TCA shift rows.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmUpdateModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdateSheet}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-colors cursor-pointer"
              >
                Yes, Update Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
