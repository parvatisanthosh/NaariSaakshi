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
DRAFT — FOR REVIEW BEFORE FILING. NOT LEGAL ADVICE.
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
  const filtered = incidents.filter(i => config.selectedIncidentIds.includes(i.id));
  const sorted = [...filtered].sort((a, b) => new Date(a.incident_datetime).getTime() - new Date(b.incident_datetime).getTime());

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 170mm
  const topMargin = 25;
  const bottomMargin = 22;

  let y = topMargin;

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Date range determination
  const firstDate = sorted.length > 0 ? new Date(sorted[0].incident_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
  const lastDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].incident_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
  const dateRangeText = sorted.length > 0 ? `${firstDate} – ${lastDate}` : 'No entries';

  let documentTitle = 'INCIDENT COMPLAINT & EVIDENTIARY REPORT';
  if (config.reportType === 'POSH') {
    documentTitle = 'FORMAL COMPLAINT STATEMENT — HR / POSH COMMITTEE';
  } else if (config.reportType === 'POLICE') {
    documentTitle = 'INCIDENT CHRONOLOGY LOG — LAW ENFORCEMENT DRAFT';
  } else if (config.reportType === 'PERSONAL') {
    documentTitle = 'EVIDENCEHER — PERSONAL INCIDENT JOURNAL LOG';
  }

  // Helper for adding new page with consistent margins
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = topMargin;
      return true;
    }
    return false;
  };

  // --- COVER SECTION (PAGE 1 TOP) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 34, 40);
  doc.text(documentTitle, leftMargin, y);
  y += 8;

  doc.setLineWidth(0.8);
  doc.setDrawColor(45, 51, 60);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 8;

  // Cover Metadata Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const metaRows = [
    ['Date Generated:', dateStr],
    ['Complainant Name:', config.complainantName || '[Not Specified]'],
    ['Respondent / Subject:', config.respondentName || '[Not Specified]'],
    ['Organization / Dept:', config.organizationOrDept || '[Not Specified]'],
    ['Date Range Covered:', dateRangeText],
    ['Total Logged Incidents:', `${sorted.length} Entries Recorded`]
  ];

  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, leftMargin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, leftMargin + 48, y);
    y += 5.5;
  });

  if (config.reportType === 'POLICE') {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 40, 40);
    doc.text('DRAFT — FOR REVIEW BEFORE FILING. NOT LEGAL ADVICE.', leftMargin, y);
    doc.setTextColor(50, 50, 50);
    y += 5;
  }

  y += 4;
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 8;

  // --- INCIDENTS LIST ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('CHRONOLOGICAL INCIDENT RECORD', leftMargin, y);
  y += 8;

  sorted.forEach((inc, index) => {
    checkPageBreak(35);

    // Section Header for Incident
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 34, 40);
    doc.text(`INCIDENT ENTRY #${index + 1} — ${inc.category.toUpperCase()}`, leftMargin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);

    const details = [
      `Date & Time: ${new Date(inc.incident_datetime).toLocaleString()}`,
      `Location: ${inc.location || 'Unspecified'}`,
      `Persons Involved: ${inc.people_involved.map(p => `${p.name} (${p.roleOrRelationship})`).join(', ') || 'None listed'}`,
      `Self-Rated Severity: ${inc.severity ? `${inc.severity} / 5` : 'Unrated'}`
    ];

    details.forEach(detail => {
      checkPageBreak(5);
      doc.text(detail, leftMargin + 3, y);
      y += 4.5;
    });

    y += 2;

    // Structured Summary
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', leftMargin + 3, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(inc.narrative_structured.summary, contentWidth - 6);
    summaryLines.forEach((line: string) => {
      checkPageBreak(4.5);
      doc.text(line, leftMargin + 3, y);
      y += 4.5;
    });

    // Key Actions / Specific Facts
    if (inc.narrative_structured.keyActions && inc.narrative_structured.keyActions.length > 0) {
      y += 2;
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Specific Actions & Facts:', leftMargin + 3, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      inc.narrative_structured.keyActions.forEach(action => {
        const actionLines = doc.splitTextToSize(`• ${action}`, contentWidth - 9);
        actionLines.forEach((line: string) => {
          checkPageBreak(4.5);
          doc.text(line, leftMargin + 6, y);
          y += 4.5;
        });
      });
    }

    // Original Raw Notes
    if (inc.narrative_raw) {
      y += 2;
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Contemporaneous Raw Log:', leftMargin + 3, y);
      y += 4.5;
      doc.setFont('helvetica', 'italic');
      const rawLines = doc.splitTextToSize(`"${inc.narrative_raw}"`, contentWidth - 9);
      rawLines.forEach((line: string) => {
        checkPageBreak(4.5);
        doc.text(line, leftMargin + 6, y);
        y += 4.5;
      });
      doc.setFont('helvetica', 'normal');
    }

    // Witnesses
    y += 2;
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Witnesses Present: `, leftMargin + 3, y);
    doc.setFont('helvetica', 'normal');
    const witnessStr = inc.witnesses.length > 0 ? inc.witnesses.join(', ') : 'None listed';
    doc.text(witnessStr, leftMargin + 38, y);
    y += 5;

    // Attachments
    if (inc.attachments.length > 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Attached Evidence: `, leftMargin + 3, y);
      doc.setFont('helvetica', 'normal');
      const attachStr = inc.attachments.map(a => `${a.name} (${a.type})`).join(', ');
      doc.text(attachStr, leftMargin + 38, y);
      y += 5;
    }

    // Rule separator between incidents
    y += 3;
    checkPageBreak(6);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 8;
  });

  // Concluding Formal Statement for POSH
  if (config.reportType === 'POSH') {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CONCLUDING STATEMENT & REQUEST FOR ACTION', leftMargin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const poshConcl = `The Complainant submits this formal chronicle of events to the Internal Complaints Committee (POSH) for official acknowledgment and review. The documented entries reflect a sequence of unwelcome workplace conduct recorded contemporaneously as events occurred. The Complainant requests formal written acknowledgment of receipt and initiation of proceedings in accordance with applicable POSH policies and regulations.`;
    const poshLines = doc.splitTextToSize(poshConcl, contentWidth);
    poshLines.forEach((line: string) => {
      checkPageBreak(4.5);
      doc.text(line, leftMargin, y);
      y += 4.5;
    });

    y += 12;
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFICATION & SIGNATURE', leftMargin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('I hereby verify that the details recorded herein represent an accurate statement of facts to the best of my knowledge.', leftMargin, y);
    y += 12;
    doc.text('Complainant Signature: ___________________________', leftMargin, y);
    doc.text(`Date: ${dateStr}`, leftMargin + 110, y);
  }

  // --- FOOTER & PAGE NUMBERS ON ALL PAGES ---
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    // Header line on pages 2+
    if (i > 1) {
      doc.text(documentTitle, leftMargin, 12);
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, 14, pageWidth - rightMargin, 14);
    }

    // Bottom Footer
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, pageHeight - 12, pageWidth - rightMargin, pageHeight - 12);

    doc.text(`EvidenceHer Private Log Report • Confidential`, leftMargin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - rightMargin - 18, pageHeight - 7);
  }

  const fileName = `EvidenceHer_Report_${config.reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
