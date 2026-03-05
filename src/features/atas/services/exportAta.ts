/**
 * Exportação de ata em HTML.
 * - Layout idêntico ao app anterior (Vale Sans, #007e7a, etc.)
 * - Barra de filtros funcional (data-attributes)
 * - Impressão: cabeçalho repetido, sem quebra no meio de itens, numeração de páginas
 * - JSON embutido em <script id="ata-data"> (não exibido na tela nem na impressão; recuperável via link "Abrir no app")
 */
import type { MeetingMinutes, Item, HistoricoItem } from '@/types'
import { sortItemsByNumber } from '@/utils/itemNumbering'
import { sanitizeHtml } from '@/utils/htmlSanitize'
import { encodeAtaToHash } from '@/utils/urlAtaImport'
import { getEnvConfig } from '@services/envConfig'
import { getAtaFilterScript } from './ataFilterScript'

/** URL base do app para links compartilháveis (fallback se não fornecida) */
const APP_BASE_URL_DEFAULT = 'https://wellbrez.github.io/GeradorDeAtas'

const ID_ATA_JSON = 'ata-data'
const ITENS_POR_PAGINA = 25

const E = {
  body: "margin:0;padding:0;background:#f5f5f5;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;box-sizing:border-box;",
  container: "box-sizing:border-box;width:calc(100% - 2px);min-height:100vh;margin:0 auto;padding:12mm 8mm 15mm 8mm;background:#fff;border:none;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  layoutTable: "width:100%;border-collapse:collapse;border:2px solid #000;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  layoutCel: "border:1px solid #d8d8d8;padding:0;vertical-align:top;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  cabPrincipal: "border:1px solid #000;border-collapse:collapse;width:100%;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  cabCentro: "border:1px solid #000;padding:5px;vertical-align:top;text-align:center;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  cabEsq: "border:1px solid #000;padding:5px;vertical-align:top;text-align:left;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  cabSemBorda: "padding:0;border:0;vertical-align:top;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  tabela: "border-collapse:collapse;width:100%;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  noBreak: "page-break-inside:avoid;break-inside:avoid;",
  resp: "border:1px solid #d8d8d8;color:#000;background:transparent;padding:3px;word-break:break-word;vertical-align:top;text-align:left;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  cabTexto: "border:1px solid #d8d8d8;color:#000;background:#ccc;text-align:left;padding:3px;font-weight:bold;word-break:break-word;vertical-align:top;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  secao: "color:#fff;background:#007e7a;text-align:center;padding:4px;font-size:11pt;font-weight:bold;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;",
  legenda: "font-size:9pt;margin:6px 0 10px 0;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;",
  itemPai: "border:1px solid #d8d8d8;color:#000;background:#e0f2f1;padding:3px;word-break:break-word;vertical-align:top;text-align:left;font-weight:bold;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  statusOk: "border:1px solid #d8d8d8;color:#0d875c;background:transparent;padding:3px;word-break:break-word;vertical-align:top;text-align:center;font-weight:bold;white-space:nowrap;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  statusPadrao: "border:1px solid #d8d8d8;color:#000;background:transparent;padding:3px;word-break:break-word;vertical-align:top;text-align:center;font-weight:bold;white-space:nowrap;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  presP: "border:1px solid #d8d8d8;color:#0d875c;background:transparent;padding:3px;word-break:break-word;vertical-align:top;text-align:center;font-weight:bold;white-space:nowrap;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
  presA: "border:1px solid #d8d8d8;color:#ad2a23;background:transparent;padding:3px;word-break:break-word;vertical-align:top;text-align:center;font-weight:bold;white-space:nowrap;font-family:'Vale Sans','Segoe UI',Arial,sans-serif;font-size:10pt;",
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Interpreta string de data como dia local (evita deslocamento de timezone na exibição).
 * Strings "YYYY-MM-DD" sem hora são interpretadas como UTC pelo Date(), o que em fusos
 * como Brasil (UTC-3) faz a data aparecer como dia anterior.
 */
function parseDateOnlyAsLocal(s: string): Date {
  const t = (s || '').trim()
  if (t.length === 10 && t[4] === '-' && t[7] === '-') return new Date(t + 'T12:00:00')
  return new Date(s)
}

function dataBr(iso: string | null): string {
  if (!iso) return ''
  try { return parseDateOnlyAsLocal(iso).toLocaleDateString('pt-BR') } catch { return iso }
}

function dataYmd(iso: string | null): string {
  if (!iso) return ''
  try { return iso.split('T')[0] ?? '' } catch { return iso }
}

function nl2br(t: string): string { return t.replace(/\r?\n/g, '<br/>') }

function descricaoComHistorico(item: Item, omitDates = false): string {
  const hist = item.historico ?? []
  if (hist.length === 0) return ''
  return hist
    .map((h: HistoricoItem, i: number) => {
      const desc = sanitizeHtml(h.descricao || '')
      const ultimo = i === hist.length - 1
      if (omitDates) {
        return ultimo ? desc : `<i style="color:lightgray">${desc}</i>`
      }
      const dt = dataYmd(h.criadoEm)
      return ultimo ? `${dt}: ${desc}` : `<i style="color:lightgray">${dt}: ${desc}</i>`
    })
    .join('<br/>')
}

/** Estilo para entradas anteriores de data/responsável no HTML exportado (acima, tachado, texto claro). */
const ESTILO_HISTORICO_ANTERIOR = 'display:block;text-decoration:line-through;color:#888;font-style:italic;font-size:9pt;'

/** Data da célula com histórico: entradas anteriores tachadas acima, última normal. */
function dataCellComHistorico(item: Item): string {
  const hist = item.historico ?? []
  if (hist.length === 0) return ''
  return hist
    .map((h: HistoricoItem, i: number) => {
      const text = dataBr(h.data)
      const ultimo = i === hist.length - 1
      return ultimo ? esc(text) : `<span style="${ESTILO_HISTORICO_ANTERIOR}">${esc(text)}</span>`
    })
    .join('')
}

/** Responsável da célula com histórico: entradas anteriores tachadas acima, última normal. */
function respCellComHistorico(item: Item): string {
  const hist = item.historico ?? []
  if (hist.length === 0) return ''
  return hist
    .map((h: HistoricoItem, i: number) => {
      const r = h.responsavel
      const text = r?.nome && r?.email ? `${r.nome} / ${r.email}` : (r?.nome || r?.email || '')
      const ultimo = i === hist.length - 1
      return ultimo ? esc(text) : `<span style="${ESTILO_HISTORICO_ANTERIOR}">${esc(text)}</span>`
    })
    .join('')
}

function attr(s: string): string {
  return esc(s || '').replace(/"/g, '&quot;')
}

function normalizeForFilter(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Gera o bloco de cabeçalho da ata (para repetir em cada página).
 * @param logoDataUrl - Opcional: data URL da logomarca para o canto superior esquerdo
 */
function buildHeaderBlock(c: MeetingMinutes['cabecalho'], pagina: number, total: number, logoDataUrl?: string | null): string {
  const titulo = nl2br(esc(c.titulo || ''))
  const projeto = nl2br(esc(c.projeto || ''))
  const logoCellStyle = E.cabCentro + ';display:flex;justify-content:center;align-items:center;min-height:56px;min-width:120px;width:20%;box-sizing:border-box;'
  const logoCell = logoDataUrl && logoDataUrl.startsWith('data:image')
    ? `<img src="${esc(logoDataUrl)}" alt="Logo" style="max-width:100%;max-height:56px;width:auto;height:auto;object-fit:contain;display:block;border:none;outline:none;vertical-align:middle;" />`
    : ''
  const cabPrincipalFixed = E.cabPrincipal + ';table-layout:fixed;'
  return (
    `<table style="${cabPrincipalFixed}" cellpadding="5" cellspacing="0">` +
    `<tr style="${E.noBreak}"><td style="${logoCell ? logoCellStyle : E.cabCentro + ';width:20%;'}">${logoCell}</td><td width="20%" style="${E.cabCentro}"></td><td width="20%" style="${E.cabCentro}">Classificação<br/>USO RESTRITO</td><td colspan="2" width="60%" style="${E.cabEsq}">${projeto}</td></tr>` +
    `<tr style="${E.noBreak}"><td colspan="3" style="${E.cabEsq}"><strong>${titulo}</strong></td><td style="${E.cabEsq}">Número: <strong>${esc(c.numero)} Rev. 0</strong><br/>Tipo: <strong>${esc(c.tipo)}</strong></td><td class="ata-pagina-num-cell" style="${E.cabCentro}">Página<br/><strong><span class="ata-pagina-num">${pagina} de ${total}</span></strong></td></tr>` +
    `<tr style="${E.noBreak}"><td colspan="5" style="${E.cabSemBorda}">` +
    `<table style="${E.tabela}" cellpadding="5" cellspacing="0">` +
    `<tr style="${E.noBreak}"><td style="${E.cabTexto}width:20%;">Data</td><td style="${E.resp}width:30%;">${dataBr(c.data)}</td><td style="${E.cabTexto}width:20%;">Responsável</td><td style="${E.resp}width:30%;">${esc(c.responsavel)}</td></tr>` +
    `<tr style="${E.noBreak}"><td style="${E.cabTexto}">Projeto</td><td style="${E.resp}" colspan="3">${projeto}</td></tr>` +
    `</table></td></tr></table>`
  )
}

export interface BuildAtaHtmlOptions {
  /** URL base do aplicativo para o link "Abrir no app". Ex: https://wellbrez.github.io/GeradorDeAtas */
  appBaseUrl?: string
  /** Data URL da logomarca (ex.: data:image/png;base64,...) para exibir no canto superior esquerdo do cabeçalho */
  logoDataUrl?: string | null
}

export function buildAtaHtml(ata: MeetingMinutes, options?: BuildAtaHtmlOptions): string {
  const c = ata.cabecalho
  const logoDataUrl = options?.logoDataUrl ?? null
  const itensOrd = sortItemsByNumber(ata.itens)

  const participantesRows = ata.attendance.map((p) => {
    const pres = p.presenca === 'P' ? '\u{1F7E2} P' : p.presenca === 'A' ? '\u{1F534} A' : '\u{1F535} N/V'
    const estilo = p.presenca === 'P' ? E.presP : E.presA
    return `<tr style="${E.noBreak}"><td style="${E.resp}">${esc(p.nome)}</td><td style="${E.resp}">${esc(p.empresa)}</td><td style="${E.resp}">${esc(p.email)}</td><td style="${estilo}">${pres}</td><td style="${E.resp}">${esc(p.telefone)}</td></tr>`
  }).join('')

  const itensRows: string[] = []
  itensOrd.forEach((item) => {
    const temFilhos = (item.filhos?.length ?? 0) > 0
    const descHtml = descricaoComHistorico(item, temFilhos)
    const resp = item.UltimoHistorico?.responsavel
    const respStr = resp?.nome && resp?.email ? `${resp.nome} / ${resp.email}` : ((resp?.nome || resp?.email) ?? '') as string
    const dataStr = dataBr(item.UltimoHistorico?.data ?? null)
    const status = item.UltimoHistorico?.status ?? 'Pendente'
    const statusDisp = status === 'Concluído' ? '\u{1F7E2} Concluído' : status === 'Pendente' ? '\u{1F7E1} Pendente' : status === 'Em Andamento' ? '\u{1F535} Em andamento' : status === 'Cancelado' ? '\u26AB Cancelado' : status === 'Info' ? '\u26AA Info' : status
    const statusEstilo = status === 'Concluído' ? E.statusOk : E.statusPadrao

    const descNorm = normalizeForFilter(stripHtml(descHtml) + ' ' + item.item)
    const respNorm = normalizeForFilter(respStr)
    const dataNorm = normalizeForFilter(dataStr)
    const statusNorm = normalizeForFilter(status)

    const idAttr = attr(item.id)
    const paiAttr = attr(item.pai ?? '')
    if (temFilhos) {
      itensRows.push(`<tr style="${E.noBreak}" data-ata-item-row data-ata-parent="1" data-ata-id="${idAttr}" data-ata-pai="${paiAttr}" data-ata-desc="${attr(descNorm)}" data-ata-resp="" data-ata-date="" data-ata-status=""><td style="${E.itemPai}">${esc(item.item)}</td><td style="${E.itemPai}" colspan="4">${descHtml}</td></tr>`)
    } else {
      const dataCellHtml = dataCellComHistorico(item)
      const respCellHtml = respCellComHistorico(item)
      itensRows.push(`<tr style="${E.noBreak}" data-ata-item-row data-ata-id="${idAttr}" data-ata-pai="${paiAttr}" data-ata-desc="${attr(descNorm)}" data-ata-resp="${attr(respNorm)}" data-ata-date="${attr(dataNorm)}" data-ata-status="${attr(statusNorm)}"><td style="${E.resp}">${esc(item.item)}</td><td style="${E.resp}">${descHtml}</td><td style="${E.resp}">${respCellHtml}</td><td style="${E.resp}">${dataCellHtml}</td><td style="${statusEstilo}">${esc(statusDisp)}</td></tr>`)
    }
  })

  const numPaginas = Math.max(1, Math.ceil(itensRows.length / ITENS_POR_PAGINA))
  const paginasHtml: string[] = []

  for (let p = 0; p < numPaginas; p++) {
    const inicio = p * ITENS_POR_PAGINA
    const fim = Math.min(inicio + ITENS_POR_PAGINA, itensRows.length)
    const linhasPagina = itensRows.slice(inicio, fim).join('')

    const header = buildHeaderBlock(c, p + 1, numPaginas, logoDataUrl)
    const isFirst = p === 0

    let tbodyContent: string
    if (isFirst) {
      tbodyContent =
        `<tr style="${E.noBreak}"><td style="${E.layoutCel}"><div style="margin-top:16px;" data-ata-section>` +
        `<table style="${E.tabela}" cellpadding="5" cellspacing="0"><tr style="${E.noBreak}"><td style="${E.secao}">Participantes</td></tr></table>` +
        `<div style="${E.legenda}" data-ata-section>\u{1F7E2} P = Presente&nbsp;&nbsp;|&nbsp;&nbsp;\u{1F534} A = Ausente</div>` +
        `<table style="${E.tabela}" cellpadding="5" cellspacing="0"><tr style="${E.noBreak}"><th style="${E.cabTexto}width:28%;">Nome</th><th style="${E.cabTexto}width:18%;">Empresa</th><th style="${E.cabTexto}width:34%;">E-mail</th><th style="${E.cabTexto}width:10%;">Presença</th><th style="${E.cabTexto}width:10%;">Telefone</th></tr>${participantesRows}</table>` +
        `<table style="${E.tabela}" cellpadding="5" cellspacing="0"><tr style="${E.noBreak}"><td style="${E.secao}">Itens Registrados</td></tr></table>` +
        `</div></td></tr>` +
        `<tr style="${E.noBreak}"><td style="${E.layoutCel}">` +
        `<table style="${E.tabela}" cellpadding="5" cellspacing="0">` +
        `<tr style="${E.noBreak}"><th style="${E.cabTexto}width:10%;">Item</th><th style="${E.cabTexto}width:46%;">Descrição</th><th style="${E.cabTexto}width:18%;">Responsável</th><th style="${E.cabTexto}width:16%;">Data</th><th style="${E.cabTexto}width:10%;text-align:center;">Status</th></tr>${linhasPagina}</table>` +
        `</td></tr>`
    } else {
      const contHeader = p > 0
        ? `<table style="${E.tabela}" cellpadding="5" cellspacing="0" data-ata-section><tr style="${E.noBreak}"><td style="${E.secao}">Itens Registrados (continuação)</td></tr></table>`
        : ''
      tbodyContent =
        `<tr style="${E.noBreak}"><td style="${E.layoutCel}">` + contHeader +
        `<table style="${E.tabela}" cellpadding="5" cellspacing="0">` +
        `<tr style="${E.noBreak}"><th style="${E.cabTexto}width:10%;">Item</th><th style="${E.cabTexto}width:46%;">Descrição</th><th style="${E.cabTexto}width:18%;">Responsável</th><th style="${E.cabTexto}width:16%;">Data</th><th style="${E.cabTexto}width:10%;text-align:center;">Status</th></tr>${linhasPagina}</table>` +
        `</td></tr>`
    }

    const pageBreak = p < numPaginas - 1 ? 'always' : 'auto'
    const bloco =
      `<div class="ata-pagina" style="page-break-after:${pageBreak};">` +
      `<table style="${E.layoutTable}" cellpadding="5" cellspacing="0">` +
      `<thead><tr style="${E.noBreak}"><td style="${E.layoutCel}">${header}</td></tr></thead>` +
      `<tbody>${tbodyContent}</tbody></table></div>`

    paginasHtml.push(bloco)
  }

  const printCss = `
@page {
  margin: 12mm 8mm 18mm 8mm;
  @bottom-center {
    content: "Página " counter(page) " de " counter(pages);
    font-size: 10pt;
    font-family: 'Vale Sans', 'Segoe UI', Arial, sans-serif;
    font-weight: bold;
    color: #333;
  }
}

@media print {
  #ata-filter-bar { display:none!important; }
  .ata-app-link { display:none!important; }
  body { padding:0!important; margin:0!important; }
  #ata-content { padding:0!important; margin:0!important; min-height:auto!important; }
  .ata-pagina { page-break-inside:avoid; }
  .ata-pagina table tr { page-break-inside:avoid; }
  .ata-pagina thead { display:table-header-group; }
  .ata-pagina-num-cell { display:none!important; }
}
`

  const jsonPayload = JSON.stringify(ata).replace(/<\/script>/gi, '<\\/script>')
  const filterScript = getAtaFilterScript()

  const appBaseUrl = options?.appBaseUrl ?? APP_BASE_URL_DEFAULT
  const hashFull = encodeAtaToHash(ata)
  const appLink = appBaseUrl.replace(/\/$/, '') + '#' + hashFull
  const linkBlock =
    '<div class="ata-app-link" style="font-size:9pt;margin-bottom:12px;padding:8px;background:#e0f2f1;border:1px solid #007e7a;border-radius:2px;">' +
    '<a href="' + esc(appLink) + '" target="_blank" rel="noopener" style="color:#007e7a;text-decoration:underline;font-weight:bold;">🔗 Abrir esta ata no aplicativo (modo edição)</a>' +
    '</div>'

  return [
    '<!DOCTYPE html><html lang="pt-BR">',
    '<head><meta charset="UTF-8"><title>' + esc(c.numero) + '</title><style>' + printCss + '</style></head>',
    '<body style="' + E.body + '">',
    '<div id="ata-content" style="' + E.container + '">' + linkBlock + paginasHtml.join('') + '</div>',
    '<script>' + filterScript + '</script>',
    '<script type="application/json" id="' + ID_ATA_JSON + '">' + jsonPayload + '</script>',
    '</body></html>',
  ].join('')
}

export function parseAtaFromHtml(html: string): MeetingMinutes | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const script = doc.getElementById(ID_ATA_JSON)
    if (!script?.textContent) return null
    const data = JSON.parse(script.textContent) as MeetingMinutes
    if (!data?.cabecalho || !Array.isArray(data.attendance) || !Array.isArray(data.itens)) return null
    return data
  } catch {
    return null
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAtaAsHtml(ata: MeetingMinutes): void {
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined
  const { logoDataUrl } = getEnvConfig()
  const html = buildAtaHtml(ata, { appBaseUrl, logoDataUrl })
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const name = (ata.cabecalho.numero || 'ata').replace(/[^a-zA-Z0-9.-]/g, '_') + '.html'
  downloadBlob(blob, name)
}

export function downloadAtaAsJson(ata: MeetingMinutes): void {
  const { logoDataUrl } = getEnvConfig()
  const payload = {
    cabecalho: { ...ata.cabecalho, ...(logoDataUrl ? { logoDataUrl } : {}) },
    attendance: ata.attendance,
    itens: ata.itens,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const name = (ata.cabecalho.numero || 'ata').replace(/[^a-zA-Z0-9.-]/g, '_') + '.json'
  downloadBlob(blob, name)
}

export function printAtaAsPdf(ata: MeetingMinutes): void {
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined
  const { logoDataUrl } = getEnvConfig()
  const html = buildAtaHtml(ata, { appBaseUrl, logoDataUrl })
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para imprimir a ata.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}
