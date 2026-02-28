**E-SAF Civic**

**Personal Safety Platform**

**Production Product Requirements Document**

  **Field**          **Value**
  ------------------ ----------------------------------------------------------
  Document Version   2.0 (Production)
  Date               18 February 2026
  Product Owner      E-SAF Systems Ltd
  Author             Ash (Concept & Prototype) / Production PRD by Signal One
  Status             Draft --- Awaiting Review
  Classification     Confidential

*This document merges the original concept prototype specification with
a comprehensive production redline review. Sections marked \[NEW\] did
not exist in the prototype. Sections marked \[EXPANDED\] existed in
concept but require significant additional detail for production.*

Table of Contents
=================

1\. Executive Summary

2\. Problem Statement

3\. Product Vision, Goals & Success Metrics

4\. Target Users & Personas

5\. System Architecture

6\. Authentication & Identity

7\. Location Services

8\. App 1: Civic Passenger App

9\. App 2: Civic Control Room Dashboard

10\. App 3: Administration Panel

11\. CCTV Integration

12\. SMS, Notifications & Alerts

13\. Emergency Services Integration

14\. Operator Management

15\. Incident Management & Persistence

16\. Welfare System

17\. Data Model

18\. Security, Privacy & Compliance

19\. Safeguarding & Duty of Care

20\. Misuse Policy & Sanctions

21\. Accessibility

22\. Non-Functional Requirements

23\. Testing Strategy

24\. Business & Operational Requirements

25\. Design System

26\. Edge Cases & Error Handling

27\. Rollout Strategy

28\. Appendices

1. Executive Summary
====================

E-SAF Civic is a personal safety platform that connects individuals who
feel unsafe in public spaces with local CCTV control room operators
across the United Kingdom. The platform consists of three applications:

-   Civic Passenger App --- A mobile-first application for citizens to
    > send safety alerts and receive real-time status updates

-   Civic Control Room Dashboard --- An operator interface for
    > receiving, managing, and responding to alerts with CCTV monitoring

-   Civic Admin Panel --- A management interface for system
    > administration, control room onboarding, and reporting

The platform uses real-time bidirectional communication between citizens
and operators. It is explicitly positioned as a supplementary safety
tool, not a replacement for emergency services (999).

The initial deployment partner is the Herts CCTV Partnership, covering
Hertfordshire, operating 24/7. The architecture is designed for national
rollout across UK control rooms.

**Origin:** This PRD is based on a working concept prototype built by
Ash, which demonstrated the core user experience across both the
passenger and control room applications. This production PRD expands the
prototype specification with the architecture, security, compliance,
operational, and infrastructure requirements needed to ship a real
product.

2. Problem Statement
====================

People walking alone in public spaces --- particularly at night, in
transit between locations, or in unfamiliar areas --- often feel
vulnerable with no easy way to signal for help short of calling
emergency services. The threshold for calling 999 is high: most people
will not call unless they are in immediate, confirmed danger. This
leaves a wide gap where people feel unsafe but have no action they can
take.

Meanwhile, the UK has one of the world\'s most extensive CCTV networks.
Municipal control rooms monitor thousands of cameras 24/7, but they have
no direct connection to the people those cameras are designed to
protect. Operators are reactive --- they respond to incidents they
happen to see, or to reports phoned in after the fact.

**The gap:** There is no lightweight, non-emergency channel for citizens
to signal that they feel unsafe and be proactively monitored by existing
CCTV infrastructure in real time.

E-SAF Civic bridges this gap by turning the UK\'s existing CCTV network
into an active, citizen-facing safety tool.

3. Product Vision, Goals & Success Metrics
==========================================

3.1 Vision
----------

Every person walking in a UK town or city can be watched over by their
local CCTV control room at the press of a button.

3.2 Goals
---------

-   **Reduce response time** --- Connect citizens to CCTV operators
    > faster than traditional reporting channels.

-   **Leverage existing infrastructure** --- Use the UK\'s extensive
    > CCTV network as a proactive safety tool without requiring new
    > camera installations.

-   **Provide reassurance** --- Give users real-time visibility into
    > operator actions (searching, monitoring, escalating) so they know
    > they are not alone.

-   **Enable graduated response** --- Two alert levels allow
    > proportionate responses without overwhelming control rooms.

-   **Deter misuse** --- A clear, graduated sanctions framework protects
    > system integrity for genuine users.

-   **Scale nationally** --- Architecture supports onboarding any UK
    > control room via postcode-based and GPS-based routing.

3.3 Success Metrics
-------------------

**\[NEW --- Not in prototype\]**

  **Metric**                 **Target**               **Measurement**
  -------------------------- ------------------------ ----------------------------------------------------------------
  Alert-to-acceptance time   \< 60 seconds (median)   Time from alert creation to operator acceptance
  Alert-to-visual time       \< 3 minutes (median)    Time from alert creation to operator confirming visual on CCTV
  Genuine alert rate         \> 85%                   Percentage of alerts classified as genuine by operators
  User retention (30-day)    \> 60%                   Users who keep the app installed and linked after 30 days
  Operator satisfaction      \> 4/5                   Quarterly operator survey score
  System uptime              99.9%                    Measured monthly, excluding planned maintenance
  Escalation rate            Tracked (no target)      Percentage of alerts escalated to emergency services
  Welfare check-in uptake    Tracked (no target)      Percentage of users accepting post-incident welfare call

4. Target Users & Personas
==========================

4.1 Citizens (Passenger App)
----------------------------

Primary user segments:

-   People walking alone at night (e.g., from train station to home)

-   Commuters in transit through monitored town centre areas

-   Vulnerable individuals in public spaces

-   Young people (16+) travelling independently

-   Shift workers commuting at unsociable hours

-   Anyone who feels unsafe but is not in immediate danger requiring 999

4.2 CCTV Control Room Operators
-------------------------------

-   Trained operators at municipal CCTV control rooms and partnerships

-   24/7 shift workers monitoring camera feeds

-   Supervisors overseeing incident response and operator performance

4.3 Control Room Managers
-------------------------

**\[NEW\]**

-   Responsible for shift scheduling, operator performance, and
    > reporting

-   Need aggregated views of alert volumes, response times, and trends

4.4 System Administrators
-------------------------

**\[NEW\]**

-   E-SAF staff managing the platform nationally

-   Onboarding new control rooms, managing the camera database, handling
    > user issues

4.5 Welfare Officers
--------------------

**\[NEW\]**

-   Trained personnel who conduct post-incident welfare check-in calls

-   May be employed by E-SAF or by the local authority partner

4.6 Minimum Age
---------------

**\[NEW --- Safeguarding requirement\]**

Minimum age to register: 16 years old. Users aged 16-17 require
parental/guardian consent during registration. This must be captured and
stored. The ID verification step (passport or driving licence) provides
an inherent age gate, but the policy must be explicit in the T&Cs and
registration flow.

5. System Architecture
======================

5.1 High-Level Architecture
---------------------------

**\[EXPANDED --- Prototype had client-only architecture\]**

The production system consists of the following components:

  **Component**        **Technology**                             **Purpose**
  -------------------- ------------------------------------------ ----------------------------------------------------------------------
  Passenger App        React (or equivalent framework) / PWA      Citizen-facing mobile web application
  Control Room App     React (or equivalent framework)            Operator dashboard --- tablet and desktop
  Admin Panel          React (or equivalent framework)            System administration and reporting
  API Layer            Firebase Cloud Functions or Node.js API    Server-side business logic, validation, and routing
  Real-Time Database   Firebase Realtime Database                 Live alert state synchronisation (active alerts only)
  Primary Database     Firebase Firestore                         Structured data: users, incidents, control rooms, cameras, operators
  Authentication       Firebase Authentication                    User and operator identity management
  SMS Gateway          Twilio / MessageBird (TBD)                 Emergency contact SMS notifications
  Push Notifications   Firebase Cloud Messaging (FCM)             Background alerts to passenger app
  File Storage         Firebase Storage                           User photos, incident attachments
  Error Monitoring     Sentry or equivalent                       Production error tracking and alerting
  Hosting              Netlify / Firebase Hosting                 Static app hosting with CDN
  Location Services    Browser Geolocation API + What3Words API   Real-time GPS positioning and human-readable locations

 

5.2 Architecture Diagram
------------------------

Citizen Device Backend Services Control Room\
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+\
\| Passenger App \| \| API Layer \| \| Control Room App \|\
\| (PWA) \|\-\-\-\-\--\>\| - Alert creation \|\<\-\-\-\-\--\| (Web App)
\|\
\| \| \| - Validation \| \| \|\
\| - GPS tracking \| \| - Rate limiting \| \| - Alert queue \|\
\| - Alert UI \| \| - Sanctions enforcement \| \| - CCTV search \|\
\| - Status display \| \| - SMS dispatch \| \| - Monitoring \|\
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \| - Push notifications \| \| -
Escalation \|\
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+\
\|\
+\-\-\-\-\-\-\-\-\--+\-\-\-\-\-\-\-\-\-\--+\
\| \|\
+\-\-\-\-\--+\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\--+\-\-\-\--+\
\| Firebase \| \| Firestore \|\
\| RTDB \| \| (Persistent \|\
\| (Live alert \| \| data store) \|\
\| state) \| \| \|\
+\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

