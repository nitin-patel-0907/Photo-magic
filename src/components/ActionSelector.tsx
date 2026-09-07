import React, { useState, useRef } from 'react';
import {
  Wand2,
  Layers,
  SlidersHorizontal,
  Eraser,
  Palette,
  Sparkles,
  Check,
  Upload,
  ArrowRight,
  Smile,
  Briefcase,
  Zap,
  Clock,
  Brush,
  Feather,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ActionCategory,
  BackgroundPreset,
  CreativeStylePreset,
  EnhanceOption,
} from '../types';
import {
  BACKGROUND_PRESETS,
  CREATIVE_STYLES,
  ENHANCE_OPTIONS,
} from '../data/presets';
import { ObjectBrushCanvas } from './ObjectBrushCanvas';
import { fileToBase64, optimizeImageForUpload } from '../utils/imageUtils';

interface ActionSelectorProps {
  currentPhoto: string;
  onApplyAction: (params: {
    category: ActionCategory;
    prompt: string;
    actionName: string;
    maskImage?: string;
    modelPreference?: 'standard' | 'high-quality';
  }) => void;
  onSelectNewPhoto: () => void;
  isProcessing: boolean;
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  currentPhoto,
  onApplyAction,
  onSelectNewPhoto,
  isProcessing,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<ActionCategory>('remove-bg');

  // Remove BG sub-options
  const [removeBgStyle, setRemoveBgStyle] = useState<'transparent' | 'white' | 'dark'>('white');

  // Change BG state
  const [selectedBgPreset, setSelectedBgPreset] = useState<BackgroundPreset>(
    BACKGROUND_PRESETS[0]
  );
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  // Enhance Photo state
  const [selectedEnhance, setSelectedEnhance] = useState<EnhanceOption>(
    ENHANCE_OPTIONS[0]
  );

  // Remove Object state
  const [objectMask, setObjectMask] = useState<string | null>(null);
  const [objectDescription, setObjectDescription] = useState<string>('');

  // Creative styles state
  const [selectedStyle, setSelectedStyle] = useState<CreativeStylePreset>(
    CREATIVE_STYLES[0]
  );
  const [styleFilter, setStyleFilter] = useState<'All' | 'Popular' | 'Artistic' | 'Fun'>('All');

  // Custom prompt state
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // High quality toggle
  const [useHighQuality, setUseHighQuality] = useState(false);

