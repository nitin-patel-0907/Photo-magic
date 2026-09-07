import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  Eraser,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/presets';
import { fileToBase64, urlToBase64, optimizeImageForUpload } from '../utils/imageUtils';
import { SamplePhoto } from '../types';

interface UploadDropzoneProps {
  onImageSelected: (base64: string, name?: string) => void;
  onError: (error: string) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onImageSelected,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      onError('Image size exceeds 30MB limit. Please choose a smaller photo.');
      return;
    }

    setIsProcessingUpload(true);
    try {
      const rawBase64 = await fileToBase64(file);
      const optimized = await optimizeImageForUpload(rawBase64, 1600);
      onImageSelected(optimized, file.name);
    } catch (err: any) {
      onError('Failed to process uploaded image: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const handleSelectSample = async (sample: SamplePhoto) => {
    setIsLoadingSample(sample.id);
    try {
      const base64 = await urlToBase64(sample.url);
      const optimized = await optimizeImageForUpload(base64, 1600);
      onImageSelected(optimized, sample.name);
    } catch (err: any) {
      onError(`Failed to load sample "${sample.name}": ` + (err?.message || 'Network error'));
    } finally {
      setIsLoadingSample(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Hero Header */}
      <div className="relative mb-10 text-center">
        {/* Soft decorative background glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-200/50 via-indigo-200/40 to-blue-200/50 blur-3xl" />

        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-4 py-1.5 text-xs font-semibold text-purple-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span>100% Free & Local Open-Source Models • Zero API Keys • Unlimited Edits</span>
        </div>

        <h1 className="font-['Outfit',sans-serif] text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Magic Photo
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-slate-600 sm:text-xl">
          Edit any photo like magic — no skills needed
        </p>

        {/* Feature quick badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200/70">
            <Wand2 className="h-3.5 w-3.5 text-purple-600" /> Cutout Background
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200/70">
            <Layers className="h-3.5 w-3.5 text-blue-600" /> Swap Backdrops
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200/70">
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" /> AI Enhance
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200/70">
            <Eraser className="h-3.5 w-3.5 text-rose-500" /> Vanish Objects
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200/70">
            <Palette className="h-3.5 w-3.5 text-amber-500" /> 8+ Artistic Styles
          </span>
        </div>
      </div>

      {/* Large Upload Dropzone */}
      <div
        id="photo-upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:min-h-[360px] ${
          isDragging
            ? 'scale-[1.01] border-purple-500 bg-purple-50/70 shadow-xl shadow-purple-500/10'
            : 'border-purple-200/90 bg-gradient-to-b from-white via-purple-50/30 to-blue-50/30 shadow-md shadow-slate-100 hover:border-purple-400 hover:bg-white hover:shadow-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          id="photo-file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Animated Magic Icon */}
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-lg shadow-purple-500/30 transition-transform duration-300 group-hover:scale-110">
          <UploadCloud className="h-10 w-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 sm:text-2xl">
          {isDragging ? 'Drop your photo here!' : 'Choose a photo or drag & drop'}
        </h3>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          Supports JPG, PNG, and WebP up to 30MB. Your photos are processed safely in-memory and never stored.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            id="browse-photos-btn"
            type="button"
            disabled={isProcessingUpload}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4" />
            <span>{isProcessingUpload ? 'Reading photo...' : 'Select from Device'}</span>
          </button>
        </div>
      </div>

      {/* Instant Sample Photos Section */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Or try immediately with a sample photo:
            </h4>
          </div>
          <span className="text-xs text-slate-500">1-click test</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {SAMPLE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              id={`sample-photo-btn-${sample.id}`}
              type="button"
              disabled={isLoadingSample !== null || isProcessingUpload}
              onClick={() => handleSelectSample(sample)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={sample.url}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                  {sample.category}
                </span>

                {isLoadingSample === sample.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-purple-900/60 backdrop-blur-xs">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>

              <div className="mt-2 px-1">
                <p className="truncate text-xs font-bold text-slate-800 group-hover:text-purple-700">
                  {sample.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">{sample.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Friendly trust footer */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-slate-200/80 pt-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>No account or sign up needed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>100% In-Memory Privacy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Powered by Gemini Nano Banana Models</span>
        </div>
      </div>
    </div>
  );
};
