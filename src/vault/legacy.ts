/**
 * Reads data written by the pre-vault (v1) storage layer, which kept everything in
 * localStorage encrypted under a key derived from a plaintext-stored PIN or device secret.
 * Used once, to migrate into the IndexedDB vault; afterwards the legacy keys are removed.
 */
import type { Incident } from '../types';
import { base64ToBytes } from './encoding';

export const LEGACY_KEYS = {
  incidents: 'naarisaakshi_incidents_v1',
  settings: 'naarisaakshi_settings_v1',
  salt: 'naarisaakshi_salt_v1',
  deviceSecret: 'naarisaakshi_device_secret_v1'
} as const;

export interface LegacyData {
  incidents: Incident[];
  /** The old 4-digit PIN, if PIN lock was on. Carried over so the user keeps the same unlock. */
  pin: string | null;
}

function readLegacySettings(): { pinEnabled?: boolean; pinCode?: string } {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_KEYS.settings) || '{}');
  } catch {
    return {};
  }
}

export function hasLegacyData(): boolean {
  return localStorage.getItem(LEGACY_KEYS.incidents) !== null;
}

/** Returns null when there is nothing to migrate. Throws if legacy data exists but cannot be read. */
export async function readLegacyData(): Promise<LegacyData | null> {
  const raw = localStorage.getItem(LEGACY_KEYS.incidents);
  if (raw === null) return null;

  const settings = readLegacySettings();
  const pin = settings.pinEnabled && settings.pinCode ? settings.pinCode : null;
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) return { incidents: parsed, pin };
  if (!parsed?.encrypted) throw new Error('Unrecognised legacy incident format');

  const secret = pin ?? localStorage.getItem(LEGACY_KEYS.deviceSecret);
  if (!secret) throw new Error('Legacy decryption secret missing');

  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToBytes(parsed.salt) as Uint8Array<ArrayBuffer>, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) as Uint8Array<ArrayBuffer> },
    key,
    base64ToBytes(parsed.ciphertext) as Uint8Array<ArrayBuffer>
  );
  return { incidents: JSON.parse(new TextDecoder().decode(plain)), pin };
}

/** Deletes legacy ciphertext and secrets, and strips the plaintext PIN from saved settings. */
export function removeLegacyData(): void {
  localStorage.removeItem(LEGACY_KEYS.incidents);
  localStorage.removeItem(LEGACY_KEYS.salt);
  localStorage.removeItem(LEGACY_KEYS.deviceSecret);
  const settings = readLegacySettings() as Record<string, unknown>;
  if ('pinCode' in settings || 'pinEnabled' in settings) {
    delete settings.pinCode;
    delete settings.pinEnabled;
    localStorage.setItem(LEGACY_KEYS.settings, JSON.stringify(settings));
  }
}
