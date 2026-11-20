import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  UserCircle2,
  Users,
  ShieldCheck,
  Calendar,
  FileCheck2,
  Bell,
  FolderKanban,
  SlidersHorizontal,
  Plus,
  RotateCcw,
  Save,
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import {
  ComplianceType,
  DocumentCategory,
  Employee,
  FinancialYear,
} from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';

type SettingsTab =
  | 'firm'
  | 'profile'
  | 'employees'
  | 'roles'
  | 'fy'
  | 'compliance'
  | 'notifications'
  | 'documents'
  | 'preferences';

const SETTINGS_TABS: Array<{
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'firm', label: 'Firm Profile', icon: Building2 },
  { id: 'profile', label: 'User Profile', icon: UserCircle2 },
  { id: 'employees', label: 'Employee Management', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'fy', label: 'Financial Year Settings', icon: Calendar },
  { id: 'compliance', label: 'Compliance Categories', icon: FileCheck2 },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell },
  { id: 'documents', label: 'Document Categories', icon: FolderKanban },
  { id: 'preferences', label: 'Application Preferences', icon: SlidersHorizontal },
];

const ALL_COMPLIANCE_TYPES: ComplianceType[] = [
  'GST Returns',
  'GSTR-1',
  'GSTR-3B',
  'Income Tax Returns',
  'Advance Tax',
  'TDS Returns',
  'TDS Payments',
  'Tax Audit',
  'ROC Compliance',
  'Custom Compliance',
];

const ALL_DOC_CATEGORIES: DocumentCategory[] = [
  'PAN Card',
  'Aadhaar',
  'GST Registration Certificate',
  'Sales Invoices',
  'Purchase Invoices',
  'Bank Statements',
  'Income Tax Returns',
  'TDS Certificates',
  'Form 16',
  'Balance Sheets',
  'Profit & Loss Statements',
  'Audit Reports',
  'Other Financial Documents',
];

