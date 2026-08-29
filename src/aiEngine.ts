import { CategoryType, Incident, PatternCluster, PatternInsightReport, PersonInvolved, StructuredNarrative } from './types';

export interface ExtractionResult {
  incident_datetime: string;
  location: string;
  people_involved: PersonInvolved[];
  category: CategoryType;
  structured_narrative: StructuredNarrative;
  witnesses: string[];
  suggested_tags: string[];
  severity_estimate?: number;
}

/**
 * Normalizes a person name for resilient cross-incident matching.
 * - Trims whitespace & collapses multiple spaces
 * - Strips out known title/role prefixes if accidentally merged
 * - Converts to lowercase for comparison
 */
export function normalizePersonName(rawName: string): string {
  if (!rawName) return '';
  
  let cleaned = rawName.trim().replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
  cleaned = cleaned.replace(/^(mr\.|mrs\.|ms\.|dr\.|manager|boss|supervisor|driver)\s+/i, '');
  
  return cleaned.toLowerCase();
}

/**
 * Category Classification Priority Engine
 * Explicit Rules:
 * 1. Digital (Highest priority medium): Unwanted photos, videos, filming/recording without consent,
 *    screenshots, chat DMs (Slack, WhatsApp, Teams, social media), emails, device-based tracking/messaging.
 * 2. Physical (Highest priority concrete act): Unwanted touching, grabbing, shoulder touch,
 *    slapping, physical contact.
 * 3. Quid-Pro-Quo: Conditioning benefits (ratings, appraisal, promotion, opportunities, job security) on personal compliance.
 * 4. Stalking: Repeated following, trailing vehicle, waiting outside locations, tracking movement over time/locations.
 * 5. Financial / Economic: Fine, pay deduction, salary withholding.
 * 6. Intimidation / Non-verbal: Standalone non-verbal conduct with no direct verbal, physical, or digital contact.
 *    E.g. prolonged staring, glare, lingering/loitering nearby without speaking or touching, blocking path without contact,
 *    following at a distance without approach, hostile non-verbal gestures.
 * 7. Verbal: Language-based conduct, comments, remarks, jokes, raised voices WITHOUT any digital/recording/device component.
 * 8. Other: Ambiguous cases.
 * 
 * Example Anchors:
 * - "Someone recorded a video of me under my desk without asking" -> Digital
 * - "He touched my shoulder and offered a top appraisal if I attend dinner" -> Physical
 * - "Someone stared at me for several minutes in a way that felt off" -> Intimidation / Non-verbal
 * - "He stood in the doorway blocking my exit without saying anything or touching me" -> Intimidation / Non-verbal
 * - "He shouted rude comments at me in the meeting" -> Verbal
 */
export function classifyCategory(rawText: string): CategoryType {
  const lower = rawText.toLowerCase();

  // 1. Digital priority check (includes video, photo, recording without consent, electronic messages)
  const isDigital = 
    lower.includes('record') || lower.includes('video') || lower.includes('filming') || lower.includes('camera') ||
    lower.includes('photo') || lower.includes('picture') || lower.includes('screenshot') || lower.includes('slack') ||
    lower.includes('whatsapp') || lower.includes('email') || lower.includes('dm') || lower.includes('message') ||
    lower.includes('texted') || lower.includes('online') || lower.includes('zoom') || lower.includes('teams');

  if (isDigital) return 'Digital';

  // 2. Physical priority check
  const isPhysical = 
    lower.includes('touch') || lower.includes('grab') || lower.includes('pushed') || lower.includes('slapped') ||
    lower.includes('shoulder') || lower.includes('physical') || lower.includes('held');

  if (isPhysical) return 'Physical';

  // 3. Quid-Pro-Quo priority check
  const isQuidProQuo = 
    lower.includes('appraisal') || lower.includes('promotion') || lower.includes('rating') ||
    lower.includes('favor') || lower.includes('fire') || (lower.includes('if you') && lower.includes('job'));

  if (isQuidProQuo) return 'Quid-Pro-Quo';

  // 4. Stalking priority check
  const isStalking = 
    lower.includes('follow') || lower.includes('trailed') || lower.includes('car') ||
    lower.includes('parking') || lower.includes('stalk') || lower.includes('waiting outside');

  if (isStalking) return 'Stalking';

  // 5. Financial / Economic check
  const isFinancial = lower.includes('pay') || lower.includes('salary') || lower.includes('fine') || lower.includes('money');
  if (isFinancial) return 'Financial / Economic';

  // 6. Intimidation / Non-verbal check
  const isIntimidation = 
    lower.includes('stare') || lower.includes('staring') || lower.includes('stared') || lower.includes('glare') ||
    lower.includes('glaring') || lower.includes('loitering') || lower.includes('lingering') || lower.includes('gesture') ||
    lower.includes('blocking') || lower.includes('blocked') || lower.includes('standing close') || lower.includes('non-verbal') ||
    lower.includes('silent') || lower.includes('gazing');

  if (isIntimidation) return 'Intimidation / Non-verbal';

  // 7. Verbal (Only if strictly spoken language)
  return 'Verbal';
}

