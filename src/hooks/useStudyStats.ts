import { useMemo } from 'react'
import {
  computeCategoryStats,
  computeSummary,
  getWeakWords,
  type CategoryStatRow,
  type StudySummary,
  type WeakWordRow,
} from '../lib/stats'
import { useStudyStore } from '../store/studyStore'
import type { QuizSessionRecord, WordEntry } from '../types/vocabulary'

/** store에서 파생 값 — 셀렉터 안에서 새 객체를 만들지 않도록 useMemo 사용 */
export function useStudySummary(
  wordbookId: string,
  totalWords: number,
): StudySummary {
  const entryStats = useStudyStore((s) => s.entryStats)
  const sessions = useStudyStore((s) => s.sessions)
  return useMemo(
    () => computeSummary(wordbookId, totalWords, entryStats, sessions),
    [wordbookId, totalWords, entryStats, sessions],
  )
}

export function useCategoryStats(
  wordbookId: string,
  entries: WordEntry[],
): CategoryStatRow[] {
  const entryStats = useStudyStore((s) => s.entryStats)
  return useMemo(
    () => computeCategoryStats(wordbookId, entries, entryStats),
    [wordbookId, entries, entryStats],
  )
}

export function useWeakWords(
  wordbookId: string,
  entries: WordEntry[],
  limit = 10,
): WeakWordRow[] {
  const entryStats = useStudyStore((s) => s.entryStats)
  return useMemo(
    () => getWeakWords(wordbookId, entries, entryStats, limit),
    [wordbookId, entries, entryStats, limit],
  )
}

export function useQuizSessions(wordbookId: string): QuizSessionRecord[] {
  const sessions = useStudyStore((s) => s.sessions)
  return useMemo(
    () =>
      sessions
        .filter((s) => s.wordbookId === wordbookId)
        .sort(
          (a, b) =>
            new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
        ),
    [sessions, wordbookId],
  )
}
