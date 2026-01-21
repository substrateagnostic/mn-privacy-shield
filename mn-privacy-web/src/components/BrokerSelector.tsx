'use client';

import { useState, useMemo } from 'react';
import { BROKERS, CATEGORY_NAMES, searchBrokers, getSafeUrl } from '@/data/brokers';
import { DataBroker, BrokerCategory } from '@/lib/types';

interface BrokerSelectorProps {
  selected: DataBroker[];
  onChange: (selected: DataBroker[]) => void;
}

export default function BrokerSelector({ selected, onChange }: BrokerSelectorProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BrokerCategory | 'all'>('all');

  const selectedIds = useMemo(() => new Set(selected.map(b => b.id)), [selected]);

  const filteredBrokers = useMemo(() => {
    let brokers = BROKERS;

    if (search) {
      brokers = searchBrokers(search);
    }

    if (categoryFilter !== 'all') {
      brokers = brokers.filter(b => b.category === categoryFilter);
    }

    return brokers;
  }, [search, categoryFilter]);

  const toggleBroker = (broker: DataBroker) => {
    if (selectedIds.has(broker.id)) {
      onChange(selected.filter(b => b.id !== broker.id));
    } else {
      onChange([...selected, broker]);
    }
  };

  const selectAllVisible = () => {
    const newSelected = [...selected];
    for (const broker of filteredBrokers) {
      if (!selectedIds.has(broker.id)) {
        newSelected.push(broker);
      }
    }
    onChange(newSelected);
  };

  const clearAll = () => {
    onChange([]);
  };

  const categories = useMemo(() => {
    const cats = new Set(BROKERS.map(b => b.category));
    return Array.from(cats).sort();
  }, []);

  // Group brokers by category for display
  const groupedBrokers = useMemo(() => {
    const groups: Record<string, DataBroker[]> = {};
    for (const broker of filteredBrokers) {
      if (!groups[broker.category]) {
        groups[broker.category] = [];
      }
      groups[broker.category].push(broker);
    }
    return groups;
  }, [filteredBrokers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Select Companies
        </h3>
        <div className="space-x-2">
          <button
            type="button"
            onClick={selectAllVisible}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Select All Visible
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

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as BrokerCategory | 'all')}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 sm:w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_NAMES[cat] || cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-800">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-900 dark:text-zinc-100">{selected.length}</strong> companies selected
        </span>
        <span className="text-sm text-zinc-500">
          {filteredBrokers.length} shown
        </span>
      </div>

      {/* Broker list */}
      <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        {Object.entries(groupedBrokers).map(([category, brokers]) => (
          <div key={category}>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {CATEGORY_NAMES[category as BrokerCategory] || category}
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-normal dark:bg-zinc-700">
                {brokers.length}
              </span>
            </h4>
            <div className="space-y-2">
              {brokers.map((broker) => {
                const safeWebsite = getSafeUrl(broker.website);
                const safeOptOutUrl = getSafeUrl(broker.optOutUrl);
                const websiteLabel = (safeWebsite || broker.website)
                  .replace(/^https?:\/\//, '')
                  .replace(/\/$/, '');

                return (
                  <label
                    key={broker.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                      selectedIds.has(broker.id)
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                        : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(broker.id)}
                      onChange={() => toggleBroker(broker)}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {broker.name}
                        </span>
                        {broker.collectsGeolocation && (
                          <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Location
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {safeWebsite ? (
                          <a
                            href={safeWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="truncate hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {websiteLabel}
                          </a>
                        ) : (
                          <span className="truncate">{websiteLabel}</span>
                        )}
                        {safeOptOutUrl && (
                          <>
                            <span>{'>'}</span>
                            <a
                              href={safeOptOutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Opt-out
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {filteredBrokers.length === 0 && (
          <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
            No companies found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}
