// ============================================
// LOCALE — joriy tilni cookie'dan o'qish
// ============================================
export type AppLocale = 'uz' | 'oz' | 'ru'

export function currentLocale(): AppLocale {
  if (typeof document === 'undefined') return 'uz'
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  const v = m?.[1] as AppLocale | undefined
  return v && ['uz', 'oz', 'ru'].includes(v) ? v : 'uz'
}

function intlLocale(l: AppLocale): string {
  return l === 'ru' ? 'ru-RU' : l === 'oz' ? 'uz-Cyrl-UZ' : 'uz-UZ'
}

// ============================================
// VALYUTA FORMATLASH
// ============================================
export function formatCurrency(amount: number, currency = 'UZS'): string {
  const lc = intlLocale(currentLocale())
  const sumWord = currentLocale() === 'ru' ? 'сум' : currentLocale() === 'oz' ? "сўм" : "so'm"
  if (currency === 'UZS') {
    return new Intl.NumberFormat(lc).format(Math.round(amount)) + ' ' + sumWord
  }
  return new Intl.NumberFormat(lc, { style: 'currency', currency }).format(amount)
}

// ============================================
// SANA FORMATLASH
// ============================================
export function formatDate(
  date: string | Date,
  format: 'full' | 'short' | 'long' = 'full'
): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'

  const lc      = currentLocale()
  const intlLc  = intlLocale(lc)

  const monthsByLocale: Record<AppLocale, string[]> = {
    uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
         'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
    oz: ['январ', 'феврал', 'март', 'апрел', 'май', 'июн',
         'июл', 'август', 'сентабр', 'октабр', 'ноябр', 'декабр'],
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
         'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  }

  if (format === 'long') {
    const months = monthsByLocale[lc]
    const year   = d.getFullYear()
    if (lc === 'ru') return `${d.getDate()} ${months[d.getMonth()]} ${year} г.`
    if (lc === 'oz') return `${d.getDate()} ${months[d.getMonth()]} ${year} йил`
    return `${d.getDate()} ${months[d.getMonth()]} ${year} yil`
  }

  if (format === 'short') {
    return d.toLocaleDateString(intlLc, {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  return d.toLocaleDateString(intlLc)
}

// ============================================
// SUMMA SO'ZDA
// ============================================
const ONES = [
  '', 'bir', 'ikki', 'uch', "to'rt", 'besh',
  'olti', 'yetti', 'sakkiz', "to'qqiz"
]
const TEENS = [
  "o'n", "o'n bir", "o'n ikki", "o'n uch", "o'n to'rt",
  "o'n besh", "o'n olti", "o'n yetti", "o'n sakkiz", "o'n to'qqiz"
]
const TENS = [
  '', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik',
  'oltmish', 'yetmish', 'sakson', "to'qson"
]

function hundreds(n: number): string {
  if (n === 0) return ''
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const o = n % 10
  let result = h > 0 ? ONES[h] + ' yuz' : ''
  if (n % 100 >= 10 && n % 100 < 20) {
    result += (result ? ' ' : '') + TEENS[n % 100 - 10]
  } else {
    if (t > 0) result += (result ? ' ' : '') + TENS[t]
    if (o > 0) result += (result ? ' ' : '') + ONES[o]
  }
  return result
}

export function numberToWords(n: number): string {
  if (n === 0) return 'nol'
  if (n < 0)   return 'minus ' + numberToWords(-n)

  const billions  = Math.floor(n / 1_000_000_000)
  const millions  = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1_000)
  const remainder = n % 1_000

  const parts: string[] = []
  if (billions)  parts.push(hundreds(billions)  + ' milliard')
  if (millions)  parts.push(hundreds(millions)  + ' million')
  if (thousands) parts.push(hundreds(thousands) + ' ming')
  if (remainder) parts.push(hundreds(remainder))

  return parts.join(' ')
}

export function formatAmountWords(amount: number): string {
  const whole   = Math.floor(amount)
  const decimal = Math.round((amount - whole) * 100)
  let result    = numberToWords(whole) + " so'm"
  if (decimal > 0) {
    result += ' ' + numberToWords(decimal) + ' tiyin'
  }
  return result.charAt(0).toUpperCase() + result.slice(1)
}

// ============================================
// INN (STIR) FORMATLASH
// ============================================
export function formatINN(inn: string): string {
  const digits = inn.replace(/\D/g, '')
  if (digits.length === 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  }
  return inn
}

// ============================================
// TELEFON FORMATLASH
// ============================================
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  return phone
}

// ============================================
// SHARTNOMA RAQAMI
// ============================================
export function generateContractNumber(prefix = 'SH', count = 1): string {
  const year  = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  return `${prefix}-${year}/${month}-${String(count).padStart(3, '0')}`
}

// ============================================
// FAYL HAJMI
// ============================================
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
