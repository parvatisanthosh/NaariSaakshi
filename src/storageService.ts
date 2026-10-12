import { Incident, AppSettings, Attachment } from './types';
import * as vault from './vault/vault';
import { VaultStatus } from './vault/vault';
import { sha256Hex } from './vault/crypto';
import { bytesToDataUrl, dataUrlToBytes, isDataUrl } from './vault/encoding';
import { hasLegacyData, readLegacyData, removeLegacyData } from './vault/legacy';


export const INITIAL_SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString(), // 6 weeks ago
    incident_datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42 - 1000 * 60 * 60 * 4).toISOString(),
    location: '4th Floor Conference Room B',
    latitude: 12.9716,
    longitude: 77.5946,
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
    latitude: 12.9716,
    longitude: 77.5946,
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
    latitude: 12.9725,
    longitude: 77.5952,
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
  quickExitEnabled: true,
  quickExitUrl: 'https://weather.com',
  localOnlyStorage: true,
  theme: 'dark',
  demoMode: true
};

const STORAGE_KEY_SETTINGS = 'naarisaakshi_settings_v1';
const LOW_STORAGE_HEADROOM_BYTES = 50 * 1024 * 1024;

export interface StorageUsageInfo {
  usedBytes: number;
  quotaBytes: number | null;
  usedMB: number;
  isLowStorage: boolean;
  /** Whether the browser granted persistent storage (won't evict under pressure). */
  persisted: boolean | null;
}

export class StorageFullError extends Error {
  constructor() {
    super('Device storage is full');
    this.name = 'StorageFullError';
  }
}

// Decrypted, hydrated incidents for this unlocked session. Cleared on lock.
let cache: Incident[] | null = null;
// blob: URLs handed to <video>/<audio>; revoked on lock so decrypted media is released.
const objectUrls = new Set<string>();
let usageInfo: StorageUsageInfo = { usedBytes: 0, quotaBytes: null, usedMB: 0, isLowStorage: false, persisted: null };

const mediaKey = (incidentId: string, attachmentId: string) => `${incidentId}/${attachmentId}`;

const byNewestFirst = (a: Incident, b: Incident) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

function isQuotaError(e: unknown): boolean {
  const err = e as { name?: string; inner?: { name?: string } };
  return err?.name === 'QuotaExceededError' || err?.inner?.name === 'QuotaExceededError';
}

/**
 * Writes one incident: new media (data: URLs) is moved into the encrypted media store with
 * its SHA-256 recorded, URLs are stripped from the stored record, and media the incident
 * no longer references is deleted.
 */
async function persistIncident(incident: Incident, previous?: Incident): Promise<Incident> {
  const storedAttachments: Attachment[] = [];
  try {
    for (const att of incident.attachments) {
      const { dataUrl, ...rest } = att;
      if (isDataUrl(dataUrl) && !att.inVault) {
        const { mimeType, bytes } = dataUrlToBytes(dataUrl);
        await vault.putMedia(mediaKey(incident.id, att.id), bytes);
        storedAttachments.push({ ...rest, mimeType, size: bytes.length, sha256: await sha256Hex(bytes), inVault: true });
      } else {
        storedAttachments.push(rest);
      }
    }
    await vault.putRecord({ ...incident, attachments: storedAttachments });
  } catch (e) {
    if (isQuotaError(e)) throw new StorageFullError();
    throw e;
  }

  const keep = new Set(storedAttachments.filter(a => a.inVault).map(a => a.id));
  for (const old of previous?.attachments ?? []) {
    if (old.inVault && !keep.has(old.id)) await vault.deleteMedia(mediaKey(incident.id, old.id));
  }

  // Keep the caller's in-memory URLs so freshly captured media plays without a re-decrypt.
  return {
    ...incident,
    attachments: storedAttachments.map((a, i) => ({ ...a, dataUrl: incident.attachments[i].dataUrl }))
  };
}

/** Decrypts vault media into browser-playable URLs. */
async function hydrate(incident: Incident): Promise<Incident> {
  const attachments = await Promise.all(
    incident.attachments.map(async att => {
      if (!att.inVault) return att;
      const bytes = await vault.getMedia(mediaKey(incident.id, att.id));
      if (!bytes) return { ...att, inVault: false };
      const mime = att.mimeType || 'application/octet-stream';
      // Images stay as data URLs because the PDF exporter embeds them directly.
      if (att.type === 'image') return { ...att, dataUrl: bytesToDataUrl(bytes, mime) };
      const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }));
      objectUrls.add(url);
      return { ...att, dataUrl: url };
    })
  );
  return { ...incident, attachments };
}

async function writeAll(incidents: Incident[]): Promise<Incident[]> {
  await vault.clearAll();
  const written: Incident[] = [];
  for (const inc of incidents) written.push(await persistIncident(inc));
  cache = written.sort(byNewestFirst);
  void StorageService.refreshStorageEstimate();
  return cache;
}

/**
 * First run: moves any pre-vault localStorage data into the vault (verifying every record
 * landed before deleting the original), or seeds demo data. Safe to re-run if interrupted.
 */
async function initializeVault(): Promise<void> {
  if (hasLegacyData()) {
    const legacy = await readLegacyData();
    if (legacy) {
      await writeAll(legacy.incidents);
      const migratedIds = new Set((await vault.listRecords<Incident>()).map(i => i.id));
      if (!legacy.incidents.every(i => migratedIds.has(i.id))) {
        throw new Error('Migration verification failed; legacy data left in place');
      }
      if (legacy.pin) {
        // Keep the user's existing unlock; Settings flags it as weak and asks for a passphrase.
        await vault.setPassphrase(legacy.pin, { weak: true, withRecovery: false });
      }
      removeLegacyData();
    }
  } else if (StorageService.getSettings().demoMode) {
    await writeAll(INITIAL_SEED_INCIDENTS);
  }
  await vault.markInitialized();
  StorageService.lock();
}

