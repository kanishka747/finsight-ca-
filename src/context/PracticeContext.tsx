import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  SEED_ACTIVITIES,
  SEED_ANOMALIES,
  SEED_CLIENTS,
  SEED_COMMUNICATIONS,
  SEED_COMPLIANCE,
  SEED_CROSS_COMPARISONS,
  SEED_DOCUMENTS,
  SEED_DOC_REQUESTS,
  SEED_EMPLOYEES,
  SEED_FINANCIAL_RECORDS,
  SEED_FIRM_SETTINGS,
  SEED_NOTIFICATIONS,
  SEED_PERMISSIONS,
  SEED_REMINDERS,
  SEED_STAFF_TASKS,
  SEED_VALIDATION_ISSUES,
  SMART_ONBOARDING_CHECKLISTS,
} from '../data/seedData';
import {
  ActivityLog,
  AppNotification,
  Client,
  ClientRiskFactor,
  ClientRiskScoreResult,
  ClientStatus,
  CommunicationLog,
  ComplianceStatus,
  ComplianceTask,
  CrossDocumentComparison,
  DocumentCategory,
  DocumentRecord,
  DocumentRequest,
  DocumentStatus,
  Employee,
  FinancialAnomaly,
  FinancialSummaryRecord,
  FinancialYear,
  FirmSettings,
  NavSection,
  RolePermission,
  ScheduledReminder,
  StaffTask,
  StaffTaskStatus,
  ToastMessage,
  ValidationIssue,
} from '../types';

const STORAGE_KEY = 'finsight_ayco_practice_v1';

interface PersistedState {
  clients: Client[];
  documents: DocumentRecord[];
  complianceTasks: ComplianceTask[];
  staffTasks: StaffTask[];
  docRequests: DocumentRequest[];
  notifications: AppNotification[];
  reminders: ScheduledReminder[];
  communications: CommunicationLog[];
  validationIssues: ValidationIssue[];
  crossComparisons: CrossDocumentComparison[];
  financialRecords: FinancialSummaryRecord[];
  anomalies: FinancialAnomaly[];
  activities: ActivityLog[];
  employees: Employee[];
  permissions: RolePermission[];
  settings: FirmSettings;
  selectedFY: FinancialYear;
  currentEmployeeId: string;
  previewClientId: string;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
        return {
          ...parsed,
          anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : SEED_ANOMALIES,
        };
      }
    }
  } catch {
    // fallback to seed
  }
  return {
    clients: SEED_CLIENTS,
    documents: SEED_DOCUMENTS,
    complianceTasks: SEED_COMPLIANCE,
    staffTasks: SEED_STAFF_TASKS,
    docRequests: SEED_DOC_REQUESTS,
    notifications: SEED_NOTIFICATIONS,
    reminders: SEED_REMINDERS,
    communications: SEED_COMMUNICATIONS,
    validationIssues: SEED_VALIDATION_ISSUES,
    crossComparisons: SEED_CROSS_COMPARISONS,
    financialRecords: SEED_FINANCIAL_RECORDS,
    anomalies: SEED_ANOMALIES,
    activities: SEED_ACTIVITIES,
    employees: SEED_EMPLOYEES,
    permissions: SEED_PERMISSIONS,
    settings: SEED_FIRM_SETTINGS,
    selectedFY: 'FY 2026-27',
    currentEmployeeId: 'emp-1',
    previewClientId: 'cli-1',
  };
}

