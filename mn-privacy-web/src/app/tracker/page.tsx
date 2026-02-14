'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { TrackedRequest, RequestStatus, REQUEST_TYPES } from '@/lib/types';
import {
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
  getUpcomingDeadlines,
  getOverdueRequests,
  exportData,
  importData,
  clearAllData,
} from '@/lib/storage';
import { format, differenceInDays, isPast } from 'date-fns';

const STATUS_LABELS: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'tag status-warning' },
  acknowledged: { label: 'Acknowledged', className: 'tag' },
  completed: { label: 'Completed', className: 'tag status-active' },
  denied: { label: 'Denied', className: 'tag status-error' },
  'no-response': { label: 'No Response', className: 'tag status-error' },
  appealed: { label: 'Appealed', className: 'tag' },
};

type FilterStatus = RequestStatus | 'all' | 'overdue';

export default function TrackerPage() {
  const [requests, setRequests] = useState<TrackedRequest[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<TrackedRequest[]>([]);
  const [overdueRequests, setOverdueRequests] = useState<TrackedRequest[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, upcoming, overdue] = await Promise.all([
        getAllRequests(),
        getUpcomingDeadlines(7),
        getOverdueRequests(),
      ]);
      setRequests(all);
      setUpcomingDeadlines(upcoming);
      setOverdueRequests(overdue);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    await updateRequestStatus(id, status);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      await deleteRequest(id);
      await loadData();
    }
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mn-privacy-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const { imported, errors } = await importData(text);
        if (errors.length > 0) {
          alert(`Imported ${imported} requests with ${errors.length} errors:\n${errors.join('\n')}`);
        } else {
          alert(`Successfully imported ${imported} requests.`);
        }
        await loadData();
      }
    };
    input.click();
  };

  const handleClearAllData = async () => {
    if (!confirm('This will remove all saved requests and info from this browser. Continue?')) {
      return;
    }
    await clearAllData();
    await loadData();
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') {
      return (req.status === 'pending' || req.status === 'acknowledged') && isPast(new Date(req.deadline));
    }
    return req.status === filter;
  });

  const getDeadlineDisplay = (deadline: string, status: RequestStatus) => {
    const deadlineDate = new Date(deadline);
    const daysLeft = differenceInDays(deadlineDate, new Date());

    if (status === 'completed' || status === 'denied') {
      return <span className="text-[var(--muted)]">—</span>;
    }

    if (daysLeft < 0) {
      return (
        <span className="font-mono text-xs font-bold text-[var(--error)]">
          {Math.abs(daysLeft)} days overdue
        </span>
      );
    }

    if (daysLeft <= 7) {
      return (
        <span className="font-mono text-xs font-bold text-[var(--warning)]">
          {daysLeft} days left
        </span>
      );
    }

    return (
      <span className="font-mono text-xs text-[var(--muted)]">
        {daysLeft} days left
      </span>
    );
  };

  const FILTER_OPTIONS: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'acknowledged', label: 'Acknowledged' },
    { id: 'completed', label: 'Completed' },
    { id: 'denied', label: 'Denied' },
    { id: 'no-response', label: 'No Response' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'appealed', label: 'Appealed' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              [TRACKER]
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-[var(--foreground)]">
              Request Tracker
            </h1>
          </div>
          <Link
            href="/generator"
            className="btn-primary px-4 py-2"
          >
            + New Request
          </Link>
        </div>

        {/* Alerts */}
        {overdueRequests.length > 0 && (
          <div className="mb-6 border-2 border-[var(--error)] bg-[var(--error-bg)] p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--error)]">
              [{overdueRequests.length} OVERDUE]
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              These companies have exceeded the 45-day response deadline. Consider filing a complaint with the{' '}
              <a
                href="https://www.ag.state.mn.us/Data-Privacy/Complaint/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--error)] underline"
              >
                Minnesota Attorney General
              </a>.
            </p>
          </div>
        )}

        {upcomingDeadlines.length > 0 && (
          <div className="mb-6 border-2 border-[var(--warning)] bg-[var(--warning-bg)] p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--warning)]">
              [{upcomingDeadlines.length} DEADLINE{upcomingDeadlines.length !== 1 ? 'S' : ''} WITHIN 7 DAYS]
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
              {upcomingDeadlines.slice(0, 3).map((req) => (
                <li key={req.id} className="flex gap-2">
                  <span className="font-mono">—</span>
                  <span><strong>{req.brokerName}</strong> — {format(new Date(req.deadline), 'MMM d, yyyy')}</span>
                </li>
              ))}
              {upcomingDeadlines.length > 3 && (
                <li className="text-[var(--muted)]">and {upcomingDeadlines.length - 3} more...</li>
              )}
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="card p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Total</p>
            <p className="mt-1 text-2xl font-black text-[var(--foreground)]">{requests.length}</p>
          </div>
          <div className="card p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Pending</p>
            <p className="mt-1 text-2xl font-black text-[var(--warning)]">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="card p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Completed</p>
            <p className="mt-1 text-2xl font-black text-[var(--success)]">{requests.filter(r => r.status === 'completed').length}</p>
          </div>
          <div className="card p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Overdue</p>
            <p className="mt-1 text-2xl font-black text-[var(--error)]">{overdueRequests.length}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter requests by status">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={`border-2 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
                  filter === option.id
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Export
            </button>
            <button
              onClick={handleImport}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Import
            </button>
            <button
              onClick={handleClearAllData}
              className="border-2 border-[var(--error)] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--error)] transition-colors hover:bg-[var(--error-bg)]"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="py-12 text-center text-[var(--muted)]">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[var(--muted)]">
              {requests.length === 0
                ? 'No requests tracked yet. Generate some letters to get started!'
                : 'No requests match the current filter.'}
            </p>
            {requests.length === 0 && (
              <Link
                href="/generator"
                className="btn-primary mt-4 inline-block px-4 py-2"
              >
                Create Requests
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="card p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold uppercase tracking-tight text-[var(--foreground)]">
                        {req.brokerName}
                      </h3>
                      <span className={STATUS_LABELS[req.status].className}>
                        {STATUS_LABELS[req.status].label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {req.requestTypes.map((type) => {
                        const info = REQUEST_TYPES.find(rt => rt.id === type);
                        return (
                          <span
                            key={type}
                            className="border border-[var(--secondary)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--muted)]"
                          >
                            {info?.name || type}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                      <span>Sent: {format(new Date(req.dateSent), 'MMM d, yyyy')}</span>
                      <span>Deadline: {format(new Date(req.deadline), 'MMM d, yyyy')}</span>
                      <span>{getDeadlineDisplay(req.deadline, req.status)}</span>
                    </div>
                    {req.notes && (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        Notes: {req.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                      className="border-2 border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
                      aria-label={`Change status for ${req.brokerName}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="completed">Completed</option>
                      <option value="denied">Denied</option>
                      <option value="no-response">No Response</option>
                      <option value="appealed">Appealed</option>
                    </select>
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="border-2 border-[var(--border)] p-1 text-[var(--muted)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
                      title="Delete"
                      aria-label={`Delete request for ${req.brokerName}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
