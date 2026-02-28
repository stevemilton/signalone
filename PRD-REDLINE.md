# E-SAF Civic — PRD Redline Review

**Reviewer:** Claude (AI-assisted review)
**Date:** 2026-02-18
**Context:** Ash has built a working concept/prototype. This redline identifies everything that must be addressed, added, or rethought before this becomes a shippable, production-grade product. The prototype is a strong demonstration of the idea — but a safety-critical platform serving vulnerable people requires a fundamentally different level of rigour.

**Severity Key:**
- **[BLOCKER]** — Cannot ship without this. Safety, legal, or architectural showstopper.
- **[CRITICAL]** — Must be resolved before any real-world deployment.
- **[REQUIRED]** — Needed for a production-quality product.
- **[RECOMMENDED]** — Strongly advised but could be phased.

---

## 1. FATAL ARCHITECTURAL FLAW: Single Alert Concurrency

**[BLOCKER]**

The entire system uses a single Firebase node (`currentAlert`) for all alerts. This means **only one alert can exist at a time across the entire platform**. If User A sends an alert and User B sends one 30 seconds later, User A's alert is overwritten.

This is the single biggest issue in the prototype. The production system needs:

- **An alerts collection** — Each alert gets a unique ID (`alerts/{alertId}`)
- **Alert queue/routing** — Incoming alerts are queued and assigned to available operators
- **Concurrent alert handling** — Multiple alerts can be active simultaneously
- **Operator assignment** — Each alert is assigned to a specific operator, not broadcast to a shared node

**Proposed data structure:**
```
alerts/
  {alertId}/
    alertType: "blue" | "red"
    userId: "{userId}"
    operatorId: "{operatorId}" | null
    status: "pending" | "accepted" | "searching" | "monitoring" | "closed"
    ...
users/
  {userId}/
    profile: { ... }
    activeAlert: "{alertId}" | null
controlRooms/
  {controlRoomId}/
    operators: { ... }
    coverage: { postcodes: [...] }
```

Without this, the product cannot serve more than one user at a time. Everything else in this redline is secondary to fixing this.

---

## 2. NO BACKEND / API LAYER

**[BLOCKER]**

The prototype has both apps writing directly to Firebase from the client. This means:

- **No server-side validation** — Any user with the Firebase URL can write arbitrary data
- **No Firebase Security Rules documented** — The database may be completely open
- **No business logic enforcement** — Alert limits (2/day), sanctions, postcode routing all rely on client-side code that can be bypassed
- **No secrets management** — Firebase config is exposed in client-side JavaScript

**What's needed:**
- A backend API layer (e.g., Firebase Cloud Functions, or a separate Node/Python service)
- Server-side alert creation with validation
- Server-side enforcement of rate limits, sanctions, and permissions
- Firebase Security Rules that restrict direct client writes
- Authentication tokens for all API calls

---

## 3. AUTHENTICATION — Currently Non-Existent

**[BLOCKER]**

### 3.1 Passenger App
The prototype has a hardcoded user ("Sarah Wilson") with a `quickLogin()` function. There is no real authentication. The production system needs:

- **Proper auth provider** — Firebase Auth, Auth0, or equivalent
- **Email/password login** with hashing and salting (never store plaintext)
- **Password reset flow** — Forgotten password, email-based reset
- **Session management** — Token expiry, refresh tokens, secure storage
- **Multi-device handling** — Can a user be logged in on two phones? What happens to an active alert?
- **Account lockout** — Brute force protection after N failed attempts
- **Email verification** — Confirm email ownership before account activation
- **Phone number verification** — SMS OTP to confirm the mobile number is real (critical — this number receives emergency contact alerts)

### 3.2 Control Room App
The prototype has **zero operator authentication**. Anyone with the URL can access the control room dashboard. This needs:

- **Operator login** — Username/password with role-based access
- **Operator identity tracking** — Every action must be attributed to a named operator
- **Session timeout** — Auto-logout after inactivity (control room security)
- **IP restriction** — Optionally lock to control room network
- **Audit trail per operator** — Who accepted what, when, and what actions they took

### 3.3 Admin Authentication
There is no admin layer at all. The production system needs:

