/**
 * Bulk-import cameras from a CSV file into Firestore.
 *
 * Usage:
 *   cd app && npx tsx scripts/import-cameras.ts --file cameras.csv --control-room herts-cctv [--dry-run]
 *
 * Expected CSV format (header row required):
 *   name,lat,lng,locationName,type,status,vmsReference,bearing,fieldOfView,tags
 *   "High Street NE",51.9019,-0.2020,"High Street / Queensway",ptz,online,"STV-HS-NE-01",45,90,"town_centre;junction"
 *
 * Requires .env.local to be loaded — uses inline dotenv.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// Load .env.local manually (same pattern as seed-test-accounts.ts)
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, '../.env.local')
const envFile = readFileSync(envPath, 'utf-8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx)
  let value = trimmed.slice(eqIdx + 1)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  process.env[key] = value
}

// ---------------------------------------------------------------------------
// Firebase init
// ---------------------------------------------------------------------------
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  } as ServiceAccount),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
})
const db = getFirestore(app)

// ---------------------------------------------------------------------------
// Geohash (standalone copy — avoids importing from src with path aliases)
// ---------------------------------------------------------------------------
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
function encodeGeohash(lat: number, lng: number, precision = 9): string {
  let latMin = -90, latMax = 90
  let lngMin = -180, lngMax = 180
  let hash = '', bit = 0, ch = 0, isLng = true
  while (hash.length < precision) {
    if (isLng) {
      const mid = (lngMin + lngMax) / 2
      if (lng >= mid) { ch |= 1 << (4 - bit); lngMin = mid } else { lngMax = mid }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) { ch |= 1 << (4 - bit); latMin = mid } else { latMax = mid }
    }
    isLng = !isLng
    bit++
    if (bit === 5) { hash += BASE32[ch]; bit = 0; ch = 0 }
  }
  return hash
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2)
  let file = ''
  let controlRoom = ''
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) { file = args[++i] }
    else if (args[i] === '--control-room' && args[i + 1]) { controlRoom = args[++i] }
    else if (args[i] === '--dry-run') { dryRun = true }
  }

  if (!file || !controlRoom) {
    console.error('Usage: npx tsx scripts/import-cameras.ts --file <csv> --control-room <id> [--dry-run]')
    process.exit(1)
  }

  return { file: resolve(process.cwd(), file), controlRoom, dryRun }
}

// ---------------------------------------------------------------------------
// CSV parsing (simple — handles quoted fields with commas)
// ---------------------------------------------------------------------------
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
interface CameraRow {
  name: string
  lat: number
  lng: number
  locationName: string
  type: 'fixed' | 'ptz'
  status: 'online' | 'offline'
  vmsReference: string
  bearing: number | null
  fieldOfView: number | null
  tags: string[]
}

function validateRow(fields: string[], headers: string[], lineNum: number): CameraRow | null {
  const get = (name: string) => {
    const idx = headers.indexOf(name)
    return idx >= 0 ? fields[idx] ?? '' : ''
  }

  const name = get('name')
  const lat = parseFloat(get('lat'))
  const lng = parseFloat(get('lng'))
  const locationName = get('locationName')
  const type = get('type')
  const status = get('status') || 'online'
  const vmsReference = get('vmsReference')
  const bearingStr = get('bearing')
  const fovStr = get('fieldOfView')
  const tagsStr = get('tags')

  const errors: string[] = []
  if (!name) errors.push('missing name')
  if (isNaN(lat) || lat < -90 || lat > 90) errors.push(`invalid lat "${get('lat')}"`)
  if (isNaN(lng) || lng < -180 || lng > 180) errors.push(`invalid lng "${get('lng')}"`)
  if (!['fixed', 'ptz'].includes(type)) errors.push(`invalid type "${type}"`)
  if (!['online', 'offline'].includes(status)) errors.push(`invalid status "${status}"`)
  if (!vmsReference) errors.push('missing vmsReference')

  if (errors.length) {
    console.error(`  Line ${lineNum}: SKIP — ${errors.join(', ')}`)
    return null
  }

  return {
    name,
    lat,
    lng,
    locationName: locationName || name,
    type: type as 'fixed' | 'ptz',
    status: status as 'online' | 'offline',
    vmsReference,
    bearing: bearingStr ? parseFloat(bearingStr) : null,
    fieldOfView: fovStr ? parseFloat(fovStr) : null,
    tags: tagsStr ? tagsStr.split(';').map((t) => t.trim()).filter(Boolean) : [],
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { file, controlRoom, dryRun } = parseArgs()

  console.log(`Importing cameras from: ${file}`)
  console.log(`Control room: ${controlRoom}`)
  console.log(`Dry run: ${dryRun}\n`)

  // Verify control room exists
  const crDoc = await db.collection('controlRooms').doc(controlRoom).get()
  if (!crDoc.exists) {
    console.error(`Control room "${controlRoom}" not found in Firestore.`)
    process.exit(1)
  }

  // Read & parse CSV
  const csv = readFileSync(file, 'utf-8')
  const lines = csv.split('\n').filter((l) => l.trim())
  if (lines.length < 2) {
    console.error('CSV must have a header row and at least one data row.')
    process.exit(1)
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s/g, ''))
  const rows: CameraRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    const row = validateRow(fields, headers, i + 1)
    if (row) rows.push(row)
  }

  console.log(`\nParsed ${rows.length} valid cameras out of ${lines.length - 1} rows.\n`)

  if (rows.length === 0) {
    console.log('Nothing to import.')
    process.exit(0)
  }

  if (dryRun) {
    console.log('Dry run — preview of cameras to import:')
    for (const row of rows) {
      console.log(`  ${row.vmsReference} | ${row.name} | ${row.lat},${row.lng} | ${row.type} | ${row.status}`)
    }
    console.log('\nRe-run without --dry-run to write to Firestore.')
    process.exit(0)
  }

  // Load existing cameras for this control room to de-duplicate by vmsReference
  const existingSnap = await db
    .collection('cameras')
    .where('controlRoomId', '==', controlRoom)
    .get()
  const existingByVms = new Map<string, string>() // vmsReference → docId
  for (const doc of existingSnap.docs) {
    const data = doc.data()
    if (data.vmsReference) {
      existingByVms.set(data.vmsReference, doc.id)
    }
  }

  // Batch write (max 500 per batch)
  const BATCH_SIZE = 500
  let created = 0
  let updated = 0
  let batch = db.batch()
  let batchCount = 0

  const now = Date.now()

  for (const row of rows) {
    const existingDocId = existingByVms.get(row.vmsReference)
    const docId = existingDocId || `cam-${controlRoom}-${row.vmsReference.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

    const docRef = db.collection('cameras').doc(docId)
    const geohash = encodeGeohash(row.lat, row.lng)

    const cameraDoc = {
      id: docId,
      name: row.name,
      location: {
        lat: row.lat,
        lng: row.lng,
        accuracy: 10,
        timestamp: now,
      },
      locationName: row.locationName,
      type: row.type,
      status: row.status,
      controlRoomId: controlRoom,
      vmsReference: row.vmsReference,
      vmsDeepLink: null,
      geohash,
      bearing: row.bearing,
      fieldOfView: row.fieldOfView,
      lastStatusCheck: null,
      tags: row.tags,
      createdAt: existingDocId ? undefined : now,
      updatedAt: now,
    }

    // Remove undefined createdAt for updates
    if (existingDocId) {
      delete (cameraDoc as Record<string, unknown>).createdAt
    }

    batch.set(docRef, cameraDoc, { merge: true })
    batchCount++

    if (existingDocId) { updated++ } else { created++ }

    if (batchCount >= BATCH_SIZE) {
      await batch.commit()
      console.log(`  Committed batch of ${batchCount}`)
      batch = db.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) {
    await batch.commit()
    console.log(`  Committed final batch of ${batchCount}`)
  }

  console.log(`\nImport complete: ${created} created, ${updated} updated.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