interface PracticeContextValue extends PersistedState {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  openClientProfile: (clientId: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
  currentUser: Employee;
  setCurrentEmployeeId: (id: string) => void;
  setSelectedFY: (fy: FinancialYear) => void;
  setPreviewClientId: (clientId: string) => void;
  isDemoClientMode: boolean;
  setIsDemoClientMode: (v: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (v: boolean) => void;
  quickAddInitialType: 'client' | 'document' | 'compliance' | 'task' | 'reminder' | null;
  openQuickAdd: (type?: 'client' | 'document' | 'compliance' | 'task' | 'reminder') => void;

  // FinSight AI Copilot
  copilotOpen: boolean;
  setCopilotOpen: (v: boolean) => void;
  queuedCopilotPrompt: string | null;
  openCopilotWithPrompt: (prompt?: string) => void;
  clearQueuedCopilotPrompt: () => void;

  // Risk & Intelligence Engine
  computeClientRiskScore: (clientId: string) => ClientRiskScoreResult;
  updateAnomalyStatus: (
    id: string,
    status: FinancialAnomaly['status'],
    caNote?: string
  ) => void;
  escalateAnomalyToTask: (id: string) => void;
  addAnomaly: (anomaly: Omit<FinancialAnomaly, 'id' | 'detectedAt'>) => void;
  addCrossComparison: (comp: Omit<CrossDocumentComparison, 'id'>) => void;
  runDocumentToActionPipeline: (params: {
    clientId: string;
    name: string;
    fileType: DocumentRecord['fileType'];
    fileSize: string;
    category: DocumentCategory;
    previewSummary: string;
    extractedMetrics?: DocumentRecord['extractedMetrics'];
    detectedIssues?: string[];
  }) => { doc: DocumentRecord; createdTaskId?: string };

  // Client mutations
  addClient: (client: Omit<Client, 'id' | 'clientCode'>) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  setClientStatus: (id: string, status: ClientStatus) => void;

  // Document mutations
  addDocument: (
    doc: Omit<DocumentRecord, 'id' | 'comments' | 'history' | 'uploadDate'>,
    customDate?: string
  ) => DocumentRecord;
  updateDocumentStatus: (docId: string, status: DocumentStatus, note?: string) => void;
  addDocumentComment: (docId: string, text: string) => void;

  // Document Request mutations
  createDocumentRequest: (req: Omit<DocumentRequest, 'id' | 'requestedDate' | 'status'>) => void;
  fulfillDocumentRequest: (requestId: string, docId: string) => void;

  // Compliance mutations
  addComplianceTask: (task: Omit<ComplianceTask, 'id' | 'progressHistory'>) => void;
  updateComplianceTask: (id: string, patch: Partial<ComplianceTask>) => void;
  updateComplianceStatus: (id: string, status: ComplianceStatus, note?: string) => void;

  // Staff task mutations
  addStaffTask: (task: Omit<StaffTask, 'id' | 'comments' | 'timeline'>) => void;
  updateStaffTask: (id: string, patch: Partial<StaffTask>) => void;
  updateStaffTaskStatus: (id: string, status: StaffTaskStatus) => void;
  addStaffTaskComment: (id: string, text: string) => void;

  // Validation mutations
  updateValidationIssue: (
    id: string,
    status: ValidationIssue['status'],
    comment?: string
  ) => void;
  updateCrossComparison: (
    id: string,
    varianceStatus: CrossDocumentComparison['varianceStatus'],
    notes?: string
  ) => void;

  // Notifications & reminders
  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  addReminder: (rem: Omit<ScheduledReminder, 'id'>) => void;
  triggerSimulatedReminder: (id: string) => void;
  addCommunication: (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => void;

  // Financial record additions (e.g. from AI Scanner)
  addFinancialRecord: (rec: Omit<FinancialSummaryRecord, 'id'>) => void;

  // Settings & Employees
  updateSettings: (patch: Partial<FirmSettings>) => void;
  addEmployee: (emp: Omit<Employee, 'id' | 'avatarInitials'>) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  updatePermission: (role: RolePermission['role'], field: keyof Omit<RolePermission, 'role'>, val: boolean) => void;
  resetDemoData: () => void;
  logoutDemoSession: () => void;
  demoLocked: boolean;
  unlockDemoSession: () => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

const nowTimestamp = () => {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeSection, setActiveSectionState] = useState<NavSection>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDemoClientMode, setIsDemoClientMode] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddInitialType, setQuickAddInitialType] = useState<
    'client' | 'document' | 'compliance' | 'task' | 'reminder' | null
  >(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [queuedCopilotPrompt, setQueuedCopilotPrompt] = useState<string | null>(null);
  const [demoLocked, setDemoLocked] = useState(false);

  const openCopilotWithPrompt = (prompt?: string) => {
    if (prompt) setQueuedCopilotPrompt(prompt);
    setCopilotOpen(true);
  };
  const clearQueuedCopilotPrompt = () => setQueuedCopilotPrompt(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  const currentUser = useMemo(
    () => state.employees.find((e) => e.id === state.currentEmployeeId) || state.employees[0],
    [state.employees, state.currentEmployeeId]
  );

  const addToast = (
    title: string,
    description?: string,
    variant: ToastMessage['variant'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setActiveSection = (section: NavSection) => {
    setActiveSectionState(section);
    if (section === 'portal') {
      setIsDemoClientMode(true);
    } else {
      setIsDemoClientMode(false);
    }
    if (section !== 'clients') {
      setSelectedClientId(null);
    }
    setMobileMenuOpen(false);
  };

  const openClientProfile = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveSectionState('clients');
    setIsDemoClientMode(false);
    setMobileMenuOpen(false);
  };

  const openQuickAdd = (type?: 'client' | 'document' | 'compliance' | 'task' | 'reminder') => {
    setQuickAddInitialType(type ?? null);
    setQuickAddOpen(true);
  };

  const appendActivity = (
    prev: PersistedState,
    action: string,
    target: string,
    section: NavSection,
    clientId?: string,
    actorOverride?: string
  ): ActivityLog[] => {
    const entry: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      clientId,
      actor: actorOverride || currentUser.name,
      action,
      target,
      timestamp: nowTimestamp(),
      section,
    };
    return [entry, ...prev.activities].slice(0, 40);
  };

  const addClient = (clientInput: Omit<Client, 'id' | 'clientCode'>): Client => {
    const nextNum = 101 + state.clients.length;
    const template = SMART_ONBOARDING_CHECKLISTS[clientInput.type];
    const resolvedRequired =
      clientInput.requiredCategories.length > 0
        ? clientInput.requiredCategories
        : template.requiredCategories;
    const resolvedServices =
      clientInput.services.length > 0 ? clientInput.services : template.defaultServices;

    const newClient: Client = {
      ...clientInput,
      requiredCategories: resolvedRequired,
      services: resolvedServices,
      id: `cli-${Date.now()}`,
      clientCode: `AYC-${nextNum}`,
    };

    const onboardingTask: StaffTask = {
      id: `tsk-onb-${Date.now()}`,
      title: `Smart Onboarding Pack — ${newClient.name}`,
      description: `Execute ${newClient.type} onboarding checklist:\n• ${template.onboardingSteps.join('\n• ')}`,
      clientId: newClient.id,
      assignedEmployeeId: newClient.assignedEmployeeId,
      createdBy: currentUser.name,
      priority: 'High',
      startDate: todayDate(),
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      status: 'Not Started',
      attachments: [],
      comments: [],
      timeline: [
        {
          id: `tl-onb-${Date.now()}`,
          event: `Auto-generated Smart Onboarding workflow (${resolvedRequired.length} required doc categories)`,
          actor: 'FinSight Onboarding Engine',
          timestamp: nowTimestamp(),
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
      staffTasks: [onboardingTask, ...prev.staffTasks],
      activities: appendActivity(
        prev,
        `onboarded new ${newClient.type} client (${resolvedRequired.length} doc checklist)`,
        newClient.name,
        'clients',
        newClient.id
      ),
      notifications: [
        {
          id: `ntf-${Date.now()}`,
          title: `New Client Onboarded — ${newClient.name}`,
          message: `Client ${newClient.clientCode} assigned to ${
            prev.employees.find((e) => e.id === newClient.assignedEmployeeId)?.name || 'CA Staff'
          } with Smart Onboarding task.`,
          type: 'system',
          read: false,
          timestamp: nowTimestamp(),
          linkSection: 'clients',
          clientId: newClient.id,
        },
        ...prev.notifications,
      ],
    }));
    addToast(
      'Client onboarded',
      `${newClient.name} (${newClient.clientCode}) created with ${resolvedRequired.length}-item checklist & workflow task.`
    );
    return newClient;
  };

  const updateClient = (id: string, patch: Partial<Client>) => {
    setState((prev) => {
      const target = prev.clients.find((c) => c.id === id);
      return {
        ...prev,
        clients: prev.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        activities: target
          ? appendActivity(prev, 'updated client profile', target.name, 'clients', id)
          : prev.activities,
      };
    });
    addToast('Client updated', 'Changes saved to browser demo storage.');
  };

  const setClientStatus = (id: string, status: ClientStatus) => {
    setState((prev) => {
      const target = prev.clients.find((c) => c.id === id);
      return {
        ...prev,
        clients: prev.clients.map((c) => (c.id === id ? { ...c, status } : c)),
        activities: target
          ? appendActivity(prev, `changed client status to ${status}`, target.name, 'clients', id)
          : prev.activities,
      };
    });
    addToast(`Client marked ${status}`);
  };

  const addDocument = (
    docInput: Omit<DocumentRecord, 'id' | 'comments' | 'history' | 'uploadDate'>,
    customDate?: string
  ): DocumentRecord => {
    const newDoc: DocumentRecord = {
      ...docInput,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      uploadDate: customDate || todayDate(),
      comments: [],
      history: [
        {
          id: `h-${Date.now()}`,
          action: `Uploaded by ${docInput.uploadedByRole}`,
          actor: docInput.uploadedBy,
          timestamp: nowTimestamp(),
        },
      ],
    };

    setState((prev) => {
      const client = prev.clients.find((c) => c.id === newDoc.clientId);
      const updatedRequests = newDoc.linkedRequestId
        ? prev.docRequests.map((r) =>
            r.id === newDoc.linkedRequestId
              ? { ...r, status: 'Under CA Review' as const, linkedDocumentId: newDoc.id }
              : r
          )
        : prev.docRequests;

      return {
        ...prev,
        documents: [newDoc, ...prev.documents],
        docRequests: updatedRequests,
        activities: appendActivity(
          prev,
          `uploaded ${newDoc.category}`,
          newDoc.name,
          'documents',
          newDoc.clientId,
          newDoc.uploadedBy
        ),
        notifications: [
          {
            id: `ntf-${Date.now()}`,
            title: `New Document Uploaded — ${client?.name || 'Client'}`,
            message: `${newDoc.name} (${newDoc.category}) is ready for CA review.`,
            type: 'document',
            read: false,
            timestamp: nowTimestamp(),
            linkSection: 'documents',
            clientId: newDoc.clientId,
          },
          ...prev.notifications,
        ],
      };
    });
    addToast('Document recorded', `${newDoc.name} added to workspace (local demo storage).`);
    return newDoc;
  };

  const updateDocumentStatus = (docId: string, status: DocumentStatus, note?: string) => {
    setState((prev) => {
      const doc = prev.documents.find((d) => d.id === docId);
      if (!doc) return prev;
      const client = prev.clients.find((c) => c.id === doc.clientId);
      const nextDocuments = prev.documents.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          status,
          history: [
            ...d.history,
            {
              id: `h-${Date.now()}`,
              action: `Marked ${status}`,
              actor: currentUser.name,
              timestamp: nowTimestamp(),
              notes: note,
            },
          ],
          comments: note
            ? [
                ...d.comments,
                {
                  id: `c-${Date.now()}`,
                  author: currentUser.name,
                  role: currentUser.role,
                  text: note,
                  timestamp: nowTimestamp(),
                },
              ]
            : d.comments,
        };
      });

      const nextRequests = prev.docRequests.map((r) => {
        if (r.linkedDocumentId !== docId && r.id !== doc.linkedRequestId) return r;
        if (status === 'Verified') return { ...r, status: 'Verified' as const };
        if (status === 'Rejected' || status === 'Replacement Required') {
          return { ...r, status: 'Correction Requested' as const };
        }
        return { ...r, status: 'Under CA Review' as const };
      });

      return {
        ...prev,
        documents: nextDocuments,
        docRequests: nextRequests,
        activities: appendActivity(
          prev,
          `marked document ${status}`,
          `${doc.name} (${client?.name || ''})`,
          'documents',
          doc.clientId
        ),
        notifications: [
          {
            id: `ntf-${Date.now()}`,
            title:
              status === 'Verified'
                ? `Document Verified — ${client?.name || 'Client'}`
                : `Document ${status} — ${client?.name || 'Client'}`,
            message: `${doc.name} was marked ${status} by ${currentUser.name}.`,
            type: 'document',
            read: false,
            timestamp: nowTimestamp(),
            linkSection: 'documents',
            clientId: doc.clientId,
          },
          ...prev.notifications,
        ],
      };
    });
    addToast(`Document ${status}`, note || 'Status synchronized across client profile & reports.');
  };

