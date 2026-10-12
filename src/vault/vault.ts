/**
 * Encrypted IndexedDB vault.
 *
 * Stores
 *   meta       'header' → VaultHeader (wrapped master keys + KDF params; no secrets in clear)
 *   incidents  id       → AES-GCM sealed JSON of one incident (media stripped out)
 *   media      key      → AES-GCM sealed raw bytes of one attachment
 *
 * Modes
 *   device      No passphrase. The master key is wrapped by a non-extractable device key kept
 *               in IndexedDB. This protects against copying the database files elsewhere, but
 *               NOT against anyone who can open this browser profile. The UI must say so.
 *   passphrase  The master key is wrapped only by a passphrase-derived key (+ a recovery code).
 *               Nothing that can unlock the vault is stored on the device.
 */
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import {
  aad,
  BinarySealedBox,
  deriveKek,
  deriveKekWithNewParams,
  generateDeviceKey,
  importMasterKey,
  KdfParams,
  newKdfParams,
  newMasterKeyBytes,
  newRecoveryCode,
  normalizeRecoveryCode,
  openBytes,
  openJson,
  sealBytes,
  sealJson
} from './crypto';

const DB_NAME = 'naarisaakshi-vault';
const DB_VERSION = 1;

interface WrappedKey {
  wrapped: BinarySealedBox;
}

export interface VaultHeader {
  version: 1;
  vaultId: string;
  createdAt: string;
  /** Set once first-run seeding or legacy migration has fully completed. */
  initializedAt?: string;
  device?: WrappedKey & { key: CryptoKey };
  passphrase?: WrappedKey & { kdf: KdfParams; weak?: boolean };
  recovery?: WrappedKey & { kdf: KdfParams };
}

interface VaultDB extends DBSchema {
  meta: { key: string; value: VaultHeader };
  incidents: { key: string; value: BinarySealedBox };
  media: { key: string; value: BinarySealedBox };
}

export type VaultMode = 'device' | 'passphrase';

export interface VaultStatus {
  mode: VaultMode;
  unlocked: boolean;
  initialized: boolean;
  weakPassphrase: boolean;
  hasRecoveryCode: boolean;
}

export class VaultLockedError extends Error {
  constructor() {
    super('Vault is locked');
    this.name = 'VaultLockedError';
  }
}

// Recovery codes carry 125 bits of entropy, so a slow memory-hard KDF adds nothing.
const RECOVERY_KDF_ITERATIONS = 100_000;

let dbPromise: Promise<IDBPDatabase<VaultDB>> | null = null;
let header: VaultHeader | null = null;
let masterKey: CryptoKey | null = null;
let masterBytes: Uint8Array | null = null;

function db(): Promise<IDBPDatabase<VaultDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VaultDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('meta');
        database.createObjectStore('incidents');
        database.createObjectStore('media');
      }
    });
  }
  return dbPromise;
}

async function writeHeader(next: VaultHeader): Promise<void> {
  await (await db()).put('meta', next, 'header');
  header = next;
}

function requireHeader(): VaultHeader {
  if (!header) throw new Error('Vault not opened');
  return header;
}

function requireKey(): CryptoKey {
  if (!masterKey) throw new VaultLockedError();
  return masterKey;
}

async function wrapMaster(kek: CryptoKey, purpose: string): Promise<BinarySealedBox> {
  if (!masterBytes) throw new VaultLockedError();
  return sealBytes(kek, masterBytes, aad(requireHeader().vaultId, `wrap/${purpose}`));
}

async function adoptMaster(bytes: Uint8Array): Promise<void> {
  masterBytes = bytes;
  masterKey = await importMasterKey(bytes);
}

export function status(): VaultStatus {
  const h = requireHeader();
  return {
    mode: h.passphrase ? 'passphrase' : 'device',
    unlocked: masterKey !== null,
    initialized: !!h.initializedAt,
    weakPassphrase: !!h.passphrase?.weak,
    hasRecoveryCode: !!h.recovery
  };
}

/**
 * Opens the vault, creating a new device-mode vault on first run.
 * Device-mode vaults unlock automatically; passphrase vaults stay locked.
 */
