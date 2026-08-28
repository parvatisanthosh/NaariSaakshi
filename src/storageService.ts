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
const STORAGE_KEY_SALT = 'evidenceher_salt_v1';
const STORAGE_KEY_DEVICE_SECRET = 'evidenceher_device_secret_v1';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getOrCreateSalt(): Uint8Array {
  let saltStr = localStorage.getItem(STORAGE_KEY_SALT);
  if (!saltStr) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    saltStr = arrayBufferToBase64(saltBytes.buffer);
    localStorage.setItem(STORAGE_KEY_SALT, saltStr);
    return saltBytes;
  }
  return new Uint8Array(base64ToArrayBuffer(saltStr));
}

function getOrCreateDeviceSecret(): string {
  let secret = localStorage.getItem(STORAGE_KEY_DEVICE_SECRET);
  if (!secret) {
    const secretBytes = crypto.getRandomValues(new Uint8Array(32));
    secret = arrayBufferToBase64(secretBytes.buffer);
    localStorage.setItem(STORAGE_KEY_DEVICE_SECRET, secret);
  }
  return secret;
}

async function getEncryptionPassphrase(): Promise<string> {
  const settings = StorageService.getSettings();
  if (settings.pinEnabled && settings.pinCode) {
    return settings.pinCode;
  }
  return getOrCreateDeviceSecret();
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(plainText: string): Promise<string> {
  const salt = getOrCreateSalt();
  const passphrase = await getEncryptionPassphrase();
  const key = await deriveKey(passphrase, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText)
  );

  return JSON.stringify({
    v: 1,
    encrypted: true,
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    ciphertext: arrayBufferToBase64(encryptedBuffer)
  });
}

async function decryptData(encryptedJsonStr: string): Promise<string> {
  const payload = JSON.parse(encryptedJsonStr);
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
  const ciphertext = base64ToArrayBuffer(payload.ciphertext) as ArrayBuffer;
  const passphrase = await getEncryptionPassphrase();
  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export class StorageService {
  static async getIncidents(): Promise<Incident[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (!data) {
        await this.saveIncidents(INITIAL_SEED_INCIDENTS);
        return INITIAL_SEED_INCIDENTS;
      }
      
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Plaintext legacy / seed data -> auto-encrypt and return
        await this.saveIncidents(parsed);
        return parsed;
      }

      if (parsed && parsed.encrypted) {
        const decryptedStr = await decryptData(data);
        return JSON.parse(decryptedStr);
      }

      return INITIAL_SEED_INCIDENTS;
    } catch (e) {
      console.error('Failed to load incidents from storage:', e);
      return INITIAL_SEED_INCIDENTS;
    }
  }

  static async saveIncidents(incidents: Incident[]): Promise<void> {
    try {
      const plainText = JSON.stringify(incidents);
      const encryptedPayload = await encryptData(plainText);
      localStorage.setItem(STORAGE_KEY_INCIDENTS, encryptedPayload);
    } catch (e) {
      console.error('Failed to save incidents to storage:', e);
    }
  }

  static async addIncident(incident: Incident): Promise<Incident[]> {
    const incidents = [incident, ...(await this.getIncidents())];
    await this.saveIncidents(incidents);
    return incidents;
  }

  static async updateIncident(updated: Incident): Promise<Incident[]> {
    const incidents = (await this.getIncidents()).map(inc => inc.id === updated.id ? updated : inc);
    await this.saveIncidents(incidents);
    return incidents;
  }

  static async deleteIncident(id: string): Promise<Incident[]> {
    const incidents = (await this.getIncidents()).filter(inc => inc.id !== id);
    await this.saveIncidents(incidents);
    return incidents;
  }

  static async resetToSeedData(): Promise<Incident[]> {
    await this.saveIncidents(INITIAL_SEED_INCIDENTS);
    return INITIAL_SEED_INCIDENTS;
  }

  static async clearAllData(): Promise<Incident[]> {
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
