import { Resend } from 'resend'
import { adminDb } from '@/lib/firebase/admin'
import { emailLayout } from './templates'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const EMAIL_FROM = process.env.EMAIL_FROM || 'Signal One <noreply@polarindustries.co>'

/**
 * Low-level email send via Resend. Logs to Firestore `emailLogs`.
 * Fire-and-forget: never throws, never blocks API responses.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    if (!resend) {
      console.warn('Email skipped: RESEND_API_KEY not configured')
      return
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })

    // Audit log
    await adminDb.collection('emailLogs').add({
      to,
      subject,
      resendId: data?.id || null,
      error: error?.message || null,
      sentAt: Date.now(),
    })

    if (error) {
      console.error('Resend error:', error.message)
    }
  } catch (err) {
    console.error('Email send failed (non-blocking):', err)
  }
}

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

interface EmailUser {
  email?: string
  fullName?: string
}

interface EmailAlert {
  id?: string
  alertType?: string
  locationName?: string
  createdAt?: number
}

interface EmailIncident {
  referenceNumber?: string
  classification?: string | null
  duration?: number
  operatorNotes?: string | null
  closedAt?: number
}

interface EmailBooking {
  id?: string
  scheduledDate?: string
  scheduledTime?: string
  notes?: string | null
}

/** Welcome email sent on registration. */
export function sendWelcomeEmail(user: EmailUser): void {
  if (!user.email) return

  const body = `
    <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:20px;">Welcome to Signal One</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${user.fullName || 'there'},
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Your account has been created successfully. Signal One connects you with local CCTV control room operators when you feel unsafe in a public space.
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      <strong>What you can do now:</strong>
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8;">
      <li>Complete your profile and verify your identity</li>
      <li>Set your safety zone and emergency contacts</li>
      <li>Raise a Blue or Red alert when you need assistance</li>
    </ul>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
      Stay safe,<br />The Signal One Team
    </p>`

  sendEmail(user.email, 'Welcome to Signal One', emailLayout('Welcome to Signal One', body))
}

/** Notification when an operator accepts the citizen's alert. */
export function sendAlertAcceptedEmail(user: EmailUser, alert: EmailAlert): void {
  if (!user.email) return

  const typeLabel = alert.alertType === 'red' ? 'Red (Emergency)' : 'Blue (Non-Emergency)'

  const body = `
    <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:20px;">Your Alert Has Been Accepted</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${user.fullName || 'there'},
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      A control room operator is now actively monitoring your <strong>${typeLabel}</strong> alert.
    </p>
    <table role="presentation" style="margin:0 0 16px;border-collapse:collapse;">
      <tr>
        <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px;">Location:</td>
        <td style="padding:4px 0;color:#374151;font-size:14px;font-weight:600;">${alert.locationName || 'Unknown'}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px;">Alert ID:</td>
        <td style="padding:4px 0;color:#374151;font-size:14px;font-family:monospace;">${alert.id || 'N/A'}</td>
      </tr>
    </table>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
      Keep the app open so the operator can track your location and status in real time.
    </p>`

  sendEmail(user.email, 'Your Alert Has Been Accepted — Signal One', emailLayout('Alert Accepted', body))
}

