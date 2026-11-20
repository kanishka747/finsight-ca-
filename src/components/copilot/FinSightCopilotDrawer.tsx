import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  X,
  Send,
  Paperclip,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  computeMissingDocsForClient,
  formatINR,
  usePractice,
} from '../../context/PracticeContext';
import { ExtractedDocumentPayload } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachmentName?: string;
  extracted?: ExtractedDocumentPayload;
  error?: boolean;
  retryPrompt?: string;
  timestamp: string;
}

interface PendingAttachment {
  name: string;
  mimeType: string;
  sizeLabel: string;
  base64Data?: string;
  textContent?: string;
}

const SUGGESTED_PROMPTS = [
  "Which clients haven't submitted bank statements?",
  'Show all overdue GST-related tasks.',
  'Which employee has the most pending work?',
  "Summarise ABC Private Limited's pending requirements.",
];

function resolveClientMimeType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'csv') return 'text/csv';
  if (ext === 'txt' || ext === 'json') return 'text/plain';
  return 'application/pdf';
}

export const FinSightCopilotDrawer: React.FC = () => {
  const {
    copilotOpen,
    setCopilotOpen,
    queuedCopilotPrompt,
    clearQueuedCopilotPrompt,
    clients,
    documents,
    complianceTasks,
    staffTasks,
    validationIssues,
    anomalies,
    employees,
    selectedFY,
    computeClientRiskScore,
    runDocumentToActionPipeline,
    setActiveSection,
    addToast,
  } = usePractice();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        'FinSight AI Copilot ready for A Y & COMPANY. Ask questions across live client records, compliance risk scores, and staff workload — or upload a real PDF, image, CSV, or text statement to extract and brief its exact figures verbatim.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [extractClientId, setExtractClientId] = useState(clients[0]?.id || 'cli-1');
  const [loading, setLoading] = useState(false);
  const [extractingStructured, setExtractingStructured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const practiceContext = useMemo(() => {
    return {
      firm: 'A Y & COMPANY – Chartered Accountants, Jaipur',
      activeFinancialYear: selectedFY,
      clients: clients.map((c) => {
        const missingChecklist = computeMissingDocsForClient(c, documents, selectedFY);
        const risk = computeClientRiskScore(c.id);
        return {
          id: c.id,
          code: c.clientCode,
          name: c.name,
          type: c.type,
          status: c.status,
          assignedEmployee: employees.find((e) => e.id === c.assignedEmployeeId)?.name || 'Unassigned',
          riskScore: risk.score,
          riskLevel: risk.level,
          missingDocuments: missingChecklist.filter((m) => m.state === 'Missing').map((m) => m.category),
          pendingReviewDocuments: missingChecklist.filter((m) => m.state === 'Pending').map((m) => m.category),
        };
      }),
      documents: documents.map((d) => ({
        name: d.name,
        client: clients.find((c) => c.id === d.clientId)?.name || d.clientId,
        category: d.category,
        fy: d.financialYear,
        status: d.status,
        uploadDate: d.uploadDate,
        metrics: d.extractedMetrics,
      })),
      complianceTasks: complianceTasks.map((t) => ({
        title: t.title,
        client: clients.find((c) => c.id === t.clientId)?.name || t.clientId,
        type: t.type,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
        assignee: employees.find((e) => e.id === t.assignedEmployeeId)?.name || t.assignedEmployeeId,
      })),
      staffWorkload: employees.map((e) => {
        const openStaff = staffTasks.filter((t) => t.assignedEmployeeId === e.id && t.status !== 'Completed');
        const openCmp = complianceTasks.filter((c) => c.assignedEmployeeId === e.id && c.status !== 'Completed');
        return {
          name: e.name,
          role: e.role,
          openStaffTasks: openStaff.length,
          openComplianceTasks: openCmp.length,
          totalPendingWork: openStaff.length + openCmp.length,
          taskTitles: openStaff.map((t) => `${t.title} [${t.status}]`),
        };
      }),
      openAnomalies: anomalies
        .filter((a) => a.status !== 'Resolved' && a.status !== 'Dismissed')
        .map((a) => ({
          title: a.title,
          client: clients.find((c) => c.id === a.clientId)?.name || a.clientId,
          severity: a.severity,
          sourceA: `${a.sourceARef}: ${a.sourceAValue}`,
          sourceB: `${a.sourceBRef}: ${a.sourceBValue}`,
          status: a.status,
        })),
      openValidationIssues: validationIssues
        .filter((v) => v.status !== 'Approved')
        .map((v) => ({
          title: v.title,
          client: clients.find((c) => c.id === v.clientId)?.name || v.clientId,
          severity: v.severity,
          detectedValue: v.detectedValue,
          status: v.status,
        })),
    };
  }, [clients, documents, complianceTasks, staffTasks, validationIssues, anomalies, employees, selectedFY, computeClientRiskScore]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeLabel =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const isTextLike =
      file.type.startsWith('text/') ||
      /\.(csv|txt|json|tsv|md)$/i.test(file.name);

    setReadingFile(true);
    try {
      if (isTextLike) {
        const textContent = await file.text();
        setAttachment({
          name: file.name,
          mimeType: resolveClientMimeType(file),
          sizeLabel,
          textContent,
        });
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            resolve(result.includes(',') ? result.split(',')[1] : result);
          };
          reader.onerror = () => reject(new Error('Failed to read attached file.'));
          reader.readAsDataURL(file);
        });
        setAttachment({
          name: file.name,
          mimeType: resolveClientMimeType(file),
          sizeLabel,
          base64Data: base64,
        });
      }
    } catch (err) {
      addToast(
        'File Read Error',
        err instanceof Error ? err.message : 'Could not read the selected file.',
        'error'
      );
    } finally {
      setReadingFile(false);
    }
    e.target.value = '';
  };

  const sendMessage = async (promptOverride?: string) => {
    if (loading || readingFile) return;
    const queryText = (promptOverride ?? input).trim();
    if (!queryText && !attachment) return;

    const userMsgText =
      queryText || `Extract and brief all data verbatim from attached document "${attachment?.name}".`;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: userMsgText,
      attachmentName: attachment?.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentAttachment = attachment;
    const validPriorHistory = messages.filter((m) => !m.error && m.id !== 'welcome' && m.id !== 'reset');
    const nextHistoryForApi = [...validPriorHistory, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    if (!promptOverride) setInput('');
    setAttachment(null);
    setLoading(true);
    setExtractingStructured(Boolean(currentAttachment));

    try {
      const attachmentPayload = currentAttachment
        ? {
            name: currentAttachment.name,
            mimeType: currentAttachment.mimeType,
            base64Data: currentAttachment.base64Data,
            textContent: currentAttachment.textContent,
          }
        : undefined;

      const chatPromise = fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistoryForApi.map((m) => ({ role: m.role, text: m.text })),
          practiceContext,
          attachment: attachmentPayload,
        }),
      });

      const extractPromise = attachmentPayload
        ? fetch('/api/copilot/extract-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attachmentPayload),
          })
        : null;

      const [chatResult, extractResult] = await Promise.allSettled([
        chatPromise,
        extractPromise ?? Promise.resolve(null),
      ]);

      if (chatResult.status === 'rejected') {
        throw chatResult.reason;
      }

      const chatRes = chatResult.value;
      const rawChatText = await chatRes.text();
      let chatJson: { reply?: string; error?: string } = {};
      try {
        chatJson = JSON.parse(rawChatText);
      } catch {
        throw new Error(rawChatText || `HTTP ${chatRes.status} from FinSight Copilot backend.`);
      }

      if (!chatRes.ok || !chatJson.reply) {
        throw new Error(chatJson?.error || `HTTP ${chatRes.status} from FinSight Copilot backend.`);
      }

      let extracted: ExtractedDocumentPayload | undefined;
      if (extractResult.status === 'fulfilled' && extractResult.value) {
        try {
          if (extractResult.value.ok) {
            const extData = await extractResult.value.json();
            extracted = extData.extracted;
          }
        } catch {
          // structured extraction is optional alongside main reply
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          text: chatJson.reply!,
          extracted,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach FinSight AI Copilot server.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now() + 1}`,
          role: 'assistant',
          text: msg,
          error: true,
          retryPrompt: userMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setExtractingStructured(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (copilotOpen && queuedCopilotPrompt) {
      const p = queuedCopilotPrompt;
      clearQueuedCopilotPrompt();
      void sendMessage(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotOpen, queuedCopilotPrompt]);

  if (!copilotOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#020611]/75 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCopilotOpen(false);
      }}
    >
      <aside className="w-full max-w-2xl h-full bg-[#081020] border-l border-[#1E2E4E] flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1A2945] bg-[#060C18] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-teal-600/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-slate-100 truncate">
                  FinSight AI Copilot
                </h2>
                <span className="text-[11px] font-mono text-teal-400">Live Context</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {clients.length} clients · {complianceTasks.filter((c) => c.status === 'Overdue').length} overdue · {anomalies.filter((a) => a.status === 'Flagged for CA Review').length} anomalies indexed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'reset',
                    role: 'assistant',
                    text: 'Conversation cleared. Ask a question about A Y & COMPANY records or attach a real document for verbatim extraction.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              title="Clear conversation"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#13223D]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCopilotOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#13223D]"
              aria-label="Close Copilot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Grounded Queries */}
        <div className="px-5 py-2.5 border-b border-[#16233B] bg-[#0A1326] flex items-center gap-2 overflow-x-auto shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          {SUGGESTED_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void sendMessage(q)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-[#101D36] hover:bg-[#162849] hover:text-white border border-[#223559] rounded-md whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#173361] border border-[#284E8C] text-slate-100'
                    : m.error
                    ? 'bg-rose-950/50 border border-rose-500/40 text-rose-200'
                    : 'bg-[#0D182E] border border-[#1E2E4E] text-slate-200'
                }`}
              >
                {m.attachmentName && (
                  <div className="mb-2 px-2.5 py-1.5 rounded-md bg-[#0B1426] border border-[#243B63] inline-flex items-center gap-2 text-[11px] font-mono text-teal-300">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.attachmentName}</span>
                  </div>
                )}

                {m.error && (
                  <div className="flex items-center justify-between gap-3 font-semibold text-rose-300 mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Copilot Request Failed</span>
                    </span>
                    {m.retryPrompt && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void sendMessage(m.retryPrompt)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-100"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap break-words">{m.text}</div>

                {/* Structured Verbatim Extraction Card + Document-to-Action */}
                {m.extracted && (
                  <div className="mt-3 pt-3 border-t border-[#1E2E4E] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-400">
                        Verbatim Extracted Fields
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {m.extracted.detectedCategory}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#081020] p-3 rounded-lg border border-[#192845] text-[11px]">
                      <div>
                        <span className="text-slate-500">Party</span>
                        <div className="font-medium text-slate-100">{m.extracted.partyName}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Ref / Invoice No.</span>
                        <div className="font-mono text-slate-100">{m.extracted.invoiceOrRefNo}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Date / Period</span>
                        <div className="font-mono text-slate-200">
                          {m.extracted.documentDate} {m.extracted.period ? `(${m.extracted.period})` : ''}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">GSTIN / PAN</span>
                        <div className="font-mono text-slate-200">
                          {m.extracted.gstin || m.extracted.pan || 'Not found in document'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Taxable Value</span>
                        <div className="font-mono tabular-nums text-slate-100">
                          {m.extracted.taxableValue !== null ? formatINR(m.extracted.taxableValue) : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Amount</span>
                        <div className="font-mono tabular-nums font-semibold text-teal-300">
                          {m.extracted.totalAmount !== null ? formatINR(m.extracted.totalAmount) : '—'}
                        </div>
                      </div>
                    </div>

                    {m.extracted.anomaliesDetected.length > 0 && (
                      <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-200 space-y-1">
                        <div className="font-semibold text-amber-300">
                          Discrepancies / Checks Flagged ({m.extracted.anomaliesDetected.length})
                        </div>
                        {m.extracted.anomaliesDetected.map((a, idx) => (
                          <div key={idx}>• {a}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        value={extractClientId}
                        onChange={(e) => setExtractClientId(e.target.value)}
                        className="px-2.5 py-1.5 text-[11px] bg-[#0B1426] border border-[#243B63] rounded-md text-slate-200"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          runDocumentToActionPipeline({
                            clientId: extractClientId,
                            name: m.extracted!.documentTitle || 'Extracted_Document.pdf',
                            fileType: 'PDF',
                            fileSize: 'Extracted',
                            category: m.extracted!.detectedCategory,
                            previewSummary: m.extracted!.executiveBriefing,
                            extractedMetrics: {
                              taxableValue: m.extracted!.taxableValue ?? undefined,
                              gstAmount: m.extracted!.gstAmount ?? undefined,
                              totalAmount: m.extracted!.totalAmount ?? undefined,
                              period: m.extracted!.period,
                              referenceNo: m.extracted!.invoiceOrRefNo,
                            },
                            detectedIssues: m.extracted!.anomaliesDetected,
                          });
                          addToast('Pipeline completed', 'Document saved & CA review task queued.');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Run Document-to-Action Workflow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCopilotOpen(false);
                          setActiveSection('tasks');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#101C33] hover:bg-[#172848] border border-[#243B63] text-[11px] text-slate-300"
                      >
                        <span>View Tasks</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">
                {m.role === 'user' ? 'You' : 'FinSight Copilot'} · {m.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-teal-300 bg-[#0D182E] border border-[#1E2E4E] rounded-xl px-4 py-3 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {extractingStructured
                  ? 'Analyzing document & structuring verbatim fields...'
                  : 'Analyzing practice records...'}
              </span>
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-[#1A2945] bg-[#060C18] space-y-2.5 shrink-0">
          {attachment && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0D182E] border border-teal-500/40 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="truncate font-medium text-slate-100">{attachment.name}</span>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {attachment.sizeLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-slate-400 hover:text-rose-400 text-[11px]"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt,.json"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload real PDF, image, CSV, or text statement for verbatim extraction"
              className="p-2.5 rounded-lg bg-[#0F1B33] hover:bg-[#172849] border border-[#223559] text-slate-300 hover:text-teal-300 transition-colors shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask about clients, overdue GST tasks, staff workload, or attach a document to extract verbatim..."
              className="flex-1 px-3 py-2 text-xs bg-[#0B1426] border border-[#223559] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            />

            <button
              type="button"
              disabled={loading || readingFile || (!input.trim() && !attachment)}
              onClick={() => void sendMessage()}
              className="p-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-colors shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Supports PDF, PNG/JPG scans, CSV &amp; TXT · Verbatim extraction preserves source figures as-is without modification.
          </p>
        </div>
      </aside>
    </div>
  );
};
