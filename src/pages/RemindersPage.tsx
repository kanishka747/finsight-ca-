import React, { useState } from 'react';
import {
  Bell,
  Check,
  Send,
  CalendarClock,
  MessageSquare,
  Info,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  computeMissingDocsForClient,
  usePractice,
} from '../context/PracticeContext';
import { DocumentCategory } from '../types';
import { StatusLabel } from '../components/ui/StatusText';
import { Modal } from '../components/ui/Modal';

type ReminderTab = 'notifications' | 'reminders' | 'requests' | 'history';

export const RemindersPage: React.FC = () => {
  const {
    notifications,
    reminders,
    docRequests,
    communications,
    clients,
    documents,
    selectedFY,
    settings,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    addReminder,
    triggerSimulatedReminder,
    createDocumentRequest,
    setActiveSection,
    addToast,
  } = usePractice();

  const [tab, setTab] = useState<ReminderTab>('notifications');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const [newRemOpen, setNewRemOpen] = useState(false);
  const [rClient, setRClient] = useState(clients[0]?.id || 'cli-1');
  const [rType, setRType] = useState<'Document Follow-up' | 'Compliance Deadline' | 'Client Check-in'>(
    'Document Follow-up'
  );
  const [rChannel, setRChannel] = useState<'Email (Simulated)' | 'WhatsApp (Simulated)' | 'Portal Alert'>(
    'Email (Simulated)'
  );
  const [rTitle, setRTitle] = useState('');
  const [rTime, setRTime] = useState('2026-11-19 10:30');
  const [rMessage, setRMessage] = useState('');

  const [reqOpen, setReqOpen] = useState(false);
  const [reqClient, setReqClient] = useState(clients[0]?.id || 'cli-1');
  const [reqCat, setReqCat] = useState<DocumentCategory>('Bank Statements');
  const [reqTitle, setReqTitle] = useState('');
  const [reqDue, setReqDue] = useState('2026-11-24');
  const [reqMsg, setReqMsg] = useState('');

  const visibleNotifications = notifications.filter((n) =>
    notifFilter === 'unread' ? !n.read : true
  );

  const handleScheduleReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim()) return;
    addReminder({
      title: rTitle.trim(),
      clientId: rClient,
      reminderType: rType,
      channel: rChannel,
      scheduledFor: rTime,
      status: 'Scheduled',
      message: rMessage.trim() || 'Follow-up reminder from A Y & COMPANY.',
      createdBy: currentUser.name,
    });
    setRTitle('');
    setRMessage('');
    setNewRemOpen(false);
  };

  const handleSendFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;
    createDocumentRequest({
      clientId: reqClient,
      title: reqTitle.trim(),
      category: reqCat,
      financialYear: selectedFY,
      requestedBy: currentUser.name,
      dueDate: reqDue,
      message: reqMsg.trim() || `Please upload ${reqCat} in the FinSight Client Portal.`,
    });
    setReqTitle('');
    setReqMsg('');
    setReqOpen(false);
  };

  const handleAutoFollowUpMissing = () => {
    let generated = 0;
    clients
      .filter((c) => c.status === 'Active')
      .forEach((client) => {
        const checklist = computeMissingDocsForClient(client, documents, selectedFY);
        const missingItems = checklist.filter((i) => i.state === 'Missing').map((i) => i.category);
        if (missingItems.length === 0) return;

        const alreadyQueued = reminders.some(
          (r) =>
            r.clientId === client.id &&
            r.reminderType === 'Document Follow-up' &&
            r.status === 'Scheduled'
        );
        if (alreadyQueued) return;

        addReminder({
          title: `Auto Follow-up: ${missingItems.length} Missing Doc(s) (${selectedFY})`,
          clientId: client.id,
          reminderType: 'Document Follow-up',
          channel: 'WhatsApp (Simulated)',
          scheduledFor: '2026-11-20 10:00',
          status: 'Scheduled',
          message: `Dear ${client.name}, please upload pending ${missingItems.join(
            ', '
          )} for ${selectedFY} via the FinSight Client Portal to avoid filing delays. — A Y & COMPANY`,
          createdBy: `FinSight Follow-up Engine (${currentUser.name})`,
        });
        generated += 1;
      });

    if (generated > 0) {
      setTab('reminders');
      addToast(
        'Intelligent Follow-ups Queued',
        `Generated ${generated} personalized missing-document reminder(s).`
      );
    } else {
      addToast(
        'All Missing Items Already Queued',
        'Every active client with missing documents already has a scheduled follow-up.',
        'info'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Reminders &amp; Notification Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Intelligent follow-ups, scheduled reminders, alerts, and client communication history
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleAutoFollowUpMissing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-200 bg-[#0E2240] hover:bg-[#14305A] border border-teal-500/40 rounded-lg whitespace-nowrap transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Auto-Queue Missing Doc Follow-ups
          </button>
          <button
            type="button"
            onClick={() => setReqOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#081020] border border-[#223559] rounded-lg hover:bg-[#101C33] hover:text-white whitespace-nowrap transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send Doc Request
          </button>
          <button
            type="button"
            onClick={() => setNewRemOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Reminder
          </button>
        </div>
      </div>

      {/* Simulation Notice */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-teal-400 shrink-0" />
        <span>
          Frontend Prototype Notice: Scheduled reminders and follow-ups are simulated locally in the browser. Automated Email, SMS, or WhatsApp dispatch requires connecting an external messaging service.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#1B2A47] rounded-xl overflow-x-auto">
          {(
            [
              ['notifications', `Notifications (${notifications.filter((n) => !n.read).length} unread)`],
              ['reminders', `Scheduled Reminders (${reminders.length})`],
              ['requests', `Document Requests (${docRequests.length})`],
              ['history', `Communication Log (${communications.length})`],
            ] as [ReminderTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                tab === id
                  ? 'bg-[#14274A] text-white border border-[#274680]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D182E]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'notifications' && (
          <div className="flex items-center gap-2">
            <select
              value={notifFilter}
              onChange={(e) => setNotifFilter(e.target.value as 'all' | 'unread')}
              className="px-3 py-1.5 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
            </select>
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-400 bg-[#081020] border border-[#223559] rounded-lg hover:bg-[#101C33] transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark All Read
            </button>
          </div>
        )}
      </div>

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl divide-y divide-[#15223C] overflow-hidden">
          {visibleNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.read ? 'bg-[#0B1426]' : 'bg-[#0E203D]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <Bell
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    n.read ? 'text-slate-500' : 'text-teal-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100">{n.title}</div>
                  <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">{n.timestamp}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                {n.linkSection && (
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id, true);
                      setActiveSection(n.linkSection!);
                    }}
                    className="text-teal-400 font-medium hover:underline"
                  >
                    Open
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => markNotificationRead(n.id, !n.read)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  {n.read ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>
            </div>
          ))}
          {visibleNotifications.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">
              No unread notifications remaining.
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reminders Tab */}
      {tab === 'reminders' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 font-semibold">
                  <th className="py-3 px-4">Reminder</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type &amp; Channel</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15223C]">
                {reminders.map((r) => {
                  const client = clients.find((c) => c.id === r.clientId);
                  return (
                    <tr key={r.id} className="hover:bg-[#101C33] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{r.title}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-md">
                          {r.message}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-sky-400">{client?.name}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{r.reminderType}</div>
                        <div className="text-[11px] text-slate-500">{r.channel}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{r.scheduledFor}</td>
                      <td className="py-3 px-4">
                        <StatusLabel status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status !== 'Sent (Simulated)' ? (
                          <button
                            type="button"
                            onClick={() => triggerSimulatedReminder(r.id)}
                            className="inline-flex items-center gap-1 text-teal-400 font-medium hover:underline"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Send Now (Demo)
                          </button>
                        ) : (
                          <span className="text-slate-500">Logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Requests Tab */}
      {tab === 'requests' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl divide-y divide-[#15223C]">
          {docRequests.map((req) => {
            const client = clients.find((c) => c.id === req.clientId);
            return (
              <div key={req.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-100">
                    {req.title}{' '}
                    <span className="text-sky-400 font-normal">· {client?.name}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{req.message}</p>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    {req.category} · Requested {req.requestedDate} · Due {req.dueDate}
                  </div>
                </div>
                <StatusLabel status={req.status} />
              </div>
            );
          })}
        </div>
      )}

      {/* Communication Log Tab */}
      {tab === 'history' && (
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl divide-y divide-[#15223C]">
          {communications.map((c) => {
            const client = clients.find((cl) => cl.id === c.clientId);
            return (
              <div key={c.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      {c.subject}{' '}
                      <span className="text-sky-400 font-normal">· {client?.name}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{c.message}</p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {c.direction} · {c.channel} · {c.sender}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0">{c.timestamp}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Reminder Modal */}
      <Modal
        open={newRemOpen}
        onClose={() => setNewRemOpen(false)}
        title="Schedule Client Reminder (Simulated)"
      >
        <form onSubmit={handleScheduleReminder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject *</label>
              <input
                required
                value={rTitle}
                onChange={(e) => setRTitle(e.target.value)}
                placeholder="e.g., Pending TDS Form 16A certificates"
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={rClient}
                onChange={(e) => setRClient(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Reminder Type</label>
              <select
                value={rType}
                onChange={(e) => setRType(e.target.value as typeof rType)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                <option>Document Follow-up</option>
                <option>Compliance Deadline</option>
                <option>Client Check-in</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Channel (Demo)</label>
              <select
                value={rChannel}
                onChange={(e) => setRChannel(e.target.value as typeof rChannel)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              >
                <option>Email (Simulated)</option>
                <option>WhatsApp (Simulated)</option>
                <option>Portal Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Scheduled Date &amp; Time</label>
              <input
                value={rTime}
                onChange={(e) => setRTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Message</label>
              <textarea
                rows={3}
                value={rMessage}
                onChange={(e) => setRMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewRemOpen(false)}
              className="px-4 py-2 text-xs text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
            >
              Schedule Reminder
            </button>
          </div>
        </form>
      </Modal>

      {/* Send Document Request Modal */}
      <Modal
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        title="Send Follow-up Document Request"
      >
        <form onSubmit={handleSendFollowUp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Request Title *</label>
              <input
                required
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g., October 2026 Bank Statement"
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
              <select
                value={reqClient}
                onChange={(e) => setReqClient(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={reqCat}
                onChange={(e) => setReqCat(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
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
                className="w-full px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Instructions</label>
              <textarea
                rows={3}
                value={reqMsg}
                onChange={(e) => setReqMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReqOpen(false)}
              className="px-4 py-2 text-xs text-slate-300 border border-[#223559] rounded-lg hover:bg-[#101C33]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
            >
              Send Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
