// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { copyMeetingMinutes, createMeetingMinutes, getMeetingMinutesById } from './meetingMinutesService'
import { storageService } from '@services/storage'

describe('meetingMinutesService regression coverage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('archives only older matching minutes when contrato is optional', () => {
    storageService.saveMeetingMinutes('old-match', {
      cabecalho: {
        numero: '001',
        data: '2026-03-10',
        tipo: 'Kick-Off',
        titulo: 'Plano de Execucao',
        responsavel: 'Ana',
        projeto: 'Projeto Vale',
      },
      attendance: [],
      itens: [],
      createdAt: '2026-03-10T12:00:00.000Z',
      updatedAt: '2026-03-10T12:00:00.000Z',
    })

    storageService.saveMeetingMinutes('old-different-contract', {
      cabecalho: {
        numero: '002',
        data: '2026-03-09',
        tipo: 'Kick-Off',
        titulo: 'Plano de Execucao',
        responsavel: 'Ana',
        projeto: 'Projeto Vale',
        contrato: 'CT-77',
      },
      attendance: [],
      itens: [],
      createdAt: '2026-03-09T12:00:00.000Z',
      updatedAt: '2026-03-09T12:00:00.000Z',
    })

    storageService.saveMeetingMinutes('newer-same', {
      cabecalho: {
        numero: '003',
        data: '2026-03-30',
        tipo: 'Kick-Off',
        titulo: 'Plano de Execucao',
        responsavel: 'Ana',
        projeto: 'Projeto Vale',
        contrato: '',
      },
      attendance: [],
      itens: [],
      createdAt: '2026-03-30T12:00:00.000Z',
      updatedAt: '2026-03-30T12:00:00.000Z',
    })

    createMeetingMinutes({
      cabecalho: {
        numero: '004',
        data: '2026-03-20',
        tipo: 'Kick-Off',
        titulo: 'Plano de Execucao',
        responsavel: 'Bruno',
        projeto: 'Projeto Vale',
        contrato: '',
      },
      attendance: [],
      itens: [],
    })

    const oldMatch = storageService.getMeetingMinutes('old-match') as { arquivada?: boolean }
    const oldDifferentContract = storageService.getMeetingMinutes('old-different-contract') as { arquivada?: boolean }
    const newerSame = storageService.getMeetingMinutes('newer-same') as { arquivada?: boolean }

    expect(oldMatch.arquivada).toBe(true)
    expect(oldDifferentContract.arquivada).not.toBe(true)
    expect(newerSame.arquivada).not.toBe(true)
  })

  it('copies malformed minutes with duplicate IDs and keeps valid hierarchy/history', () => {
    const sharedHistory = {
      id: 'hist-original',
      criadoEm: '2026-03-18T10:00:00.000Z',
      descricao: 'Acao em andamento',
      responsavel: { nome: 'Carlos', email: 'carlos@vale.com' },
      data: '2026-03-25',
      status: 'Em Andamento',
    }

    storageService.saveMeetingMinutes('source-dup', {
      cabecalho: {
        numero: '100',
        data: '2026-03-18',
        tipo: 'Reunião de Acompanhamento',
        titulo: 'Acompanhamento de Pendencias',
        responsavel: 'Carlos',
        projeto: 'Projeto Norte',
      },
      attendance: [],
      itens: [
        {
          id: 'dup',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: ['dup', 'child'],
          criadoEm: '2026-03-18T10:00:00.000Z',
          historico: [],
          UltimoHistorico: undefined,
        },
        {
          id: 'dup',
          item: '1.1',
          nivel: 2,
          pai: 'dup',
          filhos: [],
          criadoEm: '2026-03-18T10:01:00.000Z',
          historico: [sharedHistory],
          UltimoHistorico: sharedHistory,
        },
        {
          id: 'child',
          item: '1.2',
          nivel: 2,
          pai: 'dup',
          filhos: [],
          criadoEm: '2026-03-18T10:02:00.000Z',
          historico: [
            {
              id: 'hist-child',
              criadoEm: '2026-03-18T10:02:00.000Z',
              descricao: 'Item filho',
              responsavel: { nome: 'Dani', email: 'dani@vale.com' },
              data: '2026-03-26',
              status: 'Pendente',
            },
          ],
          UltimoHistorico: {
            id: 'hist-child',
            criadoEm: '2026-03-18T10:02:00.000Z',
            descricao: 'Item filho',
            responsavel: { nome: 'Dani', email: 'dani@vale.com' },
            data: '2026-03-26',
            status: 'Pendente',
          },
        },
      ],
      createdAt: '2026-03-18T10:00:00.000Z',
      updatedAt: '2026-03-18T10:00:00.000Z',
    } as unknown)

    const copied = copyMeetingMinutes('source-dup')
    expect(copied).not.toBeNull()

    const copiedFromStorage = getMeetingMinutesById(copied!.id)
    expect(copiedFromStorage).not.toBeNull()
    expect(copiedFromStorage!.cabecalho.numero).toBe('')
    expect(copiedFromStorage!.itens).toHaveLength(3)

    const newItemIds = new Set(copiedFromStorage!.itens.map((item) => item.id))
    expect(newItemIds.size).toBe(3)

    const oldHistoryIds = new Set(['hist-original', 'hist-child'])

    copiedFromStorage!.itens.forEach((item) => {
      expect(item.id === 'dup' || item.id === 'child').toBe(false)
      if (item.pai) {
        expect(newItemIds.has(item.pai)).toBe(true)
      }
      item.filhos.forEach((childId) => {
        expect(newItemIds.has(childId)).toBe(true)
      })

      expect(item.historico.length).toBeGreaterThan(0)
      const lastHistory = item.historico[item.historico.length - 1]!
      expect(item.UltimoHistorico.id).toBe(lastHistory.id)
      expect(oldHistoryIds.has(lastHistory.id)).toBe(false)
    })

    const copiedParent = copiedFromStorage!.itens.find((item) => item.item === '1')
    expect(copiedParent).toBeDefined()
    expect(copiedParent!.historico[0]?.status).toBe('Pendente')
  })
})
