/**
 * Sanitiza HTML para exibição segura (descrição rich text).
 * Permite: b, i, u, br, p, span, font. Em span preserva style com color/background-color; font color vira span com style.
 */
const ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'span', 'font']

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
      return Array.from(node.childNodes).map(walk).join('')
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
  return walk(doc.body)
}

/** Remove tags HTML e retorna só o texto (para busca). */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}
