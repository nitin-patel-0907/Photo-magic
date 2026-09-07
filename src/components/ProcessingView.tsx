import React, { useEffect, useState } from 'react';
import { Sparkles, Wand2, Star, ShieldCheck } from 'lucide-react';

interface ProcessingViewProps {
  actionName: string;
  sourceImage: string;
}

const MAGIC_MESSAGES = [
  'Waving the AI magic wand...',
  'Analyzing subject contours and lighting...',
  'Synthesizing photorealistic pixels with Gemini...',
  'Harmonizing shadows and color reflections...',
  'Applying the finishing magic touches...',
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  actionName,
  sourceImage,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Cycle through friendly messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MAGIC_MESSAGES.length);
    }, 2800);

    // Smooth pseudo-progress bar that moves toward 90%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 85) return prev + Math.floor(Math.random() * 8) + 2;
        if (prev < 94) return prev + 1;
        return prev;
      });
    }, 900);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[550px] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      {/* Visual glowing ring container */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Soft background pulse */}
        <div className="absolute -inset-8 animate-pulse rounded-full bg-gradient-to-tr from-purple-400/30 via-indigo-400/25 to-pink-400/30 blur-2xl" />

        {/* Outer rotating decorative ring */}
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-purple-300/80 bg-white/70 p-2 shadow-xl shadow-purple-500/10 backdrop-blur-sm sm:h-44 sm:w-44">
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
          <Sparkles className="absolute bottom-1 -left-1 h-5 w-5 animate-pulse text-purple-600" />
        </div>
      </div>

      {/* Action Title */}
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-purple-800">
        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
        <span>Action: {actionName}</span>
      </div>

      <h2 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Creating Your Magic Edit
      </h2>

      {/* Dynamic Animated Status Message */}
      <p className="mt-2 min-h-[28px] text-base font-medium text-purple-700 transition-all duration-300">
        ✨ {MAGIC_MESSAGES[messageIndex]}
      </p>

      {/* Progress Bar */}
      <div className="mt-6 w-full max-w-md">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Gemini Image Generation</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Friendly reassurance note */}
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-xs text-slate-600 shadow-xs">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>High-resolution processing — your original photo remains untouched.</span>
      </div>
    </div>
  );
};
