/**
 * Batch compute risk insights from the last 90 days of alerts.
 *
 * Usage:
 *   cd app && npx tsx scripts/compute-risk-insights.ts
 *
 * Requires .env.local to be loaded.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    let value = trimmed.slice(eqIdx + 1)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
} catch {
  console.error('Failed to load .env.local — ensure it exists at', envPath)
  process.exit(1)
}

// Initialize Firebase Admin
if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in .env.local')
    process.exit(1)
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
}

const db = getFirestore()

// Inline the engine logic imports won't work with tsx path aliases,
// so we import relatively
async function main() {
  console.log('Computing risk insights...')
  const startTime = Date.now()

  const RISK_WINDOW_DAYS = 90
  const windowStart = Date.now() - RISK_WINDOW_DAYS * 24 * 60 * 60 * 1000

  // Fetch alerts
  const snapshot = await db
    .collection('alerts')
    .where('createdAt', '>=', windowStart)
    .orderBy('createdAt', 'desc')
    .get()

  const alerts = snapshot.docs.map(doc => doc.data())
  console.log(`Found ${alerts.length} alerts in the last ${RISK_WINDOW_DAYS} days`)

  if (alerts.length === 0) {
    console.log('No alerts to analyse. Writing empty metadata.')
    await db.collection('riskInsights').doc('metadata').set({
      lastComputedAt: Date.now(),
      alertsAnalyzed: 0,
      windowStart,
      windowEnd: Date.now(),
      computeDurationMs: Date.now() - startTime,
      version: 1,
    })
    console.log('Done.')
    return
  }

  // Dynamic import of the engine (uses tsx path resolution)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { computeRiskInsights } = require('../src/lib/risk/engine') as typeof import('../src/lib/risk/engine')
  const insights = computeRiskInsights(alerts as Parameters<typeof computeRiskInsights>[0])

  // Write 5 documents
  const batch = db.batch()
  const col = db.collection('riskInsights')
  batch.set(col.doc('metadata'), insights.metadata)
  batch.set(col.doc('spatial'), insights.spatial)
  batch.set(col.doc('temporal'), insights.temporal)
  batch.set(col.doc('users'), insights.users)
  batch.set(col.doc('falseAlarmPatterns'), insights.falseAlarmPatterns)
  await batch.commit()

  const duration = Date.now() - startTime
  console.log(`Risk insights computed successfully:`)
  console.log(`  Alerts analyzed: ${alerts.length}`)
  console.log(`  Spatial cells: ${Object.keys(insights.spatial.cells).length}`)
  console.log(`  Hotspots: ${insights.spatial.hotspots.length}`)
  console.log(`  User profiles: ${Object.keys(insights.users.users).length}`)
  console.log(`  Duration: ${duration}ms`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
