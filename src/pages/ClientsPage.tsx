import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  Edit3,
  Archive,
  Mail,
  Phone,
  MapPin,
  FileUp,
  Send,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Table as TableIcon,
  ShieldAlert,
  Bot,
} from 'lucide-react';
import {
  computeMissingDocsForClient,
  maskIdentifier,
  usePractice,
} from '../context/PracticeContext';
import { SMART_ONBOARDING_CHECKLISTS } from '../data/seedData';
import {
  Client,
  ClientStatus,
  ClientType,
  DocumentCategory,
  FinancialYear,
} from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusLabel, PriorityLabel } from '../components/ui/StatusText';

type ClientTab = 'overview' | 'documents' | 'compliance' | 'tasks' | 'requests' | 'history';

export const ClientsPage: React.FC = () => {
  const {
    clients,
    employees,
    documents,
    complianceTasks,
    staffTasks,
    docRequests,
    activities,
    selectedClientId,
    setSelectedClientId,
    selectedFY,
    settings,
    currentUser,
    addClient,
    updateClient,
    setClientStatus,
    addDocument,
    updateDocumentStatus,
    createDocumentRequest,
    computeClientRiskScore,
    openCopilotWithPrompt,
    setActiveSection,
  } = usePractice();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [empFilter, setEmpFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'onboarding' | 'risk'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null);

  const [detailTab, setDetailTab] = useState<ClientTab>('overview');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCat, setReqCat] = useState<DocumentCategory>('Bank Statements');
  const [reqDue, setReqDue] = useState('2026-11-25');
  const [reqMsg, setReqMsg] = useState('');

  // Form fields
  const [fName, setFName] = useState('');
  const [fType, setFType] = useState<ClientType>('Private Limited');
  const [fDob, setFDob] = useState('2020-04-01');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fCity, setFCity] = useState('Jaipur');
  const [fState, setFState] = useState('Rajasthan');
  const [fPin, setFPin] = useState('302001');
  const [fPan, setFPan] = useState('');
  const [fGstin, setFGstin] = useState('');
  const [fTan, setFTan] = useState('');
  const [fFy, setFFy] = useState<FinancialYear>(selectedFY);
  const [fServices, setFServices] = useState(
    SMART_ONBOARDING_CHECKLISTS['Private Limited'].defaultServices.join(', ')
  );
  const [fEmp, setFEmp] = useState(employees[0]?.id || 'emp-1');
  const [fOnboard, setFOnboard] = useState(new Date().toISOString().slice(0, 10));
  const [fNotes, setFNotes] = useState('');
  const [fStatus, setFStatus] = useState<ClientStatus>('Active');
  const [formError, setFormError] = useState('');

  const handleTypeChange = (nextType: ClientType) => {
    setFType(nextType);
    if (!editingClient) {
      setFServices(SMART_ONBOARDING_CHECKLISTS[nextType].defaultServices.join(', '));
    }
  };

  const openAddForm = () => {
    setEditingClient(null);
    setFName('');
    setFType('Private Limited');
    setFDob('2020-04-01');
    setFEmail('');
    setFPhone('');
    setFAddress('');
    setFCity('Jaipur');
    setFState('Rajasthan');
    setFPin('302001');
    setFPan('');
    setFGstin('');
    setFTan('');
    setFFy(selectedFY);
    setFServices(SMART_ONBOARDING_CHECKLISTS['Private Limited'].defaultServices.join(', '));
    setFEmp(employees[0]?.id || 'emp-1');
    setFOnboard(new Date().toISOString().slice(0, 10));
    setFNotes('');
    setFStatus('Active');
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setFName(client.name);
    setFType(client.type);
    setFDob(client.dobOrIncDate);
    setFEmail(client.email);
    setFPhone(client.phone);
    setFAddress(client.address);
    setFCity(client.city);
    setFState(client.state);
    setFPin(client.pinCode);
    setFPan(client.pan);
    setFGstin(client.gstin || '');
    setFTan(client.tan || '');
    setFFy(client.financialYear);
    setFServices(client.services.join(', '));
    setFEmp(client.assignedEmployeeId);
    setFOnboard(client.onboardingDate);
    setFNotes(client.notes);
    setFStatus(client.status);
    setFormError('');
    setFormOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fPan.trim() || !fEmail.trim()) {
      setFormError('Client name, Demo PAN, and Email are required.');
      return;
    }
    const template = SMART_ONBOARDING_CHECKLISTS[fType];
    const payload = {
      name: fName.trim(),
      type: fType,
      dobOrIncDate: fDob,
      email: fEmail.trim(),
      phone: fPhone.trim() || '+91 98290 00000',
      address: fAddress.trim() || 'Jaipur',
      city: fCity.trim() || 'Jaipur',
      state: fState.trim() || 'Rajasthan',
      pinCode: fPin.trim() || '302001',
      pan: fPan.trim().toUpperCase(),
      gstin: fGstin.trim() ? fGstin.trim().toUpperCase() : undefined,
      tan: fTan.trim() ? fTan.trim().toUpperCase() : undefined,
      financialYear: fFy,
      services: fServices
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      assignedEmployeeId: fEmp,
      onboardingDate: fOnboard,
      notes: fNotes.trim(),
      status: fStatus,
      requiredCategories: editingClient?.requiredCategories || template.requiredCategories,
    };
    if (editingClient) {
      updateClient(editingClient.id, payload);
    } else {
      const created = addClient(payload);
      setSelectedClientId(created.id);
    }
    setFormOpen(false);
  };

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (typeFilter !== 'All' && c.type !== typeFilter) return false;
        if (empFilter !== 'All' && c.assignedEmployeeId !== empFilter) return false;
        if (
          q &&
          !(
            c.name.toLowerCase().includes(q) ||
            c.pan.toLowerCase().includes(q) ||
            (c.gstin && c.gstin.toLowerCase().includes(q)) ||
            c.clientCode.toLowerCase().includes(q)
          )
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'code') return a.clientCode.localeCompare(b.clientCode);
        if (sortBy === 'risk') {
          return computeClientRiskScore(b.id).score - computeClientRiskScore(a.id).score;
        }
        return b.onboardingDate.localeCompare(a.onboardingDate);
      });
  }, [clients, search, typeFilter, empFilter, statusFilter, sortBy, computeClientRiskScore]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const inputCls =
    'w-full px-3 py-2 text-xs bg-[#081020] border border-[#223559] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500';

  // Detail Profile View
  if (selectedClient) {
    const staff = employees.find((e) => e.id === selectedClient.assignedEmployeeId);
    const clientDocs = documents.filter((d) => d.clientId === selectedClient.id);
    const clientCompliance = complianceTasks.filter((c) => c.clientId === selectedClient.id);
    const clientTasks = staffTasks.filter((t) => t.clientId === selectedClient.id);
    const clientReqs = docRequests.filter((r) => r.clientId === selectedClient.id);
    const clientActs = activities.filter((a) => a.clientId === selectedClient.id);
    const checklist = computeMissingDocsForClient(selectedClient, documents, selectedFY);
    const risk = computeClientRiskScore(selectedClient.id);

    const handleSendRequest = (e: React.FormEvent) => {
      e.preventDefault();
      if (!reqTitle.trim()) return;
      createDocumentRequest({
        clientId: selectedClient.id,
        title: reqTitle.trim(),
        category: reqCat,
        financialYear: selectedFY,
        requestedBy: currentUser.name,
        dueDate: reqDue,
        message: reqMsg.trim() || `Please upload ${reqCat} for ${selectedFY}.`,
      });
      setReqTitle('');
      setReqMsg('');
      setRequestModalOpen(false);
    };

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setSelectedClientId(null)}
              className="mt-0.5 p-2 rounded-lg bg-[#0B1426] border border-[#1E2E4E] text-slate-300 hover:text-white hover:bg-[#12203B]"
              aria-label="Back to client directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-100 font-display">
                  {selectedClient.name}
                </h1>
                <StatusLabel status={selectedClient.status} />
                <span className="text-xs font-mono font-semibold text-amber-400">
                  Risk: {risk.score}/100 ({risk.level})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {selectedClient.clientCode} · {selectedClient.type} · Demo PAN:{' '}
                {maskIdentifier(selectedClient.pan, settings.preferences.maskSensitiveIds)}
                {selectedClient.gstin ? ` · Demo GSTIN: ${selectedClient.gstin}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() =>
                openCopilotWithPrompt(`Summarise ${selectedClient.name}'s pending requirements, missing docs, and compliance risk.`)
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-300 bg-[#0E2240] border border-teal-500/40 rounded-lg hover:bg-[#14305A] whitespace-nowrap"
            >
              <Bot className="w-3.5 h-3.5" />
              Summarise in Copilot
            </button>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              Request Document
            </button>
            <button
              type="button"
              onClick={() => openEditForm(selectedClient)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#0B1426] border border-[#223559] rounded-lg hover:bg-[#12203B] whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            {selectedClient.status !== 'Archived' && (
              <button
                type="button"
                onClick={() => setArchiveTarget(selectedClient)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 bg-[#0B1426] border border-[#223559] rounded-lg hover:bg-rose-950/40 whitespace-nowrap"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            )}
          </div>
        </div>

        {/* Client Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-xl overflow-x-auto">
          {(
            [
              ['overview', 'Overview & Risk'],
              ['documents', `Documents (${clientDocs.length})`],
              ['compliance', `Compliance (${clientCompliance.length})`],
              ['tasks', `Tasks (${clientTasks.length})`],
              ['requests', `Requests (${clientReqs.length})`],
              ['history', `Audit Trail (${clientActs.length})`],
            ] as [ClientTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDetailTab(id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                detailTab === id
                  ? 'bg-[#14274A] text-white border border-[#274680]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {detailTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 font-display mb-3">
                  Client Profile & Tax Identifiers (Demo Data)
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Assigned CA / Staff</dt>
                    <dd className="font-medium text-slate-100 mt-0.5">{staff?.name || 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Onboarding Date</dt>
                    <dd className="font-mono text-slate-100 mt-0.5">{selectedClient.onboardingDate}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Demo PAN</dt>
                    <dd className="font-mono text-slate-100 mt-0.5">{selectedClient.pan}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Demo GSTIN</dt>
                    <dd className="font-mono text-slate-100 mt-0.5">{selectedClient.gstin || 'Not Applicable'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Demo TAN</dt>
                    <dd className="font-mono text-slate-100 mt-0.5">{selectedClient.tan || 'Not Applicable'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">DOB / Incorporation</dt>
                    <dd className="font-mono text-slate-100 mt-0.5">{selectedClient.dobOrIncDate}</dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4 border-t border-[#172540] space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedClient.address}, {selectedClient.city}, {selectedClient.state} -{' '}
                    {selectedClient.pinCode}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#172540]">
                <div className="text-xs font-medium text-slate-400 mb-1.5">Active Service Categories</div>
                <div className="text-xs font-medium text-teal-300">
                  {selectedClient.services.join(' · ')}
                </div>
              </div>

              {selectedClient.notes && (
                <div className="pt-4 border-t border-[#172540]">
                  <div className="text-xs font-medium text-slate-400 mb-1">Internal Practice Notes</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedClient.notes}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              {/* Compliance Risk Score Breakdown */}
              <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-100 font-display flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Compliance Risk Breakdown
                  </h2>
                  <span className="font-mono font-bold text-base text-slate-100">
                    {risk.score}/100
                  </span>
                </div>
                <div className="space-y-1.5">
                  {risk.factors.length === 0 ? (
                    <p className="text-xs text-emerald-400">Zero risk triggers detected.</p>
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

              <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-100 font-display">
                    Required Documents Checklist ({selectedFY})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(true)}
                    className="text-xs font-medium text-teal-400 hover:text-teal-300"
                  >
                    Request Missing
                  </button>
                </div>
                <div className="divide-y divide-[#15233E]">
                  {checklist.map((item) => (
                    <div key={item.category} className="py-2 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{item.category}</span>
                      <StatusLabel status={item.state} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'documents' && (
          <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#192845] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Client Document Repository</h2>
              <button
                type="button"
                onClick={() => {
                  addDocument({
                    name: `${selectedClient.name.replace(/\s+/g, '_')}_QuickUpload_${selectedFY.replace(/\s+/g, '')}.pdf`,
                    fileType: 'PDF',
                    fileSize: '820 KB',
                    clientId: selectedClient.id,
                    category: 'Bank Statements',
                    financialYear: selectedFY,
                    uploadedBy: currentUser.name,
                    uploadedByRole: 'Staff',
                    status: 'Pending Review',
                    previewSummary: 'Sample document logged from Client Profile.',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
              >
                <FileUp className="w-3.5 h-3.5" />
                Log Sample Upload
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#192845] bg-[#081020] text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Document Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">FY</th>
                    <th className="py-2.5 px-4">Upload Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Quick Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15233E]">
                  {clientDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#101C33]">
                      <td className="py-3 px-4 font-medium text-slate-100">{doc.name}</td>
                      <td className="py-3 px-4 text-slate-300">{doc.category}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{doc.financialYear}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{doc.uploadDate}</td>
                      <td className="py-3 px-4">
                        <StatusLabel status={doc.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {doc.status !== 'Verified' && (
                          <button
                            type="button"
                            onClick={() => updateDocumentStatus(doc.id, 'Verified', 'Approved from client profile')}
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {doc.status !== 'Rejected' && (
                          <button
                            type="button"
                            onClick={() => updateDocumentStatus(doc.id, 'Rejected', 'Rejected from client profile')}
                            className="inline-flex items-center gap-1 text-rose-400 hover:underline font-medium"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clientDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No documents recorded for this client yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === 'compliance' && (
          <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#192845] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Client Compliance Schedule</h2>
              <button
                type="button"
                onClick={() => setActiveSection('compliance')}
                className="text-xs font-medium text-teal-400 hover:underline"
              >
                Open Full Compliance Calendar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#192845] bg-[#081020] text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Filing / Task</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15233E]">
                  {clientCompliance.map((cmp) => (
                    <tr key={cmp.id} className="hover:bg-[#101C33]">
                      <td className="py-3 px-4 font-medium text-slate-100">{cmp.title}</td>
                      <td className="py-3 px-4 text-slate-300">{cmp.type}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{cmp.dueDate}</td>
                      <td className="py-3 px-4">
                        <PriorityLabel priority={cmp.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel status={cmp.status} />
                      </td>
                    </tr>
                  ))}
                  {clientCompliance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No compliance tasks assigned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === 'tasks' && (
          <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#192845] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Assigned Staff Workflow</h2>
              <button
                type="button"
                onClick={() => setActiveSection('tasks')}
                className="text-xs font-medium text-teal-400 hover:underline"
              >
                Open Task Board
              </button>
            </div>
            <div className="divide-y divide-[#15233E]">
              {clientTasks.map((t) => {
                const assignee = employees.find((e) => e.id === t.assignedEmployeeId);
                return (
                  <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{t.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Assigned to {assignee?.name} · Due {t.dueDate}
                      </div>
                    </div>
                    <StatusLabel status={t.status} />
                  </div>
                );
              })}
              {clientTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">No internal tasks for this client.</div>
              )}
            </div>
          </div>
        )}

        {detailTab === 'requests' && (
          <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#192845] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Document Requests Sent to Client</h2>
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="text-xs font-medium text-teal-400 hover:underline"
              >
                + New Request
              </button>
            </div>
            <div className="divide-y divide-[#15233E]">
              {clientReqs.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-100">{r.title}</div>
                    <p className="text-xs text-slate-400 mt-0.5">{r.message}</p>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Requested {r.requestedDate} · Due {r.dueDate} · By {r.requestedBy}
                    </div>
                  </div>
                  <StatusLabel status={r.status} />
                </div>
              ))}
              {clientReqs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">No document requests sent yet.</div>
              )}
            </div>
          </div>
        )}

        {detailTab === 'history' && (
          <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-3">
              Complete Client Audit Trail ({clientActs.length} events)
            </h2>
            <div className="divide-y divide-[#15233E]">
              {clientActs.map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    <strong className="text-slate-100">{a.actor}</strong> {a.action}{' '}
                    <span className="text-teal-400 font-medium">{a.target}</span>
                  </span>
                  <span className="font-mono text-slate-500">{a.timestamp}</span>
                </div>
              ))}
              {clientActs.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-500">No recorded activity yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Request Document Modal */}
        <Modal
          open={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          title={`Request Document — ${selectedClient.name}`}
          subtitle="Creates an actionable request in the Client Portal"
          maxWidthClass="max-w-lg"
        >
          <form onSubmit={handleSendRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Request Title *</label>
              <input
                required
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g., November 2026 HDFC Bank Statement"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={reqCat}
                  onChange={(e) => setReqCat(e.target.value as DocumentCategory)}
                  className={inputCls}
                >
                  {settings.enabledDocumentCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={reqDue}
                  onChange={(e) => setReqDue(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Message to Client</label>
              <textarea
                rows={3}
                value={reqMsg}
                onChange={(e) => setReqMsg(e.target.value)}
                placeholder="Specify statement period or required format..."
                className={inputCls}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#101C33] border border-[#223559] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
              >
                Send Request
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!archiveTarget}
          onClose={() => setArchiveTarget(null)}
          onConfirm={() => {
            if (archiveTarget) {
              setClientStatus(archiveTarget.id, 'Archived');
              setSelectedClientId(null);
            }
          }}
          title="Archive Client Record"
          message={`Archive ${archiveTarget?.name}? Historical documents and filings will remain preserved in local workspace storage.`}
          confirmLabel="Archive Client"
          destructive
        />
      </div>
    );
  }

  // Client Directory View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">Client Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredClients.length} shown of {clients.length} total clients · Live Compliance Risk Scores & Smart Onboarding
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md ${
                viewMode === 'table'
                  ? 'bg-[#14274A] text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md ${
                viewMode === 'grid'
                  ? 'bg-[#14274A] text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Portfolio Grid
            </button>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Smart Onboard Client
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, PAN, GSTIN or client ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#081020] border border-[#223559] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={inputCls}
          aria-label="Filter by client type"
        >
          <option value="All">All Entity Types</option>
          <option value="Individual">Individual</option>
          <option value="Private Limited">Private Limited</option>
          <option value="Partnership">Partnership</option>
          <option value="LLP">LLP</option>
          <option value="Proprietorship">Proprietorship</option>
        </select>

        <select
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
          className={inputCls}
          aria-label="Filter by assigned employee"
        >
          <option value="All">All Staff Members</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputCls} flex-1`}
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'code' | 'onboarding' | 'risk')}
            className={inputCls}
            aria-label="Sort clients"
          >
            <option value="name">Sort: Name</option>
            <option value="risk">Sort: Risk Score</option>
            <option value="code">Sort: ID</option>
            <option value="onboarding">Sort: Recent</option>
          </select>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const staff = employees.find((e) => e.id === client.assignedEmployeeId);
            const checklist = computeMissingDocsForClient(client, documents, selectedFY);
            const receivedDocs = checklist.filter((i) => i.state === 'Received').length;
            const docPct = checklist.length > 0 ? Math.round((receivedDocs / checklist.length) * 100) : 100;
            const risk = computeClientRiskScore(client.id);

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 hover:border-teal-500/60 cursor-pointer transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-slate-400">
                        {client.clientCode} · {client.type}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 font-display truncate mt-0.5">
                        {client.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold shrink-0 ${
                        risk.score >= 70
                          ? 'text-rose-400'
                          : risk.score >= 45
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {risk.score}/100
                    </span>
                  </div>

                  <div className="mt-3 text-xs font-mono text-slate-300 space-y-0.5">
                    <div>PAN: {maskIdentifier(client.pan, settings.preferences.maskSensitiveIds)}</div>
                    {client.gstin && <div className="text-[11px] text-slate-400">GSTIN: {client.gstin}</div>}
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-[#172540] text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Document Readiness ({selectedFY})</span>
                      <span className="font-mono font-medium text-slate-200">
                        {receivedDocs}/{checklist.length} ({docPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#081020] rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${docPct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Staff: <strong className="text-slate-200">{staff?.name || '—'}</strong></span>
                    <StatusLabel status={risk.level} />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="col-span-full bg-[#0B1426] border border-[#1E2E4E] rounded-xl py-10 text-center text-xs text-slate-400">
              No clients matched your search or filter criteria.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#192845] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Demo PAN / GSTIN</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4 text-right">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15233E]">
                {filteredClients.map((client) => {
                  const staff = employees.find((e) => e.id === client.assignedEmployeeId);
                  const risk = computeClientRiskScore(client.id);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className="hover:bg-[#101C33] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">{client.clientCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{client.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {client.city}, {client.state}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{client.type}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div>{maskIdentifier(client.pan, settings.preferences.maskSensitiveIds)}</div>
                        {client.gstin && (
                          <div className="text-[11px] text-slate-500">{client.gstin}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{staff?.name || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            risk.score >= 70
                              ? 'text-rose-400 font-semibold'
                              : risk.score >= 45
                              ? 'text-amber-400 font-semibold'
                              : 'text-emerald-400 font-medium'
                          }
                        >
                          {risk.score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel status={client.status} />
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap space-x-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedClientId(client.id)}
                          className="text-teal-400 hover:underline font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(client)}
                          className="text-slate-300 hover:text-white font-medium"
                        >
                          Edit
                        </button>
                        {client.status !== 'Archived' && (
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(client)}
                            className="text-rose-400 hover:underline font-medium"
                          >
                            Archive
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No clients matched your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal with Smart Onboarding Preview */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingClient ? `Edit Client — ${editingClient.name}` : 'Smart Client Onboarding'}
        subtitle="Entity type automatically generates required document checklist & staff onboarding workflow"
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSaveClient} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Personal / Entity Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Client Name *</label>
                <input
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Client Type</label>
                <select
                  value={fType}
                  onChange={(e) => handleTypeChange(e.target.value as ClientType)}
                  className={inputCls}
                >
                  <option>Individual</option>
                  <option>Private Limited</option>
                  <option>Partnership</option>
                  <option>LLP</option>
                  <option>Proprietorship</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">DOB / Incorporation</label>
                <input
                  type="date"
                  value={fDob}
                  onChange={(e) => setFDob(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
                <input
                  value={fAddress}
                  onChange={(e) => setFAddress(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                <input
                  value={fCity}
                  onChange={(e) => setFCity(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
                <input
                  value={fState}
                  onChange={(e) => setFState(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">PIN Code</label>
                <input
                  value={fPin}
                  onChange={(e) => setFPin(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#172540]">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Tax Information (Demo)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Demo PAN *</label>
                <input
                  required
                  value={fPan}
                  onChange={(e) => setFPan(e.target.value)}
                  placeholder="AABCA0001D"
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Demo GSTIN</label>
                <input
                  value={fGstin}
                  onChange={(e) => setFGstin(e.target.value)}
                  placeholder="08AABCA0001D1Z5"
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Demo TAN</label>
                <input
                  value={fTan}
                  onChange={(e) => setFTan(e.target.value)}
                  placeholder="JPRA00121B"
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Financial Year</label>
                <select
                  value={fFy}
                  onChange={(e) => setFFy(e.target.value as FinancialYear)}
                  className={inputCls}
                >
                  {settings.availableFinancialYears.map((fy) => (
                    <option key={fy}>{fy}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Service Categories (comma-separated)
                </label>
                <input
                  value={fServices}
                  onChange={(e) => setFServices(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {!editingClient && (
            <div className="bg-[#081020] border border-[#1E2E4E] rounded-lg p-3.5 text-xs space-y-1.5">
              <div className="font-semibold text-teal-400">
                Smart Onboarding Checklist Preview ({fType})
              </div>
              <div className="text-slate-300">
                Required Docs: {SMART_ONBOARDING_CHECKLISTS[fType].requiredCategories.join(' · ')}
              </div>
              <div className="text-slate-400">
                Workflow Steps: {SMART_ONBOARDING_CHECKLISTS[fType].onboardingSteps.join(' → ')}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[#172540]">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Internal Practice Allocation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Staff</label>
                <select
                  value={fEmp}
                  onChange={(e) => setFEmp(e.target.value)}
                  className={inputCls}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Onboarding Date</label>
                <input
                  type="date"
                  value={fOnboard}
                  onChange={(e) => setFOnboard(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value as ClientStatus)}
                  className={inputCls}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Archived</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#172540]">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#101C33] border border-[#223559] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
            >
              {editingClient ? 'Save Changes' : 'Create Client & Workflow'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) setClientStatus(archiveTarget.id, 'Archived');
        }}
        title="Archive Client"
        message={`Move ${archiveTarget?.name} to Archived status? All linked documents and compliance records remain intact.`}
        confirmLabel="Archive"
        destructive
      />
    </div>
  );
};
