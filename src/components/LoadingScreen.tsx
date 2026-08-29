import React, { useState, useEffect, useRef } from 'react';

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
      className={`fixed inset-0 z-[100] bg-[#0D0B10] flex flex-col justify-between items-center py-10 select-none overflow-hidden transition-all duration-[750ms] film-grain ${
        isExiting ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{
        transitionTimingFunction: isExiting ? 'cubic-bezier(0.65, 0, 0.35, 1)' : 'ease-out',
        ...(isReducedMotion && isExiting ? { transitionDuration: '300ms', transform: 'none' } : {}),
      }}
    >
      {/* CSS Keyframes for Radar Pulse Rings */}
      <style>{`
        @keyframes radar-pulse {
          0% {
            width: 40px;
            height: 40px;
            opacity: 0.8;
          }
          100% {
            width: 280px;
            height: 280px;
            opacity: 0;
          }
        }
        .animate-radar {
          animation: radar-pulse 2.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>

      {/* Brand wordmark fixed near top */}
      <div className="font-display tracking-[0.2em] text-lg text-[#c9c3cc]">
        NAARISAAKSHI
      </div>

      {/* Center section: Radar pulse rings + Percentage Counter + Progress Bar */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Radar Pulse Rings */}
        {!isReducedMotion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute rounded-full border border-[rgba(232,54,143,0.5)] animate-radar"
              style={{ animationDelay: '0s' }}
            />
            <div
              className="absolute rounded-full border border-[rgba(232,54,143,0.5)] animate-radar"
              style={{ animationDelay: '0.8s' }}
            />
            <div
              className="absolute rounded-full border border-[rgba(232,54,143,0.5)] animate-radar"
              style={{ animationDelay: '1.6s' }}
            />
          </div>
        )}

        {/* Digit-roll percentage counter */}
        <div className="relative z-10 flex items-baseline text-[#E8368F] font-display text-[clamp(64px,10vw,88px)] leading-none mb-6">
          <div className="flex items-center">
            {progress >= 100 && <DigitStrip digit={hundredDigit} />}
            {(progress >= 10 || progress >= 100) && <DigitStrip digit={tenDigit} />}
            <DigitStrip digit={unitDigit} />
          </div>
          <span className="text-[0.4em] ml-1 self-start font-normal text-[#E8368F]/80">%</span>
        </div>

        {/* Comet progress line */}
        <div className="relative w-[200px] h-[2px] bg-white/10 rounded-full z-10">
          <div
            className="h-full bg-[#E8368F] transition-all duration-75 ease-out rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            {/* Glowing dot tip */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#E8368F]"
              style={{
                boxShadow: '0 0 8px 2px #E8368F, 0 0 12px 4px #7C5CFF',
                transform: 'translate(50%, -50%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tagline fixed near bottom */}
      <div className="font-display tracking-[0.2em] text-xs text-[#c9c3cc]/60">
        STAY ALERT. STAY SAFE.
      </div>
    </div>
  );
};
