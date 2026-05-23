import type { EntryStat, QuizSessionRecord, WordEntry } from '../types/vocabulary'

export function statKey(wordbookId: string, entryId: string): string {
  return `${wordbookId}:${entryId}`
}

export interface CategoryStatRow {
  category: string
  totalWords: number
  studied: number
  correct: number
  wrong: number
  accuracy: number | null
}

export interface StudySummary {
  totalAttempts: number
  totalCorrect: number
  accuracy: number | null
  sessionsCount: number
  studiedWords: number
  totalWords: number
}

export function computeSummary(
  wordbookId: string,
  totalWords: number,
  entryStats: Record<string, EntryStat>,
  sessions: QuizSessionRecord[],
): StudySummary {
  let totalAttempts = 0
  let totalCorrect = 0
  let studiedWords = 0
  const prefix = `${wordbookId}:`

  for (const [key, stat] of Object.entries(entryStats)) {
    if (!key.startsWith(prefix)) continue
    const attempts = stat.correct + stat.wrong
    if (attempts === 0) continue
    studiedWords++
    totalAttempts += attempts
    totalCorrect += stat.correct
  }

  const bookSessions = sessions.filter((s) => s.wordbookId === wordbookId)

  return {
    totalAttempts,
    totalCorrect,
    accuracy:
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null,
    sessionsCount: bookSessions.length,
    studiedWords,
    totalWords,
  }
}

export function computeCategoryStats(
  wordbookId: string,
  entries: WordEntry[],
  entryStats: Record<string, EntryStat>,
): CategoryStatRow[] {
  const byCategory = new Map<string, WordEntry[]>()
  for (const e of entries) {
    const cat = e.category || '기타'
    const list = byCategory.get(cat) ?? []
    list.push(e)
    byCategory.set(cat, list)
  }

  const rows: CategoryStatRow[] = []
  for (const [category, words] of byCategory) {
    let studied = 0
    let correct = 0
    let wrong = 0
    for (const w of words) {
      const stat = entryStats[statKey(wordbookId, w.id)]
      if (!stat) continue
      const attempts = stat.correct + stat.wrong
      if (attempts === 0) continue
      studied++
      correct += stat.correct
      wrong += stat.wrong
    }
    const totalAttempts = correct + wrong
    rows.push({
      category,
      totalWords: words.length,
      studied,
      correct,
      wrong,
      accuracy:
        totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : null,
    })
  }

  return rows.sort((a, b) => a.category.localeCompare(b.category, 'ko'))
}

export interface WeakWordRow {
  entry: WordEntry
  correct: number
  wrong: number
  accuracy: number
  attempts: number
}

export function getWeakWords(
  wordbookId: string,
  entries: WordEntry[],
  entryStats: Record<string, EntryStat>,
  limit = 10,
): WeakWordRow[] {
  const rows: WeakWordRow[] = []

  for (const entry of entries) {
    const stat = entryStats[statKey(wordbookId, entry.id)]
    if (!stat) continue
    const attempts = stat.correct + stat.wrong
    if (attempts < 1) continue
    rows.push({
      entry,
      correct: stat.correct,
      wrong: stat.wrong,
      attempts,
      accuracy: Math.round((stat.correct / attempts) * 100),
    })
  }

  return rows
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy
      return b.wrong - a.wrong
    })
    .slice(0, limit)
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}
