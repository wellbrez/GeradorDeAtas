import React, { useMemo } from 'react'
import { Button } from '@components/ui'
import { useAtaForm } from '../hooks/useAtaForm'
import Step1CabecalhoParticipantes from './Step1CabecalhoParticipantes'
import Step2Itens from './Step2Itens'
import { createMeetingMinutes, updateMeetingMinutes, setAtaArquivada } from '../services/meetingMinutesService'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'
import styles from './MeetingMinutesForm.module.css'

export interface MeetingMinutesFormProps {
  onClose: () => void
  existingAta: MeetingMinutes | null
  isCopy: boolean
  onSaved: () => void
}

export default function MeetingMinutesForm({
  onClose,
  existingAta,
  isCopy,
  onSaved,
}: MeetingMinutesFormProps) {
  const [currentStep, setCurrentStep] = React.useState(1)

  const form = useAtaForm(existingAta, isCopy)

  const getFilhos = useMemo(() => {
    return (paiId: string) => form.itens.filter((i) => i.pai === paiId)
  }, [form.itens])

  const handleSalvar = () => {
    const storage: MeetingMinutesStorage = {
      cabecalho: form.cabecalho,
      attendance: form.attendance,
      itens: form.itens.map((i) => ({
        id: i.id,
        item: i.item,
        nivel: i.nivel,
        pai: i.pai,
        filhos: i.filhos,
        criadoEm: i.criadoEm,
        historico: i.historico,
        UltimoHistorico: i.UltimoHistorico,
      })),
    }

    try {
      if (existingAta && !isCopy) {
        updateMeetingMinutes(existingAta.id, storage)
        alert('Ata atualizada com sucesso!')
      } else {
        createMeetingMinutes(storage)
        if (existingAta && isCopy) {
          setAtaArquivada(existingAta.id)
        }
        alert('Ata criada com sucesso!')
      }
      onSaved()
      onClose()
    } catch (e) {
      alert('Erro ao salvar: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const title =
    currentStep === 1
      ? 'Ata de Reunião — Etapa 1/2: Cabeçalho e Participantes'
      : 'Ata de Reunião — Etapa 2/2: Itens'

  return (
    <div className={styles.fullPage}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={onClose} className={styles.btnVoltar}>
          ← Voltar
        </Button>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.footerActions}>
          {currentStep === 2 && (
            <Button variant="ghost" onClick={() => setCurrentStep(1)}>
              ← Etapa anterior
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {currentStep === 1 && (
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              disabled={!form.canAvancarEtapa}
            >
              Avançar →
            </Button>
          )}
          {currentStep === 2 && (
            <Button variant="primary" onClick={handleSalvar} disabled={!form.canSalvar}>
              Salvar Ata
            </Button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {currentStep === 1 && (
          <Step1CabecalhoParticipantes
            cabecalho={form.cabecalho}
            onCabecalhoChange={form.updateCabecalho}
            participants={form.attendance}
            onAddParticipant={form.addParticipant}
            onRemoveParticipant={form.removeParticipant}
            onUpdateParticipant={form.updateParticipant}
            onTogglePresenca={form.togglePresenca}
            onMarkAllAbsent={form.markAllAbsent}
            tiposAta={form.TIPOS_ATA}
          />
        )}
        {currentStep === 2 && (
          <Step2Itens
            key={existingAta?.id ?? 'new'}
            itens={form.itens}
            getFilhos={getFilhos}
            onAddItemRaiz={form.addItemRaiz}
            onAddSubItem={form.addSubItem}
            onAddHistorico={form.addHistoricoToItem}
            onRemoveItem={form.removeItem}
            onRemoveHistorico={form.removeHistorico}
            onUpdateHistoricoCriadoEm={form.updateHistoricoCriadoEm}
            participants={form.attendance}
            onAddParticipant={form.addParticipant}
            dataReuniao={form.cabecalho.data}
          />
        )}
      </main>
    </div>
  )
}
