# Threat Model

NaariSaakshi is a browser app that holds some of the most sensitive data a person can have: records of harassment, names of the people involved, recordings and locations. This document lists who might attack that data, how, and what the app does about it today. It is deliberately honest about gaps; a status of **Open** means the risk is real and not yet handled.

_Last reviewed: 2026-10-11 (vault v1)._

## Assets

| Asset | Where it lives |
| :--- | :--- |
| Incident records (narratives, people, witnesses, locations) | Encrypted IndexedDB `incidents` store |
| Original media (photos, audio, video) | Encrypted IndexedDB `media` store, SHA-256 recorded per attachment |
| Vault master key | Memory only, while unlocked |
| Passphrase / recovery code | The user's head / paper. Never stored |
| Non-sensitive preferences (theme, quick-exit URL) | `localStorage` in plaintext |
| Trusted contact name and phone | `localStorage` in plaintext (**see T-12**) |

## Adversaries

1. **Someone with physical access to the unlocked or unlockable device**: a partner, family member, manager or colleague who can pick up the phone. This is the primary adversary.
2. **Someone who takes the device**: theft, seizure, or the device being handed over under pressure.
3. **A remote attacker** who gets script into the app's origin (XSS, a compromised npm dependency, a malicious browser extension).
4. **The service provider itself** (us, hosting, third-party APIs) as a party that should not be able to read content.
5. **The people named in records**, who may try to discredit them by claiming the evidence was altered.

## Threats and mitigations

| ID | Threat | Mitigation today | Status | Tested by |
| :--- | :--- | :--- | :--- | :--- |
| T-01 | Device holder opens the app and reads the journal | Passphrase vault: master key is only unwrapped by an Argon2id-derived key; app auto-locks after 3 min idle or 30 s hidden; **Lock now** button | Mitigated when a passphrase is set | `vault.test.ts` |
| T-02 | Same as T-01, but the user never set a passphrase | Data is encrypted at rest, but the key sits in the browser. The UI says *Not locked* and explains the risk; it does not imply protection | **Accepted risk**, disclosed | n/a |
| T-03 | Device holder copies the browser profile and brute-forces the passphrase offline | Argon2id (19 MiB, t=2) with PBKDF2-SHA256 600k fallback, 8-character minimum for new passphrases | Partial: a weak passphrase is still guessable | `crypto.test.ts` |
| T-04 | User migrated from the old 4-digit PIN | PIN carried over so the user is not locked out, flagged weak, and Settings asks for a passphrase | Partial: 10⁴ guesses is trivial offline until the user upgrades | `storageService.test.ts` |
| T-05 | Old plaintext PIN / device secret left in `localStorage` | Removed after migration is verified; settings loader strips `pinCode` | Mitigated | `storageService.test.ts` |
| T-06 | Ciphertext swapped between records or vaults to confuse the app | AES-GCM AAD binds each ciphertext to vault id + purpose + record id | Mitigated | `crypto.test.ts` |
| T-07 | Stored ciphertext modified on disk | AES-GCM authentication: any modified byte fails decryption | Mitigated (detected, not recoverable) | `crypto.test.ts` |
| T-08 | User forgets passphrase and loses everything | One-time 125-bit recovery code wraps the same master key | Mitigated if the code is kept | `vault.test.ts` |
| T-09 | Script injected into the origin while unlocked reads plaintext | None beyond React's default escaping | **Open**: plan CSP, no third-party scripts on vault routes | n/a |
| T-10 | Decrypted data lingers in memory after lock | Lock drops the key, the incident cache, and revokes media blob URLs | Partial: JavaScript cannot guarantee memory is zeroised | manual |
| T-11 | Browser evicts site data under storage pressure | `navigator.storage.persist()` requested and its result shown in Settings; export reminder | Partial: not guaranteed, and users can clear site data | manual |
| T-12 | Trusted contact visible to anyone who opens browser storage | None yet | **Open**: move into the vault (needs SOS to work while locked; design pending) | n/a |
| T-13 | Unencrypted JSON backup left on the device | Explicit warning before export | Partial: an encrypted export format is planned | n/a |
| T-14 | Voice typing sends audio to a third party | Disclosed in FAQ; typing is always available | Partial: on-device speech recognition planned | n/a |
| T-15 | Community map re-identifies a reporter (~100 m cell with 1–2 reports) | Feature disabled; Firebase not initialised; fake seed data removed | Mitigated by removal | n/a |
| T-16 | Someone else's Firestore writes to the old public collection | App no longer reads or writes it; `firestore.rules` denies all access | Mitigated once the rules are deployed | n/a |
| T-17 | Photos reveal the app (branded watermark) | App name removed from the photo label | Mitigated | n/a |
| T-18 | Respondent claims evidence was edited after capture | SHA-256 of each attachment recorded when stored | Partial: needs capture-time hashing, an append-only log and an external timestamp (roadmap weeks 2–3) | `storageService.test.ts` |
| T-19 | Photo label is presented as proof of capture time | Copy now says the label is not proof; original pixels are still overwritten by the label | Partial: keep the unlabelled original (roadmap week 2) | n/a |
| T-20 | App overstates legal effect (e.g. "court-ready") and the user relies on it | Claims audit; see [LEGAL_LIMITS.md](LEGAL_LIMITS.md) | Mitigated for current copy | manual |

## Out of scope

- A compromised operating system, a malicious browser, or spyware on the phone. A web app cannot defend against code that runs below it.
- Hiding that the app is installed. Quick Exit and the disguise screen reduce casual discovery; they do not make the app invisible.
- Coercion to reveal the passphrase. A duress PIN is deliberately **not** built yet: a detectable decoy vault can make things more dangerous, so it needs advocate review first.
