'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { UserInfo, RequestType, TrackedRequest, RESPONSE_DEADLINE_DAYS, DataBroker } from '@/lib/types';
import { generateLetters, LetterContent, hasStandaloneRequest, STANDALONE_ONLY_REQUESTS, getRequestTypeContent } from '@/lib/templates';
import { generatePDF, generateMergedPDF, downloadPDF, getLetterFilename } from '@/lib/pdf';
import {
  saveRequest,
  saveUserInfo,
  getUserInfo,
  generateRequestId,
  getRememberUserInfoPreference,
  setRememberUserInfoPreference,
  clearUserInfo,
  clearAllData,
} from '@/lib/storage';
import UserInfoForm, { validateUserInfo } from '@/components/UserInfoForm';
import RequestTypeSelector from '@/components/RequestTypeSelector';
import BrokerSelector from '@/components/BrokerSelector';
import LetterPreview from '@/components/LetterPreview';
import { addDays, format } from 'date-fns';

type Step = 'info' | 'requests' | 'companies' | 'preview';

const STEPS: { id: Step; label: string }[] = [
  { id: 'info', label: 'Your Info' },
  { id: 'requests', label: 'Request Types' },
  { id: 'companies', label: 'Companies' },
  { id: 'preview', label: 'Preview & Download' },
];

const emptyUserInfo: UserInfo = {
  name: '',
  address: '',
  city: '',
  state: 'MN',
  zip: '',
  email: '',
};