/**
 * Intelligent local NLP-based extraction engine for offline/demo reliability
 * Ensures clean category priority and name separation.
 */
export function extractIncidentFromRawText(rawText: string): ExtractionResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Extract Category using Priority Classifier
  const category: CategoryType = classifyCategory(text);

  // 2. Extract People (Ensuring name is ONLY the person's clean name)
  const people: PersonInvolved[] = [];
  const knownNames = [
    { regex: /rohan\s*sharma|rohan/i, cleanName: 'Rohan Sharma', defaultRole: 'Engineering Manager' },
    { regex: /vikram|vikram\s*mehta/i, cleanName: 'Vikram Mehta', defaultRole: 'Team Lead' },
    { regex: /alex|alex\s*rivera/i, cleanName: 'Alex Rivera', defaultRole: 'Senior Colleague' },
  ];

  knownNames.forEach(kn => {
    if (kn.regex.test(text)) {
      if (!people.some(p => normalizePersonName(p.name) === normalizePersonName(kn.cleanName))) {
        people.push({
          id: 'p-' + Math.random().toString(36).substr(2, 6),
          name: kn.cleanName,
          roleOrRelationship: kn.defaultRole
        });
      }
    }
  });

  if (people.length === 0) {
    const nameMatch = text.match(/(?:by|from|with|involving)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch && nameMatch[1]) {
      people.push({
        id: 'p-' + Math.random().toString(36).substr(2, 6),
        name: nameMatch[1].trim(),
        roleOrRelationship: 'Individual involved'
      });
    } else {
      people.push({
        id: 'p-' + Math.random().toString(36).substr(2, 6),
        name: 'Individual involved',
        roleOrRelationship: 'Unspecified'
      });
    }
  }

  // 3. Extract Location
  let location = 'Workplace / Office premises';
  if (lower.includes('conference room') || lower.includes('meeting room')) {
    location = 'Conference Room B';
  } else if (lower.includes('pantry') || lower.includes('breakroom') || lower.includes('kitchen')) {
    location = '4th Floor Pantry';
  } else if (lower.includes('parking') || lower.includes('basement') || lower.includes('garage')) {
    location = 'Office Parking Garage (Level B2)';
  } else if (lower.includes('slack') || lower.includes('whatsapp') || lower.includes('teams')) {
    location = 'Digital / Work Messaging App';
  } else if (lower.includes('cafeteria') || lower.includes('canteen')) {
    location = 'Office Cafeteria';
  } else if (lower.includes('elevator') || lower.includes('lift')) {
    location = 'Main Elevator Bay';
  }

  // 4. Extract Witnesses
  const witnesses: string[] = [];
  if (lower.includes('priya')) witnesses.push('Priya Nair (Colleague)');
  if (lower.includes('ananya')) witnesses.push('Ananya (QA Engineer)');
  if (lower.includes('security') || lower.includes('guard')) witnesses.push('On-duty Security Guard');
  if (witnesses.length === 0 && (lower.includes('saw') || lower.includes('around') || lower.includes('witness'))) {
    witnesses.push('Present bystanders / colleagues nearby');
  }

  // 5. Generate Structured Narrative
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 5);
  const summary = sentences[0] || text.substring(0, 100) + '...';
  
  const keyActions: string[] = [];
  sentences.forEach(s => {
    if (s.toLowerCase().includes('said') || 
        s.toLowerCase().includes('told') || 
        s.toLowerCase().includes('touched') || 
        s.toLowerCase().includes('stood') || 
        s.toLowerCase().includes('sent') || 
        s.toLowerCase().includes('followed') || 
        s.toLowerCase().includes('recorded') ||
        s.toLowerCase().includes('filmed') ||
        s.toLowerCase().includes('asked')) {
      keyActions.push(s.trim());
    }
  });

  if (keyActions.length === 0) {
    keyActions.push(text);
  }

  const structured_narrative: StructuredNarrative = {
    summary: summary,
    context: `Incident reported occurring at ${location}. Input logged via ${text.length > 200 ? 'detailed' : 'quick'} entry.`,
    keyActions: keyActions.slice(0, 4),
    impactDescription: lower.includes('anxious') || lower.includes('afraid') || lower.includes('uncomfortable') || lower.includes('scared')
      ? 'Expressed heightened anxiety, discomfort, and impact on professional wellbeing.'
      : 'Subjected to unsolicited boundary violation and non-professional conduct.',
    recommendedFollowUp: 'Maintain clear records, preserve any corroborating digital evidence, and consider review for formal reporting.'
  };

  let severity_estimate = 3;
  if (category === 'Physical' || category === 'Quid-Pro-Quo' || lower.includes('threat')) {
    severity_estimate = 5;
  } else if (category === 'Stalking' || category === 'Digital' || lower.includes('trapped')) {
    severity_estimate = 4;
  } else if (text.length < 50) {
    severity_estimate = 2;
  }

  const tags: string[] = [category];
  if (people[0]?.name) tags.push(people[0].name.split(' ')[0]);
  if (location.includes('Pantry')) tags.push('Office');
  if (location.includes('Parking')) tags.push('Security');

  return {
    incident_datetime: new Date().toISOString(),
    location,
    people_involved: people,
    category,
    structured_narrative,
    witnesses,
    suggested_tags: Array.from(new Set(tags)),
    severity_estimate
  };
}

