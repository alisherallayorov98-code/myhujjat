/**
 * Tarjima parity tekshiruvi.
 *
 * Har namespace fayli (uz, oz, ru) bir xil keylarga ega bo'lishi kerak.
 * Aks holda foydalanuvchi tilini almashtirsa "missing key" warning chiqadi.
 *
 * Ishga tushirish:
 *   cd frontend && npx ts-node scripts/check-translations.ts
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

const SCRIPT_DIR   = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'))
const MESSAGES_DIR = path.join(SCRIPT_DIR, '..', 'messages')
const LOCALES = ['uz', 'oz', 'ru'] as const

function flattenKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

function loadNamespace(locale: string): Record<string, string[]> {
  const dir = path.join(MESSAGES_DIR, locale)
  const result: Record<string, string[]> = {}

  if (!fs.existsSync(dir)) return result

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    const ns      = file.replace(/\.json$/, '')
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
    result[ns] = flattenKeys(content).sort()
  }
  return result
}

function main() {
  const locales = LOCALES.map(loc => ({ loc, ns: loadNamespace(loc) }))

  // Reference — uz
  const uz = locales.find(l => l.loc === 'uz')!.ns

  let totalMissing = 0
  let totalExtra   = 0
  const issues: string[] = []

  for (const { loc, ns } of locales) {
    if (loc === 'uz') continue

    // Namespace fayllar parity
    const uzFiles  = Object.keys(uz).sort()
    const locFiles = Object.keys(ns).sort()
    const missingFiles = uzFiles.filter(f => !locFiles.includes(f))
    const extraFiles   = locFiles.filter(f => !uzFiles.includes(f))

    if (missingFiles.length > 0) {
      issues.push(`[${loc}] yo'q namespace fayllar: ${missingFiles.join(', ')}`)
    }
    if (extraFiles.length > 0) {
      issues.push(`[${loc}] qo'shimcha namespace fayllar: ${extraFiles.join(', ')}`)
    }

    // Har namespace ichidagi key parity
    for (const file of uzFiles) {
      if (!ns[file]) continue
      const uzKeys  = uz[file]
      const locKeys = ns[file]

      const missing = uzKeys.filter(k => !locKeys.includes(k))
      const extra   = locKeys.filter(k => !uzKeys.includes(k))

      if (missing.length > 0) {
        totalMissing += missing.length
        issues.push(`[${loc}/${file}] yo'q keylar (${missing.length}): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`)
      }
      if (extra.length > 0) {
        totalExtra += extra.length
        issues.push(`[${loc}/${file}] qo'shimcha keylar (${extra.length}): ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? '...' : ''}`)
      }
    }
  }

  if (issues.length === 0) {
    console.log('✅ Barcha tarjimalar parity\'da — uz/oz/ru bir xil keylar')
    process.exit(0)
  }

  console.log('❌ Tarjima parity issues:\n')
  for (const issue of issues) {
    console.log('  ' + issue)
  }
  console.log(`\nJami: ${totalMissing} ta yo'q key, ${totalExtra} ta qo'shimcha key`)
  process.exit(totalMissing > 0 ? 1 : 0)
}

main()
