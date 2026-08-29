import React, { useState } from 'react';
import { Shield, Lock, ExternalLink, Download, Upload, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Info, MapPin, Globe, PhoneCall, ArrowLeft } from 'lucide-react';
import { AppSettings, Incident } from '../types';
import { LEGAL_CALL_RECORDING_INFO } from './RecordCallScreen';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  incidents: Incident[];
  onResetSeedData: () => void;
  onClearAllData: () => void;
  onClearLocationData: () => void;
  onImportData: (imported: Incident[]) => void;
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  incidents,
  onResetSeedData,
  onClearAllData,
  onClearLocationData,
  onImportData,
  onBack
}) => {
  const [pinInput, setPinInput] = useState(settings.pinCode || '');
  const [quickExitUrl, setQuickExitUrl] = useState(settings.quickExitUrl || 'https://weather.com');
  const [trustedNameInput, setTrustedNameInput] = useState(settings.trustedContactName || '');
  const [trustedPhoneInput, setTrustedPhoneInput] = useState(settings.trustedContactPhone || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveTrustedContact = () => {
    onUpdateSettings({
      ...settings,
      trustedContactName: trustedNameInput.trim(),
      trustedContactPhone: trustedPhoneInput.trim()
    });
    showNotice('Trusted contact details saved.');
  };

  const handleTogglePin = () => {
    const nextPinEnabled = !settings.pinEnabled;
    const newSettings = {
      ...settings,
      pinEnabled: nextPinEnabled,
      pinCode: nextPinEnabled ? (pinInput || '1234') : ''
    };
    onUpdateSettings(newSettings);
    showNotice(nextPinEnabled ? 'PIN lock protection activated.' : 'PIN lock disabled.');
  };

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      onUpdateSettings({ ...settings, pinCode: pinInput, pinEnabled: true });
      showNotice('PIN code updated successfully.');
    }
  };

  const handleToggleQuickExit = () => {
    const newSettings = { ...settings, quickExitEnabled: !settings.quickExitEnabled };
    onUpdateSettings(newSettings);
  };

  const handleSaveQuickExitUrl = () => {
    onUpdateSettings({ ...settings, quickExitUrl });
    showNotice('Quick Exit URL saved.');
  };

  const triggerExportJson = () => {
    setShowExportConfirm(true);
  };

  const handleConfirmExportJson = () => {
    setShowExportConfirm(false);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(incidents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `NaariSaakshi_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice('Backup JSON exported successfully.');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportData(parsed);
          showNotice(`Imported ${parsed.length} entries into timeline.`);
        }
      } catch (err) {
        showNotice('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="w-full space-y-10 pb-28 relative">
      
      {/* Top Back Navigation Button */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-magenta hover:text-magenta-deep transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Timeline</span>
          </button>
        </div>
      )}

      {/* SECTION 1: TOP HERO BANNER (High-Contrast Theme Aware) */}
      <section className="rounded-3xl bg-bg-black border border-white/10 p-8 sm:p-14 shadow-2xl relative z-10 w-full space-y-4 film-grain">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-bg-black" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-magenta uppercase block">SECURITY & PERSONAL DATA CONTROL</span>
            <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-text-light leading-none">
              PRIVACY & APP SETTINGS
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium max-w-4xl">
          Your data is stored 100% locally in your browser. Nothing is sent to central servers without your explicit action.
        </p>
      </section>

      {statusMessage && (
        <div className="bg-magenta/15 border border-magenta rounded-2xl p-4 text-xs font-bold text-magenta flex items-center space-x-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-magenta shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Honest Disclaimer Box */}
      <section className="bg-white text-cream-ink border border-black/10 rounded-3xl p-6 sm:p-8 flex items-start space-x-4 text-xs shadow-xl relative z-10 w-full">
        <Info className="w-6 h-6 text-magenta shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium text-sm">
          <strong className="font-display text-2xl tracking-wide text-cream-ink block mb-1">HONEST LEGAL NOTE</strong>
          This app helps you document events clearly. It does not replace legal advice. Exported reports are structured drafts for you to review before submitting anywhere.
        </p>
      </section>

      {/* Security: PIN Lock */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-2xl text-cream-ink tracking-wide block">APP PIN SECURITY LOCK</span>
              <span className="text-xs text-cream-ink/70 font-medium">Require 4-digit code when opening NaariSaakshi</span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.pinEnabled}
              onChange={handleTogglePin}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-cream border border-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-ink after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-magenta peer-checked:after:bg-bg-black"></div>
          </label>
        </div>

        {settings.pinEnabled && (
          <div className="pt-4 border-t border-black/10 space-y-3">
            <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Set 4-Digit Security PIN</label>
            <div className="flex space-x-3">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-36 bg-cream/40 border border-black/10 rounded-2xl px-4 py-3 text-center font-display text-2xl tracking-widest text-cream-ink focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={handleSavePin}
                className="px-6 py-3 bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider rounded-full shadow-md transition"
              >
                SAVE PIN
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Theme Mode Selector Section */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-2xl text-cream-ink tracking-wide block">VISUAL THEME & MODE</span>
            <span className="text-xs text-cream-ink/70 font-medium">Switch between Dark Mode, Light Mode, or Discreet Stealth Mode</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => {
              onUpdateSettings({ ...settings, theme: 'dark' });
              showNotice('Switched to Dark Mode theme.');
            }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between shadow-sm ${
              (settings.theme || 'dark') === 'dark'
                ? 'bg-bg-black text-text-light border-magenta shadow-md ring-2 ring-magenta/40'
                : 'bg-cream/30 hover:bg-cream text-cream-ink border-black/10'
            }`}
          >
            <div>
              <span className="font-display text-2xl block tracking-wide">DARK MODE</span>
              <span className="text-xs opacity-80 block">Dark background with magenta glows</span>
            </div>
            {(settings.theme || 'dark') === 'dark' && (
              <span className="w-3 h-3 rounded-full bg-magenta"></span>
            )}
          </button>

          <button
            onClick={() => {
              onUpdateSettings({ ...settings, theme: 'light' });
              showNotice('Switched to Light Mode theme.');
            }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between shadow-sm ${
              settings.theme === 'light'
                ? 'bg-magenta text-bg-black border-magenta font-bold shadow-lg scale-[1.01]'
                : 'bg-cream/30 hover:bg-cream text-cream-ink border-black/10'
            }`}
          >
            <div>
              <span className="font-display text-2xl block tracking-wide">LIGHT MODE</span>
              <span className="text-xs opacity-80 block">Clean cream & white high contrast</span>
            </div>
            {settings.theme === 'light' && (
              <span className="w-3 h-3 rounded-full bg-bg-black"></span>
            )}
          </button>
        </div>
      </section>
      <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-2xl text-cream-ink tracking-wide block">QUICK EXIT BUTTON</span>
              <span className="text-xs text-cream-ink/70 font-medium">Instantly leaves app to neutral webpage</span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.quickExitEnabled}
              onChange={handleToggleQuickExit}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-cream border border-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-ink after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-magenta peer-checked:after:bg-bg-black"></div>
          </label>
        </div>

        {settings.quickExitEnabled && (
          <div className="pt-4 border-t border-black/10 space-y-3">
            <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Quick Exit Destination URL</label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={quickExitUrl}
                onChange={(e) => setQuickExitUrl(e.target.value)}
                className="flex-1 bg-cream/40 border border-black/10 rounded-2xl px-4 py-3 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={handleSaveQuickExitUrl}
                className="px-6 py-3 border-2 border-magenta/60 text-magenta hover:bg-magenta hover:text-bg-black font-display font-bold text-lg tracking-wider rounded-full transition shadow-md"
              >
                SAVE URL
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Trusted Contact Configuration for SOS */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-2xl text-cream-ink tracking-wide block">TRUSTED EMERGENCY CONTACT (SOS)</span>
            <span className="text-xs text-cream-ink/70 font-medium">Add a personal contact for one-tap emergency calling and SMS location sharing</span>
          </div>
        </div>

        <div className="pt-4 border-t border-black/10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Contact Name</label>
              <input
                type="text"
                value={trustedNameInput}
                onChange={(e) => setTrustedNameInput(e.target.value)}
                placeholder="e.g. Sister, Best Friend"
                className="w-full bg-cream/40 border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={trustedPhoneInput}
                onChange={(e) => setTrustedPhoneInput(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-cream/40 border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveTrustedContact}
              className="px-8 py-3.5 bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider rounded-full shadow-lg transition"
            >
              SAVE TRUSTED CONTACT
            </button>
          </div>
        </div>
      </section>

      {/* Call Recording Legal Information Card */}
      <section className="bg-cream text-cream-ink border border-black/10 rounded-3xl p-8 space-y-3 text-xs shadow-xl relative z-10 w-full">
        <div className="flex items-center space-x-3 text-magenta font-display text-2xl tracking-wide uppercase">
          <PhoneCall className="w-5 h-5" />
          <span>CALL RECORDING & ONE-PARTY CONSENT LEGAL GUIDE</span>
        </div>

        <p className="text-cream-ink/90 font-medium leading-relaxed text-sm">
          {LEGAL_CALL_RECORDING_INFO.mainNotice}
        </p>

        <p className="text-xs text-cream-ink/70 italic border-t border-black/10 pt-3 leading-relaxed">
          {LEGAL_CALL_RECORDING_INFO.legalNotice}
        </p>
      </section>

      {/* Backup & Data Management */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
        <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">DATA IMPORT / EXPORT</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={triggerExportJson}
            className="p-5 bg-cream/30 hover:bg-cream border border-black/10 rounded-2xl flex items-center space-x-3 text-cream-ink text-left transition shadow-sm"
          >
            <Download className="w-6 h-6 text-magenta shrink-0" />
            <div>
              <span className="font-display text-xl block tracking-wide">EXPORT JSON BACKUP</span>
              <span className="text-xs text-cream-ink/70 font-medium">Save offline encrypted copy</span>
            </div>
          </button>

          <label className="p-5 bg-cream/30 hover:bg-cream border border-black/10 rounded-2xl flex items-center space-x-3 text-cream-ink cursor-pointer transition shadow-sm">
            <Upload className="w-6 h-6 text-magenta shrink-0" />
            <div>
              <span className="font-display text-xl block tracking-wide">RESTORE JSON BACKUP</span>
              <span className="text-xs text-cream-ink/70 font-medium">Import saved entries</span>
            </div>
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
          </label>
        </div>

        <div className="pt-4 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-display text-xl text-cream-ink block tracking-wide">CLEAR LOCATION COORDINATES</span>
            <span className="text-xs text-cream-ink/70 font-medium">Strips GPS coordinates from all incidents while keeping text addresses intact.</span>
          </div>
          <button
            onClick={() => {
              onClearLocationData();
              showNotice('Cleared all raw location coordinates from stored entries.');
            }}
            className="px-6 py-3 border-2 border-magenta/60 text-magenta hover:bg-magenta hover:text-bg-black font-display font-bold text-base tracking-wider rounded-full transition shadow-md shrink-0"
          >
            CLEAR LOCATION DATA
          </button>
        </div>
      </section>

      {/* Community Safety Signal Privacy Explainer Card */}
      <section className="bg-cream text-cream-ink border border-black/10 rounded-3xl p-8 space-y-4 text-xs shadow-xl relative z-10 w-full">
        <div className="flex items-center space-x-3 text-magenta font-display text-2xl tracking-wide uppercase">
          <Globe className="w-5 h-5" />
          <span>COMMUNITY SAFETY SIGNALS & PRIVACY GUARANTEE</span>
        </div>
        
        <p className="text-cream-ink/90 font-medium leading-relaxed text-sm">
          When logging an entry with location, you can choose per incident to anonymously contribute to a shared safety signal map for nearby users.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-white/80 p-5 rounded-2xl border border-black/10 space-y-2 shadow-sm">
            <span className="font-bold text-magenta text-xs uppercase tracking-wider block">✓ WHAT IS SHARED (WHEN OPTED IN)</span>
            <ul className="text-cream-ink/90 text-xs font-medium space-y-1">
              <li>• Rounded ~100m grid cell count (+1)</li>
              <li>• Broad incident category (e.g. Verbal)</li>
            </ul>
          </div>

          <div className="bg-white/80 p-5 rounded-2xl border border-black/10 space-y-2 shadow-sm">
            <span className="font-bold text-magenta text-xs uppercase tracking-wider block">✕ WHAT IS NEVER SHARED</span>
            <ul className="text-cream-ink/90 text-xs font-medium space-y-1">
              <li>• Names, people involved, witnesses</li>
              <li>• Raw narratives or summary text</li>
              <li>• User ID or device fingerprint</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-cream-ink/70 italic font-medium pt-1">
          "This shows how many people have anonymously reported something nearby — never who, never what happened. It's a safety signal, not a search tool."
        </p>
      </section>

      {/* Demo Reset / Danger Zone */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 space-y-6 text-sm shadow-xl relative z-10 w-full text-cream-ink">
        <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">DEMO & STORAGE RESET</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              onResetSeedData();
              showNotice('Reset timeline to sample demo incidents.');
            }}
            className="flex-1 py-4 px-6 bg-cream/40 hover:bg-cream border border-black/10 text-cream-ink font-display font-bold text-lg tracking-wider rounded-full transition shadow-md flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5 text-magenta" />
            <span>RESET DEMO SEED DATA</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex-1 py-4 px-6 border-2 border-magenta/60 text-magenta hover:bg-magenta hover:text-bg-black font-display font-bold text-lg tracking-wider rounded-full transition shadow-md flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-5 h-5" />
            <span>DELETE ALL STORED LOGS</span>
          </button>
        </div>
      </section>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl text-cream-ink">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="font-display text-3xl text-cream-ink leading-none">UNENCRYPTED FILE WARNING</h3>
            </div>
            <p className="text-sm text-cream-ink/80 leading-relaxed font-medium">
              This file will be saved to your device without encryption. Make sure to store or delete it somewhere safe.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowExportConfirm(false)}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExportJson}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md"
              >
                ACKNOWLEDGE & SAVE FILE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl text-cream-ink">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="font-display text-3xl text-cream-ink leading-none">WIPE ALL STORED DATA?</h3>
            </div>
            <p className="text-sm text-cream-ink/80 leading-relaxed font-medium">
              This will completely wipe all logged incidents from your local browser storage.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  showNotice('All local data wiped.');
                }}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md"
              >
                YES, WIPE EVERYTHING
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};