import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatCurrency, formatNumber, formatDate, formatINN, formatPhone,
  formatAmountWords, numberToWords,
} from './formatters'

// Test'larda locale uz (default) ishlatiladi.
// document.cookie yo'q (jsdom default), shuning uchun currentLocale() 'uz' qaytaradi.

describe('formatCurrency', () => {
  it("butun son: '1 200 500 so'm'", () => {
    const r = formatCurrency(1_200_500)
    // Locale UZ uses non-breaking space — so we check for the digits
    expect(r).toMatch(/1[\s ]200[\s ]500/)
    expect(r).toMatch(/so'm/)
  })

  it("0 so'm — 0 ko'rsatiladi (manfiy emas)", () => {
    expect(formatCurrency(0)).toMatch(/^0\s+so'm$/)
  })

  it('decimals=2 majburiy', () => {
    const r = formatCurrency(1000.5, 'UZS', { decimals: 2 })
    expect(r).toMatch(/1[\s ]000[,.]50/)
  })

  it("default: butun son uchun 0 kasr, kasr uchun 2 kasr (smart)", () => {
    expect(formatCurrency(1000)).toMatch(/^1[\s ]000\s+so'm$/)
    expect(formatCurrency(1000.55)).toMatch(/1[\s ]000[,.]55/)
  })
})

describe('formatNumber (so\'msiz)', () => {
  it("butun son: '1 200 500'", () => {
    expect(formatNumber(1_200_500)).toMatch(/1[\s ]200[\s ]500/)
  })

  it("decimal: '2.50'", () => {
    expect(formatNumber(2.5)).toMatch(/^2[,.]50$/)
  })

  it("explicit decimals: '1 200.500'", () => {
    expect(formatNumber(1200.5, { decimals: 3 })).toMatch(/1[\s ]200[,.]500/)
  })
})

describe('formatINN', () => {
  it("9 raqam: '301 234 567'", () => {
    expect(formatINN('301234567')).toBe('301 234 567')
  })

  it("noto'g'ri uzunlik: aslicha qaytaradi", () => {
    expect(formatINN('123')).toBe('123')
  })

  it("aralash belgilar: faqat raqamlarni oladi", () => {
    expect(formatINN('301-234-567')).toBe('301 234 567')
  })
})

describe('formatPhone', () => {
  it("UZ formatda: '+998 90 123 45 67'", () => {
    expect(formatPhone('998901234567')).toBe('+998 90 123 45 67')
  })

  it("noto'g'ri uzunlik: aslicha qaytaradi", () => {
    expect(formatPhone('123456')).toBe('123456')
  })
})

describe('formatDate', () => {
  it('short format: DD.MM.YYYY', () => {
    const d = new Date('2026-03-15')
    const r = formatDate(d, 'short')
    expect(r).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })

  it('long format: o\'zbekcha oy nomi', () => {
    const d = new Date('2026-03-15')
    const r = formatDate(d, 'long')
    expect(r.toLowerCase()).toMatch(/mart/)
  })

  it("noto'g'ri sana: '—'", () => {
    expect(formatDate('invalid')).toBe('—')
  })
})

describe('numberToWords', () => {
  it('0 → nol', () => {
    expect(numberToWords(0)).toBe('nol')
  })

  it('1 → bir', () => {
    expect(numberToWords(1)).toBe('bir')
  })

  it("100 → bir yuz", () => {
    expect(numberToWords(100)).toBe('bir yuz')
  })

  it("1000 → bir ming", () => {
    expect(numberToWords(1000)).toBe('bir ming')
  })

  it("1 000 000 → bir million", () => {
    expect(numberToWords(1_000_000)).toBe('bir million')
  })

  it("manfiy son: minus prefiksi", () => {
    expect(numberToWords(-50)).toContain('minus')
  })
})

describe('formatAmountWords', () => {
  it('500000 so\'m → so\'zda', () => {
    const r = formatAmountWords(500_000)
    expect(r).toMatch(/so'm/i)
    expect(r.charAt(0)).toMatch(/[A-Z]/)  // Capitalized
  })

  it("1.50 so'm → tiyin bilan", () => {
    const r = formatAmountWords(1.5)
    expect(r).toMatch(/tiyin/i)
  })

  it("butun son — tiyinsiz", () => {
    const r = formatAmountWords(100)
    expect(r).not.toMatch(/tiyin/i)
  })
})