5.3 Critical Architecture Change: Alert Concurrency
---------------------------------------------------

**\[NEW --- Blocker fix from prototype\]**

The prototype uses a single Firebase RTDB node (*currentAlert*) for all
alerts. This means only one alert can exist at a time across the entire
platform. **This is the single most critical change required for
production.**

Production data structure:

Firebase RTDB (live state only):\
activeAlerts/\
{alertId}/\
status, operatorId, location, additionalInfo, timestamps\
\
Firestore (persistent data):\
users/{userId} - Profile, preferences, sanctions\
alerts/{alertId} - Full alert record with audit trail\
controlRooms/{roomId} - Configuration, coverage, cameras\
operators/{operatorId} - Profile, shift history, performance\
incidents/{incidentId} - Closed incident records\
welfare/{bookingId} - Welfare call bookings and outcomes

 

5.4 Environment Strategy
------------------------

**\[NEW\]**

  **Environment**   **Purpose**                                   **Firebase Project**
  ----------------- --------------------------------------------- ----------------------
  Development       Active development and unit testing           esaf-civic-dev
  Staging           Integration testing, UAT, operator training   esaf-civic-staging
  Production        Live service                                  esaf-civic-prod

Each environment has its own Firebase project with completely isolated
data. The staging environment includes simulation capabilities for
operator training.

6. Authentication & Identity
============================

**\[NEW --- Prototype had no real authentication\]**

6.1 Passenger App Authentication
--------------------------------

Registration flow:

-   Email + password registration via Firebase Authentication

-   Email verification required before account activation (verification
    > link sent)

-   Phone number verification via SMS OTP (critical: this number is used
    > for emergency contact relay)

-   ID verification via third-party UK-regulated service (Onfido, Yoti,
    > or equivalent)

-   Accepted documents: UK Passport, UK Driving Licence

-   E-SAF never stores the ID document itself --- only the verification
    > result (pass/fail, date, provider reference)

-   Estimated verification time: 2-3 minutes

Login flow:

-   Email + password with secure session tokens

-   Remember me option with refresh token (encrypted local storage)

-   Biometric login option (Face ID / fingerprint) via WebAuthn where
    > supported

Security:

-   Password requirements: minimum 8 characters, at least one uppercase,
    > one number

-   Account lockout after 5 failed login attempts (30-minute cooldown)

-   Password reset via email link (expires after 1 hour)

-   Session timeout: 30 days inactive

-   Single active session per device (new login on Device B invalidates
    > Device A session if alert is not active)

-   If an alert is active, new device login is blocked with message:
    > \"You have an active safety alert. Please use your current
    > device.\"

6.2 Control Room Authentication
-------------------------------

-   Operator accounts created by control room managers via Admin Panel

-   Username + password login (no self-registration)

-   Session timeout: 2 hours inactive (shorter for security in shared
    > environments)

-   Every operator action is attributed to their authenticated identity

-   Optional: IP restriction to control room network range

-   Optional: Two-factor authentication for supervisor/manager roles

6.3 Admin Panel Authentication
------------------------------

-   Role-based access: System Admin, Control Room Manager

-   Two-factor authentication mandatory

-   Audit log of all admin actions

-   IP restriction recommended

6.4 Role Matrix
---------------

  **Capability**                   **Citizen**   **Operator**   **Supervisor**   **CR Manager**   **System Admin**
  -------------------------------- ------------- -------------- ---------------- ---------------- ------------------
  Send alerts                      Yes           No             No               No               No
  Accept/manage alerts             No            Yes            Yes              No               No
  Escalate to emergency services   No            Yes            Yes              No               No
  View all active alerts           No            No             Yes              Yes              Yes
  Manage operators                 No            No             No               Yes              Yes
  View reports (own CR)            No            No             Yes              Yes              Yes
  View reports (all CRs)           No            No             No               No               Yes
  Onboard control rooms            No            No             No               No               Yes
  Manage camera database           No            No             No               Yes              Yes
  Apply user sanctions             No            No             No               Yes              Yes
  Handle GDPR requests             No            No             No               No               Yes

7. Location Services
====================

**\[NEW --- Prototype referenced GPS but did not implement it\]**

7.1 Location Capture on Alert
-----------------------------

When a user activates an alert, the system must:

-   Capture the user\'s GPS coordinates via the Browser Geolocation API
    > (high accuracy mode)

-   Resolve coordinates to a What3Words address via the What3Words API

-   Determine the nearest control room based on GPS position (not just
    > registered postcode)

-   Identify cameras within range based on the camera geospatial
    > database

-   Transmit all location data to the control room via Firebase

7.2 Continuous Location Updates
-------------------------------

During an active alert, the user\'s location must update continuously:

-   Location update interval: every 10 seconds during active monitoring

-   Updates transmitted to Firebase RTDB for real-time operator
    > visibility

-   Operator sees a moving position indicator (or updated
    > What3Words/coordinates)

-   Camera-in-range list updates dynamically as user moves

7.3 Location Permission Handling
--------------------------------

  **Scenario**                          **Behaviour**
  ------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Permission not yet requested          Request on first alert screen load with clear explanation of why it is needed
  Permission denied                     Block alert functionality. Show clear message: \"Location is required to connect you to your nearest control room. Please enable location in your device settings.\"
  Permission granted, GPS unavailable   Use last known location if \< 5 minutes old. Show accuracy warning to operator.
  Low accuracy (\> 100m)                Send alert with available location. Flag accuracy to operator: \"Location accuracy: approximate\"

 

7.4 Background Location
-----------------------

**Critical issue from prototype:** The prototype tells users \"you can
safely close this app\" during an active alert. A standard web app
cannot track location or maintain Firebase connections when backgrounded
on mobile.

Options (one must be selected):

-   Option A (Recommended): Build as a Progressive Web App (PWA) with
    > service worker. Limited background capability but can maintain
    > push notification channel.

-   Option B: Wrap in a native shell (Capacitor/React Native) for true
    > background location and push notifications.

-   Option C: Remove the \"you can close the app\" messaging. Instruct
    > users to keep the app open and screen on during active alerts.

Decision required from product owner before development begins.

7.5 What3Words Integration
--------------------------

-   Requires commercial API licence from What3Words (confirm licensing
    > agreement)

-   Live resolution from GPS coordinates on each alert and location
    > update

-   Fallback: display raw GPS coordinates if What3Words API is
    > unavailable

8. App 1: Civic Passenger App
=============================

8.1 Screen Inventory
--------------------

  **\#**   **Screen**                   **Purpose**                                                          **Status**
  -------- ---------------------------- -------------------------------------------------------------------- ----------------
  1        Welcome / Login              Entry point: Create Account, Log In, or returning user quick-login   From prototype
  2        Login                        Email + password authentication                                      Expanded
  2B       Password Reset               Forgotten password email flow                                        NEW
  3        Registration                 Personal details, emergency contact(s)                               Expanded
  3B       Email & Phone Verification   Email link + SMS OTP                                                 NEW
  3C       ID Verification              Third-party identity check                                           From prototype
  3D       Terms & Conditions           Three-part scrollable agreement                                      From prototype
  3E       Parental Consent             For users aged 16-17                                                 NEW
  4A       Photo Upload                 Selfie for operator identification                                   From prototype
  4B       Safety Zone Setup            Postcode entry + GPS-based zone                                      Expanded
  4C       Control Room Linked          Success: shows control room details                                  From prototype
  4D       Area Not Covered             Failure: offers to request coverage                                  From prototype
  5        Main Alert Interface         Blue and Red alert buttons                                           From prototype
  5B       CCTV Coverage Map            Camera locations in Safety Zone                                      Expanded
  6        Alert Sent Confirmation      Confirms alert + SMS notification                                    From prototype
  7        Live Status Tracking         Four-step timeline with real-time updates                            From prototype
  7B       Additional Info Input        Send details to operator                                             From prototype
  8        No Operator Available        What happens when no operator accepts                                NEW
  9        Active Monitoring            \"We Are With You\" screen                                           From prototype
  9B       Connection Lost              Connectivity warning during alert                                    NEW
  10       Incident Closure             Summary: time, duration, control room                                From prototype
  11       Welfare Check-In Offer       Schedule post-incident welfare call                                  From prototype
  12       Welfare Scheduling           Day + time picker                                                    From prototype
  13       Booking Confirmation         Confirms welfare booking                                             From prototype
  P1       Profile & Settings           View/edit profile, emergency contacts, preferences                   NEW
  P2       Alert History                View past alerts and outcomes                                        NEW
  P3       Account Deletion             GDPR deletion request flow                                           NEW