- **System admin role** — Manage control rooms, operators, system config
- **Control room manager role** — Manage their operators, view reports for their room
- **Separation of privileges** — Operators cannot access admin functions

---

## 4. LOCATION SERVICES — Referenced But Not Implemented

**[BLOCKER]**

The prototype mentions GPS in the T&Cs and shows a static What3Words address, but there is no actual location implementation.

### What's missing:
- **Real-time GPS capture on alert** — When the user presses the alert button, their live GPS coordinates must be captured and sent
- **Continuous location updates during active alert** — The user is moving. The operator needs to track them, not see where they were 5 minutes ago
- **Location → Camera mapping** — How does the system know which cameras are "in range"? Currently hardcoded to "4 cameras." This needs a real geospatial database mapping camera positions to GPS coordinates
- **What3Words API integration** — Currently a static string. Needs live resolution from GPS coordinates
- **Location accuracy handling** — GPS can be inaccurate indoors, in urban canyons, etc. What does the operator see when accuracy is low?
- **Location permission denial** — What happens if the user denies GPS permission? The app cannot function — this needs a clear blocking flow
- **Background location tracking** — The app says "you can safely close this app" — but a web app cannot track location in the background without a service worker or native wrapper. This claim may be false.

### The "background" problem:
The prototype tells users they can close the app during an active alert. A web app on mobile will be suspended or killed by the OS. This means:
- No continued location updates
- No Firebase listener running
- No way to receive status updates

This either needs a **native app wrapper** (React Native, Capacitor, etc.) or this claim must be removed and the user must be told to keep the app open.

---

## 5. SMS / NOTIFICATION SYSTEM — Not Actually Built

**[CRITICAL]**

The prototype shows an SMS card UI but does not send actual SMS messages. The production system needs:

### 5.1 SMS Gateway
- **Provider selection** — Twilio, MessageBird, Vonage, or UK-specific provider (e.g., Firetext)
- **Emergency contact SMS delivery** — With delivery receipts and retry logic
- **SMS content compliance** — UK regulations on automated messaging
- **International number handling** — Emergency contacts may have non-UK numbers
- **Cost modelling** — SMS costs per alert, projected at scale
- **Fallback** — What if SMS fails to deliver? Retry? Alternative channel?

### 5.2 Control Room Audio Alerts
**This is a critical gap for 24/7 operations.** The control room app has no sound. A new alert arriving at 3AM when the operator is monitoring other screens needs:
- **Audible alert tones** — Distinct sounds for Blue vs Red alerts
- **Escalating audio** — Gets louder/more urgent if not acknowledged within N seconds
- **Desktop notifications** — Browser notification API for when the tab isn't focused
- **Volume control** — Operators must be able to adjust without muting entirely

### 5.3 Push Notifications (Passenger App)
- The user needs to know when their alert status changes, even if the app is backgrounded
- Requires service worker + Web Push API, or native app with APNs/FCM
- Critical for "We Are With You" → escalation status changes

---

## 6. CCTV INTEGRATION — The Core Value Proposition Is Unbuilt

**[CRITICAL]**

The entire product premise is connecting users to CCTV operators. But the prototype has no actual CCTV integration.

### What's needed:
- **Camera database** — Every camera managed by each control room, with GPS coordinates, field of view, type (fixed/PTZ), and status (online/offline)
- **Location-to-camera mapping** — Given a user's GPS position, which cameras can see them? This requires geospatial queries (e.g., PostGIS, or a geospatial index in Firestore)
- **Camera feed integration** — How do operators actually view camera feeds? Options:
  - Embed feeds directly in the dashboard (requires RTSP/HLS integration with existing VMS)
  - Link out to the existing Video Management System (VMS) with camera ID pre-selected
  - Hybrid: thumbnail/preview in dashboard, full view in VMS
- **VMS compatibility** — UK control rooms typically use Milestone, Genetec, or similar. Integration needs to work with their existing systems
- **Camera status** — Real-time online/offline status so operators know if coverage is available
- **Coverage map data** — The "CCTV Coverage Map" in the passenger app currently shows hardcoded text. Needs to be driven by the camera database

### Key question for Ash:
Does E-SAF intend to embed camera feeds, or act as an alert/routing layer on top of existing VMS systems? This architectural decision affects everything.

---

