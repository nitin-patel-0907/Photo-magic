/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { ActionSelector } from './components/ActionSelector';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { AppStep, ActionCategory, EditResult } from './types';
import { AlertCircle, X, Sparkles, RefreshCw, KeyRound } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<AppStep>('upload');
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('photo.jpg');

  const [currentActionName, setCurrentActionName] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<ActionCategory>('remove-bg');
  const [currentResult, setCurrentResult] = useState<EditResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastParams, setLastParams] = useState<{
    category: ActionCategory;
    prompt: string;
    actionName: string;
    maskImage?: string;
    modelPreference?: 'standard' | 'high-quality';
  } | null>(null);

  // Check health and API key status on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
      })
      .catch((err) => {
        console.warn('Health check error:', err);
      });
  }, []);

  // Handler when user uploads or selects a photo
  const handlePhotoSelected = (base64: string, name?: string) => {
    setOriginalPhoto(base64);
    setCurrentPhoto(base64);
    if (name) setPhotoName(name);
    setErrorMessage(null);
    setStep('action');
  };

  // Handler to execute AI transformation
  const handleApplyAction = async (params: {
    category: ActionCategory;
    prompt: string;
    actionName: string;
    maskImage?: string;
    modelPreference?: 'standard' | 'high-quality';
  }) => {
    if (!currentPhoto) {
      setErrorMessage('No photo selected. Please upload a photo first.');
      setStep('upload');
      return;
    }

    setLastParams(params);
    setCurrentActionName(params.actionName);
    setCurrentCategory(params.category);
    setErrorMessage(null);
    setIsSubmitting(true);
    setStep('processing');

    try {
      const response = await fetch('/api/magic-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: currentPhoto,
          prompt: params.prompt,
          actionType: params.category,
          maskImage: params.maskImage,
          modelPreference: params.modelPreference,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'The AI model could not process this photo. Please try a different action or photo.'
        );
      }

      const newResult: EditResult = {
        originalImage: currentPhoto,
        resultImage: data.resultImage,
        actionName: params.actionName,
        actionCategory: params.category,
        appliedPrompt: params.prompt,
        timestamp: Date.now(),
        note: data.note,
        durationSeconds: data.durationSeconds,
      };

      setCurrentResult(newResult);
      setStep('result');
    } catch (err: any) {
      console.error('Magic edit error:', err);
      setErrorMessage(
        err?.message ||
          'Failed to connect to the Magic Photo AI service. Please check your connection and try again.'
      );
      setStep('action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (lastParams) {
      handleApplyAction(lastParams);
    }
  };

  // Handler to chain edits: use the result as the new input photo
  const handleTryAnotherAction = () => {
    if (!currentResult) return;
    // Set current photo to the edited result
    setCurrentPhoto(currentResult.resultImage);
    setStep('action');
  };

  // Revert back to original uploaded photo if chained
  const handleRevertToOriginal = () => {
    if (originalPhoto) {
      setCurrentPhoto(originalPhoto);
      setErrorMessage(null);
    }
  };

  // Reset back to upload
  const handleStartOver = () => {
    setOriginalPhoto(null);
    setCurrentPhoto(null);
    setCurrentResult(null);
    setErrorMessage(null);
    setLastParams(null);
    setStep('upload');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentStep={step}
        onReset={handleStartOver}
        hasImage={Boolean(currentPhoto)}
      />

      {/* Optional Missing API Key Banner Notification */}
      {hasApiKey === false && (
        <div className="bg-amber-500 px-4 py-2.5 text-center text-xs font-semibold text-slate-950 shadow-xs">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-2">
            <KeyRound className="h-4 w-4 shrink-0" />
            <span>
              Tip: Configure your Gemini API key in AI Studio <strong>Settings &gt; Secrets</strong> to enable live AI photo edits.
            </span>
          </div>
        </div>
      )}

      {/* Friendly Error Toast Notification with Retry */}
      {errorMessage && (
        <div className="mx-auto mt-4 w-full max-w-3xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Magic Edit Notice</h4>
                <p className="mt-0.5 text-xs text-rose-700">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {lastParams && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="rounded-lg p-1 text-rose-600 transition hover:bg-rose-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Views */}
      <main className="flex-1">
        {step === 'upload' && (
          <UploadDropzone
            onImageSelected={handlePhotoSelected}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {step === 'action' && currentPhoto && (
          <ActionSelector
            currentPhoto={currentPhoto}
            onApplyAction={handleApplyAction}
            onSelectNewPhoto={handleStartOver}
            isProcessing={isSubmitting}
          />
        )}

        {step === 'processing' && currentPhoto && (
          <ProcessingView
            actionName={currentActionName}
            sourceImage={currentPhoto}
          />
        )}

        {step === 'result' && currentResult && (
          <ResultView
            result={currentResult}
            onTryAnotherAction={handleTryAnotherAction}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <p>© {new Date().getFullYear()} Magic Photo — Simple, friendly AI-powered photo editor</p>
          <div className="flex items-center gap-2 text-[11px] text-purple-700 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gemini Nano Banana Image Models</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
