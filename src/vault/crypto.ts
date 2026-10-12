/**
 * Vault cryptography: key hierarchy, key derivation and authenticated encryption.
 *
 * Key hierarchy
 *   passphrase ──KDF──► KEK ──wraps──► master key ──encrypts──► records & media
 *   recovery code ─KDF─► KEK' ─wraps──► (same) master key
 *   device key (non-extractable, IndexedDB) ─wraps──► master key   [unprotected mode only]
 *
 * Changing the passphrase only re-wraps the 32-byte master key; nothing else is
 * re-encrypted. The passphrase, derived KEKs and unwrapped master key are never persisted.
 *
 * Every ciphertext is AES-256-GCM with a fresh 96-bit random nonce and Additional
 * Authenticated Data (AAD) binding it to its vault, purpose and record id, so a
 * ciphertext copied into another slot fails to decrypt instead of being misread.
 */
import { argon2id } from 'hash-wasm';
import { bytesToBase64, base64ToBytes, bytesToHex } from './encoding';

export const CRYPTO_VERSION = 1;

export type KdfParams =
  | { alg: 'argon2id'; salt: string; memoryKiB: number; iterations: number; parallelism: number }
  | { alg: 'pbkdf2-sha256'; salt: string; iterations: number };

/** OWASP Password Storage Cheat Sheet minimums (2025). */
export const ARGON2ID_DEFAULTS = { memoryKiB: 19 * 1024, iterations: 2, parallelism: 1 } as const;
export const PBKDF2_DEFAULT_ITERATIONS = 600_000;

export interface SealedBox {
  iv: string; // base64, 12 bytes
  ct: string; // base64, ciphertext + 16-byte GCM tag
}

export interface BinarySealedBox {
  iv: Uint8Array;
  ct: ArrayBuffer;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function newMasterKeyBytes(): Uint8Array {
  return randomBytes(32);
}

/** Copies into a fresh ArrayBuffer-backed view, which WebCrypto's typings require. */
function buf(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  return copy;
}

export function aad(vaultId: string, purpose: string, id = ''): Uint8Array {
  return enc.encode(`naarisaakshi/v${CRYPTO_VERSION}/${vaultId}/${purpose}/${id}`);
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

export function newKdfParams(alg: KdfParams['alg'] = 'argon2id'): KdfParams {
  const salt = bytesToBase64(randomBytes(16));
  if (alg === 'argon2id') return { alg, salt, ...ARGON2ID_DEFAULTS };
  return { alg, salt, iterations: PBKDF2_DEFAULT_ITERATIONS };
}

/** Derives a non-extractable AES-GCM key-encryption key from a secret. */
export async function deriveKek(secret: string, params: KdfParams): Promise<CryptoKey> {
  const salt = base64ToBytes(params.salt);
  const secretBytes = enc.encode(secret.normalize('NFKC'));

  let raw: Uint8Array;
  if (params.alg === 'argon2id') {
    raw = await argon2id({
      password: secretBytes,
      salt,
      parallelism: params.parallelism,
      iterations: params.iterations,
      memorySize: params.memoryKiB,
      hashLength: 32,
      outputType: 'binary'
    });
  } else {
    const base = await crypto.subtle.importKey('raw', buf(secretBytes), 'PBKDF2', false, ['deriveBits']);
    raw = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: buf(salt), iterations: params.iterations, hash: 'SHA-256' },
        base,
        256
      )
    );
  }

  try {
    return await crypto.subtle.importKey('raw', buf(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
  } finally {
    raw.fill(0);
  }
}

/**
 * Tries Argon2id first (memory-hard), falling back to PBKDF2 when WASM or the
 * 19 MiB allocation is unavailable on the device.
 */
export async function deriveKekWithNewParams(secret: string): Promise<{ kek: CryptoKey; params: KdfParams }> {
  const argonParams = newKdfParams('argon2id');
  try {
    return { kek: await deriveKek(secret, argonParams), params: argonParams };
  } catch (err) {
    console.warn('Argon2id unavailable, falling back to PBKDF2:', err);
    const pbkdfParams = newKdfParams('pbkdf2-sha256');
    return { kek: await deriveKek(secret, pbkdfParams), params: pbkdfParams };
  }
}

// ---------------------------------------------------------------------------
// AES-GCM primitives
// ---------------------------------------------------------------------------

export async function importMasterKey(masterBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', buf(masterBytes), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function generateDeviceKey(): Promise<CryptoKey> {
  // Non-extractable: script can use it, but cannot read the raw key bytes out.
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function sealBytes(key: CryptoKey, plain: Uint8Array, additionalData: Uint8Array): Promise<BinarySealedBox> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: buf(iv), additionalData: buf(additionalData) },
    key,
    buf(plain)
  );
  return { iv, ct };
}

/** Throws (OperationError) if the key, AAD, nonce or ciphertext is wrong or modified. */
export async function openBytes(key: CryptoKey, box: BinarySealedBox, additionalData: Uint8Array): Promise<Uint8Array> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf(box.iv), additionalData: buf(additionalData) },
    key,
    box.ct
  );
  return new Uint8Array(plain);
}

export async function seal(key: CryptoKey, plain: Uint8Array, additionalData: Uint8Array): Promise<SealedBox> {
  const box = await sealBytes(key, plain, additionalData);
  return { iv: bytesToBase64(box.iv), ct: bytesToBase64(new Uint8Array(box.ct)) };
}

export async function open(key: CryptoKey, box: SealedBox, additionalData: Uint8Array): Promise<Uint8Array> {
  return openBytes(key, { iv: base64ToBytes(box.iv), ct: buf(base64ToBytes(box.ct)).buffer }, additionalData);
}

export async function sealJson(key: CryptoKey, value: unknown, additionalData: Uint8Array): Promise<BinarySealedBox> {
  return sealBytes(key, enc.encode(JSON.stringify(value)), additionalData);
}

export async function openJson<T>(key: CryptoKey, box: BinarySealedBox, additionalData: Uint8Array): Promise<T> {
  return JSON.parse(dec.decode(await openBytes(key, box, additionalData))) as T;
}

// ---------------------------------------------------------------------------
// Integrity & recovery helpers
// ---------------------------------------------------------------------------

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', buf(bytes))));
}

// Crockford base32 without ambiguous characters (no I, L, O, U).
const RECOVERY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 25 random base32 characters = 125 bits, shown as five groups of five. */
export function newRecoveryCode(): string {
  const bytes = randomBytes(25);
  const chars = Array.from(bytes, b => RECOVERY_ALPHABET[b & 31]);
  return [0, 5, 10, 15, 20].map(i => chars.slice(i, i + 5).join('')).join('-');
}

/** Accepts lowercase, spaces and the usual 0/O, 1/I/L look-alikes. */
export function normalizeRecoveryCode(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return cleaned.match(/.{1,5}/g)?.join('-') ?? '';
}
