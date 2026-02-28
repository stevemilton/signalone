/**
 * Seed test accounts: citizen, operator, and admin.
 *
 * Usage:
 *   cd app && npx tsx scripts/seed-test-accounts.ts
 *
 * Requires .env.local to be loaded — uses dotenv inline.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local')
const envFile = readFileSync(envPath, 'utf-8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx)
  let value = trimmed.slice(eqIdx + 1)
  // Strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  process.env[key] = value
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  } as ServiceAccount),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
})

const auth = getAuth(app)
const db = getFirestore(app)

interface TestAccount {
  email: string
  password: string
  fullName: string
  role: 'citizen' | 'operator' | 'admin'
  phone: string
  address: string
  riskPostcode: string
}

const accounts: TestAccount[] = [
  {
    email: 'citizen@test.signalone.app',
    password: 'Test1234!',
    fullName: 'Test Citizen',
    role: 'citizen',
    phone: '07700 900001',
    address: '12 High Street, Stevenage, SG1 1AA',
    riskPostcode: 'SG1 1AA',
  },
  {
    email: 'operator@test.signalone.app',
    password: 'Test1234!',
    fullName: 'Test Operator',
    role: 'operator',
    phone: '07700 900002',
    address: 'CCTV Control Room, Stevenage, SG1 1AB',
    riskPostcode: 'SG1 1AB',
  },
  {
    email: 'admin@test.signalone.app',
    password: 'Test1234!',
    fullName: 'Test Admin',
    role: 'admin',
    phone: '07700 900003',
    address: 'Signal One HQ, Stevenage, SG1 1AC',
    riskPostcode: 'SG1 1AC',
  },
]

async function createOrUpdate(acct: TestAccount) {
  const now = Date.now()

  // Create or fetch Auth user
  let uid: string
  try {
    const existing = await auth.getUserByEmail(acct.email)
    uid = existing.uid
    console.log(`  Auth user exists: ${acct.email} (${uid})`)
  } catch {
    const created = await auth.createUser({
      email: acct.email,
      password: acct.password,
      displayName: acct.fullName,
    })
    uid = created.uid
    console.log(`  Auth user created: ${acct.email} (${uid})`)
  }

  // Set custom claims
  await auth.setCustomUserClaims(uid, { role: acct.role })

  // Upsert Firestore user document
  await db.collection('users').doc(uid).set(
    {
      id: uid,
      email: acct.email,
      role: acct.role,
      fullName: acct.fullName,
      phone: acct.phone,
      address: acct.address,
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '07700 900999',
      photoUrl: null,
      idDocumentUrl: null,
      riskPostcode: acct.riskPostcode,
      controlRoomId: acct.role === 'operator' ? 'herts-cctv' : null,
      safetyZone: '',
      locationName: '',
      what3words: '',
      idVerified: true,
      termsAcceptedAt: now,
      sanctionLevel: 'none',
      sanctionExpiresAt: null,
      alertsToday: 0,
      lastAlertDate: null,
      activeAlertId: null,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  )

  // If operator, also create an operator document
  if (acct.role === 'operator') {
    const operatorId = `op-${uid}`
    await db.collection('operators').doc(operatorId).set(
      {
        id: operatorId,
        userId: uid,
        controlRoomId: 'herts-cctv',
        status: 'available',
        activeAlerts: [],
        shiftStart: now,
        shiftEnd: null,
        alertsHandled: 0,
        createdAt: now,
      },
      { merge: true }
    )
    console.log(`  Operator record created: ${operatorId}`)
  }

  // Seed the control room document if it doesn't exist
  const crRef = db.collection('controlRooms').doc('herts-cctv')
  const crDoc = await crRef.get()
  if (!crDoc.exists) {
    await crRef.set({
      id: 'herts-cctv',
      name: 'Herts CCTV Partnership',
      coveragePostcodes: ['SG', 'AL', 'WD', 'EN', 'HP'],
      operatingHours: '24/7',
      address: 'CCTV Suite, Stevenage Borough Council, SG1 1HN',
      phone: '01438 242242',
      email: 'cctv@hertfordshire.gov.uk',
      isActive: true,
      operators: [],
      cameras: [],
      createdAt: now,
      updatedAt: now,
    })
    console.log('  Control room "herts-cctv" created')
  }

  return uid
}

async function main() {
  console.log('Seeding test accounts...\n')

  for (const acct of accounts) {
    console.log(`[${acct.role.toUpperCase()}]`)
    await createOrUpdate(acct)
    console.log()
  }

  console.log('Done! Test credentials:')
  console.log('  Citizen:  citizen@test.signalone.app  / Test1234!')
  console.log('  Operator: operator@test.signalone.app / Test1234!')
  console.log('  Admin:    admin@test.signalone.app    / Test1234!')

  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
