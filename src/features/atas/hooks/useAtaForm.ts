import { useState, useCallback, useEffect } from 'react'
import { generateId } from '@/utils'
import { getNextRootNumber, getNextChildNumber, sortItemsByNumber } from '@/utils/itemNumbering'
import type {
  Cabecalho,
  Participant,
  Item,
  HistoricoItem,
  ItemStatus,
  MeetingMinutes,
  MeetingMinutesStorage,
} from '@/types'

const TIPOS_ATA = [
  'Kick-Off',
  'Reunião de Acompanhamento',
  'Reunião Extraordinária',
  'Outra',
] as const

const defaultCabecalho = (): Cabecalho => ({
  numero: '',
  data: new Date().toISOString().split('T')[0],
  tipo: '',
  titulo: '',
  responsavel: '',
  projeto: '',
})

function createHistoricoVazio(): HistoricoItem {
  return {
    id: generateId(),
    criadoEm: new Date().toISOString(),
    descricao: '',
    responsavel: { email: '', nome: '' },
    data: null,
    status: 'Pendente',
  }
}

/**
 * Hook para gerenciamento do formulário de ata (cabeçalho, participantes, itens).
 * @param ataExistente - Ata em edição ou null para nova ata
 * @param isCopy - Se true, está criando uma cópia da ata existente
 * @param initialDraft - Estado inicial vindo de rascunho restaurado (prioridade sobre ataExistente)
 */
