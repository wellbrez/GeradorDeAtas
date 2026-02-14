/**
 * Utilitário para importar ata via URL (hash base64).
 * Permite acessar uma ata específica através de link compartilhável:
 * https://exemplo.com/GeradorDeAtas/#<base64-json-ata>
 * Formato compacto: prefixo "z" + LZString.compressToBase64(json) para caber no QR code
 */
import LZString from 'lz-string'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'

/** Prefixo para link comprimido (lz-string). Links antigos sem prefixo usam base64 puro. */
const PREFIX_COMPRESSED = 'z'
/** Prefixo para formato mínimo (QR): só UltimoHistorico por item, chaves abreviadas. */
const PREFIX_MINIMAL = 'm'

/**
 * Decodifica string base64 para UTF-8.
 */
function base64ToUtf8(base64: string): string {
  try {
    const binary = atob(base64.replace(/\s/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

/**
 * Valida se o objeto tem estrutura mínima de MeetingMinutes ou MeetingMinutesStorage.
 */
function isValidAtaData(obj: unknown): obj is MeetingMinutes | MeetingMinutesStorage {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  if (!o.cabecalho || typeof o.cabecalho !== 'object') return false
  if (!Array.isArray(o.attendance)) return false
  if (!Array.isArray(o.itens)) return false
  return true
}

/**
 * Extrai MeetingMinutesStorage de objeto MeetingMinutes ou MeetingMinutesStorage.
 */
function toStorage(obj: MeetingMinutes | MeetingMinutesStorage): MeetingMinutesStorage {
  return {
    cabecalho: (obj as MeetingMinutesStorage).cabecalho,
    attendance: (obj as MeetingMinutesStorage).attendance,
    itens: (obj as MeetingMinutesStorage).itens,
  }
}

/** Formato mínimo para QR: {c,a,i} e itens com {id,item,nivel,pai,filhos,criadoEm,u} onde u=UltimoHistorico. */
function toMinimalPayload(ata: MeetingMinutesStorage): unknown {
  return {
    c: ata.cabecalho,
    a: ata.attendance,
    i: ata.itens.map((item) => ({
      id: item.id,
      item: item.item,
      nivel: item.nivel,
      pai: item.pai,
      filhos: item.filhos,
      criadoEm: item.criadoEm,
      u: item.UltimoHistorico,
    })),
  }
}

function expandMinimalJson(jsonStr: string): string | null {
  try {
    const m = JSON.parse(jsonStr) as { c?: unknown; a?: unknown; i?: Array<Record<string, unknown>> }
    if (!m.c || !Array.isArray(m.a) || !Array.isArray(m.i)) return null
    const defaultHist = { id: '', criadoEm: '', descricao: '', responsavel: { nome: '', email: '' }, data: null, status: 'Pendente' }
    const expanded = {
      cabecalho: m.c,
      attendance: m.a,
      itens: m.i.map((x) => {
        const u = x.u ?? defaultHist
        return {
          id: x.id,
          item: x.item,
          nivel: x.nivel,
          pai: x.pai ?? null,
          filhos: x.filhos ?? [],
          criadoEm: x.criadoEm,
          historico: u ? [u] : [],
          UltimoHistorico: u,
        }
      }),
    }
    return JSON.stringify(expanded)
  } catch {
    return null
  }
}

/**
 * Parse da ata a partir do hash da URL (#base64).
 * Retorna MeetingMinutesStorage se válido, null caso contrário.
 *
 * @returns MeetingMinutesStorage ou null
 */
export function parseAtaFromHash(): MeetingMinutesStorage | null {
  const hash = window.location.hash
  if (!hash || hash.length <= 1) return null

  const encoded = hash.startsWith('#') ? hash.slice(1) : hash
  if (!encoded.trim()) return null

  let jsonStr: string | null = null

  if (encoded.startsWith(PREFIX_MINIMAL)) {
    jsonStr = LZString.decompressFromBase64(encoded.slice(PREFIX_MINIMAL.length))
    if (jsonStr) jsonStr = expandMinimalJson(jsonStr)
  } else if (encoded.startsWith(PREFIX_COMPRESSED)) {
    jsonStr = LZString.decompressFromBase64(encoded.slice(PREFIX_COMPRESSED.length))
  } else {
    jsonStr = base64ToUtf8(encoded)
  }

  if (!jsonStr) return null

  try {
    const parsed = JSON.parse(jsonStr) as unknown
    if (!isValidAtaData(parsed)) return null
    return toStorage(parsed)
  } catch {
    return null
  }
}

/**
 * Codifica ata em base64 para uso em URL.
 * Útil para gerar link compartilhável.
 *
 * @param ata - Ata completa ou apenas storage
 * @returns String base64 para colocar após #
 */
/**
 * Codifica ata para URL (comprimido com lz-string).
 * Formato: "z" + compressToBase64(json)
 */
export function encodeAtaToHash(ata: MeetingMinutes | MeetingMinutesStorage): string {
  const payload = toStorage(ata)
  const json = JSON.stringify(payload)
  return PREFIX_COMPRESSED + LZString.compressToBase64(json)
}

/**
 * Codifica ata em formato mínimo para QR code (limite ~2.9KB).
 * Usa chaves curtas e só UltimoHistorico por item.
 */
export function encodeAtaToHashForQr(ata: MeetingMinutes | MeetingMinutesStorage): string {
  const payload = toStorage(ata)
  const minimal = toMinimalPayload(payload)
  const json = JSON.stringify(minimal)
  return PREFIX_MINIMAL + LZString.compressToBase64(json)
}
