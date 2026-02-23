/**
 * Modal de configuração de ambiente: URL do Power Apps e logomarca.
 * As configurações são salvas no localStorage e incluídas no export de backup.
 */
import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Input } from '@components/ui'
import { getEnvConfig, setEnvConfig, compressLogoImage, MAX_LOGO_BYTES } from '@services/envConfig'
import styles from './EnvConfigModal.module.css'

export interface EnvConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function EnvConfigModal({ isOpen, onClose }: EnvConfigModalProps) {
  const [powerAppsUrl, setPowerAppsUrl] = useState('')
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const c = getEnvConfig()
      setPowerAppsUrl(c.powerAppsUrl ?? '')
      setLogoDataUrl(c.logoDataUrl ?? null)
      setLogoError(null)
    }
  }, [isOpen])

  const handleSave = () => {
    setEnvConfig({
      powerAppsUrl: powerAppsUrl.trim() || undefined,
      logoDataUrl: logoDataUrl ?? undefined,
    })
    onClose()
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setLogoError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoError('Selecione um arquivo de imagem (PNG, JPEG, etc.).')
      return
    }
    try {
      const dataUrl = await compressLogoImage(file)
      setLogoDataUrl(dataUrl)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Erro ao processar imagem.')
    }
  }

  const handleRemoveLogo = () => {
    setLogoDataUrl(null)
    setLogoError(null)
  }

  const maxKb = Math.round(MAX_LOGO_BYTES / 1024)
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações do ambiente"
      size="md"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="env-powerapps-url">
            URL do Power Apps
          </label>
          <Input
            id="env-powerapps-url"
            type="url"
            value={powerAppsUrl}
            onChange={(e) => setPowerAppsUrl(e.target.value)}
            placeholder="https://apps.powerapps.com/..."
            aria-label="URL do Power Apps"
          />
          <p className={styles.hint}>
            Ao clicar em &quot;Exportar para Power Apps&quot;, o JSON será copiado e esta URL será aberta em nova aba.
          </p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Logomarca</label>
          <p className={styles.hint}>
            Imagem pequena no canto superior esquerdo das atas. Máx. {maxKb} KB (será comprimida automaticamente).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoFile}
            className={styles.hiddenInput}
            aria-label="Selecionar logomarca"
          />
          <div className={styles.logoRow}>
            {logoDataUrl ? (
              <>
                <img src={logoDataUrl} alt="Logo" className={styles.logoPreview} />
                <div>
                  <Button variant="secondary" size="sm" onClick={handleRemoveLogo}>
                    Remover logo
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar imagem
              </Button>
            )}
          </div>
          {logoError && <p className={styles.error}>{logoError}</p>}
        </div>
        <p className={styles.footerNote}>
          Estas configurações são salvas localmente e incluídas ao exportar o backup do ambiente.
        </p>
      </div>
    </Modal>
  )
}
