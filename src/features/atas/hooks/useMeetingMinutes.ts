/**
 * Hook para gerenciar uma ata específica
 */
import { useState, useEffect, useCallback } from 'react'
import {
  getMeetingMinutesById,
  updateMeetingMinutes,
  deleteMeetingMinutes,
} from '../services/meetingMinutesService'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'

export function useMeetingMinutes(id: string | null) {
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinutes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setMeetingMinutes(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = getMeetingMinutesById(id)
      setMeetingMinutes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ata')
    } finally {
      setLoading(false)
    }
  }, [id])

  const update = useCallback(
    async (storage: MeetingMinutesStorage) => {
      if (!id) return null

      setLoading(true)
      setError(null)

      try {
        const updated = updateMeetingMinutes(id, storage)
        setMeetingMinutes(updated)
        return updated
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar ata'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [id]
  )

  const remove = useCallback(async () => {
    if (!id) return false

    setLoading(true)
    setError(null)

    try {
      const success = deleteMeetingMinutes(id)
      if (success) {
        setMeetingMinutes(null)
      }
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover ata'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [id])

  return {
    meetingMinutes,
    loading,
    error,
    update,
    remove,
  }
}
