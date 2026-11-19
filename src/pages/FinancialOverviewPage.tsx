import React, { useMemo, useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { formatINR, usePractice } from '../context/PracticeContext';
import { DonutBreakdownChart, InteractiveBarChart } from '../components/ui/DataCharts';
import { FinancialYear } from '../types';

export const FinancialOverviewPage: React.FC = () => {
  const {
    financialRecords,
    clients,
    selectedFY,
    settings,
    openClientProfile,
    setActiveSection,
  } = usePractice();

  const [clientFilter, setClientFilter] = useState('All');
  const [fyFilter, setFyFilter] = useState<FinancialYear | 'All'>(selectedFY);
  const [sourceFilter, setSourceFilter] = useState<string>('All');

  const filteredRecords = useMemo(() => {
    return financialRecords.filter((r) => {
      if (clientFilter !== 'All' && r.clientId !== clientFilter) return false;
      if (fyFilter !== 'All' && r.financialYear !== fyFilter) return false;
      if (sourceFilter !== 'All' && r.sourceType !== sourceFilter) return false;
      return true;
    });
  }, [financialRecords, clientFilter, fyFilter, sourceFilter]);

  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, r) => {
        acc.revenue += r.revenue;
        acc.expenses += r.expenses;
        acc.taxable += r.taxableValue;
        acc.cgst += r.cgst;
        acc.sgst += r.sgst;
        acc.igst += r.igst;
        acc.invoices += r.invoiceCount;
        return acc;
      },
      { revenue: 0, expenses: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, invoices: 0 }
    );
  }, [filteredRecords]);

  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { revenue: number; expenses: number }>();
    filteredRecords.forEach((r) => {
      const cur = map.get(r.month) || { revenue: 0, expenses: 0 };
      cur.revenue += r.revenue;
      cur.expenses += r.expenses;
      map.set(r.month, cur);
    });
    return Array.from(map.entries()).map(([month, v]) => ({
      label: month.replace(' 2026', '').replace(' 2025', ''),
      primary: v.revenue,
      secondary: v.expenses,
    }));
  }, [filteredRecords]);

  const clientOverviewRows = useMemo(() => {
    const map = new Map<
      string,
      {
        revenue: number;
        expenses: number;
        gst: number;
        invoices: number;
        hasProvisional: boolean;
      }
    >();
    filteredRecords.forEach((r) => {
      const cur = map.get(r.clientId) || {
        revenue: 0,
        expenses: 0,
        gst: 0,
        invoices: 0,
        hasProvisional: false,
      };
      cur.revenue += r.revenue;
      cur.expenses += r.expenses;
      cur.gst += r.cgst + r.sgst + r.igst;
      cur.invoices += r.invoiceCount;
      if (r.sourceType.includes('Provisional')) cur.hasProvisional = true;
      map.set(r.clientId, cur);
    });
    return Array.from(map.entries()).map(([clientId, data]) => ({
      client: clients.find((c) => c.id === clientId),
      ...data,
    }));
  }, [filteredRecords, clients]);

  const fyComparison = useMemo(() => {
    const fy2627 = financialRecords
      .filter((r) => r.financialYear === 'FY 2026-27')
      .reduce((s, r) => s + r.revenue, 0);
    const fy2526 = financialRecords
      .filter((r) => r.financialYear === 'FY 2025-26')
      .reduce((s, r) => s + r.revenue, 0);
    return [
      { label: 'FY 2025-26', primary: fy2526 },
      { label: 'FY 2026-27', primary: fy2627 },
    ];
  }, [financialRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Client Financial Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational financial summaries derived from uploaded documents and finalized client statements (Demo Data)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection('intelligence')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-200 bg-[#0E2240] hover:bg-[#14305A] border border-teal-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          Financial Health Insights &amp; Anomalies
        </button>
      </div>

      {/* Distinction Banner */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-teal-400 shrink-0" />
        <span>
          This module summarizes operational document figures for CA review—it is not a replacement for Tally/accounting ledgers. Use the Source Type filter to distinguish provisional document-extracted values from finalized accounting records.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
        >
          <option value="All">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={fyFilter}
          onChange={(e) => setFyFilter(e.target.value as FinancialYear | 'All')}
          className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
        >
          <option value="All">All Financial Years</option>
          {settings.availableFinancialYears.map((fy) => (
            <option key={fy}>{fy}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
        >
          <option value="All">All Data Sources (Extracted + Finalized)</option>
          <option value="Finalized Accounting Record">Finalized Accounting Records Only</option>
          <option value="Document-Extracted (Provisional)">Document-Extracted (Provisional) Only</option>
        </select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4">
          <div className="text-xs text-slate-400">Taxable Revenue / Turnover</div>
          <div className="text-xl font-bold font-mono tabular-nums text-sky-400 mt-1.5">
            {formatINR(totals.revenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {totals.invoices} processed invoices
          </div>
        </div>

        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4">
          <div className="text-xs text-slate-400">Recorded Expenses</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-100 mt-1.5">
            {formatINR(totals.expenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Net margin:{' '}
            <span className="font-mono text-emerald-400">
              {totals.revenue > 0
                ? `${Math.round(((totals.revenue - totals.expenses) / totals.revenue) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4">
          <div className="text-xs text-slate-400">Total GST Summary</div>
          <div className="text-xl font-bold font-mono tabular-nums text-teal-400 mt-1.5">
            {formatINR(totals.cgst + totals.sgst + totals.igst)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            CGST + SGST + IGST
          </div>
        </div>

        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4">
          <div className="text-xs text-slate-400">Taxable Value Base</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-100 mt-1.5">
            {formatINR(totals.taxable)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {filteredRecords.filter((r) => r.sourceType.includes('Provisional')).length} provisional entries
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-100 font-display mb-1">
            Monthly Income vs Expenses
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Aggregated across filtered clients &amp; source records
          </p>
          <InteractiveBarChart
            data={monthlyChartData}
            primaryName="Income / Revenue"
            secondaryName="Expenses"
            primaryColor="#3B82F6"
            secondaryColor="#14B8A6"
            valueFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
            height={220}
          />
        </section>

        <section className="lg:col-span-5 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 font-display mb-1">
              GST Breakdown
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              CGST, SGST, and IGST split from invoice summaries
            </p>
            <DonutBreakdownChart
              segments={[
                { label: 'CGST', value: totals.cgst, color: '#3B82F6' },
                { label: 'SGST', value: totals.sgst, color: '#14B8A6' },
                { label: 'IGST', value: totals.igst, color: '#F59E0B' },
              ]}
              centerLabel="Total GST"
              centerValue={`₹${((totals.cgst + totals.sgst + totals.igst) / 100000).toFixed(1)}L`}
              valueFormatter={formatINR}
            />
          </div>

          <div className="pt-4 mt-4 border-t border-[#192845]">
            <div className="text-xs font-semibold text-slate-200 mb-2">
              Financial Year Comparison (Recorded Revenue)
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {fyComparison.map((f) => (
                <div key={f.label} className="bg-[#081020] border border-[#192845] rounded-lg p-2.5">
                  <div className="text-slate-400">{f.label}</div>
                  <div className="font-mono font-semibold text-slate-100 mt-0.5">
                    {formatINR(f.primary)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Client-wise Summary Table */}
      <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1E2E4E]">
          <h2 className="text-sm font-semibold text-slate-100 font-display">
            Client-wise Financial Summary
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 text-right">Invoices</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Expenses</th>
                <th className="py-3 px-4 text-right">Total GST</th>
                <th className="py-3 px-4">Record Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15223C]">
              {clientOverviewRows.map((row) => (
                <tr
                  key={row.client?.id || 'unknown'}
                  onClick={() => row.client && openClientProfile(row.client.id)}
                  className="hover:bg-[#101C33] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-sky-400">
                    {row.client?.name || 'Client'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {row.invoices}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-100">
                    {formatINR(row.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {formatINR(row.expenses)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-400 font-medium">
                    {formatINR(row.gst)}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {row.hasProvisional
                      ? 'Includes Provisional Document-Extracted'
                      : 'Finalized Accounting Records'}
                  </td>
                </tr>
              ))}
              {clientOverviewRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No financial summary records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
