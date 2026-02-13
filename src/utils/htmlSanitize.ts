/**
 * Sanitiza HTML para exibição segura (descrição rich text).
 * Permite apenas: b, i, u, br, p, span (sem atributos perigosos).
 */
const ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'span']

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
    return `<${tag}>${inner}</${tag}>`
  }
  return walk(doc.body)
}

/** Remove tags HTML e retorna só o texto (para busca). */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}
