import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowLeftRight,
  TrendingUp,
  CheckCircle2,
  ListChecks,
  Bot,
  Plus,
  Info,
} from 'lucide-react';
import { formatINR, usePractice } from '../context/PracticeContext';
import { StatusLabel, PriorityLabel } from '../components/ui/StatusText';
import { CrossDocumentComparison } from '../types';

type IntelTab = 'anomalies' | 'reconciliation' | 'risk' | 'health';

export const IntelligencePage: React.FC = () => {
  const {
    clients,
    anomalies,
    crossComparisons,
    financialRecords,
    selectedFY,
    computeClientRiskScore,
    updateAnomalyStatus,
    escalateAnomalyToTask,
    updateCrossComparison,
    addCrossComparison,
    addAnomaly,
    openClientProfile,
    openCopilotWithPrompt,
    setActiveSection,
  } = usePractice();

  const [tab, setTab] = useState<IntelTab>('anomalies');
  const [clientFilter, setClientFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // New reconciliation composer state
  const [recClientId, setRecClientId] = useState(clients[0]?.id || 'cli-1');
  const [recMetric, setRecMetric] = useState('');
  const [recSourceA, setRecSourceA] = useState('Purchase Invoice Batch');
  const [recValA, setRecValA] = useState('');
  const [recSourceB, setRecSourceB] = useState('Purchase Register / GSTR-2B');
  const [recValB, setRecValB] = useState('');

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (clientFilter !== 'All' && a.clientId !== clientFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      return true;
    });
  }, [anomalies, clientFilter, statusFilter]);

  const rankedRiskClients = useMemo(() => {
    return clients
      .filter((c) => c.status === 'Active')
      .map((client) => ({
        client,
        risk: computeClientRiskScore(client.id),
      }))
      .sort((a, b) => b.risk.score - a.risk.score);
  }, [clients, computeClientRiskScore]);

  const healthInsights = useMemo(() => {
    const active = clients.filter((c) => c.status === 'Active');
    return active
      .map((client) => {
        const recs = financialRecords.filter(
          (r) => r.clientId === client.id && r.financialYear === selectedFY
        );
        if (recs.length === 0) return null;
        const totalRev = recs.reduce((s, r) => s + r.revenue, 0);
        const totalExp = recs.reduce((s, r) => s + r.expenses, 0);
        const totalGst = recs.reduce((s, r) => s + r.cgst + r.sgst + r.igst, 0);
        const marginPct = totalRev > 0 ? Math.round(((totalRev - totalExp) / totalRev) * 100) : 0;

        let revChangePct: number | null = null;
        if (recs.length >= 2) {
          const prev = recs[recs.length - 2].revenue;
          const curr = recs[recs.length - 1].revenue;
          if (prev > 0) revChangePct = Math.round(((curr - prev) / prev) * 100);
        }

        const observations: string[] = [];
        if (revChangePct !== null) {
          observations.push(
            revChangePct >= 0
              ? `Latest month turnover changed by +${revChangePct}% (${formatINR(recs[recs.length - 1].revenue)} vs ${formatINR(recs[recs.length - 2].revenue)}).`
              : `Latest month turnover declined by ${revChangePct}% (${formatINR(recs[recs.length - 1].revenue)} vs ${formatINR(recs[recs.length - 2].revenue)}).`
          );
        }
        observations.push(
          `Operating expense ratio sits at ${100 - marginPct}% (${formatINR(totalExp)} expenses against ${formatINR(totalRev)} recorded revenue across ${recs.length} period(s)).`
        );
        if (totalGst > 0) {
          observations.push(
            `Recorded output GST totals ${formatINR(totalGst)} (${recs[recs.length - 1].sourceType}).`
          );
        }

        return { client, recs, totalRev, totalExp, totalGst, marginPct, observations };
      })
      .filter(Boolean);
  }, [clients, financialRecords, selectedFY]);

  const handleRunComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recMetric.trim() || !recValA.trim() || !recValB.trim()) return;

    const numA = Number(recValA.replace(/[^0-9.-]/g, ''));
    const numB = Number(recValB.replace(/[^0-9.-]/g, ''));
    const numericBoth = !Number.isNaN(numA) && !Number.isNaN(numB) && recValA.trim() !== '' && recValB.trim() !== '';
    const isMatched = numericBoth ? Math.abs(numA - numB) < 1 : recValA.trim() === recValB.trim();
    const varianceStatus: CrossDocumentComparison['varianceStatus'] = isMatched
      ? 'Matched'
      : 'Potential Mismatch';

    addCrossComparison({
      clientId: recClientId,
      metric: recMetric.trim(),
      sourceAName: recSourceA.trim(),
      sourceAValue: recValA.trim(),
      sourceBName: recSourceB.trim(),
      sourceBValue: recValB.trim(),
      varianceStatus,
      notes: isMatched
        ? 'Automated cross-document match verified.'
        : `Variance detected between ${recSourceA} and ${recSourceB}.`,
    });

    if (!isMatched) {
      const diff = numericBoth ? Math.abs(numA - numB) : undefined;
      addAnomaly({
        clientId: recClientId,
        type: 'Cross-Document Amount Mismatch',
        severity: 'Critical',
        title: `Reconciliation Mismatch: ${recMetric.trim()}`,
        description: `${recSourceA} records ${recValA.trim()} while ${recSourceB} records ${recValB.trim()}. Flagged automatically for CA review.`,
        sourceARef: recSourceA.trim(),
        sourceAValue: recValA.trim(),
        sourceBRef: recSourceB.trim(),
        sourceBValue: recValB.trim(),
        varianceAmount: diff,
        status: 'Flagged for CA Review',
      });
    }

    setRecMetric('');
    setRecValA('');
    setRecValB('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            FinSight Intelligence, Anomalies & Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AI anomaly detection, dynamic client compliance risk scoring, cross-document reconciliation & health insights
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            openCopilotWithPrompt(
              'Review all open financial anomalies and high-risk clients and tell me what needs urgent CA partner attention today.'
            )
          }
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-teal-200 bg-[#0E2240] hover:bg-[#14305A] border border-teal-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Bot className="w-4 h-4 text-teal-400" />
          Ask Copilot to Audit Open Flags
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-xl overflow-x-auto">
        {(
          [
            ['anomalies', `AI Anomaly Detector (${anomalies.filter((a) => a.status !== 'Resolved' && a.status !== 'Dismissed').length})`],
            ['reconciliation', `Smart Reconciliation (${crossComparisons.length})`],
            ['risk', 'Client Risk Scores'],
            ['health', 'Financial Health Insights'],
          ] as [IntelTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              tab === id
                ? 'bg-[#14274A] text-white border border-[#274680]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: AI Financial Anomaly Detector */}
      {tab === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-[#0B1426] border border-[#1B2A47] rounded-xl p-4 flex flex-wrap items-center gap-3">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#081020] border border-[#223559] rounded-lg text-slate-200"
            >
              <option value="All">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#081020] border border-[#223559] rounded-lg text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Flagged for CA Review">Flagged for CA Review</option>
              <option value="Task Created">Task Created</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>

            <div className="ml-auto text-xs text-slate-400 font-mono">
              Showing {filteredAnomalies.length} of {anomalies.length} anomaly flags
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAnomalies.map((anom) => {
              const client = clients.find((c) => c.id === anom.clientId);
              return (
                <article
                  key={anom.id}
                  className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                        <PriorityLabel
                          priority={anom.severity === 'Critical' ? 'Urgent' : 'High'}
                        />
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-teal-400">{anom.type}</span>
                        <span className="text-slate-500">·</span>
                        <button
                          type="button"
                          onClick={() => client && openClientProfile(client.id)}
                          className="text-sky-400 hover:underline font-medium"
                        >
                          {client?.name}
                        </button>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 font-display">
                        {anom.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{anom.description}</p>
                    </div>

                    <div className="shrink-0">
                      <StatusLabel status={anom.status} />
                    </div>
                  </div>

                  {/* Cross-reference comparison strip */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#081020] border border-[#182642] rounded-lg p-3.5 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400">Source A</div>
                      <div className="font-medium text-slate-200 mt-0.5">{anom.sourceARef}</div>
                      <div className="font-mono tabular-nums font-semibold text-sky-300 mt-0.5">
                        {anom.sourceAValue}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Source B / Policy</div>
                      <div className="font-medium text-slate-200 mt-0.5">{anom.sourceBRef}</div>
                      <div className="font-mono tabular-nums font-semibold text-amber-300 mt-0.5">
                        {anom.sourceBValue}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Detected / Variance</div>
                      <div className="font-mono text-slate-300 mt-0.5">{anom.detectedAt}</div>
                      {anom.varianceAmount !== undefined && (
                        <div className="font-mono tabular-nums font-semibold text-rose-400 mt-0.5">
                          Diff: {formatINR(anom.varianceAmount)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        openCopilotWithPrompt(
                          `Analyse anomaly "${anom.title}" for ${client?.name}: ${anom.description} Suggest CA verification steps.`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Investigate with Copilot
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {anom.status === 'Flagged for CA Review' && (
                        <button
                          type="button"
                          onClick={() => escalateAnomalyToTask(anom.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#173361] hover:bg-[#1E4380] border border-[#2C5599] rounded-lg"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          Create CA Review Task
                        </button>
                      )}
                      {anom.linkedTaskId && (
                        <button
                          type="button"
                          onClick={() => setActiveSection('tasks')}
                          className="px-3 py-1.5 text-xs font-medium text-sky-300 bg-[#0F1E38] border border-[#244070] rounded-lg hover:bg-[#162B4E]"
                        >
                          Open Linked Task
                        </button>
                      )}
                      {anom.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => updateAnomalyStatus(anom.id, 'Resolved', 'Verified by CA')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Resolved
                        </button>
                      )}
                      {anom.status !== 'Dismissed' && anom.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => updateAnomalyStatus(anom.id, 'Dismissed')}
                          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#101C33] border border-[#223559] rounded-lg hover:bg-[#162745]"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Smart Document Reconciliation */}
      {tab === 'reconciliation' && (
        <div className="space-y-6">
          <form
            onSubmit={handleRunComparison}
            className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 font-display flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-teal-400" />
                  Run Cross-Document Reconciliation Check
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compare Sales/Purchase invoices vs Registers, Bank Statements vs Books, or GST figures. Mismatches auto-flag into Anomaly Detector.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Client</label>
                <select
                  value={recClientId}
                  onChange={(e) => setRecClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#081020] border border-[#223559] rounded-lg text-slate-100"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Comparison Metric *
                </label>
                <input
                  required
                  value={recMetric}
                  onChange={(e) => setRecMetric(e.target.value)}
                  placeholder="e.g., Nov 2026 Vendor Invoice INV-884 vs Purchase Register"
                  className="w-full px-3 py-2 bg-[#081020] border border-[#223559] rounded-lg text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Source A Document</label>
                <input
                  value={recSourceA}
                  onChange={(e) => setRecSourceA(e.target.value)}
                  className="w-full px-3 py-2 bg-[#081020] border border-[#223559] rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Source A Value *</label>
                <input
                  required
                  value={recValA}
                  onChange={(e) => setRecValA(e.target.value)}
                  placeholder="e.g., ₹85,000"
                  className="w-full px-3 py-2 font-mono bg-[#081020] border border-[#223559] rounded-lg text-slate-100"
                />
              </div>
              <div />

              <div>
                <label className="block text-slate-300 font-medium mb-1">Source B Record</label>
                <input
                  value={recSourceB}
                  onChange={(e) => setRecSourceB(e.target.value)}
                  className="w-full px-3 py-2 bg-[#081020] border border-[#223559] rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Source B Value *</label>
                <input
                  required
                  value={recValB}
                  onChange={(e) => setRecValB(e.target.value)}
                  placeholder="e.g., ₹95,000"
                  className="w-full px-3 py-2 font-mono bg-[#081020] border border-[#223559] rounded-lg text-slate-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Compare & Log
                </button>
              </div>
            </div>
          </form>

          <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#192845] bg-[#081020] text-slate-400 font-semibold">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4">Source A</th>
                    <th className="py-3 px-4">Source B</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">CA Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15233E]">
                  {crossComparisons.map((cc) => {
                    const client = clients.find((c) => c.id === cc.clientId);
                    return (
                      <tr key={cc.id} className="hover:bg-[#101C33]">
                        <td className="py-3 px-4 font-medium text-slate-100">{client?.name}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{cc.metric}</div>
                          <div className="text-[11px] text-slate-400">{cc.notes}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-400">{cc.sourceAName}</div>
                          <div className="font-mono text-slate-100">{cc.sourceAValue}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-400">{cc.sourceBName}</div>
                          <div className="font-mono text-slate-100">{cc.sourceBValue}</div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusLabel status={cc.varianceStatus} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {cc.varianceStatus !== 'Matched' && (
                            <button
                              type="button"
                              onClick={() => updateCrossComparison(cc.id, 'Matched', 'Reconciled by CA')}
                              className="text-teal-400 hover:underline font-medium"
                            >
                              Mark Matched
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Client Compliance Risk Matrix */}
      {tab === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rankedRiskClients.map(({ client, risk }) => {
            const barColor =
              risk.score >= 70
                ? 'bg-rose-500'
                : risk.score >= 45
                ? 'bg-amber-500'
                : risk.score >= 20
                ? 'bg-sky-400'
                : 'bg-emerald-400';

            return (
              <div
                key={client.id}
                className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {client.clientCode} · {client.type}
                    </div>
                    <button
                      type="button"
                      onClick={() => openClientProfile(client.id)}
                      className="text-sm font-semibold text-slate-100 hover:text-teal-400 font-display text-left"
                    >
                      {client.name}
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-100">
                      {risk.score}/100
                    </div>
                    <StatusLabel status={risk.level} />
                  </div>
                </div>

                <div className="h-2 bg-[#081020] rounded-full overflow-hidden border border-[#182642]">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${risk.score}%` }}
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  {risk.factors.length === 0 ? (
                    <p className="text-xs text-emerald-400">
                      All mandatory documents verified and zero overdue items.
                    </p>
                  ) : (
                    risk.factors.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-start justify-between gap-2 text-xs bg-[#081020] px-3 py-2 rounded-lg border border-[#172540]"
                      >
                        <div>
                          <div className="font-medium text-slate-200">{f.label}</div>
                          <div className="text-[11px] text-slate-400">{f.detail}</div>
                        </div>
                        <span className="font-mono text-amber-400 font-semibold shrink-0">
                          +{f.points}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: Financial Health Insights */}
      {tab === 'health' && (
        <div className="space-y-4">
          <div className="bg-[#0D1A33] border border-[#243E70] rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100">Observation vs. Professional Advice:</strong>{' '}
              The automated metrics below summarize empirical trends observed inside recorded client documents and ledgers for {selectedFY}. They do not replace formal Chartered Accountant statutory judgment or financial advisory sign-off.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {healthInsights.map((item) => {
              if (!item) return null;
              return (
                <div
                  key={item.client.id}
                  className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {item.client.clientCode} · {item.client.type}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 font-display">
                        {item.client.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-teal-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {item.marginPct}% Operating Margin
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-[#081020] p-3 rounded-lg border border-[#182642]">
                    <div>
                      <div className="text-[11px] text-slate-400">Revenue</div>
                      <div className="text-xs font-mono font-semibold text-slate-100 mt-0.5">
                        {formatINR(item.totalRev)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Expenses</div>
                      <div className="text-xs font-mono font-semibold text-amber-300 mt-0.5">
                        {formatINR(item.totalExp)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Total GST</div>
                      <div className="text-xs font-mono font-semibold text-sky-300 mt-0.5">
                        {formatINR(item.totalGst)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Evidence-Backed Observations
                    </div>
                    {item.observations.map((obs, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{obs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
