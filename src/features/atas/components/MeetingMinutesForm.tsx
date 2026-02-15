import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@components/ui'
import { ConfirmModal } from '@components/ui'
import { useAtaForm } from '../hooks/useAtaForm'
import Step1CabecalhoParticipantes from './Step1CabecalhoParticipantes'
import Step2Itens from './Step2Itens'
import {
  createMeetingMinutes,
  updateMeetingMinutes,
  setAtaArquivada,
} from '../services/meetingMinutesService'
import { storageService } from '@services/storage'
import { recordActivityToday, awardSelosForAta, useSelosEarned, formatSelosForDisplay } from '@features/gamification'
import { Celebration, CompletudeProgress } from '@features/gamification'
import type { MeetingMinutes, MeetingMinutesStorage, DraftAta } from '@/types'
import styles from './MeetingMinutesForm.module.css'

const DRAFT_DEBOUNCE_MS = 2000

/**
 * Formata data/hora do rascunho para exibição
 */
function formatDraftSavedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export interface MeetingMinutesFormProps {
  onClose: () => void
  existingAta: MeetingMinutes | null
  isCopy: boolean
  onSaved: () => void
  /** Quando false, não concede Selos nem exibe celebração/barra de completude */
  gamificationEnabled?: boolean
}

/**
 * Conteúdo do formulário (cabeçalho + etapas). Montado com key para reinicializar
 * estado ao restaurar rascunho.
 */
function FormContent({
  existingAta,
  isCopy,
  initialDraft,
  currentStep,
  setCurrentStep,
  onClose,
  onSaved,
  gamificationEnabled = true,
}: {
  existingAta: MeetingMinutes | null
  isCopy: boolean
  initialDraft: MeetingMinutesStorage | null
  currentStep: number
  setCurrentStep: (step: number) => void
  onClose: () => void
  onSaved: () => void
  gamificationEnabled?: boolean
}) {
  const form = useAtaForm(existingAta, isCopy, initialDraft)
  const showSelos = useSelosEarned()
  const [showCelebration, setShowCelebration] = useState(false)
  const [selosEarned, setSelosEarned] = useState(0)

  const getFilhos = useMemo(() => {
    return (paiId: string) => form.itens.filter((i) => i.pai === paiId)
  }, [form.itens])

  const handleSalvar = useCallback(() => {
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
      } else {
        createMeetingMinutes(storage)
        if (existingAta && isCopy) {
          setAtaArquivada(existingAta.id)
        }
      }
      if (gamificationEnabled) {
        recordActivityToday()
        const earned = awardSelosForAta(storage, !existingAta || isCopy)
        setSelosEarned(earned)
      }
      storageService.clearDraft()
      setShowCelebration(true)
    } catch (e) {
      alert('Erro ao salvar: ' + (e instanceof Error ? e.message : String(e)))
    }
  }, [form, existingAta, isCopy, gamificationEnabled])

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false)
    onSaved()
    onClose()
  }, [onSaved, onClose])

  // Auto-save do rascunho (debounced)
  useEffect(() => {
    const payload: DraftAta = {
      storage: {
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
      },
      currentStep: currentStep === 2 ? 2 : 1,
      savedAt: new Date().toISOString(),
      existingAtaId: existingAta?.id ?? null,
    }
    const timer = setTimeout(() => {
      storageService.saveDraft(payload)
    }, DRAFT_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [
    form.cabecalho,
    form.attendance,
    form.itens,
    currentStep,
    existingAta?.id,
  ])

  const title =
    currentStep === 1
      ? 'Ata de Reunião — Etapa 1/2: Cabeçalho e Participantes'
      : 'Ata de Reunião — Etapa 2/2: Itens'

  return (
    <>
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
              onClick={(e) => {
                if (gamificationEnabled) showSelos?.(1, { clientX: e.clientX, clientY: e.clientY })
                setCurrentStep(2)
              }}
              disabled={!form.canAvancarEtapa}
            >
              Avançar →
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              variant="primary"
              onClick={handleSalvar}
              disabled={!form.canSalvar}
            >
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
          <>
            {gamificationEnabled && (
              <CompletudeProgress
                itens={form.itens}
                participantCount={form.attendance.length}
              />
            )}
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
              onAwardSelos={gamificationEnabled ? showSelos : undefined}
            />
          </>
        )}
      </main>

      {showCelebration && (
        <Celebration
          title="Ata salva!"
          subtitle={
            gamificationEnabled && selosEarned > 0
              ? `+ ${formatSelosForDisplay(selosEarned)} Selos · Obrigado por manter suas reuniões organizadas.`
              : 'Obrigado por manter suas reuniões organizadas.'
          }
          duration={2200}
          onDone={handleCelebrationDone}
        />
      )}
    </>
  )
}

/**
 * Formulário de criação/edição de ata em tela cheia.
 * Inclui auto-save em rascunho e oferta de restauração ao reabrir.
 */
export default function MeetingMinutesForm({
  onClose,
  existingAta,
  isCopy,
  onSaved,
  gamificationEnabled = true,
}: MeetingMinutesFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<DraftAta | null>(null)
  const [draftToApply, setDraftToApply] = useState<DraftAta | null>(null)

  // Ao abrir o formulário, verificar se existe rascunho para oferecer restauração
  useEffect(() => {
    if (draftToApply) return
    const draft = storageService.getDraft()
    if (!draft) return
    setPendingDraft(draft)
    setShowRestoreModal(true)
  }, [draftToApply])

  const handleRestoreDraft = useCallback(() => {
    if (!pendingDraft) return
    setDraftToApply(pendingDraft)
    setCurrentStep(pendingDraft.currentStep)
    setShowRestoreModal(false)
    setPendingDraft(null)
  }, [pendingDraft])

  const handleDiscardDraft = useCallback(() => {
    storageService.clearDraft()
    setShowRestoreModal(false)
    setPendingDraft(null)
  }, [])

  const formKey = draftToApply
    ? `draft-${draftToApply.savedAt}`
    : existingAta?.id ?? 'new'

  return (
    <div className={styles.fullPage}>
      {showRestoreModal && pendingDraft && (
        <ConfirmModal
          isOpen={true}
          onClose={handleDiscardDraft}
          onConfirm={handleRestoreDraft}
          title="Rascunho encontrado"
          message={
            <>
              Foi encontrado um rascunho não salvo (último salvamento automático:{' '}
              <strong>{formatDraftSavedAt(pendingDraft.savedAt)}</strong>).
              Deseja restaurar para continuar de onde parou?
            </>
          }
          confirmLabel="Restaurar rascunho"
          cancelLabel="Descartar rascunho"
          confirmVariant="primary"
          confirmOnEnter={true}
        />
      )}

      <FormContent
        key={formKey}
        existingAta={existingAta}
        isCopy={isCopy}
        initialDraft={draftToApply?.storage ?? null}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onClose={onClose}
        onSaved={onSaved}
        gamificationEnabled={gamificationEnabled}
      />
    </div>
  )
}
