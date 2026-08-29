/**
 * Grounded Knowledge Base & Safety Routing Keywords for EvidenceHer Chatbot
 */

export const DISTRESS_KEYWORDS = [
  'unsafe', 'help', 'danger', 'followed', 'following', 'following me', 'stalked',
  'scared', 'afraid', 'terrified', 'emergency', 'attacked', 'threatened', 'hurt',
  'suicide', 'self-harm', 'die', 'ending it', 'trapped', 'locked in', 'abuse',
  'right now', 'immediately', 'panic', 'domestic violence', 'assault'
];

export const CHATBOT_KNOWLEDGE_BASE = `
EVIDENCEHER KNOWLEDGE BASE:

1. APP FEATURES & HOW THEY WORK:
- Timeline Screen: Displays all your private, timestamped incident logs stored locally on your device. Search by keyword, filter by category, or view pattern warnings.
- Log Incident: Allows logging via voice recording or text. Uses AI to automatically structure date, location, category, people involved, and summary. Includes location capture, forensic timestamp watermarked photo capture, and audio evidence preservation.
- Quick Capture: One-tap live video+audio recording mode for in-the-moment situations. Saves a draft immediately without forcing form filling. Has a Disguise Screen feature that hides the preview into a plain notes interface while recording continues.
- Record a Call: Records phone calls on speakerphone (one-party consent). Saves raw call audio and runs live rough transcription.
- Patterns Screen: AI pattern recognition analyzing repeating people, places, or categories. Includes an anonymous, aggregate "Location Hotspots" map using CARTO Dark Matter tiles and optional Firebase shared community signals.
- Report Generator: Creates formatted PDF / Text complaint documents for "HR / POSH Committee", "Police Complaint Draft (FIR)", or "Personal Records". Includes pre-export required fields checklist.
- SOS Panel: Fixed persistent button for emergency helplines: 112 (Emergency Police/Fire/Medical), 181 (Women's Helpline), 1091 (Women in Distress), 14416 (Tele MANAS mental health support), plus 1-tap call and SMS location link to a user's Trusted Contact.
- Settings: Manage PIN security lock, Quick Exit URL, Trusted Contact, local storage backup/restore, and clear location coordinates.

2. POSH ACT, 2013 FACTS & PROCESS:
- Filing Window: Complaints must generally be filed within 3 months (90 days) of the incident date. The Internal Complaints Committee (ICC) can grant an extension of up to 3 more months if satisfied that circumstances prevented timely filing.
- Incident Series Rule: If harassment occurs over a series of incidents, the 3-month filing window is calculated from the date of the MOST RECENT incident.
- Coverage: Covers any woman in any workplace, regardless of employment status (full-time, part-time, intern, contractor, consultant, or visitor).
- ICC Inquiry Timeline: 7 days to forward complaint copy to respondent; 90 days to complete inquiry; 60 days for employer to implement ICC recommendations.

3. POLICE COMPLAINT & FIR BASICS:
- Zero FIR: Under Indian law, ANY police station is required to register a 'Zero FIR' regardless of jurisdiction and transfer it to the appropriate jurisdictional station.
- Free Copy Entitlement: You are legally entitled to receive a free, immediate copy of the registered FIR at the time of filing.
- Refusal Penalty: Police refusal to register an FIR for cognizable offences against women is punishable under Section 166A of the IPC/BNS. Escalation can be made directly to the Superintendent of Police (SP) or a Judicial Magistrate under Section 156(3).

4. CALL RECORDING & CONSENT LAWS:
- One-Party Consent: Under Indian Supreme Court precedents, recording a call that you are personally a participant in without informing the other party is generally permissible and not illegal wiretapping. (Does not apply to recording third-party conversations you are not in).
- Evidence Certification: Formal use of digital/audio recordings in court or ICC proceedings usually requires a certificate under Section 65B of the Indian Evidence Act / Section 63 of BSA.
`;

export function isDistressMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return DISTRESS_KEYWORDS.some(word => lower.includes(word));
}

export function searchKnowledgeBase(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes('posh') || lower.includes('deadline') || lower.includes('icc') || lower.includes('3 month') || lower.includes('employer') || lower.includes('workplace')) {
    return `Regarding POSH (Workplace Harassment):\n• Complaints must generally be filed with your ICC within 3 months of the incident date (extendable by 3 more months with justification).\n• If harassment involves a series of incidents, the 3-month window starts from the date of the MOST RECENT incident.\n• The ICC must complete its inquiry within 90 days.\n• All women employees, interns, contractors, and visitors are covered.`;
  }

  if (lower.includes('fir') || lower.includes('police') || lower.includes('zero fir') || lower.includes('refuse') || lower.includes('station')) {
    return `Regarding FIRs and Police Complaints:\n• Zero FIR: Any police station MUST register a Zero FIR regardless of where the incident happened and transfer it to the correct station.\n• Free Copy: You are legally entitled to a free copy of the FIR upon registration.\n• Refusal to file an FIR for offences against women is an offence itself under Section 166A IPC/BNS. You can escalate directly to the SP or a Magistrate.`;
  }

  if (lower.includes('call') || lower.includes('record') || lower.includes('consent') || lower.includes('legal') || lower.includes('phone')) {
    return `Regarding Call Recording & Consent:\n• In India, you can legally record phone calls you are personally part of (one-party consent) without informing the other person.\n• For best audio quality, use speakerphone.\n• Formally submitting audio as courtroom evidence usually requires an electronic evidence certificate (Section 65B IPC / Section 63 BSA).`;
  }

  if (lower.includes('report') || lower.includes('pdf') || lower.includes('export')) {
    return `Regarding Reports in EvidenceHer:\n• Go to the "Report" tab to generate formatted PDF / Text complaint documents for "HR / POSH Committee", "Police Complaint Draft (FIR)", or "Personal Records".\n• Includes an automatic pre-export checklist to ensure required fields (dates, names, locations) are filled.`;
  }

  if (lower.includes('quick capture') || lower.includes('video') || lower.includes('disguise')) {
    return `Regarding Quick Capture:\n• Tap "Quick Capture" in the top header for instant 1-tap live video & audio recording.\n• Includes a "Disguise Screen" toggle that hides the camera preview into a plain notes screen while recording continues in the background.\n• Saves a draft instantly to your timeline so you can add narrative details later when safe.`;
  }

  if (lower.includes('sos') || lower.includes('helpline') || lower.includes('contact') || lower.includes('trusted')) {
    return `Regarding Emergency & SOS:\n• Persistent SOS button in the top header gives 1-tap calls to 112 (Emergency), 181 (Women's Helpline), 1091 (Women in Distress), and 14416 (Tele MANAS).\n• You can also configure a Trusted Contact in Settings for 1-tap calls and location SMS sharing.`;
  }

  return `I can help explain how app features work (Timeline, Quick Capture, Call Recording, Reports, SOS) or general facts about POSH complaints, FIRs (Zero FIR), and call recording consent in India.\n\nThis is general information, not legal advice — for your specific situation, check with your ICC or a lawyer.`;
}
