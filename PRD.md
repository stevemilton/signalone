# E-SAF Civic — Product Requirements Document

**Version:** 1.0 (Reverse-Engineered)
**Last Updated:** 2026-02-18
**Product:** E-SAF Civic Personal Safety Platform
**Owner:** E-SAF Systems Ltd
**Status:** Live (Production)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Users](#4-target-users)
5. [System Architecture](#5-system-architecture)
6. [App 1: Civic Passenger App](#6-app-1-civic-passenger-app)
7. [App 2: Civic Control Room Dashboard](#7-app-2-civic-control-room-dashboard)
8. [Data Model & Firebase Integration](#8-data-model--firebase-integration)
9. [Security, Privacy & Compliance](#9-security-privacy--compliance)
10. [Misuse Policy & Sanctions](#10-misuse-policy--sanctions)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Design System](#12-design-system)
13. [Edge Cases & Error Handling](#13-edge-cases--error-handling)
14. [Future Considerations](#14-future-considerations)

---

## 1. Executive Summary

E-SAF Civic is a two-app personal safety platform that connects individuals who feel unsafe in public spaces with local CCTV control room operators in the UK. The system consists of:

- **Civic Passenger App** — A mobile-first web app for citizens to send safety alerts
- **Civic Control Room Dashboard** — A dark-themed operator interface for receiving, managing, and responding to alerts in real time

The platform uses Firebase Realtime Database for bidirectional communication between citizens and operators. It is explicitly positioned as a **supplementary safety tool**, not a replacement for emergency services (999).

The current live deployment serves the **Herts CCTV Partnership**, covering Hertfordshire (SG postcodes), operating 24/7.

---

## 2. Problem Statement

People walking alone in public spaces — particularly at night, in transit, or in unfamiliar areas — often feel vulnerable with no easy way to get help short of calling emergency services. Meanwhile, CCTV control rooms have extensive camera networks but no direct link to the people those cameras are designed to protect.

**The gap:** There is no lightweight, non-emergency channel for citizens to signal that they feel unsafe and be actively monitored by existing CCTV infrastructure.

---

## 3. Product Vision & Goals

### Vision
Every person walking in a UK town or city can be watched over by their local CCTV control room at the press of a button.

### Goals
1. **Reduce response time** — Connect citizens to CCTV operators faster than traditional reporting channels
2. **Leverage existing infrastructure** — Use the UK's extensive CCTV network as a proactive safety tool
3. **Provide reassurance** — Give users real-time visibility into operator actions (searching, monitoring, escalating)
4. **Enable graduated response** — Two alert levels allow proportionate responses without overwhelming control rooms
5. **Deter misuse** — A clear, graduated sanctions framework protects system integrity
6. **Scale nationally** — Architecture supports linking any UK control room via postcode-based routing

---

## 4. Target Users

### 4.1 Citizens (Passenger App)
- People walking alone at night (e.g., from train station to home)
- Commuters in transit through monitored areas
- Vulnerable individuals in town centres
- Anyone in a public space who feels unsafe but is not in immediate danger requiring 999

### 4.2 CCTV Control Room Operators (Control Room Dashboard)
- Trained operators at municipal CCTV partnerships
- 24/7 shift workers monitoring camera feeds
- Supervisors overseeing incident response

---

## 5. System Architecture

### High-Level Architecture

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────────────┐
│  Civic Passenger App │◄───────►│  Firebase RTDB   │◄───────►│  Civic Control Room App  │
│  (Mobile Web)        │         │  (Real-time sync)│         │  (Tablet/Desktop Web)    │
└─────────────────────┘         └──────────────────┘         └─────────────────────────┘
         │                                                              │
         ▼                                                              ▼
   SMS Gateway                                                   CCTV Camera Feeds
   (Emergency Contact                                            (Existing infrastructure)
    Notification)
```

### Technology Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend/Database:** Firebase Realtime Database (v10.7.1)
- **Hosting:** Netlify
- **Firebase Project:** `working-esaf-transport-demo`
- **Database URL:** `working-esaf-transport-demo-default-rtdb.firebaseio.com`
- **Storage:** `working-esaf-transport-demo.firebasestorage.app`

### Communication Flow
1. Citizen activates alert → data written to Firebase `currentAlert` node
2. Control Room app listens on `currentAlert` → receives alert in real time
3. Operator updates status → Firebase `operatorStatus` field updated
4. Passenger app listens for status changes → UI updates in real time
5. Citizen marks safe → `passengerFeelsSafe` set to true → operator notified

---

## 6. App 1: Civic Passenger App

### 6.1 Screen Inventory

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Welcome / Login Decision | Entry point: Create Account or Log In. Shows returning user quick-login. |
| 1B | User Switcher | Shows linked profile with control room status. Sign in or change user. |
| 2 | Login | Email + password authentication. |
| 3 | Account Creation | Registration form with personal details. |
| 3B | ID Verification | Third-party identity verification (Passport / Driving Licence). |
| 3C | Terms & Conditions | Three-part scrollable agreement with progressive checkbox unlock. |
| 4A | Photo Upload | Selfie capture for operator identification. |
| 4B | Safety Zone Setup | Postcode entry to define monitored area. |
| 4C | Control Room Linked (Success) | Confirms linked control room with operating details. |
| 4D | Area Not Covered (Failure) | Postcode not served; offers to contact local authority. |
| 5 | Main Alert Interface | Primary screen with Blue and Red alert buttons. |
| 5B | CCTV Coverage Map | Camera locations in user's Safety Zone. |
| 6 | Alert Sent Confirmation | Confirms alert sent, shows SMS notification to emergency contact. |
| 7 | Live Status Tracking | Four-step timeline with real-time operator updates. |
| 7B | Additional Info Input | Optional textarea to send details to operator. |
| 9 | Active Monitoring | "We Are With You" — operator is watching on CCTV. |
| 10 | Incident Closure | Summary: time closed, duration, control room. |
| 11 | Welfare Check-In Offer | Option to schedule a follow-up welfare call. |
| 12 | Welfare Scheduling | Day + time picker for welfare call. |
| 13 | Booking Confirmation | Confirms welfare call booking. Returns to alert screen. |

### 6.2 User Flows

#### 6.2.1 New User Registration

```
Welcome → Create Account → Registration Form → ID Verification (2-3 min)
→ Terms & Conditions (3 sections, scroll-to-unlock) → Photo Upload (Selfie)
→ Safety Zone Setup (Postcode) → Control Room Linking → Main Alert Screen
```

**Registration Fields (Mandatory):**
- Full Legal Name
- Home Address
- Email
- Mobile Number
- Emergency Contact Name
- Emergency Contact Number

**ID Verification:**
- Handled by UK-regulated third-party service
- Accepted documents: Passport, Driving Licence
- Estimated time: 2-3 minutes
- E-SAF never stores the ID document

**Terms & Conditions (3 Agreements — all required):**

| Agreement | Title | Key Content |
|-----------|-------|-------------|
| 1 | General Terms of Use & Privacy | UK GDPR compliance, data retention (12 months alerts, account lifetime profile), data access rights (data@esaf.co.uk), required permissions (location, camera, local storage) |
| 2 | Limitations of Service & Emergency Protocol | NOT an emergency service, operators have NO legal obligation to act, CCTV coverage not guaranteed, response times not guaranteed, user responsible for own safety |
| 3 | Acceptable Use & Misuse Policy | Genuine safety concerns only, max 2 alerts per 24 hours, graduated sanctions for misuse |

**T&C Interaction Pattern:**
- Each section must be scrolled to the bottom before its checkbox unlocks
- All 3 checkboxes required to proceed
- "Continue" button disabled until all checked

#### 6.2.2 Returning User Quick-Login

```
Welcome → Pre-loaded Profile Displayed → "Sign In as This User" → Main Alert Screen
```

- Skips all onboarding steps
- Shows linked control room status
- "Change User" option available

#### 6.2.3 Alert Flow (Blue)

```
Main Screen → Hold Blue Button (3 sec) → Alert Sent Confirmation
→ SMS sent to emergency contact → Live Status Timeline
→ Operator accepts → Operator searches CCTV → Visual confirmation
→ "We Are With You" (Active Monitoring) → "I Feel Safe Now"
→ Confirmation Dialog → Incident Closure Summary
→ Welfare Check-In Offer → [Schedule or Decline] → Return to Main Screen
```

**Blue Alert Characteristics:**
- User's name and personal details are NOT shared with the control room
- Lower urgency classification
- UI remains in blue theme

#### 6.2.4 Alert Flow (Red)

```
Same flow as Blue, with these differences:
- User's name, age, and personal details ARE shared with operator
- UI switches to red theme across all screens
- Higher urgency classification for operator
```

#### 6.2.5 Welfare Check-In Flow

```
Incident Closure → "Would you like a welfare check-in call?"
→ Yes → Select Day (Today/Tomorrow/Mon-Fri) + Select Time (9AM-6PM)
→ Confirm Booking → Confirmation Screen → Return to Main
```

**Available Times:** 9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM

### 6.3 Core Feature: Hold-to-Activate Alert

**Mechanism:**
- User presses and holds alert button
- 3-second countdown with visual feedback: "Hold... 3", "Hold... 2", "Hold... 1"
- Button scales to 0.97x during hold
- Releasing before 3 seconds cancels (`cancelHold()` clears interval, resets scale)
- Completing the hold fires `activateAlert(type)` and advances to confirmation

**Rationale:** Prevents accidental alert activations. No confirmation dialog after activation (intentional — speed is critical in emergencies).

### 6.4 Core Feature: Live Status Timeline

Four-step real-time tracker showing operator progress:

| Step | Icon (Active) | Icon (Complete) | Description |
|------|--------------|-----------------|-------------|
| 1 | — | ✓ (green) | Alert received by control room |
| 2 | ⏳ (pulse) | ✓ (green) | Awaiting operator review |
| 3 | 🔍 (pulse) | ✓ (green) | Operator searching CCTV |
| 4 | 👁️ (pulse) | ✓ (green) | Visual confirmation |

- Active step has animated pulse effect (1.5s infinite, opacity 1→0.6)
- Each completed step logs a timestamp (HH:MM)
- Driven by Firebase `operatorStatus` field changes
- Step 4 completion auto-advances to "We Are With You" screen

### 6.5 Core Feature: Additional Info Messaging

- Available on Status Tracking (Screen 7B) and Active Monitoring (Screen 9)
- Textarea with prompt: "Any details to help the operator locate you faster"
- "Send to Operator" button syncs message to Firebase `additionalInfo` field
- Confirmation: "✓ Message sent to control room"
- Reusable — user can send multiple updates

### 6.6 Core Feature: CCTV Coverage Map

- Displays camera locations within user's Safety Zone
- Example data (Stevenage Town Centre, SG1): 23 cameras
- Camera locations listed with 📷 prefix (e.g., High St, Station Rd, Market Sq, Bus Interchange, Town Park Entry)
- Planning tip: "Where possible, plan your route to stay within camera coverage areas"

### 6.7 SMS Notification

Sent automatically to emergency contact on file when alert activated:

```
E-SAF Civic Alert

A safety alert has been activated.

📍 Location: [User's Safety Zone]
⏰ Time: [HH:MM]

This message is automated. Do not reply.
```

---

## 7. App 2: Civic Control Room Dashboard

### 7.1 Screen Inventory

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Idle / Dashboard | System stats, monitoring status, simulation buttons (demo mode). |
| 2 | New Alert Review | Incoming alert details. Accept or mark temporarily unavailable. |
| 3 | CCTV Search | Operator actively scanning camera feeds. |
| 4 | Active Monitoring | 30-minute timed session. Live info from user. Escalation available. |
| 4B | Grouped Alerts | Multiple users within 30m clustered into single incident. |
| 4C | Individual from Group | Drill-down into a single user within a group. |
| 5 | Job Closed / Feedback | Operator classifies alert and submits notes. |
| 6 | Return to Dock | Device handling instructions. Return to Idle. |
| — | Escalation Overlay | Modal with emergency service notification buttons. |

### 7.2 Operator Workflows

#### 7.2.1 Primary Single-Alert Flow

```
Idle (Screen 1) → New Alert Received (Screen 2) → Accept Alert
→ CCTV Search (Screen 3) → Incident Located
→ Active Monitoring (Screen 4) — 30 min timer
→ [Escalate if needed] → Monitoring Ended
→ Feedback / Classification (Screen 5) → Return to Dock (Screen 6) → Idle
```

#### 7.2.2 Grouped Alert Flow

```
Idle → Grouped Alert (Screen 4B) — shows all users in cluster
→ Click individual card → Individual Detail (Screen 4C) → Back to Group
→ Group Action (Escalate All / Extend All / Close Group)
→ Feedback (Screen 5) → Return to Dock (Screen 6) → Idle
```

#### 7.2.3 Escalation Flow (Modal, No Screen Change)

```
Monitoring (Screen 4) → Escalate Button → Overlay appears
→ Select: Police / Ambulance / Fire / Supervisor
→ Button changes to "✓ Notified" → Close overlay → Continue monitoring
```

### 7.3 Screen Details

#### 7.3.1 Idle Dashboard (Screen 1)

**Statistics Grid (4 columns):**
- Blue Alerts Today: raised / accepted counts
- Red Alerts Today: raised / accepted counts
- Linked Users: UK-wide total (e.g., 947)
- System Status: Online/Offline

**Status Indicators:**
- "System Online" — green dot
- "System Idle" — amber dot (blinks)
- "Monitoring Active" — green dot

**Simulation Buttons (Demo/Testing):**
1. Simulate Blue Alert
2. Simulate Red Alert
3. Simulate Grouped Alerts (generates 5 mixed alerts)

#### 7.3.2 New Alert Review (Screen 2)

**Alert Banner:**
- Red Alert: "●● NEW RED ALERT — IMMEDIATE DANGER" (red border, pulse animation)
- Blue Alert: "● NEW BLUE ALERT" (blue border)

**User Information Panel:**

| Field | Red Alert | Blue Alert |
|-------|-----------|------------|
| Name | Full name displayed | "ID: 001" (anonymous) |
| Age | Shown (e.g., "34") | "– (Blue alert)" |
| Alert Time | HH:MM (24hr) | HH:MM (24hr) |
| Risk Postcode | Shown | Shown |
| Location | Shown | Shown |
| What3Words | Shown | Shown |
| Control Room | Shown | Shown |

**CCTV Availability:** "📷 4 cameras in range" with live feed access

**SMS Confirmation:** "📱 SMS automatically sent to emergency contact on file"

**Action Buttons:**
- **Accept Alert** — Advances to CCTV Search, updates Firebase status
- **Temporarily Unavailable** — Pauses without accepting, updates Firebase

**Incident Log:** Begins with "Alert received" entry with timestamp

#### 7.3.3 CCTV Search (Screen 3)

**Status:** "Operator has accepted — scanning cameras"

**Action Buttons:**
- **Incident Located** — Advances to Active Monitoring, updates Firebase to `visual_confirmed`
- **Still Searching** — Adds log entry, stays on same screen

**Incident Log:** Appends "Alert accepted by operator" with timestamp

#### 7.3.4 Active Monitoring (Screen 4)

**Timer:**
- Starts at 30:00 (1800 seconds)
- Counts down in real time (MM:SS format)
- Display: "⏱ MM:SS"
- No auto-timeout — monitoring continues until operator presses End

**Live Additional Info:** Displays messages sent by user in real time via Firebase `additionalInfo` field. Placeholder: "Awaiting information..." or "No additional information provided"

**Action Buttons:**
- **Escalate** — Opens escalation overlay modal
- **Extend 30min** — Adds 1800 seconds to timer
- **Monitoring Ended** — Clears timer, clears Firebase alert data, routes to feedback

**Incident Log:** Continues appending operator actions with timestamps

#### 7.3.5 Grouped Alerts (Screen 4B)

**Trigger:** Multiple alerts from the same geographic location (within 30 metres)

**Header:** "3 Users — Same Location (within 30m)"
**Location:** "Stevenage Town Centre — ///filled.count.soap"

**User Cards (Clickable):**
Each card displays:
- Circular photo (90px diameter)
- Name or ID with colour-coded badge
- Alert type badge (BLUE / RED)
- Timestamp
- Risk area
- What3Words
- Location

**Hover:** Cards scale to 1.03x
**Click:** Opens individual detail view (Screen 4C)

**Group Actions (applied to ALL members simultaneously):**
- Escalate All
- Extend All 30min
- Close Group

**Group Incident Log:** Combined log for all grouped users

#### 7.3.6 Individual from Group (Screen 4C)

- Back navigation to group view
- Shows individual user data isolated from group
- Note: "All button actions are distributed to the entire group"

#### 7.3.7 Feedback / Job Closed (Screen 5)

**Header:** "Monitoring Ended"

**Alert Classification (required, radio group):**
- ✅ Genuine alert — Real concern
- ⚠️ False alert — No concern identified
- 🚨 Malicious / Deliberate misuse
- ❓ Unclear — Unable to determine

**Additional Notes:** Optional textarea (min-height: 120px)

**Validation:** Alert shown if classification not selected before submission

**Data Submitted:** Classification + notes + full incident log array with timestamps

#### 7.3.8 Return to Dock (Screen 6)

- Post-incident closure messaging
- Physical device (tablet) handling instructions
- Navigation back to Idle (Screen 1)

### 7.4 Escalation Overlay (Modal)

Triggered from monitoring screens. Does not change screen — overlays current view.

**Four Escalation Options:**

| Service | Icon | Description | Behaviour on Press |
|---------|------|-------------|-------------------|
| Police | 🚔 | Report to local police via radio/phone | Border/bg shifts, checkmark, "Notified" |
| Ambulance | 🚑 | Medical emergency — call 999 | Same |
| Fire Brigade | 🚒 | Fire or hazard reported | Same |
| Supervisor | 👤 | Alert supervisor to situation | Same |

- Each button toggles to a "Notified" state to prevent duplicate presses
- Overlay max-width: 500px
- Close overlay returns to monitoring screen

### 7.5 Passenger Safety Notification

When the citizen presses "I Feel Safe Now" in the Passenger App:
- Firebase `passengerFeelsSafe` is set to `true`
- Control Room receives real-time update
- Incident log appends: "User confirmed safe"
- Operator can then end monitoring and proceed to feedback

---

## 8. Data Model & Firebase Integration

### 8.1 Firebase `currentAlert` Node

```javascript
currentAlert: {
  alertType: "blue" | "red",
  name: "Sarah Wilson",         // Red alerts only; omitted for blue
  age: "34",                    // Red alerts only
  emergencyContact: "James Wilson",
  emergencyPhone: "07700 900456",
  riskPostcode: "SG1 1AA",
  controlRoom: "Herts CCTV Partnership",
  location: "Stevenage Town Centre",
  what3words: "filled.count.soap",
  timeSent: "21:47",
  additionalInfo: "",           // Updated by user in real time
  status: "awaiting_review",    // Set by passenger app on creation
  operatorStatus: "",           // Set by control room app
  passengerFeelsSafe: false,    // Set by passenger app
  timestamp: 1234567890         // Unix timestamp
}
```

### 8.2 Status Field Values

**`status` (set by Passenger App):**
- `awaiting_review` — Alert just sent

**`operatorStatus` (set by Control Room App):**
- `operator_searching` — Operator accepted, scanning CCTV
- `temporarily_unavailable` — Operator paused
- `visual_confirmed` — Operator has visual on user

### 8.3 Real-Time Listeners

**Passenger App listens for:**
- Changes to `operatorStatus` → updates timeline UI via `updateWorkflowFromOperator()`
- `operator_searching` → advances to Step 3
- `visual_confirmed` → advances to Step 4, then auto-navigates to "We Are With You"

**Control Room App listens for:**
- Changes to `passengerFeelsSafe` → logs "User confirmed safe"
- Changes to `additionalInfo` → displays live in monitoring screen

### 8.4 User Data Model (Client-Side)

```javascript
userData = {
  name: "Sarah Wilson",
  age: "34",
  emergencyContact: "James Wilson",
  emergencyPhone: "07700 900456",
  riskPostcode: "SG1 1AA",
  controlRoom: "Herts CCTV Partnership",
  location: "Stevenage Town Centre",
  what3words: "filled.count.soap"
}
```

### 8.5 Client-Side State

```javascript
{
  currentScreen: Number,      // Active screen index
  alertType: "blue" | "red",  // Current alert type
  workflowStep: 1-4,          // Timeline progress
  holdTimer: Interval,        // 3-second hold countdown
  alertStartTime: Timestamp   // For duration calculation
}
```

---

## 9. Security, Privacy & Compliance

### 9.1 Regulatory Framework
- **UK GDPR** — Full compliance declared
- **Data Protection Act 2018** — Adherence stated
- **Governing Law:** England and Wales
- **IP Owner:** E-SAF Systems Ltd

### 9.2 Data Retention
| Data Type | Retention Period |
|-----------|-----------------|
| Alert data | 12 months (audit purposes) |
| Profile data | Duration of account |
| ID documents | Never stored by E-SAF |

### 9.3 Data Sharing
- Personal data shared with emergency services ONLY when legally required or life-threatening
- Blue alerts: user identity NOT shared with control room operators
- Red alerts: user name, age, and details ARE shared

### 9.4 User Data Rights
- Right to access, rectification, and erasure
- Contact: data@esaf.co.uk

### 9.5 Required Device Permissions
All mandatory and cannot be disabled:
- Location services (GPS)
- Camera access (selfie for profile)
- Local storage
- Mobile network connectivity

### 9.6 ID Verification
- Third-party UK-regulated service
- Accepted: Passport, Driving Licence
- E-SAF never stores the document
- Estimated duration: 2-3 minutes

---

## 10. Misuse Policy & Sanctions

### 10.1 Permitted Use
- Genuine belief of being unsafe in a public space
- Maximum 2 alerts per 24-hour period

### 10.2 Graduated Sanctions

| Offence | Sanction |
|---------|----------|
| 1st | Educational welfare call |
| 2nd | Final warning call |
| 3rd | Restricted to 1 alert per week for 6 months |
| 4th | 3-month platform ban |
| 5th | Permanent ban (UK-wide, non-appealable during restriction) |

### 10.3 Appeals
- Contact: compliance@esaf.co.uk
- Permanent bans are non-appealable during the restriction period

### 10.4 Operator Classification
Post-incident, operators classify each alert:
- ✅ Genuine alert — Real concern
- ⚠️ False alert — No concern identified
- 🚨 Malicious / Deliberate misuse
- ❓ Unclear — Unable to determine

This classification feeds into the sanctions framework.

---

## 11. Non-Functional Requirements

### 11.1 Performance
- Real-time bidirectional sync via Firebase (sub-second latency expected)
- Alert activation in 3 seconds (hold mechanism)
- Timer accuracy: 1-second intervals on monitoring screen

### 11.2 Availability
- 24/7 operation (control rooms are staffed around the clock)
- System status indicator on control room dashboard

### 11.3 Scalability
- Postcode-based routing enables adding new control rooms without code changes
- UK-wide user linking (current: 947 linked users)

### 11.4 Platforms
- **Passenger App:** Mobile-first web app (responsive, touch-optimized)
- **Control Room App:** Tablet/desktop web app (dark theme, optimized for control room environments)

### 11.5 Browser/Device Requirements
- Modern browsers with Firebase SDK support
- GPS-capable device (passenger app)
- Camera-capable device (passenger app — selfie capture)
- Stable internet connection (both apps)

### 11.6 Accessibility
- System font stack: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- High contrast text on all backgrounds
- Large tap targets (18px+ padding on buttons, 30px on alert buttons)
- Momentum scrolling on iOS (-webkit-overflow-scrolling: touch)
- Disabled tap highlight for cleaner mobile interaction

---

## 12. Design System

### 12.1 Passenger App — Light Theme

**Colour Palette:**

| Token | Blue Mode | Red Mode |
|-------|-----------|----------|
| accent | #1d4ed8 | #dc2626 |
| accent-light | #dbeafe | #fee2e2 |
| accent-border | #3b82f6 | #ef4444 |
| accent-dark | #1e3a8a | #7f1d1d |
| primary-gradient | 135deg #1d4ed8 → #3b82f6 | 135deg #dc2626 → #ef4444 |

**Theme Switching:** Red theme CSS class applied to all `.screen` elements when red alert sent. Removed on return to home.

### 12.2 Control Room App — Dark Theme

| Token | Value |
|-------|-------|
| background | #0a0f1e |
| card-bg | #1e293b |
| text-primary | #e2e8f0 |
| text-secondary | #94a3b8 |
| blue-accent | #3b82f6 |
| red-danger | #ef4444 |
| green-success | #22c55e |
| amber-warning | #f59e0b |
| border | #334155 |

### 12.3 Typography

**Passenger App:**
| Element | Size | Weight | Colour |
|---------|------|--------|--------|
| H1 | 24px | 800 | #0f172a |
| H2 | 20px | 700 | — |
| Body | 14px | 400 | #475569 |
| Small | 11px | 400 | #94a3b8 |
| Labels | 13px | 600 | #374151 |

**Control Room App:**
| Element | Size | Weight | Colour |
|---------|------|--------|--------|
| H1 | 22px | 800 | #e2e8f0 |
| H2 | 18px | 700 | #e2e8f0 |
| Body | 13px | 400 | #94a3b8 |
| Labels | 10-11px | 600 | Uppercase, reduced opacity |

### 12.4 Component Library

**Buttons:**

| Type | Padding | Radius | Style |
|------|---------|--------|-------|
| Primary | 18px | 14px | Gradient bg, white text, box-shadow |
| Secondary | 18px | 14px | Light grey bg (#f1f5f9), 2px border |
| Outline | 18px | 14px | Transparent bg, themed 2px border |
| Alert (Blue) | 30px 20px | 20px | #1d4ed8→#3b82f6 gradient, 3px border #60a5fa |
| Alert (Red) | 30px 20px | 20px | #991b1b→#dc2626 gradient, 3px border #f87171 |

**Alert Button Specs:**
- Font size: 20px, weight: 800
- User-select: none
- Active state: scale 0.97

**Cards:**
- Background: accent-light
- Border: 2px solid accent-border
- Radius: 16px
- Padding: 20px
- Margin: 15px 0

**Info Boxes:**

| Type | Background | Border |
|------|-----------|--------|
| Standard | #fef3c7 (yellow) | 2px #f59e0b |
| Emergency Warning | Gradient #fef2f2→#fee2e2 | 2px #ef4444 |
| Additional Info (Blue) | Gradient #eff6ff→#dbeafe | 2px #3b82f6 |
| Additional Info (Red) | Red variant | 2px red |
| Safe Close | #f0fdf4 (green) | 2px #22c55e |

**SMS Card:**
- White background, 2px border #e2e8f0
- Header: dark (#0f172a), white text, 12px 15px padding
- Body: 15px padding, 13px font

**Timeline:**
- Flex layout, 15px gap
- Icons: 36x36px circle
- States: complete (green bg), active (accent bg + pulse), pending (grey bg)

**Profile Card:**
- Photo: 100x100px circle, 3px blue border
- Name: 22px, weight 800
- Background: gradient #f8fafc → #f1f5f9

**Form Elements:**
- Full width, 14px padding, 2px border #e2e8f0, 10px radius
- Focus: border changes to accent colour
- Textarea min-height: 70px

### 12.5 Animations

| Animation | Duration | Details |
|-----------|----------|---------|
| Screen fade-in | 0.3s ease | Opacity 0→1 |
| Button transitions | 0.1-0.2s | Scale, colour |
| Timeline pulse | 1.5s infinite | Opacity 1→0.6 (active step) |
| Status dot blink | 2s cycle | Control room idle indicator |
| Red alert border pulse | 2s cycle | #ef4444 → #fca5a5 |
| Group card hover | — | Scale 1.03x |
| Button press | — | Scale 0.98x |

### 12.6 Layout

**Passenger App:**
- Screen padding: 20px (20px 20px 100px for fixed nav clearance)
- Hero: gradient #0f172a → #1d4ed8 → #1e40af, radius 0 0 30px 30px, padding 50px 20px 40px
- 100vw/100vh viewport, overflow hidden on body, scroll on screens
- Progress bar: 4px height, #e2e8f0 bg, accent gradient fill

**Control Room App:**
- 4-column stats grid (collapses to 1 on narrow screens)
- 2-column action button grid (3-column for escalation)
- Card-based information hierarchy
- Overlay max-width: 500px

---

## 13. Edge Cases & Error Handling

### 13.1 Passenger App

| Scenario | Handling |
|----------|----------|
| Alert button released before 3 seconds | `cancelHold()` — no alert sent, button resets |
| Postcode not in SG range | "Area Not Yet Covered" screen with options to request coverage or retry |
| No postcode entered | Validation: "Please enter a postcode" |
| Welfare booking without day/time selected | Validation: "Please select a day and time" |
| User closes app during active alert | Banner: "You can safely close this app. We'll continue working in the background." |
| Multiple alerts in 24 hours | Max 2 per 24-hour period (enforced) |
| Photo capture fails | Fallback emoji display (🤳✨), screen advances regardless |
| "I Feel Safe Now" pressed accidentally | Confirmation dialog: "Are you sure you feel completely safe now?" |
| Return to home during active alert | Resets workflow, clears Firebase data, resets theme |

### 13.2 Control Room App

| Scenario | Handling |
|----------|----------|
| Operator temporarily unavailable | Button updates Firebase status without accepting alert |
| Still searching CCTV | Log entry added, stays on search screen |
| No additional info from user | Placeholder: "Awaiting information..." or "No additional information provided" |
| Timer reaches 0:00 | No auto-timeout — monitoring continues until operator presses End |
| Feedback submitted without classification | Alert: classification required |
| Firebase alert cleared | Prevents log pollution on subsequent reads |
| Multiple users at same location | Auto-grouped within 30m radius into single incident (Screen 4B) |
| Duplicate escalation press | Button toggles to "Notified" state, prevents repeat |
| Group action | Applied to ALL members simultaneously |

---

## 14. Future Considerations

Based on the architecture and current implementation, the following are implied expansion paths:

1. **National Rollout** — Postcode-based routing already supports adding new control rooms. The "Area Not Yet Covered" flow includes outreach to local authorities.
2. **Native Mobile Apps** — Currently web-based; native apps would enable background location tracking, push notifications, and richer device integration.
3. **Multi-Control Room Support** — A user may traverse multiple control room jurisdictions; handoff protocols would be needed.
4. **Historical Incident Dashboard** — Alert data retained for 12 months; a reporting/analytics layer is a natural extension.
5. **Operator Authentication & Roles** — Current implementation appears single-operator; multi-operator with role-based access would be needed at scale.
6. **What3Words Integration** — Currently displayed as text; deep integration with What3Words API for precise location handoff.
7. **CCTV Feed Embedding** — Currently references external feeds; embedding live video in the dashboard would reduce operator context-switching.
8. **Welfare Call Management** — Booking system exists in the passenger app; a corresponding management interface for welfare officers is implied but not built.
9. **Analytics & Reporting** — Operator classifications and incident logs are captured; a reporting layer for management and audit is a logical next step.
10. **Multi-Language Support** — Currently English only; expansion across the UK may require Welsh language support at minimum.

---

## Appendix A: Key Functions (Passenger App)

| Function | Purpose |
|----------|---------|
| `goToScreen(num)` | Navigate between screens |
| `startHold()` | Begin 3-second alert countdown |
| `cancelHold()` | Cancel alert if released early |
| `activateAlert(type)` | Process alert, sync to Firebase |
| `progressWorkflow()` | Advance timeline steps |
| `updateWorkflowFromOperator()` | Handle Firebase operator status changes |
| `sendAdditionalInfo()` | Send user message to operator via Firebase |
| `feelSafeNow()` | Trigger incident closure with confirmation |
| `checkPostcode()` | Validate postcode, route to control room |
| `selectDay()` / `selectTime()` | Welfare scheduling selection |
| `bookWelfare()` | Confirm welfare check-in booking |
| `finishAndReturn()` | Reset app state after incident |
| `quickLogin()` | Returning user fast path to alert screen |
| `updateTCButton()` | T&C validation state management |
| `checkScroll()` | Enforce T&C scroll-to-bottom requirement |

## Appendix B: Key Functions (Control Room App)

| Function | Purpose |
|----------|---------|
| Screen navigation | 6 primary screens + modal overlay |
| Alert acceptance | Updates Firebase `operatorStatus` |
| CCTV search actions | "Incident Located" / "Still Searching" |
| Timer management | 30-min countdown, extend, clear |
| Escalation | Modal with 4 emergency service options |
| Feedback submission | Classification + notes + incident log export |
| Simulation buttons | 3 demo modes for testing (blue, red, grouped) |
| Group management | Cluster alerts within 30m, group actions |

## Appendix C: Contact Points

| Purpose | Contact |
|---------|---------|
| Data access/rectification/erasure | data@esaf.co.uk |
| Misuse appeals | compliance@esaf.co.uk |
| IP Owner | E-SAF Systems Ltd |
