const escaped = (value: string) => value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)

const excelStyles = `
@page { size: 8.5in 13in landscape; margin: 0.4in; }
body { font-family: 'Times New Roman', serif; font-size: 10pt; }
table { border-collapse: collapse; }
td, th { padding: 3px 4px; border: 1px solid #333333; font-family: 'Times New Roman', serif; font-size: 8pt; vertical-align: top; }
th { background: #eef2ee; font-weight: bold; text-align: center; }
.rp-center { text-align: center; vertical-align: middle; }
.report-print-indicator { font-weight: bold; }
.report-print-definition { text-align: justify; }
.xl-head td, .xl-sign td { border: 0; padding: 0; vertical-align: middle; }
.xl-title { padding: 8px 0 4px; text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase; }
.xl-meta { padding: 0 0 8px; text-align: center; font-size: 10pt; }
.xl-meta-label { color: #444444; font-size: 7.5pt; text-transform: uppercase; }
.xl-date { padding: 12px 0 0; text-align: center; font-size: 10pt; }
.xl-sign-cell { padding: 0 10px; text-align: center; font-size: 10pt; }
.xl-sign-label { font-size: 10pt; }
.xl-sign-role { font-size: 8.5pt; color: #333333; }
.xl-sign-name { font-weight: bold; }
.xl-sign-nip { font-size: 9pt; color: #333333; }
`

function signatureCell(signature: HTMLElement) {
  const pick = (selector: string, className: string) => {
    const text = signature.querySelector(selector)?.textContent?.trim()
    return text ? `<div class="${className}">${escaped(text)}</div>` : ''
  }
  const name = signature.querySelector('strong')?.textContent?.trim()
  return [
    pick('span', 'xl-sign-label'),
    pick('em', 'xl-sign-role'),
    '<br>&nbsp;<br>&nbsp;<br>&nbsp;',
    name ? `<div class="xl-sign-name"><u>${escaped(name)}</u></div>` : '',
    pick('small', 'xl-sign-nip'),
  ].filter(Boolean).join('')
}

export async function exportPrintBlockAsExcel(root: HTMLElement, filename: string) {
  const clone = root.cloneNode(true) as HTMLElement

  const table = clone.querySelector('.report-print-table') as HTMLTableElement | null
  if (!table) throw new Error('Tabel laporan tidak ditemukan.')

  const widths: number[] = []
  table.querySelectorAll('col').forEach((col) => {
    const percent = Number.parseFloat((col as HTMLElement).style.width)
    const width = Number.isFinite(percent) ? Math.round(percent * 9) : 60
    widths.push(width)
    col.setAttribute('width', String(width))
    col.removeAttribute('style')
  })
  const columns = widths.length
  const total = widths.reduce((sum, width) => sum + width, 0)
  let split = 0
  let accumulated = 0
  while (split < columns - 1 && accumulated + widths[split] / 2 < total / 2) {
    accumulated += widths[split]
    split += 1
  }

  table.setAttribute('cellspacing', '0')
  table.setAttribute('cellpadding', '3')
  table.removeAttribute('style')
  table.querySelectorAll<HTMLElement>('.report-print-unit-title td').forEach((cell) => {
    cell.style.backgroundColor = '#e6ece6'
    cell.style.fontWeight = 'bold'
    cell.style.textAlign = 'center'
    cell.style.textTransform = 'uppercase'
  })
  table.querySelectorAll<HTMLElement>('.report-print-status.is-baik').forEach((cell) => { cell.style.color = '#1a7f37'; cell.style.fontWeight = 'bold' })
  table.querySelectorAll<HTMLElement>('.report-print-status.is-perhatian').forEach((cell) => { cell.style.color = '#8a1f1f'; cell.style.fontWeight = 'bold' })

  const title = clone.querySelector('.report-print-title')?.textContent ?? 'Laporan Capaian Standar Pelayanan Minimal'
  const metaCells = Array.from(clone.querySelectorAll('.report-print-meta > div')).map((item) => `<div class="xl-meta-label">${escaped(item.querySelector('dt')?.textContent ?? '')}</div><div>${escaped(item.querySelector('dd')?.textContent ?? '')}</div>`)
  const headHtml = `<table class="xl-head" cellspacing="0" cellpadding="0" width="100%"><tr><td colspan="${columns}" class="xl-title">${escaped(title)}</td></tr>${metaCells.length ? `<tr><td colspan="${split}" class="xl-meta">${metaCells[0]}</td><td colspan="${columns - split}" class="xl-meta">${metaCells.slice(1).join('')}</td></tr>` : ''}</table>`

  const signatures = Array.from(clone.querySelectorAll('.report-print-signature')).map((item) => signatureCell(item as HTMLElement))
  const place = clone.querySelector('.report-print-place')?.textContent ?? ''
  const signHtml = signatures.length
    ? `<table class="xl-sign" cellspacing="0" cellpadding="0" width="100%"><tr><td colspan="${split}"></td><td colspan="${columns - split}" class="xl-date">${escaped(place)}</td></tr><tr>${signatures.map((cell, index) => `<td colspan="${index === 0 ? split : columns - split}" class="xl-sign-cell">${cell}</td>`).join('')}</tr></table>`
    : ''

  const body = [headHtml, table.outerHTML, signHtml].join('')
  const html = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta charset="utf-8"><title>${escaped(filename)}</title><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan SPM</x:Name><x:WorksheetOptions><x:FitToPage/><x:Print><x:FitWidth>1</x:FitWidth><x:FitHeight>0</x:FitHeight><x:ValidPrinterInfo/></x:Print><x:Selected/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>${excelStyles}</style></head><body>${body}</body></html>`

  const url = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
