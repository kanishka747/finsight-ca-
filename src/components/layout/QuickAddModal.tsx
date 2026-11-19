import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { usePractice } from '../../context/PracticeContext';
import { SMART_ONBOARDING_CHECKLISTS } from '../../data/seedData';
import {
  ClientType,
  ComplianceType,
  DocumentCategory,
  FinancialYear,
  PriorityLevel,
} from '../../types';

type QuickAddTab = 'client' | 'document' | 'compliance' | 'task' | 'reminder';

export const QuickAddModal: React.FC = () => {
  const {
    quickAddOpen,
    setQuickAddOpen,
    quickAddInitialType,
    clients,
    employees,
    selectedFY,
    currentUser,
    settings,
    addClient,
    addDocument,
    addComplianceTask,
    addStaffTask,
    addReminder,
  } = usePractice();

  const [tab, setTab] = useState<QuickAddTab>('client');

  useEffect(() => {
    if (quickAddInitialType) setTab(quickAddInitialType);
  }, [quickAddInitialType, quickAddOpen]);

  // Client state
  const [cName, setCName] = useState('');
  const [cType, setCType] = useState<ClientType>('Private Limited');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPan, setCPan] = useState('');
  const [cGstin, setCGstin] = useState('');
  const [cEmp, setCEmp] = useState(employees[0]?.id || 'emp-1');

  // Document state
  const [dClient, setDClient] = useState(clients[0]?.id || 'cli-1');
  const [dName, setDName] = useState('');
  const [dCat, setDCat] = useState<DocumentCategory>('Bank Statements');
  const [dFy, setDFy] = useState<FinancialYear>(selectedFY);

  // Compliance state
  const [cmpClient, setCmpClient] = useState(clients[0]?.id || 'cli-1');
  const [cmpType, setCmpType] = useState<ComplianceType>('GSTR-3B');
  const [cmpTitle, setCmpTitle] = useState('');
  const [cmpDue, setCmpDue] = useState('2026-11-25');
  const [cmpEmp, setCmpEmp] = useState(employees[1]?.id || 'emp-2');
  const [cmpPrio, setCmpPrio] = useState<PriorityLevel>('High');

  // Staff Task state
  const [tTitle, setTTitle] = useState('');
  const [tClient, setTClient] = useState(clients[0]?.id || 'cli-1');
  const [tEmp, setTEmp] = useState(employees[1]?.id || 'emp-2');
  const [tDue, setTDue] = useState('2026-11-22');
  const [tPrio, setTPrio] = useState<PriorityLevel>('Medium');

  // Reminder state
  const [rClient, setRClient] = useState(clients[0]?.id || 'cli-1');
  const [rTitle, setRTitle] = useState('');
  const [rDate, setRDate] = useState('2026-11-19 10:00');
  const [rMsg, setRMsg] = useState('');

  const onboardingPreview = SMART_ONBOARDING_CHECKLISTS[cType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'client') {
      if (!cName.trim() || !cPan.trim()) return;
      addClient({
        name: cName.trim(),
        type: cType,
        dobOrIncDate: '2022-04-01',
        email: cEmail.trim() || 'contact@demo-client.in',
        phone: cPhone.trim() || '+91 98290 00000',
        address: 'MI Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pinCode: '302001',
        pan: cPan.trim().toUpperCase(),
        gstin: cGstin.trim().toUpperCase() || undefined,
        financialYear: selectedFY,
        services: onboardingPreview.defaultServices,
        assignedEmployeeId: cEmp,
        onboardingDate: new Date().toISOString().slice(0, 10),
        notes: 'Onboarded via Smart Client Onboarding (Quick Add).',
        status: 'Active',
        requiredCategories: onboardingPreview.requiredCategories,
      });
      setCName('');
      setCPan('');
      setCGstin('');
    } else if (tab === 'document') {
      if (!dName.trim()) return;
      addDocument({
        name: dName.trim(),
        fileType: 'PDF',
        fileSize: '740 KB',
        clientId: dClient,
        category: dCat,
        financialYear: dFy,
        uploadedBy: currentUser.name,
        uploadedByRole: 'Staff',
        status: 'Pending Review',
        previewSummary: `Demo document entry (${dCat}) created via Quick Add.`,
      });
      setDName('');
    } else if (tab === 'compliance') {
      if (!cmpTitle.trim()) return;
      addComplianceTask({
        title: cmpTitle.trim(),
        clientId: cmpClient,
        type: cmpType,
        financialYear: selectedFY,
        dueDate: cmpDue,
        assignedEmployeeId: cmpEmp,
        status: 'Not Started',
        priority: cmpPrio,
        description: 'Created via Quick Add.',
        requiredDocuments: ['Bank Statements'],
        reminderDaysBefore: 3,
        internalNotes: '',
      });
      setCmpTitle('');
    } else if (tab === 'task') {
      if (!tTitle.trim()) return;
      addStaffTask({
        title: tTitle.trim(),
        description: 'Created via Quick Add.',
        clientId: tClient,
        assignedEmployeeId: tEmp,
        createdBy: currentUser.name,
        priority: tPrio,
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: tDue,
        status: 'Not Started',
        attachments: [],
      });
      setTTitle('');
    } else if (tab === 'reminder') {
      if (!rTitle.trim()) return;
      addReminder({
        title: rTitle.trim(),
        clientId: rClient,
        reminderType: 'Document Follow-up',
        channel: 'Email (Simulated)',
        scheduledFor: rDate,
        status: 'Scheduled',
        message: rMsg.trim() || 'Pending document follow-up from A Y & COMPANY.',
        createdBy: currentUser.name,
      });
      setRTitle('');
      setRMsg('');
    }
    setQuickAddOpen(false);
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-[#081020] border border-[#223559] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500';

  return (
    <Modal
      open={quickAddOpen}
      onClose={() => setQuickAddOpen(false)}
      title="Quick Add Record"
      subtitle="Create a new practice entry saved to local workspace storage"
    >
      <div className="flex flex-wrap gap-1 p-1 bg-[#081020] border border-[#192845] rounded-lg mb-5">
        {(
          [
            ['client', 'Smart Onboarding'],
            ['document', 'Log Document'],
            ['compliance', 'Compliance Task'],
            ['task', 'Staff Task'],
            ['reminder', 'Reminder'],
          ] as [QuickAddTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-[#14274A] text-white border border-[#274680]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === 'client' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Client Name *
              </label>
              <input
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="e.g., Mewar Marble Exports Pvt Ltd"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client Type</label>
              <select
                value={cType}
                onChange={(e) => setCType(e.target.value as ClientType)}
                className={inputClass}
              >
                <option>Private Limited</option>
                <option>Proprietorship</option>
                <option>Partnership</option>
                <option>LLP</option>
                <option>Individual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Demo PAN *
              </label>
              <input
                required
                value={cPan}
                onChange={(e) => setCPan(e.target.value)}
                placeholder="AABCM0011K"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Demo GSTIN (optional)
              </label>
              <input
                value={cGstin}
                onChange={(e) => setCGstin(e.target.value)}
                placeholder="08AABCM0011K1Z5"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Staff
              </label>
              <select
                value={cEmp}
                onChange={(e) => setCEmp(e.target.value)}
                className={inputClass}
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                placeholder="accounts@client-demo.in"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                placeholder="+91 98290 12345"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2 bg-[#081020] border border-[#1E2E4E] rounded-lg p-3 space-y-1.5 text-xs">
              <div className="font-semibold text-teal-400">
                Smart Onboarding Auto-Checklist ({cType})
              </div>
              <div className="text-slate-300">
                Docs: {onboardingPreview.requiredCategories.join(' · ')}
              </div>
              <div className="text-slate-400">
                Services: {onboardingPreview.defaultServices.join(', ')}
              </div>
            </div>
          </div>
        )}

        {tab === 'document' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document Filename *
              </label>
              <input
                required
                value={dName}
                onChange={(e) => setDName(e.target.value)}
                placeholder="e.g., ABC_HDFC_Statement_Nov2026.pdf"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={dClient}
                onChange={(e) => setDClient(e.target.value)}
                className={inputClass}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={dCat}
                onChange={(e) => setDCat(e.target.value as DocumentCategory)}
                className={inputClass}
              >
                {settings.enabledDocumentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Financial Year
              </label>
              <select
                value={dFy}
                onChange={(e) => setDFy(e.target.value as FinancialYear)}
                className={inputClass}
              >
                {settings.availableFinancialYears.map((fy) => (
                  <option key={fy}>{fy}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tab === 'compliance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Compliance Title *
              </label>
              <input
                required
                value={cmpTitle}
                onChange={(e) => setCmpTitle(e.target.value)}
                placeholder="e.g., GSTR-1 Monthly Filing — Nov 2026"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={cmpClient}
                onChange={(e) => setCmpClient(e.target.value)}
                className={inputClass}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
              <select
                value={cmpType}
                onChange={(e) => setCmpType(e.target.value as ComplianceType)}
                className={inputClass}
              >
                {settings.enabledComplianceCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Configured Due Date
              </label>
              <input
                type="date"
                value={cmpDue}
                onChange={(e) => setCmpDue(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Staff
              </label>
              <select
                value={cmpEmp}
                onChange={(e) => setCmpEmp(e.target.value)}
                className={inputClass}
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={cmpPrio}
                onChange={(e) => setCmpPrio(e.target.value as PriorityLevel)}
                className={inputClass}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'task' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                required
                value={tTitle}
                onChange={(e) => setTTitle(e.target.value)}
                placeholder="e.g., Reconcile Q3 TDS Challans"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={tClient}
                onChange={(e) => setTClient(e.target.value)}
                className={inputClass}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assign To</label>
              <select
                value={tEmp}
                onChange={(e) => setTEmp(e.target.value)}
                className={inputClass}
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={tDue}
                onChange={(e) => setTDue(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={tPrio}
                onChange={(e) => setTPrio(e.target.value as PriorityLevel)}
                className={inputClass}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'reminder' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reminder Subject *
              </label>
              <input
                required
                value={rTitle}
                onChange={(e) => setRTitle(e.target.value)}
                placeholder="e.g., Follow up on Form 16A certificates"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={rClient}
                onChange={(e) => setRClient(e.target.value)}
                className={inputClass}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Schedule Time
              </label>
              <input
                value={rDate}
                onChange={(e) => setRDate(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Message (Simulated Delivery)
              </label>
              <textarea
                rows={3}
                value={rMsg}
                onChange={(e) => setRMsg(e.target.value)}
                placeholder="Enter follow-up note..."
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#192845]">
          <button
            type="button"
            onClick={() => setQuickAddOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-200 bg-[#101C33] border border-[#223559] rounded-lg hover:bg-[#172848]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
          >
            Save Entry
          </button>
        </div>
      </form>
    </Modal>
  );
};
