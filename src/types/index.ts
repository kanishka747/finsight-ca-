export type NavSection =
  | 'dashboard'
  | 'intelligence'
  | 'clients'
  | 'documents'
  | 'scanner'
  | 'validation'
  | 'compliance'
  | 'financial'
  | 'reminders'
  | 'tasks'
  | 'portal'
  | 'reports'
  | 'settings'
  | 'help';

export type FinancialYear = 'FY 2026-27' | 'FY 2025-26' | 'FY 2024-25';

export type ClientType =
  | 'Individual'
  | 'Private Limited'
  | 'Partnership'
  | 'LLP'
  | 'Proprietorship';

export type ClientStatus = 'Active' | 'Inactive' | 'Archived';

export type DocumentCategory =
  | 'PAN Card'
  | 'Aadhaar'
  | 'GST Registration Certificate'
  | 'Sales Invoices'
  | 'Purchase Invoices'
  | 'Bank Statements'
  | 'Income Tax Returns'
  | 'TDS Certificates'
  | 'Form 16'
  | 'Balance Sheets'
  | 'Profit & Loss Statements'
  | 'Audit Reports'
  | 'Other Financial Documents';

export type DocumentStatus =
  | 'Uploaded'
  | 'Pending Review'
  | 'Verified'
  | 'Rejected'
  | 'Replacement Required';

export type ComplianceType =
  | 'GST Returns'
  | 'GSTR-1'
  | 'GSTR-3B'
  | 'Income Tax Returns'
  | 'Advance Tax'
  | 'TDS Returns'
  | 'TDS Payments'
  | 'Tax Audit'
  | 'ROC Compliance'
  | 'Custom Compliance';

export type ComplianceStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting Documents'
  | 'Under Review'
  | 'Completed'
  | 'Overdue';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export type StaffTaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting Client'
  | 'Under Review'
  | 'Completed';

export type ValidationSeverity = 'Informational' | 'Warning' | 'Critical';

export type UserRole = 'Partner' | 'Senior CA' | 'Audit Executive' | 'Tax Associate' | 'Client Preview';

export interface Employee {
  id: string;
  name: string;
  role: Exclude<UserRole, 'Client Preview'>;
  email: string;
  phone: string;
  department: string;
  active: boolean;
  avatarInitials: string;
}

export interface Client {
  id: string;
  clientCode: string;
  name: string;
  type: ClientType;
  dobOrIncDate: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  pan: string; // Fictional demo PAN
  gstin?: string; // Fictional demo GSTIN
  tan?: string; // Fictional demo TAN
  financialYear: FinancialYear;
  services: string[];
  assignedEmployeeId: string;
  onboardingDate: string;
  notes: string;
  status: ClientStatus;
  requiredCategories: DocumentCategory[];
}

export interface DocumentComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface VerificationHistoryEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  fileType: 'PDF' | 'XLSX' | 'JPG' | 'PNG' | 'CSV';
  fileSize: string;
  clientId: string;
  category: DocumentCategory;
  financialYear: FinancialYear;
  uploadedBy: string;
  uploadedByRole: 'Client' | 'Staff';
  uploadDate: string;
  status: DocumentStatus;
  previewSummary: string;
  extractedMetrics?: {
    taxableValue?: number;
    gstAmount?: number;
    totalAmount?: number;
    period?: string;
    invoiceCount?: number;
    referenceNo?: string;
  };
  comments: DocumentComment[];
  history: VerificationHistoryEntry[];
  linkedRequestId?: string;
}

export interface ComplianceTask {
  id: string;
  title: string;
  clientId: string;
  type: ComplianceType;
  financialYear: FinancialYear;
  dueDate: string; // YYYY-MM-DD (configurable demo date)
  assignedEmployeeId: string;
  status: ComplianceStatus;
  priority: PriorityLevel;
  description: string;
  requiredDocuments: DocumentCategory[];
  reminderDaysBefore: number;
  completionDate?: string;
  progressHistory: { id: string; note: string; actor: string; date: string }[];
  internalNotes: string;
}

export interface StaffTaskComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  clientId: string;
  assignedEmployeeId: string;
  createdBy: string;
  priority: PriorityLevel;
  startDate: string;
  dueDate: string;
  relatedComplianceId?: string;
  status: StaffTaskStatus;
  attachments: string[];
  comments: StaffTaskComment[];
  timeline: { id: string; event: string; actor: string; timestamp: string }[];
}

