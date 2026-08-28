import React, { useState, useEffect } from 'react';
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Security PIN lock state
  const [isLocked, setIsLocked] = useState<boolean>(false);

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
    const updatedList = StorageService.addIncident(newIncident);
    setIncidents(updatedList);
    setActiveTab('timeline');
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
