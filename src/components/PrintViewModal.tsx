import React from 'react';
import { Printer, X } from 'lucide-react';
import { RotaConfig } from '../types';
import { TIME_SLOTS, SLOT_GROUPS } from '../constants/activities';
import { calculateStaffHours, calculateSlotCoverage, getSlotDurationHours } from '../services/googleSheetsService';

interface PrintViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rota: RotaConfig;
}

export const PrintViewModal: React.FC<PrintViewModalProps> = ({
  isOpen,
  onClose,
  rota
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const coverageStats = calculateSlotCoverage(rota.rows);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto print:shadow-none print:m-0 print:w-full print:max-w-none">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold">Printable Assistant Shift Rota</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-6 sm:p-8 bg-white print:p-0">
          {/* Printable Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {rota.title}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Department: {rota.department} &bull; Date: {rota.date} ({rota.dayOfWeek})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded border border-slate-300">
                First, Prayer Break, Second &amp; Third Slot Grid
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Target Min Staff: {rota.targetMinCoverage}
              </p>
            </div>
          </div>

          {/* Printable Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-400 text-[8.5px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-1 border-r border-slate-400">Assistant Name</th>
                  {SLOT_GROUPS.map(g => (
                    <th key={g.id} colSpan={g.slots.length} className="p-1 text-center border-r border-slate-400">
                      {g.name}
                    </th>
                  ))}
                  <th className="p-1 text-center border-r border-slate-400">Total</th>
                </tr>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-semibold">
                  <th className="p-1 border-r border-slate-300 w-36"></th>
                  {TIME_SLOTS.map((slot) => (
                    <th key={slot} className="p-0.5 text-center border-r border-slate-300 font-mono text-[7.5px] whitespace-nowrap">
                      {slot}
                    </th>
                  ))}
                  <th className="p-1 text-center border-r border-slate-300 w-10">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {rota.rows.map((row, idx) => {
                  const hours = calculateStaffHours(row.slots);
                  return (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-1 border-r border-slate-300 font-semibold text-slate-900">
                        {row.name}
                      </td>
                      {TIME_SLOTS.map((slot) => {
                        const val = row.slots[slot] || '';
                        return (
                          <td
                            key={slot}
                            className={`p-0.5 text-center font-medium border-r border-slate-200 text-[7.5px] ${
                              val.toLowerCase().includes('break')
                                ? 'bg-emerald-50 text-emerald-900 font-bold'
                                : val
                                ? 'bg-blue-50 text-blue-900'
                                : ''
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                      <td className="p-1 text-center border-r border-slate-300 font-mono font-bold">
                        {hours.toFixed(1)}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
                  <td className="p-1 border-r border-slate-300">
                    Active Staff Count
                  </td>
                  {coverageStats.map(({ slot, working }) => (
                    <td
                      key={slot}
                      className={`p-1 text-center font-mono border-r border-slate-300 ${
                        working < rota.targetMinCoverage
                          ? 'bg-rose-100 text-rose-900'
                          : 'text-slate-900'
                      }`}
                    >
                      {working}
                    </td>
                  ))}
                  <td className="p-1 text-center font-mono">
                    {(coverageStats.reduce((acc, c) => acc + c.working * getSlotDurationHours(c.slot), 0)).toFixed(0)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