## 7. OPERATOR MANAGEMENT — Single-Operator Assumption

**[CRITICAL]**

The prototype assumes one operator, one alert, one control room. Real control rooms have:

### 7.1 Multi-Operator Support
- Multiple operators on shift simultaneously
- Alert routing/assignment to specific operators
- Workload balancing — don't send all alerts to one person
- Operator availability status (available, busy, on break, end of shift)

### 7.2 Shift Management
- Shift handover — what happens to active alerts when an operator's shift ends?
- Shift scheduling integration (or at minimum, shift start/end logging)
- Operator sign-in/sign-out per shift

### 7.3 Supervisor Functions
- Real-time view of all active alerts and which operator handles each
- Ability to reassign alerts
- Override capabilities
- Quality monitoring (listen in on operator actions)

### 7.4 Operator Training
- The PRD has no mention of how operators learn the system
- Training mode / sandbox environment needed (separate from production)
- Standard Operating Procedures (SOPs) for each alert type
- The simulation buttons are a good start but need to be a proper training module, not in the production UI

---

## 8. EMERGENCY SERVICES ESCALATION — UI Only, No Integration

**[CRITICAL]**

The escalation overlay has buttons for Police, Ambulance, Fire, and Supervisor. Pressing them changes the button to "Notified." But **nothing actually happens**.

### What's needed:
- **Define what "escalation" actually means operationally:**
  - Does the operator pick up a radio and call it in manually? (Most likely for v1)
  - Does the system send an automated notification to a dispatch system?
  - Does it generate a CAD (Computer Aided Dispatch) entry?
- **If manual (radio/phone):** The button should trigger a checklist/script for the operator — what to say, what information to relay, incident reference number
- **Escalation data package:** When escalating to police, the operator needs to relay: location, description of person (photo if red alert), nature of concern, What3Words, number of people involved
- **Escalation logging:** The system must record exactly when escalation happened and to which service — this is critical for audit and post-incident review
- **Police partnership:** Is there a formal data-sharing agreement with the local police force? This is required under the Surveillance Camera Code of Practice

---

## 9. OFFLINE / DEGRADED CONNECTIVITY

**[CRITICAL]**

This is a safety app used by people who may be in areas with poor signal. The prototype has no offline handling.

### Scenarios to handle:
| Scenario | Current Behaviour | Required Behaviour |
|----------|------------------|-------------------|
| User loses signal during alert activation | Alert may fail silently | Queue alert locally, retry when connected. Show clear "No Connection" status. |
| User loses signal during active monitoring | Firebase listener disconnects silently | Show "Connection Lost" warning. Auto-reconnect. Operator sees "User connection lost." |
| Operator loses connection | Firebase listener disconnects | Visual warning. Alert stays assigned. Auto-reconnect. |
| Firebase outage | Total system failure | Fallback notification (e.g., direct SMS to control room phone?). Status page. |
| User in area with GPS but no data | Cannot send alert | Potentially queue alert with last-known GPS. Inform user. |

### Connection status indicators:
- Passenger app needs a visible connection indicator
- Control room app needs a visible connection indicator per user
- Firebase `.info/connected` listener should drive these

---

## 10. SAFEGUARDING & DUTY OF CARE

**[BLOCKER]**

This product serves vulnerable people in potentially dangerous situations. The PRD has no safeguarding framework.

### 10.1 Minimum Age Policy
- What is the minimum age to use E-SAF?
- If under 18, is parental consent required?
- Children walking home from school are a core use case — this must be addressed
- Age verification via ID check would enforce this, but the policy must be explicit

### 10.2 Vulnerable Users
- People with disabilities (mobility, visual, hearing, cognitive)
- People experiencing domestic violence (could an abuser monitor their alerts?)
- People in mental health crisis (what if someone uses the red alert during a panic attack, not a physical threat?)
- Repeat users who alert frequently but genuinely feel unsafe — how does the misuse policy distinguish them from false alerters?

### 10.3 Operator Safeguarding
- Operators may witness distressing events on CCTV
- Welfare support for operators (EAP, debriefing)
- What happens if an operator witnesses a crime in progress via the system?
- DBS (Disclosure and Barring Service) checks for all operators accessing user data