export default function GeneratorPage() {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [userInfo, setUserInfo] = useState<UserInfo>(emptyUserInfo);
  const [selectedRequestTypes, setSelectedRequestTypes] = useState<RequestType[]>([]);
  const [additionalInputs, setAdditionalInputs] = useState<Record<string, string>>({});
  const [selectedBrokers, setSelectedBrokers] = useState<DataBroker[]>([]);
  const [letters, setLetters] = useState<LetterContent[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trackRequests, setTrackRequests] = useState(true);
  const [rememberUserInfo, setRememberUserInfo] = useState(false);
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionExportStatus, setExtensionExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Load saved user info on mount and detect extension
  useEffect(() => {
    const remember = getRememberUserInfoPreference();
    setRememberUserInfo(remember);
    if (remember) {
      getUserInfo().then((saved) => {
        if (saved) {
          setUserInfo(saved);
        }
      });
    }

    // Try to detect extension
    detectExtension();
  }, []);

  // Detect if MN Privacy Shield extension is installed
  const detectExtension = async () => {
    try {
      // Try to detect extension via postMessage
      const response = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 1000);

        // Post detection message
        window.postMessage({ type: 'MN_PRIVACY_SHIELD_DETECT' }, '*');

        // Listen for response
        const handler = (event: MessageEvent) => {
          if (event.data?.type === 'MN_PRIVACY_SHIELD_DETECTED') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(true);
          }
        };
        window.addEventListener('message', handler);
      });

      setExtensionDetected(response);
    } catch {
      setExtensionDetected(false);
    }
  };

  // Save user info when it changes
  useEffect(() => {
    if (rememberUserInfo && userInfo.name && userInfo.email) {
      saveUserInfo(userInfo);
    }
  }, [userInfo, rememberUserInfo]);

  // Generate letters when reaching preview step
  useEffect(() => {
    if (currentStep === 'preview' && selectedBrokers.length > 0 && selectedRequestTypes.length > 0) {
      const generated = generateLetters(selectedBrokers, selectedRequestTypes, userInfo, additionalInputs as Record<RequestType, string>);
      setLetters(generated);
      setPreviewIndex(0);
    }
  }, [currentStep, selectedBrokers, selectedRequestTypes, userInfo, additionalInputs]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'info':
        return Object.keys(validateUserInfo(userInfo)).length === 0;
      case 'requests': {
        if (selectedRequestTypes.length === 0) return false;
        // Ensure additional inputs are provided for standalone request types
        const standaloneSelected = selectedRequestTypes.filter(rt => STANDALONE_ONLY_REQUESTS.includes(rt));
        return standaloneSelected.every(rt => additionalInputs[rt]?.trim());
      }
      case 'companies':
        return selectedBrokers.length > 0;
      case 'preview':
        return letters.length > 0;
      default:
        return false;
    }
  }, [currentStep, userInfo, selectedRequestTypes, selectedBrokers, letters, additionalInputs]);

  const goToStep = (step: Step) => {
    const stepIndex = STEPS.findIndex(s => s.id === step);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    // Can always go back, but can only go forward if current step is valid
    if (stepIndex < currentIndex || canProceed()) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (!canProceed()) {
      setShowValidationErrors(true);
      return;
    }
    if (currentIndex < STEPS.length - 1) {
      setShowValidationErrors(false);
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const downloadSingleLetter = async (index: number) => {
    setIsGenerating(true);
    try {
      const letter = letters[index];
      const pdfBytes = await generatePDF(letter);
      const filename = getLetterFilename(letter.recipientName, letter.requestTypes);
      downloadPDF(pdfBytes, filename);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllLetters = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateMergedPDF(letters);
      const date = format(new Date(), 'yyyy-MM-dd');
      downloadPDF(pdfBytes, `MCDPA_Requests_${date}.pdf`);

      // Track requests if enabled
      if (trackRequests) {
        const now = new Date();
        const deadline = addDays(now, RESPONSE_DEADLINE_DAYS);

        for (const broker of selectedBrokers) {
          const request: TrackedRequest = {
            id: generateRequestId(),
            brokerId: broker.id,
            brokerName: broker.name,
            requestTypes: selectedRequestTypes,
            dateSent: now.toISOString(),
            deadline: deadline.toISOString(),
            status: 'pending',
            ...(rememberUserInfo ? { userInfo } : {}),
          };
          await saveRequest(request);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRememberToggle = async (enabled: boolean) => {
    setRememberUserInfo(enabled);
    setRememberUserInfoPreference(enabled);
    if (enabled) {
      const hasUserInfo = Boolean(
        userInfo.name || userInfo.email || userInfo.address || userInfo.city || userInfo.zip
      );
      if (hasUserInfo) {
        await saveUserInfo(userInfo);
      } else {
        const saved = await getUserInfo();
        if (saved) {
          setUserInfo(saved);
        }
      }
    } else {
      await clearUserInfo();
    }
  };

  const handleClearAllData = async () => {
    const confirmed = confirm('This will remove all saved requests and info from this browser. Continue?');
    if (!confirmed) return;
    await clearAllData();
    setRememberUserInfo(false);
    setUserInfo(emptyUserInfo);
  };

  // Export session to browser extension for auto-fill assist
  const exportToExtension = async () => {
    setExtensionExportStatus('exporting');

    try {
      // Get brokers that have opt-out URLs (for the queue)
      const brokersWithOptOut = selectedBrokers.filter(b => b.optOutUrl || b.website);

      const sessionData = {
        type: 'START_OPT_OUT_SESSION',
        userInfo,
        brokers: brokersWithOptOut.map(b => ({
          id: b.id,
          name: b.name,
          website: b.website,
          optOutUrl: b.optOutUrl,
          email: b.email
        }))
      };

      // Try to communicate with extension via postMessage (for content script)
      // or via chrome.runtime.sendMessage if extension ID is known
      const success = await new Promise<boolean>((resolve) => {
        // Method 1: Post to window for content script
        const handler = (event: MessageEvent) => {
          if (event.data?.type === 'MN_PRIVACY_SHIELD_SESSION_STARTED') {
            window.removeEventListener('message', handler);
            resolve(true);
          }
        };
        window.addEventListener('message', handler);

        window.postMessage({
          type: 'MN_PRIVACY_SHIELD_START_SESSION',
          data: sessionData
        }, '*');

        // Timeout after 2 seconds
        setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve(false);
        }, 2000);
      });

      if (success) {
        setExtensionExportStatus('success');
        setTimeout(() => setExtensionExportStatus('idle'), 3000);
      } else {
        // Fallback: Save to localStorage for extension to pick up
        localStorage.setItem('mnPrivacyShield_pendingSession', JSON.stringify({
          ...sessionData,
          timestamp: Date.now()
        }));
        setExtensionExportStatus('success');
        setTimeout(() => setExtensionExportStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to export to extension:', error);
      setExtensionExportStatus('error');
      setTimeout(() => setExtensionExportStatus('idle'), 3000);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Steps */}
        <nav className="mb-8" aria-label="Form progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  aria-current={index === currentStepIndex ? 'step' : undefined}
                  aria-label={`Step ${index + 1}: ${step.label}${index < currentStepIndex ? ' (completed)' : ''}`}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center font-mono text-sm font-bold ${
                      index < currentStepIndex
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : index === currentStepIndex
                        ? 'border-2 border-[var(--accent)] text-[var(--accent)]'
                        : 'border-2 border-[var(--secondary)] text-[var(--muted)]'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </span>
                  <span className="hidden font-mono text-xs font-semibold uppercase tracking-wide sm:inline">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 w-8 sm:w-16 ${
                      index < currentStepIndex
                        ? 'bg-[var(--accent)]'
                        : 'bg-[var(--secondary)]'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="card p-6">
          {currentStep === 'info' && (
            <div className="space-y-6">
              {/* AG Guidance */}
              <div className="border-2 border-[var(--warning)] bg-[var(--warning-bg)] p-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--warning)]">
                  [BEFORE YOU BEGIN]
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
                  <li className="flex gap-2"><span className="font-mono">—</span><span><strong>One person per request.</strong> Submit separate requests for yourself and your minor children.</span></li>
                  <li className="flex gap-2"><span className="font-mono">—</span><span><strong>Only fill in what you&apos;re comfortable sharing.</strong> More info helps companies find your data, but you decide what to provide.</span></li>
                  <li className="flex gap-2"><span className="font-mono">—</span><span><strong>Keep a copy.</strong> Save your submissions in case you need to file a complaint later.</span></li>
                </ul>
              </div>

              <UserInfoForm userInfo={userInfo} onChange={setUserInfo} showErrors={showValidationErrors} />

              <div className="border-2 border-[var(--border)] bg-[var(--secondary)] p-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  [PRIVACY CONTROLS]
                </p>
                <label className="mt-3 flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={rememberUserInfo}
                    onChange={(e) => handleRememberToggle(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Remember my info on this device
                </label>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  When enabled, your info is stored locally in this browser and never sent to any server.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="border-2 border-[var(--error)] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--error)] transition-colors hover:bg-[var(--error-bg)]"
                  >
                    Clear Local Data
                  </button>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Clears saved requests and any stored info from this browser.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'requests' && (
            <div className="space-y-6">
              <RequestTypeSelector
                selected={selectedRequestTypes}
                onChange={setSelectedRequestTypes}
                brokerCount={selectedBrokers.length}
              />

              {/* Additional input fields for standalone request types */}
              {selectedRequestTypes.filter(rt => STANDALONE_ONLY_REQUESTS.includes(rt)).map(rt => {
                const content = getRequestTypeContent(rt);
                return (
                  <div key={rt} className="border-2 border-[var(--border)] bg-[var(--card)] p-4">
                    <label
                      htmlFor={`additional-input-${rt}`}
                      className="block font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)]"
                    >
                      {content.inputPrompt}
                    </label>
                    <textarea
                      id={`additional-input-${rt}`}
                      value={additionalInputs[rt] || ''}
                      onChange={(e) => setAdditionalInputs(prev => ({ ...prev, [rt]: e.target.value }))}
                      rows={4}
                      required
                      className="mt-2 block w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                      placeholder={rt === 'correction'
                        ? 'e.g., My current address is listed as 123 Old Street, but it should be 456 New Avenue...'
                        : 'e.g., I was denied credit/insurance based on automated profiling on [date]...'
                      }
                    />
                    {!additionalInputs[rt]?.trim() && (
                      <p className="mt-1 text-xs text-[var(--error)]">
                        This information is required to generate your letter.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {currentStep === 'companies' && (
            <div className="space-y-4">
              <BrokerSelector
                selected={selectedBrokers}
                onChange={setSelectedBrokers}
              />

              {/* Submission guidance */}
              <div className="border-2 border-[var(--accent)] bg-[var(--accent)]/10 p-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  [WHERE TO SUBMIT]
                </p>
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  Controllers are required to have a privacy page on their website with submission instructions (usually an online portal or email address). After downloading your letters, visit each company&apos;s privacy page to submit.
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  We&apos;ll show you the submission links for each company in the preview step.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'preview' && letters.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
                  Preview Letters
                </h3>
                <span className="font-mono text-xs text-[var(--muted)]">
                  {previewIndex + 1} of {letters.length}
                </span>
              </div>

              {/* Letter count explanation */}
              {letters.length !== selectedBrokers.length && (
                <div className="border-2 border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--foreground)]">
                  You selected request types that require separate letters. {letters.length} letters will be generated for {selectedBrokers.length} companies.
                </div>
              )}

              {/* Letter navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  ← Prev
                </button>
                <select
                  value={previewIndex}
                  onChange={(e) => setPreviewIndex(Number(e.target.value))}
                  className="flex-1 border-2 border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
                >
                  {letters.map((letter, i) => (
                    <option key={i} value={i}>
                      {letter.recipientName} {letter.requestTypes.length === 1 && hasStandaloneRequest(letter.requestTypes) ? `(${letter.requestTypes[0]})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setPreviewIndex(Math.min(letters.length - 1, previewIndex + 1))}
                  disabled={previewIndex === letters.length - 1}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Next →
                </button>
              </div>

              {/* Letter preview */}
              <div className="max-h-[600px] overflow-y-auto">
                <LetterPreview letter={letters[previewIndex]} />
              </div>

              {/* Download options */}
              <div className="border-2 border-[var(--border)] bg-[var(--secondary)] p-4 space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={trackRequests}
                    onChange={(e) => setTrackRequests(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[var(--foreground)]">
                    Add to deadline tracker (track 45-day response deadlines)
                  </span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => downloadSingleLetter(previewIndex)}
                    disabled={isGenerating}
                    className="btn-secondary flex-1 px-4 py-2 text-xs disabled:opacity-50"
                  >
                    Download This Letter
                  </button>
                  <button
                    onClick={downloadAllLetters}
                    disabled={isGenerating}
                    className="btn-primary flex-1 px-4 py-2 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : `Download All ${letters.length} Letters`}
                  </button>
                </div>

                <p className="text-xs text-[var(--muted)]">
                  <strong>Remember:</strong> After downloading, submit each letter via the company&apos;s privacy portal or email. Keep copies for your records.
                </p>
              </div>

              {/* Extension Auto-Fill Export */}
              <div className="border-2 border-[var(--success)] bg-[var(--success-bg)] p-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--success)]">
                  [BROWSER EXTENSION]
                </p>
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  Have the MN Privacy Shield browser extension installed? Export your session to auto-fill opt-out forms as you visit each portal.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    onClick={exportToExtension}
                    disabled={extensionExportStatus === 'exporting' || selectedBrokers.length === 0}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                    style={{ background: 'var(--success)' }}
                  >
                    {extensionExportStatus === 'exporting' ? 'Exporting...' :
                     extensionExportStatus === 'success' ? '✓ Exported!' :
                     extensionExportStatus === 'error' ? 'Export Failed' :
                     `Export ${selectedBrokers.length} Companies to Extension`}
                  </button>
                  {!extensionDetected && (
                    <a
                      href="https://github.com/substrateagnostic/mn-privacy-shield"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--success)] underline"
                    >
                      Get the extension
                    </a>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--success)]">
                  The extension will queue each company. Open the popup to step through portals and auto-fill forms with your info.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="btn-secondary px-6 py-2 disabled:opacity-50"
          >
            Back
          </button>
          {currentStep !== 'preview' && (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              Continue
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
