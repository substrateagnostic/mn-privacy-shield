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
        return <hr key={i} className="my-2 border-zinc-300 dark:border-zinc-600" />;
      }
      if (line.startsWith('THIS REQUEST INCLUDES:')) {
        return (
          <p key={i} className="font-bold text-blue-700 dark:text-blue-400">
            {line}
          </p>
        );
      }
      if (line.startsWith('LEGAL NOTICE:')) {
        return (
          <p key={i} className="font-semibold text-zinc-700 dark:text-zinc-300">
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
            How to Submit This Request
          </h4>
          <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            Companies must provide a privacy page with submission instructions (usually a web portal or email).
          </p>

          <div className="mt-3 space-y-2 text-sm">
            {letter.optOutUrl && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300">Privacy Portal:</span>
                <a
                  href={letter.optOutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {letter.optOutUrl}
                </a>
              </div>
            )}

            {letter.recipientEmail && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300">Email:</span>
                <a
                  href={`mailto:${letter.recipientEmail}`}
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {letter.recipientEmail}
                </a>
              </div>
            )}

            {letter.recipientWebsite && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300">Website:</span>
                <a
                  href={letter.recipientWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {letter.recipientWebsite}
                </a>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Save a copy of your submission for your records. If the company fails to respond within 45 days, you may file a complaint with the MN Attorney General.
          </p>
        </div>
      )}

      {/* Letter Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 font-serif text-sm leading-relaxed text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        {/* Date */}
        <p className="mb-4">{letter.date}</p>

        {/* Recipient */}
        <div className="mb-4">
          <p className="font-bold">{letter.recipientName}</p>
          {letter.recipientAddress && (
            <p className="text-zinc-600 dark:text-zinc-400">{letter.recipientAddress}</p>
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
