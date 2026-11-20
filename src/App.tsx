import React, { useEffect, useState } from 'react';
import { PracticeProvider, usePractice } from './context/PracticeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { CommandPalette } from './components/layout/CommandPalette';
import { FinSightCopilotDrawer } from './components/copilot/FinSightCopilotDrawer';
import { ToastContainer } from './components/ui/ToastContainer';
import { Modal } from './components/ui/Modal';

import { DashboardPage } from './pages/DashboardPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { ClientsPage } from './pages/ClientsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AiScannerPage } from './pages/AiScannerPage';
import { ValidationPage } from './pages/ValidationPage';
import { CompliancePage } from './pages/CompliancePage';
import { FinancialOverviewPage } from './pages/FinancialOverviewPage';
import { RemindersPage } from './pages/RemindersPage';
import { TasksPage } from './pages/TasksPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpSupportPage } from './pages/HelpSupportPage';

const AppShell: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    currentUser,
    employees,
    setCurrentEmployeeId,
    demoLocked,
    unlockDemoSession,
    settings,
  } = usePractice();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  if (demoLocked) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-teal-600 text-white font-display font-bold flex items-center justify-center">
              FS
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-100 font-display">FinSight</h1>
              <p className="text-xs text-slate-400">
                {settings.firmName} · {settings.city}, {settings.state}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Session locked. Select a staff profile below to resume the FinSight workspace.
          </p>

          <div className="space-y-2">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  setCurrentEmployeeId(emp.id);
                  unlockDemoSession();
                }}
                className="w-full px-3.5 py-2.5 text-left bg-[#081020] border border-[#1D2D4C] rounded-lg hover:border-teal-500 hover:bg-[#111E38] flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-100">{emp.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {emp.role} · {emp.department}
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-400">Resume</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPage />;
      case 'intelligence':
        return <IntelligencePage />;
      case 'clients':
        return <ClientsPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'scanner':
        return <AiScannerPage />;
      case 'validation':
        return <ValidationPage />;
      case 'compliance':
        return <CompliancePage />;
      case 'financial':
        return <FinancialOverviewPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'tasks':
        return <TasksPage />;
      case 'portal':
        return <ClientPortalPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpSupportPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050A14] text-slate-100">
      <Sidebar onOpenProfileModal={() => setProfileModalOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {renderPage()}
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <FinSightCopilotDrawer />
      <QuickAddModal />
      <ToastContainer />

      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title={currentUser.name}
        subtitle={`${currentUser.role} · ${currentUser.department}`}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <dl className="grid grid-cols-2 gap-3 bg-[#081020] p-4 rounded-xl border border-[#1E2E4E]">
            <div>
              <dt className="text-slate-400">Firm</dt>
              <dd className="font-semibold text-slate-100 mt-0.5">{settings.firmName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Location</dt>
              <dd className="font-medium text-slate-100 mt-0.5">
                {settings.city}, {settings.state}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="font-medium text-slate-100 mt-0.5 break-all">{currentUser.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Phone</dt>
              <dd className="font-mono text-slate-100 mt-0.5">{currentUser.phone}</dd>
            </div>
          </dl>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setProfileModalOpen(false);
                setActiveSection('settings');
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
            >
              Edit in Settings
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function App() {
  return (
    <PracticeProvider>
      <AppShell />
    </PracticeProvider>
  );
}