  const addDocumentComment = (docId: string, text: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              comments: [
                ...d.comments,
                {
                  id: `c-${Date.now()}`,
                  author: currentUser.name,
                  role: currentUser.role,
                  text,
                  timestamp: nowTimestamp(),
                },
              ],
            }
          : d
      ),
    }));
    addToast('Comment added');
  };

  const createDocumentRequest = (req: Omit<DocumentRequest, 'id' | 'requestedDate' | 'status'>) => {
    const newReq: DocumentRequest = {
      ...req,
      id: `req-${Date.now()}`,
      requestedDate: todayDate(),
      status: 'Sent to Client',
    };
    setState((prev) => {
      const client = prev.clients.find((c) => c.id === req.clientId);
      return {
        ...prev,
        docRequests: [newReq, ...prev.docRequests],
        communications: [
          {
            id: `com-${Date.now()}`,
            clientId: req.clientId,
            direction: 'Outbound (CA -> Client)',
            channel: 'Client Portal',
            subject: `Document Request: ${req.title}`,
            message: req.message,
            sender: req.requestedBy,
            timestamp: nowTimestamp(),
          },
          ...prev.communications,
        ],
        activities: appendActivity(
          prev,
          'sent document request',
          `${req.title} (${client?.name || ''})`,
          'reminders',
          req.clientId
        ),
        notifications: [
          {
            id: `ntf-${Date.now()}`,
            title: `Document Request Sent — ${client?.name || ''}`,
            message: `Requested ${req.category}: ${req.title}`,
            type: 'document',
            read: false,
            timestamp: nowTimestamp(),
            linkSection: 'portal',
            clientId: req.clientId,
          },
          ...prev.notifications,
        ],
      };
    });
    addToast('Document request sent', 'Visible immediately in Client Portal and Reminders.');
  };

  const fulfillDocumentRequest = (requestId: string, docId: string) => {
    setState((prev) => ({
      ...prev,
      docRequests: prev.docRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'Under CA Review', linkedDocumentId: docId } : r
      ),
    }));
  };

  const addComplianceTask = (task: Omit<ComplianceTask, 'id' | 'progressHistory'>) => {
    const newTask: ComplianceTask = {
      ...task,
      id: `cmp-${Date.now()}`,
      progressHistory: [
        { id: `ph-${Date.now()}`, note: 'Compliance task created.', actor: currentUser.name, date: todayDate() },
      ],
    };
    setState((prev) => {
      const client = prev.clients.find((c) => c.id === task.clientId);
      return {
        ...prev,
        complianceTasks: [newTask, ...prev.complianceTasks],
        activities: appendActivity(
          prev,
          'created compliance task',
          `${newTask.title} (${client?.name || ''})`,
          'compliance',
          task.clientId
        ),
      };
    });
    addToast('Compliance task created', task.title);
  };

  const updateComplianceTask = (id: string, patch: Partial<ComplianceTask>) => {
    setState((prev) => ({
      ...prev,
      complianceTasks: prev.complianceTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    addToast('Compliance details updated');
  };

  const updateComplianceStatus = (id: string, status: ComplianceStatus, note?: string) => {
    setState((prev) => {
      const target = prev.complianceTasks.find((t) => t.id === id);
      if (!target) return prev;
      return {
        ...prev,
        complianceTasks: prev.complianceTasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completionDate: status === 'Completed' ? todayDate() : t.completionDate,
                progressHistory: [
                  ...t.progressHistory,
                  {
                    id: `ph-${Date.now()}`,
                    note: note || `Status updated to ${status}`,
                    actor: currentUser.name,
                    date: todayDate(),
                  },
                ],
              }
            : t
        ),
        activities: appendActivity(
          prev,
          `marked compliance ${status}`,
          target.title,
          'compliance',
          target.clientId
        ),
      };
    });
    addToast(`Compliance marked ${status}`);
  };

  const addStaffTask = (task: Omit<StaffTask, 'id' | 'comments' | 'timeline'>) => {
    const newTask: StaffTask = {
      ...task,
      id: `tsk-${Date.now()}`,
      comments: [],
      timeline: [
        { id: `tl-${Date.now()}`, event: 'Task created', actor: currentUser.name, timestamp: nowTimestamp() },
      ],
    };
    setState((prev) => ({
      ...prev,
      staffTasks: [newTask, ...prev.staffTasks],
      activities: appendActivity(prev, 'created staff task', newTask.title, 'tasks', newTask.clientId),
      notifications: [
        {
          id: `ntf-${Date.now()}`,
          title: 'New Staff Task Assigned',
          message: `${newTask.title} assigned to ${
            prev.employees.find((e) => e.id === newTask.assignedEmployeeId)?.name || 'Staff'
          }.`,
          type: 'task',
          read: false,
          timestamp: nowTimestamp(),
          linkSection: 'tasks',
          clientId: newTask.clientId,
        },
        ...prev.notifications,
      ],
    }));
    addToast('Task created', newTask.title);
  };

  const updateStaffTask = (id: string, patch: Partial<StaffTask>) => {
    setState((prev) => ({
      ...prev,
      staffTasks: prev.staffTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    addToast('Task updated');
  };

  const updateStaffTaskStatus = (id: string, status: StaffTaskStatus) => {
    setState((prev) => {
      const target = prev.staffTasks.find((t) => t.id === id);
      if (!target) return prev;
      return {
        ...prev,
        staffTasks: prev.staffTasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                timeline: [
                  ...t.timeline,
                  {
                    id: `tl-${Date.now()}`,
                    event: `Status changed to ${status}`,
                    actor: currentUser.name,
                    timestamp: nowTimestamp(),
                  },
                ],
              }
            : t
        ),
        activities: appendActivity(prev, `moved task to ${status}`, target.title, 'tasks', target.clientId),
      };
    });
    addToast(`Task moved to ${status}`);
  };

  const addStaffTaskComment = (id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      staffTasks: prev.staffTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              comments: [
                ...t.comments,
                { id: `tc-${Date.now()}`, author: currentUser.name, text, timestamp: nowTimestamp() },
              ],
            }
          : t
      ),
    }));
    addToast('Task comment added');
  };

  const updateValidationIssue = (
    id: string,
    status: ValidationIssue['status'],
    comment?: string
  ) => {
    setState((prev) => {
      const target = prev.validationIssues.find((v) => v.id === id);
      return {
        ...prev,
        validationIssues: prev.validationIssues.map((v) =>
          v.id === id
            ? {
                ...v,
                status,
                internalComments: comment
                  ? [
                      ...v.internalComments,
                      {
                        id: `vc-${Date.now()}`,
                        author: currentUser.name,
                        text: comment,
                        timestamp: nowTimestamp(),
                      },
                    ]
                  : v.internalComments,
              }
            : v
        ),
        activities: target
          ? appendActivity(prev, `updated validation finding (${status})`, target.title, 'validation', target.clientId)
          : prev.activities,
      };
    });
    addToast(`Validation issue marked ${status}`);
  };

  const updateCrossComparison = (
    id: string,
    varianceStatus: CrossDocumentComparison['varianceStatus'],
    notes?: string
  ) => {
    setState((prev) => ({
      ...prev,
      crossComparisons: prev.crossComparisons.map((c) =>
        c.id === id ? { ...c, varianceStatus, notes: notes ?? c.notes } : c
      ),
    }));
    addToast('Cross-document review updated');
  };

  const markNotificationRead = (id: string, read = true) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    addToast('All notifications marked read');
  };

  const addReminder = (rem: Omit<ScheduledReminder, 'id'>) => {
    const newRem: ScheduledReminder = { ...rem, id: `rem-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      reminders: [newRem, ...prev.reminders],
      activities: appendActivity(prev, 'scheduled reminder', newRem.title, 'reminders', rem.clientId),
    }));
    addToast('Reminder scheduled (Simulated)', 'Note: Automated Email/WhatsApp requires backend integration.');
  };

  const triggerSimulatedReminder = (id: string) => {
    setState((prev) => {
      const rem = prev.reminders.find((r) => r.id === id);
      if (!rem) return prev;
      return {
        ...prev,
        reminders: prev.reminders.map((r) =>
          r.id === id ? { ...r, status: 'Sent (Simulated)' as const } : r
        ),
        communications: [
          {
            id: `com-${Date.now()}`,
            clientId: rem.clientId,
            direction: 'Outbound (CA -> Client)',
            channel: rem.channel === 'Portal Alert' ? 'Client Portal' : 'Email (Simulated)',
            subject: rem.title,
            message: rem.message,
            sender: currentUser.name,
            timestamp: nowTimestamp(),
          },
          ...prev.communications,
        ],
      };
    });
    addToast('Simulated reminder logged', 'Recorded in client communication history.');
  };

  const addCommunication = (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => {
    setState((prev) => ({
      ...prev,
      communications: [
        { ...log, id: `com-${Date.now()}`, timestamp: nowTimestamp() },
        ...prev.communications,
      ],
    }));
    addToast('Message recorded');
  };

  const addFinancialRecord = (rec: Omit<FinancialSummaryRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      financialRecords: [{ ...rec, id: `fin-${Date.now()}` }, ...prev.financialRecords],
      activities: appendActivity(
        prev,
        'saved extracted financial entry',
        `${rec.month} (${rec.sourceType})`,
        'financial',
        rec.clientId
      ),
    }));
    addToast('Saved to client records', 'Provisional extracted record added to Financial Overview.');
  };

  const updateSettings = (patch: Partial<FirmSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
    addToast('Settings saved');
  };

  const addEmployee = (emp: Omit<Employee, 'id' | 'avatarInitials'>) => {
    const initials = emp.name
      .replace(/^CA\s+/i, '')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const newEmp: Employee = { ...emp, id: `emp-${Date.now()}`, avatarInitials: initials };
    setState((prev) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
    }));
    addToast('Team member added', emp.name);
  };

  const updateEmployee = (id: string, patch: Partial<Employee>) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    addToast('Employee record updated');
  };

  const updatePermission = (
    role: RolePermission['role'],
    field: keyof Omit<RolePermission, 'role'>,
    val: boolean
  ) => {
    setState((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => (p.role === role ? { ...p, [field]: val } : p)),
    }));
    addToast('Permissions updated', `${role} access matrix saved.`);
  };

  const computeClientRiskScore = (clientId: string): ClientRiskScoreResult => {
    const client = state.clients.find((c) => c.id === clientId);
    if (!client) {
      return { score: 0, level: 'Low Risk', factors: [] };
    }
    return calculateClientRiskScore(
      client,
      state.documents,
      state.complianceTasks,
      state.validationIssues,
      state.anomalies,
      state.selectedFY
    );
  };

  const updateAnomalyStatus = (
    id: string,
    status: FinancialAnomaly['status'],
    caNote?: string
  ) => {
    setState((prev) => {
      const target = prev.anomalies.find((a) => a.id === id);
      return {
        ...prev,
        anomalies: prev.anomalies.map((a) =>
          a.id === id ? { ...a, status, caNote: caNote ?? a.caNote } : a
        ),
        activities: target
          ? appendActivity(prev, `marked anomaly ${status}`, target.title, 'intelligence', target.clientId)
          : prev.activities,
      };
    });
    addToast(`Anomaly marked ${status}`);
  };

  const escalateAnomalyToTask = (id: string) => {
    setState((prev) => {
      const anomaly = prev.anomalies.find((a) => a.id === id);
      if (!anomaly) return prev;
      const client = prev.clients.find((c) => c.id === anomaly.clientId);
      const taskId = `tsk-anom-${Date.now()}`;
      const newTask: StaffTask = {
        id: taskId,
        title: `CA Anomaly Review: ${anomaly.title}`,
        description: `${anomaly.description}\nSource A: ${anomaly.sourceARef} (${anomaly.sourceAValue})\nSource B: ${anomaly.sourceBRef} (${anomaly.sourceBValue})`,
        clientId: anomaly.clientId,
        assignedEmployeeId: client?.assignedEmployeeId || prev.currentEmployeeId,
        createdBy: currentUser.name,
        priority: anomaly.severity === 'Critical' ? 'Urgent' : 'High',
        startDate: todayDate(),
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        status: 'Not Started',
        attachments: anomaly.sourceARef ? [anomaly.sourceARef] : [],
        comments: [],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            event: 'Auto-created from AI Financial Anomaly Detector',
            actor: currentUser.name,
            timestamp: nowTimestamp(),
          },
        ],
      };

      return {
        ...prev,
        staffTasks: [newTask, ...prev.staffTasks],
        anomalies: prev.anomalies.map((a) =>
          a.id === id ? { ...a, status: 'Task Created', linkedTaskId: taskId } : a
        ),
        activities: appendActivity(
          prev,
          'escalated anomaly to CA review task',
          anomaly.title,
          'tasks',
          anomaly.clientId
        ),
      };
    });
    addToast('CA Review Task Created', 'Anomaly linked to Tasks & Workflow board.');
  };

  const addAnomaly = (anomaly: Omit<FinancialAnomaly, 'id' | 'detectedAt'>) => {
    const newAnom: FinancialAnomaly = {
      ...anomaly,
      id: `anom-${Date.now()}`,
      detectedAt: nowTimestamp(),
    };
    setState((prev) => ({
      ...prev,
      anomalies: [newAnom, ...prev.anomalies],
      activities: appendActivity(
        prev,
        'flagged financial anomaly',
        newAnom.title,
        'intelligence',
        newAnom.clientId
      ),
    }));
  };

  const addCrossComparison = (comp: Omit<CrossDocumentComparison, 'id'>) => {
    setState((prev) => ({
      ...prev,
      crossComparisons: [{ ...comp, id: `cc-${Date.now()}` }, ...prev.crossComparisons],
      activities: appendActivity(
        prev,
        'added cross-document reconciliation',
        comp.metric,
        'intelligence',
        comp.clientId
      ),
    }));
    addToast('Reconciliation entry recorded', comp.metric);
  };

  const runDocumentToActionPipeline: PracticeContextValue['runDocumentToActionPipeline'] = (params) => {
    const docId = `doc-${Date.now()}`;
    const hasIssues = Boolean(params.detectedIssues && params.detectedIssues.length > 0);
    const client = state.clients.find((c) => c.id === params.clientId);
    const newDoc: DocumentRecord = {
      id: docId,
      name: params.name,
      fileType: params.fileType,
      fileSize: params.fileSize,
      clientId: params.clientId,
      category: params.category,
      financialYear: state.selectedFY,
      uploadedBy: currentUser.name,
      uploadedByRole: 'Staff',
      uploadDate: todayDate(),
      status: 'Pending Review',
      previewSummary: params.previewSummary,
      extractedMetrics: params.extractedMetrics,
      comments: [],
      history: [
        {
          id: `h-${Date.now()}`,
          action: 'Uploaded & extracted via Document-to-Action Automation',
          actor: currentUser.name,
          timestamp: nowTimestamp(),
        },
      ],
    };

    const taskId = `tsk-pipe-${Date.now()}`;
    const reviewTask: StaffTask = {
      id: taskId,
      title: `CA Review: ${params.name} (${client?.name || 'Client'})`,
      description: hasIssues
        ? `Document-to-Action pipeline detected items requiring CA sign-off:\n• ${params.detectedIssues!.join('\n• ')}`
        : `Extracted ${params.category} ready for CA verification and final sign-off.`,
      clientId: params.clientId,
      assignedEmployeeId: client?.assignedEmployeeId || currentUser.id,
      createdBy: 'Document-to-Action Automation',
      priority: hasIssues ? 'High' : 'Medium',
      startDate: todayDate(),
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      status: 'Under Review',
      attachments: [params.name],
      comments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          event: `Pipeline step: Upload → Extract → Validate (${params.detectedIssues?.length || 0} flags) → CA Review Task`,
          actor: currentUser.name,
          timestamp: nowTimestamp(),
        },
      ],
    };

    const newAnomalies: FinancialAnomaly[] = (params.detectedIssues || []).map((issue, idx) => ({
      id: `anom-pipe-${Date.now()}-${idx}`,
      clientId: params.clientId,
      documentId: docId,
      type: 'Tax Calculation Variance',
      severity: 'Warning',
      title: `Extracted Check Flag — ${params.name}`,
      description: issue,
      sourceARef: params.name,
      sourceAValue:
        params.extractedMetrics?.totalAmount !== undefined
          ? formatINR(params.extractedMetrics.totalAmount)
          : 'Extracted',
      sourceBRef: 'FinSight Automated Rule Check',
      sourceBValue: 'CA Verification Required',
      detectedAt: nowTimestamp(),
      status: 'Task Created',
      linkedTaskId: taskId,
    }));

    setState((prev) => ({
      ...prev,
      documents: [newDoc, ...prev.documents],
      staffTasks: [reviewTask, ...prev.staffTasks],
      anomalies: [...newAnomalies, ...prev.anomalies],
      activities: appendActivity(
        prev,
        'ran Document-to-Action automation',
        `${params.name} → Task & ${newAnomalies.length} check(s)`,
        'documents',
        params.clientId
      ),
      notifications: [
        {
          id: `ntf-pipe-${Date.now()}`,
          title: `Document-to-Action Ready — ${client?.name || 'Client'}`,
          message: `${params.name} extracted, validated, and queued for CA Review.`,
          type: 'document',
          read: false,
          timestamp: nowTimestamp(),
          linkSection: 'tasks',
          clientId: params.clientId,
        },
        ...prev.notifications,
      ],
    }));

    addToast(
      'Document-to-Action Executed',
      `Saved ${params.name}, logged ${newAnomalies.length} flag(s), and created CA review task.`
    );
    return { doc: newDoc, createdTaskId: taskId };
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      clients: SEED_CLIENTS,
      documents: SEED_DOCUMENTS,
      complianceTasks: SEED_COMPLIANCE,
      staffTasks: SEED_STAFF_TASKS,
      docRequests: SEED_DOC_REQUESTS,
      notifications: SEED_NOTIFICATIONS,
      reminders: SEED_REMINDERS,
      communications: SEED_COMMUNICATIONS,
      validationIssues: SEED_VALIDATION_ISSUES,
      crossComparisons: SEED_CROSS_COMPARISONS,
      financialRecords: SEED_FINANCIAL_RECORDS,
      anomalies: SEED_ANOMALIES,
      activities: SEED_ACTIVITIES,
      employees: SEED_EMPLOYEES,
      permissions: SEED_PERMISSIONS,
      settings: SEED_FIRM_SETTINGS,
      selectedFY: 'FY 2026-27',
      currentEmployeeId: 'emp-1',
      previewClientId: 'cli-1',
    });
    addToast('Demo workspace reset', 'All sample data for A Y & COMPANY restored.', 'info');
  };

  const logoutDemoSession = () => {
    setDemoLocked(true);
    addToast('Demo session locked', 'Select a role to resume FinSight preview.', 'info');
  };

  const unlockDemoSession = () => {
    setDemoLocked(false);
  };

  return (
    <PracticeContext.Provider
      value={{
        ...state,
        activeSection,
        setActiveSection,
        selectedClientId,
        setSelectedClientId,
        openClientProfile,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        toasts,
        addToast,
        dismissToast,
        currentUser,
        setCurrentEmployeeId: (id) => setState((prev) => ({ ...prev, currentEmployeeId: id })),
        setSelectedFY: (fy) => setState((prev) => ({ ...prev, selectedFY: fy })),
        setPreviewClientId: (clientId) => setState((prev) => ({ ...prev, previewClientId: clientId })),
        isDemoClientMode,
        setIsDemoClientMode,
        globalSearchQuery,
        setGlobalSearchQuery,
        quickAddOpen,
        setQuickAddOpen,
        quickAddInitialType,
        openQuickAdd,
        copilotOpen,
        setCopilotOpen,
        queuedCopilotPrompt,
        openCopilotWithPrompt,
        clearQueuedCopilotPrompt,
        computeClientRiskScore,
        updateAnomalyStatus,
        escalateAnomalyToTask,
        addAnomaly,
        addCrossComparison,
        runDocumentToActionPipeline,
        addClient,
        updateClient,
        setClientStatus,
        addDocument,
        updateDocumentStatus,
        addDocumentComment,
        createDocumentRequest,
        fulfillDocumentRequest,
        addComplianceTask,
        updateComplianceTask,
        updateComplianceStatus,
        addStaffTask,
        updateStaffTask,
        updateStaffTaskStatus,
        addStaffTaskComment,
        updateValidationIssue,
        updateCrossComparison,
        markNotificationRead,
        markAllNotificationsRead,
        addReminder,
        triggerSimulatedReminder,
        addCommunication,
        addFinancialRecord,
        updateSettings,
        addEmployee,
        updateEmployee,
        updatePermission,
        resetDemoData,
        logoutDemoSession,
        demoLocked,
        unlockDemoSession,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error('usePractice must be used within PracticeProvider');
  return ctx;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskIdentifier(val?: string, mask = true): string {
  if (!val) return '—';
  if (!mask || val.length < 6) return val;
  return `${val.slice(0, 3)}••••${val.slice(-3)}`;
}

export function computeMissingDocsForClient(
  client: Client,
  documents: DocumentRecord[],
  fy: FinancialYear
): { category: DocumentCategory; state: 'Received' | 'Pending' | 'Missing' }[] {
  const clientDocs = documents.filter((d) => d.clientId === client.id && d.financialYear === fy);
  return client.requiredCategories.map((cat) => {
    const matched = clientDocs.filter((d) => d.category === cat);
    if (matched.some((d) => d.status === 'Verified')) {
      return { category: cat, state: 'Received' };
    }
    if (matched.length > 0) {
      return { category: cat, state: 'Pending' };
    }
    return { category: cat, state: 'Missing' };
  });
}

export function calculateClientRiskScore(
  client: Client,
  documents: DocumentRecord[],
  complianceTasks: ComplianceTask[],
  validationIssues: ValidationIssue[],
  anomalies: FinancialAnomaly[],
  fy: FinancialYear
): ClientRiskScoreResult {
  const factors: ClientRiskFactor[] = [];

  const checklist = computeMissingDocsForClient(client, documents, fy);
  const missingCount = checklist.filter((c) => c.state === 'Missing').length;
  if (missingCount > 0) {
    const pts = Math.min(32, missingCount * 11);
    factors.push({
      label: 'Missing Mandatory Documents',
      points: pts,
      detail: `${missingCount} required category(s) not yet uploaded for ${fy}`,
    });
  }

  const clientCompliance = complianceTasks.filter((c) => c.clientId === client.id);
  const overdueCount = clientCompliance.filter((c) => c.status === 'Overdue').length;
  if (overdueCount > 0) {
    const pts = Math.min(30, overdueCount * 22);
    factors.push({
      label: 'Overdue Compliance Filings',
      points: pts,
      detail: `${overdueCount} statutory filing(s) past due date`,
    });
  }

  const awaitingOrUrgent = clientCompliance.filter(
    (c) =>
      c.status !== 'Completed' &&
      c.status !== 'Overdue' &&
      (c.status === 'Awaiting Documents' || c.priority === 'Urgent' || c.priority === 'High')
  ).length;
  if (awaitingOrUrgent > 0) {
    const pts = Math.min(20, awaitingOrUrgent * 10);
    factors.push({
      label: 'Approaching / Blocked Deadlines',
      points: pts,
      detail: `${awaitingOrUrgent} active high-urgency or doc-blocked filing(s)`,
    });
  }

  const rejectedDocs = documents.filter(
    (d) => d.clientId === client.id && (d.status === 'Rejected' || d.status === 'Replacement Required')
  ).length;
  if (rejectedDocs > 0) {
    const pts = Math.min(18, rejectedDocs * 10);
    factors.push({
      label: 'Rejected / Replacement Required Docs',
      points: pts,
      detail: `${rejectedDocs} document(s) require resubmission`,
    });
  }

  const openValIssues = validationIssues.filter(
    (v) =>
      v.clientId === client.id &&
      (v.status === 'Open' || v.status === 'Correction Requested' || v.status === 'Rejected')
  ).length;
  const openAnomalies = anomalies.filter(
    (a) => a.clientId === client.id && (a.status === 'Flagged for CA Review' || a.status === 'Task Created')
  ).length;
  const issueTotal = openValIssues + openAnomalies;
  if (issueTotal > 0) {
    const pts = Math.min(24, issueTotal * 8);
    factors.push({
      label: 'Unresolved Validation & Anomaly Flags',
      points: pts,
      detail: `${openValIssues} validation + ${openAnomalies} anomaly alert(s) awaiting CA resolution`,
    });
  }

  const pendingApprovals = documents.filter(
    (d) => d.clientId === client.id && (d.status === 'Pending Review' || d.status === 'Uploaded')
  ).length;
  if (pendingApprovals > 0) {
    const pts = Math.min(12, pendingApprovals * 6);
    factors.push({
      label: 'Pending CA Approvals',
      points: pts,
      detail: `${pendingApprovals} document(s) awaiting CA sign-off`,
    });
  }

  const score = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.points, 0)
  );

  const level: ClientRiskScoreResult['level'] =
    score >= 70
      ? 'Critical Risk'
      : score >= 45
      ? 'High Risk'
      : score >= 20
      ? 'Moderate Risk'
      : 'Low Risk';

  return { score, level, factors };
}