  const handleCustomBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const raw = await fileToBase64(file);
        const opt = await optimizeImageForUpload(raw, 1600);
        setCustomBgImage(opt);
      } catch (err) {
        console.error('Failed to load custom background', err);
      }
    }
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const executeAction = () => {
    setValidationError(null);
    const modelPreference = useHighQuality ? 'high-quality' : 'standard';

    if (showCustomPrompt && customPrompt.trim()) {
      onApplyAction({
        category: 'custom',
        prompt: customPrompt.trim(),
        actionName: 'Custom Magic Edit',
        modelPreference,
      });
      return;
    }

    switch (selectedCategory) {
      case 'remove-bg': {
        let bgInstruction = 'on a solid, pure clean studio white background (#ffffff)';
        if (removeBgStyle === 'transparent') {
          bgInstruction =
            'on an isolated clean solid transparent background, outputting crisp subject boundaries with no fringe';
        } else if (removeBgStyle === 'dark') {
          bgInstruction = 'on an elegant, sleek minimalist dark graphite studio background with subtle soft ground shadow';
        }

        const prompt = `Carefully isolate the main foreground subject in this photo and cleanly cut out the entire background. Place the isolated subject ${bgInstruction}. Keep every edge ultra-sharp, preserving natural hair strands, clothing textures, and contours with zero haloing or clipping artifacts.`;

        onApplyAction({
          category: 'remove-bg',
          prompt,
          actionName: `Remove Background (${removeBgStyle === 'white' ? 'White Studio' : removeBgStyle === 'transparent' ? 'Transparent' : 'Dark Studio'})`,
          modelPreference,
        });
        break;
      }

      case 'change-bg': {
        if (customBgImage) {
          const prompt =
            'The first image contains the foreground subject. The second image provides the new background environment. Seamlessly cut out the subject from the first image and composite them onto the new background from the second image. Harmonize lighting, color reflections, shadow direction, and depth-of-field so the subject looks organically photographed in this environment.';
          onApplyAction({
            category: 'change-bg',
            prompt,
            actionName: 'Custom Background Composite',
            maskImage: customBgImage,
            modelPreference,
          });
        } else {
          onApplyAction({
            category: 'change-bg',
            prompt: selectedBgPreset.prompt,
            actionName: `New Background: ${selectedBgPreset.name}`,
            modelPreference,
          });
        }
        break;
      }

      case 'enhance': {
        onApplyAction({
          category: 'enhance',
          prompt: selectedEnhance.prompt,
          actionName: selectedEnhance.name,
          modelPreference,
        });
        break;
      }

      case 'remove-object': {
        if (!objectMask && !objectDescription.trim()) {
          setValidationError(
            'Please brush over the object to vanish on the photo, or type its description below.'
          );
          return;
        }

        const userDesc = objectDescription.trim()
          ? `specifically removing: "${objectDescription.trim()}"`
          : 'removing the item highlighted in the provided mask';

        const prompt = objectMask
          ? `The first image is the original photo. The second image is a binary mask where the white shape indicates the exact object or person to be removed. ${userDesc}. Cleanly erase this object and seamlessly inpaint and reconstruct the background and textures behind the removed region, matching the surrounding lighting, surface patterns, shadows, and perspective seamlessly so it appears as if the object was never there.`
          : `In this photo, cleanly remove the unwanted object or person: "${objectDescription.trim()}". Perfectly inpaint and reconstruct the background and textures behind the removed region, matching surrounding lighting, surfaces, and shadows seamlessly so it appears as if the object was never there.`;

        onApplyAction({
          category: 'remove-object',
          prompt,
          actionName: objectDescription.trim()
            ? `Vanish: ${objectDescription.trim()}`
            : 'Vanish Marked Object',
          maskImage: objectMask || undefined,
          modelPreference,
        });
        break;
      }

      case 'creative-styles': {
        onApplyAction({
          category: 'creative-styles',
          prompt: selectedStyle.prompt,
          actionName: selectedStyle.name,
          modelPreference,
        });
        break;
      }
    }
  };

  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smile':
        return <Smile className="h-4 w-4" />;
      case 'Briefcase':
        return <Briefcase className="h-4 w-4" />;
      case 'Zap':
        return <Zap className="h-4 w-4" />;
      case 'Clock':
        return <Clock className="h-4 w-4" />;
      case 'Palette':
        return <Palette className="h-4 w-4" />;
      case 'Brush':
        return <Brush className="h-4 w-4" />;
      case 'Feather':
        return <Feather className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const filteredStyles =
    styleFilter === 'All'
      ? CREATIVE_STYLES
      : CREATIVE_STYLES.filter((s) => s.category === styleFilter);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Top Banner / Photo Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
            <img
              src={currentPhoto}
              alt="Current selected"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Outfit',sans-serif] font-bold text-slate-900">
                Photo Ready
              </span>
              <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                Step 2 of 4
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select an action below to transform this photo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quality level */}
          <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={useHighQuality}
              onChange={(e) => setUseHighQuality(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-purple-600 cursor-pointer"
            />
            <span className="font-medium">Nano Banana HD (Flash Image)</span>
          </label>

          <button
            id="change-photo-btn"
            type="button"
            onClick={onSelectNewPhoto}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            Change Photo
          </button>
        </div>
      </div>

      {/* Main 5 Action Category Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Remove Background */}
        <button
          id="action-tab-remove-bg"
          type="button"
          onClick={() => {
            setSelectedCategory('remove-bg');
            setShowCustomPrompt(false);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
            selectedCategory === 'remove-bg' && !showCustomPrompt
              ? 'border-purple-600 bg-purple-50/70 shadow-md shadow-purple-500/10 ring-2 ring-purple-600/30'
              : 'border-slate-200/80 bg-white hover:border-purple-300 hover:bg-slate-50/80'
          }`}
        >
          <div
            className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl transition ${
              selectedCategory === 'remove-bg' && !showCustomPrompt
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            <Wand2 className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900">Remove BG</span>
          <span className="mt-1 text-[11px] text-slate-500">Cut out subject</span>
        </button>

        {/* 2. Change Background */}
        <button
          id="action-tab-change-bg"
          type="button"
          onClick={() => {
            setSelectedCategory('change-bg');
            setShowCustomPrompt(false);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
            selectedCategory === 'change-bg' && !showCustomPrompt
              ? 'border-indigo-600 bg-indigo-50/70 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-600/30'
              : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50/80'
          }`}
        >
          <div
            className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl transition ${
              selectedCategory === 'change-bg' && !showCustomPrompt
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900">Change BG</span>
          <span className="mt-1 text-[11px] text-slate-500">Presets & custom</span>
        </button>

        {/* 3. Enhance Photo */}
        <button
          id="action-tab-enhance"
          type="button"
          onClick={() => {
            setSelectedCategory('enhance');
            setShowCustomPrompt(false);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
            selectedCategory === 'enhance' && !showCustomPrompt
              ? 'border-emerald-600 bg-emerald-50/70 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-600/30'
              : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-slate-50/80'
          }`}
        >
          <div
            className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl transition ${
              selectedCategory === 'enhance' && !showCustomPrompt
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900">Enhance</span>
          <span className="mt-1 text-[11px] text-slate-500">Sharpness & clarity</span>
        </button>

        {/* 4. Remove Object */}
        <button
          id="action-tab-remove-object"
          type="button"
          onClick={() => {
            setSelectedCategory('remove-object');
            setShowCustomPrompt(false);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
            selectedCategory === 'remove-object' && !showCustomPrompt
              ? 'border-rose-600 bg-rose-50/70 shadow-md shadow-rose-500/10 ring-2 ring-rose-600/30'
              : 'border-slate-200/80 bg-white hover:border-rose-300 hover:bg-slate-50/80'
          }`}
        >
          <div
            className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl transition ${
              selectedCategory === 'remove-object' && !showCustomPrompt
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            <Eraser className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900">Remove Object</span>
          <span className="mt-1 text-[11px] text-slate-500">Tap & brush away</span>
        </button>

        {/* 5. Creative Effects */}
        <button
          id="action-tab-creative-styles"
          type="button"
          onClick={() => {
            setSelectedCategory('creative-styles');
            setShowCustomPrompt(false);
          }}
          className={`col-span-2 sm:col-span-1 flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
            selectedCategory === 'creative-styles' && !showCustomPrompt
              ? 'border-amber-600 bg-amber-50/70 shadow-md shadow-amber-500/10 ring-2 ring-amber-600/30'
              : 'border-slate-200/80 bg-white hover:border-amber-300 hover:bg-slate-50/80'
          }`}
        >
          <div
            className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl transition ${
              selectedCategory === 'creative-styles' && !showCustomPrompt
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <Palette className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900">Creative Styles</span>
          <span className="mt-1 text-[11px] text-slate-500">Art, headshot & cartoon</span>
        </button>
      </div>

      {/* Main Selected Action Workspace Container */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        {/* VIEW 1: REMOVE BACKGROUND */}
        {selectedCategory === 'remove-bg' && !showCustomPrompt && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                  🪄 Remove Background
                </h3>
                <p className="text-sm text-slate-500">
                  AI isolates the main subject and cuts away the backdrop cleanly.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Image Preview */}
              <div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-2">
                <img
                  src={currentPhoto}
                  alt="Original"
                  referrerPolicy="no-referrer"
                  className="max-h-72 w-auto max-w-full rounded-xl object-contain"
                />
              </div>

              {/* Sub-options for background cutout */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Choose Cutout Style:
                  </label>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setRemoveBgStyle('white')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        removeBgStyle === 'white'
                          ? 'border-purple-600 bg-purple-50/80 font-bold text-purple-900 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mb-1.5 h-6 w-6 rounded-full border border-slate-300 bg-white shadow-xs" />
                      <span className="text-xs">White Studio</span>
                      <span className="text-[10px] text-slate-500">E-commerce ready</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRemoveBgStyle('transparent')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        removeBgStyle === 'transparent'
                          ? 'border-purple-600 bg-purple-50/80 font-bold text-purple-900 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mb-1.5 h-6 w-6 rounded-full border border-slate-300 bg-[conic-gradient(#cbd5e1_90deg,#fff_90deg_180deg,#cbd5e1_180deg_270deg,#fff_270deg)] bg-[length:8px_8px] shadow-xs" />
                      <span className="text-xs">Transparent</span>
                      <span className="text-[10px] text-slate-500">Clean cutout PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRemoveBgStyle('dark')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        removeBgStyle === 'dark'
                          ? 'border-purple-600 bg-purple-50/80 font-bold text-purple-900 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mb-1.5 h-6 w-6 rounded-full border border-slate-700 bg-slate-900 shadow-xs" />
                      <span className="text-xs">Dark Studio</span>
                      <span className="text-[10px] text-slate-500">Luxury portrait</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 text-xs text-purple-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>Intelligent Boundary Detection</span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    Gemini analyzes hair strands, edges, and clothing contours to generate a seamless cutout without jagged edges.
                  </p>
                </div>

                {/* Primary Action Button */}
                <button
                  id="execute-remove-bg-btn"
                  type="button"
                  disabled={isProcessing}
                  onClick={executeAction}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>🪄 Do the Magic: Remove Background</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CHANGE BACKGROUND */}
        {selectedCategory === 'change-bg' && !showCustomPrompt && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                  🌅 Change Background
                </h3>
                <p className="text-sm text-slate-500">
                  Pick a stunning preset environment or upload your own custom backdrop.
                </p>
              </div>

              {/* Upload Custom Backdrop Button */}
              <div>
                <input
                  ref={customBgInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleCustomBgUpload}
                />
                <button
                  type="button"
                  onClick={() => customBgInputRef.current?.click()}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    customBgImage
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{customBgImage ? 'Custom Backdrop Loaded ✓' : 'Upload Custom Backdrop'}</span>
                </button>
              </div>
            </div>

            {/* Custom Backdrop Banner if present */}
            {customBgImage && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={customBgImage}
                    alt="Custom backdrop"
                    className="h-10 w-14 rounded-lg object-cover border border-indigo-200"
                  />
                  <div>
                    <span className="font-bold text-indigo-900">Using Your Custom Backdrop</span>
                    <p className="text-slate-600">The subject will be composited into this image.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomBgImage(null)}
                  className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Presets Grid */}
            <div>
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Preset Environments:
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {BACKGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedBgPreset(preset);
                      setCustomBgImage(null);
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border p-2 text-left transition-all ${
                      selectedBgPreset.id === preset.id && !customBgImage
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-600/30'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {selectedBgPreset.id === preset.id && !customBgImage && (
                        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 px-1">
                      <p className="truncate text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        {preset.name}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              id="execute-change-bg-btn"
              type="button"
              disabled={isProcessing}
              onClick={executeAction}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                ✨ Do the Magic: Replace with {customBgImage ? 'Custom Backdrop' : selectedBgPreset.name}
              </span>
            </button>
          </div>
        )}

        {/* VIEW 3: ENHANCE PHOTO */}
        {selectedCategory === 'enhance' && !showCustomPrompt && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                ✨ Enhance Photo
              </h3>
              <p className="text-sm text-slate-500">
                AI repairs lighting, sharpness, micro-details, and color balance to studio quality.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {ENHANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedEnhance(opt)}
                  className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
                    selectedEnhance.id === opt.id
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/30'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['Outfit',sans-serif] text-sm font-bold text-slate-900">
                      {opt.name}
                    </span>
                    {selectedEnhance.id === opt.id && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600">{opt.description}</p>
                </button>
              ))}
            </div>

            {/* Primary Action Button */}
            <button
              id="execute-enhance-btn"
              type="button"
              disabled={isProcessing}
              onClick={executeAction}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>✨ Do the Magic: Apply {selectedEnhance.name}</span>
            </button>
          </div>
        )}

        {/* VIEW 4: REMOVE OBJECT */}
        {selectedCategory === 'remove-object' && !showCustomPrompt && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                🪄 Vanish Object or Person
              </h3>
              <p className="text-sm text-slate-500">
                Use the brush tool below to highlight anything you want removed. AI reconstructs the background naturally.
              </p>
            </div>

            {/* Interactive Brush Canvas Component */}
            <ObjectBrushCanvas
              imageUrl={currentPhoto}
              onMaskReady={(mask) => setObjectMask(mask)}
              objectDescription={objectDescription}
              setObjectDescription={setObjectDescription}
            />

            {validationError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center justify-between">
                <span>{validationError}</span>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="text-rose-500 hover:text-rose-800"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              id="execute-remove-object-btn"
              type="button"
              disabled={isProcessing}
              onClick={executeAction}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              <Eraser className="h-4 w-4" />
              <span>🪄 Do the Magic: Vanish Object</span>
            </button>
          </div>
        )}

        {/* VIEW 5: CREATIVE EFFECTS */}
        {selectedCategory === 'creative-styles' && !showCustomPrompt && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                  🎨 Creative Effects & Art Styles
                </h3>
                <p className="text-sm text-slate-500">
                  One-tap transformation into cartoons, fine art, professional headshots, and superheroes.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                {(['All', 'Popular', 'Artistic', 'Fun'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setStyleFilter(cat)}
                    className={`rounded-lg px-3 py-1 transition ${
                      styleFilter === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Styles Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                    selectedStyle.id === style.id
                      ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-600/30'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50/80 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                          selectedStyle.id === style.id
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'
                        }`}
                      >
                        {getStyleIcon(style.iconName)}
                      </div>

                      {style.badge && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {style.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="font-['Outfit',sans-serif] text-sm font-bold text-slate-900 group-hover:text-amber-800">
                      {style.name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {style.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-amber-700">
                    <span>{style.category}</span>
                    {selectedStyle.id === style.id && (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Primary Action Button */}
            <button
              id="execute-creative-style-btn"
              type="button"
              disabled={isProcessing}
              onClick={executeAction}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              <Palette className="h-4 w-4" />
              <span>🎨 Do the Magic: Transform into {selectedStyle.name}</span>
            </button>
          </div>
        )}

        {/* VIEW 6: CUSTOM PROMPT (EXPANDED) */}
        {showCustomPrompt && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span>Custom AI Magic Prompt</span>
              </h3>
              <p className="text-xs text-slate-500">
                Describe any creative edit in plain English. Gemini Nano Banana will apply it directly.
              </p>
            </div>

            <textarea
              id="custom-magic-prompt-textarea"
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Add golden fairy sparkle lights around the person, or change the jacket color to emerald green with soft velvet texture..."
              className="w-full rounded-xl border border-purple-200 bg-purple-50/20 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Be descriptive for best results.
              </span>
              <button
                id="execute-custom-prompt-btn"
                type="button"
                disabled={isProcessing || !customPrompt.trim()}
                onClick={executeAction}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-40"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>✨ Apply Custom Magic</span>
              </button>
            </div>
          </div>
        )}

        {/* Secondary Accordion Toggle for Custom Prompt */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {showCustomPrompt
                ? 'Back to Action Cards'
                : 'Need something else? Try a Custom Magic Prompt'}
            </span>
            {showCustomPrompt ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
