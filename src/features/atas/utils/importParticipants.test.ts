import { describe, expect, it } from 'vitest'
import { parseParticipantsFromFile } from './importParticipants'

function makeCsvFile(content: string, name = 'participantes.csv'): File {
  return new File([content], name, { type: 'text/csv' })
}

describe('parseParticipantsFromFile', () => {
  it('parses Teams presence report section and ignores following sections', async () => {
    const teamsReport = [
      '1. Informacoes da reuniao',
      'qualquer coisa',
      '2. Participantes',
      'Nome\tID do participante (UPN)\tCompany\tPhone number',
      'Maria\tmaria@empresa.com\tVale\t11999990000',
      'Joao\tjoao@empresa.com\tVale\t',
      '3. Outras informacoes',
      'nao deve entrar',
    ].join('\n')

    const participants = await parseParticipantsFromFile(makeCsvFile(teamsReport))

    expect(participants).toHaveLength(2)
    expect(participants[0]).toEqual({
      nome: 'Maria',
      email: 'maria@empresa.com',
      empresa: 'Vale',
      telefone: '11999990000',
      presenca: 'P',
    })
    expect(participants[1]?.nome).toBe('Joao')
  })

  it('parses generic semicolon CSV and keeps fallback values for incomplete rows', async () => {
    const csv = [
      'Nome;E-mail;Empresa;Telefone',
      'Ana;ana@empresa.com;Projeto X;1111-1111',
      ';semnome@empresa.com;Projeto X;2222-2222',
      ';;;',
    ].join('\n')

    const participants = await parseParticipantsFromFile(makeCsvFile(csv))

    expect(participants).toHaveLength(2)
    expect(participants[0]?.nome).toBe('Ana')
    expect(participants[1]).toEqual({
      nome: '(Sem nome)',
      email: 'semnome@empresa.com',
      empresa: 'Projeto X',
      telefone: '2222-2222',
      presenca: 'P',
    })
  })

  it('throws clear error for unsupported file extensions', async () => {
    const txtFile = new File(['conteudo'], 'participantes.txt', { type: 'text/plain' })

    await expect(parseParticipantsFromFile(txtFile)).rejects.toThrow(
      'Formato não suportado. Use .csv ou .xlsx'
    )
  })
})
