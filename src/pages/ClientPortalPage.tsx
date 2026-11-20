import React, { useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Download,
  Send,
  CheckCircle2,
  Edit3,
  ArrowLeftRight,
  Info,
} from 'lucide-react';
import {
  computeMissingDocsForClient,
  usePractice,
} from '../context/PracticeContext';
import { DocumentCategory, DocumentRequest } from '../types';
import { StatusLabel } from '../components/ui/StatusText';
import { Modal } from '../components/ui/Modal';

export const ClientPortalPage: React.FC = () => {
  const {
    clients,
    documents,
    complianceTasks,
    docRequests,
    communications,
    notifications,
    previewClientId,
    setPreviewClientId,
    selectedFY,
    setActiveSection,
    addDocument,
    fulfillDocumentRequest,
    addCommunication,
    updateClient,
    addToast,
  } = usePractice();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeRequestForUpload, setActiveRequestForUpload] = useState<DocumentRequest | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Bank Statements');
  const [messageText, setMessageText] = useState('');

  const [contactOpen, setContactOpen] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const client = useMemo(
    () => clients.find((c) => c.id === previewClientId) || clients[0],
    [clients, previewClientId]
  );

  const clientDocs = useMemo(
    () => documents.filter((d) => d.clientId === client.id),
    [documents, client.id]
  );

  const clientRequests = useMemo(
    () => docRequests.filter((r) => r.clientId === client.id),
    [docRequests, client.id]
  );

  const clientCompliance = useMemo(
    () => complianceTasks.filter((c) => c.clientId === client.id),
    [complianceTasks, client.id]
  );

  const clientMissing = useMemo(
    () => computeMissingDocsForClient(client, documents, selectedFY),
    [client, documents, selectedFY]
  );

  const clientComms = useMemo(
    () => communications.filter((c) => c.clientId === client.id),
    [communications, client.id]
  );

  const clientNotifs = useMemo(
    () => notifications.filter((n) => n.clientId === client.id).slice(0, 4),
    [notifications, client.id]
  );

  const authorizedReports = useMemo(
    () =>
      clientDocs.filter(
        (d) =>
          d.status === 'Verified' &&
          (d.category === 'Audit Reports' ||
            d.category === 'Balance Sheets' ||
            d.category === 'Income Tax Returns' ||
            d.category === 'TDS Certificates' ||
            d.category === 'Form 16')
      ),
    [clientDocs]
  );

  // Sample workflow state detection
  const bankReq = clientRequests.find((r) => r.category === 'Bank Statements');
  const bankDoc = bankReq?.linkedDocumentId
    ? clientDocs.find((d) => d.id === bankReq.linkedDocumentId)
    : clientDocs.find((d) => d.category === 'Bank Statements' && d.financialYear === selectedFY);

  const workflowStep = bankDoc
    ? bankDoc.status === 'Verified'
      ? 4
      : 3
    : bankReq
    ? 2
    : 1;

  const handleClientUpload = (file: File | null, req?: DocumentRequest | null) => {
    const fileName =
      file?.name ||
      `${client.name.replace(/\s+/g, '_')}_${(req?.category || uploadCategory).replace(
        /\s+/g,
        '_'
      )}_${selectedFY.replace(/\s+/g, '')}.pdf`;

    const created = addDocument({
      name: fileName,
      fileType: fileName.endsWith('.xlsx') ? 'XLSX' : 'PDF',
      fileSize: file ? `${Math.max(45, Math.round(file.size / 1024))} KB` : '860 KB',
      clientId: client.id,
      category: req?.category || uploadCategory,
      financialYear: selectedFY,
      uploadedBy: `${client.name} (Client Portal)`,
      uploadedByRole: 'Client',
      status: 'Pending Review',
      previewSummary: `Uploaded via Client Portal by ${client.name}. Awaiting A Y & COMPANY verification.`,
      linkedRequestId: req?.id,
    });

    if (req) {
      fulfillDocumentRequest(req.id, created.id);
    }
    setActiveRequestForUpload(null);
  };

  const handleDownloadReport = (docName: string) => {
    const text = `Authorized Report Copy (Demo)\nIssued by: A Y & COMPANY, Chartered Accountants, Jaipur\nClient: ${client.name}\nDocument: ${docName}\nFinancial Year: ${selectedFY}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.replace(/\.[^.]+$/, '')}_authorized_demo.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report downloaded', docName);
  };

  const openContactEdit = () => {
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditAddress(client.address);
    setContactOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Demo Role-Switch Preview Banner */}
      <div className="bg-[#0E2240] border border-teal-500/35 text-slate-100 rounded-xl px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Demo Client Preview Mode</span> — Viewing FinSight as{' '}
            <span className="text-teal-300 font-semibold">{client.name}</span>. Internal CA staff notes and other clients&apos; records are hidden. Role switching here is a preview feature, not real authentication.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={client.id}
            onChange={(e) => setPreviewClientId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#081020] border border-[#223559] rounded-lg text-slate-100 focus:outline-none focus:border-teal-500"
            aria-label="Select preview client"
          >
            {clients
              .filter((c) => c.status === 'Active')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <button
            type="button"
            onClick={() => setActiveSection('documents')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg whitespace-nowrap transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Switch to CA Review
          </button>
        </div>
      </div>

      {/* Client Welcome Header */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Welcome, {client.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Client Portal · A Y &amp; COMPANY, Chartered Accountants · {selectedFY} · Code:{' '}
            <span className="font-mono text-teal-400">{client.clientCode}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={openContactEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#081020] border border-[#223559] rounded-lg hover:bg-[#101C33] hover:text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Update Contact Info
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRequestForUpload(null);
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f) handleClientUpload(f, activeRequestForUpload);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* End-to-End Sample Workflow Tracker */}
      <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 font-display">
              Document Verification Workflow
            </h2>
            <p className="text-xs text-slate-400">
              Live status of bank statement request between A Y &amp; COMPANY and {client.name}
            </p>
          </div>
          {workflowStep === 2 && bankReq && (
            <button
              type="button"
              onClick={() => handleClientUpload(null, bankReq)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#14274A] hover:bg-[#1B3360] border border-[#274680] rounded-lg whitespace-nowrap transition-colors"
            >
              Simulate Client Upload for Request
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: 1, label: '1. CA Requests Statement', done: workflowStep >= 1 },
            { step: 2, label: '2. Client Receives Request', done: workflowStep >= 2 },
            { step: 3, label: '3. Client Uploads File', done: workflowStep >= 3 },
            { step: 4, label: '4. CA Verifies Document', done: workflowStep >= 4 },
          ].map((s) => (
            <div
              key={s.step}
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                s.done
                  ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 font-medium'
                  : 'bg-[#081020] border-[#1E2E4E] text-slate-400'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  s.done ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Document Requests & Missing Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#192845]">
            <h2 className="text-sm font-semibold text-slate-100 font-display">
              Pending Document Requests ({clientRequests.length})
            </h2>
            <span className="text-xs font-mono text-slate-400">{selectedFY}</span>
          </div>
          <div className="divide-y divide-[#15223C] mt-1">
            {clientRequests.map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-100">{req.title}</div>
                  <p className="text-xs text-slate-300 mt-0.5">{req.message}</p>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    Category: {req.category} · Due: {req.dueDate}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusLabel status={req.status} />
                  {(req.status === 'Sent to Client' || req.status === 'Correction Requested') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRequestForUpload(req);
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg whitespace-nowrap transition-colors"
                    >
                      Upload Now
                    </button>
                  )}
                </div>
              </div>
            ))}
            {clientRequests.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">
                No active document requests from A Y &amp; COMPANY.
              </p>
            )}
          </div>
        </section>

        <section className="lg:col-span-5 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 font-display pb-3 border-b border-[#192845]">
              Missing &amp; Required Documents ({selectedFY})
            </h2>
            <div className="divide-y divide-[#15223C] mt-1">
              {clientMissing.map((item) => (
                <div key={item.category} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.category}</span>
                  <div className="flex items-center gap-3">
                    <StatusLabel status={item.state} />
                    {item.state === 'Missing' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadCategory(item.category);
                          setActiveRequestForUpload(null);
                          fileInputRef.current?.click();
                        }}
                        className="text-teal-400 font-medium hover:underline"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#192845]">
            <h3 className="text-xs font-semibold text-slate-100 mb-2">Recent Notifications</h3>
            <div className="space-y-2">
              {clientNotifs.map((n) => (
                <div key={n.id} className="text-xs bg-[#081020] border border-[#192845] rounded-lg p-2.5">
                  <div className="font-medium text-slate-100">{n.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                </div>
              ))}
              {clientNotifs.length === 0 && (
                <p className="text-xs text-slate-500">No recent notifications.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* My Documents & Upcoming Compliance Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1E2E4E] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100 font-display">
              My Uploaded Documents ({clientDocs.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">Document</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15223C]">
                {clientDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#101C33] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{doc.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">{doc.category}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{doc.uploadDate}</td>
                    <td className="py-2.5 px-4">
                      <StatusLabel status={doc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-5 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 font-display pb-3 border-b border-[#192845]">
              Upcoming Deadlines &amp; Compliance Status
            </h2>
            <div className="divide-y divide-[#15223C] mt-1">
              {clientCompliance.map((cmp) => (
                <div key={cmp.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-medium text-slate-100">{cmp.title}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Due: {cmp.dueDate}
                    </div>
                  </div>
                  <StatusLabel status={cmp.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#192845]">
            <h2 className="text-sm font-semibold text-slate-100 font-display mb-2">
              Authorized Reports &amp; Filings
            </h2>
            <div className="space-y-2">
              {authorizedReports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between text-xs bg-[#081020] border border-[#192845] rounded-lg px-3 py-2"
                >
                  <span className="font-medium text-slate-200 truncate">{rep.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport(rep.name)}
                    className="inline-flex items-center gap-1 text-teal-400 font-medium hover:underline shrink-0 ml-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              ))}
              {authorizedReports.length === 0 && (
                <p className="text-xs text-slate-500">
                  Verified ITRs, Form 16, and Audit Reports will appear here once finalized.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Messages from CA Team */}
      <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-100 font-display">
          Messages with A Y &amp; COMPANY Team
        </h2>
        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {clientComms.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-lg text-xs border ${
                m.direction.startsWith('Inbound')
                  ? 'bg-teal-500/10 border-teal-500/30 ml-6'
                  : 'bg-[#081020] border-[#1E2E4E] mr-6'
              }`}
            >
              <div className="flex justify-between font-semibold text-slate-100">
                <span>
                  {m.sender} · <span className="font-normal text-slate-400">{m.subject}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">{m.timestamp}</span>
              </div>
              <p className="text-slate-300 mt-1">{m.message}</p>
            </div>
          ))}
          {clientComms.length === 0 && (
            <p className="text-xs text-slate-500">No messages exchanged yet.</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!messageText.trim()) return;
            addCommunication({
              clientId: client.id,
              direction: 'Inbound (Client -> CA)',
              channel: 'Client Portal',
              subject: 'Portal Message',
              message: messageText.trim(),
              sender: client.name,
            });
            setMessageText('');
          }}
          className="flex gap-2"
        >
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write a message to your assigned CA team..."
            className="flex-1 px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </section>

      {/* Update Permitted Contact Info Modal */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Update Permitted Contact Information"
        subtitle="PAN, GSTIN, and statutory identifiers require CA verification to modify"
        maxWidthClass="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateClient(client.id, {
              email: editEmail,
              phone: editPhone,
              address: editAddress,
            });
            setContactOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
            <input
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
            <input
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setContactOpen(false)}
              className="px-4 py-2 text-xs text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
            >
              Save Contact Details
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