export async function openVault(): Promise<VaultStatus> {
  const existing = await (await db()).get('meta', 'header');
  if (existing) {
    header = existing;
    if (existing.device && !masterKey) {
      const bytes = await openBytes(existing.device.key, existing.device.wrapped, aad(existing.vaultId, 'wrap/device'));
      await adoptMaster(bytes);
    }
    return status();
  }

  header = { version: 1, vaultId: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await adoptMaster(newMasterKeyBytes());
  const deviceKey = await generateDeviceKey();
  await writeHeader({ ...header, device: { key: deviceKey, wrapped: await wrapMaster(deviceKey, 'device') } });
  return status();
}

export async function markInitialized(): Promise<void> {
  await writeHeader({ ...requireHeader(), initializedAt: new Date().toISOString() });
}

export async function unlockWithPassphrase(secret: string): Promise<boolean> {
  const h = requireHeader();
  if (!h.passphrase) return status().unlocked;
  try {
    const kek = await deriveKek(secret, h.passphrase.kdf);
    await adoptMaster(await openBytes(kek, h.passphrase.wrapped, aad(h.vaultId, 'wrap/passphrase')));
    return true;
  } catch {
    return false;
  }
}

export async function unlockWithRecoveryCode(code: string): Promise<boolean> {
  const h = requireHeader();
  if (!h.recovery) return false;
  try {
    const kek = await deriveKek(normalizeRecoveryCode(code), h.recovery.kdf);
    await adoptMaster(await openBytes(kek, h.recovery.wrapped, aad(h.vaultId, 'wrap/recovery')));
    return true;
  } catch {
    return false;
  }
}

export function lock(): void {
  if (!header?.passphrase) return; // device-mode vaults have nothing to lock with
  masterBytes?.fill(0);
  masterBytes = null;
  masterKey = null;
}

/**
 * Protects the vault with a passphrase (or replaces the current one) and removes the
 * device key. Returns a fresh recovery code to show the user exactly once.
 */
export async function setPassphrase(secret: string, opts: { weak?: boolean; withRecovery?: boolean } = {}): Promise<string | null> {
  requireKey();
  const h = requireHeader();
  const { kek, params } = await deriveKekWithNewParams(secret);
  const next: VaultHeader = {
    ...h,
    passphrase: { kdf: params, wrapped: await wrapMaster(kek, 'passphrase'), weak: opts.weak },
    device: undefined
  };

  let recoveryCode: string | null = null;
  if (opts.withRecovery !== false) {
    recoveryCode = newRecoveryCode();
    const recoveryKdf: KdfParams = { ...newKdfParams('pbkdf2-sha256'), iterations: RECOVERY_KDF_ITERATIONS };
    const recoveryKek = await deriveKek(recoveryCode, recoveryKdf);
    next.recovery = { kdf: recoveryKdf, wrapped: await wrapMaster(recoveryKek, 'recovery') };
  } else {
    next.recovery = undefined;
  }

  delete next.device;
  await writeHeader(next);
  return recoveryCode;
}

/** Returns the vault to device mode. Must be unlocked. */
export async function removePassphrase(): Promise<void> {
  requireKey();
  const deviceKey = await generateDeviceKey();
  const next: VaultHeader = { ...requireHeader(), device: { key: deviceKey, wrapped: await wrapMaster(deviceKey, 'device') } };
  delete next.passphrase;
  delete next.recovery;
  await writeHeader(next);
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export async function putRecord<T extends { id: string }>(record: T): Promise<void> {
  const box = await sealJson(requireKey(), record, aad(requireHeader().vaultId, 'incident', record.id));
  await (await db()).put('incidents', box, record.id);
}

export async function listRecords<T>(): Promise<T[]> {
  const key = requireKey();
  const vaultId = requireHeader().vaultId;
  const database = await db();
  const tx = database.transaction('incidents');
  const out: Promise<T>[] = [];
  for (let cursor = await tx.store.openCursor(); cursor; cursor = await cursor.continue()) {
    out.push(openJson<T>(key, cursor.value, aad(vaultId, 'incident', String(cursor.key))));
  }
  await tx.done;
  return Promise.all(out);
}

export async function deleteRecord(id: string): Promise<void> {
  await (await db()).delete('incidents', id);
}

export async function putMedia(mediaKey: string, bytes: Uint8Array): Promise<void> {
  const box = await sealBytes(requireKey(), bytes, aad(requireHeader().vaultId, 'media', mediaKey));
  await (await db()).put('media', box, mediaKey);
}

export async function getMedia(mediaKey: string): Promise<Uint8Array | null> {
  const box = await (await db()).get('media', mediaKey);
  if (!box) return null;
  return openBytes(requireKey(), box, aad(requireHeader().vaultId, 'media', mediaKey));
}

export async function listMediaKeys(): Promise<string[]> {
  return (await (await db()).getAllKeys('media')).map(String);
}

export async function deleteMedia(mediaKey: string): Promise<void> {
  await (await db()).delete('media', mediaKey);
}

export async function clearAll(): Promise<void> {
  const database = await db();
  const tx = database.transaction(['incidents', 'media'], 'readwrite');
  await Promise.all([tx.objectStore('incidents').clear(), tx.objectStore('media').clear(), tx.done]);
}

/** Test-only: forget in-memory state and close the connection. */
export async function _resetForTests(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
  header = null;
  masterKey = null;
  masterBytes = null;
}
