/** Yangi oynada faqat hujjat matnini print qiladi (plain text) */
export function printText(text: string) {
  const w = window.open('', '_blank')
  if (!w) return
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  w.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Print</title>
<style>
  @page { margin: 1.5cm; }
  body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.8; margin: 0; padding: 30px 50px; }
  pre  { white-space: pre-wrap; font-family: inherit; font-size: inherit; margin: 0; }
</style>
</head><body><pre>${escaped}</pre></body></html>`)
  w.document.close()
  w.focus()
  w.print()
  w.close()
}

/** Yangi oynada faqat HTML hujjatni print qiladi (styled HTML) */
export function printHtml(html: string) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Print</title>
<style>@page { margin: 1.5cm; } body { margin: 0; }</style>
</head><body>${html}</body></html>`)
  w.document.close()
  w.focus()
  w.print()
  w.close()
}
