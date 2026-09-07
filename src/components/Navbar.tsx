import React from 'react';
import { Wand2, Cpu, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppStep } from '../types';

interface NavbarProps {
  currentStep: AppStep;
  onReset: () => void;
  hasImage: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentStep, onReset, hasImage }) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-purple-100/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo and Brand */}
        <button
          id="magic-photo-logo-btn"
          type="button"
          onClick={() => {
            if (currentStep !== 'upload') {
              if (window.confirm('Return to home screen?')) {
                onReset();
              }
            }
          }}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-md shadow-purple-500/20 transition-transform group-hover:scale-105">
            <Wand2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-slate-900">
                Magic Photo
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                <Cpu className="h-3 w-3" />
                Local AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Free, Open-Source & 100% Offline
            </p>
          </div>
        </button>

        {/* Right Info and Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>No Cloud APIs • 0 Quotas</span>
          </div>

          {hasImage && currentStep !== 'upload' && (
            <button
              id="header-start-over-btn"
              type="button"
              onClick={() => {
                if (window.confirm('Start over with a new photo?')) {
                  onReset();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>New Photo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
