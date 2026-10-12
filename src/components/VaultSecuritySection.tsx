import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, HardDrive, Loader2, Lock, ShieldCheck, ShieldOff } from 'lucide-react';
import { StorageService, StorageUsageInfo } from '../storageService';
import type { VaultStatus } from '../vault/vault';

interface VaultSecuritySectionProps {
  vaultStatus: VaultStatus | null;
  onVaultChanged: () => void;
  onLockNow: () => void;
}

export const MIN_PASSPHRASE_LENGTH = 8;

type Panel = 'idle' | 'set' | 'recovery' | 'confirm-remove';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export const VaultSecuritySection: React.FC<VaultSecuritySectionProps> = ({ vaultStatus, onVaultChanged, onLockNow }) => {
  const [panel, setPanel] = useState<Panel>('idle');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<StorageUsageInfo>(StorageService.getStorageUsageInfo());

  useEffect(() => {
    StorageService.refreshStorageEstimate().then(setUsage);
  }, []);

  if (!vaultStatus) return null;
  const isProtected = vaultStatus.mode === 'passphrase';

  const resetForm = () => {
    setPassphrase('');
    setConfirm('');
    setError(null);
  };

  const handleSetPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`Use at least ${MIN_PASSPHRASE_LENGTH} characters. A few unrelated words is easiest to remember.`);
      return;
    }
    if (passphrase !== confirm) {
      setError('The two passphrases do not match.');
      return;
    }
    setBusy(true);
    try {
      const code = await StorageService.setPassphrase(passphrase);
      resetForm();
      setRecoveryCode(code);
      setSavedAck(false);
      setPanel('recovery');
      onVaultChanged();
    } catch (err) {
      console.error('Failed to set passphrase:', err);
      setError('Could not update the vault. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemovePassphrase = async () => {
    setBusy(true);
    try {
      await StorageService.removePassphrase();
      setPanel('idle');
      onVaultChanged();
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the code is still visible to write down.
    }
  };

  const inputClass =
    'w-full bg-cream/40 border border-black/10 rounded-2xl px-4 py-3 text-cream-ink focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner';

  return (
    <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <span className="font-display text-2xl text-cream-ink tracking-wide block">JOURNAL ENCRYPTION & LOCK</span>
          <span className="text-xs text-cream-ink/70 font-medium">
            Entries and media are encrypted (AES-256-GCM) in this browser's storage
          </span>
        </div>
      </div>

      {/* Current protection status */}
      {isProtected ? (
        <div className="flex items-start space-x-3 p-4 rounded-2xl bg-cream/60 border border-black/10">
          <ShieldCheck className="w-5 h-5 text-magenta shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Locked with your passphrase</p>
            <p className="text-xs text-cream-ink/75 leading-relaxed">
              The key that opens your journal is never stored on this device. It locks after 3 minutes of
              inactivity or 30 seconds in the background.
              {vaultStatus.hasRecoveryCode ? ' A recovery code can also unlock it.' : ' No recovery code is set.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start space-x-3 p-4 rounded-2xl bg-magenta/10 border border-magenta/30">
          <ShieldOff className="w-5 h-5 text-magenta shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Not locked</p>
            <p className="text-xs text-cream-ink/75 leading-relaxed">
              Your journal is encrypted on disk, but the key is kept in this browser so it opens without a
              passphrase. Anyone who can open this browser can read it. Set a passphrase to lock it.
            </p>
          </div>
        </div>
      )}

      {isProtected && vaultStatus.weakPassphrase && (
        <div className="flex items-start space-x-3 p-4 rounded-2xl bg-magenta/10 border border-magenta/30">
          <AlertTriangle className="w-5 h-5 text-magenta shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            <strong>You're still using your old 4-digit PIN.</strong> Someone with this device could guess it.
            Change it to a passphrase of at least {MIN_PASSPHRASE_LENGTH} characters and you'll also get a recovery code.
          </p>
        </div>
      )}

      {/* Actions */}
      {panel === 'idle' && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { resetForm(); setPanel('set'); }}
            className="px-6 py-2.5 bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-sm tracking-wider rounded-full shadow-md transition"
          >
            {isProtected ? 'CHANGE PASSPHRASE' : 'SET A PASSPHRASE'}
          </button>
          {isProtected && (
            <>
              <button
                onClick={onLockNow}
                className="px-6 py-2.5 border-2 border-magenta/60 text-magenta hover:bg-magenta hover:text-bg-black font-display font-bold text-sm tracking-wider rounded-full transition"
              >
                LOCK NOW
              </button>
              <button
                onClick={() => setPanel('confirm-remove')}
                className="px-4 py-2.5 text-xs font-semibold text-cream-ink/60 hover:text-magenta transition"
              >
                Remove passphrase
              </button>
            </>
          )}
        </div>
      )}

      {panel === 'set' && (
        <form onSubmit={handleSetPassphrase} className="pt-4 border-t border-black/10 space-y-3">
          <label htmlFor="new-passphrase" className="block font-bold text-xs uppercase tracking-wider">
            New passphrase
          </label>
          <input
            id="new-passphrase"
            type="password"
            autoComplete="new-password"
            value={passphrase}
            onChange={e => { setPassphrase(e.target.value); setError(null); }}
            className={inputClass}
          />
          <label htmlFor="confirm-passphrase" className="block font-bold text-xs uppercase tracking-wider">
            Type it again
          </label>
          <input
            id="confirm-passphrase"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(null); }}
            className={inputClass}
          />
          <p className="text-xs text-cream-ink/70 leading-relaxed">
            There is no "forgot password" email. If you lose both this passphrase and the recovery code shown next,
            nobody (including us) can open the journal.
          </p>
          {error && <p role="alert" className="text-xs text-magenta font-semibold">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-sm tracking-wider rounded-full shadow-md transition disabled:opacity-50 inline-flex items-center space-x-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{busy ? 'ENCRYPTING…' : 'SAVE PASSPHRASE'}</span>
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setPanel('idle'); }}
              disabled={busy}
              className="px-4 py-2.5 text-xs font-semibold text-cream-ink/60 hover:text-magenta transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {panel === 'recovery' && recoveryCode && (
        <div className="pt-4 border-t border-black/10 space-y-4">
          <p className="font-bold">Save your recovery code</p>
          <p className="text-xs text-cream-ink/75 leading-relaxed">
            This is the only way back in if you forget your passphrase. Write it on paper and keep it somewhere
            only you can reach. It will not be shown again.
          </p>
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-cream border border-black/10">
            <code className="font-mono text-base sm:text-lg tracking-wider break-all">{recoveryCode}</code>
            <button
              onClick={handleCopy}
              aria-label="Copy recovery code"
              className="p-2 rounded-xl hover:bg-white transition shrink-0"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-magenta" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={savedAck}
              onChange={e => setSavedAck(e.target.checked)}
              className="mt-0.5 rounded border-black/20 text-magenta focus:ring-magenta"
            />
            <span className="text-xs font-medium">I've written this code down somewhere safe</span>
          </label>
          <button
            disabled={!savedAck}
            onClick={() => { setRecoveryCode(null); setPanel('idle'); }}
            className="px-6 py-2.5 bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-sm tracking-wider rounded-full shadow-md transition disabled:opacity-40"
          >
            DONE
          </button>
        </div>
      )}

      {panel === 'confirm-remove' && (
        <div className="pt-4 border-t border-black/10 space-y-3">
          <p className="text-xs leading-relaxed">
            Without a passphrase, anyone who can open this browser can read your journal. Remove it anyway?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRemovePassphrase}
              disabled={busy}
              className="px-6 py-2.5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-bg-black font-display font-bold text-sm tracking-wider rounded-full transition disabled:opacity-50"
            >
              REMOVE PASSPHRASE
            </button>
            <button
              onClick={() => setPanel('idle')}
              className="px-4 py-2.5 text-xs font-semibold text-cream-ink/60 hover:text-magenta transition"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {/* Storage durability */}
      <div className="pt-4 border-t border-black/10 flex items-start space-x-3 text-xs text-cream-ink/75">
        <HardDrive className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Using {formatBytes(usage.usedBytes)}
          {usage.quotaBytes !== null && <> of about {formatBytes(usage.quotaBytes)} available to this site</>}.{' '}
          {usage.persisted === true
            ? 'The browser has agreed not to clear this data when space runs low.'
            : 'The browser may clear site data when the device runs low on space, so export backups regularly.'}{' '}
          Clearing this site's data in browser settings deletes the journal.
        </p>
      </div>
    </section>
  );
};
