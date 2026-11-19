import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  ChevronDown,
  Check,
  Users,
  FileText,
  CalendarClock,
  CheckSquare,
  Bot,
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { FinancialYear, NavSection } from '../../types';

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'CA Command Centre',
  intelligence: 'Intelligence, Anomalies & Risk',
  clients: 'Clients',
  documents: 'Document Management',
  scanner: 'AI Document Scanner',
  validation: 'Document Validation',
  compliance: 'Compliance Calendar',
  financial: 'Financial Overview',
  reminders: 'Reminders & Notifications',
  tasks: 'Tasks & Workflow',
  portal: 'Client Portal (Demo Preview)',
  reports: 'Reports & Analytics',
  settings: 'Settings',
  help: 'Help & Support',
};

export const Topbar: React.FC<{
  onOpenProfileModal: () => void;
  onOpenCommandPalette: () => void;
}> = ({ onOpenProfileModal, onOpenCommandPalette }) => {
  const {
    activeSection,
    setActiveSection,
    selectedClientId,
    openClientProfile,
    setMobileMenuOpen,
    selectedFY,
    setSelectedFY,
    settings,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    openQuickAdd,
    setCopilotOpen,
    currentUser,
    employees,
    setCurrentEmployeeId,
    clients,
    documents,
    complianceTasks,
    staffTasks,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = usePractice();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeClientName = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)?.name
    : null;

  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return null;
    return {
      clients: clients
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.pan.toLowerCase().includes(q) ||
            (c.gstin && c.gstin.toLowerCase().includes(q)) ||
            c.clientCode.toLowerCase().includes(q)
        )
        .slice(0, 4),
      documents: documents
        .filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q)
        )
        .slice(0, 4),
      compliance: complianceTasks
        .filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q)
        )
        .slice(0, 3),
      tasks: staffTasks
        .filter((t) => t.title.toLowerCase().includes(q))
        .slice(0, 3),
    };
  }, [globalSearchQuery, clients, documents, complianceTasks, staffTasks]);

  const hasAnyResults =
    searchResults &&
    (searchResults.clients.length > 0 ||
      searchResults.documents.length > 0 ||
      searchResults.compliance.length > 0 ||
      searchResults.tasks.length > 0);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#070E1C]/95 backdrop-blur-md border-b border-[#16233B] px-4 lg:px-6 flex items-center justify-between gap-3 shrink-0">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-[#111E36]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="text-slate-400 hover:text-slate-100 font-medium whitespace-nowrap hidden sm:inline"
          >
            FinSight
          </button>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <button
            type="button"
            onClick={() => {
              if (activeSection === 'clients' && selectedClientId) {
                setActiveSection('clients');
              }
            }}
            className={`font-medium truncate whitespace-nowrap ${
              activeClientName
                ? 'text-slate-400 hover:text-slate-100'
                : 'text-slate-100'
            }`}
          >
            {SECTION_TITLES[activeSection]}
          </button>
          {activeClientName && (
            <>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-teal-400 truncate max-w-[180px]">
                {activeClientName}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search client, PAN, GSTIN, document, task..."
            className="w-full pl-9 pr-14 py-1.5 text-sm bg-[#0B1426] border border-[#1E2E4E] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:bg-[#0E1A31] focus:border-teal-500 transition-colors"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Ctrl+K / Cmd+K)"
            className="absolute right-2 px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-[#111F38] border border-[#223559] rounded hover:border-teal-500 hover:text-slate-100 transition-colors"
          >
            ⌘K
          </button>
        </div>

        {searchFocused && globalSearchQuery.trim() && (
          <div className="absolute left-0 right-0 mt-1.5 bg-[#0B1426] border border-[#1E2E4E] rounded-xl shadow-2xl py-2 z-50 max-h-96 overflow-y-auto">
            {!hasAnyResults ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                No matching records for &ldquo;{globalSearchQuery}&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-[#172540]">
                {searchResults!.clients.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-500">
                      Clients
                    </div>
                    {searchResults!.clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          openClientProfile(c.id);
                          setSearchFocused(false);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#12203B] flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-100 truncate">
                          <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {c.pan}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults!.documents.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-500">
                      Documents
                    </div>
                    {searchResults!.documents.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setActiveSection('documents');
                          setSearchFocused(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#12203B] flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-200 truncate">
                          <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{d.name}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">{d.status}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults!.compliance.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-500">
                      Compliance
                    </div>
                    {searchResults!.compliance.map((cmp) => (
                      <button
                        key={cmp.id}
                        type="button"
                        onClick={() => {
                          setActiveSection('compliance');
                          setSearchFocused(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#12203B] flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-200 truncate">
                          <CalendarClock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{cmp.title}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {cmp.dueDate}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults!.tasks.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-500">
                      Staff Tasks
                    </div>
                    {searchResults!.tasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setActiveSection('tasks');
                          setSearchFocused(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#12203B] flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-200 truncate">
                          <CheckSquare className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{t.title}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">{t.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Financial Year Selector */}
        <div className="flex items-center">
          <label htmlFor="fy-select" className="sr-only">
            Financial Year
          </label>
          <select
            id="fy-select"
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value as FinancialYear)}
            className="text-xs font-medium font-mono text-slate-200 bg-[#0B1426] border border-[#1E2E4E] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            {settings.availableFinancialYears.map((fy) => (
              <option key={fy} value={fy}>
                {fy}
              </option>
            ))}
          </select>
        </div>

        {/* AI Copilot */}
        <button
          type="button"
          onClick={() => setCopilotOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102342] hover:bg-[#16305A] border border-teal-500/40 text-teal-300 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Quick Add */}
        <button
          type="button"
          onClick={() => openQuickAdd()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quick Add</span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:bg-[#111F38] hover:text-white transition-colors"
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono tabular-nums font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1426] border border-[#1E2E4E] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#192845] flex items-center justify-between bg-[#081020]">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
                  <p className="text-[11px] text-slate-400">
                    {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#172540]">
                {notifications.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id, true);
                      if (n.linkSection) setActiveSection(n.linkSection);
                      setNotifOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#12203B] transition-colors ${
                      n.read ? 'bg-[#0B1426]' : 'bg-[#0F203D]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-100 leading-snug">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="text-[10px] font-semibold text-teal-400 shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                      {n.timestamp}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-[#192845] bg-[#081020]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('reminders');
                    setNotifOpen(false);
                  }}
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 w-full text-center"
                >
                  Open Reminders & Notifications Center
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Demo Staff Switcher */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#111F38] transition-colors"
          >
            <span className="w-7 h-7 rounded-md bg-[#16305A] border border-[#284E8C] text-teal-300 text-xs font-semibold flex items-center justify-center shrink-0">
              {currentUser.avatarInitials}
            </span>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-100 leading-tight whitespace-nowrap">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight whitespace-nowrap">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0B1426] border border-[#1E2E4E] rounded-xl shadow-2xl z-50 py-2">
              <div className="px-3 py-2 border-b border-[#192845]">
                <div className="text-xs font-semibold text-slate-100">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400">
                  {currentUser.role} · {currentUser.department}
                </div>
              </div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                Switch Active Staff (Demo)
              </div>
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    setCurrentEmployeeId(emp.id);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#12203B] flex items-center justify-between"
                >
                  <span className="text-slate-200 font-medium">{emp.name}</span>
                  <span className="text-[11px] text-slate-400">{emp.role}</span>
                </button>
              ))}
              <div className="border-t border-[#192845] mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-teal-400 hover:bg-[#12203B]"
                >
                  View Profile & Session Info
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
