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
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Request Types
        </h3>
        <div className="space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Select All
          </button>
          <span className="text-zinc-400">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select the types of requests you want to send. Most can be combined into one letter; some require separate letters.
      </p>

      <div className="space-y-3">
        {REQUEST_TYPES.map((requestType) => (
          <label
            key={requestType.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              selected.includes(requestType.id)
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(requestType.id)}
              onChange={() => toggleType(requestType.id)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {requestType.name}
                </span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {requestType.statute}
                </span>
                {isStandalone(requestType.id) && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Separate Letter
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {requestType.description}
              </p>
              {isStandalone(requestType.id) && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
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
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
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
