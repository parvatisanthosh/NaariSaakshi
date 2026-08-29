import React, { useState } from 'react';
import { Shield, Lock, ExternalLink, Download, Upload, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Info, MapPin, Globe, PhoneCall } from 'lucide-react';
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
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  incidents,
  onResetSeedData,
  onClearAllData,
  onClearLocationData,
  onImportData
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Title */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-5 shadow-sm space-y-2 film-grain">
        <div className="flex items-center space-x-2 text-magenta font-display text-lg tracking-wide uppercase">
          <Shield className="w-5 h-5" />
          <span>SECURITY & PERSONAL DATA CONTROL</span>
        </div>
        <h2 className="font-display text-3xl text-text-light">PRIVACY & APP SETTINGS</h2>
        <p className="text-xs text-text-muted leading-relaxed">
          Your data is stored 100% locally in your browser. Nothing is sent to central servers without your explicit action.
        </p>
      </div>

      {statusMessage && (
        <div className="bg-white/5 border border-magenta/40 rounded-xl p-3.5 text-xs text-magenta flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-magenta shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Honest Disclaimer Box */}
      <div className="bg-cream text-cream-ink border border-cream-ink/10 rounded-2xl p-4 flex items-start space-x-3 text-xs shadow-md">
        <Info className="w-5 h-5 text-magenta shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-display text-base tracking-wide block mb-0.5">HONEST LEGAL NOTE</strong>
          This app helps you document events clearly. It does not replace legal advice. Exported reports are structured drafts for you to review before submitting anywhere.
        </p>
      </div>

      {/* Security: PIN Lock */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-magenta" />
            <div>
              <span className="font-semibold text-text-light block">App PIN Security Lock</span>
              <span className="text-[11px] text-text-muted">Require 4-digit code when opening NaariSaakshi</span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.pinEnabled}
              onChange={handleTogglePin}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-light after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-magenta"></div>
          </label>
        </div>

        {settings.pinEnabled && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="block text-text-muted font-semibold">Set 4-Digit Security PIN</label>
            <div className="flex space-x-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-base tracking-widest text-text-light focus:outline-none focus:border-magenta"
              />
              <button
                onClick={handleSavePin}
                className="px-5 py-2 bg-magenta hover:bg-magenta-deep text-bg-black font-semibold rounded-full text-xs uppercase tracking-wider transition"
              >
                Save PIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Exit Configuration */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ExternalLink className="w-4 h-4 text-magenta" />
            <div>
              <span className="font-semibold text-text-light block">Quick Exit Button</span>
              <span className="text-[11px] text-text-muted">Instantly leaves app to neutral webpage</span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.quickExitEnabled}
              onChange={handleToggleQuickExit}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-light after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-magenta"></div>
          </label>
        </div>

        {settings.quickExitEnabled && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="block text-text-muted font-semibold">Quick Exit Destination URL</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={quickExitUrl}
                onChange={(e) => setQuickExitUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-text-light focus:outline-none focus:border-magenta"
              />
              <button
                onClick={handleSaveQuickExitUrl}
                className="px-5 py-2 border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold rounded-full text-xs uppercase tracking-wider transition"
              >
                Save URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trusted Contact Configuration for SOS */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center space-x-2.5">
          <PhoneCall className="w-4 h-4 text-rose-400" />
          <div>
            <span className="font-semibold text-charcoal-100 block">Trusted Emergency Contact (SOS Panel)</span>
            <span className="text-[11px] text-charcoal-400">Add a personal contact for one-tap emergency calling and SMS location sharing</span>
          </div>
        </div>

        <div className="pt-2 border-t border-charcoal-700/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-charcoal-300 font-medium mb-1">Contact Name</label>
              <input
                type="text"
                value={trustedNameInput}
                onChange={(e) => setTrustedNameInput(e.target.value)}
                placeholder="e.g. Sister, Best Friend"
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-charcoal-300 font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={trustedPhoneInput}
                onChange={(e) => setTrustedPhoneInput(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveTrustedContact}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-xs transition"
            >
              Save Trusted Contact
            </button>
          </div>
        </div>
      </div>

      {/* Call Recording Legal Information & Consent Card */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-3 text-xs">
        <div className="flex items-center space-x-2.5 text-teal-400 font-semibold uppercase tracking-wider">
          <PhoneCall className="w-4 h-4" />
          <span>About Call Recording & One-Party Consent</span>
        </div>

        <p className="text-charcoal-200 leading-relaxed">
          {LEGAL_CALL_RECORDING_INFO.mainNotice}
        </p>

        <p className="text-[11px] text-charcoal-400 italic border-t border-charcoal-700/60 pt-2 leading-relaxed">
          {LEGAL_CALL_RECORDING_INFO.legalNotice}
        </p>
      </div>

      {/* Backup & Data Management */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
        <span className="font-display tracking-wider text-text-muted uppercase block">Data Import / Export</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={triggerExportJson}
            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center space-x-2 text-text-light text-left transition"
          >
            <Download className="w-4 h-4 text-magenta shrink-0" />
            <div>
              <span className="font-semibold block">Export JSON Backup</span>
              <span className="text-[10px] text-text-muted">Save offline copy</span>
            </div>
          </button>

          <label className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center space-x-2 text-text-light cursor-pointer transition">
            <Upload className="w-4 h-4 text-magenta shrink-0" />
            <div>
              <span className="font-semibold block">Restore JSON Backup</span>
              <span className="text-[10px] text-text-muted">Import saved entries</span>
            </div>
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
          </label>
        </div>

        <div className="pt-3 border-t border-charcoal-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-charcoal-200 block">Clear Location Coordinates</span>
            <span className="text-[11px] text-charcoal-400">Strips GPS coordinates from all incidents while keeping text addresses intact.</span>
          </div>
          <button
            onClick={() => {
              onClearLocationData();
              showNotice('Cleared all raw location coordinates from stored entries.');
            }}
            className="px-3 py-2 bg-charcoal-900 hover:bg-charcoal-700 border border-charcoal-700 text-amber-300 rounded-xl font-medium flex items-center justify-center space-x-1.5 transition text-xs shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Clear Location Data</span>
          </button>
        </div>
      </div>

      {/* Community Safety Signal Privacy Explainer Card */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-3 text-xs">
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>Community Safety Signals & Privacy</span>
        </div>
        
        <p className="text-charcoal-300 leading-relaxed">
          When logging an entry with location, you can choose per incident to anonymously contribute to a shared safety signal map for nearby users.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-charcoal-900/80 p-3 rounded-xl border border-teal-500/30 space-y-1">
            <span className="font-semibold text-teal-300 block">✓ What IS Shared (When Opted In)</span>
            <ul className="text-charcoal-300 text-[11px] space-y-0.5">
              <li>• Rounded ~100m grid cell count (+1)</li>
              <li>• Broad incident category (e.g. Verbal)</li>
            </ul>
          </div>

          <div className="bg-charcoal-900/80 p-3 rounded-xl border border-rose-500/30 space-y-1">
            <span className="font-semibold text-rose-300 block">✕ What IS NEVER Shared</span>
            <ul className="text-charcoal-300 text-[11px] space-y-0.5">
              <li>• Names, people involved, witnesses</li>
              <li>• Raw narratives or summary text</li>
              <li>• User ID or device fingerprint</li>
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-charcoal-400 italic">
          "This shows how many people have anonymously reported something nearby — never who, never what happened. It's a safety signal, not a search tool."
        </p>
      </div>

      {/* Demo Reset / Danger Zone */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
        <span className="font-display tracking-wider text-text-muted uppercase block">Demo & Storage Reset</span>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onResetSeedData();
              showNotice('Reset timeline to sample demo incidents.');
            }}
            className="flex-1 py-3 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-text-light rounded-full font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-magenta" />
            <span>Reset Demo Seed Data</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex-1 py-3 px-3 border border-magenta/50 text-magenta hover:bg-magenta/10 rounded-full font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Stored Logs</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bg-black border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl film-grain">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-display text-2xl text-text-light">UNENCRYPTED FILE WARNING</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              This file will be saved to your device without encryption. Make sure to store or delete it somewhere safe.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowExportConfirm(false)}
                className="flex-1 py-3 rounded-full border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExportJson}
                className="flex-1 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold text-xs uppercase tracking-wider transition"
              >
                Acknowledge & Save File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bg-black border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl film-grain">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-display text-2xl text-text-light">WIPE ALL STORED DATA?</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              This will completely wipe all logged incidents from your local browser storage.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-full border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  showNotice('All local data wiped.');
                }}
                className="flex-1 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold text-xs uppercase tracking-wider transition"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
