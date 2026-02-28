# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**E-SAF Civic** (Signal One) — a personal safety platform connecting citizens who feel unsafe in public spaces with UK CCTV control room operators. Built with Next.js 16, TypeScript, Tailwind CSS, and Firebase.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** Firebase Firestore (persistent data) + Firebase Realtime Database (real-time alert state)
- **Auth:** Firebase Authentication
- **State:** Zustand
- **Deployment:** Railway (live)

## Project Structure

```
app/                          # Next.js application
├── src/
│   ├── app/
│   │   ├── (passenger)/      # Passenger App (mobile-first, 20 screens)
│   │   ├── (control-room)/   # Control Room Dashboard (dark theme, 9 screens)
│   │   ├── (admin)/          # Admin Panel (12 screens)
│   │   └── api/              # API Routes (24 endpoints)
│   ├── components/
│   │   ├── shared/           # Shared UI components (Button, Card, Input, Modal, etc.)
│   │   └── control-room/     # Control room specific components
│   ├── hooks/                # useAuth, useGeolocation, useRealtimeAlert
│   ├── stores/               # Zustand stores (auth, alert, control-room)
│   ├── lib/
│   │   ├── firebase/         # Firebase client + admin config
│   │   ├── auth/             # Auth verification utilities
│   │   └── utils/            # Postcode, format, audio utilities
│   └── types/                # TypeScript type definitions
├── firebase/                 # Firestore/RTDB security rules, indexes
└── package.json
```

## Commands

```bash
cd app
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Key Architecture

- **Firebase RTDB** (`activeAlerts/{alertId}`) for real-time bidirectional sync between passenger and control room
- **Firestore** for persistent data (users, alerts, incidents, control rooms, cameras, welfare bookings)
- **API routes** handle all server-side logic (auth verification, rate limiting, sanctions, alert routing)
- **Three route groups:** `(passenger)` at `/`, `(control-room)` at `/control-room/*`, `(admin)` at `/admin/*`

## Route Map

| App | Base Path | Auth |
|-----|-----------|------|
| Passenger | `/` | citizen role |
| Control Room | `/control-room/` | operator/supervisor role |
| Admin | `/admin/` | admin role |
| API | `/api/` | Bearer token |

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in Firebase credentials. See the example file for all required variables.

## PRD Documents

- `PRD.md` — Reverse-engineered PRD from prototype
- `PRD-REDLINE.md` — Gap analysis (25 items, all addressed in this build)
- `E-SAF_Civic_Production_PRD.docx` — Canonical production PRD
