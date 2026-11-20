import React, { useMemo, useRef, useState } from 'react';
import {
  ScanLine,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Save,
  Info,
  Loader2,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Calculator,
  Zap,
  Bot,
} from 'lucide-react';
import { formatINR, usePractice } from '../context/PracticeContext';
import { DocumentCategory, ExtractedDocumentPayload, FinancialYear } from '../types';

type ScannerDocType = 'Tax Invoice' | 'Bank Statement' | 'PAN / GST Certificate';

interface ExtractionField {
  key: string;
  label: string;
  value: string;
  confidence?: number;
  missingWarning?: string;
}

const SAMPLE_TEMPLATES: Record<
  ScannerDocType,
  { fileName: string; fields: ExtractionField[]; warnings: string[] }
> = {
  'Tax Invoice': {
    fileName: 'Sample_B2B_Tax_Invoice_Jaipur_Steel.pdf',
    warnings: [
      'Supplier State Code matches Rajasthan (08); confirm IGST is ₹0 for intra-state supply.',
      'AI-extracted values are provisional and require CA review before GST return posting.',
    ],
    fields: [
      { key: 'supplierName', label: 'Supplier Name', value: 'Jaipur Precision Steels Pvt Ltd (Demo)', confidence: 98 },
      { key: 'supplierGstin', label: 'Supplier GSTIN', value: '08AAECJ0041M1Z2', confidence: 96 },
      { key: 'customerName', label: 'Customer Name', value: 'ABC Private Limited', confidence: 99 },
      { key: 'customerGstin', label: 'Customer GSTIN', value: '08AABCA0001D1Z5', confidence: 97 },
      { key: 'invoiceNumber', label: 'Invoice Number', value: 'JPS/26-27/0842', confidence: 95 },
      { key: 'invoiceDate', label: 'Invoice Date', value: '2026-11-12', confidence: 94 },
      { key: 'taxableValue', label: 'Taxable Value (INR)', value: '185000', confidence: 98 },
      { key: 'cgst', label: 'CGST (9%)', value: '16650', confidence: 97 },
      { key: 'sgst', label: 'SGST (9%)', value: '16650', confidence: 97 },
      { key: 'igst', label: 'IGST', value: '0', confidence: 99 },
      { key: 'totalAmount', label: 'Total Invoice Amount (INR)', value: '218300', confidence: 98 },
    ],
  },
  'Bank Statement': {
    fileName: 'Sample_HDFC_Current_Account_Oct2026.pdf',
    warnings: [
      'Account number automatically masked for confidentiality.',
      '2 narration lines flagged for manual ledger classification.',
    ],
    fields: [
      { key: 'accountHolder', label: 'Account Holder', value: 'ABC Private Limited', confidence: 99 },
      { key: 'bankName', label: 'Bank Name', value: 'HDFC Bank Ltd — Sitapura Branch', confidence: 98 },
      { key: 'accountNumber', label: 'Account Number (Masked)', value: 'XXXX-XXXX-4918', confidence: 99 },
      { key: 'statementPeriod', label: 'Statement Period', value: '01 Oct 2026 – 31 Oct 2026', confidence: 97 },
      { key: 'openingBalance', label: 'Opening Balance (INR)', value: '1245600', confidence: 95 },
      { key: 'closingBalance', label: 'Closing Balance (INR)', value: '1682450', confidence: 95 },
      { key: 'transactionCount', label: 'Transaction Count', value: '118', confidence: 92 },
    ],
  },
  'PAN / GST Certificate': {
    fileName: 'Sample_GST_REG06_Certificate.pdf',
    warnings: [
      'Sensitive tax identifiers masked in preview; confirm full ID against MCA/GST portal.',
    ],
    fields: [
      { key: 'legalName', label: 'Legal Name of Business', value: 'Greenfield Industries Pvt Ltd', confidence: 99 },
      { key: 'tradeName', label: 'Trade Name', value: 'Greenfield Packaging', confidence: 96 },
      { key: 'panMasked', label: 'PAN (Masked)', value: 'AAB••••06M', confidence: 98 },
      { key: 'gstinMasked', label: 'GSTIN (Masked)', value: '08AAB••••06M1Z7', confidence: 97 },
      { key: 'constitution', label: 'Constitution of Business', value: 'Private Limited Company', confidence: 99 },
      { key: 'regDate', label: 'Date of Registration', value: '2017-07-01', confidence: 94 },
      { key: 'jurisdiction', label: 'State / Jurisdiction', value: 'Rajasthan — Jaipur Ward 4', confidence: 91 },
    ],
  },
};

