import React, { useState } from 'react';
import { FileText, Download, Eye, CheckSquare, Square, ShieldCheck, Building2, ShieldAlert, BookOpen, Sparkles, Check } from 'lucide-react';
import { Incident } from '../types';
import { ReportConfig, ReportType, downloadPdfReport, generateReportDocumentText } from '../reportEngine';

interface ReportScreenProps {
  incidents: Incident[];
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ incidents }) => {
  const [reportType, setReportType] = useState<ReportType>('POSH');
  const [complainantName, setComplainantName] = useState('Ananya Sharma');
  const [respondentName, setRespondentName] = useState('Rohan Sharma');
  const [organizationOrDept, setOrganizationOrDept] = useState('Engineering Dept');
  
  // Selected incident IDs (default to all)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => incidents.map(i => i.id));
  
  // Preview Modal
  const [showPreview, setShowPreview] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
    respondentName,
    organizationOrDept,
    selectedIncidentIds: selectedIds,
    includeAttachmentsList: true,
    confidentialityNotice: true
  };

  const previewText = generateReportDocumentText(incidents, config);

  const handleDownloadPdf = () => {
    downloadPdfReport(incidents, config);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Complaint & Evidence Report Generator</span>
        </div>
        <h2 className="text-lg font-semibold text-charcoal-100">Compile Complaint-Ready Document</h2>
        <p className="text-xs text-charcoal-300 leading-relaxed">
          Select target destination, enter details, and compile your timestamped incident logs into a clean, professional document ready for HR, POSH committees, or legal review.
        </p>
      </div>

      {/* 1. Target Format Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
          1. Choose Destination & Format Standard
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            onClick={() => setReportType('POSH')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              reportType === 'POSH'
                ? 'bg-teal-950/60 border-teal-500 shadow-md ring-1 ring-teal-500/40 text-teal-200'
                : 'bg-charcoal-800/60 border-charcoal-700 text-charcoal-300 hover:border-charcoal-600'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Building2 className={`w-5 h-5 ${reportType === 'POSH' ? 'text-teal-400' : 'text-charcoal-400'}`} />
              {reportType === 'POSH' && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
            </div>
            <div>
              <span className="text-xs font-semibold block">HR / POSH Committee</span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">Formal workplace complaint format</span>
            </div>
          </button>

          <button
            onClick={() => setReportType('POLICE')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              reportType === 'POLICE'
                ? 'bg-teal-950/60 border-teal-500 shadow-md ring-1 ring-teal-500/40 text-teal-200'
                : 'bg-charcoal-800/60 border-charcoal-700 text-charcoal-300 hover:border-charcoal-600'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <ShieldAlert className={`w-5 h-5 ${reportType === 'POLICE' ? 'text-teal-400' : 'text-charcoal-400'}`} />
              {reportType === 'POLICE' && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
            </div>
            <div>
              <span className="text-xs font-semibold block">Police / Legal Draft</span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">Fact statement for law enforcement</span>
            </div>
          </button>

          <button
            onClick={() => setReportType('PERSONAL')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              reportType === 'PERSONAL'
                ? 'bg-teal-950/60 border-teal-500 shadow-md ring-1 ring-teal-500/40 text-teal-200'
                : 'bg-charcoal-800/60 border-charcoal-700 text-charcoal-300 hover:border-charcoal-600'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <BookOpen className={`w-5 h-5 ${reportType === 'PERSONAL' ? 'text-teal-400' : 'text-charcoal-400'}`} />
              {reportType === 'PERSONAL' && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
            </div>
            <div>
              <span className="text-xs font-semibold block">Personal Record</span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">Chronological summary for self</span>
            </div>
          </button>

        </div>
      </div>

      {/* 2. Metadata Input Fields */}
      <div className="bg-charcoal-800/60 border border-charcoal-700/80 rounded-2xl p-5 space-y-4 text-xs">
        <label className="block font-semibold text-charcoal-400 uppercase tracking-wider">
          2. Document Details & Parties Involved
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-charcoal-300 mb-1 font-medium">Complainant / Your Name</label>
            <input
              type="text"
              value={complainantName}
              onChange={(e) => setComplainantName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-charcoal-300 mb-1 font-medium">Respondent / Subject Person</label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="e.g. Rohan Sharma"
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-charcoal-300 mb-1 font-medium">Department / Organization</label>
          <input
            type="text"
            value={organizationOrDept}
            onChange={(e) => setOrganizationOrDept(e.target.value)}
            placeholder="e.g. Engineering & Product Team"
            className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* 3. Incident Checklist Selection */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-charcoal-400 uppercase tracking-wider">
            3. Select Incidents to Include ({selectedIds.length} of {incidents.length})
          </label>
          <button
            onClick={toggleSelectAll}
            className="text-teal-400 hover:underline font-medium text-xs"
          >
            {selectedIds.length === incidents.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="space-y-2">
          {incidents.map(inc => {
            const isSelected = selectedIds.includes(inc.id);
            return (
              <div
                key={inc.id}
                onClick={() => toggleSelectIncident(inc.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'bg-charcoal-800 border-teal-500/60 text-charcoal-100'
                    : 'bg-charcoal-900/40 border-charcoal-700/60 text-charcoal-400'
                }`}
              >
                <div className="flex items-center space-x-3 truncate pr-2">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-teal-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-charcoal-500 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-medium text-xs block text-charcoal-200 truncate">
                      {inc.narrative_structured.summary}
                    </span>
                    <span className="text-[10px] text-charcoal-400">
                      {new Date(inc.incident_datetime).toLocaleDateString()} • {inc.category} • {inc.location}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => setShowPreview(true)}
          disabled={selectedIds.length === 0}
          className="w-full sm:flex-1 py-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 font-medium text-xs transition border border-charcoal-700 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Eye className="w-4 h-4 text-teal-400" />
          <span>Preview Document</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={selectedIds.length === 0}
          className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-medium text-xs transition shadow-lg shadow-teal-900/40 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>PDF Exported!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Download PDF</span>
            </>
          )}
        </button>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl my-auto">
            
            <div className="flex items-center justify-between border-b border-charcoal-700 pb-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-charcoal-100">Document Preview</h3>
                <span className="text-xs text-charcoal-400">{reportType} Template • {selectedIds.length} Incidents</span>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-charcoal-400 hover:text-charcoal-100">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-charcoal-950 p-4 rounded-xl border border-charcoal-700/80 font-mono text-[11px] text-charcoal-200 leading-relaxed whitespace-pre-wrap select-text">
              {previewText}
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-charcoal-700 mt-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 text-xs font-medium"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleDownloadPdf();
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
