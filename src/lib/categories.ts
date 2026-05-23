import type { WordEntry } from '../types/vocabulary'

export function countByCategory(entries: WordEntry[]): { category: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of entries) {
    const cat = e.category || '기타'
    map.set(cat, (map.get(cat) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category, 'ko'))
}

export function getCategories(entries: WordEntry[]): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    if (e.category) set.add(e.category)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
}

export function filterEntries(
  entries: WordEntry[],
  query: string,
  category: string | null,
): WordEntry[] {
  const q = query.trim().toLowerCase()
  return entries.filter((e) => {
    if (category && e.category !== category) return false
    if (!q) return true
    return (
      e.word.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      (e.abbreviation?.toLowerCase().includes(q) ?? false)
    )
  })
}
