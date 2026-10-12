# Roadmap

**Positioning:** NaariSaakshi is the private evidence vault a person uses *before* filing, whether with an Internal Committee, SHe-Box or the police. It preserves originals, shows they have not changed, works offline, and produces a package an IC member or lawyer can check, without claiming the app makes evidence admissible.

The plan is six weeks of depth on that one problem rather than more features.

| Week | Theme | Deliverables | Status |
| :--- | :--- | :--- | :--- |
| 1 | Credibility fixes | Encrypted IndexedDB vault (Argon2id → wrapped master key, recovery code, AAD-bound AES-GCM); verified migration off `localStorage`; passphrase unlock; claims audit across UI and README; community map paused; POSH month-end fix; threat model, legal limits, security policy; Vitest suite + CI | **Done** |
| 2 | Immutable capture | Hash originals at capture time in a worker; keep the unlabelled original photo alongside the labelled copy; corrections stored as appended amendments, never overwrites; canonical JSON manifest per evidence item | Planned |
| 3 | Integrity log + timestamping | Append-only hash chain over manifests; daily Merkle root; anchor **only the root** via OpenTimestamps (Bitcoin), upgrade pending proofs; nothing personal on-chain | Planned |
| 4 | Verifiable export | ZIP with originals, exhibit index, `manifest.json`, SHA-256 report, amendment log, Merkle proofs, `.ots` proof, Section 63 worksheet (fields only, not a certificate) and the PDF; static verifier page that checks a ZIP locally in the browser, linked by QR code | Planned |
| 5 | On-device chat OCR | Import a chat screenshot; Tesseract.js (English, Hindi) in a worker; reconstruct sender / time / message with bounding-box provenance; mandatory human review; evaluate on a labelled synthetic set (field-level F1, latency, memory) | Planned |
| 6 | Proof & polish | Code-split the 1.5 MB bundle (lazy Leaflet, jsPDF, OCR); CSP; Playwright end-to-end for capture → lock → export → tamper → verify; README rewrite with benchmarks; demo video; usability sessions with synthetic scenarios | Planned |

## Not in scope (and why)

- **Community hotspot map**: re-identification risk, and Safecity already does this well.
- **Cloud backup / sync**: valuable, but zero-knowledge sync is a project of its own; manual export covers the gap for now.
- **Risk or danger prediction**: no valid training data, and a false "low risk" could cause harm.
- **Wallets, tokens, EAS or a custom chain**: OpenTimestamps gives the same existence proof with no wallet, gas or on-chain metadata.
- **Duress PIN / decoy vault**: needs advocate review; a detectable decoy can make coercion worse.
- **Automatic offence classification or filing**: legal determinations stay with professionals; the user always decides what is sent.
