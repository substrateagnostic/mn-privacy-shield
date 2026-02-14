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
        <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
          Select Companies
        </h3>
        <div className="space-x-2">
          <button
            type="button"
            onClick={selectAllVisible}
            className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent)] hover:underline"
          >
            Select All Visible
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

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="broker-search" className="sr-only">Search companies</label>
          <input
            type="search"
            id="broker-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="broker-category" className="sr-only">Filter by category</label>
          <select
            id="broker-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as BrokerCategory | 'all')}
            className="w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] sm:w-auto"
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
      <div className="flex items-center justify-between border-2 border-[var(--border)] bg-[var(--secondary)] px-4 py-2" aria-live="polite">
        <span className="font-mono text-xs text-[var(--foreground)]">
          <strong>{selected.length}</strong> companies selected
        </span>
        <span className="font-mono text-xs text-[var(--muted)]">
          {filteredBrokers.length} shown
        </span>
      </div>

      {/* Broker list */}
      <div
        className="max-h-96 space-y-4 overflow-y-auto border-2 border-[var(--border)] p-4"
        role="list"
        aria-label="Data broker companies"
        tabIndex={0}
      >
        {Object.entries(groupedBrokers).map(([category, brokers]) => (
          <div key={category} role="group" aria-label={CATEGORY_NAMES[category as BrokerCategory] || category}>
            <h4 className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              {CATEGORY_NAMES[category as BrokerCategory] || category}
              <span className="border border-[var(--secondary)] bg-[var(--secondary)] px-2 py-0.5 font-mono text-[10px] font-normal">
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
                    role="listitem"
                    className={`flex cursor-pointer items-center gap-3 border-2 px-3 py-2 transition-colors ${
                      selectedIds.has(broker.id)
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-transparent hover:bg-[var(--secondary)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(broker.id)}
                      onChange={() => toggleBroker(broker)}
                      aria-label={`Select ${broker.name}`}
                      className="h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-[var(--foreground)]">
                          {broker.name}
                        </span>
                        {broker.collectsGeolocation && (
                          <span className="tag status-warning shrink-0">
                            Location
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                        {safeWebsite ? (
                          <a
                            href={safeWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="truncate hover:text-[var(--accent)]"
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
                              className="shrink-0 text-[var(--accent)] hover:underline"
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
          <p className="py-8 text-center text-[var(--muted)]">
            No companies found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}
