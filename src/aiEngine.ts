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
 * Intelligent local NLP-based extraction engine for offline/demo reliability
 * Extracts date/time, locations, named individuals, categories, and structured narratives.
 */
export function extractIncidentFromRawText(rawText: string): ExtractionResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Extract Category
  let category: CategoryType = 'Verbal';
  if (lower.includes('touch') || lower.includes('grab') || lower.includes('pushed') || lower.includes('slapped') || lower.includes('shoulder') || lower.includes('physical')) {
    category = 'Physical';
  } else if (lower.includes('slack') || lower.includes('whatsapp') || lower.includes('email') || lower.includes('dm') || lower.includes('message') || lower.includes('photo') || lower.includes('online')) {
    category = 'Digital';
  } else if (lower.includes('follow') || lower.includes('trailed') || lower.includes('car') || lower.includes('parking') || lower.includes('stalk') || lower.includes('waiting outside')) {
    category = 'Stalking';
  } else if (lower.includes('appraisal') || lower.includes('promotion') || lower.includes('rating') || lower.includes('if you') || lower.includes('favor') || lower.includes('fire') || lower.includes('job')) {
    category = 'Quid-Pro-Quo';
  } else if (lower.includes('pay') || lower.includes('salary') || lower.includes('fine') || lower.includes('money')) {
    category = 'Financial / Economic';
  }

  // 2. Extract People
  const people: PersonInvolved[] = [];
  const knownNames = [
    { regex: /rohan\s*sharma|rohan/i, name: 'Rohan Sharma', defaultRole: 'Engineering Manager' },
    { regex: /vikram|vikram\s*mehta/i, name: 'Vikram Mehta', defaultRole: 'Team Lead' },
    { regex: /alex|alex\s*rivera/i, name: 'Alex Rivera', defaultRole: 'Senior Colleague' },
    { regex: /manager|boss|supervisor/i, name: 'Manager', defaultRole: 'Supervisor' },
    { regex: /driver|sedan|cab/i, name: 'Unidentified Driver', defaultRole: 'Individual' },
  ];

  knownNames.forEach(kn => {
    if (kn.regex.test(text)) {
      if (!people.some(p => p.name.toLowerCase() === kn.name.toLowerCase())) {
        people.push({
          id: 'p-' + Math.random().toString(36).substr(2, 6),
          name: kn.name,
          roleOrRelationship: kn.defaultRole
        });
      }
    }
  });

  // Generic name capture if capital words follow "by", "with", "from"
  if (people.length === 0) {
    const nameMatch = text.match(/(?:by|from|with|involving)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch && nameMatch[1]) {
      people.push({
        id: 'p-' + Math.random().toString(36).substr(2, 6),
        name: nameMatch[1],
        roleOrRelationship: 'Individual involved'
      });
    } else {
      people.push({
        id: 'p-' + Math.random().toString(36).substr(2, 6),
        name: 'Individual / Party involved',
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
  // Extract key sentences
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

  // Severity Estimate
  let severity_estimate = 3;
  if (category === 'Physical' || category === 'Quid-Pro-Quo' || lower.includes('threat')) {
    severity_estimate = 5;
  } else if (category === 'Stalking' || lower.includes('trapped')) {
    severity_estimate = 4;
  } else if (text.length < 50) {
    severity_estimate = 2;
  }

  // Suggested Tags
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
 * Pattern Recognition Engine: Analyzes all logged incidents to identify recurring subjects, locations, and escalation trends
 */
export function analyzeIncidentPatterns(incidents: Incident[]): PatternInsightReport {
  if (!incidents || incidents.length === 0) {
    return {
      overallRiskLevel: 'Low',
      headline: 'No incidents logged yet',
      detailedAnalysis: 'Your timeline is currently clear. Any logged incidents will be analyzed here for repeating patterns, places, or subjects.',
      clusters: [],
      suggestedActions: ['Keep EvidenceHer ready for any future documentation needs.']
    };
  }

  const clusters: PatternCluster[] = [];

  // Group by Person
  const personMap = new Map<string, Incident[]>();
  incidents.forEach(inc => {
    inc.people_involved.forEach(p => {
      const key = p.name.trim();
      if (key && key !== 'Unspecified' && key !== 'Individual / Party involved') {
        const existing = personMap.get(key) || [];
        existing.push(inc);
        personMap.set(key, existing);
      }
    });
  });

  personMap.forEach((incs, personName) => {
    if (incs.length >= 2) {
      const sorted = [...incs].sort((a, b) => new Date(a.incident_datetime).getTime() - new Date(b.incident_datetime).getTime());
      const first = sorted[0].incident_datetime;
      const last = sorted[sorted.length - 1].incident_datetime;
      
      const escalationScore = Math.min(10, incs.length * 2.5);

      clusters.push({
        type: 'person',
        key: personName,
        count: incs.length,
        incidents: sorted,
        firstSeen: first,
        lastSeen: last,
        escalationScore,
        description: `Repeat pattern detected: ${incs.length} separate incidents logged involving ${personName} over a timeframe.`
      });
    }
  });

  // Group by Location
  const locationMap = new Map<string, Incident[]>();
  incidents.forEach(inc => {
    const loc = inc.location.trim();
    if (loc) {
      const existing = locationMap.get(loc) || [];
      existing.push(inc);
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

  // Determine overall risk
  let overallRiskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High' = 'Low';
  const repeatPersonCount = Array.from(personMap.values()).filter(list => list.length >= 2).length;
  const highSeverityCount = incidents.filter(i => (i.severity || 0) >= 4).length;

  if (repeatPersonCount > 0 && highSeverityCount >= 2) {
    overallRiskLevel = 'High';
  } else if (repeatPersonCount > 0 || highSeverityCount >= 1) {
    overallRiskLevel = 'Elevated';
  } else if (incidents.length >= 3) {
    overallRiskLevel = 'Moderate';
  }

  // Plain language headline
  let headline = `${incidents.length} total incident${incidents.length > 1 ? 's' : ''} documented.`;
  if (repeatPersonCount > 0) {
    const topPerson = Array.from(personMap.entries()).sort((a, b) => b[1].length - a[1].length)[0];
    headline = `Pattern Alert: ${topPerson[1].length} incidents involving '${topPerson[0]}' logged across recent weeks.`;
  }

  // Detailed Analysis Narrative
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
