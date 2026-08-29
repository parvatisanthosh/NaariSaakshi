import React from 'react';
import { Home, PlusCircle, PieChart, FileText, Settings, ExternalLink, Shield, PhoneCall, Video, MessageSquare, BookOpen, HelpCircle } from 'lucide-react';

export type ActiveTab = 'timeline' | 'log' | 'patterns' | 'report' | 'faq' | 'rights' | 'settings' | 'quick-capture' | 'record-call';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  quickExitEnabled: boolean;
  quickExitUrl: string;
  onOpenSos: () => void;
  onOpenQuickCapture: () => void;
  onOpenChatbot: () => void;
}

export const Navigation: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  quickExitEnabled,
  quickExitUrl,
  onOpenSos,
  onOpenQuickCapture,
  onOpenChatbot
}) => {
  const handleQuickExit = () => {
    window.location.href = quickExitUrl || 'https://weather.com';
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-bg-black/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="w-full flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('timeline')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div 
              className="w-9 h-9 rounded-xl border border-magenta/40 flex items-center justify-center text-magenta group-hover:border-magenta transition shadow-sm"
              style={{
                background: 'linear-gradient(145deg, rgba(232,54,143,0.3), rgba(124,92,255,0.12))'
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-2xl tracking-wider text-text-light block leading-none">NAARISAAKSHI</span>
              <span className="text-[9px] text-text-muted font-mono tracking-widest uppercase block mt-0.5">PRIVATE INCIDENT JOURNAL</span>
            </div>
          </div>

          {/* Action Buttons: Chat Assistant, Quick Capture, SOS & Quick Exit */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Calm Chat Assistant Button */}
            <button
              onClick={onOpenChatbot}
              title="Chat Assistant - App & Process Guidance"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-teal-400 text-xs font-medium flex items-center space-x-1 transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ask AI</span>
            </button>

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

            {/* FAQ Quick Link */}
            <button
              onClick={() => setActiveTab('faq')}
              title="Help & FAQ"
              className="p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-magenta transition"
            >
              <HelpCircle className="w-4 h-4" />
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-black/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'timeline'
                ? 'text-magenta bg-white/5'
                : 'text-text-muted hover:text-text-light'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'patterns'
                ? 'text-magenta bg-white/5'
                : 'text-text-muted hover:text-text-light'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Patterns</span>
          </button>

          {/* Prominent Center "+ Log" Button */}
          <button
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center justify-center -mt-5 transition-all ${
              activeTab === 'log' ? 'scale-105' : 'hover:scale-102'
            }`}
          >
            <div 
              className="w-13 h-13 rounded-full bg-gradient-to-br from-magenta to-violet text-bg-black flex items-center justify-center shadow-lg shadow-magenta/30 transition active:scale-95"
              style={{ boxShadow: '0 0 0 6px #0D0B10, 0 10px 25px -3px rgba(232, 54, 143, 0.4)' }}
            >
              <PlusCircle className="w-7 h-7 text-bg-black font-bold" />
            </div>
            <span className="text-[10px] font-semibold text-magenta mt-1">Log</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
              activeTab === 'report'
                ? 'text-magenta bg-white/5'
                : 'text-text-muted hover:text-text-light'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Report</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'faq'
                ? 'text-magenta bg-white/5'
                : 'text-text-muted hover:text-text-light'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('rights')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
              activeTab === 'rights'
                ? 'text-teal-400 bg-teal-950/40'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px] font-medium mt-1">Rights</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-magenta bg-white/5'
                : 'text-text-muted hover:text-text-light'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Settings</span>
          </button>

        </div>
      </nav>
    </>
  );
};