/**
 * Pattern Recognition Engine
 */
export function analyzeIncidentPatterns(incidents: Incident[]): PatternInsightReport {
  if (!incidents || incidents.length === 0) {
    return {
      overallRiskLevel: 'Low',
      headline: 'No incidents logged yet',
      detailedAnalysis: 'Your timeline is currently clear. Any logged incidents will be analyzed here for repeating patterns, places, or subjects.',
      clusters: [],
      suggestedActions: ['Keep NaariSaakshi ready for any future documentation needs.']
    };
  }

  const clusters: PatternCluster[] = [];
  const personGroupMap = new Map<string, { displayName: string; incidents: Incident[] }>();

  incidents.forEach(inc => {
    inc.people_involved.forEach(p => {
      const rawName = p.name;
      const normalizedKey = normalizePersonName(rawName);

      if (normalizedKey && normalizedKey !== 'individual involved' && normalizedKey !== 'unspecified') {
        const existing = personGroupMap.get(normalizedKey);
        if (existing) {
          if (!existing.incidents.some(i => i.id === inc.id)) {
            existing.incidents.push(inc);
          }
        } else {
          personGroupMap.set(normalizedKey, {
            displayName: rawName.trim(),
            incidents: [inc]
          });
        }
      }
    });
  });

  personGroupMap.forEach(({ displayName, incidents: incs }) => {
    if (incs.length >= 2) {
      const sorted = [...incs].sort((a, b) => new Date(a.incident_datetime).getTime() - new Date(b.incident_datetime).getTime());
      const first = sorted[0].incident_datetime;
      const last = sorted[sorted.length - 1].incident_datetime;
      
      const escalationScore = Math.min(10, incs.length * 2.5);

      clusters.push({
        type: 'person',
        key: displayName,
        count: incs.length,
        incidents: sorted,
        firstSeen: first,
        lastSeen: last,
        escalationScore,
        description: `Repeat pattern detected: ${incs.length} separate incidents logged involving ${displayName} over a timeframe.`
      });
    }
  });

  const locationMap = new Map<string, Incident[]>();
  incidents.forEach(inc => {
    const loc = inc.location.trim();
    if (loc) {
      const existing = locationMap.get(loc) || [];
      if (!existing.some(i => i.id === inc.id)) {
        existing.push(inc);
      }
      locationMap.set(loc, existing);
    }
  });

  locationMap.forEach((incs, locName) => {
    if (incs.length >= 2) {
      const sorted = [...incs].sort((a, b) => new Date(a.incident_datetime).getTime() - new Date(b.incident_datetime).getTime());
      clusters.push({
        type: 'location',
        key: locName,
        count: incs.length,
        incidents: sorted,
        firstSeen: sorted[0].incident_datetime,
        lastSeen: sorted[sorted.length - 1].incident_datetime,
        escalationScore: Math.min(10, incs.length * 2),
        description: `High-frequency location: ${incs.length} incidents logged at ${locName}.`
      });
    }
  });

  let overallRiskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High' = 'Low';
  const repeatPersonCount = clusters.filter(c => c.type === 'person').length;
  const highSeverityCount = incidents.filter(i => (i.severity || 0) >= 4).length;

  if (repeatPersonCount > 0 && highSeverityCount >= 2) {
    overallRiskLevel = 'High';
  } else if (repeatPersonCount > 0 || highSeverityCount >= 1) {
    overallRiskLevel = 'Elevated';
  } else if (incidents.length >= 3) {
    overallRiskLevel = 'Moderate';
  }

  let headline = `${incidents.length} total incident${incidents.length > 1 ? 's' : ''} documented.`;
  if (repeatPersonCount > 0) {
    const topCluster = clusters.filter(c => c.type === 'person').sort((a, b) => b.count - a.count)[0];
    headline = `Pattern Alert: ${topCluster.count} incidents involving '${topCluster.key}' logged across recent weeks.`;
  }

  let detailedAnalysis = `Based on your ${incidents.length} documented records, `;
  if (repeatPersonCount > 0) {
    detailedAnalysis += `there is a clear multi-event pattern tied to specific individuals. When harassment recurs with the same person, formal institutions (such as HR or Internal Complaints Committees) give significantly higher weight to contemporary, timestamped logs showing progression over time.`;
  } else {
    detailedAnalysis += `your logs reflect isolated occurrences across different settings. Continuing to record exact dates, quotes, and witnesses builds a strong factual foundation should any pattern emerge.`;
  }

  const suggestedActions = [
    'Export a consolidated report before discussing these events with any official body.',
    'Keep digital evidence (screenshots, emails, calendar invites) attached directly to each log.',
    'Note down witness names immediately while memories remain fresh.',
    'If you feel unsafe at any point, prioritize your immediate physical safety and seek trusted support.'
  ];

  return {
    overallRiskLevel,
    headline,
    detailedAnalysis,
    clusters,
    suggestedActions
  };
}
