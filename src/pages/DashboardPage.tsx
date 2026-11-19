import React, { useMemo, useState } from 'react';
import {
  Users,
  FileCheck2,
  FileWarning,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Bot,
  ShieldAlert,
} from 'lucide-react';
import {
  computeMissingDocsForClient,
  usePractice,
} from '../context/PracticeContext';
import {
  InteractiveAreaTrendChart,
  InteractiveBarChart,
} from '../components/ui/DataCharts';
import { PriorityLabel, StatusLabel } from '../components/ui/StatusText';
import { NavSection } from '../types';

export const DashboardPage: React.FC = () => {
  const {
    clients,
    documents,
    complianceTasks,
    staffTasks,
    docRequests,
    anomalies,
    activities,
    employees,
    selectedFY,
    currentUser,
    setActiveSection,
    openClientProfile,
    openQuickAdd,
    openCopilotWithPrompt,
    computeClientRiskScore,
    settings,
  } = usePractice();

  const [activityFilter, setActivityFilter] = useState<'all' | NavSection>('all');

  const activeClients = useMemo(
    () => clients.filter((c) => c.status === 'Active'),
    [clients]
  );

  const docsAwaitingReview = useMemo(
    () =>
      documents.filter(
        (d) =>
          (d.status === 'Pending Review' || d.status === 'Uploaded') &&
          d.financialYear === selectedFY
      ),
    [documents, selectedFY]
  );

  const missingDocSummary = useMemo(() => {
    let totalMissing = 0;
    const clientsWithPending: {
      clientId: string;
      clientName: string;
      missingCount: number;
      pendingCount: number;
    }[] = [];

    activeClients.forEach((client) => {
      const checklist = computeMissingDocsForClient(client, documents, selectedFY);
      const missingCount = checklist.filter((i) => i.state === 'Missing').length;
      const pendingCount = checklist.filter((i) => i.state === 'Pending').length;
      totalMissing += missingCount;
      if (missingCount > 0 || pendingCount > 0) {
        clientsWithPending.push({
          clientId: client.id,
          clientName: client.name,
          missingCount,
          pendingCount,
        });
      }
    });

    return { totalMissing, clientsWithPending };
  }, [activeClients, documents, selectedFY]);

  const fyCompliance = useMemo(
    () => complianceTasks.filter((c) => c.financialYear === selectedFY),
    [complianceTasks, selectedFY]
  );

  const upcomingDeadlines = useMemo(
    () =>
      fyCompliance
        .filter((c) => c.status !== 'Completed' && c.status !== 'Overdue')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [fyCompliance]
  );

  const overdueCompliance = useMemo(
    () => complianceTasks.filter((c) => c.status === 'Overdue'),
    [complianceTasks]
  );

  const completedCompliance = useMemo(
    () => fyCompliance.filter((c) => c.status === 'Completed'),
    [fyCompliance]
  );

  const overdueStaffTasks = useMemo(
    () =>
      staffTasks.filter(
        (t) => t.status !== 'Completed' && t.dueDate < '2026-11-18'
      ),
    [staffTasks]
  );

  const completedStaffTasks = useMemo(
    () => staffTasks.filter((t) => t.status === 'Completed'),
    [staffTasks]
  );

  const openAnomalies = useMemo(
    () => anomalies.filter((a) => a.status === 'Flagged for CA Review'),
    [anomalies]
  );

  const topRiskClients = useMemo(
    () =>
      activeClients
        .map((c) => ({ client: c, risk: computeClientRiskScore(c.id) }))
        .sort((a, b) => b.risk.score - a.risk.score)
        .slice(0, 4),
    [activeClients, computeClientRiskScore]
  );

  const commandAttentionTotal =
    missingDocSummary.clientsWithPending.filter((c) => c.missingCount > 0).length +
    overdueCompliance.length +
    openAnomalies.length +
    overdueStaffTasks.length;

  const myTasks = useMemo(
    () => staffTasks.filter((t) => t.assignedEmployeeId === currentUser.id),
    [staffTasks, currentUser.id]
  );

  const individualCount = activeClients.filter((c) => c.type === 'Individual').length;
  const businessCount = activeClients.length - individualCount;

  const monthlyTaskChartData = [
    { label: 'Jun', primary: 9, secondary: 14 },
    { label: 'Jul', primary: 11, secondary: 18 },
    { label: 'Aug', primary: 10, secondary: 16 },
    { label: 'Sep', primary: 14, secondary: 21 },
    { label: 'Oct', primary: 13, secondary: 22 },
    {
      label: 'Nov',
      primary: completedStaffTasks.length + completedCompliance.length,
      secondary: documents.filter((d) => d.uploadDate.startsWith('2026-11')).length,
    },
  ];

  const filingVelocityTrend = [
    { label: 'Jun', primary: 12, secondary: 10 },
    { label: 'Jul', primary: 19, secondary: 16 },
    { label: 'Aug', primary: 15, secondary: 14 },
    { label: 'Sep', primary: 24, secondary: 21 },
    { label: 'Oct', primary: 22, secondary: 20 },
    {
      label: 'Nov',
      primary: fyCompliance.length,
      secondary: completedCompliance.length + 14,
    },
  ];

  const staffWorkload = useMemo(() => {
    return employees.map((emp) => {
      const openTasks = staffTasks.filter(
        (t) => t.assignedEmployeeId === emp.id && t.status !== 'Completed'
      ).length;
      const openFilings = complianceTasks.filter(
        (c) => c.assignedEmployeeId === emp.id && c.status !== 'Completed'
      ).length;
      const totalLoad = openTasks + openFilings;
      return {
        emp,
        openTasks,
        openFilings,
        totalLoad,
        pct: Math.min(100, Math.round((totalLoad / 8) * 100)),
      };
    });
  }, [employees, staffTasks, complianceTasks]);

  const clientProgressRows = useMemo(() => {
    return activeClients.slice(0, 6).map((c) => {
      const tasks = complianceTasks.filter((t) => t.clientId === c.id);
      const done = tasks.filter((t) => t.status === 'Completed').length;
      const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 100;
      const checklist = computeMissingDocsForClient(c, documents, selectedFY);
      const received = checklist.filter((i) => i.state === 'Received').length;
      const risk = computeClientRiskScore(c.id);
      return {
        client: c,
        done,
        total: tasks.length,
        pct,
        docsReceived: received,
        docsTotal: checklist.length,
        risk,
      };
    });
  }, [activeClients, complianceTasks, documents, selectedFY, computeClientRiskScore]);

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((a) => activityFilter === 'all' || a.section === activityFilter)
        .slice(0, 6),
    [activities, activityFilter]
  );

  const kpiCards = [
    {
      label: 'Total Active Clients',
      value: activeClients.length,
      sub: `${individualCount} Individual · ${businessCount} Business`,
      icon: Users,
      tone: 'text-sky-400',
      onClick: () => setActiveSection('clients'),
    },
    {
      label: 'Docs Awaiting Review',
      value: docsAwaitingReview.length,
      sub: `${selectedFY} queue`,
      icon: FileCheck2,
      tone: 'text-teal-400',
      onClick: () => setActiveSection('documents'),
    },
    {
      label: 'Missing Documents',
      value: missingDocSummary.totalMissing,
      sub: `${missingDocSummary.clientsWithPending.length} clients pending`,
      icon: FileWarning,
      tone: 'text-amber-400',
      onClick: () => setActiveSection('validation'),
    },
    {
      label: 'Upcoming Deadlines',
      value: upcomingDeadlines.length,
      sub: `${overdueCompliance.length} overdue filings`,
      icon: CalendarClock,
      tone: 'text-indigo-400',
      onClick: () => setActiveSection('compliance'),
    },
    {
      label: 'Overdue Tasks',
      value: overdueStaffTasks.length,
      sub: 'Action required today',
      icon: AlertCircle,
      tone: 'text-rose-400',
      onClick: () => setActiveSection('tasks'),
    },
    {
      label: 'Completed Tasks',
      value: completedStaffTasks.length,
      sub: `${staffTasks.length} total workflow`,
      icon: CheckCircle2,
      tone: 'text-emerald-400',
      onClick: () => setActiveSection('tasks'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-display">
            CA Command Centre — {settings.firmName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings.city}, {settings.state} · {selectedFY} · Press{' '}
            <span className="font-mono text-teal-400">⌘K</span> for instant navigation
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => openQuickAdd('document')}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0B1426] border border-[#223559] rounded-lg hover:bg-[#13223D] transition-colors whitespace-nowrap"
          >
            Log Document
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('intelligence')}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0B1426] border border-[#223559] rounded-lg hover:bg-[#13223D] transition-colors whitespace-nowrap"
          >
            Anomalies & Risk
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('portal')}
            className="px-3.5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap"
          >
            Preview Client Portal
          </button>
        </div>
      </div>

      {/* CA Command Centre Morning Briefing */}
      <section className="bg-[#0B1528] border border-[#20365E] rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-teal-400">
              Proactive Daily Briefing · {currentUser.name}
            </div>
            <h2 className="text-base font-bold text-slate-100 font-display mt-0.5">
              Good morning. There are {commandAttentionTotal} priority items requiring CA attention today.
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              openCopilotWithPrompt(
                'Give me an executive action plan for today based on overdue filings, missing bank statements, anomalies, and staff workload.'
              )
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-teal-200 bg-[#102446] hover:bg-[#163160] border border-teal-500/40 rounded-lg transition-colors whitespace-nowrap self-start lg:self-auto"
          >
            <Bot className="w-4 h-4 text-teal-400" />
            Brief Me with AI Copilot
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveSection('clients')}
            className="text-left p-3.5 rounded-lg bg-[#070E1C] border border-[#1B2B4A] hover:border-amber-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Missing Client Docs</span>
              <span className="font-mono text-sm">
                {missingDocSummary.clientsWithPending.filter((c) => c.missingCount > 0).length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Clients missing mandatory FY documents ({missingDocSummary.totalMissing} total items)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('compliance')}
            className="text-left p-3.5 rounded-lg bg-[#070E1C] border border-[#1B2B4A] hover:border-rose-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
              <span>Overdue / Due Filings</span>
              <span className="font-mono text-sm">
                {overdueCompliance.length + upcomingDeadlines.slice(0, 3).length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overdueCompliance.length} overdue statutory returns + urgent GSTR-3B filings
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('intelligence')}
            className="text-left p-3.5 rounded-lg bg-[#070E1C] border border-[#1B2B4A] hover:border-teal-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Financial Anomalies</span>
              <span className="font-mono text-sm">{openAnomalies.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cross-document invoice variances & GST/cash flags awaiting review
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('tasks')}
            className="text-left p-3.5 rounded-lg bg-[#070E1C] border border-[#1B2B4A] hover:border-sky-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
              <span>Overdue Staff Tasks</span>
              <span className="font-mono text-sm">{overdueStaffTasks.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Workflow bottlenecks requiring partner or senior CA escalation
            </p>
          </button>
        </div>
      </section>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left bg-[#0B1426] border border-[#1B2A47] rounded-xl p-4 hover:border-teal-500/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.tone} shrink-0`} />
              </div>
              <div className={`text-2xl font-bold font-mono tabular-nums mt-2 ${card.tone}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span className="truncate">{card.sub}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Compliance Overview + High-Risk Clients + Task Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#172540]">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display">
                Compliance Overview
              </h2>
              <p className="text-xs text-slate-400">
                {upcomingDeadlines.length} upcoming · {overdueCompliance.length} overdue ·{' '}
                {completedCompliance.length} completed ·{' '}
                {docRequests.filter((r) => r.status !== 'Verified').length} pending submissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('compliance')}
              className="text-xs font-medium text-teal-400 hover:text-teal-300 whitespace-nowrap"
            >
              Calendar
            </button>
          </div>

          <div className="divide-y divide-[#15233E] mt-2 flex-1">
            {[...overdueCompliance, ...upcomingDeadlines].slice(0, 5).map((item) => {
              const client = clients.find((c) => c.id === item.clientId);
              const staff = employees.find((e) => e.id === item.assignedEmployeeId);
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveSection('compliance')}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#101C33] -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                      <span>{client?.name}</span>
                      <span>·</span>
                      <span>{staff?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-slate-400 hidden sm:inline">
                      {item.dueDate}
                    </span>
                    <StatusLabel status={item.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Client Compliance Risk Watchlist */}
        <section className="lg:col-span-3 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#172540]">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Client Risk Scores
              </h2>
              <p className="text-xs text-slate-400">Live compliance exposure</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('intelligence')}
              className="text-xs font-medium text-teal-400 hover:text-teal-300"
            >
              Matrix
            </button>
          </div>

          <div className="space-y-3 mt-3 flex-1">
            {topRiskClients.map(({ client, risk }) => {
              const barCls =
                risk.score >= 70
                  ? 'bg-rose-500'
                  : risk.score >= 45
                  ? 'bg-amber-500'
                  : 'bg-sky-400';
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => openClientProfile(client.id)}
                  className="w-full text-left p-2.5 rounded-lg bg-[#081020] border border-[#172540] hover:border-teal-500/50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-100 truncate">{client.name}</span>
                    <span className="font-mono font-bold text-slate-100 shrink-0">
                      {risk.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#121F38] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barCls}`} style={{ width: `${risk.score}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <StatusLabel status={risk.level} />
                    <span className="text-slate-400 truncate ml-2">
                      {risk.factors[0]?.label || 'Healthy'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Task Overview */}
        <section className="lg:col-span-4 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#172540]">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display">
                Task Overview
              </h2>
              <p className="text-xs text-slate-400">
                {myTasks.length} assigned to {currentUser.name.split(' ')[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('tasks')}
              className="text-xs font-medium text-teal-400 hover:text-teal-300 whitespace-nowrap"
            >
              Open Board
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 py-3 border-b border-[#172540] text-center">
            {[
              { label: 'Mine', val: myTasks.length },
              {
                label: 'Pending',
                val: staffTasks.filter(
                  (t) => t.status === 'Not Started' || t.status === 'Awaiting Client'
                ).length,
              },
              {
                label: 'Active',
                val: staffTasks.filter(
                  (t) => t.status === 'In Progress' || t.status === 'Under Review'
                ).length,
              },
              { label: 'Done', val: completedStaffTasks.length },
            ].map((s) => (
              <div key={s.label} className="py-1">
                <div className="text-base font-bold font-mono tabular-nums text-slate-100">
                  {s.val}
                </div>
                <div className="text-[11px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="divide-y divide-[#15233E] mt-1 flex-1">
            {staffTasks
              .filter((t) => t.status !== 'Completed')
              .slice(0, 4)
              .map((task) => {
                const client = clients.find((c) => c.id === task.clientId);
                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveSection('tasks')}
                    className="py-2.5 flex items-center justify-between gap-2 hover:bg-[#101C33] -mx-2 px-2 rounded-lg cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-100 truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{client?.name}</span>
                        <span>·</span>
                        <PriorityLabel priority={task.priority} />
                      </div>
                    </div>
                    <StatusLabel status={task.status} />
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display">
                Task & Document Volume
              </h2>
              <p className="text-xs text-slate-400">{selectedFY} monthly cadence</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('reports')}
              className="text-xs font-medium text-teal-400 hover:underline whitespace-nowrap"
            >
              Reports
            </button>
          </div>
          <InteractiveBarChart
            data={monthlyTaskChartData}
            primaryName="Completed"
            secondaryName="Uploads"
            primaryColor="#3B82F6"
            secondaryColor="#14B8A6"
            height={195}
          />
        </section>

        <section className="lg:col-span-4 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100 font-display">
              Filing Velocity Trend
            </h2>
            <p className="text-xs text-slate-400">Scheduled vs. completed compliance filings</p>
          </div>
          <InteractiveAreaTrendChart
            data={filingVelocityTrend}
            primaryName="Scheduled"
            secondaryName="Completed"
            primaryColor="#38BDF8"
            secondaryColor="#14B8A6"
            height={195}
          />
        </section>

        <section className="lg:col-span-4 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display">
                Team Workload Capacity
              </h2>
              <p className="text-xs text-slate-400">Open tasks & filings per staff</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('reports')}
              className="text-xs font-medium text-teal-400 hover:underline whitespace-nowrap"
            >
              Details
            </button>
          </div>

          <div className="space-y-3 mt-2">
            {staffWorkload.map(({ emp, openTasks, openFilings, totalLoad, pct }) => (
              <div key={emp.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200 truncate">{emp.name}</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                    {openTasks}t · {openFilings}f ({totalLoad})
                  </span>
                </div>
                <div className="h-1.5 bg-[#081020] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 75 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Client Progress + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#172540]">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display">
                Client-wise Compliance & Risk Progress
              </h2>
              <p className="text-xs text-slate-400">
                Click any client row to inspect profile, checklist & audit trail
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('clients')}
              className="text-xs font-medium text-teal-400 hover:text-teal-300 whitespace-nowrap"
            >
              All Clients
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#172540] text-[11px] font-semibold text-slate-400">
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 px-3 text-right">Docs Ready</th>
                  <th className="py-2 px-3 text-right">Risk Score</th>
                  <th className="py-2 pl-3 w-28">Filings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15233E] text-xs">
                {clientProgressRows.map(({ client, pct, docsReceived, docsTotal, risk }) => (
                  <tr
                    key={client.id}
                    onClick={() => openClientProfile(client.id)}
                    className="hover:bg-[#101C33] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-slate-100">{client.name}</div>
                      <div className="text-[11px] text-slate-400">{client.type}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                      {docsReceived}/{docsTotal}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span
                        className={
                          risk.score >= 70
                            ? 'text-rose-400 font-semibold'
                            : risk.score >= 45
                            ? 'text-amber-400 font-semibold'
                            : 'text-emerald-400'
                        }
                      >
                        {risk.score}/100
                      </span>
                    </td>
                    <td className="py-2.5 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#081020] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-slate-300 w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-6 bg-[#0B1426] border border-[#1B2A47] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#172540]">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 font-display">
                Recent Practice Activity & Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Synchronized across documents, compliance & client requests
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-[#081020] border border-[#172540] rounded-lg">
              {(
                [
                  ['all', 'All'],
                  ['documents', 'Docs'],
                  ['compliance', 'Filings'],
                  ['tasks', 'Tasks'],
                ] as ['all' | NavSection, string][]
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActivityFilter(k)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md ${
                    activityFilter === k
                      ? 'bg-[#14274A] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-[#15233E] mt-1">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  if (act.clientId && act.section === 'clients') {
                    openClientProfile(act.clientId);
                  } else {
                    setActiveSection(act.section);
                  }
                }}
                className="py-2.5 flex items-start justify-between gap-3 hover:bg-[#101C33] -mx-2 px-2 rounded-lg cursor-pointer"
              >
                <div className="text-xs text-slate-300 min-w-0">
                  <span className="font-semibold text-slate-100">{act.actor}</span>{' '}
                  <span>{act.action}</span>{' '}
                  <span className="font-medium text-teal-400">{act.target}</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
