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
- Log Incident: Allows logging via voice recording or text. Auto-suggests date, location, category, people involved, and summary using on-device rules; you review and edit every field before saving. Includes optional location capture, photos with a visible date/time label, and audio notes.
- Quick Capture: One-tap live video+audio recording mode for in-the-moment situations. Saves a draft immediately without forcing form filling. Has a Disguise Screen feature that hides the preview into a plain notes interface while recording continues.
- Record a Call: Records your side of a speakerphone call and a rough transcript. Read the recording guidance first; whether recording is appropriate depends on context.
- Patterns Screen: Rule-based summary of repeating people, places, or categories in your own entries, with a map of entries you chose to tag with a location. Shared community signals are paused pending a privacy review.
- Report Generator: Creates formatted PDF / Text complaint documents for "HR / POSH Committee", "Police Complaint Draft (FIR)", or "Personal Records". Includes pre-export required fields checklist.
- SOS Panel: Fixed persistent button for emergency helplines: 112 (Emergency Police/Fire/Medical), 181 (Women's Helpline), 1091 (Women in Distress), 14416 (Tele MANAS mental health support), plus 1-tap call and SMS location link to a user's Trusted Contact.
- Settings: Set a passphrase to lock the encrypted journal (with a one-time recovery code), Quick Exit URL, Trusted Contact, backup/restore, and clearing location coordinates.

2. POSH ACT, 2013 FACTS & PROCESS:
- Filing Window: Complaints must generally be filed within three months of the incident date (POSH Act Section 9). The Internal Complaints Committee (ICC) can grant an extension of up to 3 more months if satisfied that circumstances prevented timely filing.
- Incident Series Rule: If harassment occurs over a series of incidents, the 3-month filing window is calculated from the date of the MOST RECENT incident.
- Coverage: Covers any woman in any workplace, regardless of employment status (full-time, part-time, intern, contractor, consultant, or visitor).
- ICC Inquiry Timeline: 7 days to forward complaint copy to respondent; 90 days to complete inquiry; 60 days for employer to implement ICC recommendations.

3. POLICE COMPLAINT & FIR BASICS:
- Zero FIR: Under Indian law, ANY police station is required to register a 'Zero FIR' regardless of jurisdiction and transfer it to the appropriate jurisdictional station.
- Free Copy Entitlement: You are legally entitled to receive a free, immediate copy of the registered FIR at the time of filing.
- Refusal Penalty: A public servant who fails to record information about certain offences against women can be punished under Section 199 of the Bharatiya Nyaya Sanhita (formerly Section 166A IPC). You can escalate to the Superintendent of Police (SP) or apply to a Magistrate under Section 175(3) of the BNSS (formerly Section 156(3) CrPC).

4. CALL RECORDING & CONSENT LAWS:
- Recordings as Evidence: Indian courts have admitted recordings of conversations when relevant, accurate and untampered (R.M. Malkani v. State of Maharashtra, 1973). This is not a blanket permission to record: privacy, workplace policy and the setting matter. Only record conversations you are part of, and never in private spaces.
- Evidence Certification: Formal use of recordings in court usually requires a certificate under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B of the Indian Evidence Act). Keep the original, unedited file.
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
    return `Regarding FIRs and Police Complaints:\n• Zero FIR: Any police station MUST register a Zero FIR regardless of where the incident happened and transfer it to the correct station.\n• Free Copy: You are legally entitled to a free copy of the FIR upon registration.\n• Failing to record information about certain offences against women is itself punishable (Section 199 BNS, formerly 166A IPC). You can escalate to the SP or a Magistrate.`;
  }

  if (lower.includes('call') || lower.includes('record') || lower.includes('consent') || lower.includes('legal') || lower.includes('phone')) {
    return `Regarding Recording Calls:\n• Courts have accepted recordings as evidence when relevant, accurate and untampered, but that is not blanket permission to record. Privacy, workplace policy and the setting matter.\n• Only record conversations you are part of, and stop if it puts you at risk.\n• Using audio in court usually requires the original file and a certificate under Section 63 of the Bharatiya Sakshya Adhiniyam (formerly Section 65B of the Evidence Act).\n• This is general information, not legal advice.`;
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
