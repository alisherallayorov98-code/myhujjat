import { CONTRACT_TYPE_CONFIG } from '../contractTemplates'
import { renderContractHtml }   from './contractHtml'
import { renderKotibHtml }      from '../renderKotibHtml'
import { stripDocumentHeader }  from './stripHeader'

export type PdfOpts =
  | { contract: any }
  | { title: string; content: string; orgName?: string; number?: string }

function isContractOpts(o: PdfOpts): o is { contract: any } {
  return 'contract' in o
}

// Matn buyruq/bayonnoma ekanligini aniqlash
function isKotibDoc(content: string): boolean {
  return /BUYRUQ\s*№/i.test(content) || /BAYONNOMA/i.test(content)
}

async function exportSimplePdf(opts: { title: string; content: string; orgName?: string; number?: string }) {
  // Buyruq/Bayonnoma — HTML render orqali (to'g'ri formatlash uchun)
  if (isKotibDoc(opts.content)) {
    const html = renderKotibHtml(opts.content)
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:794px;background:white;font-family:Times New Roman,serif;'
    wrapper.innerHTML = html
    document.body.appendChild(wrapper)
    try {
      const [h2cMod, jspdfMod] = await Promise.all([import('html2canvas'), import('jspdf')])
      const html2canvas: any = (h2cMod as any).default || h2cMod
      const jsPDF: any       = (jspdfMod as any).jsPDF || (jspdfMod as any).default?.jsPDF || (jspdfMod as any).default
      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW  = pdf.internal.pageSize.getWidth()
      const pageH  = pdf.internal.pageSize.getHeight()
      const imgW   = pageW
      const imgH   = (canvas.height * imgW) / canvas.width
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
      } else {
        let rem = imgH, pos = 0
        while (rem > 0) {
          pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH)
          rem -= pageH; pos -= pageH
          if (rem > 0) pdf.addPage()
        }
      }
      pdf.save(`${opts.title.replace(/\s+/g, '_')}.pdf`)
    } finally {
      document.body.removeChild(wrapper)
    }
    return
  }

  // Oddiy hujjat (faktura, akt-sverki va b.) — jsPDF text mode
  const jspdfMod = await import('jspdf')
  const jsPDF: any = (jspdfMod as any).jsPDF || (jspdfMod as any).default?.jsPDF || (jspdfMod as any).default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin    = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth  = pageWidth - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  const titleLines = doc.splitTextToSize(opts.title, maxWidth)
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' })
  y += titleLines.length * 7 + 6

  if (opts.orgName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(opts.orgName, pageWidth / 2, y, { align: 'center' })
    y += 7
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const cleanContent = stripDocumentHeader(opts.content)
  const lines = doc.splitTextToSize(cleanContent, maxWidth)
  const lineH = 5.5
  lines.forEach((line: string) => {
    if (y + lineH > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage(); y = margin
    }
    doc.text(line, margin, y)
    y += lineH
  })

  doc.save(`${opts.title.replace(/\s+/g, '_')}.pdf`)
}

export async function exportContractPdf(opts: PdfOpts): Promise<void> {
  if (!isContractOpts(opts)) {
    return exportSimplePdf(opts)
  }
  const { contract } = opts
  const cfg = (CONTRACT_TYPE_CONFIG as any)[contract.contractType] || { name: 'Shartnoma' }
  const typeName = (cfg.name || 'Shartnoma').toUpperCase() + ' SHARTNOMASI'
  const number   = contract.contractNumber || ''

  // Offscreen HTML render
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:794px;background:white;'
  wrapper.innerHTML = renderContractHtml(contract)
  document.body.appendChild(wrapper)

  try {
    const [h2cMod, jspdfMod] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const html2canvas: any = (h2cMod as any).default || h2cMod
    const jsPDF:       any = (jspdfMod as any).jsPDF || (jspdfMod as any).default?.jsPDF || (jspdfMod as any).default

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW     = pdf.internal.pageSize.getWidth()
    const pageH     = pdf.internal.pageSize.getHeight()
    const imgW      = pageW
    const imgH      = (canvas.height * imgW) / canvas.width
    const imgData   = canvas.toDataURL('image/jpeg', 0.95)

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
    } else {
      // Multi-page: rasmni A4 sahifalarga bo'lib joylashtirish
      let remainingH = imgH
      let position   = 0
      while (remainingH > 0) {
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
        remainingH -= pageH
        position   -= pageH
        if (remainingH > 0) pdf.addPage()
      }
    }

    const safeNumber = (number || 'shartnoma').replace(/[\\/:*?"<>|]/g, '_')
    pdf.save(`${typeName.replace(/\s+/g, '_')}_${safeNumber}.pdf`)
  } finally {
    document.body.removeChild(wrapper)
  }
}