function resolveScannerMimeType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'csv') return 'text/csv';
  if (ext === 'txt' || ext === 'json') return 'text/plain';
  return file.type || 'application/pdf';
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read local file.'));
    reader.readAsDataURL(file);
  });
}

export const AiScannerPage: React.FC = () => {
  const {
    clients,
    selectedFY,
    settings,
    currentUser,
    addDocument,
    addFinancialRecord,
    runDocumentToActionPipeline,
    openCopilotWithPrompt,
    addToast,
  } = usePractice();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState<ScannerDocType>('Tax Invoice');
  const [clientId, setClientId] = useState(clients[0]?.id || 'cli-1');
  const [fy, setFy] = useState<FinancialYear>(selectedFY);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('640 KB');
  const [isScanning, setIsScanning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [scanResult, setScanResult] = useState<{
    mode: 'sample' | 'gemini-live' | 'manual';
    docType: ScannerDocType;
    fileName: string;
    fields: ExtractionField[];
    warnings: string[];
    caApproved: boolean;
    livePayload?: ExtractedDocumentPayload;
  } | null>(null);

  const runSampleScan = (typeOverride?: ScannerDocType) => {
    const activeType = typeOverride ?? docType;
    setApiError(null);
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const tpl = SAMPLE_TEMPLATES[activeType];
      setScanResult({
        mode: 'sample',
        docType: activeType,
        fileName: tpl.fileName,
        fields: tpl.fields.map((f) => ({ ...f })),
        warnings: tpl.warnings,
        caApproved: false,
      });
      setIsScanning(false);
    }, 650);
  };

  const handleUserFileSelected = async (file: File | null) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const sizeKB = Math.max(12, Math.round(file.size / 1024));
    setUploadedFileSize(sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);
    setApiError(null);
    setIsScanning(true);
    setScanResult(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const resolvedMime = resolveScannerMimeType(file);
      const isText = ext === 'csv' || ext === 'txt' || ext === 'json' || resolvedMime.startsWith('text/');
      const isSupportedBinary = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(resolvedMime);

      if (!isText && !isSupportedBinary) {
        throw new Error(
          `Unsupported file format (.${ext || 'unknown'}). Please upload PDF, PNG, JPG, WEBP, CSV, or TXT.`
        );
      }

      const payload: {
        name: string;
        mimeType: string;
        base64Data?: string;
        textContent?: string;
      } = {
        name: file.name,
        mimeType: resolvedMime,
      };

      if (isText) {
        payload.textContent = await file.text();
      } else {
        payload.base64Data = await readFileAsBase64(file);
      }

      const res = await fetch('/api/copilot/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data: { extracted?: ExtractedDocumentPayload; error?: string; modelUsed?: string } = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(`Unexpected response (HTTP ${res.status}): ${rawText.slice(0, 180)}`);
        }
      }

      if (!res.ok || !data.extracted) {
        throw new Error(data.error || `Extraction failed (HTTP ${res.status}).`);
      }

      const extData: ExtractedDocumentPayload = data.extracted;
      const inferredType: ScannerDocType =
        extData.detectedCategory === 'Bank Statements'
          ? 'Bank Statement'
          : extData.detectedCategory === 'PAN Card' ||
            extData.detectedCategory === 'GST Registration Certificate'
          ? 'PAN / GST Certificate'
          : 'Tax Invoice';

      setDocType(inferredType);

      const liveFields: ExtractionField[] = [
        { key: 'partyName', label: 'Primary Party / Issuer', value: extData.partyName || '' },
        {
          key: 'counterpartyName',
          label: 'Counterparty / Recipient',
          value: extData.counterpartyName || '',
        },
        { key: 'gstin', label: 'GSTIN (Verbatim)', value: extData.gstin || '' },
        { key: 'pan', label: 'PAN (Verbatim)', value: extData.pan || '' },
        {
          key: 'invoiceOrRefNo',
          label: 'Invoice / Reference No.',
          value: extData.invoiceOrRefNo || '',
        },
        { key: 'documentDate', label: 'Document Date', value: extData.documentDate || '' },
        {
          key: 'taxableValue',
          label: 'Taxable Value (INR)',
          value: extData.taxableValue !== null && extData.taxableValue !== undefined ? String(extData.taxableValue) : '',
        },
        {
          key: 'cgst',
          label: 'CGST (INR)',
          value: extData.cgst !== null && extData.cgst !== undefined ? String(extData.cgst) : '0',
        },
        {
          key: 'sgst',
          label: 'SGST (INR)',
          value: extData.sgst !== null && extData.sgst !== undefined ? String(extData.sgst) : '0',
        },
        {
          key: 'igst',
          label: 'IGST (INR)',
          value: extData.igst !== null && extData.igst !== undefined ? String(extData.igst) : '0',
        },
        {
          key: 'totalAmount',
          label: 'Total Amount (INR)',
          value: extData.totalAmount !== null && extData.totalAmount !== undefined ? String(extData.totalAmount) : '',
        },
      ];

      setScanResult({
        mode: 'gemini-live',
        docType: inferredType,
        fileName: file.name,
        fields: liveFields,
        warnings:
          extData.anomaliesDetected.length > 0
            ? extData.anomaliesDetected
            : ['Verbatim Gemini extraction completed. Verify fields before CA approval.'],
        caApproved: false,
        livePayload: extData,
      });
      addToast('Verbatim Extraction Complete', `${file.name} parsed without altering figures.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to extract document.';
      setApiError(msg);

      const blankFields = SAMPLE_TEMPLATES[docType].fields.map((f) => ({
        ...f,
        value: '',
        confidence: undefined,
        missingWarning: 'Manual entry required (live AI extraction unavailable)',
      }));

      setScanResult({
        mode: 'manual',
        docType,
        fileName: file.name,
        fields: blankFields,
        warnings: [
          msg,
          'No OCR values were fabricated. Enter fields manually on the right or load a Synthetic Sample Demo.',
        ],
        caApproved: false,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const updateFieldValue = (key: string, value: string) => {
    if (!scanResult) return;
    setScanResult({
      ...scanResult,
      fields: scanResult.fields.map((f) =>
        f.key === key
          ? { ...f, value, missingWarning: value.trim() ? undefined : 'Field empty' }
          : f
      ),
    });
  };

  // Live GST Arithmetic Validator for Tax Invoice
  const gstCheck = useMemo(() => {
    if (!scanResult || scanResult.docType !== 'Tax Invoice') return null;
    const num = (k: string) => {
      const raw = scanResult.fields.find((f) => f.key === k)?.value || '0';
      const parsed = Number(raw.replace(/[^0-9.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const taxable = num('taxableValue');
    const cgst = num('cgst');
    const sgst = num('sgst');
    const igst = num('igst');
    const total = num('totalAmount');
    const computedTotal = taxable + cgst + sgst + igst;
    const diff = Math.abs(total - computedTotal);
    const cgstSgstEqual = cgst === sgst;

    return {
      taxable,
      taxTotal: cgst + sgst + igst,
      computedTotal,
      total,
      diff,
      cgstSgstEqual,
      isBalanced: diff <= 1 && cgstSgstEqual && taxable > 0,
    };
  }, [scanResult]);

  const getNum = (k: string) => {
    if (!scanResult) return 0;
    const raw = scanResult.fields.find((f) => f.key === k)?.value || '0';
    const n = Number(raw.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const resolveMappedCategory = (): DocumentCategory => {
    if (scanResult?.livePayload?.detectedCategory) {
      return scanResult.livePayload.detectedCategory;
    }
    if (scanResult?.docType === 'Tax Invoice') return 'Purchase Invoices';
    if (scanResult?.docType === 'Bank Statement') return 'Bank Statements';
    return 'GST Registration Certificate';
  };

  const handleSaveToClient = () => {
    if (!scanResult) return;

    const mappedCategory = resolveMappedCategory();
    const taxable = getNum('taxableValue');
    const cgst = getNum('cgst');
    const sgst = getNum('sgst');
    const igst = getNum('igst');
    const total = getNum('totalAmount') || getNum('closingBalance');

    addDocument({
      name: scanResult.fileName,
      fileType: scanResult.fileName.toLowerCase().endsWith('.csv')
        ? 'CSV'
        : scanResult.fileName.toLowerCase().endsWith('.png')
        ? 'PNG'
        : scanResult.fileName.toLowerCase().endsWith('.jpg') ||
          scanResult.fileName.toLowerCase().endsWith('.jpeg')
        ? 'JPG'
        : 'PDF',
      fileSize: uploadedFileSize,
      clientId,
      category: mappedCategory,
      financialYear: fy,
      uploadedBy: currentUser.name,
      uploadedByRole: 'Staff',
      status: scanResult.caApproved ? 'Verified' : 'Pending Review',
      previewSummary:
        scanResult.livePayload?.executiveBriefing ||
        `${
          scanResult.caApproved ? 'CA-Approved' : 'AI-Extracted (Provisional)'
        } entry from Scanner workbench.`,
      extractedMetrics: {
        taxableValue: taxable || undefined,
        gstAmount: cgst + sgst + igst || undefined,
        totalAmount: total || undefined,
        period: scanResult.livePayload?.period || 'Nov 2026',
      },
    });

    if (scanResult.docType === 'Tax Invoice' && taxable > 0) {
      addFinancialRecord({
        clientId,
        financialYear: fy,
        month: 'Nov 2026',
        sourceType: scanResult.caApproved
          ? 'Finalized Accounting Record'
          : 'Document-Extracted (Provisional)',
        revenue: 0,
        expenses: taxable,
        taxableValue: taxable,
        cgst,
        sgst,
        igst,
        invoiceCount: 1,
      });
    }

    addToast(
      'Saved to Client Records',
      scanResult.caApproved
        ? 'Marked CA-Approved and stored in Documents.'
        : 'Saved as Provisional AI-Extracted data pending final CA verification.'
    );
  };

  const handleRunDocumentToAction = () => {
    if (!scanResult) return;
    const mappedCategory = resolveMappedCategory();
    const taxable = getNum('taxableValue');
    const cgst = getNum('cgst');
    const sgst = getNum('sgst');
    const igst = getNum('igst');
    const total = getNum('totalAmount') || getNum('closingBalance');

    const detectedIssues = [
      ...(gstCheck && !gstCheck.isBalanced
        ? [
            `GST arithmetic variance detected: Computed ${formatINR(
              gstCheck.computedTotal
            )} vs Total ${formatINR(gstCheck.total)}`,
          ]
        : []),
      ...scanResult.warnings.filter(
        (w) =>
          !w.toLowerCase().includes('provisional') &&
          !w.toLowerCase().includes('verbatim gemini extraction completed')
      ),
    ];

    runDocumentToActionPipeline({
      clientId,
      name: scanResult.fileName,
      fileType: scanResult.fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'PDF',
      fileSize: uploadedFileSize,
      category: mappedCategory,
      previewSummary:
        scanResult.livePayload?.executiveBriefing ||
        `Extracted via AI Scanner & routed through Document-to-Action Automation.`,
      extractedMetrics: {
        taxableValue: taxable || undefined,
        gstAmount: cgst + sgst + igst || undefined,
        totalAmount: total || undefined,
        period: scanResult.livePayload?.period || 'Nov 2026',
      },
      detectedIssues,
    });
  };

  const highlightRing = (key: string) =>
    focusedField === key
      ? 'bg-teal-500/20 ring-2 ring-teal-400 text-teal-100 rounded px-1 -mx-1 transition-all'
      : 'transition-all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            AI Document Scanner &amp; Verification Workbench
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live verbatim Gemini extraction or synthetic template verification with GST arithmetic check &amp; CA sign-off
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() =>
              openCopilotWithPrompt(
                'Guide me on what documents I can upload for verbatim extraction and GST verification.'
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-200 bg-[#0E2240] hover:bg-[#14305A] border border-teal-500/40 rounded-lg whitespace-nowrap transition-colors"
          >
            <Bot className="w-4 h-4 text-teal-400" />
            Extract in Copilot
          </button>
          <button
            type="button"
            onClick={() => runSampleScan()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg whitespace-nowrap transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            Run Sample Extraction Demo
          </button>
        </div>
      </div>

      {/* Setup Card */}
      <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Supported Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as ScannerDocType)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option>Tax Invoice</option>
              <option>Bank Statement</option>
              <option>PAN / GST Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
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
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Financial Year
            </label>
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value as FinancialYear)}
              className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {settings.availableFinancialYears.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUserFileSelected(e.dataTransfer.files?.[0] || null);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#223559] hover:border-teal-500 rounded-xl p-6 text-center cursor-pointer bg-[#081020] transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              handleUserFileSelected(e.target.files?.[0] || null);
              e.target.value = '';
            }}
          />
          <UploadCloud className="w-7 h-7 text-teal-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-100">
            {uploadedFileName
              ? `Selected: ${uploadedFileName}`
              : 'Upload a real Tax Invoice, Bank Statement, or Tax Certificate (.pdf, .png, .jpg, .csv, .txt)'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Uploaded files are extracted verbatim via Gemini AI, or click &ldquo;Run Sample Extraction Demo&rdquo; for {docType}.
          </p>
        </div>

        {apiError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              Extracted figures are never rounded or altered automatically. All entries require CA verification before filing.
            </span>
          </div>
          <button
            type="button"
            onClick={() => runSampleScan()}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#14274A] hover:bg-[#1B3360] border border-[#274680] rounded-lg disabled:opacity-60 transition-colors"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning Document...
              </>
            ) : (
              <>
                <ScanLine className="w-3.5 h-3.5" />
                Run Sample Scan
              </>
            )}
          </button>
        </div>
      </section>

      {isScanning && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-10 text-center space-y-2">
          <Loader2 className="w-7 h-7 text-teal-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-100">
            Analyzing {uploadedFileName || docType} layout &amp; tax totals verbatim...
          </p>
          <p className="text-xs text-slate-400">
            Cross-checking GSTIN format, invoice numbering, and arithmetic consistency.
          </p>
        </div>
      )}

      {/* Split-Screen Verification Workbench */}
      {!isScanning && scanResult && (
        <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1E2E4E] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#081020]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Split Verification — {scanResult.fileName}
                </h2>
                <span
                  className={`text-xs font-medium ${
                    scanResult.caApproved ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {scanResult.caApproved
                    ? '· CA-Approved Data'
                    : scanResult.mode === 'gemini-live'
                    ? '· Verbatim Gemini Extraction (Provisional)'
                    : '· AI-Extracted (Provisional)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hover or focus any field on the right to inspect or trace its value
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  setScanResult({ ...scanResult, caApproved: !scanResult.caApproved })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  scanResult.caApproved
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#0B1426] border-[#223559] text-slate-300 hover:bg-[#101C33]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {scanResult.caApproved ? 'CA Approved' : 'Mark CA-Approved'}
              </button>
              <button
                type="button"
                onClick={handleSaveToClient}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-100 bg-[#14274A] hover:bg-[#1B3360] border border-[#274680] rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Records
              </button>
              <button
                type="button"
                onClick={handleRunDocumentToAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Run Document-to-Action
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1E2E4E]">
            {/* Left Pane: Interactive Document Facsimile Viewer */}
            <div className="lg:col-span-5 bg-[#070E1C] p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Document Source Preview</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(85, z - 15))}
                    className="p-1 rounded bg-[#0B1426] border border-[#223559] hover:bg-[#101C33] text-slate-300"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] w-10 text-center text-slate-300">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(115, z + 15))}
                    className="p-1 rounded bg-[#0B1426] border border-[#223559] hover:bg-[#101C33] text-slate-300"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex justify-center">
                <div
                  className="bg-[#0B1426] border border-[#1E2E4E] rounded-lg p-5 w-full text-[11px] text-slate-300 space-y-4 origin-top transition-transform"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {scanResult.mode === 'gemini-live' && scanResult.livePayload ? (
                    <div className="space-y-3">
                      <div className="border-b border-[#1E2E4E] pb-2.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-teal-400">
                          Verbatim Briefing · {scanResult.livePayload.detectedCategory}
                        </div>
                        <div className="font-bold text-xs text-slate-100 mt-0.5">
                          {scanResult.livePayload.documentTitle}
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {scanResult.livePayload.executiveBriefing}
                      </p>
                      {scanResult.livePayload.verbatimLineItems.length > 0 && (
                        <div className="pt-2 border-t border-[#192845] space-y-1.5">
                          <div className="text-[10px] font-mono uppercase text-slate-400">
                            Verbatim Extracted Line Items
                          </div>
                          <ul className="space-y-1 font-mono text-[11px] text-slate-200">
                            {scanResult.livePayload.verbatimLineItems.map((line, i) => (
                              <li
                                key={i}
                                className="bg-[#081020] border border-[#192845] rounded px-2.5 py-1.5"
                              >
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : scanResult.mode === 'manual' ? (
                    <div className="py-12 text-center space-y-2 text-slate-400">
                      <p className="font-semibold text-slate-100">{scanResult.fileName}</p>
                      <p>
                        Live extraction did not complete. Enter verified values manually in the right-hand panel or run the Sample Extraction Demo.
                      </p>
                    </div>
                  ) : scanResult.docType === 'Tax Invoice' ? (
                    <>
                      <div className="flex justify-between border-b border-[#1E2E4E] pb-3">
                        <div>
                          <div className={`font-bold text-xs text-slate-100 ${highlightRing('supplierName')}`}>
                            Jaipur Precision Steels Pvt Ltd (Demo)
                          </div>
                          <div className="text-slate-400">Sitapura Industrial Area, Jaipur · Rajasthan (08)</div>
                          <div className={`font-mono mt-0.5 text-slate-300 ${highlightRing('supplierGstin')}`}>
                            GSTIN: 08AAECJ0041M1Z2
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-teal-400 text-xs">TAX INVOICE</div>
                          <div className={`font-mono mt-1 ${highlightRing('invoiceNumber')}`}>
                            No: JPS/26-27/0842
                          </div>
                          <div className={`font-mono ${highlightRing('invoiceDate')}`}>
                            Date: 2026-11-12
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-[#1E2E4E] pb-2.5">
                        <div className="text-slate-500">Billed To:</div>
                        <div className={`font-semibold text-slate-100 ${highlightRing('customerName')}`}>
                          ABC Private Limited
                        </div>
                        <div className={`font-mono text-slate-300 ${highlightRing('customerGstin')}`}>
                          GSTIN: 08AABCA0001D1Z5
                        </div>
                      </div>

                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1E2E4E] text-slate-400">
                            <th className="py-1">Item / HSN 7208</th>
                            <th className="py-1 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#15223C] font-mono">
                          <tr>
                            <td className="py-1.5 font-sans">Cold Rolled Steel Sheets (Batch B-12)</td>
                            <td className={`py-1.5 text-right ${highlightRing('taxableValue')}`}>
                              1,85,000.00
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-sans">CGST @ 9%</td>
                            <td className={`py-1.5 text-right ${highlightRing('cgst')}`}>
                              16,650.00
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-sans">SGST @ 9%</td>
                            <td className={`py-1.5 text-right ${highlightRing('sgst')}`}>
                              16,650.00
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-sans">IGST @ 0%</td>
                            <td className={`py-1.5 text-right ${highlightRing('igst')}`}>0.00</td>
                          </tr>
                          <tr className="font-bold text-slate-100 border-t border-[#263C66]">
                            <td className="py-2 font-sans">Grand Total</td>
                            <td className={`py-2 text-right text-teal-400 ${highlightRing('totalAmount')}`}>
                              2,18,300.00
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  ) : scanResult.docType === 'Bank Statement' ? (
                    <>
                      <div className="flex justify-between border-b border-[#1E2E4E] pb-3">
                        <div>
                          <div className={`font-bold text-xs text-sky-400 ${highlightRing('bankName')}`}>
                            HDFC Bank Ltd — Sitapura Branch
                          </div>
                          <div className={`font-semibold mt-0.5 text-slate-100 ${highlightRing('accountHolder')}`}>
                            ABC Private Limited
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className={highlightRing('accountNumber')}>A/C: XXXX-XXXX-4918</div>
                          <div className={highlightRing('statementPeriod')}>
                            01 Oct 2026 – 31 Oct 2026
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-[#081020] border border-[#192845] p-2.5 rounded font-mono">
                        <div>
                          <div className="text-slate-400 font-sans">Opening Bal</div>
                          <div className={`font-semibold text-slate-100 ${highlightRing('openingBalance')}`}>
                            ₹12,45,600
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-sans">Transactions</div>
                          <div className={`font-semibold text-slate-100 ${highlightRing('transactionCount')}`}>
                            118 entries
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-sans">Closing Bal</div>
                          <div className={`font-semibold text-teal-400 ${highlightRing('closingBalance')}`}>
                            ₹16,82,450
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 font-mono text-[10px] text-slate-400 border-t border-[#192845] pt-2">
                        <div className="flex justify-between">
                          <span>04 Oct · NEFT INWARD RAJASTHAN INFRA</span>
                          <span className="text-emerald-400">+₹4,20,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>11 Oct · RTGS SUPPLIER SETTLEMENT</span>
                          <span className="text-rose-400">-₹1,85,400</span>
                        </div>
                        <div className="flex justify-between">
                          <span>20 Oct · GST PMT-06 CHALLAN DEBIT</span>
                          <span className="text-rose-400">-₹1,12,800</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-[#1E2E4E] pb-3 text-center">
                        <div className="font-bold text-xs text-sky-400">
                          FORM GST REG-06 · REGISTRATION CERTIFICATE (DEMO)
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className={highlightRing('legalName')}>
                          <span className="text-slate-400">Legal Name:</span>{' '}
                          <strong className="text-slate-100">Greenfield Industries Pvt Ltd</strong>
                        </div>
                        <div className={highlightRing('tradeName')}>
                          <span className="text-slate-400">Trade Name:</span> Greenfield Packaging
                        </div>
                        <div className={`font-mono ${highlightRing('gstinMasked')}`}>
                          <span className="text-slate-400 font-sans">GSTIN:</span> 08AAB••••06M1Z7
                        </div>
                        <div className={`font-mono ${highlightRing('panMasked')}`}>
                          <span className="text-slate-400 font-sans">PAN:</span> AAB••••06M
                        </div>
                        <div className={highlightRing('constitution')}>
                          <span className="text-slate-400">Constitution:</span> Private Limited Company
                        </div>
                        <div className={highlightRing('regDate')}>
                          <span className="text-slate-400">Effective Date:</span> 2017-07-01
                        </div>
                        <div className={highlightRing('jurisdiction')}>
                          <span className="text-slate-400">Jurisdiction:</span> Rajasthan — Jaipur Ward 4
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Pane: Editable Fields + GST Arithmetic Validator */}
            <div className="lg:col-span-7 p-5 space-y-4">
              {gstCheck && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                    gstCheck.isBalanced
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>
                      {gstCheck.isBalanced
                        ? `GST Arithmetic Reconciled: Taxable ${formatINR(
                            gstCheck.taxable
                          )} + Tax ${formatINR(gstCheck.taxTotal)} = ${formatINR(
                            gstCheck.total
                          )}`
                        : `Arithmetic Variance Detected: Taxable + Tax = ${formatINR(
                            gstCheck.computedTotal
                          )} vs Total ${formatINR(gstCheck.total)} (Diff: ${formatINR(
                            gstCheck.diff
                          )})`}
                    </span>
                  </div>
                </div>
              )}

              {scanResult.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Review Warnings &amp; Statutory Notice
                  </div>
                  <ul className="list-disc pl-5 text-xs text-amber-200/90 space-y-0.5">
                    {scanResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {scanResult.fields.map((field) => {
                  const isMissing = !field.value.trim();
                  return (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-medium text-slate-300">{field.label}</label>
                        {field.confidence !== undefined && (
                          <span className="font-mono text-[11px] text-teal-400">
                            {field.confidence}%
                          </span>
                        )}
                      </div>
                      <input
                        value={field.value}
                        onFocus={() => setFocusedField(field.key)}
                        onMouseEnter={() => setFocusedField(field.key)}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => updateFieldValue(field.key, e.target.value)}
                        placeholder="Enter verified value..."
                        className={`w-full px-3 py-2 text-xs font-mono border rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none ${
                          isMissing
                            ? 'border-amber-500/50 bg-amber-500/10 focus:border-amber-400'
                            : 'border-[#223559] bg-[#081020] focus:border-teal-500'
                        }`}
                      />
                      {(isMissing || field.missingWarning) && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{field.missingWarning || 'Missing mandatory value'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
