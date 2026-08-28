import React, { useState } from 'react';
import { Lock, EyeOff, ShieldCheck } from 'lucide-react';

interface PinLockModalProps {
  correctPin: string;
  onSuccess: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ correctPin, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onSuccess();
        } else {
          setTimeout(() => {
            setError(true);
            setPin('');
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-teal-900/40 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-charcoal-100 tracking-tight">Protected Journal</h2>
          <p className="text-sm text-charcoal-400 mt-1">Enter 4-digit security PIN to unlock</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex space-x-4 my-4">
          {[0, 1, 2, 3].map(index => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                index < pin.length
                  ? 'bg-teal-400 border-teal-300 shadow-md shadow-teal-500/20 scale-110'
                  : 'bg-charcoal-800 border-charcoal-700'
              } ${error ? 'bg-accent-rose border-accent-rose animate-bounce' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-accent-rose font-medium animate-shake">Incorrect PIN. Please try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-charcoal-800/80 hover:bg-charcoal-700 active:bg-teal-800/50 text-charcoal-100 font-medium text-2xl flex items-center justify-center mx-auto transition border border-charcoal-700/50"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16"></div>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-charcoal-800/80 hover:bg-charcoal-700 active:bg-teal-800/50 text-charcoal-100 font-medium text-2xl flex items-center justify-center mx-auto transition border border-charcoal-700/50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-charcoal-800/40 hover:bg-charcoal-800 text-charcoal-400 hover:text-charcoal-200 flex items-center justify-center mx-auto transition"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
