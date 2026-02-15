/**
 * Formatação de números de Selos no estilo Cookie Clicker.
 * Referência: https://gist.github.com/mwtaylor/2dff7b041709e51c34a5d7b5dfb971cb
 *
 * - Números pequenos: separador de milhares em pt-BR (1.234 ou 1.234,56).
 * - Números médios: sufixo k, M, B, T, Qa, Qi… com mantissa (ex.: 10,5 M, 1,23 B).
 * - Números muito grandes: notação exponencial (ex.: 1,00×10¹⁰² ou 1e⁹⁹⁹).
 *
 * Dois modos: COMPACT (barra, toast; até ~6 caracteres) e STANDARD (loja, painel expandido; até ~13 caracteres).
 */

const PT_BR = 'pt-BR'

/** Limite para usar vírgula em vez de sufixo: COMPACT até 100k, STANDARD até 10B */
const COMPACT_COMMA_MAX = 100_000
const STANDARD_COMMA_MAX = 10_000_000_000

/** Sufixos por potência de 10 (expoente). COMPACT usa sigla curta, STANDARD usa espaço + sigla. */
const SUFFIXES: { exp: number; short: string; long: string }[] = [
  { exp: 3, short: 'k', long: ' k' },
  { exp: 6, short: 'M', long: ' M' },
  { exp: 9, short: 'B', long: ' B' },
  { exp: 12, short: 'T', long: ' T' },
  { exp: 15, short: 'Qa', long: ' Qa' },
  { exp: 18, short: 'Qi', long: ' Qi' },
  { exp: 21, short: 'Sx', long: ' Sx' },
  { exp: 24, short: 'Sp', long: ' Sp' },
  { exp: 27, short: 'O', long: ' O' },
  { exp: 30, short: 'N', long: ' N' },
  { exp: 33, short: 'D', long: ' D' },
]

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
  '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

function toSuperscript(n: number): string {
  return String(n).split('').map((c) => SUPERSCRIPT[c] ?? c).join('')
}

function getExponent(value: number): number {
  if (value <= 0 || !Number.isFinite(value)) return 0
  return Math.floor(Math.log10(value))
}

/**
 * Formata um valor numérico de Selos para exibição.
 * @param value - Valor a formatar (deve ser >= 0 e finito).
 * @param mode - 'compact' para barra/toast (até ~6 caracteres), 'standard' para loja/painel (até ~13 caracteres).
 */
export function formatSelos(value: number, mode: 'compact' | 'standard' = 'standard'): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return '0'
  }
  const isCompact = mode === 'compact'
  const commaMax = isCompact ? COMPACT_COMMA_MAX : STANDARD_COMMA_MAX

  if (value < commaMax) {
    return value.toLocaleString(PT_BR, {
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1 ? 2 : 3,
    })
  }

  const exp = getExponent(value)
  for (const { exp: e, short, long } of SUFFIXES) {
    if (exp >= e && exp < e + 3) {
      const mantissa = value / Math.pow(10, e)
      const suffix = isCompact ? short : long
      const decimals = isCompact ? (mantissa >= 100 ? 0 : mantissa >= 10 ? 1 : 2) : 3
      const mantissaStr = mantissa.toLocaleString(PT_BR, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })
      return mantissaStr + suffix
    }
  }

  const exponent = SUFFIXES.length * 3
  if (exp >= exponent) {
    const mantissa = value / Math.pow(10, exp)
    const mantissaStr = mantissa.toLocaleString(PT_BR, {
      minimumFractionDigits: 0,
      maximumFractionDigits: isCompact ? 1 : 2,
    })
    if (isCompact) {
      return `${mantissaStr}e${toSuperscript(exp)}`
    }
    return `${mantissaStr}×10${toSuperscript(exp)}`
  }

  return value.toLocaleString(PT_BR, { maximumFractionDigits: 0 })
}

/**
 * Formata o ganho de Selos para o toast (ex.: "+ 1,020" ou "+ 1,23k").
 * Valores pequenos com até 3 decimais; maiores no modo compact.
 */
export function formatSelosGain(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '0'
  }
  if (value < 1e3) {
    return value.toLocaleString(PT_BR, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  }
  return formatSelos(value, 'compact')
}
