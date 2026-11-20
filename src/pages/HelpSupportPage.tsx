import React from 'react';
import { BookOpen, Shield, Building2, ArrowRight, Bot, Sparkles } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

export const HelpSupportPage: React.FC = () => {
  const { settings, setActiveSection, openCopilotWithPrompt } = usePractice();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-display">
          Help, Workflows &amp; Practice Guide
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Operational reference for {settings.firmName} ({settings.city}, {settings.state})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-3">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-100 font-display">
            End-to-End Document Workflow
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Send a Bank Statement request from Clients or Validation, switch to Client Portal to upload the file as the client, then approve it in Documents to watch all checklists and dashboards update automatically.
          </p>
          <button
            type="button"
            onClick={() => setActiveSection('portal')}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:underline"
          >
            Try Client Portal Flow <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-3">
          <Bot className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-100 font-display">
            FinSight AI Copilot &amp; Verbatim Document Extraction
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ask grounded questions across live clients, overdue GST/TDS/ROC tasks, and staff workload, or upload real invoices/statements (.pdf, .png, .jpg, .csv, .txt) for verbatim extraction without altering figures.
          </p>
          <button
            type="button"
            onClick={() =>
              openCopilotWithPrompt('Which clients currently have missing documents or open anomalies?')
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:underline"
          >
            Launch FinSight AI Copilot <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-3">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-100 font-display">
            Anomaly Detector, Risk Score &amp; Reconciliation
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Inspect cross-document variances (such as invoice vs purchase register mismatches), review dynamic 0–100 Client Compliance Risk Scores, and escalate findings directly into CA staff tasks.
          </p>
          <button
            type="button"
            onClick={() => setActiveSection('intelligence')}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:underline"
          >
            Open Intelligence &amp; Risk Engine <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-sky-400" />
            <Building2 className="w-5 h-5 text-teal-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100 font-display">
            Workspace Persistence &amp; Firm Support Desk
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Workspace changes persist locally in browser storage and can be restored anytime in Settings.
            {' '}
            {settings.firmName} · {settings.address}, {settings.city}, {settings.state} -{' '}
            {settings.pinCode}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs font-mono text-slate-300 space-y-0.5">
              <div>{settings.email}</div>
              <div>{settings.phone}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('settings')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:underline"
            >
              Manage Demo Reset <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
