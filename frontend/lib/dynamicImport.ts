/**
 * CJS / ESM o'zaro mosligi uchun yordamchi.
 *
 * Webpack'ning dynamic import'i CJS modullarni `{ default: module }`
 * shaklida qaytaradi. Modulning o'zida ham named export'lar bo'lishi mumkin.
 * Bu yordamchi turli paketlar uchun ishonchli ishlaydi.
 */

/** Modul'dan named export olish — qaysi joyda bo'lsa ham topadi. */
export function pickExport<T = any>(mod: any, name: string): T {
  if (mod?.[name]) return mod[name]
  if (mod?.default?.[name]) return mod.default[name]
  if (mod?.default && name === 'default') return mod.default
  throw new Error(`Export "${name}" topilmadi modulda`)
}

/** CJS-only paketlar uchun default export'ni xavfsiz olish. */
export function pickDefault<T = any>(mod: any): T {
  // Modul'ning o'zi funksiya/class bo'lsa (CJS module.exports = X)
  if (typeof mod === 'function') return mod
  // Standart ESM default
  if (mod?.default) return mod.default
  // Boshqa hech qaysi yo'l bilan topilmasa, modulning o'zini qaytaramiz
  return mod
}
