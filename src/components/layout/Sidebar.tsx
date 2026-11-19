import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  ScanLine,
  ShieldCheck,
  CalendarClock,
  IndianRupee,
  BellRing,
  CheckSquare,
  Building2,
  BarChart3,
  Settings,
  HelpCircle,
  UserCircle2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  Bot,
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { NavSection } from '../../types';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export const Sidebar: React.FC<{ onOpenProfileModal: () => void }> = ({
  onOpenProfileModal,
}) => {
  const {
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    notifications,
    documents,
    validationIssues,
    anomalies,
    currentUser,
    settings,
    logoutDemoSession,
    setCopilotOpen,
  } = usePractice();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingReviewDocs = documents.filter(
    (d) => d.status === 'Pending Review' || d.status === 'Uploaded'
  ).length;
  const openIssuesCount = validationIssues.filter((v) => v.status === 'Open').length;
  const openAnomaliesCount = anomalies.filter(
    (a) => a.status === 'Flagged for CA Review'
  ).length;

  const mainNav: NavItem[] = [
    { id: 'dashboard', label: 'Command Centre', icon: LayoutDashboard },
    {
      id: 'intelligence',
      label: 'Intelligence & Risk',
      icon: Activity,
      badgeCount: openAnomaliesCount,
    },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText, badgeCount: pendingReviewDocs },
    { id: 'scanner', label: 'AI Document Scanner', icon: ScanLine },
    { id: 'validation', label: 'Document Validation', icon: ShieldCheck, badgeCount: openIssuesCount },
    { id: 'compliance', label: 'Compliance Calendar', icon: CalendarClock },
    { id: 'financial', label: 'Financial Overview', icon: IndianRupee },
    { id: 'reminders', label: 'Reminders & Alerts', icon: BellRing, badgeCount: unreadCount },
    { id: 'tasks', label: 'Tasks & Workflow', icon: CheckSquare },
    { id: 'portal', label: 'Client Portal', icon: Building2 },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveSection(item.id)}
        title={sidebarCollapsed ? item.label : undefined}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
          isActive
            ? 'bg-[#12264A] text-white border border-[#24437A]'
            : 'text-slate-300 hover:text-white hover:bg-[#0E1A30] border border-transparent'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
        </span>
        {!sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
          <span className="text-[11px] font-mono tabular-nums text-teal-400 shrink-0">
            {item.badgeCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#020611]/70 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#060C18] text-slate-100 flex flex-col border-r border-[#16233B] transition-all duration-200 shrink-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[#16233B] shrink-0">
          {!sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setActiveSection('dashboard')}
              className="text-left min-w-0"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
                  FS
                </span>
                <div className="min-w-0">
                  <div className="font-display font-bold text-base tracking-tight text-white leading-tight truncate">
                    FinSight
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {settings.firmName} · Jaipur
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSection('dashboard')}
              className="w-8 h-8 mx-auto rounded-md bg-teal-600 flex items-center justify-center text-white font-display font-bold text-sm"
              title="FinSight — A Y & COMPANY"
            >
              FS
            </button>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#111F38] transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copilot Shortcut */}
        <div className="px-3 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCopilotOpen(true);
              setMobileMenuOpen(false);
            }}
            title={sidebarCollapsed ? 'Open FinSight AI Copilot' : undefined}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0E1E3A] hover:bg-[#142950] border border-teal-500/35 text-teal-300 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Bot className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>FinSight AI Copilot</span>}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {mainNav.map(renderNavButton)}
        </nav>

        {/* Bottom Sidebar Controls */}
        <div className="px-3 py-3 border-t border-[#16233B] space-y-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('settings')}
            title={sidebarCollapsed ? 'Settings' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeSection === 'settings'
                ? 'bg-[#12264A] text-white'
                : 'text-slate-300 hover:text-white hover:bg-[#0E1A30]'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('help')}
            title={sidebarCollapsed ? 'Help & Support' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeSection === 'help'
                ? 'bg-[#12264A] text-white'
                : 'text-slate-300 hover:text-white hover:bg-[#0E1A30]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span>Help & Support</span>}
          </button>

          <button
            type="button"
            onClick={onOpenProfileModal}
            title={sidebarCollapsed ? currentUser.name : undefined}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-300 hover:text-white hover:bg-[#0E1A30] transition-colors whitespace-nowrap"
          >
            <UserCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            {!sidebarCollapsed && (
              <span className="truncate text-left flex-1">{currentUser.name}</span>
            )}
          </button>

          <button
            type="button"
            onClick={logoutDemoSession}
            title={sidebarCollapsed ? 'Logout (Demo)' : undefined}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-rose-300 hover:bg-[#0E1A30] transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
