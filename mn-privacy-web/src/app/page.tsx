'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        {/* Hero */}
        <section className="border-b-2 border-[var(--border)] px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              Free Tool for Minnesotans
            </p>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
              Stop Companies From Selling Your Data
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-[var(--muted)]">
              Starting July 31, 2025, Minnesota law gives you the right to tell companies to delete your data and stop selling it. This free tool helps you do that in minutes.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/generator"
                className="btn-primary px-8 py-4 text-base"
              >
                Get Started Free
              </Link>
              <a
                href="#extension"
                className="btn-secondary px-8 py-4 text-base"
              >
                Get the Browser Extension
              </a>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
              <span>No account needed</span>
              <span>•</span>
              <span>555+ companies</span>
              <span>•</span>
              <span>Official AG templates</span>
            </div>
          </div>
        </section>

        {/* Simple Explanation */}
        <section className="border-b-2 border-[var(--border)] bg-[var(--secondary)] px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-bold uppercase tracking-tight sm:text-2xl">
              What Is This?
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Data brokers are companies that collect and sell your personal information — your name, address, phone number, location history, and more — often without you knowing. Under the new Minnesota Consumer Data Privacy Act (MCDPA), you can now demand they stop.
            </p>
            <p className="mt-4 text-[var(--muted)]">
              This tool generates official request letters based on the MN Attorney General&apos;s templates, so you can exercise your rights without hiring a lawyer.
            </p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              [YOUR RIGHTS]
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
              Rights Under the MCDPA
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Right to Know',
                  ref: '325M.14(2)',
                  description: 'Find out what data companies have collected about you and how they use it.',
                },
                {
                  title: 'Right to Delete',
                  ref: '325M.14(4)',
                  description: 'Request that companies delete all personal data they have about you.',
                },
                {
                  title: 'Right to Opt-Out',
                  ref: '325M.14(6)',
                  description: 'Stop companies from selling your data or using it for targeted ads.',
                },
                {
                  title: 'Right to Correct',
                  ref: '325M.14(3)',
                  description: 'Fix inaccurate information that companies have about you.',
                },
                {
                  title: 'Right to Portability',
                  ref: '325M.14(5)',
                  description: 'Get a copy of your data in a format you can take elsewhere.',
                },
                {
                  title: 'Right to Third-Party List',
                  ref: '325M.14(8)',
                  description: 'Know exactly who your data was sold or shared with. Unique to MN.',
                },
              ].map((right) => (
                <div
                  key={right.title}
                  className="card transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--border)]"
                >
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
                    REF: {right.ref}
                  </p>
                  <h3 className="mt-2 text-lg font-bold uppercase tracking-tight">
                    {right.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {right.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y-2 border-[var(--border)] bg-[var(--secondary)] px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              [3 SIMPLE STEPS]
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
              How It Works
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Fill In Your Info',
                  description: 'Name and address so companies can find your records. Everything stays on your device.',
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  step: '2',
                  title: 'Pick Companies',
                  description: 'Choose from 555+ data brokers. We recommend starting with "people search" sites.',
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                },
                {
                  step: '3',
                  title: 'Download & Send',
                  description: 'Get your letters as PDFs. Submit via each company\'s privacy portal or email.',
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.step} className="card text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                    {item.icon}
                  </div>
                  <div className="mt-4 font-mono text-xs font-bold text-[var(--muted)]">STEP {item.step}</div>
                  <h3 className="mt-1 text-lg font-bold uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-[var(--muted)]">
              Companies have <strong>45 days</strong> to respond. If they don&apos;t, you can file a complaint with the MN Attorney General.
            </p>
          </div>
        </section>

        {/* Privacy Notice */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl border-2 border-[var(--success)] bg-[var(--success-bg)] p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--success)]">
              [PRIVACY-FIRST]
            </p>
            <h2 className="mt-2 text-lg font-bold uppercase tracking-tight text-[var(--success)]">
              Your Data Never Leaves Your Browser
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--success)]">
              <li className="flex gap-2">
                <span className="font-mono">—</span>
                <span><strong>No tracking</strong> — No analytics. No cookies. No fingerprinting.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono">—</span>
                <span><strong>Local storage only (opt-in)</strong> - Save only if you choose; one-click clear.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono">—</span>
                <span><strong>No account required</strong> — Use immediately without signup.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono">—</span>
                <span><strong>Open source</strong> — Verify the code yourself.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono">—</span>
                <span><strong>Hosting transparency</strong> - Hosting providers may log basic access info (IP, timestamp).</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Browser Extension */}
        <section id="extension" className="border-y-2 border-[var(--accent)] bg-gradient-to-b from-[var(--accent)]/10 to-transparent px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                [BROWSER EXTENSION]
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                MN Privacy Shield Extension
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
                Install our free browser extension for automatic protection and easier opt-outs.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {/* GPC Feature */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-tight">Global Privacy Control</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Automatically tells every website not to sell your data. Legally binding under Minnesota law (and California, Colorado, Connecticut...).
                </p>
              </div>

              {/* Auto-Fill Feature */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-tight">Auto-Fill Opt-Outs</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Export your company list from the generator, then step through each portal with one-click form filling. You stay in control — just click submit.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <a
                href="/mn-privacy-shield-extension.zip"
                download
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Extension (Chrome/Edge)
              </a>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Manual install: Download, unzip, go to <code className="rounded bg-[var(--secondary)] px-1">chrome://extensions</code>, enable Developer Mode, click &quot;Load unpacked&quot;
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Chrome Web Store submission pending •{' '}
                <a
                  href="https://github.com/substrateagnostic/mn-privacy-shield"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  View source on GitHub
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="border-y-2 border-[var(--border)] bg-[var(--secondary)] px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              [RESOURCES]
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
              Official Resources
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: 'https://www.ag.state.mn.us/Data-Privacy/Consumer/',
                  title: 'MN AG Consumer Page',
                  desc: 'Official information about your rights',
                },
                {
                  href: 'https://www.ag.state.mn.us/Data-Privacy/FAQ/',
                  title: 'FAQ',
                  desc: 'Common questions answered',
                },
                {
                  href: 'https://www.ag.state.mn.us/Data-Privacy/Complaint/',
                  title: 'File a Complaint',
                  desc: 'Report non-compliant companies',
                },
                {
                  href: 'https://globalprivacycontrol.org/',
                  title: 'Global Privacy Control',
                  desc: 'Automatic opt-out signal (browser)',
                },
              ].map((resource) => (
                <a
                  key={resource.href}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-center justify-between transition-all hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[4px_4px_0_var(--border)]"
                >
                  <div>
                    <p className="font-bold uppercase tracking-tight">{resource.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{resource.desc}</p>
                  </div>
                  <svg className="h-5 w-5 shrink-0 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              [GET STARTED]
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Ready to Exercise Your Rights?
            </h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Generate request letters for 555+ data brokers in minutes. Free and open source.
            </p>
            <Link
              href="/generator"
              className="btn-primary mt-8 px-10 py-5 text-base"
            >
              Start Now — Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[var(--border)] bg-[var(--card)] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">[SHIELD]</span>
              <span className="font-bold uppercase tracking-tight">MN Privacy Shield</span>
            </div>
            <p className="font-mono text-xs text-[var(--muted)]">
              Built by{' '}
              <a
                href="https://alexgallefrom.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--foreground)] underline hover:text-[var(--accent)]"
              >
                Alex Galle-From
              </a>
            </p>
          </div>
          <div className="mt-6 border-t border-[var(--secondary)] pt-6 text-center">
            <p className="text-xs text-[var(--muted)]">
              Free and open source. Not affiliated with the Minnesota Attorney General&apos;s office.
              <br />
              This tool is for informational purposes only and does not constitute legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}