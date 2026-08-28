import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import { ActiveTab, Navigation } from './components/Navigation';
import { PinLockModal } from './components/PinLockModal';
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
  
  // Security PIN lock state
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Pattern Alert Banner state
  const [patternBanner, setPatternBanner] = useState<{
    text: string;
    key: string;
  } | null>(null);
  const bannerTimerRef = useRef<any | null>(null);

  useEffect(() => {
    // Load initial storage data
    const loadedIncidents = StorageService.getIncidents();
    const loadedSettings = StorageService.getSettings();
    setIncidents(loadedIncidents);
    setSettings(loadedSettings);

    if (loadedSettings.pinEnabled && loadedSettings.pinCode) {
      setIsLocked(true);
    }
  }, []);

  // Save Incident Handler
  const handleSaveIncident = (newIncident: Incident) => {
    const previousAnalysis = analyzeIncidentPatterns(incidents);
    const updatedList = StorageService.addIncident(newIncident);
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

  // Update Incident Handler
  const handleUpdateIncident = (updated: Incident) => {
    const updatedList = StorageService.updateIncident(updated);
    setIncidents(updatedList);
    setSelectedIncident(updated);
  };

  // Delete Incident Handler
  const handleDeleteIncident = (id: string) => {
    const updatedList = StorageService.deleteIncident(id);
    setIncidents(updatedList);
    setSelectedIncident(null);
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: AppSettings) => {
    const saved = StorageService.saveSettings(newSettings);
    setSettings(saved);
  };

  const handleResetSeedData = () => {
    const seeded = StorageService.resetToSeedData();
    setIncidents(seeded);
    setSelectedIncident(null);
  };

  const handleClearAllData = () => {
    const empty = StorageService.clearAllData();
    setIncidents(empty);
    setSelectedIncident(null);
  };

  const handleImportData = (imported: Incident[]) => {
    StorageService.saveIncidents(imported);
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
                onViewPatterns={() => setActiveTab('patterns')}
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
              />
            )}

            {activeTab === 'report' && (
              <ReportScreen incidents={incidents} />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                incidents={incidents}
                onResetSeedData={handleResetSeedData}
                onClearAllData={handleClearAllData}
                onImportData={handleImportData}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
};
