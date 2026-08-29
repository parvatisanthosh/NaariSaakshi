import React, { useState, useEffect } from 'react';
import { Lock, EyeOff, ShieldCheck } from 'lucide-react';

interface PinLockModalProps {
  correctPin: string;
  onSuccess: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ correctPin, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownRemaining]);

  const handleKeyPress = (num: string) => {
    if (cooldownRemaining > 0) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          setFailedAttempts(0);
          onSuccess();
        } else {
          setTimeout(() => {
            const newFailed = failedAttempts + 1;
            setFailedAttempts(newFailed);
            setError(true);
            setPin('');
            if (newFailed >= 5) {
              setCooldownRemaining(30);
            }
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (cooldownRemaining > 0) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const isKeypadDisabled = cooldownRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 bg-bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none film-grain">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta shadow-lg">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h1 className="font-display text-3xl tracking-wide text-text-light">PROTECTED JOURNAL</h1>
          <p className="text-xs text-text-muted mt-1">Enter 4-digit security PIN to unlock</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex space-x-4 my-4">
          {[0, 1, 2, 3].map(index => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                index < pin.length
                  ? 'bg-magenta border-magenta shadow-md scale-110'
                  : 'bg-white/5 border-white/20'
              } ${error ? 'bg-magenta border-magenta animate-bounce' : ''}`}
            />
          ))}
        </div>

        {cooldownRemaining > 0 ? (
          <p className="text-xs text-magenta font-semibold animate-shake">
            Too many failed attempts. Please wait {cooldownRemaining}s before trying again.
          </p>
        ) : error ? (
          <p className="text-xs text-magenta font-semibold animate-shake">Incorrect PIN</p>
        ) : null}

        {/* Keypad */}
        <div className={`grid grid-cols-3 gap-4 w-full max-w-[280px] pt-2 ${isKeypadDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isKeypadDisabled}
              className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-magenta/30 text-text-light font-display text-3xl flex items-center justify-center mx-auto transition border border-white/10 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16"></div>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isKeypadDisabled}
            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-magenta/30 text-text-light font-display text-3xl flex items-center justify-center mx-auto transition border border-white/10 disabled:cursor-not-allowed"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isKeypadDisabled}
            className="w-16 h-16 rounded-full bg-transparent hover:bg-white/5 text-text-muted hover:text-text-light flex items-center justify-center mx-auto transition disabled:cursor-not-allowed"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
