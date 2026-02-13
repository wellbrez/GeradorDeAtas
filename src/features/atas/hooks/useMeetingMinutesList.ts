/**
 * Hook para gerenciar lista de atas
 */
import { useState, useEffect, useCallback } from 'react'
import { getAllMeetingMinutes, deleteMeetingMinutes, copyMeetingMinutes } from '../services/meetingMinutesService'
import type { MeetingMinutes } from '@types'

export function useMeetingMinutesList() {
  const [atas, setAtas] = useState<MeetingMinutes[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAtas = useCallback(() => {
    setLoading(true)
    setError(null)

    try {
      const allAtas = getAllMeetingMinutes()
      setAtas(allAtas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAtas()
  }, [loadAtas])

  const remove = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        const success = deleteMeetingMinutes(id)
        if (success) {
          loadAtas() // Recarrega a lista
        }
        return success
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao remover ata'
        setError(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    [loadAtas]
  )

  const copy = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        const copied = copyMeetingMinutes(id)
        if (copied) {
          loadAtas() // Recarrega a lista
        }
        return copied
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao copiar ata'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [loadAtas]
  )

  return {
    atas,
    loading,
    error,
    refresh: loadAtas,
    remove,
    copy,
  }
}
