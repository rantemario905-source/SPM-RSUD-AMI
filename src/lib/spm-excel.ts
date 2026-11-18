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
.xl-kop td, .xl-meta td, .xl-sign td { border: 0; vertical-align: middle; padding: 0; }
.xl-logo { width: 110px; text-align: center; }
.xl-identity { text-align: center; }
.xl-identity-strong { font-size: 12.5pt; font-weight: bold; letter-spacing: .06em; }
.xl-identity-line { font-size: 7.5pt; color: #222222; }
.xl-title { text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase; }
.xl-meta td { padding: 4px 18px 10px; text-align: center; font-size: 10pt; }
.xl-meta-label { color: #444444; font-size: 7.5pt; text-transform: uppercase; }
.xl-date { padding: 12px 0 0; text-align: center; font-size: 10pt; }
.xl-sign td { width: 45%; padding: 0 10px; text-align: center; font-size: 10pt; }
.xl-sign-label { font-size: 10pt; }
.xl-sign-role { font-size: 8.5pt; color: #333333; }
.xl-sign-space { font-size: 10pt; }
.xl-sign-name { border-bottom: 1px solid #333333; font-weight: bold; }
.xl-sign-nip { font-size: 9pt; color: #333333; }
`

async function inlineLogo(image: HTMLImageElement) {
  try {
    const response = await fetch(image.getAttribute('src') ?? '')
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    image.setAttribute('src', dataUrl)
  } catch {
    image.remove()
    return
  }
  image.setAttribute('width', '100')
  image.setAttribute('height', '100')
  image.removeAttribute('class')
}

function signatureCells(clone: HTMLElement) {
  const pick = (scope: HTMLElement, selector: string, className: string) => {
    const text = scope.querySelector(selector)?.textContent?.trim()
    return text ? `<div class="${className}">${escaped(text)}</div>` : ''
  }
  return Array.from(clone.querySelectorAll('.report-print-signature')).map((signature) => [
    pick(signature as HTMLElement, 'span', 'xl-sign-label'),
    pick(signature as HTMLElement, 'em', 'xl-sign-role'),
    '<div class="xl-sign-space">&nbsp;</div><br>&nbsp;<br>&nbsp;',
    pick(signature as HTMLElement, 'strong', 'xl-sign-name'),
    pick(signature as HTMLElement, 'small', 'xl-sign-nip'),
  ].filter(Boolean).join(''))
}

export async function exportPrintBlockAsExcel(root: HTMLElement, filename: string) {
  const clone = root.cloneNode(true) as HTMLElement
  await Promise.all(Array.from(clone.querySelectorAll('img')).map(inlineLogo))

  const logos = Array.from(clone.querySelectorAll('.report-print-kop img'))
  const identity = clone.querySelector('.report-print-identity')
  const identityHtml = identity
    ? Array.from(identity.children).map((child) => `<div class="${child.tagName === 'STRONG' ? 'xl-identity-strong' : 'xl-identity-line'}">${escaped(child.textContent ?? '')}</div>`).join('')
    : ''
  const kopHtml = `<table class="xl-kop" cellspacing="0" cellpadding="0" width="100%"><tr><td class="xl-logo">${logos[0]?.outerHTML ?? ''}</td><td class="xl-identity">${identityHtml}</td><td class="xl-logo">${logos[1]?.outerHTML ?? ''}</td></tr></table>`

  const metaItems = Array.from(clone.querySelectorAll('.report-print-meta > div')).map((item) => `<td><div class="xl-meta-label">${escaped(item.querySelector('dt')?.textContent ?? '')}</div><div>${escaped(item.querySelector('dd')?.textContent ?? '')}</div></td>`).join('')
  const metaHtml = metaItems ? `<table class="xl-meta" cellspacing="0" cellpadding="0" width="100%"><tr>${metaItems}</tr></table>` : ''

  const signatures = signatureCells(clone)
  const place = clone.querySelector('.report-print-place')?.textContent ?? ''
  const signHtml = signatures.length
    ? `<table class="xl-sign" cellspacing="0" cellpadding="0" width="100%"><tr><td></td><td class="xl-date">${escaped(place)}</td></tr><tr>${signatures.map((cell) => `<td>${cell}</td>`).join('')}</tr></table>`
    : ''

  const table = clone.querySelector('.report-print-table') as HTMLTableElement | null
  if (!table) throw new Error('Tabel laporan tidak ditemukan.')
  table.querySelectorAll('col').forEach((col) => {
    const percent = Number.parseFloat((col as HTMLElement).style.width)
    if (Number.isFinite(percent)) col.setAttribute('width', String(Math.round(percent * 9)))
    col.removeAttribute('style')
  })
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
  const body = [kopHtml, `<div class="xl-title">${escaped(title)}</div>`, metaHtml, table.outerHTML, signHtml].join('')
  const html = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta charset="utf-8"><title>${escaped(filename)}</title><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan SPM</x:Name><x:WorksheetOptions><x:FitToPage/><x:Print><x:FitWidth>1</x:FitWidth><x:FitHeight>0</x:FitHeight><x:ValidPrinterInfo/></x:Print><x:Selected/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>${excelStyles}</style></head><body>${body}</body></html>`

  const url = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
