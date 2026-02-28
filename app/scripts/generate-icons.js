#!/usr/bin/env node

/**
 * Generates PWA icon PNGs from an SVG template at build time.
 * Uses sharp for SVG → PNG conversion.
 *
 * Run: node scripts/generate-icons.js
 * Called automatically via the "prebuild" npm script.
 */

const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const PUBLIC = path.resolve(__dirname, '..', 'public')

// Blue shield with "S1" — simple, recognisable at small sizes
function shieldSvg(size, maskable = false) {
  // For maskable icons, content stays within the safe zone (inner 80%)
  const padding = maskable ? size * 0.1 : 0
  const innerSize = size - padding * 2

  const shieldW = innerSize * 0.7
  const shieldH = innerSize * 0.82
  const cx = size / 2
  const cy = size / 2

  const sx = cx - shieldW / 2
  const sy = cy - shieldH / 2 - innerSize * 0.02

  const fontSize = innerSize * 0.28

  // Shield path: rounded top, pointed bottom
  const shieldPath = `
    M ${sx + shieldW * 0.5} ${sy}
    L ${sx + shieldW} ${sy + shieldH * 0.08}
    Q ${sx + shieldW} ${sy + shieldH * 0.12} ${sx + shieldW} ${sy + shieldH * 0.15}
    L ${sx + shieldW} ${sy + shieldH * 0.55}
    Q ${sx + shieldW} ${sy + shieldH * 0.75} ${sx + shieldW * 0.5} ${sy + shieldH}
    Q ${sx} ${sy + shieldH * 0.75} ${sx} ${sy + shieldH * 0.55}
    L ${sx} ${sy + shieldH * 0.15}
    Q ${sx} ${sy + shieldH * 0.12} ${sx} ${sy + shieldH * 0.08}
    Z
  `.trim()

  const bg = maskable
    ? `<rect width="${size}" height="${size}" fill="#1d4ed8" rx="0"/>`
    : ''

  const shieldFill = maskable ? '#ffffff' : '#1d4ed8'
  const textFill = maskable ? '#1d4ed8' : '#ffffff'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <path d="${shieldPath}" fill="${shieldFill}"/>
  <text x="${cx}" y="${cy + fontSize * 0.15}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="${textFill}" text-anchor="middle" dominant-baseline="middle">S1</text>
</svg>`
}

async function generate() {
  const icons = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-192-maskable.png', size: 192, maskable: true },
    { name: 'icon-512-maskable.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ]

  for (const { name, size, maskable } of icons) {
    const svg = Buffer.from(shieldSvg(size, maskable))
    await sharp(svg).png().toFile(path.join(PUBLIC, name))
    console.log(`  Generated ${name}`)
  }

  // favicon.ico — 32x32 PNG (browsers accept PNG favicons)
  const faviconSvg = Buffer.from(shieldSvg(32, false))
  await sharp(faviconSvg).png().toFile(path.join(PUBLIC, 'favicon.ico'))
  console.log('  Generated favicon.ico')
}

generate()
  .then(() => console.log('Icon generation complete.'))
  .catch((err) => {
    console.error('Icon generation failed:', err)
    process.exit(1)
  })
