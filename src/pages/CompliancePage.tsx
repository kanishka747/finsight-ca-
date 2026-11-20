import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import {
  ComplianceStatus,
  ComplianceTask,
  ComplianceType,
  FinancialYear,
  PriorityLevel,
} from '../types';
import { Modal } from '../components/ui/Modal';
import { PriorityLabel, StatusLabel } from '../components/ui/StatusText';

export const CompliancePage: React.FC = () => {
  const {
    complianceTasks,
    clients,
    employees,
    documents,
    selectedFY,
    settings,
    addComplianceTask,
    updateComplianceTask,
    updateComplianceStatus,
    openClientProfile,
  } = usePractice();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(10); // 0-indexed: 10 = November 2026
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [cClient, setCClient] = useState(clients[0]?.id || 'cli-1');
  const [cType, setCType] = useState<ComplianceType>('GSTR-3B');
  const [cTitle, setCTitle] = useState('');
  const [cFy, setCFy] = useState<FinancialYear>(selectedFY);
  const [cDue, setCDue] = useState('2026-11-25');
  const [cEmp, setCEmp] = useState(employees[1]?.id || 'emp-2');
  const [cPrio, setCPrio] = useState<PriorityLevel>('High');
  const [cDesc, setCDesc] = useState('');
  const [cRemDays, setCRemDays] = useState(3);

  // Detail modal note
  const [progressNote, setProgressNote] = useState('');

  const filteredTasks = useMemo(() => {
    return complianceTasks.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      return true;
    });
  }, [complianceTasks, statusFilter, typeFilter]);

  const selectedTask: ComplianceTask | null = useMemo(
    () => complianceTasks.find((t) => t.id === selectedTaskId) || null,
    [complianceTasks, selectedTaskId]
  );

  // Calendar grid helpers
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const firstDayOffset = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstDayOffset + daysInMonth }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const getTasksForDay = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${calYear}-${mm}-${dd}`;
    return filteredTasks.filter((t) => t.dueDate === dateStr);
  };

  const chipColor = (status: ComplianceStatus) => {
    if (status === 'Completed') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
    if (status === 'Overdue') return 'bg-rose-500/15 text-rose-300 border-rose-500/35';
    if (status === 'Awaiting Documents') return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
    if (status === 'Under Review' || status === 'In Progress')
      return 'bg-teal-500/15 text-teal-300 border-teal-500/35';
    return 'bg-[#111D35] text-slate-300 border-[#24385E]';
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) return;
    addComplianceTask({
      title: cTitle.trim(),
      clientId: cClient,
      type: cType,
      financialYear: cFy,
      dueDate: cDue,
      assignedEmployeeId: cEmp,
      status: 'Not Started',
      priority: cPrio,
      description: cDesc.trim() || `${cType} compliance filing.`,
      requiredDocuments: ['Bank Statements', 'Sales Invoices'],
      reminderDaysBefore: cRemDays,
      internalNotes: '',
    });
    setCTitle('');
    setCDesc('');
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Compliance Calendar &amp; Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            GST, Income Tax, Advance Tax, TDS, Tax Audit, and ROC compliance tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[#14274A] text-white border border-[#274680]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#14274A] text-white border border-[#274680]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Compliance Task
          </button>
        </div>
      </div>

      {/* Configurable Deadlines Notice */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            Preloaded dates are configurable demo deadlines. Statutory due dates vary by client turnover, scheme (QRMP), and government extensions—authorized staff can edit any due date directly.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Types</option>
            {settings.enabledComplianceCategories.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Statuses</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Awaiting Documents</option>
            <option>Under Review</option>
            <option>Completed</option>
            <option>Overdue</option>
          </select>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <section className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1E2E4E] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100 font-display">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-lg border border-[#223559] bg-[#081020] text-slate-300 hover:bg-[#101C33] hover:text-white"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalYear(2026);
                  setCalMonth(10);
                }}
                className="px-2.5 py-1 text-xs font-medium border border-[#223559] bg-[#081020] rounded-lg text-slate-200 hover:bg-[#101C33]"
              >
                Nov 2026
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-lg border border-[#223559] bg-[#081020] text-slate-300 hover:bg-[#101C33] hover:text-white"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[#1E2E4E] bg-[#081020] text-[11px] font-semibold text-slate-400 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-[#15223C]">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[104px] bg-[#050A14]" />;
              }
              const dayTasks = getTasksForDay(day);
              return (
                <div key={day} className="min-h-[104px] p-1.5 flex flex-col gap-1 bg-[#081020]">
                  <div className="text-[11px] font-mono font-medium text-slate-400 px-1">
                    {day}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {dayTasks.map((t) => {
                      const client = clients.find((c) => c.id === t.clientId);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`w-full text-left px-1.5 py-1 rounded border text-[10px] leading-tight truncate hover:brightness-110 transition-all ${chipColor(
                            t.status
                          )}`}
                          title={`${t.title} (${client?.name})`}
                        >
                          <span className="font-semibold">{t.type}</span> · {client?.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Compliance Task</th>
                  <th className="py-3 px-4">FY</th>
                  <th className="py-3 px-4">Due Date (Demo)</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15223C]">
                {filteredTasks.map((t) => {
                  const client = clients.find((c) => c.id === t.clientId);
                  const staff = employees.find((e) => e.id === t.assignedEmployeeId);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="hover:bg-[#101C33] cursor-pointer transition-colors"
                    >
                      <td
                        className="py-3 px-4 font-medium text-sky-400 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (client) openClientProfile(client.id);
                        }}
                      >
                        {client?.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{t.title}</div>
                        <div className="text-[11px] text-slate-400">{t.type}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{t.financialYear}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{t.dueDate}</td>
                      <td className="py-3 px-4 text-slate-300">{staff?.name}</td>
                      <td className="py-3 px-4">
                        <PriorityLabel priority={t.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel status={t.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(t.id);
                          }}
                          className="text-teal-400 font-medium hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Detail Modal */}
      <Modal
        open={!!selectedTask}
        onClose={() => {
          setSelectedTaskId(null);
          setProgressNote('');
        }}
        title={selectedTask?.title || ''}
        subtitle={
          selectedTask
            ? `${clients.find((c) => c.id === selectedTask.clientId)?.name} · ${selectedTask.type} · ${selectedTask.financialYear}`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {selectedTask && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#081020] rounded-xl border border-[#1E2E4E]">
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) =>
                    updateComplianceStatus(
                      selectedTask.id,
                      e.target.value as ComplianceStatus
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100 font-medium"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Awaiting Documents</option>
                  <option>Under Review</option>
                  <option>Completed</option>
                  <option>Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Configured Due Date</label>
                <input
                  type="date"
                  value={selectedTask.dueDate}
                  onChange={(e) =>
                    updateComplianceTask(selectedTask.id, { dueDate: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assigned Staff</label>
                <select
                  value={selectedTask.assignedEmployeeId}
                  onChange={(e) =>
                    updateComplianceTask(selectedTask.id, {
                      assignedEmployeeId: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-1">Description</h3>
              <p className="text-slate-300 leading-relaxed">{selectedTask.description}</p>
              {selectedTask.completionDate && (
                <p className="text-emerald-400 font-mono mt-1.5">
                  Completed on: {selectedTask.completionDate}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-2">
                Required Documents Status
              </h3>
              <div className="divide-y divide-[#15223C] border border-[#1E2E4E] bg-[#081020] rounded-lg">
                {selectedTask.requiredDocuments.map((cat) => {
                  const matched = documents.find(
                    (d) =>
                      d.clientId === selectedTask.clientId &&
                      d.category === cat &&
                      d.financialYear === selectedTask.financialYear
                  );
                  return (
                    <div
                      key={cat}
                      className="px-3 py-2 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-200">{cat}</span>
                      <StatusLabel status={matched ? matched.status : 'Missing'} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-1">Internal Notes</h3>
              <textarea
                rows={2}
                value={selectedTask.internalNotes}
                onChange={(e) =>
                  updateComplianceTask(selectedTask.id, { internalNotes: e.target.value })
                }
                placeholder="Add compliance filing notes..."
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Progress History</h3>
              <div className="space-y-2 mb-3">
                {selectedTask.progressHistory.map((p) => (
                  <div key={p.id} className="bg-[#081020] border border-[#192845] rounded-lg px-3 py-2 flex justify-between gap-3">
                    <span className="text-slate-300">
                      <strong className="text-slate-100">{p.actor}:</strong> {p.note}
                    </span>
                    <span className="font-mono text-slate-500 shrink-0">{p.date}</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!progressNote.trim()) return;
                  updateComplianceStatus(
                    selectedTask.id,
                    selectedTask.status,
                    progressNote.trim()
                  );
                  setProgressNote('');
                }}
                className="flex gap-2"
              >
                <input
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Add progress update..."
                  className="flex-1 px-3 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  Log Update
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Compliance Task Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Compliance Task"
        subtitle="Configure due dates as needed for this client"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
              <input
                required
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="e.g., GSTR-1 Filing — Nov 2026"
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={cClient}
                onChange={(e) => setCClient(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Compliance Type</label>
              <select
                value={cType}
                onChange={(e) => setCType(e.target.value as ComplianceType)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                {settings.enabledComplianceCategories.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Financial Year</label>
              <select
                value={cFy}
                onChange={(e) => setCFy(e.target.value as FinancialYear)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                {settings.availableFinancialYears.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={cDue}
                onChange={(e) => setCDue(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Employee</label>
              <select
                value={cEmp}
                onChange={(e) => setCEmp(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
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
                value={cPrio}
                onChange={(e) => setCPrio(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reminder Lead Days
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={cRemDays}
                onChange={(e) => setCRemDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={cDesc}
                onChange={(e) => setCDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
