import type { Item } from '@/types'

/**
 * Retorna o próximo número para um item raiz (1, 2, 3...)
 */
export function getNextRootNumber(itens: Item[]): number {
  const raiz = itens.filter((i) => !i.item.includes('.'))
  if (raiz.length === 0) return 1
  const numeros = raiz.map((i) => {
    const n = parseInt(i.item, 10)
    return isNaN(n) ? 0 : n
  })
  return Math.max(...numeros, 0) + 1
}

/**
 * Retorna o próximo número para um subitem (ex: pai "1" -> "1.1", "1.2")
 */
export function getNextChildNumber(itens: Item[], paiId: string): string {
  const pai = itens.find((i) => i.id === paiId)
  if (!pai) return '1'

  const prefix = pai.item + '.'
  const irmaos = itens.filter((i) => i.pai === paiId)
  if (irmaos.length === 0) return prefix + '1'

  const numeros = irmaos.map((i) => {
    const sufixo = i.item.replace(prefix, '')
    const n = parseInt(sufixo, 10)
    return isNaN(n) ? 0 : n
  })
  const proximo = Math.max(...numeros, 0) + 1
  return prefix + String(proximo)
}

/**
 * Ordena itens pela numeração hierárquica (1, 1.1, 1.1.1, 1.2, 2...)
 */
export function sortItemsByNumber(itens: Item[]): Item[] {
  return [...itens].sort((a, b) => {
    const partsA = a.item.split('.').map(Number)
    const partsB = b.item.split('.').map(Number)
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const va = partsA[i] ?? 0
      const vb = partsB[i] ?? 0
      if (va !== vb) return va - vb
    }
    return 0
  })
}