### 10.4 "We Are With You" — Duty of Care Implications
The app tells users "The operator has confirmed your location and is monitoring you on CCTV" and "the operator can see you and is ready to alert emergency services if needed."

**This creates an implied duty of care.** If the operator misses something, or CCTV coverage drops, or the camera is obstructed, and the user is harmed — the T&Cs say "no obligation to act" but the UI says "we are with you."

This tension needs legal review. The messaging must be carefully calibrated to provide reassurance without creating liability that contradicts the T&Cs.

### 10.5 Safeguarding Policy Document
The product needs a formal Safeguarding Policy covering:
- How concerns about vulnerable users are escalated
- Mandatory reporting obligations
- Operator training on recognising safeguarding concerns
- Data sharing with social services if needed
- A Designated Safeguarding Lead within E-SAF

---

## 11. LEGAL & REGULATORY — Significantly Underspecified

**[BLOCKER]**

### 11.1 Surveillance Camera Code of Practice
The UK has a Surveillance Camera Commissioner and a Code of Practice. Any system that interfaces with public CCTV must comply. The PRD does not reference this. Key requirements:
- Legitimate aim for surveillance
- Proportionality
- Data protection impact assessments
- Transparency (public awareness)
- Governance framework

### 11.2 Data Protection Impact Assessment (DPIA)
Under UK GDPR, a DPIA is **mandatory** for:
- Large-scale processing of personal data
- Systematic monitoring of public areas
- Processing data of vulnerable individuals

E-SAF ticks all three. A DPIA must be completed and documented before launch.

### 11.3 ICO Registration
E-SAF Systems Ltd must be registered with the Information Commissioner's Office as a data controller. Not mentioned in the PRD.

### 11.4 Data Processing Agreements
E-SAF needs formal DPAs with:
- Firebase / Google (data processor)
- The ID verification provider (data processor)
- The SMS gateway provider (data processor)
- Each CCTV control room partnership (likely joint controllers or controller-processor)

### 11.5 GDPR Data Rights — Implementation
The T&Cs mention data access, rectification, and erasure rights but there's no implementation:
- **Data export** — How does a user request and receive their data? (30-day legal deadline)
- **Account deletion** — Full workflow needed: confirm identity, delete profile, anonymise alert history, confirm deletion
- **Data portability** — Machine-readable format export
- **Right to object** — User can object to processing; what does that mean for an active alert?

### 11.6 Liability & Insurance
- **Professional indemnity insurance** — Essential for a safety service
- **Public liability insurance** — If the system fails and someone is harmed
- **Cyber insurance** — Data breach coverage
- The "no obligation to act" clause in the T&Cs needs legal stress-testing. Courts may find this unreasonable in a consumer contract, especially for a safety product marketed to vulnerable people.

### 11.7 What3Words Licensing
What3Words is a commercial product. Using it in a commercial application requires a licensing agreement. The PRD should confirm this is in place or identify an alternative (e.g., Google Plus Codes, raw GPS coordinates).

### 11.8 Local Authority Agreements
Each CCTV control room is typically operated by or on behalf of a local authority. There need to be:
- Formal partnership agreements with each authority
- Data sharing agreements
- Liability allocation
- Service level expectations

---

## 12. ACCOUNT & PROFILE MANAGEMENT — Almost Entirely Missing

**[REQUIRED]**

The prototype has registration but no ongoing account management.

### Missing screens/flows:
- **Profile editing** — Change name, address, phone, emergency contact, photo
- **Password change**
- **Emergency contact management** — Add/remove/update multiple emergency contacts
- **Safety zone management** — Change postcode, add multiple safety zones
- **Control room switching** — User moves to a new area
- **Account deletion** — Per GDPR
- **Notification preferences** — SMS opt-in/out, email preferences
- **Alert history** — User should be able to view their past alerts and outcomes
- **Active sanctions view** — If restricted, the user should see their current sanction status

---

## 13. INCIDENT MANAGEMENT — No Persistence

**[REQUIRED]**

The prototype logs incidents in memory and clears them when the app returns to idle. A production system needs:

### 13.1 Incident Database
- Every alert stored permanently (within retention policy)
- Unique incident reference number
- Full audit trail: every status change, every operator action, every timestamp
- Incident search and retrieval by: date, user, operator, classification, location, reference number

