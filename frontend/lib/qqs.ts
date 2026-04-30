export type QqsFoiz = 'siz' | '0' | '12' | '15'

export interface SpecItem {
  nomi:        string
  izoh?:       string
  shtrixKodi?: string
  birlik:      string
  miqdori:     number
  narxi:       number
  qqsFoiz:     QqsFoiz
  qqsSumma:    number
  summa:       number
}

export function calcSpecItem(
  miqdori: number,
  narxi:   number,
  qqsFoiz: QqsFoiz,
): { qqsSumma: number; summa: number } {
  const asosiy = miqdori * narxi

  if (qqsFoiz === 'siz' || qqsFoiz === '0') {
    return { qqsSumma: 0, summa: asosiy }
  }

  const rate     = parseFloat(qqsFoiz) / 100
  const qqsSumma = asosiy * rate
  const summa    = asosiy + qqsSumma

  return {
    qqsSumma: Math.round(qqsSumma * 100) / 100,
    summa:    Math.round(summa    * 100) / 100,
  }
}

export function calcSpecTotals(items: SpecItem[]) {
  const jami    = items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const jamiQqs = items.reduce((s, i) => s + i.qqsSumma, 0)
  const umumiy  = jami + jamiQqs

  return {
    jami:    Math.round(jami    * 100) / 100,
    jamiQqs: Math.round(jamiQqs * 100) / 100,
    umumiy:  Math.round(umumiy  * 100) / 100,
  }
}

export function newSpecItem(): SpecItem {
  return {
    nomi:    '',
    birlik:  'dona',
    miqdori: 1,
    narxi:   0,
    qqsFoiz: 'siz',
    qqsSumma: 0,
    summa:   0,
  }
}

export const BIRLIKLAR = [
  'dona', 'kg', 'g', 'tonna',
  'litr', 'ml', 'm', 'm²', 'm³',
  'soat', 'kun', 'oy', 'yil',
  'komplekt', "to'plam", 'xizmat',
]

export const QQS_OPTIONS = [
  { value: 'siz', label: 'QQS siz' },
  { value: '0',   label: '0%'      },
  { value: '12',  label: '12%'     },
  { value: '15',  label: '15%'     },
]
