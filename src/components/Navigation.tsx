import React from 'react';
import { Home, PlusCircle, PieChart, FileText, Settings, ExternalLink, Shield, PhoneCall, Video, MessageSquare, BookOpen, HelpCircle, Sun, Moon, Plus } from 'lucide-react';

export type ActiveTab = 'timeline' | 'log' | 'patterns' | 'report' | 'faq' | 'rights' | 'settings' | 'quick-capture' | 'record-call';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  quickExitEnabled: boolean;
  quickExitUrl: string;
  onOpenSos: () => void;
  onOpenQuickCapture: () => void;
  onOpenChatbot: () => void;
  currentTheme?: 'dark' | 'light' | 'stealth';
  onToggleTheme?: () => void;
}

export const Navigation: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  quickExitEnabled,
  quickExitUrl,
  onOpenSos,
  onOpenQuickCapture,
  onOpenChatbot,
  currentTheme = 'dark',
  onToggleTheme
}) => {
  const handleQuickExit = () => {
    window.location.href = quickExitUrl || 'https://weather.com';
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-bg-black border-b border-white/10 px-4 sm:px-8 py-3.5 shadow-md">
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
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-magenta text-xs font-medium flex items-center space-x-1 transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-magenta" />
              <span className="hidden md:inline">Ask AI</span>
            </button>

            {/* One-Tap Quick Capture Button */}
            <button
              onClick={onOpenQuickCapture}
              title="Quick Capture - Record live evidence"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-rose-500/50 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 transition active:scale-95 shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xs:inline">Quick Capture</span>
            </button>

            {/* Always-visible Persistent SOS Button */}
            <button
              onClick={onOpenSos}
              title="Emergency SOS Helplines"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 transition active:scale-95 shadow-sm"
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

            {/* Light / Dark Mode Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-1.5 rounded-full hover:bg-white/10 text-magenta hover:scale-110 transition active:scale-95 shadow-sm"
              >
                {currentTheme === 'light' ? (
                  <Moon className="w-4 h-4 text-magenta" />
                ) : (
                  <Sun className="w-4 h-4 text-magenta animate-spin-slow" />
                )}
              </button>
            )}

            {/* Discreet Quick Exit Button */}
            {quickExitEnabled && (
              <button
                onClick={handleQuickExit}
                title="Quick Exit - Redirect immediately"
                className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-muted hover:text-magenta text-xs font-medium flex items-center space-x-1 sm:space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 text-magenta" />
                <span className="hidden xs:inline">Quick Exit</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Solid Opaque Bottom Navigation Bar - High Contrast Over Any Page Section */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-black border-t-2 border-magenta/40 px-3 py-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.9)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          
          {/* 1. Timeline */}
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'timeline'
                ? 'text-magenta bg-white/15 font-bold scale-105 shadow-sm'
                : 'text-text-light/90 hover:text-magenta'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">Timeline</span>
          </button>

          {/* 2. Patterns */}
          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'patterns'
                ? 'text-magenta bg-white/15 font-bold scale-105 shadow-sm'
                : 'text-text-light/90 hover:text-magenta'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">Patterns</span>
          </button>

          {/* 3. Report */}
          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'report'
                ? 'text-magenta bg-white/15 font-bold scale-105 shadow-sm'
                : 'text-text-light/90 hover:text-magenta'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">Report</span>
          </button>

          {/* 4. PROMINENT EXACT CENTER "+ LOG" BUTTON */}
          <button
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center justify-center -mt-6 transition-all duration-300 ${
              activeTab === 'log' ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-magenta text-bg-black flex items-center justify-center border-2 border-white transition active:scale-95 shadow-[0_0_25px_rgba(232,54,143,0.9)]"
            >
              <div className="w-8 h-8 rounded-full border-2 border-bg-black flex items-center justify-center bg-magenta">
                <Plus className="w-6 h-6 text-bg-black font-extrabold stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-magenta mt-1 tracking-wider uppercase">Log</span>
          </button>

          {/* 5. FAQ */}
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'faq'
                ? 'text-magenta bg-white/10 font-bold scale-105 shadow-sm'
                : 'text-text-light/90 hover:text-magenta'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">FAQ</span>
          </button>

          {/* 6. Rights */}
          <button
            onClick={() => setActiveTab('rights')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'rights'
                ? 'text-magenta bg-white/10 font-bold scale-105 shadow-sm'
                : 'text-text-light/90 hover:text-magenta'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">Rights</span>
          </button>

          {/* 7. Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'settings'
                ? 'text-magenta bg-white/10 font-bold scale-105 shadow-sm'
                : 'text-text-light/90 hover:text-magenta'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">Settings</span>
          </button>

        </div>
      </nav>
    </>
  );
};