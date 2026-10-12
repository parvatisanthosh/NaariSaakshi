# Security Policy

NaariSaakshi stores records of harassment for people who may be at risk. A vulnerability here can put a real person in danger, so please report issues privately.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue.

Helpful details:

- What an attacker needs (physical device access, a malicious page, a compromised dependency, …)
- Steps to reproduce, ideally against the seeded demo data
- What data is exposed or altered

We aim to acknowledge reports within 7 days.

## Scope

In scope: the vault (`src/vault/`), key handling and lock/unlock, anything that leaks journal content off the device, Quick Exit and disguise-mode bypasses, and legal or safety copy that could mislead a user into harm.

Out of scope: attacks that require a compromised operating system or browser, and self-XSS.

## Design notes

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for the assets, adversaries and known open risks. Cryptographic choices:

- AES-256-GCM via WebCrypto, fresh 96-bit random nonce per ciphertext, AAD binding vault id, purpose and record id
- Passphrase key derivation: Argon2id (19 MiB, 2 iterations, parallelism 1) with PBKDF2-HMAC-SHA256 (600,000 iterations) as fallback, following the OWASP Password Storage Cheat Sheet
- Envelope encryption: a random 256-bit master key, wrapped separately by the passphrase key and a 125-bit recovery code