export interface DocumentRequest {
  id: string;
  clientId: string;
  title: string;
  category: DocumentCategory;
  financialYear: FinancialYear;
  requestedBy: string;
  requestedDate: string;
  dueDate: string;
  status: 'Sent to Client' | 'Uploaded by Client' | 'Under CA Review' | 'Verified' | 'Correction Requested';
  message: string;
  linkedDocumentId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'document' | 'compliance' | 'task' | 'system';
  read: boolean;
  timestamp: string;
  linkSection?: NavSection;
  clientId?: string;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  clientId: string;
  reminderType: 'Document Follow-up' | 'Compliance Deadline' | 'Client Check-in';
  channel: 'Email (Simulated)' | 'WhatsApp (Simulated)' | 'Portal Alert';
  scheduledFor: string;
  status: 'Scheduled' | 'Sent (Simulated)' | 'Overdue';
  message: string;
  createdBy: string;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  direction: 'Outbound (CA -> Client)' | 'Inbound (Client -> CA)';
  channel: 'Client Portal' | 'Email (Simulated)' | 'Phone Note';
  subject: string;
  message: string;
  sender: string;
  timestamp: string;
}

export interface ValidationIssue {
  id: string;
  clientId: string;
  documentId?: string;
  title: string;
  fieldLabel: string;
  detectedValue: string;
  expectedFormatOrCrossRef: string;
  severity: ValidationSeverity;
  status: 'Open' | 'Reviewed' | 'Approved' | 'Correction Requested' | 'Rejected';
  internalComments: { id: string; author: string; text: string; timestamp: string }[];
}

export interface CrossDocumentComparison {
  id: string;
  clientId: string;
  metric: string;
  sourceAName: string;
  sourceAValue: string;
  sourceBName: string;
  sourceBValue: string;
  varianceStatus: 'Matched' | 'Potential Mismatch' | 'Missing Info' | 'Requires CA Review';
  notes: string;
}

export interface FinancialSummaryRecord {
  id: string;
  clientId: string;
  financialYear: FinancialYear;
  month: string; // e.g., 'Oct 2026'
  sourceType: 'Document-Extracted (Provisional)' | 'Finalized Accounting Record';
  revenue: number;
  expenses: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoiceCount: number;
}

export interface ActivityLog {
  id: string;
  clientId?: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  section: NavSection;
}

export interface RolePermission {
  role: Exclude<UserRole, 'Client Preview'>;
  canManageClients: boolean;
  canVerifyDocuments: boolean;
  canApproveCompliance: boolean;
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canExportReports: boolean;
}

export interface FirmSettings {
  firmName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  icaiRegNo: string;
  gstin: string;
  email: string;
  phone: string;
  defaultFinancialYear: FinancialYear;
  availableFinancialYears: FinancialYear[];
  enabledComplianceCategories: ComplianceType[];
  enabledDocumentCategories: DocumentCategory[];
  notifications: {
    emailReminders: boolean;
    portalAlerts: boolean;
    overdueDigest: boolean;
    reminderLeadDays: number;
  };
  preferences: {
    compactTables: boolean;
    maskSensitiveIds: boolean;
    autoSaveDrafts: boolean;
  };
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'warning' | 'error';
}

export type AnomalyType =
  | 'Cross-Document Amount Mismatch'
  | 'Duplicate Invoice'
  | 'Tax Calculation Variance'
  | 'High-Value Cash / Threshold Alert'
  | 'GSTIN / Vendor Mismatch'
  | 'Unusual Expense Spike';

export interface FinancialAnomaly {
  id: string;
  clientId: string;
  documentId?: string;
  type: AnomalyType;
  severity: ValidationSeverity;
  title: string;
  description: string;
  sourceARef: string;
  sourceAValue: string;
  sourceBRef: string;
  sourceBValue: string;
  varianceAmount?: number;
  detectedAt: string;
  status: 'Flagged for CA Review' | 'Task Created' | 'Resolved' | 'Dismissed';
  linkedTaskId?: string;
  caNote?: string;
}

export interface ClientRiskFactor {
  label: string;
  points: number;
  detail: string;
}

export interface ClientRiskScoreResult {
  score: number;
  level: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';
  factors: ClientRiskFactor[];
}

export interface ExtractedDocumentPayload {
  documentTitle: string;
  detectedCategory: DocumentCategory;
  partyName: string;
  counterpartyName?: string;
  pan?: string;
  gstin?: string;
  invoiceOrRefNo: string;
  documentDate: string;
  period?: string;
  taxableValue: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  gstAmount?: number | null;
  totalAmount: number | null;
  verbatimLineItems: string[];
  anomaliesDetected: string[];
  executiveBriefing: string;
}

