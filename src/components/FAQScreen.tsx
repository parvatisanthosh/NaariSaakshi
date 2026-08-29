import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Lock, FileText, Smartphone, Globe, Sparkles } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Privacy & Security',
    question: 'Where is my incident data stored? Is it safe?',
    answer: 'Your data is 100% stored locally on your device in browser storage using AES-GCM 256-bit encryption. No incident notes, names, or voice transcripts are ever transmitted to any central server or cloud database.'
  },
  {
    category: 'Privacy & Security',
    question: 'What does the Quick Exit button do?',
    answer: 'The Quick Exit button located at the top right of the application instantly redirects your current browser page to a neutral website (e.g. weather forecast) with a single tap if someone approaches you while you are using the app.'
  },
  {
    category: 'Privacy & Security',
    question: 'How does the App PIN Lock work?',
    answer: 'You can enable a 4-digit security PIN in Settings. Once enabled, NaariSaakshi will automatically lock after 3 minutes of inactivity or 30 seconds after switching browser tabs, requiring your PIN to reopen.'
  },
  {
    category: 'Features & Journaling',
    question: 'How does Voice Recording & AI Structuring work?',
    answer: 'When logging an incident, you can speak in your own words. The built-in AI engine transcribes your speech locally and automatically extracts specific dates, locations, people involved, key actions, and witness details into a structured entry.'
  },
  {
    category: 'Features & Journaling',
    question: 'What is Pattern Detection and Escalation Scoring?',
    answer: 'NaariSaakshi cross-references your logged entries over time to identify recurring offenders, frequent harassment locations, or escalating frequency. When 2 or more incidents involve the same individual or place, the app alerts you with an escalation score (1-10).'
  },
  {
    category: 'Legal & Reports',
    question: 'Can I export reports for POSH committees or Police complaints?',
    answer: 'Yes! Under the "Report" section, you can select which incidents to include and choose between HR/POSH Committee formats, Police FIR draft formats, or Personal Chronology logs. You can preview the draft and download a PDF in one click.'
  },
  {
    category: 'Legal & Reports',
    question: 'What is the POSH Filing Window Indicator?',
    answer: 'Under the POSH Act 2013, complaints should ideally be submitted within 3 months of the last incident in a series. NaariSaakshi automatically calculates and displays your remaining filing window for each incident or incident series.'
  },
  {
    category: 'Community Safety Signals',
    question: 'What are Community Safety Signals? Is my identity revealed?',
    answer: 'Community Safety Signals allow you to voluntarily contribute an anonymous location count (+1) to a shared grid map (~100m grid cell) when logging an incident. NO names, NO narratives, NO timestamps, and NO personal identifiers are ever sent — only an anonymous aggregate count.'
  }
];

export const FAQScreen: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Privacy & Security', 'Features & Journaling', 'Legal & Reports', 'Community Safety Signals'];

  const filteredFaqs = FAQS.filter(
    item => selectedCategory === 'All' || item.category === selectedCategory
  );

  return (
    <div className="w-full space-y-10 pb-28 relative">
      
      {/* SECTION 1: TOP BANNER (Cream Contrast Background) */}
      <section className="rounded-3xl bg-cream text-cream-ink p-8 sm:p-14 shadow-2xl border border-black/10 relative z-10 w-full space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-lg">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-cream-ink/60 uppercase block">HELP & KNOWLEDGE BASE</span>
            <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-cream-ink leading-none">
              FREQUENTLY ASKED QUESTIONS
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-cream-ink/80 leading-relaxed font-medium max-w-4xl">
          Everything you need to know about NaariSaakshi's encryption, AI incident structuring, POSH complaint exports, and community safety signals.
        </p>
      </section>

      {/* SECTION 2: CATEGORY FILTERS */}
      <section className="space-y-4 relative z-10 w-full">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border shadow-sm ${
                selectedCategory === cat
                  ? 'bg-magenta text-bg-black border-magenta scale-105 shadow-md'
                  : 'bg-white text-cream-ink border-black/10 hover:border-magenta/50 hover:bg-cream/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 3: FAQ ACCORDION CARDS (Light White Cards) */}
      <section className="space-y-4 relative z-10 w-full">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-3xl border transition-all duration-300 shadow-md overflow-hidden ${
                isOpen ? 'bg-white border-magenta shadow-xl' : 'bg-white/80 border-black/10 hover:bg-white'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="font-display text-2xl sm:text-3xl text-cream-ink tracking-wide leading-tight">
                  {faq.question}
                </span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                  isOpen ? 'bg-magenta text-bg-black rotate-180' : 'bg-cream text-cream-ink'
                }`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-cream-ink/80 leading-relaxed font-medium border-t border-black/5 animate-fade-in">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* SECTION 4: STILL HAVE QUESTIONS CARD */}
      <section className="rounded-3xl bg-cream text-cream-ink p-8 sm:p-12 space-y-4 shadow-2xl border border-black/10 relative z-10 w-full text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <h3 className="font-display text-3xl sm:text-4xl text-cream-ink tracking-wide">
            STILL HAVE PRIVACY OR LEGAL QUESTIONS?
          </h3>
          <p className="text-xs sm:text-sm text-cream-ink/80 font-medium leading-relaxed">
            All data remains 100% on your device. For POSH Act procedures or legal consultations, refer to your local ICC or legal advisor.
          </p>
        </div>

        <button
          onClick={() => window.location.href = 'mailto:support@naarisaakshi.in'}
          className="px-8 py-4 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider transition shadow-lg shrink-0"
        >
          CONTACT SUPPORT
        </button>
      </section>

    </div>
  );
};