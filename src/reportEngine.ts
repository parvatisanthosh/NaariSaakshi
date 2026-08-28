import { jsPDF } from 'jspdf';
import { Incident } from './types';

export type ReportType = 'POSH' | 'POLICE' | 'PERSONAL';

export interface ReportConfig {
  reportType: ReportType;
  complainantName: string;
  respondentName?: string;
  organizationOrDept?: string;
  startDate?: string;
  endDate?: string;
  selectedIncidentIds: string[];
  includeAttachmentsList: boolean;
  confidentialityNotice: boolean;
}

export function generateReportDocumentText(incidents: Incident[], config: ReportConfig): string {
  const filtered = incidents.filter(i => config.selectedIncidentIds.includes(i.id));
  const sorted = [...filtered].sort((a, b) => new Date(a.incident_datetime).getTime() - new Date(b.incident_datetime).getTime());

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (config.reportType === 'POSH') {
    return `
CONFIDENTIAL STATEMENT / FORMAL COMPLAINT
SUBMITTED TO THE INTERNAL COMPLAINTS COMMITTEE (POSH) / HUMAN RESOURCES

DATE OF SUBMISSION: ${dateStr}
COMPLAINANT: ${config.complainantName || '[Complainant Name]'}
DEPARTMENT / ORGANISATION: ${config.organizationOrDept || '[Department / Company]'}
RESPONDENT / SUBJECT: ${config.respondentName || '[Respondent Name / Role]'}

1. PURPOSE OF STATEMENT
This document serves as a formal written record and chronicle of workplace incidents of inappropriate conduct, unwelcome behavior, and/or sexual harassment experienced by the Complainant. The events detailed below have been recorded contemporaneously as they occurred.

2. CHRONOLOGICAL LIST OF INCIDENTS

${sorted.map((inc, index) => `
--------------------------------------------------------------------------------
INCIDENT #${index + 1}
Date & Time: ${new Date(inc.incident_datetime).toLocaleString()}
Location: ${inc.location}
Category: ${inc.category}
Person(s) Involved: ${inc.people_involved.map(p => `${p.name} (${p.roleOrRelationship})`).join(', ')}
Severity (Self-Rated): ${inc.severity ? `${inc.severity}/5` : 'Not specified'}

A. SUMMARY OF INCIDENT
${inc.narrative_structured.summary}

B. DETAILED FACTS & SPECIFIC ACTIONS
${inc.narrative_structured.keyActions.map(action => `• ${action}`).join('\n')}

C. ORIGINAL TRANSCRIPT / LOG
"${inc.narrative_raw}"

D. WITNESSES PRESENT
${inc.witnesses.length > 0 ? inc.witnesses.map(w => `• ${w}`).join('\n') : 'No immediate witnesses specified.'}

E. ATTACHMENTS / SUPPORTING EVIDENCE
${inc.attachments.length > 0 ? inc.attachments.map(a => `• ${a.name} (${a.type})`).join('\n') : 'No external file attached.'}
`).join('\n')}

3. PATTERN & IMPACT SUMMARY
The Complainant highlights that the above incidents demonstrate a pattern of unwelcome behavior impacting the Complainant's work environment, safety, and emotional well-being.

4. REQUESTED ACTION
The Complainant requests the Internal Complaints Committee / HR to:
a. Acknowledge receipt of this written complaint in writing.
b. Initiate appropriate proceedings in accordance with applicable POSH policies and employment regulations.
c. Ensure non-retaliation and appropriate workplace interim relief during the review process.

VERIFICATION
I hereby state that the statements made above are true and correct to the best of my knowledge and memory.

Signature: ___________________________
Date: ${dateStr}
`.trim();
  } else if (config.reportType === 'POLICE') {
    return `
FORMAL COMPLAINT STATEMENT / EVIDENTIARY LOG
FOR SUBMISSION TO LOCAL LAW ENFORCEMENT / LEGAL COUNSEL

DATE OF LOG: ${dateStr}
COMPLAINANT STATEMENT BY: ${config.complainantName || '[Full Name]'}
PRIMARY INDIVIDUAL / ACCUSED: ${config.respondentName || '[Name / Description]'}

SUBJECT: COMPLAINT REGARDING HARASSMENT, STALKING, AND/OR THREATS TO SAFETY

STATEMENT OF FACTS:
The undersigned hereby submits this detailed, timestamped chronicle of incidents occurring between ${config.startDate || 'the relevant period'} and ${config.endDate || dateStr}.

INCIDENT LOGS RECORDED CONTEMPORANEOUSLY:

${sorted.map((inc, index) => `
[INCIDENT LOG ITEM ${index + 1}]
Timestamp: ${new Date(inc.incident_datetime).toString()}
Location / Venue: ${inc.location}
Type of Offense/Conduct: ${inc.category}
Accused / Parties: ${inc.people_involved.map(p => `${p.name} (${p.roleOrRelationship})`).join(', ')}

Narrative & Facts:
${inc.narrative_structured.summary}
${inc.narrative_raw}

Witnesses / Bystanders:
${inc.witnesses.join(', ') || 'None listed'}

Evidence Documents Attached:
${inc.attachments.map(a => a.name).join(', ') || 'None'}
--------------------------------------------------------------------------------
`).join('\n')}

DECLARATION:
All log entries were recorded promptly to preserve accurate recall of events. This record is made available for official investigation purposes.

Declared at: ______________________
Date: ${dateStr}
`.trim();
  } else {
    // Personal record
    return `
EVIDENCEHER — SECURE PERSONAL INCIDENT LOG
EXPORT GENERATED ON: ${dateStr}
OWNER: ${config.complainantName || 'Personal Journal'}

SUMMARY OF RECORDS INCLUDED (${sorted.length} Entries):

${sorted.map((inc, index) => `
ENTRY #${index + 1} | ${new Date(inc.incident_datetime).toLocaleDateString()} | ${inc.category}
--------------------------------------------------------------------------------
Location: ${inc.location}
People: ${inc.people_involved.map(p => p.name).join(', ')}
Summary: ${inc.narrative_structured.summary}
Raw Notes: ${inc.narrative_raw}
Witnesses: ${inc.witnesses.join(', ') || 'None'}
Attachments: ${inc.attachments.length} file(s)
`).join('\n')}

*** End of Export ***
`.trim();
  }
}

export function downloadPdfReport(incidents: Incident[], config: ReportConfig): void {
  const textContent = generateReportDocumentText(incidents, config);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const margin = 15;
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = doc.internal.pageSize.getWidth() - margin * 2;
  
  const lines = doc.splitTextToSize(textContent, maxLineWidth);
  let cursorY = 20;

  lines.forEach((line: string) => {
    if (cursorY > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
    }
    // Simple styling for headers
    if (line.startsWith('CONFIDENTIAL STATEMENT') || line.startsWith('FORMAL COMPLAINT') || line.startsWith('EVIDENCEHER')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(line, margin, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    } else if (line.match(/^[1-9]\.\s/) || line.startsWith('INCIDENT #') || line.startsWith('[INCIDENT LOG')) {
      doc.setFont('helvetica', 'bold');
      doc.text(line, margin, cursorY);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.text(line, margin, cursorY);
    }
    cursorY += 5;
  });

  const fileName = `EvidenceHer_Report_${config.reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