8.2 Registration Flow
---------------------

Registration fields (mandatory):

  **Field**                  **Validation**                   **Notes**
  -------------------------- -------------------------------- ------------------------------------------------------------------
  Full Legal Name            Required, min 2 characters       Must match ID document
  Home Address               Required, UK address             Used for account verification, not shared with operators
  Email                      Required, valid format, unique   Verified via email link
  Mobile Number              Required, UK mobile format       Verified via SMS OTP. Used as the emergency contact relay point.
  Emergency Contact Name     Required                         Person to be notified by SMS on alert activation
  Emergency Contact Number   Required, valid phone            Receives automated SMS alerts
  Date of Birth              Required, must be 16+            NEW: needed for age verification and safeguarding

 

8.3 Terms & Conditions (Three Agreements)
-----------------------------------------

All three sections must be reviewed and scrolled to completion.
Checkboxes unlock progressively as each section is scrolled to the
bottom.

**Agreement 1: General Terms of Use & Privacy**

-   Data processing per UK GDPR and Data Protection Act 2018

-   Data shared with emergency services only when legally required or
    > life-threatening

-   Alert data retention: 12 months for audit purposes

-   Profile data retained for duration of account

-   Data access, rectification, and erasure rights (contact:
    > data\@esaf.co.uk)

-   Required permissions: location services, camera access, local
    > storage

-   Intellectual property: E-SAF Systems Ltd

-   Governing law: England and Wales

**Agreement 2: Limitations of Service & Emergency Protocol**

-   THIS IS NOT AN EMERGENCY SERVICE --- prominent warning

-   Control room operators have NO legal obligation to act upon alerts

-   Alert action entirely at operator discretion

-   CCTV coverage not guaranteed at all locations or times

-   Response times not guaranteed

-   Service dependent on mobile connectivity and GPS availability

-   User responsible for own safety --- must call 999 if
    > life-threatening

**Agreement 3: Acceptable Use & Misuse Policy**

-   Permitted use: genuine belief of being unsafe in a public space

-   Maximum 2 alerts per 24-hour period

-   Graduated sanctions for false or malicious alerts (see Section 20)

8.4 Core Feature: Dual Alert System
-----------------------------------

  **Attribute**              **Blue Alert**                           **Red Alert**
  -------------------------- ---------------------------------------- --------------------------------------
  Label                      I Feel Unsafe                            I Am In Danger
  User identity shared       No --- operator sees anonymous ID only   Yes --- full name, age, photo shared
  Activation                 Hold button for 3 seconds                Hold button for 3 seconds
  UI theme                   Blue                                     Red (entire app switches)
  Operator priority          Standard                                 High --- urgent banner and audio
  SMS to emergency contact   Yes                                      Yes

 

8.5 Core Feature: Hold-to-Activate
----------------------------------

Mechanism:

-   User presses and holds the alert button

-   3-second countdown with visual feedback: \"Hold\... 3\", \"Hold\...
    > 2\", \"Hold\... 1\"

-   Button scales to 0.97x during hold for tactile feedback

-   Releasing before 3 seconds cancels --- no alert sent, button resets

-   Completing the hold immediately sends the alert and advances to
    > confirmation screen

-   No confirmation dialog after activation (intentional --- speed is
    > critical in emergencies)

**Rationale:** Prevents accidental alert activations while maintaining
speed in genuine emergencies. The 3-second hold is long enough to
prevent pocket-dials but short enough to not frustrate a scared user.

8.6 Core Feature: Live Status Timeline
--------------------------------------

Four-step real-time tracker showing operator progress:

  **Step**   **Icon (Active)**   **Icon (Complete)**   **Description**
  ---------- ------------------- --------------------- ----------------------------------------------
  1          ---                 Checkmark (green)     Alert received by control room
  2          Hourglass (pulse)   Checkmark (green)     Awaiting operator review
  3          Magnifier (pulse)   Checkmark (green)     Operator searching CCTV
  4          Eye (pulse)         Checkmark (green)     Visual confirmation --- operator can see you

-   Active step displays animated pulse effect (1.5s infinite)

-   Each completed step logs a timestamp (HH:MM)

-   Driven by Firebase operatorStatus field changes in real time

-   Step 4 completion auto-advances to \"We Are With You\" monitoring
    > screen

8.7 Core Feature: Additional Info Messaging
-------------------------------------------

-   Available during status tracking and active monitoring

-   Textarea prompt: \"Any details to help the operator locate you
    > faster\"

-   \"Send to Operator\" button syncs message to Firebase in real time

-   Confirmation: \"Message sent to control room\"

-   Reusable --- user can send multiple updates throughout the incident

