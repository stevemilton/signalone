// ============================================================
// E-SAF Civic — Core Type Definitions
// ============================================================

// --- Alert Types ---

export type AlertType = 'blue' | 'red'

export type AlertStatus =
  | 'pending'
  | 'awaiting_review'
  | 'accepted'
  | 'searching'
  | 'monitoring'
  | 'closed'
  | 'cancelled'
  | 'expired'

export type OperatorStatus =
  | 'operator_searching'
  | 'temporarily_unavailable'
  | 'visual_confirmed'

export type AlertClassification =
  | 'genuine'
  | 'false_alert'
  | 'malicious'
  | 'unclear'

export interface GeoLocation {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

export interface Alert {
  id: string
  alertType: AlertType
  userId: string
  operatorId: string | null
  controlRoomId: string
  status: AlertStatus
  operatorStatus: OperatorStatus | null
  location: GeoLocation
  locationName: string
  riskPostcode: string
  what3words: string
  additionalInfo: string
  passengerFeelsSafe: boolean
  // Red alert only fields
  userName: string | null
  userAge: string | null
  userPhoto: string | null
  // Timestamps
  createdAt: number
  acceptedAt: number | null
  locatedAt: number | null
  closedAt: number | null
  // Metadata
  classification: AlertClassification | null
  operatorNotes: string | null
  escalations: Escalation[]
  incidentLog: IncidentLogEntry[]
  groupId: string | null
  duration: number | null
}

export interface IncidentLogEntry {
  timestamp: number
  message: string
  actor: 'system' | 'operator' | 'user'
}

export interface Escalation {
  service: 'police' | 'ambulance' | 'fire' | 'supervisor'
  timestamp: number
  operatorId: string
}

// --- Real-time Alert State (Firebase RTDB) ---

export interface RealtimeAlertState {
  alertType: AlertType
  status: AlertStatus
  operatorStatus: OperatorStatus | null
  additionalInfo: string
  passengerFeelsSafe: boolean
  location: GeoLocation
  what3words?: string
  updatedAt: number
}

// --- User Types ---

export type UserRole = 'citizen' | 'operator' | 'supervisor' | 'control_room_manager' | 'admin'

export type SanctionLevel = 'none' | 'warning_1' | 'warning_2' | 'restricted' | 'banned_3m' | 'banned_permanent'

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string
  phone: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  photoUrl: string | null
  idDocumentUrl: string | null
  riskPostcode: string
  controlRoomId: string | null
  safetyZone: string
  locationName: string
  what3words: string
  idVerified: boolean
  termsAcceptedAt: number | null
  sanctionLevel: SanctionLevel
  sanctionExpiresAt: number | null
  alertsToday: number
  lastAlertDate: string | null
  activeAlertId: string | null
  fcmTokens: string[]
  createdAt: number
  updatedAt: number
}

// --- Control Room Types ---

export interface ControlRoom {
  id: string
  name: string
  coveragePostcodes: string[]
  operatingHours: string
  address: string
  phone: string
  email: string
  isActive: boolean
  operators: string[] // operator user IDs
  cameras: Camera[]
  createdAt: number
  updatedAt: number
}

export interface Camera {
  id: string
  name: string
  location: GeoLocation
  locationName: string
  type: 'fixed' | 'ptz'
  status: 'online' | 'offline'
  controlRoomId: string
}

// --- Operator Types ---

export interface Operator {
  id: string
  userId: string
  controlRoomId: string
  status: 'available' | 'busy' | 'on_break' | 'offline'
  activeAlerts: string[]
  shiftStart: number | null
  shiftEnd: number | null
  alertsHandled: number
  createdAt: number
}

// --- Welfare Types ---

export interface WelfareBooking {
  id: string
  userId: string
  alertId: string
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled'
  notes: string | null
  officerId: string | null
  createdAt: number
}

// --- Incident Types ---

export interface Incident {
  id: string
  alertId: string
  referenceNumber: string
  userId: string
  operatorId: string
  controlRoomId: string
  alertType: AlertType
  classification: AlertClassification | null
  operatorNotes: string | null
  escalations: Escalation[]
  incidentLog: IncidentLogEntry[]
  location: GeoLocation
  locationName: string
  duration: number
  createdAt: number
  closedAt: number
  reviewedBy: string | null
  reviewedAt: number | null
}

// --- Analytics Types ---

export interface DashboardStats {
  blueAlertsToday: { raised: number; accepted: number }
  redAlertsToday: { raised: number; accepted: number }
  linkedUsers: number
  systemStatus: 'online' | 'offline' | 'degraded'
}

// --- Alert Group Types ---

export interface AlertGroup {
  id: string
  alertIds: string[]
  location: GeoLocation
  locationName: string
  what3words: string
  createdAt: number
  status: 'active' | 'closed'
}
