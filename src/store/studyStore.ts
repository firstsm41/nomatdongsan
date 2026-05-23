import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
  computeCategoryStats,
  computeSummary,
  getWeakWords,
  statKey,
  type CategoryStatRow,
  type StudySummary,
  type WeakWordRow,
} from '../lib/stats'
import type {
  EntryStat,
  QuizSessionRecord,
  QuizType,
  WordEntry,
  WrongAnswerRecord,
} from '../types/vocabulary'

export interface WrongQuizItem {
  entryId: string
  word: string
  meaning: string
  abbreviation?: string
  userAnswer: string
  correctAnswer: string
  quizType: QuizType
}

export interface QuizResultItem {
  entryId: string
  isCorrect: boolean
}

interface StudyState {
  wrongAnswers: WrongAnswerRecord[]
  entryStats: Record<string, EntryStat>
  sessions: QuizSessionRecord[]

  recordWrongFromQuiz: (wordbookId: string, items: WrongQuizItem[]) => void
  recordQuizSession: (
    wordbookId: string,
    quizType: QuizType,
    category: string | null,
    results: QuizResultItem[],
  ) => void

  getWrongForWordbook: (wordbookId: string) => WrongAnswerRecord[]
  getWrongEntryIds: (wordbookId: string) => string[]
  removeWrong: (id: string) => void
  removeWrongByEntryId: (wordbookId: string, entryId: string) => void
  clearWrongForWordbook: (wordbookId: string) => void
  clearAllWrong: () => void
  totalWrongCount: (wordbookId?: string) => number

  getSessions: (wordbookId: string) => QuizSessionRecord[]
  getSummary: (wordbookId: string, totalWords: number) => StudySummary
  getCategoryStats: (wordbookId: string, entries: WordEntry[]) => CategoryStatRow[]
  getWeakWords: (wordbookId: string, entries: WordEntry[], limit?: number) => WeakWordRow[]
  clearStats: (wordbookId: string) => void
}

const MAX_SESSIONS = 80

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      wrongAnswers: [],
      entryStats: {},
      sessions: [],

      recordWrongFromQuiz: (wordbookId, items) => {
        if (items.length === 0) return

        set((s) => {
          const next = [...s.wrongAnswers]
          for (const item of items) {
            const existingIdx = next.findIndex(
              (w) => w.wordbookId === wordbookId && w.entryId === item.entryId,
            )
            const record: WrongAnswerRecord = {
              id: existingIdx >= 0 ? next[existingIdx].id : uuidv4(),
              wordbookId,
              entryId: item.entryId,
              word: item.word,
              meaning: item.meaning,
              abbreviation: item.abbreviation,
              userAnswer: item.userAnswer,
              correctAnswer: item.correctAnswer,
              quizType: item.quizType,
              wrongAt: new Date().toISOString(),
            }
            if (existingIdx >= 0) next[existingIdx] = record
            else next.push(record)
          }
          return { wrongAnswers: next }
        })
      },

      recordQuizSession: (wordbookId, quizType, category, results) => {
        if (results.length === 0) return

        const now = new Date().toISOString()
        const correct = results.filter((r) => r.isCorrect).length

        set((s) => {
          const entryStats = { ...s.entryStats }
          for (const r of results) {
            const key = statKey(wordbookId, r.entryId)
            const prev = entryStats[key] ?? { correct: 0, wrong: 0 }
            entryStats[key] = {
              correct: prev.correct + (r.isCorrect ? 1 : 0),
              wrong: prev.wrong + (r.isCorrect ? 0 : 1),
              lastAnsweredAt: now,
            }
          }

          const session: QuizSessionRecord = {
            id: uuidv4(),
            wordbookId,
            quizType,
            category,
            total: results.length,
            correct,
            finishedAt: now,
          }

          const sessions = [session, ...s.sessions.filter((x) => x.wordbookId === wordbookId)]
            .concat(s.sessions.filter((x) => x.wordbookId !== wordbookId))
            .slice(0, MAX_SESSIONS)

          return { entryStats, sessions }
        })
      },

      getWrongForWordbook: (wordbookId) =>
        get().wrongAnswers.filter((w) => w.wordbookId === wordbookId),

      getWrongEntryIds: (wordbookId) => {
        const ids = get()
          .wrongAnswers.filter((w) => w.wordbookId === wordbookId)
          .map((w) => w.entryId)
        return [...new Set(ids)]
      },

      removeWrong: (id) =>
        set((s) => ({
          wrongAnswers: s.wrongAnswers.filter((w) => w.id !== id),
        })),

      removeWrongByEntryId: (wordbookId, entryId) =>
        set((s) => ({
          wrongAnswers: s.wrongAnswers.filter(
            (w) => !(w.wordbookId === wordbookId && w.entryId === entryId),
          ),
        })),

      clearWrongForWordbook: (wordbookId) =>
        set((s) => ({
          wrongAnswers: s.wrongAnswers.filter((w) => w.wordbookId !== wordbookId),
        })),

      clearAllWrong: () => set({ wrongAnswers: [] }),

      totalWrongCount: (wordbookId) => {
        const list = get().wrongAnswers
        if (!wordbookId) return list.length
        return list.filter((w) => w.wordbookId === wordbookId).length
      },

      getSessions: (wordbookId) =>
        get()
          .sessions.filter((s) => s.wordbookId === wordbookId)
          .sort(
            (a, b) =>
              new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
          ),

      getSummary: (wordbookId, totalWords) =>
        computeSummary(
          wordbookId,
          totalWords,
          get().entryStats,
          get().sessions,
        ),

      getCategoryStats: (wordbookId, entries) =>
        computeCategoryStats(wordbookId, entries, get().entryStats),

      getWeakWords: (wordbookId, entries, limit) =>
        getWeakWords(wordbookId, entries, get().entryStats, limit),

      clearStats: (wordbookId) =>
        set((s) => {
          const prefix = `${wordbookId}:`
          const entryStats: Record<string, EntryStat> = {}
          for (const [k, v] of Object.entries(s.entryStats)) {
            if (!k.startsWith(prefix)) entryStats[k] = v
          }
          return {
            entryStats,
            sessions: s.sessions.filter((x) => x.wordbookId !== wordbookId),
          }
        }),
    }),
    { name: 'nomatdongsan-study-v2' },
  ),
)