export function useAtaForm(
  ataExistente: MeetingMinutes | null,
  isCopy: boolean,
  initialDraft: MeetingMinutesStorage | null = null
) {
  const [cabecalho, setCabecalho] = useState<Cabecalho>(() => {
    if (initialDraft) return { ...initialDraft.cabecalho }
    if (!ataExistente) return defaultCabecalho()
    return { ...ataExistente.cabecalho }
  })
  const [attendance, setAttendance] = useState<Participant[]>(() => {
    if (initialDraft) return initialDraft.attendance.map((p: Participant) => ({ ...p }))
    if (!ataExistente) return []
    return ataExistente.attendance.map((p: Participant) => ({ ...p }))
  })
  const [itens, setItens] = useState<Item[]>(() => {
    if (initialDraft) {
      return initialDraft.itens.map((i: Item) => ({
        ...i,
        historico: [...(i.historico || [])],
        UltimoHistorico: { ...i.UltimoHistorico },
      }))
    }
    if (!ataExistente) return []
    if (isCopy) {
      const oldToNewId: Record<string, string> = {}
      ataExistente.itens.forEach((item: Item) => {
        oldToNewId[item.id] = 'item-' + generateId()
      })
      return ataExistente.itens.map((item: Item) => {
        const newId = oldToNewId[item.id]
        const ultimo = item.UltimoHistorico
        const novoUltimo: HistoricoItem = {
          id: 'hist-' + generateId(),
          criadoEm: new Date().toISOString(),
          descricao: ultimo.descricao,
          responsavel: { ...ultimo.responsavel },
          data: ultimo.data,
          status: ultimo.status,
        }
        return {
          ...item,
          id: newId,
          criadoEm: new Date().toISOString(),
          historico: [novoUltimo],
          UltimoHistorico: novoUltimo,
          filhos: (item.filhos || []).map((oldChildId: string) => oldToNewId[oldChildId] ?? oldChildId),
        }
      })
    }
    return ataExistente.itens.map((i: Item) => ({
      ...i,
      historico: [...i.historico],
      UltimoHistorico: { ...i.UltimoHistorico },
    }))
  })

  useEffect(() => {
    if (initialDraft) return
    if (!ataExistente) {
      setCabecalho(defaultCabecalho())
      setAttendance([])
      setItens([])
      return
    }

    setCabecalho({ ...ataExistente.cabecalho })
    setAttendance(ataExistente.attendance.map((p: Participant) => ({ ...p })))

    if (isCopy) {
      setCabecalho((c: Cabecalho) => ({
        ...c,
        numero: '',
        data: new Date().toISOString().split('T')[0],
      }))
      const oldToNewId: Record<string, string> = {}
      ataExistente.itens.forEach((item: Item) => {
        oldToNewId[item.id] = 'item-' + generateId()
      })
      setItens(
        ataExistente.itens.map((item: Item) => {
          const newId = oldToNewId[item.id]
          const ultimo = item.UltimoHistorico
          const novoUltimo: HistoricoItem = {
            id: 'hist-' + generateId(),
            criadoEm: new Date().toISOString(),
            descricao: ultimo.descricao,
            responsavel: { ...ultimo.responsavel },
            data: ultimo.data,
            status: ultimo.status,
          }
          return {
            ...item,
            id: newId,
            criadoEm: new Date().toISOString(),
            historico: [novoUltimo],
            UltimoHistorico: novoUltimo,
            filhos: (item.filhos || []).map((oldChildId: string) => oldToNewId[oldChildId] ?? oldChildId),
          }
        })
      )
    } else {
      setItens(ataExistente.itens.map((i: Item) => ({ ...i, historico: [...i.historico], UltimoHistorico: { ...i.UltimoHistorico } })))
    }
  }, [ataExistente, isCopy])

  const updateCabecalho = useCallback((patch: Partial<Cabecalho>) => {
    setCabecalho((c: Cabecalho) => ({ ...c, ...patch }))
  }, [])

  const addParticipant = useCallback((p: Participant) => {
    setAttendance((prev) => [...prev, p])
  }, [])

  const removeParticipant = useCallback((index: number) => {
    setAttendance((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const togglePresenca = useCallback((index: number) => {
    setAttendance((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, presenca: p.presenca === 'P' ? 'A' : 'P' } : p
      )
    )
  }, [])

  const updateParticipant = useCallback((index: number, patch: Partial<Participant>) => {
    setAttendance((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    )
  }, [])

  const markAllAbsent = useCallback(() => {
    setAttendance((prev) => prev.map((p) => ({ ...p, presenca: 'A' as const })))
  }, [])

  const addItemRaiz = useCallback((): string => {
    const newId = 'item-' + generateId()
    const hist = createHistoricoVazio()
    const proximoNum = getNextRootNumber(itens)
    setItens((prev) => [
      ...prev,
      {
        id: newId,
        item: String(proximoNum),
        nivel: 1,
        pai: null,
        filhos: [],
        criadoEm: new Date().toISOString(),
        historico: [hist],
        UltimoHistorico: hist,
      },
    ])
    return newId
  }, [itens])

  const addSubItem = useCallback((paiId: string): string | undefined => {
    const pai = itens.find((i) => i.id === paiId)
    if (!pai) return undefined

    const newId = 'item-' + generateId()
    const hist = createHistoricoVazio()
    const proximoNum = getNextChildNumber(itens, paiId)

    setItens((prev) => {
      const novo: Item = {
        id: newId,
        item: proximoNum,
        nivel: pai.nivel + 1,
        pai: paiId,
        filhos: [],
        criadoEm: new Date().toISOString(),
        historico: [hist],
        UltimoHistorico: hist,
      }
      const novosItens = [...prev, novo]
      return novosItens.map((i) =>
        i.id === paiId ? { ...i, filhos: [...i.filhos, newId] } : i
      )
    })
    return newId
  }, [itens])

  const updateItemNumber = useCallback((itemId: string, newItem: string) => {
    setItens((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, item: newItem } : i))
    )
  }, [])

  const addHistoricoToItem = useCallback(
    (
      itemId: string,
      descricao: string,
      responsavelNome: string,
      responsavelEmail: string,
      data: string | null,
      status: ItemStatus
    ) => {
      const novo: HistoricoItem = {
        id: 'hist-' + generateId(),
        criadoEm: new Date().toISOString(),
        descricao,
        responsavel: { nome: responsavelNome, email: responsavelEmail },
        data,
        status,
      }
      setItens((prev) =>
        prev.map((i) => {
          if (i.id !== itemId) return i
          const hist = i.historico ?? []
          const primeiro = hist[0]
          const ehUnicoEVazio =
            hist.length === 1 &&
            primeiro &&
            primeiro.descricao === '' &&
            !primeiro.responsavel?.nome &&
            !primeiro.responsavel?.email
          if (ehUnicoEVazio) {
            return { ...i, historico: [novo], UltimoHistorico: novo }
          }
          return { ...i, historico: [...hist, novo], UltimoHistorico: novo }
        })
      )
    },
    []
  )

  const removeItem = useCallback((itemId: string) => {
    setItens((prev) => {
      const item = prev.find((i) => i.id === itemId)
      if (!item) return prev
      const idsToRemove = new Set<string>([itemId])
      const collectChildren = (id: string) => {
        prev.filter((i) => i.pai === id).forEach((i) => {
          idsToRemove.add(i.id)
          collectChildren(i.id)
        })
      }
      collectChildren(itemId)
      const newItens = prev.filter((i) => !idsToRemove.has(i.id))
      return newItens.map((i) =>
        i.filhos.length
          ? { ...i, filhos: i.filhos.filter((f: string) => !idsToRemove.has(f)) }
          : i
      )
    })
  }, [])

  /** Remove um registro do histórico do item. Só permite se houver mais de um histórico. */
  const removeHistorico = useCallback((itemId: string, historicoId: string) => {
    setItens((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i
        const hist = i.historico ?? []
        if (hist.length <= 1) return i
        const novoHist = hist.filter((h) => h.id !== historicoId)
        const novoUltimo = novoHist[novoHist.length - 1]
        if (!novoUltimo) return i
        return { ...i, historico: novoHist, UltimoHistorico: novoUltimo }
      })
    )
  }, [])

  /** Atualiza a data de criação (criadoEm) de um registro do histórico. */
  const updateHistoricoCriadoEm = useCallback(
    (itemId: string, historicoId: string, novoCriadoEm: string) => {
      setItens((prev) =>
        prev.map((i) => {
          if (i.id !== itemId) return i
          const historico = (i.historico ?? []).map((h) =>
            h.id === historicoId
              ? { ...h, criadoEm: novoCriadoEm }
              : h
          )
          const ultimo = i.UltimoHistorico?.id === historicoId
            ? { ...i.UltimoHistorico, criadoEm: novoCriadoEm }
            : i.UltimoHistorico
          return {
            ...i,
            historico,
            UltimoHistorico: ultimo ?? historico[historico.length - 1]!,
          }
        })
      )
    },
    []
  )

  const itensOrdenados = sortItemsByNumber(itens)

  const canAvancarEtapa =
    attendance.length > 0 &&
    !!cabecalho.numero?.trim() &&
    !!cabecalho.tipo?.trim() &&
    !!cabecalho.titulo?.trim()

  const canSalvar = itens.length > 0

  return {
    cabecalho,
    attendance,
    itens: itensOrdenados,
    updateCabecalho,
    addParticipant,
    removeParticipant,
    updateParticipant,
    togglePresenca,
    markAllAbsent,
    addItemRaiz,
    addSubItem,
    updateItemNumber,
    addHistoricoToItem,
    removeItem,
    removeHistorico,
    updateHistoricoCriadoEm,
    canAvancarEtapa,
    canSalvar,
    TIPOS_ATA: TIPOS_ATA as unknown as string[],
  }
}
