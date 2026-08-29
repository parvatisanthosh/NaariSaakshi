import React from 'react';
import { Home, PlusCircle, PieChart, FileText, Settings, ExternalLink, Shield, PhoneCall, Video } from 'lucide-react';

export type ActiveTab = 'timeline' | 'log' | 'patterns' | 'report' | 'settings' | 'quick-capture';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  quickExitEnabled: boolean;
  quickExitUrl: string;
  onOpenSos: () => void;
  onOpenQuickCapture: () => void;
}

export const Navigation: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  quickExitEnabled,
  quickExitUrl,
  onOpenSos,
  onOpenQuickCapture
}) => {
  const handleQuickExit = () => {
    window.location.href = quickExitUrl || 'https://weather.com';
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('timeline')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-900/60 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:border-teal-400 transition">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-charcoal-100 text-base tracking-tight block leading-none">EvidenceHer</span>
              <span className="text-[10px] text-charcoal-400 font-mono tracking-wider uppercase block mt-0.5">Private Log</span>
            </div>
          </div>

          {/* Action Buttons: Quick Capture, SOS & Quick Exit */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* One-Tap Quick Capture Button */}
            <button
              onClick={onOpenQuickCapture}
              title="Quick Capture - Record live evidence"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-rose-500/50 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 transition active:scale-95 shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xs:inline">Quick Capture</span>
            </button>

            {/* Always-visible Persistent SOS Button */}
            <button
              onClick={onOpenSos}
              title="Emergency SOS Helplines"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 transition active:scale-95 shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>SOS</span>
            </button>

            {/* Discreet Quick Exit Button */}
            {quickExitEnabled && (
              <button
                onClick={handleQuickExit}
                title="Quick Exit - Redirect immediately"
                className="px-2.5 sm:px-3 py-1.5 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700/80 text-charcoal-300 hover:text-charcoal-100 text-xs font-medium flex items-center space-x-1 sm:space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 text-accent-rose/80" />
                <span className="hidden xs:inline">Quick Exit</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar for Mobile First Usability */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal-900/95 backdrop-blur-lg border-t border-charcoal-800 px-2 py-1.5 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'timeline'
                ? 'text-teal-400 bg-teal-950/40'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium mt-1">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'patterns'
                ? 'text-teal-400 bg-teal-950/40'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[11px] font-medium mt-1">Patterns</span>
          </button>

          {/* Prominent Center "+ Log" Button */}
          <button
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center justify-center -mt-5 transition-all ${
              activeTab === 'log' ? 'scale-105' : 'hover:scale-102'
            }`}
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/50 border-2 border-charcoal-900 ring-2 ring-teal-500/30">
              <PlusCircle className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-semibold text-teal-300 mt-1">Log</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'report'
                ? 'text-teal-400 bg-teal-950/40'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px] font-medium mt-1">Report</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-teal-400 bg-teal-950/40'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] font-medium mt-1">Settings</span>
          </button>

        </div>
      </nav>
    </>
  );
};
