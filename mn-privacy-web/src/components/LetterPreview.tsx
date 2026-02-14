'use client';

import { LetterContent } from '@/lib/templates';

interface LetterPreviewProps {
  letter: LetterContent;
  showSubmissionInfo?: boolean;
}

export default function LetterPreview({ letter, showSubmissionInfo = true }: LetterPreviewProps) {
  // Convert markdown-style formatting to HTML-safe display
  const formatBody = (body: string) => {
    return body.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-bold">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (line === '---') {
        return <hr key={i} className="my-2 border-[var(--secondary)]" />;
      }
      if (line.startsWith('THIS REQUEST INCLUDES:')) {
        return (
          <p key={i} className="font-bold text-[var(--accent)]">
            {line}
          </p>
        );
      }
      if (line.startsWith('LEGAL NOTICE:')) {
        return (
          <p key={i} className="font-semibold text-[var(--foreground)]">
            {line}
          </p>
        );
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Submission Info Card */}
      {showSubmissionInfo && (
        <div className="border-2 border-[var(--accent)] bg-[var(--accent)]/10 p-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            [HOW TO SUBMIT]
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]">
            Companies must provide a privacy page with submission instructions (usually a web portal or email).
          </p>

          <div className="mt-3 space-y-2 text-sm">
            {letter.optOutUrl && (
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--muted)]">PORTAL:</span>
                <a
                  href={letter.optOutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:no-underline"
                >
                  {letter.optOutUrl}
                </a>
              </div>
            )}

            {letter.recipientEmail && (
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--muted)]">EMAIL:</span>
                <a
                  href={`mailto:${letter.recipientEmail}`}
                  className="text-[var(--accent)] underline hover:no-underline"
                >
                  {letter.recipientEmail}
                </a>
              </div>
            )}

            {letter.recipientWebsite && (
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--muted)]">WEBSITE:</span>
                <a
                  href={letter.recipientWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:no-underline"
                >
                  {letter.recipientWebsite}
                </a>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">
            <strong>Tip:</strong> Save a copy of your submission for your records. If the company fails to respond within 45 days, you may file a complaint with the MN Attorney General.
          </p>
        </div>
      )}

      {/* Letter Content */}
      <div className="border-2 border-[var(--border)] bg-[var(--card)] p-6 font-serif text-sm leading-relaxed text-[var(--foreground)]">
        {/* Date */}
        <p className="mb-4">{letter.date}</p>

        {/* Recipient */}
        <div className="mb-4">
          <p className="font-bold">{letter.recipientName}</p>
          {letter.recipientAddress && (
            <p className="text-[var(--muted)]">{letter.recipientAddress}</p>
          )}
        </div>

        {/* Subject */}
        <p className="mb-4">
          <strong>Re: {letter.subject}</strong>
        </p>

        {/* Body */}
        <div className="space-y-2">
          {formatBody(letter.body)}
        </div>
      </div>
    </div>
  );
}
