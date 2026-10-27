# ShiftBridge — Dual-Sector Operational Workforce Coordination System

> **Prototype** for workforce coordination in higher education and non-clinical facilities.
> Built with React 18, TypeScript, and Tailwind CSS.

---

## 📋 Executive Overview

ShiftBridge bridges the operational coordination gap across multi-shift, non-clinical facilities and environmental services teams. Designed specifically for:
1. **Colleges & Schools**: Academic classroom blocks, wet labs, libraries, athletic pavilions, and dining atriums.
2. **Hospitals & Healthcare Facilities (Non-Clinical Support)**: Non-clinical ward corridors, clean linen supply, emergency receiving logistics, and environmental sanitation.

> [!IMPORTANT]
> **Prototype security limits**: This repository contains seeded demo data and a browser-only storage engine. Its demo sign-in, role checks, audit log, and client-side PHI filter are not production security controls. Do not enter real staff, patient, or operational data. Production authentication, server-side authorization, and a connected backend have not been implemented.

---

## 🌟 Key Capabilities & Feature Matrix

| Feature | PRD Requirement | Implementation in ShiftBridge |
| :--- | :--- | :--- |
| **Dual-Sector Switching** | FR-2 | Dynamic toggle between **Colleges & Schools** and **Hospitals (Non-Clinical)** with automatic terminology adaptation (`Classrooms` vs `Wards`, `Sanitation` vs `Biohazard/EVS`). Zero data loss. |
| **Demo personas** | FR-1 | Seeded local personas for UI previews only. Demo sign-in runs only on localhost with the Vite development server; it is not production authentication. |
| **Shift Rostering & Crossover** | FR-3 | Complete roster scheduling supporting daytime and overnight shifts that cross midnight without timestamp distortion. |
| **Shift Collision Prevention** | FR-4 | Live diagnostic collision engine (`(StartA < EndB) && (EndA > StartB)`) with real-time UI warning banners preventing double-booking staff. |
| **Demo Attendance Loop** | FR-5 | Local preview of check-in timing and attendance flows; not a server-verified or tamper-resistant record. |
| **Tasks & Mandatory Blockers** | FR-6 | Task checklists with statuses (`To Do`, `In Progress`, `Blocked`, `Done`). Moving a task to `Blocked` strictly mandates an operational justification rationale. |
| **Shift Handovers & Custody** | FR-7 | Structured shift handoffs tracking outgoing and incoming shift IDs, supervisor acknowledgment, and resolution notes. |
| **Handover summaries** | FR-8 | Deterministic local summaries; handover text is not sent to an external AI service. |
| **Demo event log** | FR-9 | Browser-local event log for UI previews; it is not an immutable or compliance-grade audit trail. |
| **Vertex Lab Bento Grid GUI** | DESIGN.md | High-density utilitarian design language featuring rounded cards (16–24px), status pills (9999px), dark-mode navigation sidebar, and mobile touch targets (min 48px). |

---

## 👥 Demo Personas & One-Click Test Accounts

The local development demo includes synthetic operational records and persona switching. These are not real user accounts:

| Persona | Role | Sector / Department | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Elena Vance** | Operations Admin | Facilities & Logistics Director | Full administrative command, schedule creation, attendance correction, audit log review |
| **Jordan Lee** | Field Staff | Campus Facilities Lead | Higher education classroom safety inspections, HEPA filter replacements, area handovers |
| **Morgan Chen** | Field Staff | Hospital EVS Specialist | Hospital corridor sanitation, clean linen restocking, biohazard utility closet checks |
| **Marcus Wright** | Field Staff | Sanitation & Safety Lead | Chemistry wet lab eyewash station inspections, grounds sanitation |
| **Priya Patel** | Field Staff | Support Services Coordinator | Central study commons reset, public reception concourse coverage |
| **Carlos Mendez** | Deactivated Staff | Facilities Technician | Demonstrates deactivated account access denial (cannot log in or check in) |

---

## 🛠️ Project Architecture & Structure

