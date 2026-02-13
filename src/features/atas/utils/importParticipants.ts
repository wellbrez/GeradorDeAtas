import type { Participant } from '@/types'

/**
 * Mapeia nomes de colunas comuns (Teams, Excel padrão) para o campo do participante.
 * Case-insensitive; aceita formato do relatório de presença do Teams (Nome, Email, ID do participante (UPN), etc.).
 */
const COLUMN_ALIASES: Record<string, (keyof Participant)[]> = {
  nome: ['nome'],
  name: ['nome'],
  'attendee name': ['nome'],
  'nome do participante': ['nome'],
  participant: ['nome'],
  participante: ['nome'],
  email: ['email'],
  'e-mail': ['email'],
  'e-mail address': ['email'],
  'id do participante (upn)': ['email'],
  'id do participante': ['email'],
  upn: ['email'],
  empresa: ['empresa'],
  company: ['empresa'],
  organization: ['empresa'],
  telefone: ['telefone'],
  phone: ['telefone'],
  'phone number': ['telefone'],
  telefone2: ['telefone'],
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findFieldForHeader(header: string): keyof Participant | null {
  const n = normalizeHeader(header)
  for (const [key, fields] of Object.entries(COLUMN_ALIASES)) {
    if (n.includes(key) || key.includes(n)) return fields[0]
  }
  return null
}

/**
 * Detecta e extrai a tabela "2. Participantes" do relatório de presença do Teams.
 * Formato: seção "2. Participantes", linha seguinte = cabeçalho (TAB), depois linhas de dados até "3. ..." ou vazia.
 */
function parseTeamsPresenceReport(text: string): string[][] | null {
  const lines = text.split(/\r?\n/)
  let sectionStart = -1
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^2\.\s*Participantes\s*$/i.test(trimmed)) {
      sectionStart = i
      break
    }
  }
  if (sectionStart < 0) return null
  const headerLine = lines[sectionStart + 1]?.trim()
  if (!headerLine) return null
  const headerRow = headerLine.split('\t').map((h) => h.trim())
  const normalizedHeaders = headerRow.map((h) => normalizeHeader(h))
  const hasNome = normalizedHeaders.some((h) => h === 'nome' || h.startsWith('nome'))
  const hasEmail =
    normalizedHeaders.some((h) => h === 'email' || h.includes('email') || h.includes('upn')) ||
    headerRow.some((h) => /e-?mail|upn/i.test(h))
  if (!hasNome || !hasEmail) return null
  const rows: string[][] = [headerRow]
  for (let i = sectionStart + 2; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) break
    if (/^\d+\.\s+/.test(trimmed)) break
    rows.push(line.split('\t').map((c) => c.trim()))
  }
  return rows
}

/**
 * Parse CSV genérico: delimitador TAB (Teams), ; ou ,; suporte a aspas.
 */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return []
  const firstLine = lines[0]
  const tabCount = (firstLine.match(/\t/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const delimiter = tabCount >= Math.max(semicolonCount, commaCount) && tabCount > 0 ? '\t' : firstLine.includes(';') ? ';' : ','
  const rows: string[][] = []
  for (const line of lines) {
    const row: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if (!inQuotes && c === delimiter) {
        row.push(current.trim())
        current = ''
      } else {
        current += c
      }
    }
    row.push(current.trim())
    rows.push(row)
  }
  return rows
}

function rowsToParticipants(rows: string[][]): Participant[] {
  if (rows.length < 2) return []
  const headerRow = rows[0]
  const fieldToIndex: Partial<Record<keyof Participant, number>> = {}
  headerRow.forEach((raw, i) => {
    const field = findFieldForHeader(raw)
    if (field && fieldToIndex[field] == null) fieldToIndex[field] = i
  })
  const nomeIdx = fieldToIndex.nome ?? headerRow.findIndex((h) => /name|nome|participant|attendee/i.test(h))
  const emailIdx = fieldToIndex.email ?? headerRow.findIndex((h) => /e-?mail/i.test(h))
  if (nomeIdx < 0 && emailIdx < 0) return []
  const result: Participant[] = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const nome = (nomeIdx >= 0 ? row[nomeIdx] : row[emailIdx] ?? '').trim()
    const email = (emailIdx >= 0 ? row[emailIdx] : '').trim()
    if (!nome && !email) continue
    result.push({
      nome: nome || '(Sem nome)',
      email: email || '',
      empresa: (fieldToIndex.empresa != null ? row[fieldToIndex.empresa] : '').trim() ?? '',
      telefone: (fieldToIndex.telefone != null ? row[fieldToIndex.telefone] : '').trim() ?? '',
      presenca: 'P',
    })
  }
  return result
}

/**
 * Importa participantes a partir de arquivo CSV (ex.: exportação Teams) ou Excel.
 * Colunas reconhecidas: Nome/Attendee name/Name, E-mail/Email, Empresa/Company, Telefone/Phone.
 */
export async function parseParticipantsFromFile(file: File): Promise<Participant[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) {
    const text = await file.text()
    const teamsRows = parseTeamsPresenceReport(text)
    const rows = teamsRows ?? parseCSV(text)
    return rowsToParticipants(rows)
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const firstSheet = wb.Sheets[wb.SheetNames[0]]
    if (!firstSheet) return []
    const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][]
    if (!rows.length) return []
    return rowsToParticipants(rows)
  }
  throw new Error('Formato não suportado. Use .csv ou .xlsx')
}
