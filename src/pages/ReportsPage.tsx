import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  computeMissingDocsForClient,
  maskIdentifier,
  usePractice,
} from '../context/PracticeContext';
import { InteractiveBarChart } from '../components/ui/DataCharts';
import { FinancialYear } from '../types';

type ReportKey =
  | 'client_directory'
  | 'pending_documents'
  | 'document_verification'
  | 'compliance_status'
  | 'upcoming_deadlines'
  | 'overdue_tasks'
  | 'employee_workload'
  | 'client_activity'
  | 'monthly_performance';

const REPORT_LIST: { key: ReportKey; title: string; desc: string }[] = [
  { key: 'client_directory', title: 'Client Directory Report', desc: 'Active/inactive entities with masked identifiers' },
  { key: 'pending_documents', title: 'Pending Document Report', desc: 'Missing & unverified required documents per client' },
  { key: 'document_verification', title: 'Document Verification Report', desc: 'Status audit across uploaded repository' },
  { key: 'compliance_status', title: 'Compliance Status Report', desc: 'Filing completion breakdown by client' },
  { key: 'upcoming_deadlines', title: 'Upcoming Deadline Report', desc: 'Chronological schedule of due compliances' },
  { key: 'overdue_tasks', title: 'Overdue Task Report', desc: 'Staff tasks past configured due date' },
  { key: 'employee_workload', title: 'Employee Workload Report', desc: 'Clients, filings, and tasks per staff member' },
  { key: 'client_activity', title: 'Client-wise Activity Report', desc: 'Recent portal & staff actions by client' },
  { key: 'monthly_performance', title: 'Monthly Performance Report', desc: 'Practice output across recent months' },
];