### 13.2 Incident Reports
- Exportable incident reports for: management review, police requests, GDPR subject access requests, complaints
- PDF/CSV export

### 13.3 Incident Review Workflow
- Supervisor can review operator feedback/classification
- Quality assurance process for flagged incidents
- Misuse sanctions are applied based on incident classification — this needs a formal review/approval workflow, not just automatic application

---

## 14. CONTROL ROOM ADMIN PANEL — Does Not Exist

**[REQUIRED]**

There is no admin interface for managing the system. Needed:

### 14.1 System Administration
- Onboard new control rooms (name, coverage area, operating hours, contact details)
- Manage camera database (add/edit/remove cameras with GPS coordinates)
- Manage operators (create accounts, assign to control rooms, set roles)
- System configuration (alert limits, timer defaults, sanction thresholds)
- System health monitoring

### 14.2 Control Room Manager Dashboard
- Alert volume and trends for their control room
- Operator performance metrics (response times, classifications)
- Active alerts overview
- Shift management
- Operator training status

### 14.3 User Management
- Search users
- View user profiles and alert history
- Apply/remove sanctions
- Handle data access/deletion requests
- Handle complaints

---

## 15. REPORTING & ANALYTICS

**[REQUIRED]**

No reporting exists in the prototype. A production system serving local authorities needs:

### Key metrics to track:
- Alert volume by type, time of day, day of week, location
- Response times (alert to acceptance, acceptance to visual, total incident duration)
- Classification breakdown (genuine vs false vs malicious vs unclear)
- Operator utilisation and workload
- User growth and retention
- Sanction application rates
- Escalation rates and outcomes
- Camera coverage effectiveness (alerts in covered vs uncovered areas)
- Welfare check-in uptake and outcomes

### Reports needed:
- Daily/weekly/monthly summary for control room managers
- Quarterly report for local authority partners
- Annual statistics for national reporting
- Ad-hoc reports for police/audit requests

---

## 16. ACCESSIBILITY — Far Below Standard

**[REQUIRED]**

The prototype has basic responsive design but is not accessible. For a safety product serving vulnerable people, this is unacceptable.

### WCAG 2.1 AA Compliance (minimum):
- **Screen reader support** — All interactive elements need proper ARIA labels. The alert buttons, timeline, status updates must be announced.
- **Keyboard navigation** — Every function accessible without touch/mouse. Critical for the control room app.
- **Focus management** — Screen transitions must move focus correctly. A screen reader user activating an alert needs to hear the confirmation, not be lost on the page.
- **Colour contrast** — Must be verified against WCAG ratios. The blue/red themes need checking.
- **Reduced motion** — Respect `prefers-reduced-motion`. The pulse animations may cause issues for users with vestibular disorders.
- **Text scaling** — Must work up to 200% zoom without breaking layout.
- **Touch targets** — 44x44px minimum per WCAG, not just "18px padding."
- **Error identification** — Form errors must be announced, not just colour-coded.

### Additional accessibility considerations:
- **BSL (British Sign Language)** — Video-based safety instructions for Deaf users
- **Easy Read** — Simplified versions of T&Cs and key safety messaging for users with learning disabilities
- **High contrast mode** — System setting respected
- **Voice activation** — Could the alert be triggered by voice command for users who can't hold a button? (Accessibility enhancement, not v1)

---

## 17. TESTING STRATEGY — None Defined

**[REQUIRED]**

A safety-critical application needs a rigorous testing strategy. The PRD mentions simulation buttons but nothing else.

### Testing requirements:
- **Unit tests** — All business logic (alert routing, sanctions, postcode matching, timer logic)
- **Integration tests** — Firebase sync, SMS delivery, location services
- **End-to-end tests** — Full alert lifecycle from passenger app through control room to closure
- **Load testing** — What happens with 100 concurrent alerts? 1,000 linked users? Define capacity targets.
- **Penetration testing** — Mandatory before launch. Firebase security rules, API endpoints, auth flows.
- **Accessibility testing** — Automated (axe, Lighthouse) + manual (screen reader, keyboard-only)
- **Usability testing** — With actual target users, including vulnerable populations. Not just tech-savvy testers.
- **Failover testing** — Firebase goes down. SMS gateway fails. What happens?
- **Device testing** — Which devices/browsers are supported? Matrix needed.
- **Regression testing** — Automated suite that runs on every deploy

