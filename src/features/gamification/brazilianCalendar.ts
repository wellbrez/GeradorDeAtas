/**
 * Feriados nacionais brasileiros e lógica de dias úteis (exclui sábado, domingo e feriados).
 * Usado para streak corporativo: sexta → segunda conta como consecutivo.
 *
 * @module gamification/brazilianCalendar
 */

/** Feriados fixos (MM-DD). Feriados móveis tratados por função. */
const FIXED_HOLIDAYS: string[] = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Consciência Negra
  '12-25', // Natal
]

/** Retorna a data da Páscoa (domingo) no ano dado (algoritmo de Meeus). */
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** Retorna Set de datas YYYY-MM-DD de feriados no ano. */
const holidayCache: Record<number, Set<string>> = {}

function getHolidaysForYear(year: number): Set<string> {
  if (holidayCache[year]) return holidayCache[year]
  const set = new Set<string>()
  FIXED_HOLIDAYS.forEach((mmdd) => {
    set.add(`${year}-${mmdd}`)
  })
  const easter = getEasterSunday(year)
  const carnival = new Date(easter)
  carnival.setDate(carnival.getDate() - 47)
  const goodFriday = new Date(easter)
  goodFriday.setDate(goodFriday.getDate() - 2)
  const corpusChristi = new Date(easter)
  corpusChristi.setDate(corpusChristi.getDate() + 60)
  ;[carnival, goodFriday, corpusChristi].forEach((d) => {
    set.add(d.toISOString().slice(0, 10))
  })
  holidayCache[year] = set
  return set
}

/** Verifica se a data (YYYY-MM-DD ou Date) é fim de semana (sábado=6, domingo=0). */
export function isWeekend(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00Z') : date
  const day = d.getDay()
  return day === 0 || day === 6
}

/** Verifica se a data é feriado nacional brasileiro. */
export function isHoliday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00Z') : date
  const key = typeof date === 'string' ? date : date.toISOString().slice(0, 10)
  return getHolidaysForYear(d.getFullYear()).has(key)
}

/** Dia útil = não é sábado, domingo nem feriado. */
export function isBusinessDay(date: string | Date): boolean {
  return !isWeekend(date) && !isHoliday(date)
}

/**
 * Calcula streak de dias úteis consecutivos (de hoje para trás).
 * Sexta → segunda conta como consecutivo (sáb/dom são ignorados).
 */
export function getBusinessDayStreak(datesWithAta: Set<string>, today: string): number {
  let streak = 0
  const todayDate = new Date(today + 'T12:00:00Z')
  let d = new Date(todayDate.getTime())

  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!isBusinessDay(key)) {
      d.setDate(d.getDate() - 1)
      continue
    }
    if (datesWithAta.has(key)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
