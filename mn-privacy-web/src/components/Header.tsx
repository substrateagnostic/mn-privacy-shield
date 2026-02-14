'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <>
      {/* AG Recommendation Banner */}
      <div className="border-b-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-center">
        <p className="text-sm font-medium text-[var(--accent-foreground)]">
          Based on{' '}
          <a
            href="https://www.ag.state.mn.us/Data-Privacy/Consumer/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            MN Attorney General Ellison&apos;s guidance
          </a>
          {' '}for exercising your data privacy rights under the MCDPA
        </p>
      </div>

      {/* Header */}
      <header className="border-b-2 border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">[SHIELD]</span>
            <span className="text-lg font-black uppercase tracking-tight">MN Privacy Shield</span>
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/generator"
              className={`font-mono text-xs font-semibold uppercase tracking-wide transition-colors hover:text-[var(--foreground)] ${
                pathname === '/generator'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              Generator
            </Link>
            <Link
              href="/tracker"
              className={`font-mono text-xs font-semibold uppercase tracking-wide transition-colors hover:text-[var(--foreground)] ${
                pathname === '/tracker'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              Tracker
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
