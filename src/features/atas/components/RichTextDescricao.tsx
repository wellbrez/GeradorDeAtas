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
      </div>
      <div
        ref={elRef}
        className={styles.editor}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight: `${minRows * 1.5}em` }}
      />
    </div>
  )
}
