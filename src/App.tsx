import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import { ActiveTab, Navigation } from './components/Navigation';
import { PinLockModal } from './components/PinLockModal';
import { SosPanelModal } from './components/SosPanelModal';
import { QuickCaptureScreen } from './components/QuickCaptureScreen';
import { RecordCallScreen } from './components/RecordCallScreen';
import { ChatbotModal } from './components/ChatbotModal';
import { RightsScreen } from './components/RightsScreen';
import { TimelineScreen } from './components/TimelineScreen';
import { LogIncidentScreen } from './components/LogIncidentScreen';
import { IncidentDetailScreen } from './components/IncidentDetailScreen';
import { PatternsScreen } from './components/PatternsScreen';
import { ReportScreen } from './components/ReportScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { StorageService } from './storageService';
import { AppSettings, Incident } from './types';
import { analyzeIncidentPatterns } from './aiEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Security PIN lock state, SOS panel state & Chatbot state
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showSosPanel, setShowSosPanel] = useState<boolean>(false);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);

  // Pattern Alert Banner state
  const [patternBanner, setPatternBanner] = useState<{
    text: string;
    key: string;
  } | null>(null);
  const bannerTimerRef = useRef<any | null>(null);

  // Auto-lock on inactivity (3 mins) or tab loss of focus (> 30s)
  const blurTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Load initial storage data
    const loadInitialData = async () => {
      const loadedSettings = StorageService.getSettings();
      setSettings(loadedSettings);

      if (loadedSettings.pinEnabled && loadedSettings.pinCode) {
        setIsLocked(true);
      }

      const loadedIncidents = await StorageService.getIncidents();
      setIncidents(loadedIncidents);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    // Only set up auto-lock if PIN is enabled, PIN code exists, and app is currently unlocked
    if (!settings.pinEnabled || !settings.pinCode || isLocked) {
      return;
    }

    const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
    const BLUR_TIMEOUT_MS = 30 * 1000; // 30 seconds

    let inactivityTimer: any = null;
    let blurTimer: any = null;

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        blurTimeRef.current = Date.now();
        if (blurTimer) clearTimeout(blurTimer);
        blurTimer = setTimeout(() => {
          setIsLocked(true);
        }, BLUR_TIMEOUT_MS);
      } else {
        if (blurTimer) clearTimeout(blurTimer);
        if (blurTimeRef.current && Date.now() - blurTimeRef.current >= BLUR_TIMEOUT_MS) {
          setIsLocked(true);
        }
        blurTimeRef.current = null;
        resetInactivityTimer();
      }
    };

    const handleWindowBlur = () => {
      if (!blurTimeRef.current) {
        blurTimeRef.current = Date.now();
      }
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        setIsLocked(true);
      }, BLUR_TIMEOUT_MS);
    };

    const handleWindowFocus = () => {
      if (blurTimer) clearTimeout(blurTimer);
      if (blurTimeRef.current && Date.now() - blurTimeRef.current >= BLUR_TIMEOUT_MS) {
        setIsLocked(true);
      }
      blurTimeRef.current = null;
      resetInactivityTimer();
    };

    // Initial start of inactivity timer
    resetInactivityTimer();

    // Listeners for user activity
    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity));

    // Listeners for visibility and focus/blur
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (blurTimer) clearTimeout(blurTimer);
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [settings.pinEnabled, settings.pinCode, isLocked]);

  // Save Incident Handler
  const handleSaveIncident = async (newIncident: Incident) => {
    const previousAnalysis = analyzeIncidentPatterns(incidents);
    const updatedList = await StorageService.addIncident(newIncident);
    setIncidents(updatedList);
    setActiveTab('timeline');

    // Check for newly crossed pattern threshold (count >= 2)
    const newAnalysis = analyzeIncidentPatterns(updatedList);
    const newMatchingCluster = newAnalysis.clusters.find(nc => {
      const prevCluster = previousAnalysis.clusters.find(pc => pc.key === nc.key && pc.type === nc.type);
      const prevCount = prevCluster ? prevCluster.count : 0;
      return nc.count >= 2 && prevCount < nc.count;
    });

    if (newMatchingCluster) {
      const bannerMsg = `This is the ${newMatchingCluster.count}th incident involving '${newMatchingCluster.key}'`;
      setPatternBanner({
        text: bannerMsg,
        key: newMatchingCluster.key
      });

      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setPatternBanner(null);
      }, 8000);
    }
  };

  const handleSaveQuickCaptureDraft = async (newDraft: Incident) => {
    const updatedList = await StorageService.addIncident(newDraft);
    setIncidents(updatedList);
    setActiveTab('timeline');
  };

  // Update Incident Handler
  const handleUpdateIncident = async (updated: Incident) => {
    const updatedList = await StorageService.updateIncident(updated);
    setIncidents(updatedList);
    setSelectedIncident(updated);
  };

  // Delete Incident Handler
  const handleDeleteIncident = async (id: string) => {
    const updatedList = await StorageService.deleteIncident(id);
    setIncidents(updatedList);
    setSelectedIncident(null);
  };

  // Settings Handlers
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    const saved = StorageService.saveSettings(newSettings);
    setSettings(saved);
    if (incidents.length > 0) {
      await StorageService.saveIncidents(incidents);
    }
  };

  const handleResetSeedData = async () => {
    const seeded = await StorageService.resetToSeedData();
    setIncidents(seeded);
    setSelectedIncident(null);
  };

  const handleClearAllData = async () => {
    const empty = await StorageService.clearAllData();
    setIncidents(empty);
    setSelectedIncident(null);
  };

  const handleClearLocationData = async () => {
    const updated = await StorageService.clearAllLocationData();
    setIncidents(updated);
  };

  const handleImportData = async (imported: Incident[]) => {
    await StorageService.saveIncidents(imported);
    setIncidents(imported);
  };

  return (
    <div className="min-h-screen bg-charcoal-900 text-charcoal-100 flex flex-col font-sans selection:bg-teal-700 selection:text-white">
      
      {/* PIN Security Modal */}
      {isLocked && settings.pinEnabled && (
        <PinLockModal
          correctPin={settings.pinCode}
          onSuccess={() => setIsLocked(false)}
        />
      )}

      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedIncident(null);
          setActiveTab(tab);
        }}
        quickExitEnabled={settings.quickExitEnabled}
        quickExitUrl={settings.quickExitUrl}
        onOpenSos={() => setShowSosPanel(true)}
        onOpenQuickCapture={() => {
          setSelectedIncident(null);
          setActiveTab('quick-capture');
        }}
        onOpenChatbot={() => setShowChatbot(true)}
      />

      {/* Emergency SOS Panel Modal */}
      <SosPanelModal
        isOpen={showSosPanel}
        onClose={() => setShowSosPanel(false)}
        trustedName={settings.trustedContactName}
        trustedPhone={settings.trustedContactPhone}
        onOpenSettings={() => {
          setSelectedIncident(null);
          setActiveTab('settings');
        }}
      />

      {/* Grounded Guidance Chatbot Modal */}
      <ChatbotModal
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        onOpenSos={() => setShowSosPanel(true)}
      />

      {/* Pattern Threshold Crossing Notification Banner */}
      {patternBanner && (
        <div className="sticky top-14 z-40 bg-gradient-to-r from-plum-950 via-charcoal-800 to-teal-950 border-b border-plum-500/40 px-4 py-3 shadow-xl transition-all">
          <div className="max-w-3xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-plum-900/80 border border-plum-400/50 flex items-center justify-center text-plum-300 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-medium text-charcoal-100">{patternBanner.text}</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  setActiveTab('patterns');
                  setPatternBanner(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center space-x-1 shadow-md transition"
              >
                <span>View Pattern</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPatternBanner(null)}
                className="p-1 text-charcoal-400 hover:text-charcoal-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Body View */}
      <main className="flex-1 max-w-3xl w-full mx-auto">
        {selectedIncident ? (
          <IncidentDetailScreen
            incident={selectedIncident}
            allIncidents={incidents}
            onUpdate={handleUpdateIncident}
            onDelete={handleDeleteIncident}
            onBack={() => setSelectedIncident(null)}
          />
        ) : (
          <>
            {activeTab === 'timeline' && (
              <TimelineScreen
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onLogNew={() => setActiveTab('log')}
                onRecordCall={() => setActiveTab('record-call')}
                onViewPatterns={() => setActiveTab('patterns')}
              />
            )}

            {activeTab === 'quick-capture' && (
              <QuickCaptureScreen
                onSaveQuickCapture={handleSaveQuickCaptureDraft}
                onCancel={() => setActiveTab('timeline')}
                trustedContactName={settings.trustedContactName}
                trustedContactPhone={settings.trustedContactPhone}
              />
            )}

            {activeTab === 'record-call' && (
              <RecordCallScreen
                onSaveCallIncident={handleSaveIncident}
                onCancel={() => setActiveTab('timeline')}
              />
            )}

            {activeTab === 'log' && (
              <LogIncidentScreen
                onSaveIncident={handleSaveIncident}
                onCancel={() => setActiveTab('timeline')}
              />
            )}

            {activeTab === 'patterns' && (
              <PatternsScreen
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onGenerateReport={() => setActiveTab('report')}
                onBack={() => setActiveTab('timeline')}
              />
            )}

            {activeTab === 'report' && (
              <ReportScreen
                incidents={incidents}
                onBack={() => setActiveTab('timeline')}
              />
            )}

            {activeTab === 'rights' && (
              <RightsScreen
                onOpenSos={() => setShowSosPanel(true)}
                onBack={() => setActiveTab('timeline')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                incidents={incidents}
                onResetSeedData={handleResetSeedData}
                onClearAllData={handleClearAllData}
                onClearLocationData={handleClearLocationData}
                onImportData={handleImportData}
                onBack={() => setActiveTab('timeline')}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
};
