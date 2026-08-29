import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface DigitStripProps {
  digit: number;
}

const DigitStrip: React.FC<DigitStripProps> = ({ digit }) => {
  return (
    <div className="relative h-[1em] overflow-hidden inline-block align-top w-[0.6em] text-center">
      <div
        className="transition-transform duration-300 ease-out flex flex-col items-center"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1em] leading-none flex items-center justify-center">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(true);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check session storage
    const hasSeenLoader = sessionStorage.getItem('naari_loading_seen');
    if (hasSeenLoader) {
      setShouldRender(false);
      onComplete();
      return;
    }

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      setProgress(100);
      const timer = setTimeout(() => {
        sessionStorage.setItem('naari_loading_seen', 'true');
        setShouldRender(false);
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    // Normal animation flow with requestAnimationFrame & cubic ease-out over 2400ms
    let startTime: number | null = null;
    const duration = 2400;
    let animationFrameId: number;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progressRatio);
      const currentVal = Math.floor(easedProgress * 100);

      setProgress(currentVal);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setProgress(100);
        // At 100%, wait 300ms, then slide up and fade out over 750ms
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            sessionStorage.setItem('naari_loading_seen', 'true');
            setShouldRender(false);
            onComplete();
          }, 750);
        }, 300);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onComplete]);

  if (!shouldRender) return null;

  // Split digits for odometer display
  const hundredDigit = Math.floor(progress / 100);
  const tenDigit = Math.floor((progress % 100) / 10);
  const unitDigit = progress % 10;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading application, ${progress} percent complete`}
      className={`fixed inset-0 z-[100] bg-[#0D0B10] flex flex-col justify-between items-center p-8 sm:p-12 select-none overflow-hidden transition-all duration-[750ms] film-grain ${
        isExiting ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{
        transitionTimingFunction: isExiting ? 'cubic-bezier(0.65, 0, 0.35, 1)' : 'ease-out',
        ...(isReducedMotion && isExiting ? { transitionDuration: '300ms', transform: 'none' } : {}),
      }}
    >
      {/* CSS Keyframes for Expanding Pulsing Radar Waves */}
      <style>{`
        @keyframes radar-wave {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
        .animate-radar-wave {
          animation: radar-wave 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
        }
      `}</style>

      {/* Dark Moody Photographic Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-18 mix-blend-overlay pointer-events-none transition-transform duration-1000 transform scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop')`
        }}
      />

      {/* Moving Ambient Neon Light Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-magenta/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-violet/15 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDelay: '1.2s' }} />

      {/* Moving Expanding Radar Waves in Center */}
      {!isReducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-64 h-64 rounded-full border border-magenta/40 animate-radar-wave" style={{ animationDelay: '0s' }} />
          <div className="w-64 h-64 rounded-full border border-magenta/30 animate-radar-wave" style={{ animationDelay: '1s' }} />
          <div className="w-64 h-64 rounded-full border border-violet/30 animate-radar-wave" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Top Spacer */}
      <div className="w-full" />

      {/* Center Giant Wordmark + Thin Progress Line */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center w-full my-auto">
        <h1 className="font-display text-[clamp(56px,13vw,150px)] tracking-[0.08em] text-[#F5E7DE] leading-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] select-none">
          NAARISAAKSHI
        </h1>

        {/* Thin Laser Progress Bar with Moving Glowing Comet Tip */}
        <div className="relative w-64 sm:w-96 h-[3px] bg-white/10 rounded-full overflow-hidden shadow-2xl">
          <div
            className="h-full bg-gradient-to-r from-magenta via-magenta-deep to-violet transition-all duration-75 ease-out rounded-full relative shadow-[0_0_15px_#E8368F]"
            style={{ width: `${progress}%` }}
          >
            {/* Moving Glowing Comet Tip */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_3px_#E8368F,0_0_20px_6px_#7C5CFF]"
              style={{ transform: 'translate(50%, -50%)' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer: Left Brand Icon + Right Percentage Count */}
      <div className="relative z-10 w-full flex items-end justify-between text-[#F5F1F3]">
        {/* Left Brand Shield Logo */}
        <div className="flex items-center space-x-3 bg-bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-bg-black" />
          </div>
          <div>
            <span className="font-display text-2xl tracking-wider text-text-light block leading-none">NAARISAAKSHI</span>
            <span className="text-[9px] text-[#c9c3cc] font-mono tracking-widest uppercase block mt-0.5 font-bold">PRIVATE INCIDENT JOURNAL</span>
          </div>
        </div>

        {/* Right Percentage Loading Indicator */}
        <div className="flex items-baseline space-x-2.5 text-[#F5F1F3] font-display bg-bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-xl">
          <span className="text-2xl tracking-wider text-text-muted font-semibold">Loading</span>
          <div className="flex items-baseline text-4xl sm:text-6xl text-magenta font-bold">
            {progress >= 100 && <DigitStrip digit={hundredDigit} />}
            {(progress >= 10 || progress >= 100) && <DigitStrip digit={tenDigit} />}
            <DigitStrip digit={unitDigit} />
            <span className="text-3xl ml-0.5 text-magenta font-bold">%</span>
          </div>
        </div>
      </div>

    </div>
  );
};