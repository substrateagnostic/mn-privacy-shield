'use client';

import { RequestType, REQUEST_TYPES } from '@/lib/types';
import { STANDALONE_ONLY_REQUESTS, getLetterCount } from '@/lib/templates';

interface RequestTypeSelectorProps {
  selected: RequestType[];
  onChange: (selected: RequestType[]) => void;
  brokerCount?: number;
}

export default function RequestTypeSelector({ selected, onChange, brokerCount = 1 }: RequestTypeSelectorProps) {
  const toggleType = (type: RequestType) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const selectAll = () => {
    onChange(REQUEST_TYPES.map(rt => rt.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const isStandalone = (type: RequestType) => STANDALONE_ONLY_REQUESTS.includes(type);
  const letterCount = selected.length > 0 ? getLetterCount(brokerCount, selected) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
          Request Types
        </h3>
        <div className="space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent)] hover:underline"
          >
            Select All
          </button>
          <span className="text-[var(--muted)]">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent)] hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Select the types of requests you want to send. Most can be combined into one letter; some require separate letters.
      </p>

      <div className="space-y-3" role="group" aria-label="Available request types">
        {REQUEST_TYPES.map((requestType) => (
          <label
            key={requestType.id}
            className={`flex cursor-pointer items-start gap-3 border-2 p-4 transition-colors ${
              selected.includes(requestType.id)
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--border)] hover:bg-[var(--secondary)]'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(requestType.id)}
              onChange={() => toggleType(requestType.id)}
              aria-label={`${requestType.name} - ${requestType.description}`}
              className="mt-1 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold uppercase tracking-tight text-[var(--foreground)]">
                  {requestType.name}
                </span>
                <span className="border border-[var(--secondary)] bg-[var(--secondary)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  {requestType.statute}
                </span>
                {isStandalone(requestType.id) && (
                  <span className="tag status-warning">
                    Separate Letter
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {requestType.description}
              </p>
              {isStandalone(requestType.id) && (
                <p className="mt-1 text-xs text-[var(--warning)]">
                  {requestType.id === 'correction'
                    ? 'Requires you to specify what data is inaccurate.'
                    : 'Requires you to specify which profiling decision to challenge.'}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="border-2 border-[var(--border)] bg-[var(--secondary)] p-3" aria-live="polite">
          <p className="font-mono text-xs text-[var(--foreground)]">
            <strong>{selected.length}</strong> request type{selected.length !== 1 ? 's' : ''} selected
            {brokerCount > 0 && letterCount !== brokerCount && (
              <> — will generate <strong>{letterCount}</strong> letter{letterCount !== 1 ? 's' : ''} per company</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
