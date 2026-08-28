import React, { useState } from 'react';
import { Shield, Lock, ExternalLink, Download, Upload, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { AppSettings, Incident } from '../types';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  incidents: Incident[];
  onResetSeedData: () => void;
  onClearAllData: () => void;
  onImportData: (imported: Incident[]) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  incidents,
  onResetSeedData,
  onClearAllData,
  onImportData
}) => {
  const [pinInput, setPinInput] = useState(settings.pinCode || '');
  const [quickExitUrl, setQuickExitUrl] = useState(settings.quickExitUrl || 'https://weather.com');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(incidents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EvidenceHer_Backup_${new Date().toISOString().slice(0, 10)}.json`);
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
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Security & Personal Data Control</span>
        </div>
        <h2 className="text-lg font-semibold text-charcoal-100">Privacy & App Settings</h2>
        <p className="text-xs text-charcoal-300 leading-relaxed">
          Your data is stored 100% locally in your browser. Nothing is sent to central servers without your explicit action.
        </p>
      </div>

      {statusMessage && (
        <div className="bg-teal-950/80 border border-teal-500/50 rounded-xl p-3 text-xs text-teal-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Honest Disclaimer Box (As requested in specs) */}
      <div className="bg-charcoal-800/40 border border-charcoal-700/60 rounded-2xl p-4 flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <p className="text-charcoal-300 leading-relaxed">
          <strong className="text-charcoal-200 block mb-0.5">Honest Legal Note:</strong>
          This app helps you document events clearly. It does not replace legal advice. Exported reports are structured drafts for you to review before submitting anywhere.
        </p>
      </div>

      {/* Security: PIN Lock */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-teal-400" />
            <div>
              <span className="font-semibold text-charcoal-100 block">App PIN Security Lock</span>
              <span className="text-[11px] text-charcoal-400">Require 4-digit code when opening EvidenceHer</span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.pinEnabled}
              onChange={handleTogglePin}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-charcoal-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {settings.pinEnabled && (
          <div className="pt-2 border-t border-charcoal-700/60 space-y-2">
            <label className="block text-charcoal-300 font-medium">Set 4-Digit Security PIN</label>
            <div className="flex space-x-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-32 bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-center text-base tracking-widest text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSavePin}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-xs transition"
              >
                Save PIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Exit Configuration */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ExternalLink className="w-4 h-4 text-teal-400" />
            <div>
              <span className="font-semibold text-charcoal-100 block">Quick Exit Button</span>
              <span className="text-[11px] text-charcoal-400">Instantly leaves app to neutral webpage</span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.quickExitEnabled}
              onChange={handleToggleQuickExit}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-charcoal-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {settings.quickExitEnabled && (
          <div className="pt-2 border-t border-charcoal-700/60 space-y-2">
            <label className="block text-charcoal-300 font-medium">Quick Exit Destination URL</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={quickExitUrl}
                onChange={(e) => setQuickExitUrl(e.target.value)}
                className="flex-1 bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSaveQuickExitUrl}
                className="px-4 py-2 bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium rounded-xl text-xs transition"
              >
                Save URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backup & Data Management */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-4 text-xs">
        <span className="font-semibold text-charcoal-400 uppercase tracking-wider block">Data Import / Export</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportJson}
            className="p-3 bg-charcoal-900 hover:bg-charcoal-900/80 border border-charcoal-700 rounded-xl flex items-center space-x-2 text-charcoal-200 text-left transition"
          >
            <Download className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="font-medium block">Export JSON Backup</span>
              <span className="text-[10px] text-charcoal-400">Save offline copy</span>
            </div>
          </button>

          <label className="p-3 bg-charcoal-900 hover:bg-charcoal-900/80 border border-charcoal-700 rounded-xl flex items-center space-x-2 text-charcoal-200 cursor-pointer transition">
            <Upload className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="font-medium block">Restore JSON Backup</span>
              <span className="text-[10px] text-charcoal-400">Import saved entries</span>
            </div>
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Demo Reset / Danger Zone */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 space-y-4 text-xs">
        <span className="font-semibold text-charcoal-400 uppercase tracking-wider block">Demo & Storage Reset</span>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onResetSeedData();
              showNotice('Reset timeline to sample demo incidents.');
            }}
            className="flex-1 py-2.5 px-3 bg-charcoal-900 hover:bg-charcoal-700 border border-charcoal-700 text-charcoal-200 rounded-xl font-medium flex items-center justify-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reset Demo Seed Data</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex-1 py-2.5 px-3 bg-charcoal-900 hover:bg-accent-rose/20 border border-charcoal-700 text-accent-rose rounded-xl font-medium flex items-center justify-center space-x-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Stored Logs</span>
          </button>
        </div>
      </div>

      {/* Wipe Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-accent-rose">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-semibold text-charcoal-100">Wipe All Stored Data?</h3>
            </div>
            <p className="text-xs text-charcoal-300 leading-relaxed">
              This will completely wipe all logged incidents from your local browser storage.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  showNotice('All local data wiped.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-accent-rose hover:bg-accent-rose/90 text-white font-medium text-xs transition"
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
