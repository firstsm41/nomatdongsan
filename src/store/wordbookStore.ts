import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Wordbook } from '../types/vocabulary'

interface WordbookState {
  wordbooks: Wordbook[]
  addWordbook: (name: string, entries: Wordbook['entries'], description?: string) => string
  updateWordbook: (id: string, patch: Partial<Pick<Wordbook, 'name' | 'description' | 'entries'>>) => void
  deleteWordbook: (id: string) => void
  getWordbook: (id: string) => Wordbook | undefined
}

export const useWordbookStore = create<WordbookState>()(
  persist(
    (set, get) => ({
      wordbooks: [],

      addWordbook: (name, entries, description) => {
        const id = uuidv4()
        const now = new Date().toISOString()
        const wordbook: Wordbook = {
          id,
          name,
          description,
          entries,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ wordbooks: [...s.wordbooks, wordbook] }))
        return id
      },

      updateWordbook: (id, patch) => {
        set((s) => ({
          wordbooks: s.wordbooks.map((wb) =>
            wb.id === id
              ? { ...wb, ...patch, updatedAt: new Date().toISOString() }
              : wb,
          ),
        }))
      },

      deleteWordbook: (id) => {
        set((s) => ({ wordbooks: s.wordbooks.filter((wb) => wb.id !== id) }))
      },

      getWordbook: (id) => get().wordbooks.find((wb) => wb.id === id),
    }),
    { name: 'nomatdongsan-wordbooks' },
  ),
)