---

## 18. EDGE CASES — Major Gaps

**[REQUIRED]**

The prototype's edge case handling is thin. Critical missing scenarios:

| Scenario | Question |
|----------|----------|
| User sends alert, no operator is on duty | What happens? Alert sits forever? Auto-escalation after N minutes? |
| User sends alert, operator accepts, then operator's system crashes | Alert is assigned but unmonitored. Who picks it up? |
| User sends alert from outside their safety zone | Is this allowed? The postcode is set at registration. What if they're visiting another town? |
| User's phone battery dies during active alert | Operator loses all contact. Is there an auto-escalation protocol? |
| Two users alert from the same location but with different threat assessments | One blue, one red. How does grouping handle mixed severity? |
| User sends alert, then actually calls 999 | Does the operator know? Is there coordination to avoid duplicate response? |
| User sends alert, false alarm, but is now sanctioned and something real happens next week | Sanctioned user (1 alert/week) is in genuine danger on day 2. What happens? |
| Emergency contact receives SMS but calls 999 themselves | Police arrive but have no context about the E-SAF alert. No coordination. |
| Operator cannot find user on CCTV | User is in a blind spot, wearing different clothes than photo, camera is down. What's the protocol? |
| User is in danger but cannot hold button for 3 seconds | Being chased, hands shaking, phone in pocket. Is there an alternative activation method? |
| User sends red alert, shares details, but is a victim of domestic violence | Operator now has their name and location. Is data compartmentalised? Could a malicious operator share this? |
| Multiple control rooms cover overlapping postcodes | How is routing resolved? |
| User registers, links to a control room, that control room later leaves the partnership | User thinks they have coverage but doesn't. How are they notified? |

---

## 19. WELFARE SYSTEM — Backend Missing

**[REQUIRED]**

The passenger app collects welfare call bookings but there is no system to fulfil them.

### What's needed:
- **Welfare officer management** — Who makes these calls? Database of welfare officers.
- **Booking queue/calendar** — Welfare officers need to see their schedule
- **Call tracking** — Was the call made? Was the user reached? What was the outcome?
- **Outcome recording** — Welfare officer logs call notes and outcome
- **Follow-up protocol** — If user doesn't answer, retry? How many times?
- **Integration with safeguarding** — If welfare call reveals ongoing concern, escalation path to safeguarding lead
- **Training for welfare officers** — These are potentially traumatised people. Officers need trauma-informed training.

---

## 20. BUSINESS & OPERATIONAL REQUIREMENTS — Entirely Absent

**[REQUIRED]**

The PRD describes the product but not how it operates as a business.

### 20.1 Business Model
- Who pays? Local authorities? Users? Government grant?
- Revenue model (subscription per control room? Per user? Per alert?)
- Cost structure (Firebase, SMS, hosting, support, compliance, insurance)

### 20.2 Service Level Agreements
- Uptime target (99.9%? 99.99%?)
- Maximum alert delivery latency
- Support response times
- Planned maintenance windows

### 20.3 Support Model
- User support (email? In-app? Phone?)
- Control room technical support (24/7 if they operate 24/7?)
- Incident response for system failures
- Escalation path for critical issues

### 20.4 Standard Operating Procedures
- Operator SOPs for each alert type and scenario
- Escalation SOPs
- Shift handover procedures
- System failure procedures
- Data breach response plan

### 20.5 Onboarding
- How is a new control room onboarded? (Technical setup, camera database, operator training, testing, go-live)
- How is a new operator onboarded? (Account creation, training, supervised period, sign-off)
- Estimated onboarding timeline per control room

---

## 21. TECHNOLOGY STACK — Needs Production Review

**[RECOMMENDED]**

The prototype is vanilla JS + Firebase on Netlify. This is fine for a demo but raises questions at scale:

