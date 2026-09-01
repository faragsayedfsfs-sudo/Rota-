import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Upload, 
  FileText, 
  X, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { RotaConfig, StaffRow } from '../types';
import { TIME_SLOTS, SLOT_GROUPS } from '../constants/activities';
import { calculateStaffHours, calculateSlotCoverage, getSlotDurationHours } from '../services/googleSheetsService';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
  setRota: React.Dispatch<React.SetStateAction<RotaConfig>>;
}

export const CsvModal: React.FC<CsvModalProps> = ({
  isOpen,
  onClose,
  rota,
  setRota
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate the exact CSV string matching the user's template specification
  const generateCsv = (): string => {
    // Row 1: Group headers
    const groupHeader = ['\t', 'First slot', '\t\t\t\t\t\t\t', 'Prayer break', '\t\t', 'Second slot', '\t\t\t\t\t', 'Third slot', '\t\t\t\t\t'].join('');
    
    // Row 2: Sub-headers
    const header = `Assistant Name\t${TIME_SLOTS.join('\t')}\tTotal Hours`;
    
    const rows = rota.rows.map(r => {
      const slotValues = TIME_SLOTS.map(slot => r.slots[slot] || '');
      const totalHours = calculateStaffHours(r.slots);
      return `${r.name}\t${slotValues.join('\t')}\t${totalHours.toFixed(2)}`;
    });

    const coverage = calculateSlotCoverage(rota.rows);
    const summary = `Active Staff Count\t${coverage.map(c => c.working).join('\t')}\t${(coverage.reduce((acc, c) => acc + c.working * getSlotDurationHours(c.slot), 0)).toFixed(1)}`;

    return [header, ...rows, summary].join('\n');
  };

  const csvContent = generateCsv();

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent.replace(/\t/g, ',')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Assistant_Shift_Rota_${rota.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const groupHeaderRow = [''];
    SLOT_GROUPS.forEach(g => {
      groupHeaderRow.push(g.name);
      for (let i = 1; i < g.slots.length; i++) groupHeaderRow.push('');
    });
    groupHeaderRow.push('');

    const subHeaderRow = ['Assistant Name', ...TIME_SLOTS, 'Total Hours'];

    const data = rota.rows.map(r => {
      const slotValues = TIME_SLOTS.map(slot => r.slots[slot] || '');
      const totalHours = calculateStaffHours(r.slots);
      return [r.name, ...slotValues, `${totalHours.toFixed(2)} hrs`];
    });

    const coverage = calculateSlotCoverage(rota.rows);
    const summary = ['Active Staff Count', ...coverage.map(c => c.working), `${(coverage.reduce((acc, c) => acc + c.working * getSlotDurationHours(c.slot), 0)).toFixed(1)} hrs`];

    const sheetData = [
      groupHeaderRow,
      subHeaderRow,
      ...data,
      summary
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Assistant Shift Rota');

    XLSX.writeFile(wb, `Assistant_Shift_Rota_${rota.date}.xlsx`);
  };

  // Import raw text / TSV / CSV data
  const handleImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Please paste CSV or Tab-delimited text to import.');
      return;
    }

    try {
      const lines = importText.trim().split(/\r?\n/);
      if (lines.length < 1) {
        throw new Error('Not enough rows in pasted content.');
      }

      // Detect separator
      const firstLine = lines[0];
      const sep = firstLine.includes('\t') ? '\t' : ',';

      let headerIdx = 0;
      for (let i = 0; i < Math.min(lines.length, 4); i++) {
        if (lines[i].toLowerCase().includes('09:00') || lines[i].toLowerCase().includes('assistant') || lines[i].toLowerCase().includes('name')) {
          headerIdx = i;
          break;
        }
      }

      const headerCols = lines[headerIdx].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
      const parsedRows: StaffRow[] = [];

      for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        if (cols[0] && (cols[0].toLowerCase().includes('count') || cols[0].toLowerCase().includes('coverage') || cols[0].toLowerCase().includes('total'))) {
          continue;
        }

        const name = cols[0] || `Assistant ${String(parsedRows.length + 1).padStart(2, '0')}`;
        const slots: Record<string, string> = {};

        TIME_SLOTS.forEach((slot, sIdx) => {
          let val = '';
          const foundColIdx = headerCols.findIndex(h => h.toLowerCase() === slot.toLowerCase());
          if (foundColIdx !== -1 && cols[foundColIdx] !== undefined) {
            val = cols[foundColIdx];
          } else if (cols[sIdx + 1] !== undefined) {
            val = cols[sIdx + 1];
          }
          slots[slot] = val;
        });

        parsedRows.push({
          id: `assistant-imported-${i}-${Date.now().toString(36)}`,
          name,
          role: 'TCA Staff',
          skills: ['Classroom', 'Hallways'],
          slots,
          notes: ''
        });
      }

      if (parsedRows.length === 0) {
        throw new Error('No valid staff rows found in the pasted data.');
      }

      setRota(prev => ({
        ...prev,
        rows: parsedRows
      }));

      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse text.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Export &amp; Import Rota Data
              </h2>
              <p className="text-xs text-slate-400">
                Excel, Tab-Delimited &amp; CSV format compatibility
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

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export &amp; Download</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Paste Rota</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Assistant Shift Rota Data
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed whitespace-pre">
                  {csvContent}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Paste tab-delimited or CSV data from Excel or Google Sheets below to load into the rota:
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{importError}</span>
                </div>
              )}

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste tab-delimited or CSV table here..."
                rows={10}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleImport}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Parse &amp; Load into Shift Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
