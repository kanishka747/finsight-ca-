import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  MessageSquare,
  ShieldCheck,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  computeMissingDocsForClient,
  usePractice,
} from '../context/PracticeContext';
import { DocumentCategory, ValidationIssue } from '../types';
import { StatusLabel } from '../components/ui/StatusText';
import { Modal } from '../components/ui/Modal';

type ValidationTab = 'missing' | 'fields' | 'cross';

export const ValidationPage: React.FC = () => {
  const {
    clients,
    documents,
    validationIssues,
    crossComparisons,
    selectedFY,
    currentUser,
    createDocumentRequest,
    updateValidationIssue,
    updateCrossComparison,
    openClientProfile,
    setActiveSection,
  } = usePractice();

  const [tab, setTab] = useState<ValidationTab>('missing');
  const [clientFilter, setClientFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  const [commentIssue, setCommentIssue] = useState<ValidationIssue | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const activeClients = useMemo(
    () =>
      clients.filter(
        (c) => c.status === 'Active' && (clientFilter === 'All' || c.id === clientFilter)
      ),
    [clients, clientFilter]
  );

  const filteredIssues = useMemo(
    () =>
      validationIssues.filter((v) => {
        if (clientFilter !== 'All' && v.clientId !== clientFilter) return false;
        if (severityFilter !== 'All' && v.severity !== severityFilter) return false;
        return true;
      }),
    [validationIssues, clientFilter, severityFilter]
  );

  const filteredComparisons = useMemo(
    () =>
      crossComparisons.filter(
        (c) => clientFilter === 'All' || c.clientId === clientFilter
      ),
    [crossComparisons, clientFilter]
  );

  const handleQuickRequest = (clientId: string, category: DocumentCategory) => {
    const client = clients.find((c) => c.id === clientId);
    createDocumentRequest({
      clientId,
      title: `${category} Required (${selectedFY})`,
      category,
      financialYear: selectedFY,
      requestedBy: currentUser.name,
      dueDate: '2026-11-22',
      message: `Please upload ${category} for ${client?.name || 'your account'} (${selectedFY}) to complete compliance verification.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Document Validation &amp; Review
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Missing document detection, field checks, and cross-document review flags for CA attention
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSection('intelligence')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-200 bg-[#0E2240] hover:bg-[#14305A] border border-teal-500/40 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            AI Anomaly Detector
          </button>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            aria-label="Filter by client"
          >
            <option value="All">All Active Clients</option>
            {clients
              .filter((c) => c.status === 'Active')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Review Disclaimer */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-teal-400 shrink-0" />
        <span>
          Severity labels (Informational, Warning, Critical) highlight items for manual CA review. They are operational review flags, not automated legal or tax compliance decisions.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('missing')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === 'missing'
                ? 'bg-[#14274A] text-white border border-[#274680]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
            }`}
          >
            Missing Document Detection
          </button>
          <button
            type="button"
            onClick={() => setTab('fields')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === 'fields'
                ? 'bg-[#14274A] text-white border border-[#274680]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
            }`}
          >
            Field Validation ({filteredIssues.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('cross')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === 'cross'
                ? 'bg-[#14274A] text-white border border-[#274680]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
            }`}
          >
            Cross-Document Review ({filteredComparisons.length})
          </button>
        </div>

        {tab === 'fields' && (
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Informational">Informational</option>
          </select>
        )}
      </div>

      {/* Tab A: Missing Document Detection */}
      {tab === 'missing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeClients.map((client) => {
            const checklist = computeMissingDocsForClient(client, documents, selectedFY);
            const receivedCount = checklist.filter((i) => i.state === 'Received').length;
            return (
              <div
                key={client.id}
                className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#192845]">
                    <div>
                      <button
                        type="button"
                        onClick={() => openClientProfile(client.id)}
                        className="text-sm font-semibold text-slate-100 hover:text-teal-400 font-display text-left"
                      >
                        {client.name}
                      </button>
                      <div className="text-[11px] text-slate-400">
                        {client.clientCode} · {client.type} · {selectedFY}
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-teal-400 font-medium shrink-0">
                      {receivedCount}/{checklist.length} verified
                    </span>
                  </div>

                  <div className="divide-y divide-[#15223C] mt-2">
                    {checklist.map((item) => (
                      <div
                        key={item.category}
                        className="py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-200 font-medium">{item.category}</span>
                        <div className="flex items-center gap-3">
                          <StatusLabel status={item.state} />
                          {item.state === 'Missing' && (
                            <button
                              type="button"
                              onClick={() => handleQuickRequest(client.id, item.category)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400 hover:underline"
                            >
                              <Send className="w-3 h-3" />
                              Request
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab B: Field Validation */}
      {tab === 'fields' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-3 px-4">Client &amp; Finding</th>
                  <th className="py-3 px-4">Field / Detected Value</th>
                  <th className="py-3 px-4">Validation Check</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Review State</th>
                  <th className="py-3 px-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15223C]">
                {filteredIssues.map((issue) => {
                  const client = clients.find((c) => c.id === issue.clientId);
                  return (
                    <tr key={issue.id} className="hover:bg-[#101C33] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{issue.title}</div>
                        <div className="text-[11px] text-sky-400 mt-0.5">{client?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-400">{issue.fieldLabel}</div>
                        <div className="font-mono text-slate-100 mt-0.5">{issue.detectedValue}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs">
                        {issue.expectedFormatOrCrossRef}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusLabel status={issue.severity} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusLabel status={issue.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateValidationIssue(issue.id, 'Reviewed')}
                            title="Mark as Reviewed"
                            className="p-1.5 rounded-md text-teal-400 hover:bg-teal-500/15"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateValidationIssue(issue.id, 'Approved')}
                            title="Approve"
                            className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/15"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateValidationIssue(issue.id, 'Correction Requested')}
                            title="Request Correction"
                            className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/15"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateValidationIssue(issue.id, 'Rejected')}
                            title="Reject"
                            className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/15"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCommentIssue(issue);
                              setCommentInput('');
                            }}
                            title="Add Internal Comment"
                            className="p-1.5 rounded-md text-slate-300 hover:bg-[#14274A]"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab C: Cross-Document Review */}
      {tab === 'cross' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-3 px-4">Client &amp; Metric</th>
                  <th className="py-3 px-4">Source A</th>
                  <th className="py-3 px-4">Source B</th>
                  <th className="py-3 px-4">Comparison Result</th>
                  <th className="py-3 px-4">CA Review Notes</th>
                  <th className="py-3 px-4 text-right">Update Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15223C]">
                {filteredComparisons.map((row) => {
                  const client = clients.find((c) => c.id === row.clientId);
                  return (
                    <tr key={row.id} className="hover:bg-[#101C33] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{row.metric}</div>
                        <div className="text-[11px] text-sky-400 mt-0.5">{client?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-400">{row.sourceAName}</div>
                        <div className="font-mono font-semibold text-slate-100 mt-0.5">
                          {row.sourceAValue}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-400">{row.sourceBName}</div>
                        <div className="font-mono font-semibold text-slate-100 mt-0.5">
                          {row.sourceBValue}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusLabel status={row.varianceStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs">{row.notes}</td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={row.varianceStatus}
                          onChange={(e) =>
                            updateCrossComparison(
                              row.id,
                              e.target.value as typeof row.varianceStatus
                            )
                          }
                          className="px-2.5 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
                        >
                          <option>Matched</option>
                          <option>Potential Mismatch</option>
                          <option>Missing Info</option>
                          <option>Requires CA Review</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      <Modal
        open={!!commentIssue}
        onClose={() => setCommentIssue(null)}
        title={`Internal Comment — ${commentIssue?.title || ''}`}
        maxWidthClass="max-w-md"
      >
        {commentIssue && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {commentIssue.internalComments.map((c) => (
                <div key={c.id} className="bg-[#081020] border border-[#192845] rounded-lg p-2.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-100">
                    <span>{c.author}</span>
                    <span className="font-mono text-[10px] text-slate-500">{c.timestamp}</span>
                  </div>
                  <p className="text-slate-300 mt-1">{c.text}</p>
                </div>
              ))}
              {commentIssue.internalComments.length === 0 && (
                <p className="text-xs text-slate-500">No internal comments yet.</p>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentInput.trim()) return;
                updateValidationIssue(commentIssue.id, 'Reviewed', commentInput.trim());
                setCommentIssue(null);
              }}
              className="space-y-3"
            >
              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Document your CA review observation..."
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommentIssue(null)}
                  className="px-3 py-1.5 text-xs text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  Save Note &amp; Mark Reviewed
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
