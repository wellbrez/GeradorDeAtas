import { useRef, useEffect, useCallback } from 'react'
import styles from './RichTextDescricao.module.css'

/** Paleta de cores da marca Vale para cor do texto no rich text */
const CORES_MARCA_VALE: { hex: string; nome: string }[] = [
  { hex: '#007E7A', nome: 'Verde-Vale' },
  { hex: '#0ABB98', nome: 'Aqua-Vale' },
  { hex: '#3CB5E5', nome: 'Azul-Vale' },
  { hex: '#555555', nome: 'Cinza-Escuro' },
  { hex: '#FFFFFF', nome: 'Branco' },
  { hex: '#ECB11F', nome: 'Amarelo-Vale' },
  { hex: '#EE6F16', nome: 'Laranja-Vale' },
  { hex: '#C0305E', nome: 'Cereja-Vale' },
  { hex: '#000000', nome: 'Preto' },
]

export interface RichTextDescricaoProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minRows?: number
  /** @internal usado pelo toolbar para aplicar formato */
  disabled?: boolean
  /** Chamado quando o usuário aplica formatação (negrito, itálico, cor, etc.) */
  onFormatApplied?: () => void
}

/**
 * Campo de descrição multi-linha com formatação rich text (negrito, itálico, sublinhado e cores da marca).
 * Armazena e retorna HTML.
 */
export default function RichTextDescricao({
  value,
  onChange,
  placeholder = 'Descrição',
  minRows = 4,
  disabled = false,
  onFormatApplied,
}: RichTextDescricaoProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ''
    }
  }, [value])

  const handleInput = useCallback(() => {
    const el = elRef.current
    if (!el) return
    onChange(el.innerHTML)
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        document.execCommand('insertHTML', false, '<br>')
      }
    },
    []
  )

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    elRef.current?.focus()
    handleInput()
    onFormatApplied?.()
  }, [handleInput, onFormatApplied])

  const applyColor = useCallback(
    (hex: string) => {
      if (disabled) return
      document.execCommand('foreColor', false, hex)
      elRef.current?.focus()
      handleInput()
      onFormatApplied?.()
    },
    [handleInput, disabled, onFormatApplied]
  )

  const insertImageAtCursor = useCallback(
    (dataUrl: string) => {
      const el = elRef.current
      if (!el) return
      // Usa insertImage para garantir comportamento consistente em contentEditable
      document.execCommand('insertImage', false, dataUrl)
      el.focus()
      handleInput()
      onFormatApplied?.()
    },
    [handleInput, onFormatApplied]
  )

  const handleImageSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || disabled) return
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecione um arquivo de imagem.')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base = reader.result
        if (typeof base !== 'string') return
        const img = new Image()
        img.onload = () => {
          try {
            const MAX_DIM = 480 // largura/altura máxima em pixels
            let { width, height } = img
            if (width > MAX_DIM || height > MAX_DIM) {
              const scale = Math.min(MAX_DIM / width, MAX_DIM / height)
              width = Math.round(width * scale)
              height = Math.round(height * scale)
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.drawImage(img, 0, 0, width, height)

            // Tenta reduzir tamanho usando qualidade de compressão
            let quality = 0.7
            let dataUrl = canvas.toDataURL('image/jpeg', quality)
            const MAX_LENGTH = 80_000 // alinhado ao sanitizador (~poucos KB)
            while (dataUrl.length > MAX_LENGTH && quality > 0.3) {
              quality -= 0.1
              dataUrl = canvas.toDataURL('image/jpeg', quality)
            }
            if (dataUrl.length > MAX_LENGTH) {
              alert('Imagem muito grande mesmo após compactação. Escolha uma imagem menor.')
              return
            }
            insertImageAtCursor(dataUrl)
          } catch {
            alert('Não foi possível processar a imagem selecionada.')
          }
        }
        img.onerror = () => {
          alert('Não foi possível carregar a imagem selecionada.')
        }
        img.src = base
      }
      reader.onerror = () => {
        alert('Erro ao ler o arquivo de imagem.')
      }
      reader.readAsDataURL(file)
    },
    [disabled, insertImageAtCursor]
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => exec('bold')}
            title="Negrito"
            disabled={disabled}
          >
            <b>N</b>
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => exec('italic')}
            title="Itálico"
            disabled={disabled}
          >
            <i>I</i>
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => exec('underline')}
            title="Sublinhado"
            disabled={disabled}
          >
            <u>S</u>
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>Cor do texto:</span>
          {CORES_MARCA_VALE.map(({ hex, nome }) => (
            <button
              key={hex}
              type="button"
              className={`${styles.colorSwatch} ${hex.toUpperCase() === '#FFFFFF' ? styles.colorSwatchWhite : ''}`}
              style={{ backgroundColor: hex }}
              title={nome}
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault()
                applyColor(hex)
              }}
            />
          ))}
        </div>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Inserir imagem (será compactada automaticamente)"
            disabled={disabled}
          >
            🖼️ Imagem
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelected}
          />
        </div>
      </div>
      <div
        ref={elRef}
        className={styles.editor}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ minHeight: `${minRows * 1.5}em` }}
      />
    </div>
  )
}
