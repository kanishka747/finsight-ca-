import React, { useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  Search,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Info,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { formatINR, usePractice } from '../context/PracticeContext';
import {
  DocumentCategory,
  DocumentRecord,
  FinancialYear,
} from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusLabel } from '../components/ui/StatusText';

const ALLOWED_EXTENSIONS = ['pdf', 'xlsx', 'xls', 'csv', 'jpg', 'jpeg', 'png'];
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

export const DocumentsPage: React.FC = () => {
  const {
    documents,
    clients,
    selectedFY,
    settings,
    currentUser,
    addDocument,
    updateDocumentStatus,
    addDocumentComment,
    openClientProfile,
    openCopilotWithPrompt,
    addToast,
  } = usePractice();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadClient, setUploadClient] = useState(clients[0]?.id || 'cli-1');
  const [uploadFy, setUploadFy] = useState<FinancialYear>(selectedFY);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Bank Statements');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [commentText, setCommentText] = useState('');

  const activeDoc = useMemo(
    () => documents.find((d) => d.id === activeDocId) || null,
    [documents, activeDocId]
  );

  const validateAndAddFiles = (files: FileList | null) => {
    setUploadError('');
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError(
          `Unsupported file type ".${ext}". Allowed: PDF, XLSX, CSV, JPG, PNG.`
        );
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(`"${file.name}" exceeds the 15 MB limit.`);
        return;
      }

      const fileType =
        ext === 'xlsx' || ext === 'xls'
          ? 'XLSX'
          : ext === 'csv'
          ? 'CSV'
          : ext === 'jpg' || ext === 'jpeg'
          ? 'JPG'
          : ext === 'png'
          ? 'PNG'
          : 'PDF';

      const sizeKB = Math.max(12, Math.round(file.size / 1024));
      const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      addDocument({
        name: file.name,
        fileType,
        fileSize: sizeStr,
        clientId: uploadClient,
        category: uploadCategory,
        financialYear: uploadFy,
        uploadedBy: currentUser.name,
        uploadedByRole: 'Staff',
        status: 'Pending Review',
        previewSummary: `Frontend demo file entry (${file.name}, ${sizeStr}) recorded locally in browser storage.`,
      });
    });
  };

  const handleSampleUpload = () => {
    const client = clients.find((c) => c.id === uploadClient);
    const shortName = (client?.name || 'Client').replace(/[^A-Za-z0-9]/g, '_').slice(0, 18);
    const catSlug = uploadCategory.replace(/[^A-Za-z0-9]/g, '_');
    addDocument({
      name: `${shortName}_${catSlug}_${uploadFy.replace(/\s+/g, '')}.pdf`,
      fileType: 'PDF',
      fileSize: '940 KB',
      clientId: uploadClient,
      category: uploadCategory,
      financialYear: uploadFy,
      uploadedBy: currentUser.name,
      uploadedByRole: 'Staff',
      status: 'Pending Review',
      previewSummary: `Generated demo placeholder for ${client?.name} (${uploadCategory}, ${uploadFy}).`,
    });
  };

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (filterClient !== 'All' && d.clientId !== filterClient) return false;
      if (filterCategory !== 'All' && d.category !== filterCategory) return false;
      if (filterStatus !== 'All' && d.status !== filterStatus) return false;
      if (filterDate && d.uploadDate !== filterDate) return false;
      if (q) {
        const clientName = clients.find((c) => c.id === d.clientId)?.name.toLowerCase() || '';
        if (
          !d.name.toLowerCase().includes(q) &&
          !d.category.toLowerCase().includes(q) &&
          !clientName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [documents, clients, search, filterClient, filterCategory, filterStatus, filterDate]);

  const allFilteredSelected =
    filteredDocs.length > 0 && filteredDocs.every((d) => selectedIds.includes(d.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map((d) => d.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = (status: 'Verified' | 'Replacement Required') => {
    selectedIds.forEach((id) =>
      updateDocumentStatus(id, status, `Bulk action (${status}) by ${currentUser.name}`)
    );
    setSelectedIds([]);
  };

  const handleBulkExportCSV = () => {
    const rows = documents.filter((d) => selectedIds.includes(d.id));
    const lines = [
      'Document Name,Client,Category,FY,Upload Date,Uploaded By,Status',
      ...rows.map((d) => {
        const cName = clients.find((c) => c.id === d.clientId)?.name || '';
        return [d.name, cName, d.category, d.financialYear, d.uploadDate, d.uploadedBy, d.status]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      }),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSight_Documents_Selection_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Metadata CSV exported', `${rows.length} selected document records`);
  };

  const handleDownloadDemoSummary = (doc: DocumentRecord) => {
    const client = clients.find((c) => c.id === doc.clientId);
    const content = [
      `FinSight — A Y & COMPANY (Chartered Accountants, Jaipur)`,
      `Frontend Demo Document Record Summary`,
      `--------------------------------------------------`,
      `Document Name : ${doc.name}`,
      `Client        : ${client?.name || doc.clientId} (${client?.clientCode || ''})`,
      `Category      : ${doc.category}`,
      `Financial Year: ${doc.financialYear}`,
      `Upload Date   : ${doc.uploadDate}`,
      `Uploaded By   : ${doc.uploadedBy} (${doc.uploadedByRole})`,
      `Status        : ${doc.status}`,
      `Summary       : ${doc.previewSummary}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\.[^.]+$/, '')}_metadata.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Metadata summary downloaded', `${doc.name} (demo preview file)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">Document Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized verification workspace with bulk review actions · {filteredDocs.length} records shown
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() =>
              openCopilotWithPrompt(
                'List all documents awaiting review or marked replacement required, grouped by client.'
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-200 bg-[#0E2240] hover:bg-[#14305A] border border-teal-500/40 rounded-lg whitespace-nowrap transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            Ask Copilot
          </button>
          <button
            type="button"
            onClick={handleSampleUpload}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#081020] border border-[#223559] rounded-lg hover:bg-[#101C33] hover:text-white whitespace-nowrap transition-colors"
          >
            Add Sample Entry
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg whitespace-nowrap transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Upload Workspace */}
      <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Client</label>
            <select
              value={uploadClient}
              onChange={(e) => setUploadClient(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Financial Year</label>
            <select
              value={uploadFy}
              onChange={(e) => setUploadFy(e.target.value as FinancialYear)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {settings.availableFinancialYears.map((fy) => (
                <option key={fy}>{fy}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Document Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {settings.enabledDocumentCategories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            validateAndAddFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-teal-400 bg-teal-500/10'
              : 'border-[#223559] hover:border-teal-500/60 bg-[#081020]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              validateAndAddFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <UploadCloud className="w-6 h-6 text-teal-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-100">
            Drag and drop PDF, Excel, CSV, or image files here, or click to browse
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Validates type (.pdf, .xlsx, .csv, .jpg, .png) &amp; size (max 15 MB). Prototype records metadata locally in browser storage.
          </p>
        </div>

        {uploadError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {uploadError}
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename or client..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
        >
          <option value="All">All Categories</option>
          {settings.enabledDocumentCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
        >
          <option value="All">All Statuses</option>
          <option>Uploaded</option>
          <option>Pending Review</option>
          <option>Verified</option>
          <option>Rejected</option>
          <option>Replacement Required</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="flex-1 px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            aria-label="Filter by upload date"
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className="text-xs text-slate-400 hover:text-slate-100 px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#0E2240] border border-teal-500/40 text-slate-100 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium font-mono tabular-nums text-teal-200">
            {selectedIds.length} document{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatus('Verified')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Bulk Approve
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus('Replacement Required')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Request Replacement
            </button>
            <button
              type="button"
              onClick={handleBulkExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#14274A] hover:bg-[#1B3360] border border-[#274680] text-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Metadata CSV
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Document Table */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                <th className="py-3 px-4 w-9">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all documents"
                    className="w-3.5 h-3.5 accent-teal-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">FY</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15223C]">
              {filteredDocs.map((doc) => {
                const client = clients.find((c) => c.id === doc.clientId);
                const checked = selectedIds.includes(doc.id);
                return (
                  <tr
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`cursor-pointer transition-colors ${
                      checked ? 'bg-[#102342]' : 'hover:bg-[#101C33]'
                    }`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectRow(doc.id)}
                        aria-label={`Select ${doc.name}`}
                        className="w-3.5 h-3.5 accent-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{doc.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 pl-5">
                        {doc.fileType} · {doc.fileSize}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 text-sky-400 font-medium hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (client) openClientProfile(client.id);
                      }}
                    >
                      {client?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{doc.category}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{doc.financialYear}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {doc.uploadedBy}
                      <span className="text-slate-500"> · {doc.uploadedByRole}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{doc.uploadDate}</td>
                    <td className="py-3 px-4">
                      <StatusLabel status={doc.status} />
                    </td>
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveDocId(doc.id)}
                        className="inline-flex items-center gap-1 text-teal-400 hover:underline font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDemoSummary(doc)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100 font-medium"
                        title="Download Metadata Summary"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No documents match your active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Modal */}
      <Modal
        open={!!activeDoc}
        onClose={() => {
          setActiveDocId(null);
          setReviewNote('');
          setCommentText('');
        }}
        title={activeDoc?.name || ''}
        subtitle={
          activeDoc
            ? `${clients.find((c) => c.id === activeDoc.clientId)?.name || ''} · ${activeDoc.category} · ${activeDoc.financialYear}`
            : ''
        }
        maxWidthClass="max-w-4xl"
      >
        {activeDoc && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="border border-[#1E2E4E] rounded-xl bg-[#081020] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#192845] pb-3">
                  <span className="text-xs font-semibold text-slate-200">
                    Document Preview (Demo Representation)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeDoc.fileType} · {activeDoc.fileSize}
                  </span>
                </div>

                <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-lg p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-sky-400">
                      {clients.find((c) => c.id === activeDoc.clientId)?.name}
                    </span>
                    <span className="font-mono text-slate-400">{activeDoc.uploadDate}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{activeDoc.previewSummary}</p>

                  {activeDoc.extractedMetrics && (
                    <div className="pt-3 border-t border-[#192845] grid grid-cols-2 gap-3">
                      {activeDoc.extractedMetrics.period && (
                        <div>
                          <div className="text-slate-400">Period</div>
                          <div className="font-mono font-medium text-slate-100">
                            {activeDoc.extractedMetrics.period}
                          </div>
                        </div>
                      )}
                      {activeDoc.extractedMetrics.invoiceCount !== undefined && (
                        <div>
                          <div className="text-slate-400">Invoice Count</div>
                          <div className="font-mono font-medium text-slate-100">
                            {activeDoc.extractedMetrics.invoiceCount}
                          </div>
                        </div>
                      )}
                      {activeDoc.extractedMetrics.taxableValue !== undefined && (
                        <div>
                          <div className="text-slate-400">Taxable Value</div>
                          <div className="font-mono font-medium text-slate-100">
                            {formatINR(activeDoc.extractedMetrics.taxableValue)}
                          </div>
                        </div>
                      )}
                      {activeDoc.extractedMetrics.totalAmount !== undefined && (
                        <div>
                          <div className="text-slate-400">Total Amount</div>
                          <div className="font-mono font-semibold text-teal-400">
                            {formatINR(activeDoc.extractedMetrics.totalAmount)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Info className="w-3.5 h-3.5 text-teal-400" />
                    Demo preview placeholder (no remote file server connected).
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadDemoSummary(activeDoc)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Summary
                  </button>
                </div>
              </div>

              <div className="border border-[#1E2E4E] bg-[#081020] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-100 mb-2.5">Verification History</h3>
                <div className="space-y-2">
                  {activeDoc.history.map((h) => (
                    <div key={h.id} className="flex items-start justify-between text-xs gap-2">
                      <div>
                        <span className="font-medium text-slate-200">{h.action}</span>
                        <span className="text-slate-400"> by {h.actor}</span>
                        {h.notes && <p className="text-[11px] text-slate-400">{h.notes}</p>}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">
                        {h.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="border border-[#1E2E4E] bg-[#081020] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-100">Review Status</span>
                  <StatusLabel status={activeDoc.status} />
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#192845]">
                  <div>
                    <dt className="text-slate-400">Uploaded By</dt>
                    <dd className="font-medium text-slate-200">{activeDoc.uploadedBy}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Upload Date</dt>
                    <dd className="font-mono text-slate-200">{activeDoc.uploadDate}</dd>
                  </div>
                </dl>

                <div className="pt-2 border-t border-[#192845] space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Review Note (optional)
                  </label>
                  <input
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Add reason for approval or rejection..."
                    className="w-full px-3 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateDocumentStatus(
                          activeDoc.id,
                          'Verified',
                          reviewNote.trim() || 'Verified by CA team'
                        );
                        setReviewNote('');
                      }}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateDocumentStatus(
                          activeDoc.id,
                          'Replacement Required',
                          reviewNote.trim() || 'Replacement requested'
                        );
                        setReviewNote('');
                      }}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateDocumentStatus(
                          activeDoc.id,
                          'Rejected',
                          reviewNote.trim() || 'Rejected — see comments'
                        );
                        setReviewNote('');
                      }}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-[#1E2E4E] bg-[#081020] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  Internal &amp; Client Review Comments
                </h3>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {activeDoc.comments.map((c) => (
                    <div key={c.id} className="bg-[#0B1426] border border-[#192845] rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">
                          {c.author} <span className="font-normal text-slate-400">({c.role})</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{c.text}</p>
                    </div>
                  ))}
                  {activeDoc.comments.length === 0 && (
                    <p className="text-xs text-slate-500">No comments added yet.</p>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!commentText.trim()) return;
                    addDocumentComment(activeDoc.id, commentText.trim());
                    setCommentText('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a review comment..."
                    className="flex-1 px-3 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#14274A] hover:bg-[#1B3360] border border-[#274680] rounded-lg transition-colors"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
