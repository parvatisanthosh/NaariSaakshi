import { Incident, AppSettings } from './types';

export const INITIAL_SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString(), // 6 weeks ago
    incident_datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42 - 1000 * 60 * 60 * 4).toISOString(),
    location: '4th Floor Conference Room B',
    people_involved: [
      { id: 'p-1', name: 'Rohan Sharma', roleOrRelationship: 'Engineering Manager' }
    ],
    category: 'Verbal',
    narrative_raw: 'Rohan called me into conference room B around 5:30 PM after most people left. He stood in front of the exit door while discussing my performance review and repeatedly commented that my career growth depends on how friendly I am with him after office hours. I felt very trapped and anxious.',
    narrative_structured: {
      summary: 'Manager blocked door and tied performance review to after-hours personal favors.',
      context: '1-on-1 meeting after normal office hours in 4th Floor Conference Room B.',
      keyActions: [
        'Rohan positioned himself blocking the exit door',
        'Stated performance review outcomes depended on personal friendliness',
        'Suggested meeting after office hours'
      ],
      impactDescription: 'Felt trapped, anxious, and coerced regarding job security.',
      recommendedFollowUp: 'Document time, preserve meeting invites, and notify HR POSH committee if repeated.'
    },
    witnesses: ['Priya Nair (saw me exit room looking visibly distressed)'],
    severity: 4,
    attachments: [
      {
        id: 'att-1',
        name: 'Calendar_Invite_5PM.png',
        type: 'image',
        size: 245000,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString()
      }
    ],
    user_edited: false,
    tags: ['Workplace', 'Coercion', 'Manager']
  },
  {
    id: 'inc-002',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(), // 3 weeks ago
    incident_datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21 - 1000 * 60 * 60 * 2).toISOString(),
    location: 'Company Slack & Direct Messages',
    people_involved: [
      { id: 'p-1', name: 'Rohan Sharma', roleOrRelationship: 'Engineering Manager' }
    ],
    category: 'Digital',
    narrative_raw: 'Rohan sent multiple unsolicited late-night Slack DMs around 11:15 PM asking if I was awake, complimenting my profile photo on WhatsApp, and asking why I did not reply to his personal WhatsApp message earlier. Took screenshots before he deleted one.',
    narrative_structured: {
      summary: 'Unsolicited late-night digital messages on work and personal messaging channels.',
      context: 'Late night communications via official Slack DM and personal WhatsApp.',
      keyActions: [
        'Sent DMs at 11:15 PM outside working hours',
        'Made comments on personal appearance and profile photos',
        'Questioned non-responsiveness to personal texts'
      ],
      impactDescription: 'Intrusion into personal time, discomfort using work communication tools.',
      recommendedFollowUp: 'Export Slack log exports and preserve screenshots in secure storage.'
    },
    witnesses: [],
    severity: 3,
    attachments: [
      {
        id: 'att-2',
        name: 'Slack_DM_Screenshot_11PM.png',
        type: 'image',
        size: 310000,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString()
      }
    ],
    user_edited: true,
    tags: ['Digital Harassment', 'Late Night', 'Slack']
  },
  {
    id: 'inc-003',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
    incident_datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60 * 1).toISOString(),
    location: '4th Floor Pantry / Breakroom',
    people_involved: [
      { id: 'p-1', name: 'Rohan Sharma', roleOrRelationship: 'Engineering Manager' }
    ],
    category: 'Quid-Pro-Quo',
    narrative_raw: 'In the pantry, Rohan stood unusually close while I was making tea, touched my shoulder without consent, and explicitly said: "If you come to the dinner team retreat with me this weekend, I will make sure your appraisal rating is top tier." I moved away immediately.',
    narrative_structured: {
      summary: 'Physical boundary violation in pantry with explicit quid-pro-quo promotion offer.',
      context: 'Informal encounter in 4th floor office pantry during afternoon tea break.',
      keyActions: [
        'Invaded physical space and touched shoulder without consent',
        'Explicitly offered top-tier appraisal rating in exchange for attending private weekend retreat'
      ],
      impactDescription: 'Physical discomfort, acute workplace distress, feeling subjected to transactional extortion.',
      recommendedFollowUp: 'Formal complaint to Internal Complaints Committee (POSH) citing clear quid-pro-quo.'
    },
    witnesses: ['Ananya (QA engineer, was near the coffee machine)'],
    severity: 5,
    attachments: [],
    user_edited: true,
    tags: ['Quid Pro Quo', 'Physical Touch', 'Pantry']
  },
  {
    id: 'inc-004',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    incident_datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 60 * 3).toISOString(),
    location: 'Office Parking Garage, Level B2',
    people_involved: [
      { id: 'p-2', name: 'Unknown Driver / White Sedan', roleOrRelationship: 'Unidentified Individual' }
    ],
    category: 'Stalking',
    narrative_raw: 'As I walked to my scooter on B2 parking around 7:45 PM, a white sedan slowed down next to me and trailed me at walking speed for 30 yards while the driver kept staring. When I stopped near security guard, the car sped away.',
    narrative_structured: {
      summary: 'Vehicle trailed at walking speed in basement parking garage.',
      context: 'Leaving office late evening in underground parking garage Level B2.',
      keyActions: [
        'Vehicle followed closely for 30 yards',
        'Sustained intimidation / staring',
        'Vehicle fled when victim approached security personnel'
      ],
      impactDescription: 'Heightened fear for physical safety during commute home.',
      recommendedFollowUp: 'Request security footage for Level B2 parking garage between 7:45 PM - 7:55 PM.'
    },
    witnesses: ['Security Guard Rajesh (stationed near exit gate)'],
    severity: 4,
    attachments: [],
    user_edited: false,
    tags: ['Parking', 'Security', 'Stalking']
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  pinEnabled: false,
  pinCode: '',
  quickExitEnabled: true,
  quickExitUrl: 'https://weather.com',
  localOnlyStorage: true,
  theme: 'dark',
  demoMode: true
};

const STORAGE_KEY_INCIDENTS = 'evidenceher_incidents_v1';
const STORAGE_KEY_SETTINGS = 'evidenceher_settings_v1';

export class StorageService {
  static getIncidents(): Incident[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (!data) {
        // Initialize with seed data on first run
        this.saveIncidents(INITIAL_SEED_INCIDENTS);
        return INITIAL_SEED_INCIDENTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load incidents from storage:', e);
      return INITIAL_SEED_INCIDENTS;
    }
  }

  static saveIncidents(incidents: Incident[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    } catch (e) {
      console.error('Failed to save incidents to storage:', e);
    }
  }

  static addIncident(incident: Incident): Incident[] {
    const incidents = [incident, ...this.getIncidents()];
    this.saveIncidents(incidents);
    return incidents;
  }

  static updateIncident(updated: Incident): Incident[] {
    const incidents = this.getIncidents().map(inc => inc.id === updated.id ? updated : inc);
    this.saveIncidents(incidents);
    return incidents;
  }

  static deleteIncident(id: string): Incident[] {
    const incidents = this.getIncidents().filter(inc => inc.id !== id);
    this.saveIncidents(incidents);
    return incidents;
  }

  static resetToSeedData(): Incident[] {
    this.saveIncidents(INITIAL_SEED_INCIDENTS);
    return INITIAL_SEED_INCIDENTS;
  }

  static clearAllData(): Incident[] {
    localStorage.removeItem(STORAGE_KEY_INCIDENTS);
    return [];
  }

  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): AppSettings {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return settings;
  }
}
