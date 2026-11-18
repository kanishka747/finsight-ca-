import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  FileUp,
  XCircle,
  CircleDot,
} from 'lucide-react';

export const StatusLabel: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();

  if (
    normalized === 'verified' ||
    normalized === 'completed' ||
    normalized === 'active' ||
    normalized === 'received' ||
    normalized === 'matched' ||
    normalized === 'approved' ||
    normalized === 'resolved' ||
    normalized === 'low risk' ||
    normalized === 'sent (simulated)'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    normalized === 'overdue' ||
    normalized === 'rejected' ||
    normalized === 'critical' ||
    normalized === 'critical risk' ||
    normalized === 'missing'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    normalized === 'pending review' ||
    normalized === 'pending' ||
    normalized === 'awaiting documents' ||
    normalized === 'awaiting client' ||
    normalized === 'replacement required' ||
    normalized === 'correction requested' ||
    normalized === 'warning' ||
    normalized === 'high risk' ||
    normalized === 'flagged for ca review' ||
    normalized === 'potential mismatch' ||
    normalized === 'requires ca review' ||
    normalized === 'sent to client'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    normalized === 'in progress' ||
    normalized === 'under review' ||
    normalized === 'under ca review' ||
    normalized === 'reviewed' ||
    normalized === 'task created' ||
    normalized === 'moderate risk' ||
    normalized === 'scheduled'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (normalized === 'uploaded' || normalized === 'uploaded by client') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 whitespace-nowrap">
        <FileUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (normalized === 'informational') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 whitespace-nowrap">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 whitespace-nowrap">
      <CircleDot className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span>{status}</span>
    </span>
  );
};

export const PriorityLabel: React.FC<{ priority: string }> = ({ priority }) => {
  if (priority === 'Urgent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Urgent</span>
      </span>
    );
  }
  if (priority === 'High') {
    return <span className="text-xs font-semibold text-amber-400 whitespace-nowrap">High</span>;
  }
  if (priority === 'Medium') {
    return <span className="text-xs font-medium text-sky-300 whitespace-nowrap">Medium</span>;
  }
  return <span className="text-xs font-normal text-slate-400 whitespace-nowrap">Low</span>;
};
