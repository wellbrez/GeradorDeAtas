import { useState, useEffect } from 'react'
import { MeetingMinutesList, MeetingMinutesForm } from '@features/atas/components'
import { getMeetingMinutesById, createMeetingMinutes } from '@features/atas/services/meetingMinutesService'
import { parseAtaFromHash } from '@/utils/urlAtaImport'
import { getGamificationEnabled, setGamificationEnabled, SelosEarnedToastProvider } from '@features/gamification'
import type { MeetingMinutes } from '@/types'
import styles from './App.module.css'

function App() {
  const [formOpen, setFormOpen] = useState(false)
  const [formAta, setFormAta] = useState<MeetingMinutes | null>(null)
  const [formIsCopy, setFormIsCopy] = useState(false)
  const [listKey, setListKey] = useState(0)
  const [gamificationEnabled, setGamificationEnabledState] = useState(getGamificationEnabled)

  const handleGamificationToggle = (checked: boolean) => {
    setGamificationEnabled(checked)
    setGamificationEnabledState(checked)
  }

  // Importa ata do hash na URL (#base64) e abre o formulário
  useEffect(() => {
    const storage = parseAtaFromHash()
    if (!storage) return

    try {
      const ata = createMeetingMinutes(storage)
      setFormAta(ata)
      setFormIsCopy(false)
      setFormOpen(true)
      setListKey((k) => k + 1)
      // Remove o hash da URL para evitar reimportar ao recarregar
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    } catch (e) {
      console.error('Erro ao importar ata do link:', e)
    }
  }, [])

  const handleCreate = () => {
    setFormAta(null)
    setFormIsCopy(false)
    setFormOpen(true)
  }

  const handleEdit = (id: string) => {
    const ata = getMeetingMinutesById(id)
    setFormAta(ata ?? null)
    setFormIsCopy(false)
    setFormOpen(true)
  }

  const handleCopy = async (id: string) => {
    const ata = getMeetingMinutesById(id)
    setFormAta(ata ?? null)
    setFormIsCopy(true)
    setFormOpen(true)
  }

  const handleFormSaved = () => {
    setListKey((k) => k + 1)
  }

  if (formOpen) {
    return (
      <SelosEarnedToastProvider>
      <MeetingMinutesForm
        onClose={() => setFormOpen(false)}
        existingAta={formAta}
        isCopy={formIsCopy}
        onSaved={handleFormSaved}
        gamificationEnabled={gamificationEnabled}
      />
      </SelosEarnedToastProvider>
    )
  }

  return (
    <SelosEarnedToastProvider>
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1>Sistema de Atas de Reunião</h1>
              <p className={styles.subtitle}>
                Gerencie suas atas de reunião com armazenamento local
              </p>
            </div>
            <label className={styles.gamificationToggle} title="Ativar ou desativar conquistas, Selos e loja">
              <input
                type="checkbox"
                checked={gamificationEnabled}
                onChange={(e) => handleGamificationToggle(e.target.checked)}
                aria-label="Usar gamificação (conquistas, Selos, loja)"
              />
              <span className={styles.gamificationToggleLabel}>Gamificação</span>
            </label>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <MeetingMinutesList
            key={listKey}
            gamificationEnabled={gamificationEnabled}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onCopy={handleCopy}
          />
        </div>
      </main>
    </div>
    </SelosEarnedToastProvider>
  )
}

export default App