/** Incident summary sent when an alert is closed. */
export function sendAlertClosedEmail(user: EmailUser, alert: EmailAlert, incident: EmailIncident): void {
  if (!user.email) return

  const durationMins = incident.duration ? Math.ceil(incident.duration / 60) : 0
  const closedDate = incident.closedAt ? new Date(incident.closedAt).toLocaleString('en-GB') : 'N/A'

  const body = `
    <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:20px;">Incident Report</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${user.fullName || 'there'},
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Your alert has been closed. Here is a summary of the incident:
    </p>
    <table role="presentation" style="margin:0 0 16px;border-collapse:collapse;width:100%;">
      <tr>
        <td style="padding:8px 12px;background-color:#f9fafb;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;">Reference</td>
        <td style="padding:8px 12px;background-color:#f9fafb;color:#374151;font-size:14px;font-weight:600;font-family:monospace;border:1px solid #e5e7eb;">${incident.referenceNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;">Location</td>
        <td style="padding:8px 12px;color:#374151;font-size:14px;border:1px solid #e5e7eb;">${alert.locationName || 'Unknown'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background-color:#f9fafb;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;">Duration</td>
        <td style="padding:8px 12px;background-color:#f9fafb;color:#374151;font-size:14px;border:1px solid #e5e7eb;">${durationMins} minute${durationMins !== 1 ? 's' : ''}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;">Closed at</td>
        <td style="padding:8px 12px;color:#374151;font-size:14px;border:1px solid #e5e7eb;">${closedDate}</td>
      </tr>
      ${incident.operatorNotes ? `
      <tr>
        <td style="padding:8px 12px;background-color:#f9fafb;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;">Notes</td>
        <td style="padding:8px 12px;background-color:#f9fafb;color:#374151;font-size:14px;border:1px solid #e5e7eb;">${incident.operatorNotes}</td>
      </tr>` : ''}
    </table>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
      If you need further assistance or wish to provide feedback, please contact us through the app.
    </p>`

  sendEmail(user.email, `Incident Report ${incident.referenceNumber || ''} — Signal One`, emailLayout('Incident Report', body))
}

/** Warning/ban notice after a malicious classification. */
export function sendMaliciousWarningEmail(user: EmailUser, sanctionLevel: string): void {
  if (!user.email) return

  const levelDescriptions: Record<string, string> = {
    warning_1: 'This is your <strong>first warning</strong>. Repeated misuse may result in further restrictions on your account.',
    warning_2: 'This is your <strong>second warning</strong>. Any further misuse will result in restricted access to the platform.',
    restricted: 'Your account is now <strong>restricted</strong>. Further misuse will result in a temporary ban.',
    banned_3m: 'Your account has been <strong>temporarily banned for 90 days</strong>. You will not be able to raise alerts during this period.',
    banned_permanent: 'Your account has been <strong>permanently banned</strong>. You will no longer be able to use Signal One services.',
  }

  const description = levelDescriptions[sanctionLevel] || 'Your account has been reviewed following a misuse report.'

  const body = `
    <h2 style="margin:0 0 16px;color:#dc2626;font-size:20px;">Account Notice</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${user.fullName || 'there'},
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      A recent alert you raised has been reviewed and classified as <strong>malicious</strong> — meaning it was raised without genuine cause.
    </p>
    <div style="margin:0 0 16px;padding:16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
        ${description}
      </p>
    </div>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
      Signal One is a safety platform for genuine emergencies. Misuse diverts resources from people who genuinely need help. If you believe this decision was made in error, please contact support through the app.
    </p>`

  sendEmail(user.email, 'Account Notice — Signal One', emailLayout('Account Notice', body))
}

/** Welfare check-in booking confirmation. */
export function sendWelfareBookingEmail(user: EmailUser, booking: EmailBooking): void {
  if (!user.email) return

  const body = `
    <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:20px;">Welfare Check-In Confirmed</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${user.fullName || 'there'},
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Your welfare check-in has been booked. Here are the details:
    </p>
    <table role="presentation" style="margin:0 0 16px;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 12px 8px 0;color:#6b7280;font-size:14px;">Date:</td>
        <td style="padding:8px 0;color:#374151;font-size:14px;font-weight:600;">${booking.scheduledDate || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#6b7280;font-size:14px;">Time:</td>
        <td style="padding:8px 0;color:#374151;font-size:14px;font-weight:600;">${booking.scheduledTime || 'N/A'}</td>
      </tr>
      ${booking.notes ? `
      <tr>
        <td style="padding:8px 12px 8px 0;color:#6b7280;font-size:14px;">Notes:</td>
        <td style="padding:8px 0;color:#374151;font-size:14px;">${booking.notes}</td>
      </tr>` : ''}
    </table>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
      An officer will contact you at the scheduled time. If you need to reschedule or cancel, please do so through the app.
    </p>`

  sendEmail(user.email, 'Welfare Check-In Confirmed — Signal One', emailLayout('Welfare Check-In', body))
}
