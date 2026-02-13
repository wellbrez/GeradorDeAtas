import { useState } from 'react'
import { MeetingMinutesList, MeetingMinutesForm } from '@features/atas/components'
import { getMeetingMinutesById } from '@features/atas/services/meetingMinutesService'
import type { MeetingMinutes } from '@/types'
import styles from './App.module.css'

function App() {
  const [formOpen, setFormOpen] = useState(false)
  const [formAta, setFormAta] = useState<MeetingMinutes | null>(null)
  const [formIsCopy, setFormIsCopy] = useState(false)
  const [listKey, setListKey] = useState(0)

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
      <MeetingMinutesForm
        onClose={() => setFormOpen(false)}
        existingAta={formAta}
        isCopy={formIsCopy}
        onSaved={handleFormSaved}
      />
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.container}>
          <h1>Sistema de Atas de Reunião</h1>
          <p className={styles.subtitle}>
            Gerencie suas atas de reunião com armazenamento local
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <MeetingMinutesList
            key={listKey}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onCopy={handleCopy}
          />
        </div>
      </main>
    </div>
  )
}

export default App
