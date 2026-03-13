/**
 * Sanitiza HTML para exibição segura (descrição rich text).
 * Permite: b, i, u, br, p, span, font, img.
 * - Em span preserva style com color/background-color; font color vira span com style.
 * - Em img permite apenas src data:image/* base64 (já redimensionado no editor) e alt simples.
 * Tags de bloco não permitidas (ex.: div que o Chrome insere ao pressionar Enter) são convertidas em conteúdo + <br/>
 * para preservar as quebras de linha na visualização.
 */
const ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'span', 'font', 'img']

/** Tags de bloco que, quando não permitidas, devem gerar quebra de linha antes e depois do conteúdo (ex.: div no Chrome). */
const BLOCK_TAGS_AS_BR = ['div']

/** Conteúdo perigoso que nunca deve aparecer em style. */
const UNSAFE_IN_STYLE = /expression\s*\(|javascript\s*:|vbscript\s*:/i

function isSafeColorValue(v: string): boolean {
  const t = (v || '').trim().replace(/\s*;\s*$/, '')
  return t.length > 0 && (t.startsWith('#') || /^rgb\s*\(/.test(t) || /^rgba\s*\(/.test(t) || /^[a-zA-Z]+$/.test(t))
}

/** Se o style existir e parecer só conter cores (e não tiver conteúdo perigoso), preserva como está. */
function preserveStyleOrExtractColor(style: string | null): string {
  if (!style || typeof style !== 'string') return ''
  const trimmed = style.trim()
  if (UNSAFE_IN_STYLE.test(trimmed)) return ''
  const lower = trimmed.toLowerCase()
  const hasColor = lower.includes('color:') || lower.includes('background-color:') || lower.includes('background:')
  const onlySafeProps = !/[a-z-]+:\s*[^;]*url\s*\(/i.test(trimmed)
  if (hasColor && onlySafeProps) {
    const safeParts: string[] = []
    trimmed.split(';').forEach((part) => {
      const p = part.trim()
      if (!p) return
      const i = p.indexOf(':')
      if (i <= 0) return
      const prop = p.slice(0, i).trim().toLowerCase()
      const val = p.slice(i + 1).trim().replace(/\s*;\s*$/, '')
      if (prop === 'color' || prop === 'background-color' || prop === 'background') {
        if (!UNSAFE_IN_STYLE.test(val)) safeParts.push(`${prop}: ${val}`)
      }
    })
    if (safeParts.length > 0) return ` style="${safeParts.join('; ')}"`
  }
  return ''
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? ''
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    if (!ALLOWED_TAGS.includes(tag)) {
      const inner = Array.from(node.childNodes).map(walk).join('')
      if (BLOCK_TAGS_AS_BR.includes(tag)) return '<br/>' + inner + '<br/>'
      return inner
    }

    // Imagens: apenas data URLs pequenos e sem atributos perigosos
    if (tag === 'img') {
      const rawSrc = el.getAttribute('src') || ''
      const src = (rawSrc || '').trim()
      const dataUrlMatch = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(src)
      // limite de tamanho aproximado: ~60 KB em base64 => ~80k caracteres
      const MAX_DATAURL_LENGTH = 80_000
      if (!dataUrlMatch || src.length > MAX_DATAURL_LENGTH) {
        return ''
      }
      const altRaw = (el.getAttribute('alt') || '').replace(/[\r\n"]/g, ' ').slice(0, 200)
      const altAttr = altRaw ? ` alt="${altRaw}"` : ''
      return `<img src="${src}"${altAttr} />`
    }

    const inner = Array.from(node.childNodes).map(walk).join('')
    if (tag === 'br') return '<br/>'
    let styleAttr = ''
    if (tag === 'span') {
      styleAttr = preserveStyleOrExtractColor(el.getAttribute('style'))
    } else if (tag === 'font') {
      const fontColor = el.getAttribute('color')
      if (fontColor && isSafeColorValue(fontColor) && !UNSAFE_IN_STYLE.test(fontColor)) {
        styleAttr = ` style="color: ${fontColor.trim()}"`
      }
      return `<span${styleAttr}>${inner}</span>`
    }
    return `<${tag}${styleAttr}>${inner}</${tag}>`
  }
  let out = walk(doc.body)
  out = out.replace(/^<br\s*\/?>/i, '')
  out = out.replace(/(<br\s*\/?>){2,}/gi, '<br/>')
  return out
}

/** Remove tags HTML e retorna só o texto (para busca). */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}
