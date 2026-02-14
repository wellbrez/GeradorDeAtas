/**
 * Utilitário para importar ata via URL (hash base64).
 * Permite acessar uma ata específica através de link compartilhável:
 * https://exemplo.com/GeradorDeAtas/#<base64-json-ata>
 */
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'

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

  const jsonStr = base64ToUtf8(encoded)
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
export function encodeAtaToHash(ata: MeetingMinutes | MeetingMinutesStorage): string {
  const payload = toStorage(ata)
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
