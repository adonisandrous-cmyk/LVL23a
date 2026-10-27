# Phoenix 23: UI Architecture & Display Logic Blueprint
**Standard Operating Architecture & Developer Specification for Phoenix Legal Workstation**
*Design Reference: High-Density Data-First LEAP-Style Master-Detail Workflow*

---

## 1. Overview and Core Philosophy
This document outlines the strict, data-first UI architecture for the Phoenix 23 desktop client built with CustomTkinter and React/Electron. 

### Core Principles
- **Progressive Disclosure ("Lift the Hood")**: The interface strictly prioritizes the attorney-facing product (the active matter and compiled PDF), while hiding the complex machinery (ABBYY FineReader mappings, Python logs, XFDF dumps, API connection quotas) behind a dedicated developer console.
- **Silent, Zero-Fluff Execution**: Eliminate conversational play-by-plays, marketing fluff, oversized dashboard cards, and verbose loading screens. Execute silently with clean progress bars and green verification checkmarks.
- **Data-First High Density**: Utilize strict tabular grids (Matter ID, Client Name, Opposing Party, Forms Queued, Status) so attorneys and paralegals can scan hundreds of records without interface slowdown.

---

## 2. The Global Action Ribbon (Top Bar)
A static, non-scrolling horizontal ribbon anchored permanently at the top of the application window. Separating actions from data grids prevents UI unresponsiveness and visual button overlap.

### Action Controls
1. **Matter Creation**: Single-click trigger launching the case creation sequence and Google Forms intake workflow.
2. **Documents & Vault**: Centralized repository for compiled PDF packages, raw client uploads, and the active file viewer.
3. **Finance & Ledgers**: Strict tabular ledger managing billing cycles, retainer balances, Trust accounts, and cost tracking.
4. **Forms & Motion Library**: Direct access to the database of California Judicial Council templates (`FL-100`, `FL-120`, `FL-141`, `FL-150`, `FL-300`, `FW-001`, `FW-003`, `POS`) and custom court motions.
5. **Template Ingestion**: 1-click trigger to upload, parse, map, and file official forms into Cloud Run matter directories.
6. **Run Pipeline**: Master execution trigger compiling XFDF into official unaltered PDFs.
7. **Global Search**: Instant keyboard navigation (`Ctrl+K` / `Cmd+K`) across client names, docket numbers, and statutory codes.

---

## 3. The Navigation Drawer (Auto-Collapsing)
A vertical panel anchored to the left margin, summoned via a top-left hamburger menu (`☰`):
- **Behavior**: Auto-collapses immediately upon item selection to preserve 100% of horizontal screen real estate for the active matter and PDF viewer.
- **Components**:
  - *Client Directory*: Expandable accordion menu for active matters, archived files, and quick-add functionality.
  - *Active Matters*: The primary default routing view populating the central data grid.
  - *Peripheral Dock (Slim Right-Hand Rail)*: Minimal icon strip for Calendar & Reminders, Video Meet, Research (Scholar/CourtListener), and Diagnostics. Spawns temporary overlays that dismiss on click-out.

---

## 4. Master-Detail Flow & Data Grid
The central workspace avoids bloated widgets and cards, defaulting directly to the active matter ledger:
1. **The Master Grid**:
   - Columns: `Matter ID`, `Client Name`, `Opposing Party`, `Court Venue`, `Forms Queued`, `Status`.
   - Interaction: Single-click highlights for quick operations. Double-click drills down into the dedicated Matter Dashboard.
2. **Dedicated Matter Dashboard**:
   - Isolates the case into a distinct tab or view, allowing multiple client files to remain open simultaneously without database contention.

---

## 5. Matter Dashboard: Split-Pane Architecture
Modeled directly after production-grade systems like LEAP Legal Software:
- **Left Pane (Details & Static Matter Data)**:
  - Matter ID, Client contact information, Opposing Party & Counsel, Superior Court Venue, Case/Docket Number.
  - Field mapping status and validation badges (`Court_CaseNumber`, `Client_LastName`).
