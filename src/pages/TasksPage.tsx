import React, { useMemo, useState } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Plus,
  MessageSquare,
  Paperclip,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { PriorityLevel, StaffTask, StaffTaskStatus } from '../types';
import { Modal } from '../components/ui/Modal';
import { PriorityLabel, StatusLabel } from '../components/ui/StatusText';

const STATUS_COLUMNS: StaffTaskStatus[] = [
  'Not Started',
  'In Progress',
  'Awaiting Client',
  'Under Review',
  'Completed',
];

type ScopeFilter =
  | 'all'
  | 'mine'
  | 'others'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue';

export const TasksPage: React.FC = () => {
  const {
    staffTasks,
    clients,
    employees,
    complianceTasks,
    currentUser,
    addStaffTask,
    updateStaffTask,
    updateStaffTaskStatus,
    addStaffTaskComment,
  } = usePractice();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [staffFilter, setStaffFilter] = useState<string>('All');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StaffTaskStatus | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tClient, setTClient] = useState(clients[0]?.id || 'cli-1');
  const [tEmp, setTEmp] = useState(employees[0]?.id || 'emp-1');
  const [tPrio, setTPrio] = useState<PriorityLevel>('Medium');
  const [tStart, setTStart] = useState('2026-11-18');
  const [tDue, setTDue] = useState('2026-11-24');
  const [tComp, setTComp] = useState('');
  const [tAttach, setTAttach] = useState('');
  const [commentText, setCommentText] = useState('');

  const filteredTasks = useMemo(() => {
    return staffTasks.filter((t) => {
      if (staffFilter !== 'All' && t.assignedEmployeeId !== staffFilter) return false;
      if (scope === 'mine') return t.assignedEmployeeId === currentUser.id;
      if (scope === 'others') return t.assignedEmployeeId !== currentUser.id;
      if (scope === 'pending')
        return t.status === 'Not Started' || t.status === 'Awaiting Client';
      if (scope === 'in_progress')
        return t.status === 'In Progress' || t.status === 'Under Review';
      if (scope === 'completed') return t.status === 'Completed';
      if (scope === 'overdue') return t.status !== 'Completed' && t.dueDate < '2026-11-18';
      return true;
    });
  }, [staffTasks, scope, staffFilter, currentUser.id]);

  const selectedTask: StaffTask | null = useMemo(
    () => staffTasks.find((t) => t.id === selectedTaskId) || null,
    [staffTasks, selectedTaskId]
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    addStaffTask({
      title: tTitle.trim(),
      description: tDesc.trim() || 'Assigned via FinSight Task Workspace.',
      clientId: tClient,
      assignedEmployeeId: tEmp,
      createdBy: currentUser.name,
      priority: tPrio,
      startDate: tStart,
      dueDate: tDue,
      relatedComplianceId: tComp || undefined,
      status: 'Not Started',
      attachments: tAttach.trim() ? [tAttach.trim()] : [],
    });
    setTTitle('');
    setTDesc('');
    setTAttach('');
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Tasks &amp; Practice Workflow
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag cards across Kanban columns or switch to Table View · Filter by staff capacity
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#14274A] text-white border border-[#274680]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#14274A] text-white border border-[#274680]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Staff Capacity Filter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => setStaffFilter('All')}
          className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
            staffFilter === 'All'
              ? 'bg-[#14274A] border-[#2D5194] text-white'
              : 'bg-[#0B1426] border-[#1E2E4E] text-slate-300 hover:border-teal-500/50'
          }`}
        >
          <div className="font-semibold">All Staff</div>
          <div
            className={`text-[11px] font-mono mt-0.5 ${
              staffFilter === 'All' ? 'text-teal-300' : 'text-slate-400'
            }`}
          >
            {staffTasks.filter((t) => t.status !== 'Completed').length} active
          </div>
        </button>

        {employees.map((emp) => {
          const activeCount = staffTasks.filter(
            (t) => t.assignedEmployeeId === emp.id && t.status !== 'Completed'
          ).length;
          const active = staffFilter === emp.id;
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => setStaffFilter(active ? 'All' : emp.id)}
              className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                active
                  ? 'bg-[#14274A] border-[#2D5194] text-white'
                  : 'bg-[#0B1426] border-[#1E2E4E] text-slate-300 hover:border-teal-500/50'
              }`}
            >
              <div className="font-semibold truncate">{emp.name}</div>
              <div
                className={`text-[11px] font-mono mt-0.5 ${
                  active ? 'text-teal-300' : 'text-slate-400'
                }`}
              >
                {activeCount} open · {emp.role}
              </div>
            </button>
          );
        })}
      </div>

      {/* Scope Filter Bar */}
      <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-xl overflow-x-auto">
        {(
          [
            ['all', 'All Tasks'],
            ['mine', 'My Tasks'],
            ['others', 'Assigned to Others'],
            ['pending', 'Pending'],
            ['in_progress', 'In Progress'],
            ['overdue', 'Overdue'],
            ['completed', 'Completed'],
          ] as [ScopeFilter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              scope === id
                ? 'bg-[#14274A] text-white border border-[#274680]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Drag-and-Drop Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            const isDropTarget = dragOverCol === col;
            return (
              <div
                key={col}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  if (draggedTaskId) {
                    updateStaffTaskStatus(draggedTaskId, col);
                    setDraggedTaskId(null);
                  }
                }}
                className={`border rounded-xl p-3 flex flex-col min-h-[400px] transition-colors ${
                  isDropTarget
                    ? 'bg-teal-500/10 border-teal-500'
                    : 'bg-[#081020] border-[#1B2A47]'
                }`}
              >
                <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-[#192845]">
                  <span className="text-xs font-semibold text-slate-200">{col}</span>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colTasks.map((task) => {
                    const client = clients.find((c) => c.id === task.clientId);
                    const emp = employees.find((e) => e.id === task.assignedEmployeeId);
                    const isOverdue = task.status !== 'Completed' && task.dueDate < '2026-11-18';
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="bg-[#0B1426] border border-[#1E2E4E] rounded-lg p-3 hover:border-teal-500/70 cursor-grab active:cursor-grabbing transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                            <PriorityLabel priority={task.priority} />
                          </div>
                          <span
                            className={`text-[11px] font-mono ${
                              isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            {task.dueDate}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-100 leading-snug">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-sky-400 truncate">{client?.name}</div>
                        <div className="pt-2 border-t border-[#15223C] flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate">{emp?.name}</span>
                          {task.comments.length > 0 && (
                            <span className="inline-flex items-center gap-1 font-mono text-slate-400">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="text-center py-10 text-[11px] text-slate-500">
                      Drop tasks here for {col}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15223C]">
                {filteredTasks.map((t) => {
                  const client = clients.find((c) => c.id === t.clientId);
                  const emp = employees.find((e) => e.id === t.assignedEmployeeId);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="hover:bg-[#101C33] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-100">{t.title}</td>
                      <td className="py-3 px-4 text-sky-400">{client?.name}</td>
                      <td className="py-3 px-4 text-slate-300">{emp?.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{t.dueDate}</td>
                      <td className="py-3 px-4">
                        <PriorityLabel priority={t.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel status={t.status} />
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={t.status}
                          onChange={(e) =>
                            updateStaffTaskStatus(t.id, e.target.value as StaffTaskStatus)
                          }
                          className="px-2 py-1 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <Modal
        open={!!selectedTask}
        onClose={() => {
          setSelectedTaskId(null);
          setCommentText('');
        }}
        title={selectedTask?.title || ''}
        subtitle={
          selectedTask
            ? `${clients.find((c) => c.id === selectedTask.clientId)?.name} · Created by ${selectedTask.createdBy}`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {selectedTask && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#081020] rounded-xl border border-[#1E2E4E]">
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) =>
                    updateStaffTaskStatus(selectedTask.id, e.target.value as StaffTaskStatus)
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100 font-medium"
                >
                  {STATUS_COLUMNS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assigned Staff</label>
                <select
                  value={selectedTask.assignedEmployeeId}
                  onChange={(e) =>
                    updateStaffTask(selectedTask.id, { assignedEmployeeId: e.target.value })
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
              <div>
                <label className="block text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={selectedTask.dueDate}
                  onChange={(e) =>
                    updateStaffTask(selectedTask.id, { dueDate: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#223559] rounded-lg bg-[#0B1426] text-slate-100"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-1">Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedTask.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-slate-400 font-mono">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" /> Start: {selectedTask.startDate}
                </span>
                <PriorityLabel priority={selectedTask.priority} />
              </div>
            </div>

            {selectedTask.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-100 mb-1.5">Linked Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.attachments.map((att) => (
                    <span
                      key={att}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#081020] border border-[#1E2E4E] text-slate-200 font-mono text-[11px]"
                    >
                      <Paperclip className="w-3 h-3 text-teal-400" />
                      {att}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Comments</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {selectedTask.comments.map((c) => (
                  <div key={c.id} className="bg-[#081020] border border-[#192845] rounded-lg p-2.5">
                    <div className="flex justify-between font-semibold text-slate-100">
                      <span>{c.author}</span>
                      <span className="font-mono text-[10px] text-slate-500">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{c.text}</p>
                  </div>
                ))}
                {selectedTask.comments.length === 0 && (
                  <p className="text-slate-500">No comments posted yet.</p>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  addStaffTaskComment(selectedTask.id, commentText.trim());
                  setCommentText('');
                }}
                className="flex gap-2"
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  Post
                </button>
              </form>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Activity Timeline</h3>
              <div className="space-y-1.5">
                {selectedTask.timeline.map((tl) => (
                  <div key={tl.id} className="flex justify-between text-slate-400">
                    <span>
                      <strong className="text-slate-200">{tl.actor}</strong> — {tl.event}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{tl.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Task Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Staff Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
              <input
                required
                value={tTitle}
                onChange={(e) => setTTitle(e.target.value)}
                placeholder="e.g., Prepare GSTR-9 annual working"
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={tClient}
                onChange={(e) => setTClient(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Staff</label>
              <select
                value={tEmp}
                onChange={(e) => setTEmp(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={tStart}
                onChange={(e) => setTStart(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={tDue}
                onChange={(e) => setTDue(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={tPrio}
                onChange={(e) => setTPrio(e.target.value as PriorityLevel)}
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
                Related Compliance (optional)
              </label>
              <select
                value={tComp}
                onChange={(e) => setTComp(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                <option value="">None</option>
                {complianceTasks.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Attachment Filename (optional)
              </label>
              <input
                value={tAttach}
                onChange={(e) => setTAttach(e.target.value)}
                placeholder="e.g., Working_Sheet_Q3.xlsx"
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={tDesc}
                onChange={(e) => setTDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-xs text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
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