export const ReportsPage: React.FC = () => {
  const {
    clients,
    documents,
    complianceTasks,
    staffTasks,
    employees,
    activities,
    selectedFY,
    settings,
    addToast,
  } = usePractice();

  const [activeReport, setActiveReport] = useState<ReportKey>('pending_documents');
  const [clientFilter, setClientFilter] = useState('All');
  const [fyFilter, setFyFilter] = useState<FinancialYear | 'All'>(selectedFY);
  const [dateFrom, setDateFrom] = useState('');

  const reportData = useMemo(() => {
    const matchClient = (cid?: string) => clientFilter === 'All' || cid === clientFilter;

    switch (activeReport) {
      case 'client_directory': {
        const rows = clients
          .filter((c) => matchClient(c.id))
          .map((c) => [
            c.clientCode,
            c.name,
            c.type,
            maskIdentifier(c.pan, settings.preferences.maskSensitiveIds),
            c.city,
            employees.find((e) => e.id === c.assignedEmployeeId)?.name || '—',
            c.status,
          ]);
        return {
          headers: ['Code', 'Client Name', 'Type', 'PAN (Masked)', 'City', 'Assigned Staff', 'Status'],
          rows,
          chart: [
            { label: 'Active', primary: clients.filter((c) => c.status === 'Active').length },
            { label: 'Inactive', primary: clients.filter((c) => c.status === 'Inactive').length },
            { label: 'Archived', primary: clients.filter((c) => c.status === 'Archived').length },
          ],
        };
      }

      case 'pending_documents': {
        const rows: string[][] = [];
        const targetFY = fyFilter === 'All' ? selectedFY : fyFilter;
        clients
          .filter((c) => c.status === 'Active' && matchClient(c.id))
          .forEach((c) => {
            const list = computeMissingDocsForClient(c, documents, targetFY);
            list
              .filter((item) => item.state !== 'Received')
              .forEach((item) => {
                rows.push([
                  c.clientCode,
                  c.name,
                  item.category,
                  targetFY,
                  item.state,
                  employees.find((e) => e.id === c.assignedEmployeeId)?.name || '—',
                ]);
              });
          });
        return {
          headers: ['Code', 'Client', 'Required Document', 'FY', 'State', 'Assigned Staff'],
          rows,
          chart: [
            { label: 'Missing', primary: rows.filter((r) => r[4] === 'Missing').length },
            { label: 'Pending Review', primary: rows.filter((r) => r[4] === 'Pending').length },
          ],
        };
      }

      case 'document_verification': {
        const docs = documents.filter(
          (d) =>
            matchClient(d.clientId) &&
            (fyFilter === 'All' || d.financialYear === fyFilter) &&
            (!dateFrom || d.uploadDate >= dateFrom)
        );
        return {
          headers: ['Document', 'Client', 'Category', 'FY', 'Upload Date', 'Uploaded By', 'Status'],
          rows: docs.map((d) => [
            d.name,
            clients.find((c) => c.id === d.clientId)?.name || '—',
            d.category,
            d.financialYear,
            d.uploadDate,
            d.uploadedBy,
            d.status,
          ]),
          chart: [
            { label: 'Verified', primary: docs.filter((d) => d.status === 'Verified').length },
            { label: 'Pending', primary: docs.filter((d) => d.status === 'Pending Review' || d.status === 'Uploaded').length },
            { label: 'Rejected/Repl.', primary: docs.filter((d) => d.status === 'Rejected' || d.status === 'Replacement Required').length },
          ],
        };
      }

      case 'compliance_status': {
        const list = complianceTasks.filter(
          (c) => matchClient(c.clientId) && (fyFilter === 'All' || c.financialYear === fyFilter)
        );
        return {
          headers: ['Client', 'Compliance', 'Type', 'FY', 'Due Date', 'Assigned', 'Status'],
          rows: list.map((c) => [
            clients.find((cl) => cl.id === c.clientId)?.name || '—',
            c.title,
            c.type,
            c.financialYear,
            c.dueDate,
            employees.find((e) => e.id === c.assignedEmployeeId)?.name || '—',
            c.status,
          ]),
          chart: [
            { label: 'Completed', primary: list.filter((c) => c.status === 'Completed').length },
            { label: 'Active', primary: list.filter((c) => c.status === 'In Progress' || c.status === 'Under Review').length },
            { label: 'Awaiting', primary: list.filter((c) => c.status === 'Awaiting Documents' || c.status === 'Not Started').length },
            { label: 'Overdue', primary: list.filter((c) => c.status === 'Overdue').length },
          ],
        };
      }

      case 'upcoming_deadlines': {
        const list = complianceTasks
          .filter(
            (c) =>
              c.status !== 'Completed' &&
              matchClient(c.clientId) &&
              (fyFilter === 'All' || c.financialYear === fyFilter)
          )
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        return {
          headers: ['Due Date', 'Client', 'Compliance Task', 'Priority', 'Staff', 'Status'],
          rows: list.map((c) => [
            c.dueDate,
            clients.find((cl) => cl.id === c.clientId)?.name || '—',
            c.title,
            c.priority,
            employees.find((e) => e.id === c.assignedEmployeeId)?.name || '—',
            c.status,
          ]),
          chart: [
            { label: 'Urgent', primary: list.filter((c) => c.priority === 'Urgent').length },
            { label: 'High', primary: list.filter((c) => c.priority === 'High').length },
            { label: 'Medium', primary: list.filter((c) => c.priority === 'Medium').length },
          ],
        };
      }

      case 'overdue_tasks': {
        const list = staffTasks.filter(
          (t) => t.status !== 'Completed' && t.dueDate < '2026-11-18' && matchClient(t.clientId)
        );
        return {
          headers: ['Due Date', 'Task', 'Client', 'Assigned Staff', 'Priority', 'Status'],
          rows: list.map((t) => [
            t.dueDate,
            t.title,
            clients.find((c) => c.id === t.clientId)?.name || '—',
            employees.find((e) => e.id === t.assignedEmployeeId)?.name || '—',
            t.priority,
            t.status,
          ]),
          chart: employees.map((e) => ({
            label: e.name.split(' ').slice(-1)[0],
            primary: list.filter((t) => t.assignedEmployeeId === e.id).length,
          })),
        };
      }

      case 'employee_workload': {
        const rows = employees.map((e) => {
          const assignedClients = clients.filter((c) => c.assignedEmployeeId === e.id).length;
          const openCompliance = complianceTasks.filter(
            (c) => c.assignedEmployeeId === e.id && c.status !== 'Completed'
          ).length;
          const openTasks = staffTasks.filter(
            (t) => t.assignedEmployeeId === e.id && t.status !== 'Completed'
          ).length;
          const completedTasks = staffTasks.filter(
            (t) => t.assignedEmployeeId === e.id && t.status === 'Completed'
          ).length;
          return [
            e.name,
            e.role,
            e.department,
            String(assignedClients),
            String(openCompliance),
            String(openTasks),
            String(completedTasks),
          ];
        });
        return {
          headers: ['Staff Member', 'Role', 'Department', 'Clients', 'Open Compliances', 'Open Tasks', 'Completed'],
          rows,
          chart: employees.map((e) => ({
            label: e.name.split(' ').slice(-1)[0],
            primary: staffTasks.filter((t) => t.assignedEmployeeId === e.id && t.status !== 'Completed').length,
            secondary: complianceTasks.filter((c) => c.assignedEmployeeId === e.id && c.status !== 'Completed').length,
          })),
        };
      }

      case 'client_activity': {
        const list = activities.filter((a) => matchClient(a.clientId));
        return {
          headers: ['Timestamp', 'Actor', 'Action', 'Target', 'Client'],
          rows: list.map((a) => [
            a.timestamp,
            a.actor,
            a.action,
            a.target,
            clients.find((c) => c.id === a.clientId)?.name || 'Firm-wide',
          ]),
          chart: [
            { label: 'Documents', primary: list.filter((a) => a.section === 'documents').length },
            { label: 'Compliance', primary: list.filter((a) => a.section === 'compliance').length },
            { label: 'Tasks', primary: list.filter((a) => a.section === 'tasks').length },
            { label: 'Reminders', primary: list.filter((a) => a.section === 'reminders').length },
          ],
        };
      }

      case 'monthly_performance': {
        const months = [
          { m: 'Jul 2026', docs: 18, filings: 11, tasks: 14 },
          { m: 'Aug 2026', docs: 16, filings: 10, tasks: 12 },
          { m: 'Sep 2026', docs: 21, filings: 14, tasks: 16 },
          { m: 'Oct 2026', docs: 22, filings: 13, tasks: 15 },
          {
            m: 'Nov 2026',
            docs: documents.filter((d) => d.uploadDate.startsWith('2026-11')).length,
            filings: complianceTasks.filter((c) => c.status === 'Completed').length,
            tasks: staffTasks.filter((t) => t.status === 'Completed').length,
          },
        ];
        return {
          headers: ['Month', 'Documents Processed', 'Completed Filings', 'Completed Staff Tasks'],
          rows: months.map((x) => [x.m, String(x.docs), String(x.filings), String(x.tasks)]),
          chart: months.map((x) => ({
            label: x.m.split(' ')[0],
            primary: x.docs,
            secondary: x.filings + x.tasks,
          })),
        };
      }
    }
  }, [
    activeReport,
    clientFilter,
    fyFilter,
    dateFrom,
    clients,
    documents,
    complianceTasks,
    staffTasks,
    employees,
    activities,
    selectedFY,
    settings.preferences.maskSensitiveIds,
  ]);

  const currentMeta = REPORT_LIST.find((r) => r.key === activeReport)!;

  const handleExportCSV = () => {
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvLines = [
      reportData.headers.map(escape).join(','),
      ...reportData.rows.map((row) => row.map(escape).join(',')),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSight_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported', `${currentMeta.title} (${reportData.rows.length} rows)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            Reports &amp; Practice Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Confidential financial identifiers are masked per firm preference · Export CSV or Print
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#081020] border border-[#223559] rounded-lg hover:bg-[#101C33] hover:text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 no-print">
        {REPORT_LIST.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActiveReport(r.key)}
            className={`text-left p-3.5 rounded-xl border transition-colors ${
              activeReport === r.key
                ? 'bg-[#14274A] border-[#2D5194] text-white'
                : 'bg-[#0B1426] border-[#1E2E4E] hover:border-teal-500/50 text-slate-200'
            }`}
          >
            <div className="text-xs font-semibold">{r.title}</div>
            <div
              className={`text-[11px] mt-0.5 ${
                activeReport === r.key ? 'text-teal-300' : 'text-slate-400'
              }`}
            >
              {r.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
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
          value={fyFilter}
          onChange={(e) => setFyFilter(e.target.value as FinancialYear | 'All')}
          className="px-3 py-2 text-xs border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
        >
          <option value="All">All Financial Years</option>
          {settings.availableFinancialYears.map((fy) => (
            <option key={fy}>{fy}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-xs font-mono border border-[#223559] rounded-lg bg-[#081020] text-slate-100 focus:outline-none focus:border-teal-500"
          aria-label="Filter from date"
        />
      </div>

      {/* Report Output */}
      <section className="bg-[#0B1426] border border-[#1E2E4E] print:bg-white print:text-slate-900 print:border-slate-300 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E2E4E] print:border-slate-300">
          <div>
            <h2 className="text-base font-bold text-slate-100 print:text-slate-900 font-display">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600">
              {settings.firmName} · {settings.city}, {settings.state} · {reportData.rows.length} records
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 print:text-slate-600">
            Generated: {new Date().toISOString().slice(0, 10)}
          </span>
        </div>

        <InteractiveBarChart
          data={reportData.chart}
          primaryName="Count / Volume"
          secondaryName="Secondary"
          primaryColor="#3B82F6"
          secondaryColor="#14B8A6"
          height={180}
        />

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E2E4E] bg-[#081020] text-slate-400 print:bg-slate-100 print:text-slate-700 font-semibold">
                {reportData.headers.map((h) => (
                  <th key={h} className="py-2.5 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15223C] print:divide-slate-200">
              {reportData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#101C33] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3 text-slate-200 print:text-slate-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {reportData.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={reportData.headers.length}
                    className="py-8 text-center text-slate-400"
                  >
                    No records match the selected report filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
