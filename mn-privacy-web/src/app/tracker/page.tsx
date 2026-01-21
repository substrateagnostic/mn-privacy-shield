'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

const STATUS_LABELS: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  acknowledged: { label: 'Acknowledged', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  'no-response': { label: 'No Response', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  appealed: { label: 'Appealed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
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
      return <span className="text-zinc-500">—</span>;
    }

    if (daysLeft < 0) {
      return (
        <span className="font-medium text-red-600 dark:text-red-400">
          {Math.abs(daysLeft)} days overdue
        </span>
      );
    }

    if (daysLeft <= 7) {
      return (
        <span className="font-medium text-orange-600 dark:text-orange-400">
          {daysLeft} days left
        </span>
      );
    }

    return (
      <span className="text-zinc-600 dark:text-zinc-400">
        {daysLeft} days left
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            MN Privacy Shield
          </Link>
          <Link
            href="/generator"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Request
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Request Tracker
        </h1>

        {/* Alerts */}
        {overdueRequests.length > 0 && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <h2 className="font-semibold text-red-800 dark:text-red-400">
              {overdueRequests.length} Overdue Request{overdueRequests.length !== 1 ? 's' : ''}
            </h2>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              These companies have exceeded the 45-day response deadline. Consider filing a complaint with the{' '}
              <a
                href="https://www.ag.state.mn.us/Data-Privacy/Complaint/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                Minnesota Attorney General
              </a>.
            </p>
          </div>
        )}

        {upcomingDeadlines.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
            <h2 className="font-semibold text-yellow-800 dark:text-yellow-400">
              {upcomingDeadlines.length} Deadline{upcomingDeadlines.length !== 1 ? 's' : ''} Within 7 Days
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
              {upcomingDeadlines.slice(0, 3).map((req) => (
                <li key={req.id}>
                  <strong>{req.brokerName}</strong> — {format(new Date(req.deadline), 'MMM d, yyyy')}
                </li>
              ))}
              {upcomingDeadlines.length > 3 && (
                <li className="text-yellow-600">and {upcomingDeadlines.length - 3} more...</li>
              )}
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Requests</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{requests.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Completed</p>
            <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'completed').length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueRequests.length}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'acknowledged', 'completed', 'denied', 'overdue'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {status === 'all' ? 'All' : status === 'overdue' ? 'Overdue' : STATUS_LABELS[status]?.label || status}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Export
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Import
            </button>
            <button
              onClick={handleClearAllData}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              Clear Local Data
            </button>
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="py-12 text-center text-zinc-500">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              {requests.length === 0
                ? 'No requests tracked yet. Generate some letters to get started!'
                : 'No requests match the current filter.'}
            </p>
            {requests.length === 0 && (
              <Link
                href="/generator"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {req.brokerName}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[req.status].color}`}>
                        {STATUS_LABELS[req.status].label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {req.requestTypes.map((type) => {
                        const info = REQUEST_TYPES.find(rt => rt.id === type);
                        return (
                          <span
                            key={type}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {info?.name || type}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <span>Sent: {format(new Date(req.dateSent), 'MMM d, yyyy')}</span>
                      <span>Deadline: {format(new Date(req.deadline), 'MMM d, yyyy')}</span>
                      <span>{getDeadlineDisplay(req.deadline, req.status)}</span>
                    </div>
                    {req.notes && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Notes: {req.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                    >
                      <option value="pending">Pending</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="completed">Completed</option>
                      <option value="denied">Denied</option>
                      <option value="appealed">Appealed</option>
                    </select>
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="rounded-lg border border-zinc-300 p-1 text-zinc-500 hover:bg-zinc-50 hover:text-red-600 dark:border-zinc-600 dark:hover:bg-zinc-800"
                      title="Delete"
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
