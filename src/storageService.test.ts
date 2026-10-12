import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Incident } from './types';

// Minimal in-memory localStorage for Node.
class MemoryStorage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

/** Fresh module instances = a page reload against the same IndexedDB/localStorage. */
async function load() {
  vi.resetModules();
  return (await import('./storageService')).StorageService;
}

const VIDEO_BYTES = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4, 5]);
const VIDEO_DATA_URL = `data:video/webm;base64,${Buffer.from(VIDEO_BYTES).toString('base64')}`;

function incident(id: string, extra: Partial<Incident> = {}): Incident {
  return {
    id,
    created_at: new Date().toISOString(),
    incident_datetime: new Date().toISOString(),
    location: 'Office',
    people_involved: [],
    category: 'Verbal',
    narrative_raw: 'text',
    narrative_structured: { summary: 's', context: 'c', keyActions: [], impactDescription: 'i' },
    witnesses: [],
    attachments: [],
    user_edited: false,
    tags: [],
    ...extra
  };
}

/** Writes data exactly the way the pre-vault storage layer did. */
async function writeLegacy(incidents: Incident[], pin?: string) {
  const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  let secret = pin;
  if (pin) {
    localStorage.setItem('naarisaakshi_settings_v1', JSON.stringify({ pinEnabled: true, pinCode: pin, theme: 'light' }));
  } else {
    secret = b64(crypto.getRandomValues(new Uint8Array(32)));
    localStorage.setItem('naarisaakshi_device_secret_v1', secret);
  }
  localStorage.setItem('naarisaakshi_salt_v1', b64(salt));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(incidents)));
  localStorage.setItem('naarisaakshi_incidents_v1', JSON.stringify({
    v: 1, encrypted: true, iv: b64(iv), salt: b64(salt), ciphertext: b64(new Uint8Array(ct))
  }));
}

beforeEach(async () => {
  vi.resetModules();
  (globalThis as any).localStorage = new MemoryStorage();
  globalThis.indexedDB = new IDBFactory();
});

describe('first run', () => {
  it('seeds demo data into an unlocked device vault', async () => {
    const S = await load();
    const st = await S.init();
    expect(st).toMatchObject({ mode: 'device', unlocked: true, initialized: true });
    expect((await S.getIncidents()).length).toBe(4);
  });

  it('does not re-seed after the user clears their data', async () => {
    let S = await load();
    await S.init();
    await S.clearAllData();
    S = await load();
    await S.init();
    expect(await S.getIncidents()).toEqual([]);
  });
});

describe('legacy localStorage migration', () => {
  it('moves device-secret data and media into the vault, then deletes the old copy', async () => {
    await writeLegacy([
      incident('inc-a', {
        attachments: [{ id: 'att-v', name: 'clip.webm', type: 'video', dataUrl: VIDEO_DATA_URL, uploadedAt: new Date().toISOString() }]
      }),
      incident('inc-b')
    ]);

    const S = await load();
    const st = await S.init();
    expect(st).toMatchObject({ mode: 'device', unlocked: true });

    const list = await S.getIncidents();
    expect(list.map(i => i.id).sort()).toEqual(['inc-a', 'inc-b']);
    const att = list.find(i => i.id === 'inc-a')!.attachments[0];
    expect(att).toMatchObject({ inVault: true, mimeType: 'video/webm', size: VIDEO_BYTES.length });
    expect(att.sha256).toMatch(/^[0-9a-f]{64}$/);

    expect(localStorage.getItem('naarisaakshi_incidents_v1')).toBeNull();
    expect(localStorage.getItem('naarisaakshi_device_secret_v1')).toBeNull();
    expect(localStorage.getItem('naarisaakshi_salt_v1')).toBeNull();
  });

  it('keeps a PIN-locked journal locked behind the same PIN and strips the plaintext PIN', async () => {
    await writeLegacy([incident('inc-a')], '4826');

    let S = await load();
    const st = await S.init();
    expect(st).toMatchObject({ mode: 'passphrase', unlocked: false, weakPassphrase: true, hasRecoveryCode: false });
    expect(localStorage.getItem('naarisaakshi_settings_v1')).not.toContain('4826');
    expect(S.getSettings().theme).toBe('light');

    S = await load();
    await S.init();
    expect(await S.unlock('0000')).toBe(false);
    expect(await S.unlock('4826')).toBe(true);
    expect((await S.getIncidents()).map(i => i.id)).toEqual(['inc-a']);
  });

  it('leaves legacy data untouched if it cannot be decrypted', async () => {
    await writeLegacy([incident('inc-a')]);
    localStorage.setItem('naarisaakshi_device_secret_v1', 'wrong-secret');
    const S = await load();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await S.init();
    expect(localStorage.getItem('naarisaakshi_incidents_v1')).not.toBeNull();
  });
});

describe('media handling', () => {
  it('stores media once, hydrates it after reload and inlines it in exports', async () => {
    let S = await load();
    await S.init();
    await S.clearAllData();
    await S.addIncident(incident('inc-v', {
      attachments: [{ id: 'att-v', name: 'clip.webm', type: 'video', dataUrl: VIDEO_DATA_URL, uploadedAt: new Date().toISOString() }]
    }));

    S = await load();
    await S.init();
    const [loaded] = await S.getIncidents();
    expect(loaded.attachments[0].dataUrl).toMatch(/^blob:/);

    const [exported] = await S.exportIncidentsWithMedia();
    expect(exported.attachments[0].dataUrl).toBe(VIDEO_DATA_URL);
  });

  it('deletes media when its attachment or incident is removed', async () => {
    const S = await load();
    await S.init();
    await S.clearAllData();
    await S.addIncident(incident('inc-v', {
      attachments: [
        { id: 'a1', name: 'a.webm', type: 'video', dataUrl: VIDEO_DATA_URL, uploadedAt: '' },
        { id: 'a2', name: 'b.webm', type: 'video', dataUrl: VIDEO_DATA_URL, uploadedAt: '' }
      ]
    }));
    const vault = await import('./vault/vault');
    expect((await vault.listMediaKeys()).sort()).toEqual(['inc-v/a1', 'inc-v/a2']);

    const [current] = await S.getIncidents();
    await S.updateIncident({ ...current, attachments: current.attachments.filter(a => a.id !== 'a1') });
    expect(await vault.listMediaKeys()).toEqual(['inc-v/a2']);

    await S.deleteIncident('inc-v');
    expect(await vault.listMediaKeys()).toEqual([]);
  });
});
