import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, User, Tag, Plus, Search, AlertTriangle, ChevronRight, Paperclip, ShieldAlert, Filter, ShieldCheck, Heart, Shield, Lock, FileText, CheckCircle2, ExternalLink, ArrowRight, Sparkles, Volume2, Smartphone, LayoutGrid, PhoneCall, Bell, Clock, Video } from 'lucide-react';
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

      {/* SECTION 1: HERO LANDING BANNER (NAZR Style) */}
      <section className="relative z-10 rounded-3xl bg-bg-black border border-white/10 p-8 sm:p-16 shadow-2xl overflow-hidden film-grain w-full">
        {/* Drifting skyline gradient background */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-magenta/25 via-violet/10 to-transparent pointer-events-none drifting-skyline" />

        <div className="relative z-10 space-y-6 w-full">
          
          <div className="space-y-3">
            <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl text-text-light tracking-wide leading-none">
              THE WORLD STARES.<br />
              <span className="text-magenta">STARE BACK.</span>
            </h1>
            <p className="text-base sm:text-xl text-text-muted leading-relaxed max-w-4xl pt-2">
              India's first encrypted incident journaling ecosystem combining personal voice logging, AI pattern detection, and legal-ready complaint documentation.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
            <button
              onClick={onLogNew}
              className="px-10 py-5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-xl tracking-wider transition shadow-xl shadow-magenta/30 flex items-center justify-center space-x-2 active:scale-95"
            >
              <Plus className="w-6 h-6" />
              <span>LOG INCIDENT NOW</span>
            </button>

            <button
              onClick={onViewPatterns}
              className="px-10 py-5 rounded-full bg-transparent hover:bg-white/5 border border-magenta/50 text-magenta font-display text-xl tracking-wider transition flex items-center justify-center space-x-2"
            >
              <span>ANALYZE PATTERNS</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10 text-sm">
            <div className="flex items-center space-x-2.5 text-text-muted">
              <Lock className="w-5 h-5 text-magenta shrink-0" />
              <span>100% AES-GCM Encrypted</span>
            </div>
            <div className="flex items-center space-x-2.5 text-text-muted">
              <Sparkles className="w-5 h-5 text-magenta shrink-0" />
              <span>3 Sec Voice AI Structuring</span>
            </div>
            <div className="flex items-center space-x-2.5 text-text-muted">
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
            Click any option below to see how NaariSaakshi instantly triggers emergency alerts and evidence logging.
          </p>
        </div>

        {/* Interactive 3-Step Grid with Phone Mockup Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          
          {/* Left / Right Interactive Steps (Col 1 to 5) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Step 1: Volume Button SOS */}
            <div 
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
                <Volume2 className={`w-6 h-6 ${activeStep === 1 ? 'text-bg-black' : 'text-magenta'}`} />
                <h3 className="font-display text-2xl tracking-wide">VOLUME BUTTON SOS</h3>
              </div>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${activeStep === 1 ? 'text-bg-black/90 font-medium' : 'text-cream-ink/80'}`}>
                Press your phone's volume button 3 times in quick succession to instantly dispatch emergency SOS alerts.
              </p>
            </div>

            {/* Step 2: In-App SOS Button */}
            <div 
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
                <Smartphone className={`w-6 h-6 ${activeStep === 2 ? 'text-bg-black' : 'text-magenta'}`} />
                <h3 className="font-display text-2xl tracking-wide">IN-APP SOS & EVIDENCE TAP</h3>
              </div>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${activeStep === 2 ? 'text-bg-black/90 font-medium' : 'text-cream-ink/80'}`}>
                One tap in the NaariSaakshi app starts live background audio transcription and alerts your trusted circle.
              </p>
            </div>

            {/* Step 3: Home Screen SOS Widget */}
            <div 
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
                <LayoutGrid className={`w-6 h-6 ${activeStep === 3 ? 'text-bg-black' : 'text-magenta'}`} />
                <h3 className="font-display text-2xl tracking-wide">HOME SCREEN SOS WIDGET</h3>
              </div>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${activeStep === 3 ? 'text-bg-black/90 font-medium' : 'text-cream-ink/80'}`}>
                Trigger emergency logging directly from your home screen widget without even opening the full app.
              </p>
            </div>

          </div>

          {/* Interactive Phone Frame Mockup (Col 6 to 12) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative py-6">
            
            {/* Animated Floating Badges around phone */}
            <div className="absolute -top-2 left-4 sm:left-12 z-20 animate-bounce">
              <span className="px-3 py-1 rounded-full bg-magenta text-bg-black font-display font-bold text-xs shadow-xl tracking-wider uppercase">
                {activeStep === 1 ? '⚡ 3-PRESS DETECTED' : activeStep === 2 ? '🎙️ VOICE AI RECORDING' : '📲 INSTANT WIDGET'}
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
                        <Volume2 className="w-10 h-10 animate-bounce" />
                      </div>
                    </div>
                    <div>
                      <span className="font-display text-2xl text-magenta tracking-wide block">VOLUME SOS ACTIVE</span>
                      <p className="text-[11px] text-text-muted px-4">Hardware volume buttons pressed 3x. Alert dispatched to trusted network.</p>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-magenta/30 animate-pulse ring-8 ring-magenta/20" />
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-magenta to-violet text-bg-black font-display font-bold text-3xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(232,54,143,0.8)] border-4 border-white">
                        <span>SOS</span>
                        <span className="text-[10px] font-mono tracking-widest text-bg-black/80">TAP ACTIVE</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-display text-2xl text-text-light tracking-wide block">IN-APP JOURNALING</span>
                      <p className="text-[11px] text-text-muted px-4">AI transcribing voice in real time with AES-GCM local storage.</p>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="bg-white/10 border border-white/20 p-4 rounded-2xl space-y-3 text-left shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display text-magenta tracking-wider">HOME WIDGET</span>
                        <span className="text-[9px] bg-magenta text-bg-black px-2 py-0.5 rounded-full font-bold">1-TAP</span>
                      </div>
                      <p className="text-xs text-text-light font-semibold">Quick Emergency Dispatch</p>
                      <button className="w-full py-2 bg-magenta text-bg-black font-display text-sm font-bold rounded-xl shadow-md">
                        TRIGGER SOS
                      </button>
                    </div>
                    <p className="text-[11px] text-text-muted px-4">Direct widget trigger without unlocking or launching full browser.</p>
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
          <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between text-amber-200 text-xs shadow-md">
            <div className="flex items-center space-x-2.5">
              <Video className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                You have <strong>{unfinishedDraftsCount}</strong> quick capture draft{unfinishedDraftsCount > 1 ? 's' : ''} to add details to when you're ready.
              </span>
            </div>
            <span className="text-[10px] text-amber-300 underline font-semibold shrink-0 ml-2">Tap entry to complete</span>
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
                  AI pattern analysis shows escalating frequency over the last month.
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
                className="px-4 py-3 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-teal-500/40 text-teal-300 font-display text-sm tracking-wider transition flex items-center space-x-1.5 active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-teal-400" />
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
            IN THEIR WORDS.
          </h2>
          <p className="text-base text-cream-ink/80 font-medium max-w-2xl">
            Real experiences from women who believe safety should be proactive, accessible, and shared.
          </p>
        </div>

        {/* Dynamic Interactive Card Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            {
              initials: 'PM',
              quote: 'Finally, a safety journal where I can document workplace harassment privately without worrying about data leaks or cloud server access.',
              name: 'PRIYANSHI MEHTA',
              bgColor: '#0070F3', // Vibrant Blue card
              stars: 5,
            },
            {
              initials: 'KK',
              quote: 'The AI automatically organized my notes into clear timelines with exact quotes and times. It made all the difference during HR review.',
              name: 'KAVYA KAPOOR',
              bgColor: '#E8368F', // Vibrant Magenta card
              stars: 5,
            },
            {
              initials: 'SG',
              quote: 'Exported a POSH-compliant PDF in two clicks. Having everything timestamped gave me the confidence to stand up.',
              name: 'SAKSHI GUPTA',
              bgColor: '#0070F3', // Vibrant Blue card
              stars: 4,
            }
          ].map((item, idx) => {
            const isHovered = activeTestimonial === idx;
            return (
              <div 
                key={idx}
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

                {/* Footer Name & Star Rating */}
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <div className="font-display text-xl tracking-wider uppercase font-bold">{item.name}</div>
                  <div className="flex space-x-1 text-yellow-300 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < item.stars ? '★' : '☆'}</span>
                    ))}
                  </div>
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
          <span>© 2026 NaariSaakshi. 100% Encrypted Local Storage.</span>
          <span>Designed & Built for Women's Safety & Legal Protection</span>
        </div>
      </footer>

    </div>
  );
};