export const SettingsPage: React.FC = () => {
  const {
    settings,
    currentUser,
    employees,
    permissions,
    updateSettings,
    addEmployee,
    updateEmployee,
    updatePermission,
    resetDemoData,
  } = usePractice();

  const [tab, setTab] = useState<SettingsTab>('firm');
  const [resetOpen, setResetOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  // Firm state
  const [firmName, setFirmName] = useState(settings.firmName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [stateName, setStateName] = useState(settings.state);
  const [pinCode, setPinCode] = useState(settings.pinCode);
  const [icaiRegNo, setIcaiRegNo] = useState(settings.icaiRegNo);
  const [firmEmail, setFirmEmail] = useState(settings.email);
  const [firmPhone, setFirmPhone] = useState(settings.phone);

  // User profile state
  const [uName, setUName] = useState(currentUser.name);
  const [uEmail, setUEmail] = useState(currentUser.email);
  const [uPhone, setUPhone] = useState(currentUser.phone);
  const [uDept, setUDept] = useState(currentUser.department);

  useEffect(() => {
    setFirmName(settings.firmName);
    setTagline(settings.tagline);
    setAddress(settings.address);
    setCity(settings.city);
    setStateName(settings.state);
    setPinCode(settings.pinCode);
    setIcaiRegNo(settings.icaiRegNo);
    setFirmEmail(settings.email);
    setFirmPhone(settings.phone);
  }, [settings]);

  useEffect(() => {
    setUName(currentUser.name);
    setUEmail(currentUser.email);
    setUPhone(currentUser.phone);
    setUDept(currentUser.department);
  }, [currentUser]);

  // New employee modal
  const [addEmpOpen, setAddEmpOpen] = useState(false);
  const [eName, setEName] = useState('');
  const [eRole, setERole] = useState<Employee['role']>('Tax Associate');
  const [eEmail, setEEmail] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eDept, setEDept] = useState('GST & Indirect Tax');

  const handleSelectTab = (nextTab: SettingsTab) => {
    setTab(nextTab);
    requestAnimationFrame(() => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        if (rect.top < 72 || rect.top > window.innerHeight * 0.45) {
          panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  };

  const toggleComplianceCat = (cat: ComplianceType) => {
    const exists = settings.enabledComplianceCategories.includes(cat);
    const next = exists
      ? settings.enabledComplianceCategories.filter((c) => c !== cat)
      : [...settings.enabledComplianceCategories, cat];
    updateSettings({ enabledComplianceCategories: next });
  };

  const toggleDocCat = (cat: DocumentCategory) => {
    const exists = settings.enabledDocumentCategories.includes(cat);
    const next = exists
      ? settings.enabledDocumentCategories.filter((c) => c !== cat)
      : [...settings.enabledDocumentCategories, cat];
    updateSettings({ enabledDocumentCategories: next });
  };

  const inputCls =
    'w-full px-3 py-2 border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Practice Settings &amp; Administration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings.firmName} · Chartered Accountants · {settings.city}, {settings.state}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/35 rounded-lg hover:bg-rose-500/20 whitespace-nowrap shrink-0 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Settings Sidebar Tabs: Compact wrapping bar on <md, sticky vertical list on md+ */}
        <aside className="md:col-span-4 xl:col-span-3 md:sticky md:top-20 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-2 flex flex-wrap md:flex-col gap-1">
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectTab(id)}
                className={`flex items-center gap-2 md:w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#14274A] text-white border border-[#274680]'
                    : 'text-slate-400 hover:bg-[#101C33] hover:text-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </aside>

        {/* Settings Panel Content */}
        <section
          ref={panelRef}
          className="md:col-span-8 xl:col-span-9 bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-6 scroll-mt-20"
        >
          {tab === 'firm' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSettings({
                  firmName,
                  tagline,
                  address,
                  city,
                  state: stateName,
                  pinCode,
                  icaiRegNo,
                  email: firmEmail,
                  phone: firmPhone,
                });
              }}
              className="space-y-4"
            >
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Firm Profile — {settings.firmName}
                </h2>
                <p className="text-xs text-slate-400">
                  Chartered Accountants · {settings.city}, {settings.state}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Firm Name</label>
                  <input value={firmName} onChange={(e) => setFirmName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tagline</label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-300 mb-1">Office Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">City</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">State</label>
                  <input value={stateName} onChange={(e) => setStateName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">PIN Code</label>
                  <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">ICAI FRN (Demo)</label>
                  <input value={icaiRegNo} onChange={(e) => setIcaiRegNo(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Firm Email</label>
                  <input value={firmEmail} onChange={(e) => setFirmEmail(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Office Phone</label>
                  <input value={firmPhone} onChange={(e) => setFirmPhone(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Firm Profile
                </button>
              </div>
            </form>
          )}

          {tab === 'profile' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateEmployee(currentUser.id, {
                  name: uName,
                  email: uEmail,
                  phone: uPhone,
                  department: uDept,
                });
              }}
              className="space-y-4"
            >
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  User Profile — {currentUser.name}
                </h2>
                <p className="text-xs text-slate-400">Role: {currentUser.role}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                  <input value={uName} onChange={(e) => setUName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Department</label>
                  <input value={uDept} onChange={(e) => setUDept(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email</label>
                  <input value={uEmail} onChange={(e) => setUEmail(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input value={uPhone} onChange={(e) => setUPhone(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Update Profile
                </button>
              </div>
            </form>
          )}

          {tab === 'employees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#192845]">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 font-display">
                    Employee Management
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage CA partners, audit executives, and tax associates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddEmpOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Staff
                </button>
              </div>

              <div className="divide-y divide-[#15223C]">
                {employees.map((emp) => (
                  <div key={emp.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-slate-100">{emp.name}</div>
                      <div className="text-slate-400">
                        {emp.role} · {emp.department} · {emp.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateEmployee(emp.id, { active: !emp.active })}
                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                        emp.active
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#081020] border-[#223559] text-slate-400'
                      }`}
                    >
                      {emp.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Roles &amp; Permissions Matrix
                </h2>
                <p className="text-xs text-slate-400">
                  Configure operational permissions for A Y &amp; COMPANY staff roles
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2E4E] text-slate-400">
                      <th className="py-2.5 pr-4">Role</th>
                      <th className="py-2.5 px-3 text-center">Clients</th>
                      <th className="py-2.5 px-3 text-center">Verify Docs</th>
                      <th className="py-2.5 px-3 text-center">Approve Filings</th>
                      <th className="py-2.5 px-3 text-center">Financials</th>
                      <th className="py-2.5 px-3 text-center">Team</th>
                      <th className="py-2.5 pl-3 text-center">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#15223C]">
                    {permissions.map((perm) => (
                      <tr key={perm.role}>
                        <td className="py-3 pr-4 font-semibold text-slate-100">{perm.role}</td>
                        {(
                          [
                            'canManageClients',
                            'canVerifyDocuments',
                            'canApproveCompliance',
                            'canViewFinancials',
                            'canManageTeam',
                            'canExportReports',
                          ] as const
                        ).map((field) => (
                          <td key={field} className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm[field]}
                              onChange={(e) =>
                                updatePermission(perm.role, field, e.target.checked)
                              }
                              className="w-4 h-4 accent-teal-500 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'fy' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Financial Year Settings
                </h2>
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Default Active Financial Year
                </label>
                <select
                  value={settings.defaultFinancialYear}
                  onChange={(e) =>
                    updateSettings({ defaultFinancialYear: e.target.value as FinancialYear })
                  }
                  className="px-3 py-2 border border-[#223559] rounded-lg bg-[#081020] text-slate-100 font-mono"
                >
                  {settings.availableFinancialYears.map((fy) => (
                    <option key={fy}>{fy}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tab === 'compliance' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Enabled Compliance Categories
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_COMPLIANCE_TYPES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 p-2.5 border border-[#1E2E4E] bg-[#081020] rounded-lg cursor-pointer hover:bg-[#101C33] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={settings.enabledComplianceCategories.includes(cat)}
                      onChange={() => toggleComplianceCat(cat)}
                      className="w-4 h-4 accent-teal-500"
                    />
                    <span className="font-medium text-slate-200">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Notification Preferences (Simulated)
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  ['emailReminders', 'Enable Email Reminder Simulation'],
                  ['portalAlerts', 'Show Real-Time Client Portal Alerts'],
                  ['overdueDigest', 'Daily Overdue Compliance Digest'],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 border border-[#1E2E4E] bg-[#081020] rounded-lg cursor-pointer"
                  >
                    <span className="font-medium text-slate-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={
                        settings.notifications[key as 'emailReminders' | 'portalAlerts' | 'overdueDigest']
                      }
                      onChange={(e) =>
                        updateSettings({
                          notifications: {
                            ...settings.notifications,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-teal-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Active Document Categories
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_DOC_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 p-2.5 border border-[#1E2E4E] bg-[#081020] rounded-lg cursor-pointer hover:bg-[#101C33] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={settings.enabledDocumentCategories.includes(cat)}
                      onChange={() => toggleDocCat(cat)}
                      className="w-4 h-4 accent-teal-500"
                    />
                    <span className="font-medium text-slate-200">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-[#192845]">
                <h2 className="text-sm font-semibold text-slate-100 font-display">
                  Application Preferences
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  ['maskSensitiveIds', 'Mask PAN / Aadhaar / Account numbers in directory & reports'],
                  ['compactTables', 'Use compact table density'],
                  ['autoSaveDrafts', 'Auto-save changes in browser localStorage'],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 border border-[#1E2E4E] bg-[#081020] rounded-lg cursor-pointer"
                  >
                    <span className="font-medium text-slate-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={
                        settings.preferences[key as 'maskSensitiveIds' | 'compactTables' | 'autoSaveDrafts']
                      }
                      onChange={(e) =>
                        updateSettings({
                          preferences: {
                            ...settings.preferences,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-teal-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add Employee Modal */}
      <Modal
        open={addEmpOpen}
        onClose={() => setAddEmpOpen(false)}
        title="Add Team Member"
        maxWidthClass="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!eName.trim() || !eEmail.trim()) return;
            addEmployee({
              name: eName.trim(),
              role: eRole,
              email: eEmail.trim(),
              phone: ePhone.trim() || '+91 98290 00000',
              department: eDept.trim(),
              active: true,
            });
            setEName('');
            setEEmail('');
            setAddEmpOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
            <input required value={eName} onChange={(e) => setEName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block font-medium text-slate-300 mb-1">Role</label>
            <select
              value={eRole}
              onChange={(e) => setERole(e.target.value as Employee['role'])}
              className={inputCls}
            >
              <option>Partner</option>
              <option>Senior CA</option>
              <option>Audit Executive</option>
              <option>Tax Associate</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-slate-300 mb-1">Email *</label>
            <input required type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block font-medium text-slate-300 mb-1">Phone</label>
            <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className="block font-medium text-slate-300 mb-1">Department</label>
            <input value={eDept} onChange={(e) => setEDept(e.target.value)} className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddEmpOpen(false)}
              className="px-4 py-2 text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
              Add Staff
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetDemoData}
        title="Reset Demo Workspace Data"
        message="Restore all clients, documents, compliance tasks, and settings to the default A Y & COMPANY Jaipur demo dataset?"
        confirmLabel="Reset Workspace"
        destructive
      />
    </div>
  );
};
