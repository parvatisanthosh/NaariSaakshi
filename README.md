<div align="center">

# 🛡️ NaariSaakshi (EvidenceHer)
### *Contemporaneous Evidence Journaling & Pattern Intelligence for Workplace & Personal Safety*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-naari--saakshi.vercel.app-E8368F?style=for-the-badge&logo=vercel&logoColor=white)](https://naari-saakshi.vercel.app/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![jsPDF](https://img.shields.io/badge/jsPDF-4.2-EC1C24?style=for-the-badge&logo=adobe-acrobat-reader&logoColor=white)](https://github.com/parallax/jsPDF)
[![License: MIT](https://img.shields.io/badge/License-MIT-7C5CFF?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>A private, encrypted journal for documenting harassment before you are ready to report it.</strong><br>
  Local-first encrypted storage, human-reviewed auto-structuring, POSH Act (2013) filing-window tracking, and quick-exit safety controls.
</p>

### 🔗 **Live Web Application**: [https://naari-saakshi.vercel.app/](https://naari-saakshi.vercel.app/)

[🌐 Live Demo](https://naari-saakshi.vercel.app/) •
[✨ Key Features](#-key-features) •
[🏛️ Legal & Compliance Framework](#-legal--compliance-framework) •
[🧠 AI & Pattern Engine](#-ai-intelligence--pattern-engine) •
[🔒 Privacy & Stealth Architecture](#-privacy--stealth-architecture) •
[🚀 Quick Start](#-quick-start) •
[📁 Project Structure](#-project-structure) •
[📄 Export Formats](#-complaint-draft-export)

---

</div>

## 📌 Executive Summary

Workplace harassment and personal boundary violations often occur incrementally over time. Victims frequently face skepticism when attempting to report isolated incidents months later without contemporaneous records. 

**NaariSaakshi** (meaning *"Woman as Witness"*, codenamed *EvidenceHer*) is a specialized web application engineered to solve the **"structured evidence over time"** challenge. It empowers individuals to record detailed contemporaneous logs (voice, video, photos, call recordings, and text), suggests a structured summary from free-text narratives for the user to review, highlights repeat people and places across entries, estimates the filing window under India's POSH Act, and drafts PDF complaint documents for Internal Complaints Committees (ICC) or the police. It does not make evidence admissible by itself; see [Legal limits](docs/LEGAL_LIMITS.md).

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  Multi-Modal    │ ──> │ Human-in-the-Loop AI │ ──> │ Pattern Recognition &  │
│  Capture Layer  │     │ Extraction (Consent) │     │ Geolocation Hotspots   │
└─────────────────┘     └──────────────────────┘     └────────────────────────┘
         │                                                        │
         ▼                                                        ▼
┌─────────────────┐                                  ┌────────────────────────┐
│ Stealth & SOS   │                                  │ 1-Click POSH / FIR     │
│ Panic Controls  │                                  │ PDF Exhibit Generation │
└─────────────────┘                                  └────────────────────────┘
```

---

## ✨ Key Features

### 🎙️ 1. Multi-Modal Contemporaneous Evidence Logging
- **Voice-to-Text & Audio Journaling**: Record audio memos with real-time waveform visualization and ambient recording capabilities.
- **Timestamped Photo Capture**: In-app camera adds a visible date, time and optional location label. The label aids readability; it is not proof of capture time.
- **Quick Capture (Live Video & Audio)**: 1-tap instant recording mode for in-the-moment situations. Automatically saves draft entries even during unexpected browser interrupts.
- **Speakerphone Call Recording**: Guided recording of your side of a call with a rough transcript, plus context-specific guidance on when recording is appropriate.
- **Unsaved Notes Protection**: 3-option modal safeguard (`Save as Draft`, `Discard & Leave`, `Continue Editing`) prevents accidental data loss during stress.

### 🤖 2. Human-Reviewed Auto-Structuring
- **Rule-Based Field Parsing**: On-device rules suggest structured fields from conversational input:
  - Incident Date & Time
  - Precise Location / Workspace Area
  - Individuals Involved (Clean Name & Role Normalization)
  - Category Classification (Digital, Physical, Quid-Pro-Quo, Stalking, Economic, Intimidation, Verbal)
  - Chronological Specific Actions
  - Impact Assessment & Witness Identifiers
- **Consent-First Editable Extraction**: Extracted fields are displayed in an interactive review card before saving, ensuring users maintain total agency and precision over their record.

### 📈 3. Pattern Recognition & Risk Escalation
- **Repeat Offender Tracking**: Cross-incident entity resolution detects repeat perpetrators across varying dates and locations.
- **Pattern Summary Score**: A transparent frequency/recency summary of your own entries. It is not a prediction of danger.
- **Personal Incident Map**: Leaflet map of entries you chose to tag with a location, with on-device GPS positioning. Shared community signals are paused pending a privacy review.
- **Proactive Risk Warning Banners**: Contextual banners alert users when multiple incidents indicate systemic behavior.

### ⚖️ 4. POSH Act (2013) Deadline & Compliance Engine
- **Three-Month Filing Window**: Estimates the Section 9 window (three calendar months, clamped correctly at month ends) under the Sexual Harassment of Women at Workplace Act, 2013.
- **Incident-Series Rule**: Automatically anchors the 3-month statutory window to the **most recent incident** in an ongoing series.
- **Extension Advisory**: Flags eligibility for the 3-month ICC extension window with required justification guidance.

### 📄 5. Complaint Draft Export
- **1-Click jsPDF Generation**: Produces formal, numbered, chronologically indexed complaint dossiers.
- **Embedded Evidence Exhibits**: Directly embeds timestamped photographic evidence cards and attachment registries into PDF pages.
- **Three Specialized Export Formats**:
  1. **POSH / ICC Formal Complaint**: Includes corporate metadata, formal prayer, relief requests, and verification clause.
  2. **Police Complaint / FIR Draft**: Pre-formatted for law enforcement with Zero FIR notices (BNSS Section 173) and Section 199 BNS (formerly 166A IPC).
  3. **Personal Confidential Archive**: Exhaustive chronological journal export for personal records.

### 🛡️ 6. Stealth, Privacy & Panic Controls
- **Instant Quick Exit**: 1-tap header button or keyboard `Esc` panic trigger instantly redirects the browser to safe decoy websites (e.g., Weather or Google).
- **Disguise Screen / Stealth Skin**: Toggles live video recording into a realistic, innocent notes/calculator interface while recording silently in the background.
- **Passphrase Vault Lock**: Argon2id-derived key unlocks an AES-256-GCM vault; nothing that can decrypt it is stored on the device. One-time recovery code; auto-lock after 3 minutes idle or 30 seconds in the background.
- **Emergency SOS Panel**: Persistent 1-tap calling for **112** (Emergency), **181** (Women's Helpline), **1091** (Distress Helpline), and **14416** (Tele-MANAS Mental Health Support) + 1-tap SMS location dispatch to a Trusted Contact.
- **Encrypted Local-First Storage**: Entries and media live in an encrypted IndexedDB vault in the browser, with each attachment's SHA-256 recorded on save. Backup is a manual (unencrypted) JSON export; there is no cloud sync.

---

## 🏛️ Legal & Compliance Framework

NaariSaakshi organises records around Indian law. Whether a record is admissible or persuasive is decided by an ICC, police or court, never by the app. See [docs/LEGAL_LIMITS.md](docs/LEGAL_LIMITS.md).

| Legal Provision | Application in NaariSaakshi |
| :--- | :--- |
| **POSH Act, 2013 (Section 9)** | Estimates the three-month filing window, anchored to the last incident in a series, and explains the up-to-three-month extension. |
| **Zero FIR (BNSS Section 173)** | Police drafts note that an FIR can be registered at any police station irrespective of jurisdiction. |
| **Section 199 BNS (formerly 166A IPC)** | Explains that failing to record information about certain offences against women is itself punishable. |
| **Recordings as evidence** | Explains that courts have admitted relevant, accurate, untampered recordings (R.M. Malkani, 1973), and that this is not blanket permission to record. |
| **Section 63 BSA (formerly 65B IEA)** | Records SHA-256 hashes of stored media to support a later electronic-evidence certificate, which must be completed and signed by the appropriate person. |

---

## 🧠 Auto-Structuring & Pattern Engine

```
Raw Voice / Free Text Log
         │
         ▼
┌────────────────────────────────────────────────────────┐
│       Classification & Extraction Priority Engine       │
│                                                        │
│  1. Medium Priority: Digital (Photos/Screenshots/DMs)  │
│  2. Action Priority: Physical (Unwanted contact)       │
│  3. Intent Priority: Quid-Pro-Quo (Appraisal/Favors)   │
│  4. Pattern Priority: Stalking / Intimidation / Verbal  │
└────────────────────────────────────────────────────────┘
         │
         ├──> Extract People (Normalize: "Mr. Rohan" -> "rohan")
         ├──> Extract Location, Date & Witnesses
         ├──> Formulate Structured Fact Chronology
         │
         ▼
┌────────────────────────────────────────────────────────┐
│               Human Review Before Saving               │
│       (Editable Draft Review Modal Before Save)        │
└────────────────────────────────────────────────────────┘
```

---

## 🔒 Privacy & Encryption Architecture

```
 passphrase ────Argon2id──► KEK  ─┐
 recovery code ──PBKDF2───► KEK' ─┼─ unwraps ─► master key (AES-256, in memory only while unlocked)
 no passphrase: non-extractable   │                 │
 device key kept in IndexedDB ────┘                 ├─► incidents store: one AES-GCM record per incident
                                                    └─► media store: original bytes per attachment (+ SHA-256)

 Every ciphertext: fresh 96-bit nonce, AAD = vault id + purpose + record id
```

- **Nothing that can decrypt the vault is stored once a passphrase is set.** Changing it re-wraps one 32-byte key; nothing else is re-encrypted.
- **Without a passphrase the journal is encrypted at rest but opens automatically.** The app says so plainly instead of implying protection it does not give.
- **No server receives your notes.** The one network path for content is the browser's own speech recognition (Chrome sends audio to Google), which the app discloses.
- Threat model and known limits: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md). Vulnerability reports: [SECURITY.md](SECURITY.md).

---

## 🛠️ Tech Stack & Architecture

- **Core & Logic**: React 19, TypeScript 6.0, Vite 8.2
- **Styling & Design System**: Tailwind CSS 3.4 + Custom CSS Theme Tokens (Dark `#0D0B10`, Light `#FFFFFF`, Stealth Mode)
- **Typography**: `Bebas Neue` (Display Headers) + `Inter` / Modern Sans (Interface Body)
- **Icons**: Lucide React
- **Geospatial & Mapping**: Leaflet 1.9, React-Leaflet 5.0, CartoDB Dark Matter Tiles
- **Document & PDF Compilation**: jsPDF 4.2, HTML2Canvas 1.4
- **Backend & Cloud (Hybrid)**: Firebase Firestore, Auth & Storage (v12)
- **UI Enhancements**: Canvas-Confetti, Web Audio API (Waveform visualizer), MediaStream & MediaRecorder APIs

---

## 📁 Project Structure

```
evidenceher/
├── public/
│   └── favicon.svg               # Application branding icon
├── src/
│   ├── assets/                   # Static media assets
│   ├── components/
│   │   ├── CameraCaptureModal.tsx    # Photo capture with visible date/time label
│   │   ├── ChatbotModal.tsx          # Safety assistant with legal knowledge base
│   │   ├── FAQScreen.tsx             # Frequently asked questions & guides
│   │   ├── IncidentDetailScreen.tsx  # Detailed incident viewer & exhibit inspector
│   │   ├── LoadingScreen.tsx         # Branded loading experience
│   │   ├── LogIncidentScreen.tsx     # Voice & text logging with auto-structuring
│   │   ├── Navigation.tsx            # Sticky header, bottom nav & SOS controls
│   │   ├── PatternsScreen.tsx        # Pattern analytics & Leaflet hotspot map
│   │   ├── VaultUnlockModal.tsx      # Passphrase / recovery-code unlock screen
│   │   ├── QuickCaptureScreen.tsx    # Live video/audio recorder with disguise mode
│   │   ├── RecordCallScreen.tsx      # Speakerphone call audio recorder
│   │   ├── ReportScreen.tsx          # Multi-format POSH/Police PDF report generator
│   │   ├── RightsScreen.tsx          # Interactive Myth vs. Fact legal rights guide
│   │   ├── SettingsScreen.tsx        # Vault lock, Quick Exit, Backup & Data controls
│   │   ├── SosPanelModal.tsx         # Emergency helplines (112, 181, 1091, 14416)
│   │   └── TimelineScreen.tsx        # Filterable chronological incident timeline
│   ├── aiEngine.ts               # Local NLP extraction & pattern clustering engine
│   ├── chatbotKnowledge.ts       # Grounded legal knowledge base & distress router
│   ├── firebaseService.ts        # Community signals (paused; no network while disabled)
│   ├── poshDeadlineHelper.ts     # POSH Act 2013 three-month window calculator
│   ├── vault/                    # Encrypted IndexedDB vault: crypto, key wrapping, migration
│   ├── reportEngine.ts           # jsPDF formal complaint & exhibit compiler
│   ├── storageService.ts         # Local-first storage & JSON data management
│   ├── style.css                 # Custom CSS variables, themes & Leaflet styles
│   ├── types.ts                  # Central TypeScript domain interfaces
│   ├── App.tsx                   # Master router, auto-lock & popstate history
│   └── main.tsx                  # React DOM root mounting
├── index.html                    # HTML5 template with Google Fonts integration
├── package.json                  # Dependencies & execution scripts
├── tailwind.config.js            # Design tokens & color palette configuration
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🚀 Quick Start

> 🌐 **Try it live instantly without setup:** [**https://naari-saakshi.vercel.app/**](https://naari-saakshi.vercel.app/)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/naarisaakshi.git
cd naarisaakshi
npm install
```

### 2. Configure Environment Variables (Optional)
Firebase is only used by the community-signals feature, which is currently paused. To work on it, copy `.env.example` to `.env` and provide your project credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(Note: No Firebase credentials are needed to run the app.)*

### 3. Launch Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Run the Test Suite
```bash
npm test
```
Covers the vault crypto (tamper and wrong-key rejection, AAD binding, KDF known answers), passphrase/recovery flows, migration from the pre-vault storage format, and POSH date arithmetic.

### 4. Build Production Bundle
```bash
npm run build
npm run preview
```

---

## 📱 User Workflows & Live Demonstration Guide

### 1. Logging an Incident with Voice & AI Extraction
1. Navigate to **Log Incident** (`+ Log`).
2. Press **Start Voice Recording** and speak naturally (e.g., *"Yesterday at 4 PM in Conference Room B, Rohan Sharma stood in the doorway blocking my exit and made inappropriate comments..."*).
3. Stop recording. The AI extraction card instantly structures:
   - **Category**: `Intimidation / Non-verbal`
   - **Person**: `Rohan Sharma (Engineering Manager)`
   - **Location**: `Conference Room B`
   - **Key Actions**: Specific chronological bullet points
4. Edit any field directly in the review card.
5. Attach a photo with watermarking and tap **Save Incident**.

### 2. Reviewing Escalation & Pattern Hotspots
1. Navigate to **Patterns** tab.
2. View detected repeat-offender clusters with timeline spans and escalation risk metrics.
3. Explore the **Incident Hotspots Map** to view incident locations alongside your live pulsing GPS coordinates.

### 3. Compiling an Official POSH / Police PDF Dossier
1. Navigate to **Report** tab.
2. Select your export profile: `HR / POSH Committee` or `Police Complaint Draft (Zero FIR)`.
3. Select the incidents to include and toggle **Embed Image Exhibits**.
4. Tap **Generate & Download PDF** to produce a stamped, professional legal complaint.

### 4. Demonstrating Stealth Safety Controls
- Press `Esc` anywhere on the keyboard or tap **Quick Exit** in the header to immediately redirect to `weather.com`.
- Open **Quick Capture**, toggle **Disguise Screen**, and observe the live recording interface transform into an unobtrusive notes checklist while media capture continues uninterrupted.

---

## ⚖️ Ethical & Legal Disclaimer

*NaariSaakshi is an independent technology solution created to assist individuals in organizing personal notes and contemporaneous records. The application, AI extraction modules, and legal guidance sections do not constitute formal legal representation, attorney-client privileged counsel, or binding legal advice. Users are encouraged to consult with certified legal practitioners, organizational Internal Complaints Committees (ICC), or statutory helplines for specific legal proceedings.*

---

<div align="center">
  <sub>Engineered with care for dignity, autonomy, and justice.</sub><br>
  <strong>NaariSaakshi • EvidenceHer</strong>
</div>
