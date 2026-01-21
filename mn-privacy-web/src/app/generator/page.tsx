'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserInfo, RequestType, TrackedRequest, RESPONSE_DEADLINE_DAYS, DataBroker } from '@/lib/types';
import { BROKERS } from '@/data/brokers';
import { generateLetters, LetterContent, getLetterCount, hasStandaloneRequest } from '@/lib/templates';
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
import UserInfoForm from '@/components/UserInfoForm';
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
  const [selectedBrokers, setSelectedBrokers] = useState<DataBroker[]>([]);
  const [letters, setLetters] = useState<LetterContent[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trackRequests, setTrackRequests] = useState(true);
  const [rememberUserInfo, setRememberUserInfo] = useState(false);
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionExportStatus, setExtensionExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

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
      const generated = generateLetters(selectedBrokers, selectedRequestTypes, userInfo);
      setLetters(generated);
      setPreviewIndex(0);
    }
  }, [currentStep, selectedBrokers, selectedRequestTypes, userInfo]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'info':
        return !!(userInfo.name && userInfo.address && userInfo.city && userInfo.state && userInfo.zip && userInfo.email);
      case 'requests':
        return selectedRequestTypes.length > 0;
      case 'companies':
        return selectedBrokers.length > 0;
      case 'preview':
        return letters.length > 0;
      default:
        return false;
    }
  }, [currentStep, userInfo, selectedRequestTypes, selectedBrokers, letters]);

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
    if (currentIndex < STEPS.length - 1 && canProceed()) {
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
  const letterCount = getLetterCount(selectedBrokers.length, selectedRequestTypes);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            MN Privacy Shield
          </Link>
          <Link
            href="/tracker"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Tracker →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Steps */}
        <nav className="mb-8">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      index < currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : index === currentStepIndex
                        ? 'border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-2 border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </span>
                  <span className="hidden font-medium sm:inline">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 w-8 sm:w-16 ${
                      index < currentStepIndex
                        ? 'bg-blue-600 dark:bg-blue-400'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {currentStep === 'info' && (
            <div className="space-y-6">
              {/* AG Guidance */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  Before You Begin
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                  <li>• <strong>One person per request.</strong> Submit separate requests for yourself and your minor children.</li>
                  <li>• <strong>Only fill in what you're comfortable sharing.</strong> More info helps companies find your data, but you decide what to provide.</li>
                  <li>• <strong>Keep a copy.</strong> Save your submissions in case you need to file a complaint later.</li>
                </ul>
              </div>

              <UserInfoForm userInfo={userInfo} onChange={setUserInfo} />

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Privacy Controls
                </h4>
                <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rememberUserInfo}
                    onChange={(e) => handleRememberToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                  />
                  Remember my info on this device
                </label>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  When enabled, your info is stored locally in this browser and never sent to any server.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Clear local data
                  </button>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Clears saved requests and any stored info from this browser.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'requests' && (
            <RequestTypeSelector
              selected={selectedRequestTypes}
              onChange={setSelectedRequestTypes}
              brokerCount={selectedBrokers.length}
            />
          )}

          {currentStep === 'companies' && (
            <div className="space-y-4">
              <BrokerSelector
                selected={selectedBrokers}
                onChange={setSelectedBrokers}
              />

              {/* Submission guidance */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Where to Submit
                </h4>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  Controllers are required to have a privacy page on their website with submission instructions (usually an online portal or email address). After downloading your letters, visit each company's privacy page to submit.
                </p>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  We'll show you the submission links for each company in the preview step.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'preview' && letters.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Preview Letters
                </h3>
                <span className="text-sm text-zinc-500">
                  {previewIndex + 1} of {letters.length}
                </span>
              </div>

              {/* Letter count explanation */}
              {letters.length !== selectedBrokers.length && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  You selected request types that require separate letters. {letters.length} letters will be generated for {selectedBrokers.length} companies.
                </div>
              )}

              {/* Letter navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
                >
                  ← Previous
                </button>
                <select
                  value={previewIndex}
                  onChange={(e) => setPreviewIndex(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
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
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
                >
                  Next →
                </button>
              </div>

              {/* Letter preview */}
              <div className="max-h-[600px] overflow-y-auto">
                <LetterPreview letter={letters[previewIndex]} />
              </div>

              {/* Download options */}
              <div className="space-y-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={trackRequests}
                    onChange={(e) => setTrackRequests(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Add to deadline tracker (track 45-day response deadlines)
                  </span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => downloadSingleLetter(previewIndex)}
                    disabled={isGenerating}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Download This Letter
                  </button>
                  <button
                    onClick={downloadAllLetters}
                    disabled={isGenerating}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : `Download All ${letters.length} Letters`}
                  </button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <strong>Remember:</strong> After downloading, submit each letter via the company's privacy portal or email. Keep copies for your records.
                </p>
              </div>

              {/* Extension Auto-Fill Export */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Browser Extension Auto-Fill
                </h4>
                <p className="mt-2 text-sm text-green-800 dark:text-green-200">
                  Have the MN Privacy Shield browser extension installed? Export your session to auto-fill opt-out forms as you visit each portal.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    onClick={exportToExtension}
                    disabled={extensionExportStatus === 'exporting' || selectedBrokers.length === 0}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {extensionExportStatus === 'exporting' ? 'Exporting...' :
                     extensionExportStatus === 'success' ? '✓ Exported!' :
                     extensionExportStatus === 'error' ? 'Export Failed' :
                     `Export ${selectedBrokers.length} Companies to Extension`}
                  </button>
                  {!extensionDetected && (
                    <a
                      href="https://github.com/alexgallefrom/mn-privacy-shield"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 underline dark:text-green-300"
                    >
                      Get the extension
                    </a>
                  )}
                </div>
                <p className="mt-2 text-xs text-green-700 dark:text-green-400">
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
            className="rounded-lg border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back
          </button>
          {currentStep !== 'preview' && (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