### Considerations:
- **Vanilla JS** — No component framework means no state management, no routing library, no test framework hooks. For a production app with 18+ screens and complex state, a framework (React, Vue, Svelte) would reduce bugs and improve maintainability.
- **Firebase RTDB** — Good for real-time, but consider Firestore for the structured data (user profiles, incidents, control rooms). RTDB is best for the real-time alert state; Firestore for everything else.
- **Netlify** — Fine for static hosting, but the backend (Cloud Functions, API) needs separate hosting consideration
- **No CI/CD pipeline** — Automated testing, staging environment, deployment approvals needed
- **No environment separation** — Development, staging, production environments with separate Firebase projects
- **No error monitoring** — Sentry, LogRocket, or similar for production error tracking
- **No application logging** — Structured logging for debugging and audit
- **No feature flags** — For controlled rollout to new control rooms

---

## 22. CONTROL ROOM HARDWARE & ENVIRONMENT

**[RECOMMENDED]**

The "Return to Dock" screen implies the control room uses tablets. The PRD should specify:

- **Supported devices** — Specific tablet models? Desktop browsers? Both?
- **Screen resolution requirements** — The dark theme and data density need minimum screen sizes
- **Network requirements** — Minimum bandwidth, firewall rules for Firebase
- **Kiosk mode** — Should the tablet run in locked-down kiosk mode? Prevent operators from navigating away?
- **Physical security** — Device management, MDM, remote wipe capability
- **Backup device** — What if the tablet fails? Spare hardware requirements.

---

## 23. POSTCODE ROUTING — Oversimplified

**[RECOMMENDED]**

The current system does a string prefix match (starts with "SG" → Herts). This won't scale.

### What's needed:
- **Full UK postcode database** — Map every postcode to a control room
- **Boundary handling** — Postcodes at the edge of two control room jurisdictions
- **Coverage gaps** — Postcodes with no partnered control room (graceful handling already started with "Area Not Covered")
- **Dynamic updates** — Control rooms join/leave the network. Coverage areas change.
- **GPS-based routing** — For active alerts, route based on live GPS position, not registered postcode. The user may not be in their "safety zone."

---

## 24. WHAT THE PRD GETS RIGHT

To be clear: Ash has done exceptional work on the concept. The following are strong and should be preserved:

- **The dual-alert model (Blue/Red)** — Elegant solution to graduated response. The privacy distinction (anonymous vs identified) is thoughtful.
- **Hold-to-activate** — Smart prevention of accidental alerts without adding friction in emergencies.
- **Live status timeline** — Excellent UX. Keeps the user informed and reassured. This is the emotional core of the product.
- **Graduated misuse sanctions** — Well-thought-out. Educational first, escalating to bans. Proportionate.
- **T&C scroll-to-unlock** — Forces genuine engagement with legal terms. Better than most apps.
- **Welfare check-in** — Differentiating feature. Shows the product cares about the user beyond the incident.
- **Grouped alerts** — Forward-thinking. Handles the scenario of multiple people at a nightclub or event.
- **"We Are With You" messaging** — Powerful. This is the product's emotional promise.
- **Emergency warning prominence** — The "call 999 first" messaging is consistently placed and well-worded.
- **Operator feedback loop** — Post-incident classification is essential for system improvement and sanctions.

---

## 25. SUMMARY: PRIORITY ROADMAP

### Before Any Real-World Testing
1. Fix concurrent alert architecture (single node → collection)
2. Add real authentication (both apps)
3. Implement server-side API layer with validation
4. Real GPS location capture and transmission
5. Operator authentication and identity tracking

### Before Pilot Deployment (Single Control Room)
6. SMS gateway integration
7. Control room audio alerts
8. Offline/connectivity handling
9. Basic incident database and persistence
10. Firebase Security Rules
11. DPIA completion
12. Safeguarding policy
13. Operator SOPs and training module
14. Basic admin panel
15. CCTV camera database (even if feeds are viewed in existing VMS)
16. Legal review of T&Cs and duty of care
17. Penetration testing

### Before Public Launch
18. Full accessibility (WCAG 2.1 AA)
19. Full account management
20. Reporting and analytics
21. Welfare system backend
22. Load testing
23. ICO registration
24. Data processing agreements
25. Insurance
26. Support model
27. Control room onboarding process

### For Scale (Multi-Control Room)
28. Full postcode routing
29. Multi-control room admin
30. Operator shift management
31. Cross-jurisdiction handoff
32. Native mobile app (for background location)
33. Emergency services data sharing agreements
34. National reporting framework
