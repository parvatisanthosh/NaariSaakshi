import React, { useState } from 'react';
import { Shield, FileText, PhoneCall, Heart, ChevronDown, ChevronUp, Check, X, HelpCircle, Phone, Info, ArrowRight, ArrowLeft } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Top Back Navigation Button */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Timeline</span>
          </button>
        </div>
      )}

      {/* Top Header & Framing Disclaimer */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-teal-400">
          <BookOpenIcon className="w-5 h-5" />
          <h2 className="text-lg font-bold text-charcoal-100">Know Your Rights</h2>
        </div>
        <p className="text-xs text-charcoal-300 leading-relaxed bg-charcoal-800/60 border border-charcoal-700/80 p-3.5 rounded-2xl">
          <strong>General Information Notice:</strong> This page shares general information based on our research into Indian law and public resources. It isn't legal advice — for guidance on your specific situation, talk to your ICC, a lawyer, or a counselor.
        </p>
      </div>

      {/* Myth vs Fact Interactive Mini-Widget */}
      <div className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl p-4 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-teal-400" />
            <span>Myth vs Fact Check</span>
          </span>
          <span className="text-[10px] text-charcoal-400">Tap to test your knowledge</span>
        </div>

        <div className="space-y-3">
          {MYTH_FACT_ITEMS.map((item) => {
            const answered = userAnswers[item.id] !== undefined;
            const chosen = userAnswers[item.id];
            const isCorrect = chosen === item.isFact;

            return (
              <div key={item.id} className="bg-charcoal-900/80 border border-charcoal-700/80 p-3.5 rounded-xl space-y-2 text-xs">
                <p className="text-charcoal-200 font-medium">"{item.statement}"</p>
                
                {!answered ? (
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleAnswer(item.id, false)}
                      className="px-3 py-1 rounded-lg bg-charcoal-800 hover:bg-rose-950/80 hover:text-rose-300 border border-charcoal-700 text-charcoal-300 font-semibold text-xs transition"
                    >
                      Myth
                    </button>
                    <button
                      onClick={() => handleAnswer(item.id, true)}
                      className="px-3 py-1 rounded-lg bg-charcoal-800 hover:bg-teal-950/80 hover:text-teal-300 border border-charcoal-700 text-charcoal-300 font-semibold text-xs transition"
                    >
                      Fact
                    </button>
                  </div>
                ) : (
                  <div className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                    isCorrect 
                      ? 'bg-teal-950/60 border-teal-500/40 text-teal-200' 
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                  }`}>
                    <span className="font-bold block">
                      {item.isFact ? '✓ FACT' : '✕ MYTH'} — {isCorrect ? 'Correct!' : 'Common misconception'}
                    </span>
                    <p className="leading-snug">{item.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Expandable Topic Cards */}
      <div className="space-y-3">
        
        {/* Card 1: Workplace Harassment & POSH */}
        <div className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl overflow-hidden shadow-md transition">
          <button
            onClick={() => toggleCard('posh')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-charcoal-750 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-charcoal-100">Workplace Harassment & POSH</h3>
                <span className="text-[11px] text-charcoal-400 block">Filing windows, ICC inquiries, employer duties & coverage</span>
              </div>
            </div>
            {expandedCard === 'posh' ? <ChevronUp className="w-4 h-4 text-charcoal-400" /> : <ChevronDown className="w-4 h-4 text-charcoal-400" />}
          </button>

          {expandedCard === 'posh' && (
            <div className="p-4 pt-0 border-t border-charcoal-700/60 space-y-2 text-xs text-charcoal-300 leading-relaxed bg-charcoal-850/50">
              <p>• <strong>Who is Covered:</strong> All women employees across any employment status (full-time, part-time, intern, contractor, consultant, or visitor).</p>
              <p>• <strong>3-Month Window:</strong> Complaints must generally be filed with your Internal Complaints Committee (ICC) within 3 months. If harassment is a series of incidents, the window starts from the date of the <em>most recent incident</em>. The ICC can grant up to 3 additional months extension with justification.</p>
              <p>• <strong>Statutory Timelines:</strong> ICC must forward complaint copy to respondent within 7 days; complete inquiry within 90 days; employer must implement recommendations within 60 days.</p>
            </div>
          )}
        </div>

        {/* Card 2: Police Complaint (FIR) */}
        <div className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl overflow-hidden shadow-md transition">
          <button
            onClick={() => toggleCard('fir')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-charcoal-750 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-charcoal-100">Filing a Police Complaint (FIR)</h3>
                <span className="text-[11px] text-charcoal-400 block">Zero FIR rules, free copy rights & refusal penalties</span>
              </div>
            </div>
            {expandedCard === 'fir' ? <ChevronUp className="w-4 h-4 text-charcoal-400" /> : <ChevronDown className="w-4 h-4 text-charcoal-400" />}
          </button>

          {expandedCard === 'fir' && (
            <div className="p-4 pt-0 border-t border-charcoal-700/60 space-y-2 text-xs text-charcoal-300 leading-relaxed bg-charcoal-850/50">
              <p>• <strong>Zero FIR Rule:</strong> Under current Indian law, ANY police station must register a Zero FIR regardless of where the crime occurred and transfer it to the correct station.</p>
              <p>• <strong>Free Copy Right:</strong> You are legally entitled to receive a free, immediate copy of the registered FIR at the time of filing.</p>
              <p>• <strong>Refusal Penalty:</strong> Police officers refusing to register an FIR for cognizable offences against women commit a punishable offence under Section 166A. Complaints can be escalated directly to the SP or a Judicial Magistrate.</p>
            </div>
          )}
        </div>

        {/* Card 3: Recording Calls & Evidence */}
        <div className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl overflow-hidden shadow-md transition">
          <button
            onClick={() => toggleCard('calls')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-charcoal-750 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-charcoal-100">Recording Calls & Evidence</h3>
                <span className="text-[11px] text-charcoal-400 block">One-party consent rules & digital authentication</span>
              </div>
            </div>
            {expandedCard === 'calls' ? <ChevronUp className="w-4 h-4 text-charcoal-400" /> : <ChevronDown className="w-4 h-4 text-charcoal-400" />}
          </button>

          {expandedCard === 'calls' && (
            <div className="p-4 pt-0 border-t border-charcoal-700/60 space-y-2 text-xs text-charcoal-300 leading-relaxed bg-charcoal-850/50">
              <p>• <strong>One-Party Consent:</strong> In India, you can legally record phone calls you are personally part of without telling the other person under Supreme Court precedents.</p>
              <p>• <strong>Evidence Certification:</strong> Using recordings in formal legal/ICC proceedings requires electronic evidence certification (Section 65B IPC / Section 63 BSA).</p>
              <p>• <strong>Timely Logs Matter:</strong> Contemporaneous timestamped notes preserved right after events occur carry significant weight when building a record.</p>
            </div>
          )}
        </div>

        {/* Card 4: Support Beyond Reporting */}
        <div className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl overflow-hidden shadow-md transition">
          <button
            onClick={() => toggleCard('support')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-charcoal-750 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-charcoal-100">Support Beyond Reporting</h3>
                <span className="text-[11px] text-charcoal-400 block">Tele MANAS, counselling & unconditional helplines</span>
              </div>
            </div>
            {expandedCard === 'support' ? <ChevronUp className="w-4 h-4 text-charcoal-400" /> : <ChevronDown className="w-4 h-4 text-charcoal-400" />}
          </button>

          {expandedCard === 'support' && (
            <div className="p-4 pt-0 border-t border-charcoal-700/60 space-y-2 text-xs text-charcoal-300 leading-relaxed bg-charcoal-850/50">
              <p>• <strong>Tele MANAS (14416):</strong> Free, 24/7 national mental health and tele-counselling helpline provided by the Government of India.</p>
              <p>• <strong>Women's Helplines (181 / 1091):</strong> Immediate distress, domestic violence, and legal guidance response.</p>
              <p>• <strong>No Mandatory Complaint Needed:</strong> You can access counselling and support anytime without being required to file a formal complaint first.</p>
            </div>
          )}
        </div>

      </div>

      {/* Persistent Bottom SOS Shortcut */}
      <div className="bg-gradient-to-r from-rose-950/80 via-charcoal-800 to-rose-950/80 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="font-bold text-xs text-rose-200 block">Need immediate support or someone to talk to?</span>
          <span className="text-[11px] text-rose-300/80 block">Access 112 (Emergency), 181 (Women's Helpline), 1091, and Tele MANAS (14416)</span>
        </div>
        <button
          onClick={onOpenSos}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shrink-0 flex items-center space-x-1.5"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Open Emergency SOS →</span>
        </button>
      </div>

    </div>
  );
};

function BookOpenIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
