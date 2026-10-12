import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, User, Tag, Plus, Search, AlertTriangle, ChevronRight, Paperclip, ShieldAlert, Filter, ShieldCheck, Heart, Shield, Lock, FileText, CheckCircle2, ExternalLink, ArrowRight, Sparkles, Volume2, Smartphone, LayoutGrid, PhoneCall, Bell, Clock, Video, Mic } from 'lucide-react';
import { Incident, CategoryType } from '../types';
import { analyzeIncidentPatterns } from '../aiEngine';
import { calculatePoshDeadline } from '../poshDeadlineHelper';

interface TimelineScreenProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onLogNew: () => void;
  onRecordCall?: () => void;
  onViewPatterns: () => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  incidents,
  onSelectIncident,
  onLogNew,
  onRecordCall,
  onViewPatterns
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTestimonial, setActiveTestimonial] = useState<number>(0);

  // Compute pattern alert for 2+ incidents involving same person/location
  const patternInsight = useMemo(() => {
    return analyzeIncidentPatterns(incidents);
  }, [incidents]);

  const topPatternCluster = patternInsight.clusters.find(c => c.count >= 2);

  const unfinishedDraftsCount = useMemo(() => {
    return incidents.filter(i => i.isQuickCaptureDraft).length;
  }, [incidents]);

  // Filtered and Sorted Incidents (Reverse chronological - Newest first)
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter(inc => {
        const matchesSearch =
          searchTerm === '' ||
          inc.narrative_structured.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.people_involved.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          inc.narrative_raw.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All' || inc.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.incident_datetime).getTime() - new Date(a.incident_datetime).getTime());
  }, [incidents, searchTerm, selectedCategory]);

  const getCategoryTopBorderColor = (cat: CategoryType) => {
    switch (cat) {
      case 'Stalking':
        return '#7C68F4';
      case 'Digital':
        return '#7fd4d9';
      case 'Physical':
        return '#f5a585';
      case 'Quid-Pro-Quo':
        return '#e8b464';
      case 'Intimidation / Non-verbal':
        return '#c084fc';
      case 'Financial / Economic':
        return '#34d399';
      case 'Verbal':
      default:
        return '#a8a2a8';
    }
  };

  const getCategoryTagStyle = (cat: CategoryType) => {
    switch (cat) {
      case 'Physical':
        return { color: '#f5a585', backgroundColor: 'rgba(245,120,80,0.12)', borderColor: 'rgba(245,120,80,0.3)' };
      case 'Digital':
        return { color: '#7fd4d9', backgroundColor: 'rgba(80,190,200,0.12)', borderColor: 'rgba(80,190,200,0.3)' };
      case 'Stalking':
        return { color: '#b3a1ff', backgroundColor: 'rgba(147,120,255,0.15)', borderColor: 'rgba(147,120,255,0.3)' };
      case 'Quid-Pro-Quo':
        return { color: '#e8b464', backgroundColor: 'rgba(220,160,70,0.15)', borderColor: 'rgba(220,160,70,0.3)' };
      case 'Intimidation / Non-verbal':
        return { color: '#c084fc', backgroundColor: 'rgba(192,132,252,0.15)', borderColor: 'rgba(192,132,252,0.3)' };
      case 'Financial / Economic':
        return { color: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' };
      case 'Verbal':
      default:
        return { color: '#a8a2a8', backgroundColor: 'transparent', borderColor: '#2a2329' };
    }
  };

  return (
    <div className="w-full space-y-12 pb-28 relative">
      
      {/* Background Decorative Ambient Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(232,54,143,0.25), transparent 70%)',
          opacity: 0.8
        }}
      />

      {/* SECTION 1: HERO LANDING BANNER (NAZR Style with Dynamic Hover Pink Halftone Texture) */}
      <section className="relative z-10 rounded-3xl bg-bg-black border border-white/10 p-8 sm:p-16 shadow-2xl overflow-hidden film-grain w-full group cursor-default">
        
        {/* Halftone / Screentone Grain Matrix Layer (Pink Pop-Up Effect on Hover) */}
        <div 
          className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-all duration-500 pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: `radial-gradient(#E8368F 1.5px, transparent 1.5px)`,
            backgroundSize: '8px 8px',
            backgroundColor: 'rgba(232, 54, 143, 0.08)'
          }}
        />

        {/* Floating Pink Shield / Mascot Graphics on Hover (matching image layout) */}
        <div className="absolute right-8 top-8 sm:right-16 sm:top-12 opacity-15 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 pointer-events-none transform translate-x-12 rotate-6">
          <div className="w-32 h-44 sm:w-44 sm:h-60 rounded-3xl bg-gradient-to-tr from-magenta via-magenta-deep to-violet p-1 shadow-[0_0_50px_rgba(232,54,143,0.8)] flex flex-col justify-between">
            <div className="bg-bg-black rounded-[20px] h-full p-4 flex flex-col items-center justify-between border border-magenta/40">
              <div className="w-8 h-8 rounded-full bg-magenta text-bg-black flex items-center justify-center font-bold text-xs shadow-md">
                100%
              </div>
              <Shield className="w-16 h-16 text-magenta animate-pulse" />
              <div className="font-display text-sm tracking-wider text-text-light text-center uppercase">
                SAFE & ENCRYPTED
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Magenta Glow Blob on Hover */}
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-magenta/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Drifting skyline gradient background */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-black via-magenta/10 to-transparent pointer-events-none drifting-skyline" />

        <div className="relative z-10 space-y-6 w-full max-w-4xl">
          
          <div className="space-y-3">
            <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl text-text-light tracking-wide leading-none drop-shadow-2xl">
              THE WORLD STARES.<br />
              <span className="text-magenta group-hover:text-magenta-light group-hover:drop-shadow-[0_0_35px_rgba(232,54,143,0.9)] transition-all duration-500">STARE BACK.</span>
            </h1>
            <p className="text-base sm:text-xl text-text-muted group-hover:text-text-light transition-colors duration-500 leading-relaxed max-w-3xl pt-2 font-medium drop-shadow-md">
              A private, encrypted journal for documenting harassment as it happens, so that when you decide to complain, your record is organised, dated and ready to share.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
            <button
              onClick={onLogNew}
              className="px-10 py-5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-xl tracking-wider transition-all duration-300 shadow-xl shadow-magenta/40 hover:scale-105 hover:shadow-magenta/70 flex items-center justify-center space-x-2 active:scale-95"
            >
              <Plus className="w-6 h-6" />
              <span>LOG INCIDENT NOW</span>
            </button>

            <button
              onClick={onViewPatterns}
              className="px-10 py-5 rounded-full bg-bg-black/80 backdrop-blur-md hover:bg-magenta hover:text-bg-black border-2 border-magenta text-magenta font-display text-xl tracking-wider transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>ANALYZE PATTERNS</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/15 text-sm font-semibold">
            <div className="flex items-center space-x-2.5 text-text-light bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 group-hover:border-magenta/60 group-hover:bg-magenta/10 transition-all duration-300">
              <Lock className="w-5 h-5 text-magenta shrink-0" />
              <span>100% AES-GCM Encrypted</span>
            </div>
            <div className="flex items-center space-x-2.5 text-text-light bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 group-hover:border-magenta/60 group-hover:bg-magenta/10 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-magenta shrink-0" />
              <span>Voice Notes Auto-Organised</span>
            </div>
            <div className="flex items-center space-x-2.5 text-text-light bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 group-hover:border-magenta/60 group-hover:bg-magenta/10 transition-all duration-300">
              <FileText className="w-5 h-5 text-magenta shrink-0" />
              <span>POSH & Police PDF Ready</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: "HELP. WITHOUT THE HOLD UP." (Interactive Animated Showcase) */}
      <section className="rounded-3xl bg-cream text-cream-ink p-8 sm:p-16 space-y-12 shadow-2xl text-left border border-black/10 relative z-10 w-full overflow-hidden">
        
        {/* Dynamic Background Animated Glow depending on active step */}
        <div 
          className="absolute -right-20 -top-20 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30"
          style={{
            background: activeStep === 1 ? '#E8368F' : activeStep === 2 ? '#7C5CFF' : '#f5a585'
          }}
        />

        <div className="space-y-3 max-w-3xl">
          <span className="text-sm font-mono uppercase tracking-widest text-cream-ink/70 font-bold block">HOW NAARISAAKSHI WORKS</span>
          <h2 className="font-display text-5xl sm:text-7xl text-cream-ink tracking-wide leading-none">
            HELP. WITHOUT THE HOLD UP.
          </h2>
          <p className="text-base sm:text-lg text-cream-ink/80 leading-relaxed">
            Hover over or click any option below to see how NaariSaakshi instantly triggers emergency alerts and evidence logging.
          </p>
        </div>

        {/* Interactive 3-Step Grid with Phone Mockup Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          
          {/* Left / Right Interactive Steps (Col 1 to 5) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Step 1: 1-Tap Quick Capture */}
            <div 
              onMouseEnter={() => setActiveStep(1)}
              onClick={() => setActiveStep(1)}
              className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 transform border-2 ${
                activeStep === 1
                  ? 'bg-magenta text-bg-black border-magenta shadow-xl scale-[1.02]'
                  : 'bg-white/60 border-dashed border-magenta/40 text-cream-ink hover:bg-white/90 hover:border-magenta'
              }`}
            >
              <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full font-display font-bold text-xl flex items-center justify-center shadow-md transition-colors ${
                activeStep === 1 ? 'bg-bg-black text-magenta' : 'bg-magenta text-bg-black'
              }`}>
                1
              </div>
              <div className="flex items-center space-x-3">
                <Video className={`w-6 h-6 ${activeStep === 1 ? 'text-bg-black' : 'text-magenta'}`} />
                <h3 className="font-display text-2xl tracking-wide">1-TAP QUICK CAPTURE</h3>
              </div>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${activeStep === 1 ? 'text-bg-black/90 font-medium' : 'text-cream-ink/80'}`}>
                Instantly record live video and audio evidence in-the-moment. Includes a Disguise Screen that hides the preview into a plain notes interface while recording continues.
              </p>
            </div>

            {/* Step 2: Persistent Helpline SOS */}
            <div 
              onMouseEnter={() => setActiveStep(2)}
              onClick={() => setActiveStep(2)}
              className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 transform border-2 ${
                activeStep === 2
                  ? 'bg-magenta text-bg-black border-magenta shadow-xl scale-[1.02]'
                  : 'bg-white/60 border-dashed border-magenta/40 text-cream-ink hover:bg-white/90 hover:border-magenta'
              }`}
            >
              <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full font-display font-bold text-xl flex items-center justify-center shadow-md transition-colors ${
                activeStep === 2 ? 'bg-bg-black text-magenta' : 'bg-magenta text-bg-black'
              }`}>
                2
              </div>
              <div className="flex items-center space-x-3">
                <PhoneCall className={`w-6 h-6 ${activeStep === 2 ? 'text-bg-black' : 'text-magenta'}`} />
                <h3 className="font-display text-2xl tracking-wide">PERSISTENT HELPLINE SOS</h3>
              </div>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${activeStep === 2 ? 'text-bg-black/90 font-medium' : 'text-cream-ink/80'}`}>
                Always-visible SOS button provides 1-tap direct calls to 112 (Emergency), 181 (Women's Helpline), 1091, and Tele MANAS, plus 1-tap location SMS sharing to your trusted contact.
              </p>
            </div>

            {/* Step 3: 1-Tap Call Recording */}
            <div 
              onMouseEnter={() => setActiveStep(3)}
              onClick={() => setActiveStep(3)}
              className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 transform border-2 ${
                activeStep === 3
                  ? 'bg-magenta text-bg-black border-magenta shadow-xl scale-[1.02]'
                  : 'bg-white/60 border-dashed border-magenta/40 text-cream-ink hover:bg-white/90 hover:border-magenta'
              }`}
            >
              <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full font-display font-bold text-xl flex items-center justify-center shadow-md transition-colors ${
                activeStep === 3 ? 'bg-bg-black text-magenta' : 'bg-magenta text-bg-black'
              }`}>
                3
              </div>
              <div className="flex items-center space-x-3">
                <Mic className={`w-6 h-6 ${activeStep === 3 ? 'text-bg-black' : 'text-magenta'}`} />
                <h3 className="font-display text-2xl tracking-wide">1-TAP CALL RECORDING</h3>
              </div>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${activeStep === 3 ? 'text-bg-black/90 font-medium' : 'text-cream-ink/80'}`}>
                Record your side of a speakerphone call with a rough transcript for your private records. Recording rules depend on context, so check the guidance before you start.
              </p>
            </div>

          </div>

          {/* Interactive Phone Frame Mockup (Col 6 to 12) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative py-6">
            
            {/* Animated Floating Badges around phone */}
            <div className="absolute -top-2 left-4 sm:left-12 z-20 animate-bounce">
              <span className="px-3 py-1 rounded-full bg-magenta text-bg-black font-display font-bold text-xs shadow-xl tracking-wider uppercase">
                {activeStep === 1 ? '📹 1-TAP QUICK CAPTURE' : activeStep === 2 ? '⚡ PERSISTENT HELPLINE SOS' : '🎙️ 1-TAP CALL RECORDING'}
              </span>
            </div>

            <div className="absolute -bottom-2 right-4 sm:right-12 z-20 animate-pulse">
              <span className="px-3 py-1 rounded-full bg-violet text-white font-display font-bold text-xs shadow-xl tracking-wider uppercase">
                100% PRIVATE & ENCRYPTED
              </span>
            </div>

            {/* Smartphone Device Frame */}
            <div className="w-[300px] sm:w-[340px] rounded-[44px] border-[10px] border-[#1A1410] bg-bg-black p-4 text-text-light shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02]">
              
              {/* Top Dynamic Island Notch */}
              <div className="w-28 h-5 bg-[#1A1410] rounded-full mx-auto mb-4 flex items-center justify-between px-3">
                <span className="w-2 h-2 rounded-full bg-magenta animate-ping" />
                <span className="text-[9px] font-mono text-text-muted">NAARISAAKSHI</span>
              </div>

              {/* Live Interactive App Screen State */}
              <div className="space-y-4 text-center py-2 min-h-[380px] flex flex-col justify-between">
                
                {/* Header status bar */}
                <div className="flex items-center justify-between text-[10px] text-text-muted font-mono px-1">
                  <span>8:00 AM</span>
                  <span className="text-magenta font-semibold">LIVE SHIELD</span>
                </div>

                {/* Center Animated Trigger Display */}
                {activeStep === 1 && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-magenta/20 animate-ping" />
                      <div className="w-24 h-24 rounded-full bg-magenta text-bg-black flex flex-col items-center justify-center shadow-xl border-4 border-white">
                        <Video className="w-10 h-10" />
                      </div>
                    </div>
                    <div>
                      <span className="font-display text-2xl text-magenta tracking-wide block">1-TAP QUICK CAPTURE</span>
                      <p className="text-[11px] text-text-muted px-4">Live video & audio recording initiated. Disguise notes screen active.</p>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-magenta/30 animate-pulse ring-8 ring-magenta/20" />
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-magenta to-violet text-bg-black font-display font-bold flex flex-col items-center justify-center shadow-[0_0_30px_rgba(232,54,143,0.8)] border-4 border-white">
                        <PhoneCall className="w-10 h-10" />
                      </div>
                    </div>
                    <div>
                      <span className="font-display text-2xl text-magenta tracking-wide block">PERSISTENT HELPLINE SOS</span>
                      <p className="text-[11px] text-text-muted px-4">1-Tap direct calls to 112, 181, 1091 & Tele MANAS with GPS SMS alert.</p>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-magenta/20 animate-pulse" />
                      <div className="w-24 h-24 rounded-full bg-magenta text-bg-black flex flex-col items-center justify-center shadow-xl border-4 border-white">
                        <Mic className="w-10 h-10" />
                      </div>
                    </div>
                    <div>
                      <span className="font-display text-2xl text-magenta tracking-wide block">1-TAP CALL RECORDING</span>
                      <p className="text-[11px] text-text-muted px-4">Speakerphone audio recorded & live rough transcription generated for evidence.</p>
                    </div>
                  </div>
                )}

                {/* Shield Mode & Emergency Contacts Bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2 text-left text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-magenta font-semibold flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>SHIELD MODE</span>
                    </span>
                    <span className="text-[9px] bg-magenta/20 text-magenta px-2 py-0.5 rounded-full font-mono">ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center space-x-1 text-text-muted">
                      <PhoneCall className="w-3 h-3 text-magenta" />
                      <span>Police 24/7</span>
                    </div>
                    <div className="flex items-center space-x-1 text-text-muted">
                      <Bell className="w-3 h-3 text-magenta" />
                      <span>Helpline 1091</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: ECOSYSTEM CAPABILITIES GRID (Dark Section) */}
      <section className="relative z-10 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-magenta font-semibold block">SAFETY HABITS UPGRADED</span>
          <h2 className="font-display text-3xl sm:text-4xl text-text-light tracking-wide">
            DESIGNED TO PROTECT YOUR RIGHT TO BE HEARD
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-bg-black border border-white/10 rounded-2xl p-6 space-y-3 shadow-md hover:border-magenta/40 transition">
            <div className="w-10 h-10 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display text-2xl text-text-light">100% LOCAL PRIVACY</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Your log entries are encrypted client-side using AES-GCM and stored only in your browser storage. No external servers ever see your notes.
            </p>
          </div>

          <div className="bg-bg-black border border-white/10 rounded-2xl p-6 space-y-3 shadow-md hover:border-magenta/40 transition">
            <div className="w-10 h-10 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta">
              <ExternalLink className="w-5 h-5" />
            </div>
            <h3 className="font-display text-2xl text-text-light">DISCREET QUICK EXIT</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              One-tap Quick Exit button instantly redirects your browser screen to a neutral webpage (e.g. weather forecast) if someone approaches.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: LIVE TIMELINE DASHBOARD (Dark Section) */}
      <section className="relative z-10 space-y-6 pt-4 border-t border-white/10">
        
        {/* Unfinished Quick Capture Drafts Reminder Banner */}
        {unfinishedDraftsCount > 0 && (
          <div
            onClick={() => {
              const firstDraft = incidents.find(i => i.isQuickCaptureDraft);
              if (firstDraft) onSelectIncident(firstDraft);
            }}
            className="bg-amber-950/80 border border-amber-500/50 hover:border-amber-400 rounded-2xl p-4 flex items-center justify-between text-amber-200 text-xs shadow-md cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2.5">
              <Video className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                You have <strong>{unfinishedDraftsCount}</strong> quick capture draft{unfinishedDraftsCount > 1 ? 's' : ''} to add details to when you're ready.
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const firstDraft = incidents.find(i => i.isQuickCaptureDraft);
                if (firstDraft) onSelectIncident(firstDraft);
              }}
              className="text-[10px] text-amber-300 underline font-semibold shrink-0 ml-2 hover:text-amber-100"
            >
              Tap entry to complete
            </button>
          </div>
        )}

        {/* Pattern Warning Banner if 2+ incidents detected */}
        {topPatternCluster && (
          <div 
            onClick={onViewPatterns}
            aria-label="Pattern Detected Alert Banner"
            className="relative overflow-hidden border border-magenta/50 rounded-2xl p-6 cursor-pointer hover:border-magenta transition group bg-bg-black"
            style={{
              boxShadow: '0 8px 24px -8px rgba(232,54,143,0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-magenta/20 via-violet/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-start space-x-4">
              <div className="w-12 h-10 rounded-xl bg-magenta/20 border border-magenta/50 flex items-center justify-center text-magenta shrink-0 mt-0.5 group-hover:scale-105 transition">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl tracking-wider text-magenta">PATTERN DETECTED</span>
                  <span className="text-xs text-magenta font-semibold flex items-center space-x-1 group-hover:underline">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-base font-semibold text-text-light mt-0.5">
                  {topPatternCluster.count} incidents logged involving "{topPatternCluster.key}"
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Your entries show this repeating. Review the pattern summary.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Title & Quick Log CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-black border border-white/10 p-6 rounded-2xl shadow-sm">
          <div>
            <h2 className="font-display text-3xl tracking-wide text-text-light">INCIDENT TIMELINE & LOGS</h2>
            <p className="text-xs text-text-muted mt-0.5">{incidents.length} secure record{incidents.length !== 1 ? 's' : ''} stored locally on this device</p>
          </div>
          <div className="flex items-center space-x-2">
            {onRecordCall && (
                <button
                  onClick={onRecordCall}
                  className="px-4 py-3 rounded-full bg-white/5 hover:bg-magenta hover:text-bg-black border border-magenta/40 text-magenta font-display text-sm tracking-wider transition flex items-center space-x-1.5 active:scale-95"
                >
                  <PhoneCall className="w-4 h-4 text-magenta" />
                  <span>RECORD CALL</span>
                </button>
            )}
            <button
              onClick={onLogNew}
              className="px-6 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display text-base tracking-wider transition shadow-md shadow-magenta/20 flex items-center justify-center space-x-2 active:scale-95 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>LOG NEW INCIDENT</span>
            </button>
          </div>
        </div>

        {/* Search and Category Filter Bar */}
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes, names, or locations..."
              className="w-full bg-white/5 border border-white/10 focus:border-magenta rounded-xl pl-11 pr-4 py-3 text-xs text-text-light placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-magenta/20 transition-all duration-150"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Verbal', 'Physical', 'Digital', 'Stalking', 'Quid-Pro-Quo', 'Intimidation / Non-verbal', 'Financial / Economic', 'Other'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                  selectedCategory === cat
                    ? 'bg-magenta text-bg-black border-magenta shadow-md'
                    : 'bg-transparent text-text-muted border-white/10 hover:text-text-light hover:border-white/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Incident Cards List */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 space-y-3">
              <p className="text-sm font-semibold text-text-muted">No matching incidents found</p>
              <p className="text-xs text-text-muted/60 max-w-sm mx-auto">Try adjusting your search terms or filter settings above.</p>
            </div>
          ) : (
            filteredIncidents.map(incident => {
              const dateFormatted = new Date(incident.incident_datetime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const timeFormatted = new Date(incident.incident_datetime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });
              const topBorderColor = getCategoryTopBorderColor(incident.category);
              const tagStyle = getCategoryTagStyle(incident.category);
              const poshInfo = calculatePoshDeadline(incident, incidents);

              return (
                <div
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  style={{
                    borderTopColor: topBorderColor,
                    borderTopWidth: '2px'
                  }}
                  className="bg-bg-black hover:bg-white/[0.03] border-x border-b border-white/10 hover:border-x-white/20 hover:border-b-white/20 hover:-translate-y-[1px] hover:shadow-md rounded-2xl p-5 transition-all duration-150 cursor-pointer shadow-sm group space-y-3"
                >
                  {/* Header: Date/Time + Category / Draft Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-text-muted font-medium">
                      <Calendar className="w-3.5 h-3.5 text-magenta" />
                      <span>{dateFormatted} at {timeFormatted}</span>
                    </div>

                    {incident.isQuickCaptureDraft ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-700/80">
                        ⚠️ Quick Capture — needs details
                      </span>
                    ) : (
                      <span 
                        style={tagStyle}
                        className="px-3 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider"
                      >
                        {incident.category}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-base font-semibold text-text-light group-hover:text-magenta transition leading-snug">
                    {incident.narrative_structured.summary}
                  </p>

                  {/* Meta details: Person & Location */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-text-muted">
                    {incident.people_involved.length > 0 && (
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <span className="font-semibold text-text-light">{incident.people_involved.map(p => p.name).join(', ')}</span>
                      </div>
                    )}

                    {incident.location && (
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        <span>{incident.location}</span>
                      </div>
                    )}

                    {incident.attachments.length > 0 && (
                      <div className="flex items-center space-x-1.5 text-magenta font-semibold">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{incident.attachments.length} attachment{incident.attachments.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* POSH Filing Window Indicator */}
                  <div className="pt-2 border-t border-white/10 space-y-0.5 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-text-muted">
                      <Clock className="w-3 h-3 text-magenta shrink-0" />
                      <span className="font-semibold text-text-light">{poshInfo.displayText}</span>
                      {poshInfo.isSeries && (
                        <span className="text-[10px] text-magenta font-mono">(calculated from latest in series)</span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </section>

      {/* SECTION 5: "WHY NAARISAAKSHI EXISTS" TESTIMONIAL CAROUSEL (Image 1 Style Card Grid) */}
      <section className="rounded-3xl bg-cream text-cream-ink p-8 sm:p-16 space-y-10 shadow-2xl text-left border border-black/10 relative z-10 w-full overflow-hidden">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-sm font-mono uppercase tracking-widest text-cream-ink/70 font-bold block">WHY NAARISAAKSHI EXISTS</span>
          <h2 className="font-display text-5xl sm:text-7xl text-cream-ink tracking-wide leading-none">
            WHO IT'S FOR.
          </h2>
          <p className="text-base text-cream-ink/80 font-medium max-w-2xl">
            Illustrative situations the app is designed around. These are examples, not user testimonials.
          </p>
        </div>

        {/* Dynamic Interactive Card Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            {
              initials: '01',
              quote: 'A manager keeps sending late-night messages. She is not ready to complain yet, but wants every screenshot kept safe and dated in case it continues.',
              name: 'NOT READY TO REPORT YET',
              bgColor: '#0070F3', // Vibrant Blue card
            },
            {
              initials: '02',
              quote: 'Months of small incidents blur together. A dated log of who, where and what makes the series visible, and shows when the three-month POSH window closes.',
              name: 'A SERIES, NOT ONE EVENT',
              bgColor: '#E8368F', // Vibrant Magenta card
            },
            {
              initials: '03',
              quote: 'Her phone is sometimes checked by someone else. She needs the journal locked behind a passphrase and a quick way out of the app.',
              name: 'SOMEONE ELSE HAS ACCESS',
              bgColor: '#0070F3', // Vibrant Blue card
            }
          ].map((item, idx) => {
            const isHovered = activeTestimonial === idx;
            return (
              <div 
                key={idx}
                onMouseEnter={() => setActiveTestimonial(idx)}
                onClick={() => setActiveTestimonial(idx)}
                style={{
                  backgroundColor: item.bgColor
                }}
                className={`cursor-pointer p-8 rounded-[36px] text-white shadow-xl transition-all duration-300 transform flex flex-col justify-between min-h-[360px] relative overflow-hidden ${
                  isHovered ? 'scale-105 shadow-2xl -rotate-1 z-20' : 'hover:scale-[1.02] hover:-rotate-1 z-10'
                }`}
              >
                {/* Top Initials Badge */}
                <div className="w-16 h-16 rounded-full bg-white text-bg-black font-display font-bold text-2xl flex items-center justify-center shadow-md">
                  {item.initials}
                </div>

                {/* Quote Body */}
                <p className="text-base sm:text-lg font-medium leading-relaxed my-6">
                  {item.quote}
                </p>

                {/* Footer Scenario Title */}
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <div className="font-display text-xl tracking-wider uppercase font-bold">{item.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: FOOTER (Dark Section) */}
      <footer className="relative z-10 bg-bg-black border-t border-white/10 rounded-2xl p-8 space-y-6 text-xs text-text-muted">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-display text-3xl text-text-light tracking-wider">NAARISAAKSHI</div>
            <p className="text-xs text-text-muted mt-0.5">THE WORLD STARES. STARE BACK.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onLogNew}
              className="px-5 py-2 rounded-full bg-magenta text-bg-black font-semibold text-xs transition hover:bg-magenta-deep"
            >
              + Log Incident
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>© 2026 NaariSaakshi. Encrypted on your device. Not legal advice.</span>
          <span>Designed & Built for Women's Safety & Legal Protection</span>
        </div>
      </footer>

    </div>
  );
};
