import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import * as vault from './vault';

beforeEach(async () => {
  await vault._resetForTests();
  globalThis.indexedDB = new IDBFactory();
});

/** Simulates closing the tab and reopening the app against the same database. */
async function reopen() {
  const idb = globalThis.indexedDB;
  await vault._resetForTests();
  globalThis.indexedDB = idb;
  return vault.openVault();
}

describe('device mode', () => {
  it('creates an unlocked vault and persists records across reopen', async () => {
    const st = await vault.openVault();
    expect(st).toMatchObject({ mode: 'device', unlocked: true, initialized: false });

    await vault.putRecord({ id: 'inc-1', note: 'hello' });
    await vault.putMedia('inc-1/att-1', new Uint8Array([1, 2, 3]));

    const again = await reopen();
    expect(again.unlocked).toBe(true);
    expect(await vault.listRecords()).toEqual([{ id: 'inc-1', note: 'hello' }]);
    expect(Array.from((await vault.getMedia('inc-1/att-1'))!)).toEqual([1, 2, 3]);
  });

  it('stores no plaintext in IndexedDB', async () => {
    await vault.openVault();
    await vault.putRecord({ id: 'inc-1', note: 'UNIQUE_PLAINTEXT_MARKER' });

    const raw = await new Promise<unknown[]>((resolve, reject) => {
      const req = indexedDB.open('naarisaakshi-vault');
      req.onsuccess = () => {
        const get = req.result.transaction('incidents').objectStore('incidents').getAll();
        get.onsuccess = () => { req.result.close(); resolve(get.result); };
        get.onerror = () => reject(get.error);
      };
      req.onerror = () => reject(req.error);
    });
    const bytes = new Uint8Array((raw[0] as { ct: ArrayBuffer }).ct);
    expect(new TextDecoder().decode(bytes)).not.toContain('UNIQUE_PLAINTEXT_MARKER');
  });
});

describe('passphrase mode', () => {
  it('locks on reopen and only the right passphrase unlocks', async () => {
    await vault.openVault();
    await vault.putRecord({ id: 'inc-1' });
    const recovery = await vault.setPassphrase('a long passphrase');
    expect(recovery).toMatch(/^[0-9A-Z]{5}(-[0-9A-Z]{5}){4}$/);

    const st = await reopen();
    expect(st).toMatchObject({ mode: 'passphrase', unlocked: false, hasRecoveryCode: true });
    await expect(vault.listRecords()).rejects.toBeInstanceOf(vault.VaultLockedError);

    expect(await vault.unlockWithPassphrase('wrong passphrase')).toBe(false);
    expect(vault.status().unlocked).toBe(false);
    expect(await vault.unlockWithPassphrase('a long passphrase')).toBe(true);
    expect(await vault.listRecords()).toEqual([{ id: 'inc-1' }]);
  });

  it('never persists the passphrase or a usable device key', async () => {
    await vault.openVault();
    await vault.setPassphrase('do-not-store-me');
    await reopen();
    const header = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const req = indexedDB.open('naarisaakshi-vault');
      req.onsuccess = () => {
        const get = req.result.transaction('meta').objectStore('meta').get('header');
        get.onsuccess = () => { req.result.close(); resolve(get.result); };
        get.onerror = () => reject(get.error);
      };
      req.onerror = () => reject(req.error);
    });
    expect(header.device).toBeUndefined();
    expect(JSON.stringify(header)).not.toContain('do-not-store-me');
  });

  it('recovery code unlocks after the passphrase is forgotten', async () => {
    await vault.openVault();
    await vault.putRecord({ id: 'inc-1' });
    const recovery = (await vault.setPassphrase('forgotten passphrase'))!;
    await reopen();
    expect(await vault.unlockWithRecoveryCode('AAAAA-AAAAA-AAAAA-AAAAA-AAAAA')).toBe(false);
    expect(await vault.unlockWithRecoveryCode(recovery.toLowerCase())).toBe(true);
    expect(await vault.listRecords()).toEqual([{ id: 'inc-1' }]);
  });

  it('changing the passphrase keeps data readable and retires the old one', async () => {
    await vault.openVault();
    await vault.putRecord({ id: 'inc-1' });
    await vault.setPassphrase('first passphrase');
    await vault.setPassphrase('second passphrase');
    await reopen();
    expect(await vault.unlockWithPassphrase('first passphrase')).toBe(false);
    expect(await vault.unlockWithPassphrase('second passphrase')).toBe(true);
    expect(await vault.listRecords()).toEqual([{ id: 'inc-1' }]);
  });

  it('removing the passphrase returns to an auto-unlocking device vault', async () => {
    await vault.openVault();
    await vault.putRecord({ id: 'inc-1' });
    await vault.setPassphrase('temporary passphrase');
    await vault.removePassphrase();
    const st = await reopen();
    expect(st).toMatchObject({ mode: 'device', unlocked: true, hasRecoveryCode: false });
    expect(await vault.listRecords()).toEqual([{ id: 'inc-1' }]);
  });

  it('lock() drops the key from memory', async () => {
    await vault.openVault();
    await vault.setPassphrase('lock me');
    vault.lock();
    expect(vault.status().unlocked).toBe(false);
    await expect(vault.putRecord({ id: 'x' })).rejects.toBeInstanceOf(vault.VaultLockedError);
  });
});
