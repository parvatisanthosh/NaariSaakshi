import React, { useState } from 'react';
import { Shield, FileText, PhoneCall, Heart, ChevronDown, ChevronUp, Check, X, HelpCircle, Phone, Info, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

interface RightsScreenProps {
  onOpenSos: () => void;
  onBack?: () => void;
}

interface MythFactItem {
  id: number;
  statement: string;
  isFact: boolean;
  explanation: string;
}

const MYTH_FACT_ITEMS: MythFactItem[] = [
  {
    id: 1,
    statement: "I need the other person's permission to record our call.",
    isFact: false,
    explanation: "Myth — Under Supreme Court rulings, one-party consent applies in India if you are personally a participant on the call."
  },
  {
    id: 2,
    statement: "The police can refuse to file my FIR if the incident happened somewhere else.",
    isFact: false,
    explanation: "Myth — Under the 'Zero FIR' rule, any police station MUST register your FIR regardless of jurisdiction and transfer it."
  },
  {
    id: 3,
    statement: "I only have a few days to file a workplace complaint under POSH.",
    isFact: false,
    explanation: "Myth — The POSH filing window is 3 months from the incident (or from the latest incident in a series), extendable by 3 more months with justification."
  },
  {
    id: 4,
    statement: "I can call Tele MANAS (14416) for mental health support even if I haven't decided to file a complaint.",
    isFact: true,
    explanation: "Fact — Tele MANAS (14416) and helplines like 181/1091 offer unconditional confidential support regardless of whether you file a formal complaint."
  },
  {
    id: 5,
    statement: "You are legally entitled to receive a free copy of your FIR upon registration.",
    isFact: true,
    explanation: "Fact — Section 154 of the CrPC/BNSS guarantees an immediate, free copy of the registered FIR to the complainant."
  }
];

export const RightsScreen: React.FC<RightsScreenProps> = ({ onOpenSos, onBack }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>('posh');
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: boolean }>({});

  const toggleCard = (id: string) => {
    setExpandedCard(prev => prev === id ? null : id);
  };

  const handleAnswer = (itemId: number, chosenIsFact: boolean) => {
    setUserAnswers(prev => ({ ...prev, [itemId]: chosenIsFact }));
  };

  return (
    <div className="w-full space-y-10 pb-28 relative">
      
      {/* Top Back Navigation Button */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-magenta hover:text-magenta-deep transition"
          >
            <ArrowLeft className="w-4 h-4 text-magenta" />
            <span>Back to Timeline</span>
          </button>
        </div>
      )}

      {/* SECTION 1: TOP BANNER (Cream Background #F5E7DE) */}
      <section className="rounded-3xl bg-cream text-cream-ink p-8 sm:p-14 shadow-2xl border border-black/10 relative z-10 w-full space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-cream-ink/60 uppercase block">LEGAL GUIDANCE & RIGHTS</span>
            <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-cream-ink leading-none">
              KNOW YOUR LEGAL RIGHTS
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-cream-ink/80 leading-relaxed font-medium max-w-4xl">
          General information notice based on Indian law and public legal resources. It isn't formal legal advice — for specific situations, consult your ICC, a lawyer, or a counselor.
        </p>
      </section>

      {/* SECTION 2: MYTH VS FACT INTERACTIVE CARD DECK */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 sm:p-10 space-y-6 text-cream-ink shadow-xl relative z-10 w-full">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <span className="font-display text-2xl text-cream-ink uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-magenta" />
            <span>MYTH VS FACT CHECK</span>
          </span>
          <span className="text-xs font-mono font-bold text-cream-ink/60 uppercase">Tap to test your knowledge</span>
        </div>

        <div className="space-y-4">
          {MYTH_FACT_ITEMS.map((item) => {
            const answered = userAnswers[item.id] !== undefined;
            const chosen = userAnswers[item.id];
            const isCorrect = chosen === item.isFact;

            return (
              <div key={item.id} className="bg-cream/40 border border-black/10 p-5 rounded-2xl space-y-3 text-sm">
                <p className="text-cream-ink font-semibold text-base">"{item.statement}"</p>
                
                {!answered ? (
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      onClick={() => handleAnswer(item.id, false)}
                      className="px-5 py-2 rounded-full bg-white hover:bg-magenta hover:text-bg-black border border-black/10 text-cream-ink font-display font-bold text-base tracking-wider transition shadow-sm"
                    >
                      MYTH
                    </button>
                    <button
                      onClick={() => handleAnswer(item.id, true)}
                      className="px-5 py-2 rounded-full bg-white hover:bg-magenta hover:text-bg-black border border-black/10 text-cream-ink font-display font-bold text-base tracking-wider transition shadow-sm"
                    >
                      FACT
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium space-y-1.5 ${
                    isCorrect 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <span className="font-bold block text-sm">
                      {item.isFact ? '✓ FACT' : '✕ MYTH'} — {isCorrect ? 'Correct!' : 'Common misconception'}
                    </span>
                    <p className="leading-relaxed">{item.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: 4 EXPANDABLE LEGAL TOPICS */}
      <section className="space-y-4 relative z-10 w-full">
        <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">
          LEGAL & PROCEDURAL OVERVIEW
        </h2>

        <div className="space-y-4">
          
          {/* Card 1: Workplace Harassment & POSH */}
          <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-md transition">
            <button
              onClick={() => toggleCard('posh')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-cream/30 transition"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-magenta text-bg-black font-bold flex items-center justify-center shrink-0 shadow-md">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-cream-ink tracking-wide">WORKPLACE HARASSMENT & POSH ACT</h3>
                  <span className="text-xs font-medium text-cream-ink/70 block">Filing windows, ICC inquiries, employer duties & coverage</span>
                </div>
              </div>
              {expandedCard === 'posh' ? <ChevronUp className="w-5 h-5 text-cream-ink" /> : <ChevronDown className="w-5 h-5 text-cream-ink" />}
            </button>

            {expandedCard === 'posh' && (
              <div className="p-6 pt-2 border-t border-black/10 space-y-3 text-sm text-cream-ink/90 leading-relaxed font-medium bg-cream/30">
                <p>• <strong>Who is Covered:</strong> All women employees across any employment status (full-time, part-time, intern, contractor, consultant, or visitor).</p>
                <p>• <strong>3-Month Window:</strong> Complaints must generally be filed with your Internal Complaints Committee (ICC) within 3 months. If harassment is a series of incidents, the window starts from the date of the <em>most recent incident</em>. The ICC can grant up to 3 additional months extension with justification.</p>
                <p>• <strong>Statutory Timelines:</strong> ICC must forward complaint copy to respondent within 7 days; complete inquiry within 90 days; employer must implement recommendations within 60 days.</p>
              </div>
            )}
          </div>

          {/* Card 2: Police Complaint (FIR) */}
          <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-md transition">
            <button
              onClick={() => toggleCard('fir')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-cream/30 transition"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-magenta text-bg-black font-bold flex items-center justify-center shrink-0 shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-cream-ink tracking-wide">FILING A POLICE COMPLAINT (FIR)</h3>
                  <span className="text-xs font-medium text-cream-ink/70 block">Zero FIR rules, free copy rights & refusal penalties</span>
                </div>
              </div>
              {expandedCard === 'fir' ? <ChevronUp className="w-5 h-5 text-cream-ink" /> : <ChevronDown className="w-5 h-5 text-cream-ink" />}
            </button>

            {expandedCard === 'fir' && (
              <div className="p-6 pt-2 border-t border-black/10 space-y-3 text-sm text-cream-ink/90 leading-relaxed font-medium bg-cream/30">
                <p>• <strong>Zero FIR Rule:</strong> Under current Indian law, ANY police station must register a Zero FIR regardless of where the crime occurred and transfer it to the correct station.</p>
                <p>• <strong>Free Copy Right:</strong> You are legally entitled to receive a free, immediate copy of the registered FIR at the time of filing.</p>
                <p>• <strong>Refusal Penalty:</strong> Police officers refusing to register an FIR for cognizable offences against women commit a punishable offence under Section 166A. Complaints can be escalated directly to the SP or a Judicial Magistrate.</p>
              </div>
            )}
          </div>

          {/* Card 3: Recording Calls & Evidence */}
          <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-md transition">
            <button
              onClick={() => toggleCard('calls')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-cream/30 transition"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-magenta text-bg-black font-bold flex items-center justify-center shrink-0 shadow-md">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-cream-ink tracking-wide">RECORDING CALLS & EVIDENCE</h3>
                  <span className="text-xs font-medium text-cream-ink/70 block">One-party consent rules & digital authentication</span>
                </div>
              </div>
              {expandedCard === 'calls' ? <ChevronUp className="w-5 h-5 text-cream-ink" /> : <ChevronDown className="w-5 h-5 text-cream-ink" />}
            </button>

            {expandedCard === 'calls' && (
              <div className="p-6 pt-2 border-t border-black/10 space-y-3 text-sm text-cream-ink/90 leading-relaxed font-medium bg-cream/30">
                <p>• <strong>One-Party Consent:</strong> In India, you can legally record phone calls you are personally part of without telling the other person under Supreme Court precedents.</p>
                <p>• <strong>Evidence Certification:</strong> Using recordings in formal legal/ICC proceedings requires electronic evidence certification (Section 65B IPC / Section 63 BSA).</p>
                <p>• <strong>Timely Logs Matter:</strong> Contemporaneous timestamped notes preserved right after events occur carry significant weight when building a record.</p>
              </div>
            )}
          </div>

          {/* Card 4: Support Beyond Reporting */}
          <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-md transition">
            <button
              onClick={() => toggleCard('support')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-cream/30 transition"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-magenta text-bg-black font-bold flex items-center justify-center shrink-0 shadow-md">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-cream-ink tracking-wide">SUPPORT BEYOND REPORTING</h3>
                  <span className="text-xs font-medium text-cream-ink/70 block">Tele MANAS, counselling & unconditional helplines</span>
                </div>
              </div>
              {expandedCard === 'support' ? <ChevronUp className="w-5 h-5 text-cream-ink" /> : <ChevronDown className="w-5 h-5 text-cream-ink" />}
            </button>

            {expandedCard === 'support' && (
              <div className="p-6 pt-2 border-t border-black/10 space-y-3 text-sm text-cream-ink/90 leading-relaxed font-medium bg-cream/30">
                <p>• <strong>Tele MANAS (14416):</strong> Free, 24/7 national mental health and tele-counselling helpline provided by the Government of India.</p>
                <p>• <strong>Women's Helplines (181 / 1091):</strong> Immediate distress, domestic violence, and legal guidance response.</p>
                <p>• <strong>No Mandatory Complaint Needed:</strong> You can access counselling and support anytime without being required to file a formal complaint first.</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Persistent Bottom SOS Shortcut */}
      <section className="rounded-3xl bg-cream text-cream-ink p-8 space-y-4 shadow-2xl border border-black/10 relative z-10 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-display text-2xl text-cream-ink block tracking-wide">NEED IMMEDIATE SUPPORT OR HELPLINES?</span>
          <span className="text-xs text-cream-ink/80 font-medium block">Access 112 (Emergency), 181 (Women's Helpline), 1091, and Tele MANAS (14416)</span>
        </div>
        <button
          onClick={onOpenSos}
          className="px-8 py-4 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider transition shadow-lg shrink-0 flex items-center space-x-2"
        >
          <Phone className="w-5 h-5" />
          <span>OPEN EMERGENCY SOS →</span>
        </button>
      </section>

    </div>
  );
};