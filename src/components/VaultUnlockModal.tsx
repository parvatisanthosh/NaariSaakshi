import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { StorageService } from '../storageService';

interface VaultUnlockModalProps {
  hasRecoveryCode: boolean;
  onUnlocked: (viaRecoveryCode: boolean) => void;
}

const MAX_ATTEMPTS_BEFORE_COOLDOWN = 5;
const COOLDOWN_SECONDS = 30;

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({ hasRecoveryCode, onUnlocked }) => {
  const [useRecovery, setUseRecovery] = useState(false);
  const [secret, setSecret] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The input is disabled while the key is derived, which drops focus; restore it after.
  useEffect(() => {
    if (!busy && cooldownRemaining === 0) inputRef.current?.focus();
  }, [busy, cooldownRemaining, useRecovery]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setTimeout(() => {
      setCooldownRemaining(prev => prev - 1);
      if (cooldownRemaining === 1) setFailedAttempts(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || cooldownRemaining > 0 || !secret) return;
    setBusy(true);
    setError(null);

    const ok = useRecovery
      ? await StorageService.unlockWithRecoveryCode(secret)
      : await StorageService.unlock(secret);

    setBusy(false);
    if (ok) {
      setSecret('');
      onUnlocked(useRecovery);
      return;
    }

    const failed = failedAttempts + 1;
    setFailedAttempts(failed);
    setSecret('');
    setError(useRecovery ? 'That recovery code did not match.' : 'Incorrect passphrase.');
    if (failed >= MAX_ATTEMPTS_BEFORE_COOLDOWN) setCooldownRemaining(COOLDOWN_SECONDS);
  };

  const switchMode = () => {
    setUseRecovery(prev => !prev);
    setSecret('');
    setError(null);
  };

  const disabled = busy || cooldownRemaining > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none film-grain">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta shadow-lg">
          {useRecovery ? <KeyRound className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>

        <div>
          <h1 className="font-display text-3xl tracking-wide text-text-light">PROTECTED JOURNAL</h1>
          <p className="text-xs text-text-muted mt-1">
            {useRecovery
              ? 'Enter the 25-character recovery code you saved when setting your passphrase'
              : 'Enter your passphrase to decrypt your journal on this device'}
          </p>
        </div>

        <div className="w-full relative">
          <label htmlFor="vault-secret" className="sr-only">
            {useRecovery ? 'Recovery code' : 'Passphrase'}
          </label>
          <input
            id="vault-secret"
            ref={inputRef}
            type={reveal || useRecovery ? 'text' : 'password'}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            value={secret}
            onChange={e => {
              setSecret(e.target.value);
              setError(null);
            }}
            disabled={disabled}
            placeholder={useRecovery ? 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' : 'Passphrase'}
            className={`w-full bg-white/5 border rounded-2xl px-4 py-3.5 pr-12 text-text-light placeholder:text-text-muted/60 focus:outline-none focus:border-magenta transition disabled:opacity-50 ${
              useRecovery ? 'font-mono text-sm tracking-wider uppercase' : 'text-base'
            } ${error ? 'border-magenta' : 'border-white/15'}`}
          />
          {!useRecovery && (
            <button
              type="button"
              onClick={() => setReveal(prev => !prev)}
              aria-label={reveal ? 'Hide passphrase' : 'Show passphrase'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-light transition"
            >
              {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {cooldownRemaining > 0 ? (
          <p role="alert" className="text-xs text-magenta font-semibold">
            Too many failed attempts. Please wait {cooldownRemaining}s before trying again.
          </p>
        ) : error ? (
          <p role="alert" className="text-xs text-magenta font-semibold">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={disabled || !secret}
          className="w-full py-3.5 bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider rounded-full shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center space-x-2"
        >
          {busy && <Loader2 className="w-5 h-5 animate-spin" />}
          <span>{busy ? 'UNLOCKING…' : 'UNLOCK'}</span>
        </button>

        {hasRecoveryCode && (
          <button
            type="button"
            onClick={switchMode}
            disabled={busy}
            className="text-xs font-semibold text-text-muted hover:text-magenta transition"
          >
            {useRecovery ? 'Use passphrase instead' : 'Forgot passphrase? Use recovery code'}
          </button>
        )}
      </form>
    </div>
  );
};
