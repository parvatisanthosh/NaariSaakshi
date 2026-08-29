import React, { useState, useMemo } from 'react';
import { FileText, Download, Eye, CheckSquare, Square, ShieldCheck, Building2, ShieldAlert, BookOpen, Sparkles, Check, AlertTriangle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Incident } from '../types';
import { ReportConfig, ReportType, downloadPdfReport, generateReportDocumentText } from '../reportEngine';

interface ReportScreenProps {
  incidents: Incident[];
  onBack?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ incidents, onBack }) => {
  const [reportType, setReportType] = useState<ReportType>('POSH');
  const [complainantName, setComplainantName] = useState('Ananya Sharma');
  const [complainantContact, setComplainantContact] = useState('+91 98765 43210');
  const [complainantAddress, setComplainantAddress] = useState('Bengaluru, Karnataka');
  const [respondentName, setRespondentName] = useState('Rohan Sharma');
  const [organizationOrDept, setOrganizationOrDept] = useState('Engineering Dept');
  
  // Selected incident IDs (default to all)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => incidents.map(i => i.id));
  
  // Preview & Export Modal State
  const [showPreview, setShowPreview] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

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
    if (selectedIds.length === incidents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(incidents.map(i => i.id));
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
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="w-full space-y-10 pb-28 relative">
      
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

      {/* Top Banner */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Complaint & Evidence Report Generator</span>
        </div>

        <p className="text-sm sm:text-base text-cream-ink/80 leading-relaxed font-medium max-w-4xl">
          Select target destination, enter details, and compile your timestamped incident logs into a clean, professional document ready for HR, POSH committees, or legal review.
        </p>
      </div>

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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wider text-cream-ink uppercase">
            3. SELECT INCIDENTS TO INCLUDE ({selectedIds.length} OF {incidents.length})
          </h2>
          <button
            onClick={toggleSelectAll}
            className="text-magenta hover:underline font-bold text-xs uppercase tracking-wider"
          >
            {selectedIds.length === incidents.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="space-y-3">
          {incidents.map(inc => {
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
              <div>
                <h3 className="font-display text-3xl text-cream-ink leading-none">DOCUMENT PREVIEW</h3>
                <span className="text-xs font-mono font-bold text-cream-ink/60">{reportType} Template • {selectedIds.length} Incidents</span>
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