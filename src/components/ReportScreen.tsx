import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Eye, CheckSquare, Square, ShieldCheck, Building2, ShieldAlert, BookOpen, Sparkles, Check, AlertTriangle, AlertCircle, ArrowLeft, Camera, PhoneCall, User } from 'lucide-react';
import { Incident } from '../types';
import { ReportConfig, ReportType, downloadPdfReport, generateReportDocumentText } from '../reportEngine';
import { normalizePersonName } from '../aiEngine';

interface ReportScreenProps {
  incidents: Incident[];
  onBack?: () => void;
  onOpenRights?: () => void;
  onOpenSos?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ incidents, onBack, onOpenRights, onOpenSos }) => {
  const [reportType, setReportType] = useState<ReportType>('POSH');
  const [complainantName, setComplainantName] = useState('Ananya Sharma');
  const [complainantContact, setComplainantContact] = useState('+91 98765 43210');
  const [complainantAddress, setComplainantAddress] = useState('Bengaluru, Karnataka');
  const [respondentName, setRespondentName] = useState('Rohan Sharma');
  const [organizationOrDept, setOrganizationOrDept] = useState('Engineering Dept');
  const [embedImageAttachments, setEmbedImageAttachments] = useState(true);
  const [consentImageInclusion, setConsentImageInclusion] = useState(true);
  
  // Extract distinct respondents normalized using normalizePersonName
  const distinctRespondents = useMemo(() => {
    const map = new Map<string, { key: string; displayName: string; incidentCount: number }>();
    let unknownCount = 0;

    incidents.forEach(inc => {
      if (inc.people_involved.length === 0) {
        unknownCount++;
      } else {
        inc.people_involved.forEach(p => {
          const normKey = normalizePersonName(p.name);
          if (normKey && normKey !== 'unspecified' && normKey !== 'individual involved') {
            if (!map.has(normKey)) {
              map.set(normKey, { key: normKey, displayName: p.name, incidentCount: 0 });
            }
            map.get(normKey)!.incidentCount++;
          } else {
            unknownCount++;
          }
        });
      }
    });

    const list = Array.from(map.values());
    if (unknownCount > 0 || list.length === 0) {
      list.push({
        key: 'UNKNOWN_INDIVIDUAL',
        displayName: 'Unknown / Unidentified Individual',
        incidentCount: unknownCount
      });
    }

    return list;
  }, [incidents]);

  const [selectedRespondentKey, setSelectedRespondentKey] = useState<string>(() => {
    return distinctRespondents[0]?.key || 'UNKNOWN_INDIVIDUAL';
  });

  const selectableIncidents = useMemo(() => {
    if (reportType === 'PERSONAL') {
      return incidents;
    }

    if (!selectedRespondentKey) return incidents;

    if (selectedRespondentKey === 'UNKNOWN_INDIVIDUAL') {
      return incidents.filter(i =>
        i.people_involved.length === 0 ||
        i.people_involved.some(p => {
          const norm = normalizePersonName(p.name);
          return !norm || norm === 'unspecified' || norm === 'individual involved';
        })
      );
    }

    return incidents.filter(i =>
      i.people_involved.some(p => normalizePersonName(p.name) === selectedRespondentKey)
    );
  }, [incidents, reportType, selectedRespondentKey]);

  // Selected incident IDs (default to selectable)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => selectableIncidents.map(i => i.id));

  useEffect(() => {
    if (reportType !== 'PERSONAL') {
      const match = distinctRespondents.find(r => r.key === selectedRespondentKey);
      if (match) {
        setRespondentName(match.displayName);
      }
      setSelectedIds(selectableIncidents.map(i => i.id));
    } else {
      setSelectedIds(incidents.map(i => i.id));
    }
  }, [reportType, selectedRespondentKey, distinctRespondents, selectableIncidents, incidents]);
  
  // Preview, Export & Next Steps State
  const [showPreview, setShowPreview] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showNextStepsView, setShowNextStepsView] = useState(false);

  const selectedIncidents = useMemo(() => {
    return incidents.filter(i => selectedIds.includes(i.id));
  }, [incidents, selectedIds]);

  const checklistMissing = useMemo(() => {
    const missing: string[] = [];
    if (selectedIds.length === 0) return ['No incidents selected'];

    if (!complainantName.trim()) {
      missing.push("Complainant Name");
    }

    if (reportType === 'POSH') {
      const hasRespondent = respondentName.trim() || selectedIncidents.some(i => i.people_involved.length > 0);
      if (!hasRespondent) missing.push("Respondent Name / Role");

      const missingLocation = selectedIncidents.some(i => !i.location || i.location === 'Unspecified location');
      if (missingLocation) missing.push("Incident Location");

      const hasWitnesses = selectedIncidents.some(i => i.witnesses.length > 0);
      if (!hasWitnesses) missing.push("Witnesses");
    } else if (reportType === 'POLICE') {
      if (!complainantContact.trim()) missing.push("Complainant Contact Info");
      
      const hasAccused = respondentName.trim() || selectedIncidents.some(i => i.people_involved.length > 0);
      if (!hasAccused) missing.push("Accused Name / Identifying Details");

      const missingPlaceTime = selectedIncidents.some(i => !i.location || !i.incident_datetime);
      if (missingPlaceTime) missing.push("Specific Date/Time/Place of Offence");

      const hasEvidence = selectedIncidents.some(i => i.attachments.length > 0);
      if (!hasEvidence) missing.push("Supporting Evidence / Attachments");
    }

    return missing;
  }, [reportType, complainantName, complainantContact, respondentName, selectedIncidents, selectedIds]);

  const toggleSelectAll = () => {
    if (selectedIds.length === selectableIncidents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableIncidents.map(i => i.id));
    }
  };

  const toggleSelectIncident = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const config: ReportConfig = {
    reportType,
    complainantName,
    complainantContact,
    complainantAddress,
    respondentName,
    organizationOrDept,
    selectedIncidentIds: selectedIds,
    includeAttachmentsList: true,
    embedImageAttachments,
    consentImageInclusion,
    confidentialityNotice: true
  };

  const previewText = generateReportDocumentText(incidents, config);

  const triggerDownloadPdf = () => {
    setShowExportConfirm(true);
  };

  const handleConfirmDownloadPdf = () => {
    setShowExportConfirm(false);
    downloadPdfReport(incidents, config);
    setDownloadSuccess(true);
    setShowNextStepsView(true);
  };

  if (showNextStepsView) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Top Back to Config Navigation Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowNextStepsView(false)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-magenta hover:text-magenta-deep transition"
          >
            <ArrowLeft className="w-4 h-4 text-magenta" />
            <span>Back to Report Configuration</span>
          </button>
        </div>

        {/* Top Header */}
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          <div className="flex items-center space-x-3 text-teal-400">
            <div className="w-10 h-10 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center">
              <Check className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase font-bold block">
                PDF REPORT EXPORTED SUCCESSFULLY
              </span>
              <h2 className="text-xl font-bold text-charcoal-100">
                {reportType === 'POSH'
                  ? 'What to do with this document'
                  : reportType === 'POLICE'
                  ? 'What to do with this document'
                  : 'Your record is saved'}
              </h2>
            </div>
          </div>

          {/* Branched Content */}
          {reportType === 'POSH' && (
            <div className="space-y-4 text-xs text-charcoal-200">
              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-800">
                    1
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    Find your organization's Internal Complaints Committee (ICC). Every employer with 10+ employees is legally required to have one — ask HR for their contact details if you don't already know them.
                  </p>
                </div>

                <div className="flex items-start space-x-3 bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-800">
                    2
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    Submit this document to the ICC, in writing, within your filing window (see the deadline shown on your incident timeline).
                  </p>
                </div>

                <div className="flex items-start space-x-3 bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-800">
                    3
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    The ICC must acknowledge your complaint and begin their process — you're entitled to updates as it proceeds.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-charcoal-400 bg-charcoal-900/50 p-3 rounded-xl border border-charcoal-700/60 leading-relaxed italic">
                This document organizes your account clearly — the ICC will evaluate it based on your written statement and any evidence attached, not because it was generated by this app.
              </p>
            </div>
          )}

          {reportType === 'POLICE' && (
            <div className="space-y-4 text-xs text-charcoal-200">
              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-800">
                    1
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    This is a draft to bring with you to a police station — it's not something to email or upload; you'll typically go in person to file it as an FIR.
                  </p>
                </div>

                <div className="flex items-start space-x-3 bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-800">
                    2
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    Any police station is required to register your complaint (known as 'Zero FIR') even if the incident happened elsewhere, and forward it to the right station.
                  </p>
                </div>

                <div className="flex items-start space-x-3 bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-800">
                    3
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    You're entitled to a free copy of the FIR once it's registered — ask for it and note the FIR number for any follow-up.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-charcoal-400 bg-charcoal-900/50 p-3 rounded-xl border border-charcoal-700/60 leading-relaxed italic">
                This draft helps you present a clear, factual account — the police officer will still take your statement directly; treat this as a reference to keep your account consistent, not a replacement for that conversation.
              </p>
            </div>
          )}

          {reportType === 'PERSONAL' && (
            <div className="space-y-4 text-xs text-charcoal-200">
              <div className="bg-charcoal-900/90 p-4 rounded-2xl border border-charcoal-700 space-y-2">
                <span className="font-semibold text-teal-300 text-sm block">Personal Archive Saved</span>
                <p className="leading-relaxed text-charcoal-300">
                  No action needed right now. Keep this document somewhere safe — you can revisit or export it again anytime, and add to it if anything else happens.
                </p>
              </div>
            </div>
          )}

          {/* Universal Closing Element */}
          <div className="pt-4 border-t border-charcoal-700 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {onOpenRights && (
                <button
                  onClick={onOpenRights}
                  className="px-3.5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 border border-charcoal-700 text-teal-300 font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <BookOpen className="w-4 h-4 text-teal-400" />
                  <span>Read "Know Your Rights" Guide</span>
                </button>
              )}

              {onOpenSos && (
                <button
                  onClick={onOpenSos}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <PhoneCall className="w-4 h-4 text-rose-400" />
                  <span>Talk to Someone / Open SOS</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-charcoal-400 text-center leading-relaxed italic">
              This is general guidance, not legal advice. Processes can vary — when possible, confirm next steps with your ICC, a lawyer, or a counselor.
            </p>

            <button
              onClick={() => {
                setShowNextStepsView(false);
                if (onBack) onBack();
              }}
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center space-x-1.5"
            >
              <span>Done & Return to Timeline</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-28 relative">
      
      {/* Top Back Navigation Button */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-magenta hover:text-magenta-deep transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Timeline</span>
          </button>
        </div>
      )}

      {/* SECTION 1: TOP HERO BANNER (High-Contrast Theme Aware) */}
      <section className="rounded-3xl bg-bg-black border border-white/10 p-8 sm:p-14 shadow-2xl relative z-10 w-full space-y-4 film-grain">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-bg-black" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-magenta uppercase block">LEGAL & HR REPORT GENERATOR</span>
            <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-text-light leading-none">
              COMPILE COMPLAINT-READY DOCUMENT
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium max-w-4xl">
          Select target destination, enter details, and compile your timestamped incident logs into a clean, professional document ready for HR, POSH committees, or legal review.
        </p>
      </section>

      {/* SECTION 2: DESTINATION FORMAT SELECTION (Light Cards) */}
      <section className="space-y-4 relative z-10 w-full">
        <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">
          1. CHOOSE DESTINATION & FORMAT STANDARD
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <button
            onClick={() => setReportType('POSH')}
            className={`p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between space-y-4 shadow-lg ${
              reportType === 'POSH'
                ? 'bg-magenta text-bg-black border-magenta scale-[1.02] shadow-2xl'
                : 'bg-white text-cream-ink border-black/10 hover:border-magenta/50 hover:bg-cream/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Building2 className={`w-7 h-7 ${reportType === 'POSH' ? 'text-bg-black' : 'text-magenta'}`} />
              {reportType === 'POSH' && <span className="w-3 h-3 rounded-full bg-bg-black"></span>}
            </div>
            <div>
              <span className="font-display text-2xl block tracking-wide">HR / POSH COMMITTEE</span>
              <span className={`text-xs block mt-1 font-medium ${reportType === 'POSH' ? 'text-bg-black/80' : 'text-cream-ink/70'}`}>
                Formal workplace complaint format
              </span>
            </div>
          </button>

          <button
            onClick={() => setReportType('POLICE')}
            className={`p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between space-y-4 shadow-lg ${
              reportType === 'POLICE'
                ? 'bg-magenta text-bg-black border-magenta scale-[1.02] shadow-2xl'
                : 'bg-white text-cream-ink border-black/10 hover:border-magenta/50 hover:bg-cream/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <ShieldAlert className={`w-7 h-7 ${reportType === 'POLICE' ? 'text-bg-black' : 'text-magenta'}`} />
              {reportType === 'POLICE' && <span className="w-3 h-3 rounded-full bg-bg-black"></span>}
            </div>
            <div>
              <span className="font-display text-2xl block tracking-wide">POLICE / LEGAL DRAFT</span>
              <span className={`text-xs block mt-1 font-medium ${reportType === 'POLICE' ? 'text-bg-black/80' : 'text-cream-ink/70'}`}>
                Fact statement for law enforcement
              </span>
            </div>
          </button>

          <button
            onClick={() => setReportType('PERSONAL')}
            className={`p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between space-y-4 shadow-lg ${
              reportType === 'PERSONAL'
                ? 'bg-magenta text-bg-black border-magenta scale-[1.02] shadow-2xl'
                : 'bg-white text-cream-ink border-black/10 hover:border-magenta/50 hover:bg-cream/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <BookOpen className={`w-7 h-7 ${reportType === 'PERSONAL' ? 'text-bg-black' : 'text-magenta'}`} />
              {reportType === 'PERSONAL' && <span className="w-3 h-3 rounded-full bg-bg-black"></span>}
            </div>
            <div>
              <span className="font-display text-2xl block tracking-wide">PERSONAL RECORD</span>
              <span className={`text-xs block mt-1 font-medium ${reportType === 'PERSONAL' ? 'text-bg-black/80' : 'text-cream-ink/70'}`}>
                Chronological summary for self
              </span>
            </div>
          </button>

        </div>
      </section>

      {/* SECTION 3: METADATA INPUT FIELDS (Light White Card) */}
      <section className="bg-white border border-black/10 rounded-3xl p-8 sm:p-10 space-y-6 text-sm shadow-xl relative z-10 w-full">
        <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">
          2. DOCUMENT DETAILS & PARTIES INVOLVED
        </h2>

        {reportType !== 'PERSONAL' && (
          <div className="space-y-2 bg-cream/60 border border-black/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <User className="w-4 h-4 text-magenta" />
                <span>Select Single Respondent / Subject Person</span>
              </label>
              <span className="text-[10px] text-magenta font-semibold bg-magenta/10 px-2.5 py-0.5 rounded-full border border-magenta/20">
                Formal Complaint Scoped
              </span>
            </div>

            <select
              value={selectedRespondentKey}
              onChange={(e) => setSelectedRespondentKey(e.target.value)}
              className="w-full bg-white border border-black/15 rounded-xl p-3 text-cream-ink font-bold text-xs focus:outline-none focus:border-magenta"
            >
              {distinctRespondents.map((resp) => (
                <option key={resp.key} value={resp.key}>
                  {resp.displayName} ({resp.incidentCount} incident{resp.incidentCount !== 1 ? 's' : ''})
                </option>
              ))}
            </select>

            <p className="text-[11px] text-cream-ink/70 italic leading-snug">
              Formal complaints are filed against one respondent at a time. To report a different person, generate a separate document.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Complainant / Your Name</label>
            <input
              type="text"
              value={complainantName}
              onChange={(e) => setComplainantName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              className="w-full bg-cream/40 border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Respondent / Accused Person</label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="e.g. Rohan Sharma"
              className="w-full bg-cream/40 border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Department / Organization</label>
            <input
              type="text"
              value={organizationOrDept}
              onChange={(e) => setOrganizationOrDept(e.target.value)}
              placeholder="e.g. Engineering & Product Team"
              className="w-full bg-cream/40 border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Complainant Contact / Phone</label>
            <input
              type="text"
              value={complainantContact}
              onChange={(e) => setComplainantContact(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-cream/40 border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* SECTION 4: INCIDENT CHECKLIST SELECTION (Light White Section) */}
      <section className="space-y-4 relative z-10 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">
              3. SELECT INCIDENTS TO INCLUDE ({selectedIds.length} OF {selectableIncidents.length})
            </h2>
            {reportType !== 'PERSONAL' && (
              <span className="text-xs text-cream-ink/70 font-semibold block">
                Scoped to incidents involving {respondentName || 'selected respondent'}
              </span>
            )}
          </div>
          <button
            onClick={toggleSelectAll}
            className="text-magenta hover:underline font-bold text-xs uppercase tracking-wider shrink-0"
          >
            {selectedIds.length === selectableIncidents.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="space-y-3">
          {selectableIncidents.map(inc => {
            const isSelected = selectedIds.includes(inc.id);
            return (
              <div
                key={inc.id}
                onClick={() => toggleSelectIncident(inc.id)}
                className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 shadow-sm ${
                  isSelected
                    ? 'bg-cream/90 border-magenta text-cream-ink shadow-md'
                    : 'bg-white border-black/10 text-cream-ink/70 hover:bg-cream/30'
                }`}
              >
                <div className="flex items-center space-x-4 truncate pr-2">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-magenta shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-cream-ink/40 shrink-0" />
                  )}
                  <div className="truncate space-y-0.5">
                    <span className="font-bold text-sm block text-cream-ink truncate">
                      {inc.narrative_structured.summary}
                    </span>
                    <span className="text-xs font-mono font-medium text-cream-ink/60 block">
                      {new Date(inc.incident_datetime).toLocaleDateString()} • {inc.category} • {inc.location}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: PRE-EXPORT REQUIREMENTS CHECKLIST */}
      <section className="bg-white border border-black/10 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl relative z-10 w-full text-xs">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl text-cream-ink uppercase tracking-wider flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-magenta" />
            <span>4. PRE-EXPORT REQUIREMENTS CHECKLIST</span>
          </span>
          {checklistMissing.length === 0 ? (
            <span className="text-xs text-bg-black bg-magenta px-3 py-1 rounded-full font-bold shadow-sm">
              ✓ ALL CORE FIELDS COMPLETE
            </span>
          ) : (
            <span className="text-xs text-bg-black bg-amber-400 px-3 py-1 rounded-full font-bold shadow-sm">
              {checklistMissing.length} FIELD{checklistMissing.length > 1 ? 'S' : ''} RECOMMENDED
            </span>
          )}
        </div>

        {checklistMissing.length > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-1">
            <p className="font-semibold text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 inline mr-1" />
              <span>
                This report is missing: <strong className="underline">{checklistMissing.join(', ')}</strong>.
              </span>
            </p>
            <p className="text-xs text-amber-800/80 leading-relaxed pl-5 font-medium">
              You can still export, but adding these details may strengthen the complaint.
            </p>
          </div>
        ) : (
          <p className="text-cream-ink/80 text-xs leading-relaxed font-medium">
            All essential fields (complainant, respondent, dates, locations, and descriptions) required for {reportType === 'POSH' ? 'POSH Committee' : reportType === 'POLICE' ? 'Police Complaint' : 'Personal Record'} are present in your selected entries.
          </p>
        )}
      </section>

      {/* Evidence Image Embedding & Consent Checklist */}
      <section className="bg-white border border-black/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 relative z-10 w-full">
        <div className="flex items-center space-x-2.5 text-magenta font-display text-xl uppercase tracking-wider">
          <Camera className="w-5 h-5 text-magenta" />
          <span>Evidence Image Embedding & Consent Checklist</span>
        </div>

        <div className="space-y-3 text-xs text-cream-ink">
          <label className="flex items-start space-x-3 cursor-pointer bg-cream/50 p-3.5 rounded-2xl border border-black/10 hover:bg-cream transition">
            <input
              type="checkbox"
              checked={embedImageAttachments}
              onChange={(e) => setEmbedImageAttachments(e.target.checked)}
              className="mt-0.5 rounded bg-white border-black/20 text-magenta focus:ring-magenta shrink-0"
            />
            <div>
              <span className="font-bold block text-sm">Embed attached photo evidence directly into PDF pages</span>
              <span className="text-cream-ink/70 text-[11px] block mt-0.5">
                When checked, watermarked photos and attached image evidence are rendered directly onto the PDF pages below each incident log entry.
              </span>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer bg-cream/50 p-3.5 rounded-2xl border border-black/10 hover:bg-cream transition">
            <input
              type="checkbox"
              checked={consentImageInclusion}
              onChange={(e) => setConsentImageInclusion(e.target.checked)}
              className="mt-0.5 rounded bg-white border-black/20 text-magenta focus:ring-magenta shrink-0"
            />
            <div>
              <span className="font-bold block text-sm">Complainant Consent for Evidence Submission</span>
              <span className="text-cream-ink/70 text-[11px] block mt-0.5">
                "I confirm that I have reviewed the attached evidence photos and consent to including them in this formal complaint document."
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* SECTION 6: ACTION BUTTONS */}
      <section className="pt-4 flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full">
        <button
          onClick={() => setShowPreview(true)}
          disabled={selectedIds.length === 0}
          className="w-full sm:flex-1 py-5 rounded-full border-2 border-magenta/60 bg-white text-cream-ink hover:bg-magenta hover:text-bg-black hover:border-magenta font-display font-bold text-xl tracking-wider transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Eye className="w-5 h-5" />
          <span>PREVIEW DOCUMENT</span>
        </button>

        <button
          onClick={triggerDownloadPdf}
          disabled={selectedIds.length === 0}
          className="w-full sm:flex-1 py-5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-xl tracking-wider transition-all duration-300 shadow-xl shadow-magenta/30 hover:scale-[1.01] flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-6 h-6" />
              <span>PDF EXPORTED!</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              <span>EXPORT DOWNLOAD PDF</span>
            </>
          )}
        </button>
      </section>

      {/* UNENCRYPTED FILE WARNING MODAL */}
      {showExportConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl text-cream-ink">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="font-display text-3xl text-cream-ink leading-none">UNENCRYPTED FILE WARNING</h3>
            </div>
            <p className="text-sm text-cream-ink/80 leading-relaxed font-medium">
              This file will be saved to your device without encryption. Make sure to store or delete it somewhere safe.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowExportConfirm(false)}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownloadPdf}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md"
              >
                ACKNOWLEDGE & DOWNLOAD PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream border border-black/10 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col p-8 shadow-2xl my-auto text-cream-ink">
            
            <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-magenta hover:text-magenta-deep transition"
                >
                  <ArrowLeft className="w-4 h-4 text-magenta" />
                  <span>Back to Config</span>
                </button>
                <div>
                  <h3 className="font-display text-2xl text-cream-ink leading-none">DOCUMENT PREVIEW</h3>
                  <span className="text-[10px] font-mono font-bold text-cream-ink/60">{reportType} Template • {selectedIds.length} Incidents</span>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-cream-ink/60 hover:text-cream-ink font-bold text-xl">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-6 rounded-2xl border border-black/10 font-mono text-xs text-cream-ink leading-relaxed whitespace-pre-wrap select-text shadow-inner">
              {previewText}
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-black/10 mt-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 rounded-full border border-black/20 text-cream-ink hover:bg-white font-bold text-xs uppercase tracking-wider transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  triggerDownloadPdf();
                }}
                className="px-8 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};