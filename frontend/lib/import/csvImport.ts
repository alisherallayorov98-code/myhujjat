export interface ParsedRow { [key: string]: string }

/**
 * RFC-4180 CSV parser. UTF-8 BOM, quoted fields, escaped quotes support.
 */
export function parseCsvText(text: string): ParsedRow[] {
  const clean = text.replace(/^﻿/, '')
  const lines  = clean.split(/\r?\n/)

  function splitLine(line: string): string[] {
    const result: string[] = []
    let current = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim()); current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const nonEmpty = lines.filter(l => l.trim())
  if (nonEmpty.length < 2) return []

  const headers = splitLine(nonEmpty[0])
  return nonEmpty
    .slice(1)
    .map(line => {
      const values = splitLine(line)
      const row: ParsedRow = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? '' })
      return row
    })
    .filter(row => Object.values(row).some(v => v.trim()))
}

/** Kontragent CSV ustunlarini API dto ga moslashtiradi */
export function mapCsvToCounterparty(row: ParsedRow) {
  return {
    name:         row['Nomi']          || row['name']     || '',
    inn:          row['STIR']          || row['inn']      || '',
    directorName: row['Rahbar']        || row['director'] || '',
    bankName:     row['Bank']          || row['bank']     || '',
    bankAccount:  row['Hisob raqami']  || row['account']  || '',
    mfo:          row['MFO']           || row['mfo']      || '',
    address:      row['Manzil']        || row['address']  || '',
    phone:        row['Telefon']       || row['phone']    || '',
  }
}

/** Xodim CSV ustunlarini API dto ga moslashtiradi */
export function mapCsvToEmployee(row: ParsedRow) {
  return {
    ism:     row['Ism Familiya'] || row['ism']     || '',
    jshshir: row['JSHSHIR']      || row['jshshir'] || '',
    lavozim: row['Lavozim']      || row['lavozim'] || '',
    bolim:   row["Bo'lim"]       || row['bolim']   || '',
    maosh:   row["Maosh (so'm)"] || row['maosh']   || '',
    tel:     row['Telefon']      || row['tel']      || '',
  }
}
