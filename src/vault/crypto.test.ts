import { describe, expect, it } from 'vitest';
import {
  aad,
  deriveKek,
  importMasterKey,
  newKdfParams,
  newMasterKeyBytes,
  newRecoveryCode,
  normalizeRecoveryCode,
  open,
  openBytes,
  seal,
  sealBytes,
  sha256Hex
} from './crypto';
import { bytesToDataUrl, dataUrlToBytes } from './encoding';

const text = (s: string) => new TextEncoder().encode(s);

describe('AES-GCM sealing', () => {
  it('round-trips and fails closed on any modification', async () => {
    const key = await importMasterKey(newMasterKeyBytes());
    const ad = aad('vault-1', 'incident', 'inc-1');
    const box = await sealBytes(key, text('hello'), ad);

    expect(new TextDecoder().decode(await openBytes(key, box, ad))).toBe('hello');

    // Flip one ciphertext byte.
    const tampered = new Uint8Array(box.ct.slice(0));
    tampered[0] ^= 1;
    await expect(openBytes(key, { iv: box.iv, ct: tampered.buffer }, ad)).rejects.toThrow();

    // Flip one nonce byte.
    const iv = box.iv.slice();
    iv[0] ^= 1;
    await expect(openBytes(key, { iv, ct: box.ct }, ad)).rejects.toThrow();

    // Wrong key.
    const other = await importMasterKey(newMasterKeyBytes());
    await expect(openBytes(other, box, ad)).rejects.toThrow();
  });

  it('binds ciphertext to its slot via AAD', async () => {
    const key = await importMasterKey(newMasterKeyBytes());
    const box = await seal(key, text('secret'), aad('v', 'incident', 'a'));
    await expect(open(key, box, aad('v', 'incident', 'b'))).rejects.toThrow();
    await expect(open(key, box, aad('other-vault', 'incident', 'a'))).rejects.toThrow();
  });

  it('never reuses a nonce', async () => {
    const key = await importMasterKey(newMasterKeyBytes());
    const ivs = new Set<string>();
    for (let i = 0; i < 200; i++) ivs.add((await seal(key, text('x'), aad('v', 'p'))).iv);
    expect(ivs.size).toBe(200);
  });
});

describe('key derivation', () => {
  it('argon2id: same secret + params gives a working key, wrong secret does not', async () => {
    const params = newKdfParams('argon2id');
    const k1 = await deriveKek('correct horse battery', params);
    const k2 = await deriveKek('correct horse battery', params);
    const wrong = await deriveKek('correct horse batterz', params);
    const box = await seal(k1, text('m'), aad('v', 'wrap'));
    await expect(open(k2, box, aad('v', 'wrap'))).resolves.toBeDefined();
    await expect(open(wrong, box, aad('v', 'wrap'))).rejects.toThrow();
  });

  it('pbkdf2 fallback works and uses the OWASP iteration count', async () => {
    const params = newKdfParams('pbkdf2-sha256');
    expect(params).toMatchObject({ alg: 'pbkdf2-sha256', iterations: 600_000 });
    const key = await deriveKek('passphrase', params);
    const box = await seal(key, text('m'), aad('v', 'wrap'));
    await expect(open(await deriveKek('passphrase', params), box, aad('v', 'wrap'))).resolves.toBeDefined();
  });

  it('normalizes Unicode so the same passphrase typed differently still matches', async () => {
    const params = newKdfParams('pbkdf2-sha256');
    const composed = await deriveKek('café', params);
    const decomposed = await deriveKek('café', params);
    const box = await seal(composed, text('m'), aad('v', 'wrap'));
    await expect(open(decomposed, box, aad('v', 'wrap'))).resolves.toBeDefined();
  });
});

describe('helpers', () => {
  it('sha256Hex matches the known answer for "abc"', async () => {
    expect(await sha256Hex(text('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('recovery codes are 5x5 groups and tolerate sloppy typing', () => {
    const code = newRecoveryCode();
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){4}$/);
    expect(normalizeRecoveryCode(code.toLowerCase().replace(/-/g, ' '))).toBe(code);
    expect(normalizeRecoveryCode('o1il0-aaaaa')).toBe('01110-AAAAA');
  });

  it('data URLs round-trip through bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    const url = bytesToDataUrl(bytes, 'video/webm;codecs=vp8');
    const parsed = dataUrlToBytes(url);
    expect(parsed.mimeType).toBe('video/webm');
    expect(Array.from(parsed.bytes)).toEqual([0, 1, 2, 250, 255]);
  });
});
