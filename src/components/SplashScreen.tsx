import React, { useEffect, useState } from 'react';
import { SigmaEchoLogo } from './SigmaEchoLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

const MILESTONES = [
  { step: 'Menginisialisasi App Shell & Font Engine', progress: 20 },
  { step: 'Memuat Sesi Pengguna & RLS Supabase', progress: 45 },
  { step: 'Menyiapkan Kurikulum TKA MAS Darunnajah 9', progress: 75 },
  { step: 'Memverifikasi State Modul & Forum Diskusi', progress: 95 },
  { step: 'SIGMA Siap Digunakan', progress: 100 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [hasError, setHasError] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      if (step < MILESTONES.length) {
        setCurrentStepIndex(step);
        setProgress(MILESTONES[step].progress);
        step++;
      } else {
        clearInterval(interval);
        // Start smooth fade out
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleRetry = () => {
    setHasError(false);
    setProgress(15);
    setCurrentStepIndex(0);
  };

  return (
    <div 
      id="sigma-loading-splash"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D0D] transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background soft math watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-5 select-none">
        <span className="text-[28vw] font-mono font-black text-white leading-none">Σ</span>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* ECHO-styled Cinematic SIGMA Wordmark */}
        <div className="mb-6 flex flex-col items-center">
          <SigmaEchoLogo 
            size="xl" 
            badgeText="MAS DARUNNAJAH 9" 
            badgeColor="emerald"
          />
        </div>

        {hasError ? (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-red-400 font-medium">
              SIGMA couldn't load completely
            </p>
            <button
              id="retry-loading-button"
              onClick={handleRetry}
              className="px-6 py-2 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] text-xs font-bold uppercase tracking-wider transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Slim streaming-app horizontal progress bar */}
            <div 
              className="w-full h-1 bg-[#222222] rounded-full overflow-hidden mb-3"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div 
                className="h-full bg-[#10B981] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Current milestone indicator */}
            <div className="flex items-center justify-between text-[11px] text-[#737373]">
              <span className="truncate pr-2 text-left">
                {MILESTONES[currentStepIndex]?.step || 'Memuat...'}
              </span>
              <span className="font-mono font-medium text-[#A3A3A3]">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle bottom note */}
      <div className="absolute bottom-6 text-center text-[10px] text-[#525252]">
        PKM Mahasiswa Matematika Universitas Pamulang
      </div>
    </div>
  );
};