```
promptwars/
├── src/
│   ├── components/
│   │   ├── admin/             # Operations Admin command decks
│   │   │   ├── OverviewDeck.tsx       # Vertex Lab Bento Grid dashboard
│   │   │   ├── ShiftRoster.tsx        # Shift scheduling, calendar, overlap warnings
│   │   │   ├── TaskManagement.tsx     # Task checklist & Kanban board
│   │   │   ├── HandoverDeck.tsx       # Shift handover logs & AI summarization
│   │   │   ├── StaffManagement.tsx    # Staff profiles, roles, and activation
│   │   │   ├── WorkAreas.tsx          # Campus & Hospital facility zones
│   │   │   └── AuditEvents.tsx        # Forensic compliance audit ledger
│   │   ├── staff/             # Mobile-first Field Staff views
│   │   │   ├── StaffDashboard.tsx     # Shift hero card, check-in/out, live tasks
│   │   │   ├── StaffTasks.tsx         # Staff personal task checklist
│   │   │   ├── StaffHandovers.tsx     # Handover submission with PHI validation
│   │   │   └── StaffProfile.tsx       # Staff credentials and sector details
│   │   ├── auth/
│   │   │   └── LoginPage.tsx          # Role-based login & 1-click persona picker
│   │   └── common/            # Reusable UI primitives (Bento cards, Badges, Modals)
│   ├── context/
│   │   ├── AuthContext.tsx            # Local-only demo session
│   │   └── InstitutionContext.tsx     # Dual-sector switching & dynamic terminology
│   ├── lib/
│   │   ├── storageEngine.ts           # Stateful repository with event bus reactivity
│   │   ├── seedData.ts                # Rich seed dataset for higher-ed and healthcare
│   │   ├── gemini.ts                  # Local summary and client-side warning helper
│   │   ├── supabase.ts                # Supabase PostgreSQL client configuration
│   │   └── utils.ts                   # Date/time formatting, overlap & window validation
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces matching database schema
│   ├── App.tsx                        # Master routing, role gating & preview console
│   └── main.tsx                       # React application entry point
├── supabase/
│   └── migrations/
│       ├── 20261027000001_initial_schema.sql  # Database schema draft
│       └── 20261027000002_profile_privilege_hardening.sql  # Profile role change guard
├── tests/
│   └── shiftbridge_test.ts            # Automated 14-test compliance test suite
├── .env.example                       # Optional Supabase scaffolding placeholders
├── index.html                         # HTML template with Google Fonts
├── package.json                       # Dependencies and NPM scripts
├── tailwind.config.js                 # Vertex Lab color tokens & radii
└── vite.config.ts                     # Vite build configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

### 2. Installation
```bash
npm install
```

### 3. Start the local demo
```bash
npm run dev
```
Open **`http://localhost:5173/`**. Choose a seeded persona and use the demo password `demo-only`.

The public preview is available at [https://aspgamingtamila.github.io/promptwars/](https://aspgamingtamila.github.io/promptwars/). It contains synthetic data only; changes are saved in your own browser.

### 4. Production status

Production builds intentionally disable demo sign-in. This prototype has no real authentication or server-backed data layer, so it is not ready for production or real workforce information. The SQL files are schema drafts and are not connected to the UI. A public Supabase anon key is not a secret, but it must be paired with reviewed row-level security policies; never place a service-role key in a `VITE_*` variable.

### 5. Build the static assets
```bash
npm run build
```
Generates static assets. Building the app does not add authentication or make it safe for production use.

---

## 🧪 Verification & Acceptance Checklist

- [ ] **FR-1**: Production authentication and server-enforced role-based access control.
- [x] **FR-2**: Dynamic institution mode toggle (Colleges/Schools ↔ Hospitals) without data loss.
- [x] **FR-3**: Day & overnight shift scheduling with duration computation across midnight.
- [x] **FR-4**: Live shift collision detection engine with warning notifications.
- [x] **FR-5**: 2-hour pre-shift check-in window constraint validation and attendance logging.
- [x] **FR-6**: Task status management with mandatory blocker rationale enforcement.
- [x] **FR-7**: Handover chain of custody with outgoing/incoming shift linkage & supervisor acknowledgment.
- [ ] **FR-8**: Server-side safeguards and privacy review for sensitive operational text.
- [ ] **FR-9**: Server-enforced, tamper-resistant audit trail.
- [x] **UI**: Vertex Lab Bento Grid layout with responsive desktop and mobile views.
- [ ] **Build & Test**: Run and review build and test results before deployment.