- **Right Pane (Correspondence / Documents & ONLYOFFICE Viewer)**:
  - Tabular list of every file associated with the matter (generated court forms, raw client evidence, disclosures).
  - Double-clicking a document renders it directly in the embedded canvas (ONLYOFFICE Document Server or embedded PDF viewer).

---

## 6. ONLYOFFICE Integration & Cloud Run Storage Bridge
1. **Stateless Cloud Run Protection**: Cloud Run containers are ephemeral; files written to container local memory evaporate upon container termination.
2. **Permanent Storage Bridge**:
   - Python `pypdf` / Node `pdf-lib` pipeline compiles the court form in memory (`io.BytesIO` / `Buffer`).
   - The compiled document is written immediately to Google Cloud Storage bucket (`/matters/{matterId}/templates/`) and Cloud Run matter directories.
   - The Cloud Run API returns the secure public/signed URL back to the desktop application.
3. **Embedded ONLYOFFICE Canvas**:
   - An embedded web container initializes `DocsAPI.DocEditor`, pointing to the secure Cloud Storage URL.
   - Provides full zooming, printing, highlighting, redacting, and annotation without leaving Phoenix 23.

---

## 7. The "Mechanic's Toggle" (Developer Console / "Lift the Hood")
Hidden away as a subtle gear icon in the lower corner or summoned via hotkey (`F12` / `Ctrl+Shift+D`):
- **Purpose**: Strict separation of the attorney-facing product from developer mechanics.
- **Contents**:
  - Raw JSON mapping schema (`forms/{formCode}.mapping.json`).
  - AcroForm hierarchical tree and XFDF field paths (`AttyInfo[0].AttyName_ft[0]`).
  - `pypdf` / Universal Engine execution stdout and stderr logs.
  - API provider quota monitoring and fallback cascades.
- **Rule**: If the document generates cleanly, the hood stays shut.

---

## 8. Ollama Local AI & Free-Tier Model Backup Cascade
To protect against cloud rate limits, billing interruptions, and `RESOURCE_EXHAUSTED` (429) errors:
1. **Local Workstation Mode (Ollama)**:
   - Primary endpoint: `http://localhost:11434`
   - Zero cloud billing, zero network transmission, 100% attorney-client confidentiality.
   - Supported local weights: `gemma2:9b`, `gemma2:27b`, `llama3.3:70b`, `mistral:latest`, `deepseek-r1:8b`.
2. **Free-Tier Cloud Cascade**:
   - Fallback 1: Google Gemini 2.0 / 2.5 Flash Free Tier
   - Fallback 2: OpenRouter Free Tier Models (`google/gemma-2-9b-it:free`, `meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`)
   - Fallback 3: Deterministic Statutory Pleading Compiler (Offline Python / Universal Engine)
   - Auto-failover: Any 429 quota exception automatically engages the next tier silently without stopping client workflows.

---

## 9. Template & Motion Ingestion Specification
When ingesting new court forms or custom motions:
1. Accept `.pdf` (AcroForm/XFA) or `.docx`.
2. Inspect and extract all form field keys and data types.
3. Apply canonical mapping heuristics linking AcroForm keys to:
   - `Client_FirstName`, `Client_LastName`, `Client_DOB`, `Client_Address_Street`, `Client_Address_CityStateZip`, `Client_Phone`, `Client_Email`
   - `Other_FirstName`, `Other_LastName`, `Other_Address_Street`, `Other_Address_CityStateZip`
   - `Court_Name`, `Court_County`, `Court_CaseNumber`, `Court_OpposingParty_FullName`, `Court_JudgeName`, `Court_HearingDates`
   - `Case_AssistanceType`, `Case_IncidentDescription`
4. Write unaltered document to `/matters/{matterId}/templates/{formCode}.pdf` and generate `/forms/{formCode}.mapping.json`.
