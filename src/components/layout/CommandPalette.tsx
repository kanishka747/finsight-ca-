import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
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
  Plus,
  CornerDownLeft,
  Activity,
  Bot,
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { NavSection } from '../../types';

interface CommandItem {
  id: string;
  group: 'Navigation' | 'Quick Actions' | 'Clients' | 'Switch Staff';
  label: string;
  meta?: string;
  icon: React.ComponentType<{ className?: string }>;
  onExecute: () => void;
}

export const CommandPalette: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const {
    clients,
    employees,
    setActiveSection,
    openClientProfile,
    openQuickAdd,
    setCurrentEmployeeId,
    setCopilotOpen,
    addToast,
  } = usePractice();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const navItems: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { id: 'dashboard', label: 'Go to CA Command Centre', icon: LayoutDashboard },
      { id: 'intelligence', label: 'Go to Intelligence, Anomalies & Risk', icon: Activity },
      { id: 'clients', label: 'Go to Client Directory', icon: Users },
      { id: 'documents', label: 'Go to Document Management', icon: FileText },
      { id: 'scanner', label: 'Go to AI Document Scanner', icon: ScanLine },
      { id: 'validation', label: 'Go to Document Validation', icon: ShieldCheck },
      { id: 'compliance', label: 'Go to Compliance Calendar', icon: CalendarClock },
      { id: 'financial', label: 'Go to Financial Overview', icon: IndianRupee },
      { id: 'reminders', label: 'Go to Reminders & Notifications', icon: BellRing },
      { id: 'tasks', label: 'Go to Tasks & Workflow', icon: CheckSquare },
      { id: 'portal', label: 'Preview Client Portal', icon: Building2 },
      { id: 'reports', label: 'Go to Reports & Analytics', icon: BarChart3 },
      { id: 'settings', label: 'Go to Settings', icon: Settings },
    ];

    const quickActions: CommandItem[] = [
      {
        id: 'qa-copilot',
        group: 'Quick Actions',
        label: 'Open FinSight AI Copilot',
        meta: 'Chat & Document Extraction',
        icon: Bot,
        onExecute: () => setCopilotOpen(true),
      },
      {
        id: 'qa-client',
        group: 'Quick Actions',
        label: 'Onboard New Client (Smart Checklist)',
        meta: 'Create client record',
        icon: Plus,
        onExecute: () => openQuickAdd('client'),
      },
      {
        id: 'qa-doc',
        group: 'Quick Actions',
        label: 'Log New Document',
        meta: 'Record upload entry',
        icon: Plus,
        onExecute: () => openQuickAdd('document'),
      },
      {
        id: 'qa-cmp',
        group: 'Quick Actions',
        label: 'Create Compliance Task',
        meta: 'GST / ITR / TDS / ROC',
        icon: Plus,
        onExecute: () => openQuickAdd('compliance'),
      },
      {
        id: 'qa-task',
        group: 'Quick Actions',
        label: 'Assign Staff Task',
        meta: 'Workflow item',
        icon: Plus,
        onExecute: () => openQuickAdd('task'),
      },
    ];

    const clientCommands: CommandItem[] = clients.map((c) => ({
      id: `cli-${c.id}`,
      group: 'Clients',
      label: c.name,
      meta: `${c.clientCode} · ${c.pan}`,
      icon: Users,
      onExecute: () => openClientProfile(c.id),
    }));

    const staffCommands: CommandItem[] = employees.map((e) => ({
      id: `emp-${e.id}`,
      group: 'Switch Staff',
      label: `Switch active user to ${e.name}`,
      meta: e.role,
      icon: Users,
      onExecute: () => {
        setCurrentEmployeeId(e.id);
        addToast('Active staff switched', `${e.name} (${e.role})`, 'info');
      },
    }));

    return [
      ...quickActions,
      ...navItems.map((n) => ({
        id: `nav-${n.id}`,
        group: 'Navigation' as const,
        label: n.label,
        icon: n.icon,
        onExecute: () => setActiveSection(n.id),
      })),
      ...clientCommands,
      ...staffCommands,
    ];
  }, [
    clients,
    employees,
    setActiveSection,
    openClientProfile,
    openQuickAdd,
    setCurrentEmployeeId,
    setCopilotOpen,
    addToast,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          (i.meta && i.meta.toLowerCase().includes(q)) ||
          i.group.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        filtered[activeIndex].onExecute();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, activeIndex, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-[#020611]/80 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="w-full max-w-xl bg-[#0B1426] border border-[#1E2E4E] rounded-xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#192845] bg-[#081020]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to client, PAN, module, Copilot, or quick action..."
            className="flex-1 text-sm bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <span className="text-[11px] font-mono text-slate-400 border border-[#223559] rounded px-1.5 py-0.5">
            ESC
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-[#15233E]">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No commands or records match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    item.onExecute();
                    onClose();
                  }}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-[#132342]' : 'bg-[#0B1426] hover:bg-[#101D36]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-100 truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.group}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.meta && (
                      <span className="text-[11px] font-mono text-slate-400">{item.meta}</span>
                    )}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#081020] border-t border-[#192845] flex items-center justify-between text-[11px] text-slate-400">
          <span>Use ↑ ↓ arrows to navigate · Enter to open</span>
          <span className="font-mono">Ctrl+K / ⌘K</span>
        </div>
      </div>
    </div>
  );
};
