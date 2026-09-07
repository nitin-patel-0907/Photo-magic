import React, { useState, useRef, useCallback } from 'react';
import {
  Download,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  SplitSquareVertical,
  Columns2,
  Wand2,
  Maximize2,
  X,
  Share2,
} from 'lucide-react';
import { EditResult } from '../types';
import { downloadImage, copyImageToClipboard } from '../utils/imageUtils';

interface ResultViewProps {
  result: EditResult;
  onTryAnotherAction: () => void;
  onStartOver: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  onTryAnotherAction,
  onStartOver,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointerMove(e.clientX);
  };

  const handlePointerMoveEvent = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      handlePointerMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX);
  };

  const handleDownload = () => {
    const isPng = result.resultImage.startsWith('data:image/png');
    const filename = `magic-photo-${Date.now()}.${isPng ? 'png' : 'jpg'}`;
    downloadImage(result.resultImage, filename);
  };

  const handleCopy = async () => {
    const success = await copyImageToClipboard(result.resultImage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      // Fallback: trigger download
      handleDownload();
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Top Banner and Summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Magic Edit Complete!
            </span>
            {result.durationSeconds !== undefined && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                ⚡ {result.durationSeconds}s
              </span>
            )}
            <span className="text-xs text-slate-500">Step 4 of 4</span>
          </div>
          <h2 className="mt-1 font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
            {result.actionName}
          </h2>
          {result.note && (
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              🌿 {result.note}
            </p>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            id="view-mode-slider-btn"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              viewMode === 'slider'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Before / After Slider</span>
          </button>

          <button
            type="button"
            id="view-mode-side-by-side-btn"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              viewMode === 'side-by-side'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* COMPARISON DISPLAY */}
      {viewMode === 'slider' ? (
        /* Interactive Before/After Split Slider */
        <div className="relative mx-auto flex flex-col items-center">
          <div
            ref={containerRef}
            id="before-after-slider-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMoveEvent}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleContainerClick}
            className="relative h-[440px] w-full max-w-4xl cursor-ew-resize overflow-hidden rounded-3xl border-2 border-slate-200 bg-slate-950 shadow-xl select-none touch-none sm:h-[520px]"
          >
            {/* AFTER IMAGE (Underneath / Right side) */}
            <img
              src={result.resultImage}
              alt="Edited Result"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            />
            <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-purple-600/90 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur-xs flex items-center gap-1 z-10">
              <Sparkles className="h-3 w-3" />
              <span>AFTER</span>
            </div>

            {/* BEFORE IMAGE (Top Layer, clipped to left sliderPosition%) */}
            <img
              src={result.originalImage}
              alt="Original"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-contain pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            />
            <div
              className="pointer-events-none absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur-xs z-10"
              style={{ opacity: sliderPosition > 10 ? 1 : 0 }}
            >
              BEFORE
            </div>

            {/* Draggable Divider Line and Handle */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] z-20"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-white text-purple-700 shadow-xl ring-2 ring-purple-600 active:cursor-grabbing hover:scale-110 transition-transform">
                <div className="flex items-center gap-0.5 text-xs font-black">
                  <span>‹</span>
                  <span>›</span>
                </div>
              </div>
            </div>

            {/* Hint overlay */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-xs z-10">
              Drag slider or click anywhere to compare
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Mode */
        <div className="grid gap-4 md:grid-cols-2">
          {/* Before */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-2 shadow-sm">
            <div className="mb-2 flex items-center justify-between px-3 pt-2">
              <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-bold text-slate-200">
                Original Photo
              </span>
              <span className="text-[11px] text-slate-400">Before</span>
            </div>
            <div className="relative flex h-[380px] w-full items-center justify-center">
              <img
                src={result.originalImage}
                alt="Original"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>

          {/* After */}
          <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-purple-300 bg-slate-950 p-2 shadow-md">
            <div className="mb-2 flex items-center justify-between px-3 pt-2">
              <span className="flex items-center gap-1 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-bold text-white shadow-xs">
                <Sparkles className="h-3 w-3" />
                Magic Edited
              </span>
              <span className="text-[11px] text-purple-300 font-semibold">After</span>
            </div>
            <div className="relative flex h-[380px] w-full items-center justify-center">
              <img
                src={result.resultImage}
                alt="Edited"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Download Button */}
          <button
            id="download-result-btn"
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:brightness-110 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Download Photo</span>
          </button>

          {/* Copy to Clipboard */}
          <button
            id="copy-result-btn"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Copy Image</span>
              </>
            )}
          </button>
        </div>

        {/* Chaining and Reset Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chain Edit: "Try another action" */}
          <button
            id="try-another-action-btn"
            type="button"
            onClick={onTryAnotherAction}
            className="flex items-center gap-2 rounded-2xl border border-purple-300 bg-white px-5 py-3.5 text-sm font-bold text-purple-700 shadow-sm transition hover:bg-purple-50 active:scale-95"
          >
            <Wand2 className="h-4 w-4 text-purple-600" />
            <span>✨ Try another action</span>
          </button>

          {/* Start Over */}
          <button
            id="start-over-btn"
            type="button"
            onClick={onStartOver}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
            <span>Start Over</span>
          </button>
        </div>
      </div>
    </div>
  );
};
