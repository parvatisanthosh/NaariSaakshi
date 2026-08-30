import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ArrowRight, X, CheckCircle2 } from 'lucide-react';
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
import { FAQScreen } from './components/FAQScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { StorageService } from './storageService';
import { AppSettings, Incident } from './types';
import { analyzeIncidentPatterns } from './aiEngine';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Security PIN lock state, SOS panel state & Chatbot state
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showSosPanel, setShowSosPanel] = useState<boolean>(false);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);

  // Pattern Alert Banner & Toast Notice state
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const toastTimerRef = useRef<any | null>(null);
  const [patternBanner, setPatternBanner] = useState<{
    text: string;
    key: string;
  } | null>(null);
  const bannerTimerRef = useRef<any | null>(null);

  // Auto-lock on inactivity (3 mins) or tab loss of focus (> 30s)
  const blurTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Sync theme settings to document body
    const currentTheme = settings.theme || 'dark';
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-stealth');
    document.body.classList.add(`theme-${currentTheme}`);
    document.body.setAttribute('data-theme', currentTheme);
  }, [settings.theme]);

  useEffect(() => {
    // Scroll window to top whenever active tab or selected incident changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab, selectedIncident]);

  // Browser History & Native Back Button Integration
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        if (e.state.selectedIncidentId) {
          const found = incidents.find(i => i.id === e.state.selectedIncidentId);
          setSelectedIncident(found || null);
        } else {
          setSelectedIncident(null);
        }
        if (e.state.activeTab) {
          setActiveTab(e.state.activeTab);
        }
      } else {
        setSelectedIncident(null);
        setActiveTab('timeline');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [incidents]);

  const handleSelectIncident = (inc: Incident | null) => {
    setSelectedIncident(inc);
    if (inc) {
      window.history.pushState({ activeTab, selectedIncidentId: inc.id }, '', `#incident-${inc.id}`);
    } else {
      window.history.pushState({ activeTab, selectedIncidentId: null }, '', `#${activeTab}`);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setSelectedIncident(null);
    setActiveTab(tab);
    window.history.pushState({ activeTab: tab, selectedIncidentId: null }, '', `#${tab}`);
  };

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
  const handleSaveIncident = async (savedIncident: Incident) => {
    const previousAnalysis = analyzeIncidentPatterns(incidents);
    const exists = incidents.some(i => i.id === savedIncident.id);
    let updatedList: Incident[];
    if (exists) {
      updatedList = await StorageService.updateIncident(savedIncident);
    } else {
      updatedList = await StorageService.addIncident(savedIncident);
    }
    setIncidents(updatedList);
    setSelectedIncident(null);
    setActiveTab('timeline');
    triggerToast(exists ? 'Draft completed and saved to Timeline!' : 'New incident logged successfully!');

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

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastNotice(null);
    }, 2500);
  };

  const handleSaveQuickCaptureDraft = async (newDraft: Incident, toastMessage?: string) => {
    const updatedList = await StorageService.addIncident(newDraft);
    setIncidents(updatedList);
    setActiveTab('timeline');
    if (toastMessage) {
      triggerToast(toastMessage);
    } else {
      triggerToast('Quick Capture entry saved to timeline.');
    }
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
    <div className="min-h-screen bg-bg-black text-text-light flex flex-col font-sans selection:bg-magenta selection:text-bg-black relative overflow-x-hidden">
      
      {/* Session Loading Screen Preloader */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

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
        setActiveTab={(tab) => handleTabChange(tab)}
        quickExitEnabled={settings.quickExitEnabled}
        quickExitUrl={settings.quickExitUrl}
        onOpenSos={() => setShowSosPanel(true)}
        onOpenQuickCapture={() => {
          handleSelectIncident(null);
          handleTabChange('quick-capture');
        }}
        onOpenChatbot={() => setShowChatbot(true)}
        currentTheme={settings.theme || 'dark'}
        onToggleTheme={() => {
          const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
          const updated = { ...settings, theme: nextTheme as 'dark' | 'light' | 'stealth' };
          StorageService.saveSettings(updated);
          setSettings(updated);
        }}
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

      {/* Brief Unobtrusive Toast Notice Banner */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-bg-black border border-magenta text-text-light px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-magenta shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Pattern Threshold Crossing Notification Banner */}
      {patternBanner && (
        <div className="sticky top-14 z-40 bg-[linear-gradient(135deg,rgba(232,54,143,0.25),rgba(124,92,255,0.2))] border-b border-magenta/40 px-4 py-3 shadow-xl transition-all backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs px-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-magenta/20 border border-magenta/50 flex items-center justify-center text-magenta shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-medium text-text-light">{patternBanner.text}</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  setActiveTab('patterns');
                  setPatternBanner(null);
                }}
                className="px-3 py-1.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold flex items-center space-x-1 shadow-md transition"
              >
                <span>View Pattern</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPatternBanner(null)}
                className="p-1 text-text-muted hover:text-text-light transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Body View - Full Width Layout */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-8 py-6 relative z-10">
        {selectedIncident ? (
          selectedIncident.isQuickCaptureDraft ? (
            <LogIncidentScreen
              draftIncident={selectedIncident}
              onSaveIncident={handleSaveIncident}
              onCancel={() => handleSelectIncident(null)}
            />
          ) : (
            <IncidentDetailScreen
              incident={selectedIncident}
              allIncidents={incidents}
              onUpdate={handleUpdateIncident}
              onDelete={handleDeleteIncident}
              onBack={() => handleSelectIncident(null)}
            />
          )
        ) : (
          <>
            {activeTab === 'timeline' && (
              <TimelineScreen
                incidents={incidents}
                onSelectIncident={(inc) => handleSelectIncident(inc)}
                onLogNew={() => handleTabChange('log')}
                onRecordCall={() => handleTabChange('record-call')}
                onViewPatterns={() => handleTabChange('patterns')}
              />
            )}

            {activeTab === 'quick-capture' && (
              <QuickCaptureScreen
                onSaveQuickCapture={handleSaveQuickCaptureDraft}
                onCancel={() => handleTabChange('timeline')}
                trustedContactName={settings.trustedContactName}
                trustedContactPhone={settings.trustedContactPhone}
                hasSeenTutorial={settings.hasSeenDisguiseTutorial}
                onAcknowledgeTutorial={() => {
                  handleUpdateSettings({ ...settings, hasSeenDisguiseTutorial: true });
                }}
              />
            )}

            {activeTab === 'record-call' && (
              <RecordCallScreen
                onSaveCallIncident={handleSaveIncident}
                onCancel={() => handleTabChange('timeline')}
              />
            )}

            {activeTab === 'log' && (
              <LogIncidentScreen
                onSaveIncident={handleSaveIncident}
                onCancel={() => handleTabChange('timeline')}
              />
            )}

            {activeTab === 'patterns' && (
              <PatternsScreen
                incidents={incidents}
                onSelectIncident={(inc) => handleSelectIncident(inc)}
                onGenerateReport={() => handleTabChange('report')}
                onBack={() => handleTabChange('timeline')}
              />
            )}

            {activeTab === 'report' && (
              <ReportScreen
                incidents={incidents}
                onBack={() => handleTabChange('timeline')}
                onOpenRights={() => handleTabChange('rights')}
                onOpenSos={() => setShowSosPanel(true)}
              />
            )}

            {activeTab === 'rights' && (
              <RightsScreen
                onOpenSos={() => setShowSosPanel(true)}
                onBack={() => handleTabChange('timeline')}
              />
            )}

            {activeTab === 'faq' && (
              <FAQScreen onBack={() => handleTabChange('timeline')} />
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
                onBack={() => handleTabChange('timeline')}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
};
