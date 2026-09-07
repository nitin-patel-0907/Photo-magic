import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Sparkles, Wand2, Star, CheckCircle2 } from 'lucide-react';

interface ProcessingViewProps {
  actionName: string;
  sourceImage: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  actionName,
  sourceImage,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(20);

  // Tailored informative messages based on the specific action
  const getActionMessages = (name: string): string[] => {
    const lower = name.toLowerCase();
    if (lower.includes('remove background') || lower.includes('cutout') || lower.includes('transparent')) {
      return [
        'Running edge-guided background extraction...',
        'Segmenting subject contours and fine edges...',
        'Generating precise alpha matte with zero latency...',
        'Finalizing clean subject cutout...',
      ];
    }
    if (lower.includes('background') || lower.includes('backdrop') || lower.includes('composite')) {
      return [
        'Segmenting subject with local color saliency...',
        'Resizing and preparing high-resolution backdrop...',
        'Compositing layers and harmonizing lighting...',
        'Feathering edges for a seamless natural finish...',
      ];
    }
    if (lower.includes('enhance') || lower.includes('sharpen') || lower.includes('hdr')) {
      return [
        'Running Gray World auto white-balance...',
        'Applying adaptive dynamic range contrast...',
        'Executing edge-preserving unsharp masking...',
        'Synthesizing crisp clarity and detail...',
      ];
    }
    if (lower.includes('vanish') || lower.includes('object') || lower.includes('remove')) {
      return [
        'Tracing object brush mask boundaries...',
        'Running local boundary texture inpainting...',
        'Synthesizing surrounding colors and patterns...',
        'Refining seam boundaries for seamless vanish...',
      ];
    }
    // Creative styles
    return [
      'Applying local bilateral smoothing filters...',
      'Extracting artistic contours and color quantization...',
      'Stylizing tones with zero-compute classical filters...',
      'Rendering finished creative artwork on device...',
    ];
  };

  const messages = getActionMessages(actionName);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 80) return prev + Math.floor(Math.random() * 10) + 4;
        if (prev < 96) return prev + 1;
        return prev;
      });
    }, 600);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [messages.length]);

  return (
    <div className="mx-auto flex min-h-[550px] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      {/* Visual glowing ring container */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Soft background pulse */}
        <div className="absolute -inset-8 animate-pulse rounded-full bg-gradient-to-tr from-purple-400/25 via-indigo-400/20 to-emerald-400/25 blur-2xl" />

        {/* Outer decorative ring */}
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-purple-300/80 bg-white/75 p-2 shadow-xl shadow-purple-500/10 backdrop-blur-sm sm:h-44 sm:w-44">
          {/* Subtle thumbnail of image being edited in center */}
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white shadow-inner sm:h-36 sm:w-36">
            <img
              src={sourceImage}
              alt="Processing source"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover filter blur-xs brightness-95"
            />
            <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-[2px]" />

            {/* Glowing Magic Wand Icon in Center */}
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="relative">
                <Wand2 className="h-10 w-10 animate-bounce text-amber-300 drop-shadow-md sm:h-12 sm:w-12" />
                <Sparkles className="absolute -top-3 -right-2 h-5 w-5 animate-spin text-white duration-1000" />
              </div>
            </div>
          </div>

          {/* Floating animated sparkles */}
          <Star className="absolute -top-1 -right-1 h-5 w-5 animate-ping text-amber-400 duration-1000" />
          <Cpu className="absolute bottom-1 -left-1 h-5 w-5 animate-pulse text-emerald-600" />
        </div>
      </div>

      {/* Action Title Badge */}
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-purple-800">
        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
        <span>Action: {actionName}</span>
      </div>

      <h2 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Processing Locally on Device
      </h2>

      {/* Dynamic Animated Informative Status Message */}
      <p className="mt-3 min-h-[28px] max-w-md text-base font-medium text-purple-700 transition-all duration-300">
        ⚡ {messages[messageIndex]}
      </p>

      {/* Progress Bar */}
      <div className="mt-6 w-full max-w-md">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-emerald-600" /> Local Open-Source Inference
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Friendly reassurance notes */}
      <div className="mt-8 flex flex-col items-center gap-2 text-xs text-slate-600 sm:flex-row">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>100% Private & In-Memory</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-purple-600" />
          <span>No Cloud APIs • No Billing • Zero Limits</span>
        </div>
      </div>
    </div>
  );
};