export class StorageService {
  /** Opens (or creates) the vault and runs first-run migration/seeding. */
  static async init(): Promise<VaultStatus> {
    const st = await vault.openVault();
    if (!st.initialized && st.unlocked) {
      try {
        await initializeVault();
      } catch (e) {
        console.error('Vault initialization failed:', e);
      }
    }
    void StorageService.requestPersistence();
    void StorageService.refreshStorageEstimate();
    return vault.status();
  }

  static vaultStatus(): VaultStatus {
    return vault.status();
  }

  static async unlock(secret: string): Promise<boolean> {
    return vault.unlockWithPassphrase(secret);
  }

  static async unlockWithRecoveryCode(code: string): Promise<boolean> {
    return vault.unlockWithRecoveryCode(code);
  }

  /** Drops the key and all decrypted data from memory. No-op for unprotected vaults. */
  static lock(): void {
    if (vault.status().mode !== 'passphrase') return;
    vault.lock();
    cache = null;
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls.clear();
  }

  /** Sets or changes the passphrase. Returns the new recovery code to show once. */
  static async setPassphrase(secret: string): Promise<string | null> {
    return vault.setPassphrase(secret);
  }

  static async removePassphrase(): Promise<void> {
    return vault.removePassphrase();
  }

  static async getIncidents(): Promise<Incident[]> {
    if (!cache) {
      const records = await vault.listRecords<Incident>();
      cache = (await Promise.all(records.map(hydrate))).sort(byNewestFirst);
    }
    return cache;
  }

  /** Replaces every stored incident (used by import). */
  static async saveIncidents(incidents: Incident[]): Promise<Incident[]> {
    return writeAll(incidents);
  }

  static async addIncident(incident: Incident): Promise<Incident[]> {
    const current = await this.getIncidents();
    const saved = await persistIncident(incident);
    cache = [saved, ...current.filter(i => i.id !== saved.id)].sort(byNewestFirst);
    void StorageService.refreshStorageEstimate();
    return cache;
  }

  static async updateIncident(updated: Incident): Promise<Incident[]> {
    const current = await this.getIncidents();
    const previous = current.find(i => i.id === updated.id);
    const saved = await persistIncident(updated, previous);
    cache = current.map(i => (i.id === saved.id ? saved : i));
    void StorageService.refreshStorageEstimate();
    return cache;
  }

  static async deleteIncident(id: string): Promise<Incident[]> {
    const current = await this.getIncidents();
    const target = current.find(i => i.id === id);
    await vault.deleteRecord(id);
    for (const att of target?.attachments ?? []) {
      if (att.inVault) await vault.deleteMedia(mediaKey(id, att.id));
    }
    cache = current.filter(i => i.id !== id);
    void StorageService.refreshStorageEstimate();
    return cache;
  }

  static async resetToSeedData(): Promise<Incident[]> {
    return writeAll(INITIAL_SEED_INCIDENTS);
  }

  static async clearAllData(): Promise<Incident[]> {
    await vault.clearAll();
    cache = [];
    void StorageService.refreshStorageEstimate();
    return cache;
  }

  static async clearAllLocationData(): Promise<Incident[]> {
    const current = await this.getIncidents();
    const updated: Incident[] = [];
    for (const inc of current) {
      const { latitude, longitude, ...rest } = inc;
      updated.push(await persistIncident(rest, inc));
    }
    cache = updated;
    return cache;
  }

  /** Incidents with every attachment inlined as a data URL, for a self-contained JSON backup. */
  static async exportIncidentsWithMedia(): Promise<Incident[]> {
    const records = await vault.listRecords<Incident>();
    return Promise.all(
      records.sort(byNewestFirst).map(async inc => ({
        ...inc,
        attachments: await Promise.all(
          inc.attachments.map(async att => {
            if (!att.inVault) return att;
            const bytes = await vault.getMedia(mediaKey(inc.id, att.id));
            const { inVault, ...rest } = att;
            return bytes ? { ...rest, dataUrl: bytesToDataUrl(bytes, att.mimeType || 'application/octet-stream') } : rest;
          })
        )
      }))
    );
  }

  /** Last known usage; call refreshStorageEstimate() to update it. */
  static getStorageUsageInfo(): StorageUsageInfo {
    return usageInfo;
  }

  static async refreshStorageEstimate(): Promise<StorageUsageInfo> {
    try {
      const est = await navigator.storage?.estimate?.();
      if (est) {
        const usedBytes = est.usage ?? 0;
        const quotaBytes = est.quota ?? null;
        usageInfo = {
          ...usageInfo,
          usedBytes,
          quotaBytes,
          usedMB: parseFloat((usedBytes / (1024 * 1024)).toFixed(2)),
          isLowStorage: quotaBytes !== null && quotaBytes - usedBytes < LOW_STORAGE_HEADROOM_BYTES
        };
      }
    } catch {
      // Estimates are advisory; keep the last value.
    }
    return usageInfo;
  }

  /** Asks the browser not to evict the vault under storage pressure. */
  static async requestPersistence(): Promise<boolean | null> {
    try {
      if (!navigator.storage?.persist) return null;
      const persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist());
      usageInfo = { ...usageInfo, persisted };
      return persisted;
    } catch {
      return null;
    }
  }

  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      // pinCode/pinEnabled are legacy fields from the pre-vault PIN lock; never read them back.
      const { pinCode, pinEnabled, ...rest } = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...rest };
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