8.8 Core Feature: Active Monitoring (\"We Are With You\")
---------------------------------------------------------

-   Title: \"We Are With You\"

-   Message: \"The operator has confirmed your location and is
    > monitoring you on CCTV\"

-   Instruction: \"Stay calm and continue as normal.\"

-   Continued communication: user can send updates to operator

-   \"I Feel Safe Now\" button with confirmation dialog: \"Are you sure
    > you feel completely safe now? This will notify the control room
    > and close the incident.\"

8.9 Core Feature: Welfare Check-In
----------------------------------

-   Offered after every incident closure

-   Prompt: \"Would you like us to schedule a welfare check-in call?\"

-   A trained welfare officer will call at the user\'s chosen time

-   Day selection: Today, Tomorrow, Monday--Friday

-   Time selection: 9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 2:00 PM, 4:00
    > PM, 6:00 PM

-   Booking confirmation displayed with selected day and time

-   Returns user to main alert screen after booking or declining

8.10 Core Feature: CCTV Coverage Map
------------------------------------

-   Displays camera locations within the user\'s Safety Zone on a map

-   Camera data driven by the camera geospatial database (not hardcoded)

-   Shows camera count and named locations

-   Planning tip: \"Where possible, plan your route to stay within
    > camera coverage areas\"

8.11 No Operator Available Flow
-------------------------------

**\[NEW --- Critical gap in prototype\]**

If no operator accepts an alert within 2 minutes:

-   User sees: \"We\'re still trying to connect you to an operator. Your
    > alert is active and your emergency contact has been notified by
    > SMS.\"

-   At 5 minutes: \"We have not been able to connect you to an operator.
    > If you feel in danger, please call 999 immediately.\" Option to
    > cancel alert or continue waiting.

-   Alert remains in queue until accepted or cancelled by user

-   Auto-escalation to supervisor after 5 minutes without acceptance

8.12 Profile & Account Management
---------------------------------

**\[NEW\]**

-   View and edit: name, address, phone, email, emergency contacts,
    > photo

-   Add multiple emergency contacts (up to 3)

-   Change safety zone / linked control room

-   View alert history with outcomes

-   View active sanctions (if any)

-   Notification preferences

-   Account deletion request (GDPR --- see Section 18)

-   Password change

8.13 SMS Notification
---------------------

Sent automatically to emergency contact(s) on file when alert activated:

*\"E-SAF Civic Alert. A safety alert has been activated. Location:
\[Safety Zone\]. Time: \[HH:MM\]. This message is automated. Do not
reply.\"*

**\[NEW --- Implementation requirements\]**

-   SMS gateway integration required (Twilio, MessageBird, or
    > equivalent)

-   Delivery receipt tracking --- log whether SMS was delivered

-   Retry logic: if delivery fails, retry once after 30 seconds

-   International number support for emergency contacts with non-UK
    > numbers

-   SMS content must comply with UK regulations on automated messaging

9. App 2: Civic Control Room Dashboard
======================================

9.1 Screen Inventory
--------------------

  **\#**   **Screen**              **Purpose**                                              **Status**
  -------- ----------------------- -------------------------------------------------------- ----------------
  1        Idle / Dashboard        System stats, active alerts queue, operator status       Expanded
  2        New Alert Review        Incoming alert details, user info, camera availability   From prototype
  3        CCTV Search             Operator scanning camera feeds to locate user            From prototype
  4        Active Monitoring       30-min timed session with live user info                 From prototype
  4B       Grouped Alerts          Multiple users within 30m clustered                      From prototype
  4C       Individual from Group   Drill-down into single grouped user                      From prototype
  5        Job Closed / Feedback   Operator classifies alert and submits notes              From prototype
  6        Return to Dock          Device handling instructions                             From prototype
  ---      Escalation Overlay      Modal: Police, Ambulance, Fire, Supervisor               Expanded
  ---      Alert Queue             List of pending alerts awaiting acceptance               NEW
  ---      Operator Login          Authentication screen                                    NEW
  ---      Shift Handover          Transfer active alerts to incoming operator              NEW

9.2 Operator Workflows
----------------------

### 9.2.1 Primary Single-Alert Flow

Idle \> New Alert Received \> Accept Alert \> CCTV Search \> Incident
Located \> Active Monitoring (30 min timer) \> \[Escalate if needed\] \>
Monitoring Ended \> Feedback / Classification \> Return to Dock \> Idle

### 9.2.2 Grouped Alert Flow

Idle \> Grouped Alert (all users in cluster) \> Click individual card
for detail \> Back to group \> Group Action (Escalate All / Extend All /
Close Group) \> Feedback \> Return to Dock \> Idle

### 9.2.3 Escalation Flow

Monitoring screen \> Escalate button \> Overlay appears \> Select:
Police / Ambulance / Fire / Supervisor \> Button shows \"Notified\" \>
Close overlay \> Continue monitoring

**\[EXPANDED --- Operational detail added\]**

On escalation:

-   System logs the escalation with timestamp, operator ID, and service
    > contacted

-   An escalation data card is generated with all incident details for
    > the operator to read to the emergency service

-   The card includes: location (What3Words + postcode), user
    > description (if red alert: name, age, photo), nature of alert,
    > duration of monitoring, any additional info from user

-   The operator contacts the emergency service via their existing
    > radio/phone system (E-SAF does not auto-dial)

9.3 Alert Review (Screen 2)
---------------------------

Information displayed:

  **Field**          **Red Alert**                         **Blue Alert**
  ------------------ ------------------------------------- ----------------------------------
  Identity           Full name + photo                     Anonymous ID (e.g., \"ID: 001\")
  Age                Shown                                 Hidden (\"Blue alert\")
  Alert Time         HH:MM (24hr)                          HH:MM (24hr)
  GPS Location       Live coordinates + What3Words         Live coordinates + What3Words
  Risk Postcode      Shown                                 Shown
  Location Name      Shown (e.g., Stevenage Town Centre)   Shown
  Cameras in Range   Count + list                          Count + list
  SMS Status         Sent / Delivered / Failed             Sent / Delivered / Failed

Action buttons:

-   Accept Alert --- Assigns alert to this operator, advances to CCTV
    > Search

-   Temporarily Unavailable --- Returns alert to queue for another
    > operator

9.4 Active Monitoring (Screen 4)
--------------------------------

Timer:

-   Starts at 30:00 (1800 seconds), counts down in real time

-   No auto-timeout --- monitoring continues until operator presses End

-   Extend 30min --- Adds 1800 seconds

Live information:

-   User\'s additional info messages displayed in real time

-   User\'s live GPS position updated every 10 seconds

-   Camera-in-range list updates as user moves

Actions:

-   Escalate --- Opens escalation overlay

-   Extend 30min --- Extends monitoring session

-   Monitoring Ended --- Proceeds to feedback screen

9.5 Feedback / Classification (Screen 5)
----------------------------------------

Required classification (radio group):

-   Genuine alert --- Real concern

-   False alert --- No concern identified

-   Malicious / Deliberate misuse

-   Unclear --- Unable to determine

Additional notes: optional free-text textarea

On submission: classification + notes + full incident log are persisted
to the incident database (Firestore).

9.6 Audio Alerts
----------------

**\[NEW --- Critical for 24/7 operations\]**

  **Event**                       **Sound**                 **Behaviour**
  ------------------------------- ------------------------- ----------------------------------------------------------------------
  New Blue Alert                  Two-tone chime            Plays once on arrival. Repeats every 30 seconds if not acknowledged.
  New Red Alert                   Urgent alarm tone         Plays continuously until acknowledged. Distinct from blue.
  User marked safe                Soft confirmation tone    Plays once.
  New additional info from user   Short notification ping   Plays once.
  Timer at 5 minutes remaining    Warning tone              Plays once.
  Timer expired                   Gentle repeating tone     Every 30 seconds until ended or extended.

-   Volume control accessible from all screens

-   Mute option with visual indicator (red badge) --- cannot mute for
    > more than 5 minutes

9.7 Alert Queue
---------------

**\[NEW\]**

When multiple alerts are pending and the operator is busy:

-   A queue sidebar/panel shows all pending alerts for this control room

-   Sorted by severity (Red first) then by time (oldest first)

-   Each queue item shows: alert type, time, location, time waiting

-   Alerts waiting \> 2 minutes are highlighted amber

-   Alerts waiting \> 5 minutes are highlighted red and auto-escalated
    > to supervisor

10. App 3: Administration Panel
===============================

**\[NEW --- Does not exist in prototype\]**

10.1 System Administration
--------------------------

-   Onboard new control rooms (name, coverage area, operating hours,
    > contact details)

-   Manage the camera database (add/edit/remove cameras with GPS
    > coordinates per control room)

-   Manage postcode-to-control-room routing table

-   System configuration: alert limits, timer defaults, sanction
    > thresholds

-   System health monitoring: Firebase status, active connections, error
    > rates

-   Feature flags for controlled rollout

10.2 User Management
--------------------

-   Search users by name, email, postcode, or linked control room

-   View user profiles and full alert history

-   Apply or remove sanctions manually

-   Process GDPR data access requests (export user data as JSON/CSV)

-   Process GDPR deletion requests (anonymise alert history, delete
    > profile)

-   Handle complaints and appeals

10.3 Operator Management
------------------------

-   Create operator accounts and assign to control rooms

-   Set roles (Operator, Supervisor, Manager)

-   View operator performance: response times, alert volume,
    > classifications

-   Deactivate operator accounts

10.4 Control Room Manager Dashboard
-----------------------------------

-   Alert volume and trends for their control room
    > (daily/weekly/monthly)

-   Response time metrics (alert-to-acceptance, alert-to-visual)

-   Classification breakdown (genuine vs false vs malicious vs unclear)

-   Operator utilisation and workload distribution

-   Active alerts overview

-   Exportable reports (PDF/CSV) for local authority partners

 

10.5 Reporting & Analytics
--------------------------

  **Report**                                                        **Audience**              **Frequency**
  ----------------------------------------------------------------- ------------------------- -------------------------
  Daily summary: alert count, response times, classifications       Control room manager      Daily (automated email)
  Weekly trend report: volume trends, peak times, coverage gaps     Control room manager      Weekly
  Monthly performance report: full metrics suite                    Local authority partner   Monthly
  Quarterly system report: national statistics, growth, incidents   E-SAF leadership          Quarterly
  Ad-hoc incident report: full detail for a specific incident       Police / audit            On request

11. CCTV Integration
====================

**\[NEW --- Core value proposition; not implemented in prototype\]**

11.1 Camera Database
--------------------

Each camera managed by a partner control room must be registered in the
system:

  **Field**       **Description**
  --------------- ------------------------------------------------------------------
  Camera ID       Unique identifier within the control room\'s system
  Name / Label    Human-readable name (e.g., \"High Street North\")
  GPS Latitude    Camera position
  GPS Longitude   Camera position
  Type            Fixed / PTZ (Pan-Tilt-Zoom)
  Field of View   Approximate coverage angle and range
  Status          Online / Offline / Maintenance
  Control Room    Which control room manages this camera
  VMS Reference   Camera identifier in the control room\'s Video Management System

11.2 Location-to-Camera Mapping
-------------------------------

Given a user\'s GPS position, the system must return the cameras most
likely to have a view:

-   Geospatial query: find all cameras within a configurable radius
    > (default: 200m)

-   Sort by distance (nearest first)

-   Filter out offline cameras

-   Return camera name, distance, and VMS reference to the operator

11.3 Camera Feed Access
-----------------------

**Key architectural decision:** Does E-SAF embed camera feeds directly,
or act as a routing/alerting layer on top of the control room\'s
existing Video Management System (VMS)?

Recommended approach for v1:

-   E-SAF provides the alert, user information, and camera
    > recommendations

-   The operator uses their existing VMS (Milestone, Genetec, etc.) to
    > view the actual camera feeds

-   The VMS camera reference is displayed in E-SAF so the operator can
    > quickly navigate to the right camera

-   Future: explore VMS API integration to embed feeds directly
    > (significant technical and licensing complexity)

11.4 Coverage Map (Passenger App)
---------------------------------

The passenger app displays a coverage map driven by the camera database:

-   Map view showing camera locations as markers within the user\'s
    > safety zone

-   Camera count for the zone

-   Route planning guidance: \"Stay within camera coverage areas where
    > possible\"

-   Data refreshed when user opens the map (not real-time)

12. SMS, Notifications & Alerts
===============================

**\[NEW --- Not implemented in prototype\]**

12.1 SMS Gateway
----------------

-   Provider: Twilio, MessageBird, or UK-specific provider (TBD ---
    > evaluate cost, deliverability, and UK coverage)

-   Emergency contact SMS on alert activation (see Section 8.13)

-   Delivery receipt tracking and logging

-   Retry logic: 1 retry after 30 seconds on failure

-   Cost modelling: estimated SMS cost per alert at projected volumes

12.2 Push Notifications (Passenger App)
---------------------------------------

-   Firebase Cloud Messaging (FCM) for Android / web push

-   Apple Push Notification Service (APNs) if native iOS wrapper is
    > built

-   Notifications for: operator accepted your alert, visual confirmed,
    > incident closed

-   Critical for backgrounded app --- user must know when status changes

12.3 Control Room Audio Alerts
------------------------------

See Section 9.6 for full specification.

12.4 Desktop Notifications (Control Room)
-----------------------------------------

-   Browser Notification API for when the control room tab is not
    > focused

-   Distinct notifications for new alerts (Blue vs Red)

-   Requires user permission grant on first use

13. Emergency Services Integration
==================================

**\[NEW --- Escalation buttons exist in prototype but nothing
happens\]**

13.1 Escalation Model (v1)
--------------------------

For the initial version, escalation is operator-initiated and manual:

-   Operator presses Escalate in the E-SAF dashboard

-   System generates an Escalation Data Card with all relevant
    > information

-   Operator contacts the emergency service via their existing radio or
    > phone

-   Operator reads the data card to the dispatcher

-   System logs the escalation: timestamp, operator, service contacted,
    > incident ID

13.2 Escalation Data Card
-------------------------

Generated for the operator to relay:

-   Incident reference number

-   Location: What3Words address, postcode, GPS coordinates

-   User description (if red alert): name, age, photo

-   Nature of alert: blue (feels unsafe) or red (in danger)

-   Duration of monitoring

-   Any additional information provided by user

-   Cameras currently monitoring the location

-   Number of people involved (if grouped alert)

13.3 Police Partnership
-----------------------

Each control room deployment should have:

-   A formal data-sharing agreement with the local police force

-   An agreed escalation protocol (what triggers a police response, what
    > information is shared)

-   A named police liaison contact

-   Compliance with the Surveillance Camera Code of Practice

13.4 Future: Automated Escalation
---------------------------------

For future versions, explore:

-   CAD (Computer Aided Dispatch) integration for automated incident
    > creation

-   Direct data feed to police control room systems

-   Automated location sharing with emergency services

14. Operator Management
=======================

**\[NEW --- Prototype assumes single operator\]**

14.1 Multi-Operator Support
---------------------------

-   Multiple operators can be logged in simultaneously per control room

-   Alerts are routed to available operators (not broadcast to all)

-   Operator status: Available, Busy (handling alert), On Break, End of
    > Shift

-   Workload balancing: new alerts go to the operator with the fewest
    > active incidents

14.2 Shift Management
---------------------

-   Operators sign in at shift start, sign out at shift end

-   Shift handover: active alerts are transferred to the incoming
    > operator

-   Handover includes full incident log and current status

-   System prevents an operator from signing out with active, unhandled
    > alerts

14.3 Supervisor Functions
-------------------------

-   Real-time view of all active alerts and assigned operators

-   Ability to reassign alerts between operators

-   Notified when alerts wait \> 5 minutes without acceptance

-   Override capability on any operator action

-   Quality review: can annotate operator feedback/classifications

14.4 Training
-------------

-   Dedicated training environment (staging) with simulation
    > capabilities

-   Standard Operating Procedures document for each scenario

-   Supervised period for new operators before solo operation

-   Simulation buttons (from prototype) moved to training environment
    > only --- removed from production UI

15. Incident Management & Persistence
=====================================

**\[NEW --- Prototype stores incidents in memory only\]**

15.1 Incident Record
--------------------

Every alert creates a persistent incident record in Firestore:

  **Field**             **Description**
  --------------------- ----------------------------------------------------------------------------------
  Incident ID           Unique reference number (e.g., ESAF-2026-00142)
  Alert Type            Blue / Red
  User ID               Reference to user (anonymised for blue alerts in reporting)
  Operator ID           Who handled the incident
  Control Room          Which control room responded
  Location              GPS coordinates, What3Words, postcode, named location
  Timeline              Array of timestamped events (created, accepted, searching, visual, safe, closed)
  Additional Info       Messages sent by user during the incident
  Classification        Operator\'s post-incident assessment
  Operator Notes        Free-text notes
  Escalation Log        Services contacted, timestamps
  Duration              Total time from alert to closure
  SMS Delivery Status   Sent / Delivered / Failed for each emergency contact
  Grouped               Whether this was part of a grouped incident, and group ID

15.2 Incident Search & Retrieval
--------------------------------

-   Search by: date range, user, operator, classification, location,
    > reference number

-   Filterable in admin panel and control room manager dashboard

-   Exportable as PDF (individual incident report) or CSV (bulk export)

15.3 Incident Review Workflow
-----------------------------

-   Operator classifies incident at closure

-   If classified as \"Malicious\" --- auto-flagged for supervisor
    > review

-   Supervisor confirms or overrides classification

-   Confirmed malicious/false classifications feed into the sanctions
    > workflow

-   Sanctions are not auto-applied --- they require manager approval
    > (see Section 20)

15.4 Data Retention
-------------------

-   Incident records retained for 12 months from closure date

-   After 12 months: records anonymised (user ID removed) but
    > statistical data retained

-   Anonymisation is automated via scheduled job

-   User profile data retained for duration of account

-   Deleted accounts: profile removed, incident records anonymised
    > immediately

16. Welfare System
==================

**\[EXPANDED --- Prototype captures bookings but has no fulfilment
system\]**

16.1 Booking (Passenger App)
----------------------------

As per prototype: user selects day + time after incident closure.
Booking stored in Firestore welfare collection.

16.2 Fulfilment (New)
---------------------

-   Welfare officers access bookings via the Admin Panel or a dedicated
    > welfare dashboard

-   Bookings displayed as a calendar/queue sorted by date and time

-   Each booking shows: user name, contact number, incident summary,
    > date/time requested

16.3 Call Workflow
------------------

-   Welfare officer calls the user at the scheduled time

-   If no answer: retry once after 15 minutes. If still no answer, mark
    > as \"Not reached\" and send an SMS: \"We tried to call for your
    > welfare check-in. Please call us back on \[number\] if you\'d like
    > to talk.\"

-   Officer logs: call made, duration, outcome (user fine / user needs
    > further support / safeguarding concern / not reached)

-   If safeguarding concern: escalation to Designated Safeguarding Lead

16.4 Welfare Officer Requirements
---------------------------------

-   DBS checked

-   Trained in trauma-informed communication

-   Trained in safeguarding recognition and escalation

-   May be E-SAF employees or local authority staff (per partnership
    > agreement)

17. Data Model
==============

**\[EXPANDED --- Prototype used a single node; production needs full
schema\]**

17.1 Firebase Realtime Database (Live State Only)
-------------------------------------------------

RTDB is used exclusively for real-time alert state synchronisation:

activeAlerts/{alertId}:\
alertType: \"blue\" \| \"red\"\
userId: string\
operatorId: string \| null\
controlRoomId: string\
location:\
lat: number\
lng: number\
what3words: string\
accuracy: number\
lastUpdated: timestamp\
additionalInfo: string\
status: \"pending\" \| \"accepted\" \| \"searching\" \| \"monitoring\"
\| \"closed\"\
passengerFeelsSafe: boolean\
createdAt: timestamp\
updatedAt: timestamp

17.2 Firestore Collections (Persistent Data)
--------------------------------------------

**users/{userId}**

name: string\
email: string\
phone: string\
dateOfBirth: date\
address: object\
emergencyContacts: array (up to 3)\
photoUrl: string\
linkedControlRoom: string\
safetyZonePostcode: string\
idVerified: boolean\
idVerifiedAt: timestamp\
sanctions: object (current sanction level, history)\
createdAt: timestamp\
lastLoginAt: timestamp

**alerts/{alertId}**

Full incident record as described in Section 15.1.

**controlRooms/{roomId}**

name: string\
coveragePostcodes: array\
coverageBoundary: GeoJSON polygon (future)\
operatingHours: string (\"24/7\" or specific hours)\
contactEmail: string\
contactPhone: string\
cameras: subcollection\
operators: subcollection\
status: \"active\" \| \"inactive\"\
partnerSince: timestamp

**operators/{operatorId}**

name: string\
email: string\
controlRoomId: string\
role: \"operator\" \| \"supervisor\" \| \"manager\"\
status: \"available\" \| \"busy\" \| \"break\" \| \"offline\"\
shiftStart: timestamp \| null\
dbsCheckDate: date\
createdAt: timestamp

**cameras/{cameraId}**

controlRoomId: string\
name: string\
lat: number\
lng: number\
type: \"fixed\" \| \"ptz\"\
fieldOfView: number (degrees)\
range: number (metres)\
vmsReference: string\
status: \"online\" \| \"offline\" \| \"maintenance\"

**welfare/{bookingId}**

userId: string\
alertId: string\
requestedDay: string\
requestedTime: string\
scheduledAt: timestamp\
officerId: string \| null\
status: \"booked\" \| \"attempted\" \| \"completed\" \|
\"not\_reached\"\
callOutcome: string \| null\
callNotes: string \| null\
completedAt: timestamp \| null

18. Security, Privacy & Compliance
==================================

**\[EXPANDED --- Prototype declared compliance but lacked
implementation\]**

18.1 Regulatory Framework
-------------------------

-   UK GDPR --- Full compliance required

-   Data Protection Act 2018

-   Surveillance Camera Code of Practice (Home Office)

-   Governing Law: England and Wales

-   IP Owner: E-SAF Systems Ltd

18.2 Data Protection Impact Assessment (DPIA)
---------------------------------------------

**\[NEW --- Legally mandatory\]**

A DPIA is mandatory under UK GDPR because E-SAF involves:

-   Large-scale processing of personal data

-   Systematic monitoring of public areas

-   Processing data of vulnerable individuals

The DPIA must be completed, documented, and reviewed before launch. It
must be updated when significant changes are made to the system.

18.3 ICO Registration
---------------------

**\[NEW\]**

E-SAF Systems Ltd must be registered with the Information
Commissioner\'s Office as a data controller. Annual registration
required.

18.4 Data Processing Agreements (DPAs)
--------------------------------------

**\[NEW\]**

Formal DPAs required with:

  **Third Party**            **Role**                                                **Data Shared**
  -------------------------- ------------------------------------------------------- -------------------------------------
  Google / Firebase          Data processor                                          All system data
  ID verification provider   Data processor                                          User identity documents (transient)
  SMS gateway provider       Data processor                                          Phone numbers, message content
  What3Words                 Data processor                                          GPS coordinates
  Each CCTV control room     Joint controller or processor (legal analysis needed)   Alert data, user data (red alerts)

 

18.5 Firebase Security Rules
----------------------------

**\[NEW --- Critical security gap\]**

Firebase Security Rules must enforce:

-   Authenticated users only (no anonymous access)

-   Users can only read/write their own data

-   Operators can only read alerts assigned to their control room

-   Alert creation goes through the API layer (not direct client writes)

-   Rate limiting at the database level as a defence-in-depth measure

18.6 Data Retention
-------------------

  **Data Type**            **Retention**            **After Expiry**
  ------------------------ ------------------------ ---------------------------------------------------------
  Alert / incident data    12 months from closure   Anonymised (user ID removed), statistical data retained
  User profile data        Duration of account      Deleted on account closure, incidents anonymised
  ID verification result   Duration of account      Deleted on account closure (document never stored)
  Operator action logs     24 months                Anonymised
  System logs              6 months                 Deleted
  Welfare call records     12 months                Anonymised

18.7 GDPR Data Subject Rights --- Implementation
------------------------------------------------

**\[NEW --- Prototype declared rights but had no implementation\]**

  **Right**                **Implementation**
  ------------------------ -------------------------------------------------------------------------------------------------------------------------
  Right of access          User can request data export via Profile \> My Data. Admin can generate on request. 30-day deadline.
  Right to rectification   User can edit profile data directly. For incident data, submit request to data\@esaf.co.uk.
  Right to erasure         Account deletion flow: confirm identity \> delete profile \> anonymise incidents \> confirm via email. 30-day deadline.
  Right to portability     Data export in machine-readable JSON format.
  Right to object          User can object to processing. If upheld, account is deactivated and data anonymised.

 

18.8 Security Measures
----------------------

-   All data encrypted in transit (TLS 1.2+)

-   All data encrypted at rest (Firebase default encryption)

-   No plaintext passwords --- Firebase Auth handles hashing

-   API authentication via Firebase Auth tokens

-   Input validation and sanitisation on all API endpoints

-   Rate limiting on alert creation (server-side enforcement of 2/day
    > limit)

-   Penetration testing before launch and annually thereafter

-   Vulnerability disclosure policy published on website

-   Data breach response plan documented and tested

18.9 Liability & Insurance
--------------------------

**\[NEW\]**

-   Professional indemnity insurance --- essential for a safety service

-   Public liability insurance --- coverage if system failure
    > contributes to harm

-   Cyber insurance --- data breach coverage

The \"no obligation to act\" clause in the T&Cs requires legal
stress-testing. Courts may find this unreasonable in a consumer contract
for a safety product. The gap between the T&Cs (\"no obligation\") and
the UI messaging (\"We Are With You\") must be addressed by legal
counsel.

19. Safeguarding & Duty of Care
===============================

**\[NEW --- Not addressed in prototype\]**

19.1 Safeguarding Policy
------------------------

E-SAF must have a formal Safeguarding Policy covering:

-   How concerns about vulnerable users are identified and escalated

-   Mandatory reporting obligations (child protection, vulnerable
    > adults)

-   A Designated Safeguarding Lead (DSL) within E-SAF

-   Training requirements for all staff and operators who interact with
    > user data

-   Data sharing protocols with social services and police when
    > safeguarding concerns arise

-   Annual safeguarding audit

19.2 Vulnerable User Considerations
-----------------------------------

  **User Group**              **Consideration**                                                              **Mitigation**
  --------------------------- ------------------------------------------------------------------------------ ---------------------------------------------------------------------------------------------------------------------------------
  Users aged 16-17            Parental consent required. Heightened duty of care.                            Age captured at registration. Parental consent flow. Flag to operator if user is under 18.
  Domestic violence victims   An abuser could gain access to the app and see alert history or track usage.   Alert history can be hidden via a \"safety mode\" in settings. Consider PIN-protected access to alert history.
  Mental health crisis        User may send red alert during a panic attack, not a physical threat.          Operator training on recognising mental health presentations. Welfare check-in is a key tool here.
  Frequent genuine users      Someone who genuinely feels unsafe often may hit sanctions thresholds.         Sanctions review workflow includes human judgement. Supervisors can override automatic flags.
  Users with disabilities     May struggle with hold-to-activate mechanism.                                  Accessibility alternatives needed (see Section 21). Consider voice activation or reduced hold time as an accessibility setting.

19.3 Operator Welfare
---------------------

-   Operators may witness distressing events via CCTV while using the
    > system

-   Employee Assistance Programme (EAP) access for all operators

-   Post-incident debriefing available after distressing incidents

-   Mandatory rest breaks during shifts

-   Supervisor check-ins on operator wellbeing

19.4 DBS Checks
---------------

All personnel with access to user personal data must have a current DBS
(Disclosure and Barring Service) check:

-   CCTV operators --- Standard DBS check

-   Welfare officers --- Enhanced DBS check (direct contact with
    > vulnerable people)

-   System administrators --- Standard DBS check

-   DBS check dates recorded in operator profile; renewal every 3 years

19.5 Duty of Care --- Messaging Calibration
-------------------------------------------

The prototype\'s \"We Are With You\" messaging creates a strong implied
duty of care. The T&Cs disclaim legal obligation. This creates a tension
that must be resolved:

-   Legal counsel must review all user-facing messaging for duty of care
    > implications

-   Consider replacing \"We Are With You\" with \"An operator is
    > monitoring your area\"

-   Ensure the disclaimer \"This is not an emergency service\" is
    > visible on the monitoring screen, not just during onboarding

-   The goal is to reassure without over-promising. The current wording
    > over-promises.

20. Misuse Policy & Sanctions
=============================

20.1 Permitted Use
------------------

-   Genuine belief of being unsafe in a public space

-   Maximum 2 alerts per 24-hour period (server-side enforced)

20.2 Graduated Sanctions
------------------------

  **Offence**                 **Sanction**                                  **Applied By**
  --------------------------- --------------------------------------------- --------------------------------------------
  1st false/malicious alert   Educational welfare call explaining impact    Welfare officer
  2nd false/malicious alert   Final warning call                            Welfare officer
  3rd false/malicious alert   Restricted to 1 alert per week for 6 months   Manager (with supervisor confirmation)
  4th false/malicious alert   3-month platform ban                          Manager (with supervisor confirmation)
  5th false/malicious alert   Permanent ban (UK-wide)                       System Admin (with manager recommendation)

20.3 Sanctions Workflow
-----------------------

**\[NEW --- Prototype had no enforcement mechanism\]**

-   Operator classifies alert at closure

-   If \"False\" or \"Malicious\": supervisor reviews and confirms
    > classification

-   Confirmed false/malicious alerts increment the user\'s offence count

-   When a threshold is reached, the system flags the user for sanction

-   A control room manager or system admin reviews and applies the
    > sanction

-   Sanctions are NEVER auto-applied --- human review is mandatory to
    > prevent sanctioning genuine users

-   User is notified of sanction via email and in-app notification

20.4 Appeals
------------

-   Contact: compliance\@esaf.co.uk

-   Appeals reviewed within 10 working days

-   Permanent bans: non-appealable for 12 months from date of ban. After
    > 12 months, one appeal is permitted.

-   Appeal outcome communicated via email

21. Accessibility
=================

**\[EXPANDED --- Prototype had basic responsive design only\]**

21.1 Compliance Target
----------------------

WCAG 2.1 Level AA compliance across both apps. This is a legal
requirement under the Equality Act 2010 for a public-facing digital
service.

21.2 Requirements
-----------------

  **Category**           **Requirement**
  ---------------------- ---------------------------------------------------------------------------------------------------------------
  Screen readers         All interactive elements have ARIA labels. Alert status changes announced. Timeline progression announced.
  Keyboard navigation    Every function accessible without touch or mouse. Tab order is logical. Focus indicators visible.
  Focus management       Screen transitions move focus to new content. Modal traps focus. Alert confirmation is announced.
  Colour contrast        All text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large text). Verified for both blue and red themes.
  Reduced motion         Respect prefers-reduced-motion. Disable pulse animations, screen transitions.
  Text scaling           Usable up to 200% browser zoom without layout breakage or content loss.
  Touch targets          Minimum 44x44px for all interactive elements (WCAG standard).
  Error identification   Form errors announced by screen readers, not just colour-coded.
  Alternative text       All images (including user photos displayed to operators) have descriptive alt text.
  Language               Page lang attribute set to \"en-GB\".

21.3 Additional Accessibility Considerations
--------------------------------------------

-   Hold-to-activate: provide an accessibility setting to reduce hold
    > time to 1 second, or offer a tap-then-confirm alternative

-   Easy Read versions of T&Cs and key safety messages for users with
    > learning disabilities

-   High contrast mode that follows OS system settings

-   Future: BSL (British Sign Language) video guides for Deaf users

22. Non-Functional Requirements
===============================

22.1 Performance
----------------

  **Metric**                                      **Target**
  ----------------------------------------------- --------------------------------------
  Alert delivery (user to control room)           \< 2 seconds (p95)
  Status update delivery (control room to user)   \< 2 seconds (p95)
  Location update frequency                       Every 10 seconds during active alert
  Page load time (passenger app)                  \< 3 seconds on 4G connection
  Page load time (control room)                   \< 2 seconds on broadband
  SMS delivery                                    \< 30 seconds (carrier-dependent)

22.2 Availability
-----------------

-   Target uptime: 99.9% (allows \~8.7 hours downtime per year)

-   Planned maintenance: scheduled outside peak hours (10 PM - 6 AM),
    > with 48-hour advance notice to control rooms

-   Status page: publicly accessible system status page for control room
    > managers

22.3 Scalability
----------------

-   Support up to 50 concurrent active alerts per control room

-   Support up to 100 control rooms nationally

-   Support up to 100,000 registered users

-   Horizontal scaling via Firebase infrastructure

22.4 Supported Platforms
------------------------

  **App**            **Platforms**                                                       **Minimum**
  ------------------ ------------------------------------------------------------------- --------------------------------------------
  Passenger App      iOS Safari 15+, Chrome Android 90+, Chrome Desktop, Firefox, Edge   Must work on devices from the last 4 years
  Control Room App   Chrome (primary), Edge, Safari on iPad                              Minimum screen width: 768px (tablet)
  Admin Panel        Chrome, Edge, Firefox                                               Desktop only, minimum 1024px width

22.5 Monitoring & Alerting
--------------------------

**\[NEW\]**

-   Error monitoring: Sentry (or equivalent) for both apps + API layer

-   Uptime monitoring: external pinger checking app availability every
    > 60 seconds

-   Firebase usage monitoring: connection count, read/write operations,
    > bandwidth

-   Alerting: PagerDuty / Opsgenie for critical issues (system down,
    > Firebase errors, SMS gateway failure)

-   On-call rota for E-SAF engineering team

23. Testing Strategy
====================

**\[NEW --- No testing strategy in prototype\]**

  **Test Type**           **Scope**                                                                                     **Tooling**                          **Frequency**
  ----------------------- --------------------------------------------------------------------------------------------- ------------------------------------ ------------------------------------
  Unit tests              All business logic: alert routing, sanctions, postcode matching, timer logic, rate limiting   Jest / Vitest                        Every commit (CI)
  Integration tests       Firebase sync, SMS delivery, location services, auth flows                                    Cypress / Playwright                 Every PR
  End-to-end tests        Full alert lifecycle: passenger app \> control room \> closure                                Playwright                           Every release
  Load testing            Concurrent alerts, concurrent users, Firebase connection limits                               k6 / Artillery                       Before launch, then quarterly
  Penetration testing     Firebase security rules, API endpoints, auth flows, data exposure                             External security firm               Before launch, then annually
  Accessibility testing   WCAG 2.1 AA compliance                                                                        axe + manual screen reader testing   Every release
  Usability testing       With actual target users including vulnerable populations                                     Facilitated sessions                 Before launch, after major changes
  Device testing          Supported browser/device matrix                                                               BrowserStack / real devices          Every release
  Failover testing        Firebase outage, SMS failure, connection loss scenarios                                       Manual + automated                   Before launch, then annually

24. Business & Operational Requirements
=======================================

**\[NEW --- Not addressed in prototype\]**

24.1 Business Model
-------------------

To be defined by E-SAF leadership. Options to evaluate:

-   Local authority subscription: annual fee per control room

-   Per-user fee: charged to the local authority based on linked user
    > count

-   Grant-funded: government safety grants (Home Office, local
    > authority)

-   Hybrid: base subscription + per-alert fee above threshold

The app must be free to citizens. Revenue comes from control room
partnerships.

24.2 Service Level Agreements
-----------------------------

SLAs with control room partners should cover:

-   System uptime guarantee (99.9% target)

-   Alert delivery latency (\< 2 seconds)

-   Support response times: Critical (1 hour), High (4 hours), Medium (1
    > business day)

-   Planned maintenance notification (48 hours advance)

-   Data breach notification (within 72 hours per GDPR)

24.3 Support Model
------------------

-   User support: email (support\@esaf.co.uk) + in-app help centre / FAQ

-   Control room technical support: phone + email, 24/7 for critical
    > issues

-   Incident response: documented plan for system failures

-   Escalation path: L1 (help desk) \> L2 (engineering) \> L3 (on-call
    > lead)

24.4 Standard Operating Procedures
----------------------------------

SOPs must be documented for:

-   Operator: handling a blue alert (step-by-step)

-   Operator: handling a red alert

-   Operator: escalating to emergency services

-   Operator: handling grouped alerts

-   Operator: shift handover

-   Supervisor: alert queue management

-   Manager: applying sanctions

-   Manager: handling a GDPR request

-   E-SAF: onboarding a new control room

-   E-SAF: responding to a data breach

-   E-SAF: responding to a system outage

24.5 Control Room Onboarding
----------------------------

Process for bringing a new control room live:

-   1\. Commercial agreement signed

-   2\. Data sharing agreement and DPA signed

-   3\. Camera database loaded (camera positions, IDs, VMS references)

-   4\. Postcode coverage area configured

-   5\. Operator accounts created

-   6\. Operator training delivered (staging environment)

-   7\. User acceptance testing with simulated alerts

-   8\. Go-live with limited user rollout

-   9\. Full public availability for the coverage area

Estimated timeline per control room: 4-6 weeks from agreement to
go-live.

25. Design System
=================

25.1 Passenger App --- Light Theme
----------------------------------

  **Token**          **Blue Mode**                 **Red Mode**
  ------------------ ----------------------------- -----------------------------
  accent             \#1d4ed8                      \#dc2626
  accent-light       \#dbeafe                      \#fee2e2
  accent-border      \#3b82f6                      \#ef4444
  accent-dark        \#1e3a8a                      \#7f1d1d
  primary-gradient   135deg \#1d4ed8 to \#3b82f6   135deg \#dc2626 to \#ef4444

Theme switching: Red theme CSS class applied to all screen elements when
red alert sent. Removed on return to home.

25.2 Control Room App --- Dark Theme
------------------------------------

  **Token**        **Value**
  ---------------- -----------
  background       \#0a0f1e
  card-bg          \#1e293b
  text-primary     \#e2e8f0
  text-secondary   \#94a3b8
  blue-accent      \#3b82f6
  red-danger       \#ef4444
  green-success    \#22c55e
  amber-warning    \#f59e0b
  border           \#334155

25.3 Typography
---------------

Passenger App:

  **Element**   **Size**   **Weight**   **Colour**
  ------------- ---------- ------------ ------------
  H1            24px       800          \#0f172a
  H2            20px       700          \#0f172a
  Body          14px       400          \#475569
  Small         11px       400          \#94a3b8
  Labels        13px       600          \#374151

Control Room App:

  **Element**   **Size**   **Weight**   **Colour**
  ------------- ---------- ------------ ----------------------------
  H1            22px       800          \#e2e8f0
  H2            18px       700          \#e2e8f0
  Body          13px       400          \#94a3b8
  Labels        10-11px    600          Uppercase, reduced opacity

25.4 Components
---------------

Buttons:

  **Type**       **Padding**   **Radius**   **Style**
  -------------- ------------- ------------ ----------------------------------------------------
  Primary        18px          14px         Gradient bg, white text, box-shadow
  Secondary      18px          14px         Light grey bg (\#f1f5f9), 2px border
  Outline        18px          14px         Transparent bg, themed 2px border
  Alert (Blue)   30px 20px     20px         \#1d4ed8 to \#3b82f6 gradient, 3px border \#60a5fa
  Alert (Red)    30px 20px     20px         \#991b1b to \#dc2626 gradient, 3px border \#f87171

Alert button specifications: Font size 20px, weight 800. User-select:
none. Active state: scale 0.97.

25.5 Animations
---------------

  **Animation**            **Duration**    **Details**
  ------------------------ --------------- ---------------------------------
  Screen fade-in           0.3s ease       Opacity 0 to 1
  Button transitions       0.1-0.2s        Scale and colour change
  Timeline pulse           1.5s infinite   Opacity 1 to 0.6 on active step
  Status dot blink         2s cycle        Control room idle indicator
  Red alert border pulse   2s cycle        \#ef4444 to \#fca5a5
  Group card hover         Instant         Scale 1.03x
  Button press             Instant         Scale 0.98x

All animations must respect prefers-reduced-motion media query.

26. Edge Cases & Error Handling
===============================

26.1 Passenger App
------------------

  **Scenario**                               **Handling**
  ------------------------------------------ -----------------------------------------------------------------------------------------------------------------------
  Alert button released before 3 seconds     No alert sent, button resets. No side effects.
  Postcode not covered                       \"Area Not Yet Covered\" screen with options to request coverage or retry.
  No postcode entered                        Validation: \"Please enter a postcode.\"
  Welfare booking without day/time           Validation: \"Please select a day and time.\"
  User closes app during active alert        Push notification if available. If web-only, warn: \"Please keep the app open during your alert.\"
  Multiple alerts in 24 hours (\> 2)         Server-side rejection. User sees: \"You have reached your daily alert limit.\"
  Photo capture fails                        Allow skip with warning: \"Without a photo, operators cannot visually identify you.\"
  \"I Feel Safe Now\" pressed accidentally   Confirmation dialog required before closure.
  GPS permission denied                      Alert functionality blocked. Clear message with instructions to enable.
  GPS unavailable (indoors/tunnel)           Use last known location if \< 5 min old. Flag accuracy to operator.
  No internet connection                     \"No Connection\" banner. Queue alert locally. Send when connection restored.
  Connection lost during active alert        \"Connection Lost\" warning. Auto-reconnect. Operator notified.
  No operator accepts within 2 minutes       Status message: \"Still connecting you.\" At 5 min: option to call 999.
  User is sanctioned                         Alert button reflects restriction. If banned, alert button disabled entirely.
  User sends alert outside safety zone       Allowed. Route to nearest control room based on live GPS.
  User phone battery critical (\< 5%)        Warning: \"Your battery is low. If your phone dies, the operator will continue monitoring your last known location.\"

26.2 Control Room App
---------------------

  **Scenario**                             **Handling**
  ---------------------------------------- --------------------------------------------------------------------------------
  Operator temporarily unavailable         Alert returns to queue for another operator.
  Still searching CCTV, cannot find user   Log entry. Stay on search screen. After 10 min: suggest escalation.
  No additional info from user             Placeholder: \"No additional information provided.\"
  Timer reaches 0:00                       Visual + audio warning. No auto-close. Operator must act.
  Feedback not classified                  Cannot proceed without classification. Validation alert.
  Multiple users at same location          Auto-grouped within 30m. Group actions apply to all.
  Duplicate escalation press               Button shows \"Notified\" state. Prevents repeat.
  Operator system crashes during alert     Alert returns to queue after 60 seconds of inactivity. Supervisor notified.
  Shift ends with active alert             Cannot sign out. Must handover or close alert first.
  Mixed severity in group (blue + red)     Group inherits highest severity. Red banner displayed.
  User calls 999 independently             No automatic coordination. Future: user can flag \"I have called 999\" in app.
  Camera offline at alert location         Flagged to operator: \"Camera X is offline.\" Suggest adjacent cameras.
  Control room loses internet              Alert stays in Firebase. Alert queue persists. Reconnect shows all pending.

27. Rollout Strategy
====================

**\[NEW\]**

Phase 1: Foundation
-------------------

Build the production infrastructure. No public users.

-   Fix concurrent alert architecture

-   Implement authentication (all apps)

-   Build API layer with server-side validation

-   Implement real GPS location capture and tracking

-   Firebase Security Rules

-   Basic incident database

-   Environment setup (dev, staging, production)

Phase 2: Pilot Preparation
--------------------------

Everything needed for a single control room pilot.

-   SMS gateway integration

-   Control room audio alerts

-   Offline / connectivity handling

-   Camera database for pilot control room

-   Operator authentication and identity tracking

-   Basic admin panel

-   Complete DPIA

-   Safeguarding policy

-   Operator SOPs and training

-   Penetration testing

-   Legal review of T&Cs

Phase 3: Pilot (Herts CCTV Partnership)
---------------------------------------

Limited public deployment with first partner.

-   Onboard Herts CCTV Partnership (cameras, operators, training)

-   Invite-only user rollout (100 users)

-   Monitor alert volume, response times, system stability

-   Iterate based on operator and user feedback

-   Expand to open registration for Hertfordshire

Phase 4: Public Launch
----------------------

Full feature set for public availability.

-   Full accessibility (WCAG 2.1 AA)

-   Account management and GDPR workflows

-   Reporting and analytics

-   Welfare system backend

-   Load testing at scale

-   ICO registration

-   Insurance

-   Support model operational

-   Public launch for pilot area

Phase 5: National Scale
-----------------------

Multi-control room expansion.

-   Full postcode routing database

-   Multi-control room admin

-   Operator shift management

-   Cross-jurisdiction user handoff

-   Control room onboarding playbook

-   Native mobile app evaluation

-   Emergency services data sharing agreements

-   National reporting framework

28. Appendices
==============

Appendix A: Key Functions (Passenger App --- From Prototype)
------------------------------------------------------------

  **Function**                   **Purpose**
  ------------------------------ --------------------------------------------
  goToScreen(num)                Navigate between screens
  startHold()                    Begin 3-second alert countdown
  cancelHold()                   Cancel alert if released early
  activateAlert(type)            Process alert, sync to Firebase
  progressWorkflow()             Advance timeline steps
  updateWorkflowFromOperator()   Handle Firebase operator status changes
  sendAdditionalInfo()           Send user message to operator via Firebase
  feelSafeNow()                  Trigger incident closure with confirmation
  checkPostcode()                Validate postcode, route to control room
  selectDay() / selectTime()     Welfare scheduling selection
  bookWelfare()                  Confirm welfare check-in booking
  finishAndReturn()              Reset app state after incident
  quickLogin()                   Returning user fast path to alert screen
  updateTCButton()               T&C validation state management
  checkScroll()                  Enforce T&C scroll-to-bottom requirement

Appendix B: Contact Points
--------------------------

  **Purpose**                             **Contact**
  --------------------------------------- ------------------------
  Data access / rectification / erasure   data\@esaf.co.uk
  Misuse appeals                          compliance\@esaf.co.uk
  User support                            support\@esaf.co.uk
  Control room technical support          TBD (phone + email)
  IP Owner                                E-SAF Systems Ltd

Appendix C: Glossary
--------------------

  **Term**       **Definition**
  -------------- ------------------------------------------------------------------------------------------------------------
  Blue Alert     Lower-severity alert indicating the user feels unsafe. User identity not shared with operator.
  Red Alert      Higher-severity alert indicating the user is in danger. User identity shared with operator.
  Safety Zone    The geographic area where a user has registered for CCTV monitoring coverage.
  Control Room   A CCTV monitoring facility operated by or on behalf of a local authority.
  VMS            Video Management System --- the software used by control rooms to manage camera feeds.
  What3Words     A geocoding system that divides the world into 3m squares, each with a unique three-word address.
  DPIA           Data Protection Impact Assessment --- a legal requirement under UK GDPR for high-risk processing.
  DBS            Disclosure and Barring Service --- UK background check system for people working with vulnerable groups.
  CAD            Computer Aided Dispatch --- system used by emergency services to manage incident response.
  RTDB           Firebase Realtime Database --- used for live alert state synchronisation.
  DSL            Designated Safeguarding Lead --- the named individual responsible for safeguarding within an organisation.

Appendix D: Document History
----------------------------

  **Version**   **Date**     **Author**                                   **Changes**
  ------------- ------------ -------------------------------------------- ----------------------------------------------------------
  1.0           2026-02-18   Claude (reverse-engineered from prototype)   Initial reverse-engineered PRD from Ash\'s concept
  1.1           2026-02-18   Claude (redline review)                      Gap analysis identifying 25 areas needing attention
  2.0           2026-02-18   Signal One                                   Merged production PRD incorporating all redline findings
