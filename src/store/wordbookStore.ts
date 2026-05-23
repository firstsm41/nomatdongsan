import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { BUILTIN_WORDBOOK_ID, builtinWordbook } from '../data/builtin'
import type { Wordbook } from '../types/vocabulary'

interface WordbookState {
  wordbooks: Wordbook[]
  hydrated: boolean
  ensureBuiltin: () => void
  addWordbook: (name: string, entries: Wordbook['entries'], description?: string) => string
  updateWordbook: (id: string, patch: Partial<Pick<Wordbook, 'name' | 'description' | 'entries'>>) => void
  deleteWordbook: (id: string) => void
  getWordbook: (id: string) => Wordbook | undefined
  getPrimaryWordbook: () => Wordbook
}

function mergeBuiltin(existing: Wordbook[]): Wordbook[] {
  const rest = existing.filter((wb) => wb.id !== BUILTIN_WORDBOOK_ID)
  return [builtinWordbook, ...rest]
}

export const useWordbookStore = create<WordbookState>()(
  persist(
    (set, get) => ({
      wordbooks: [builtinWordbook],
      hydrated: false,

      ensureBuiltin: () => {
        set((s) => ({
          wordbooks: mergeBuiltin(s.wordbooks),
          hydrated: true,
        }))
      },

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
        set((s) => ({ wordbooks: mergeBuiltin([...s.wordbooks, wordbook]) }))
        return id
      },

      updateWordbook: (id, patch) => {
        if (id === BUILTIN_WORDBOOK_ID) return
        set((s) => ({
          wordbooks: mergeBuiltin(
            s.wordbooks.map((wb) =>
              wb.id === id
                ? { ...wb, ...patch, updatedAt: new Date().toISOString() }
                : wb,
            ),
          ),
        }))
      },

      deleteWordbook: (id) => {
        if (id === BUILTIN_WORDBOOK_ID) return
        set((s) => ({
          wordbooks: mergeBuiltin(s.wordbooks.filter((wb) => wb.id !== id)),
        }))
      },

      getWordbook: (id) => get().wordbooks.find((wb) => wb.id === id),

      getPrimaryWordbook: () =>
        get().wordbooks.find((wb) => wb.id === BUILTIN_WORDBOOK_ID) ?? builtinWordbook,
    }),
    {
      name: 'nomatdongsan-wordbooks-v2',
      onRehydrateStorage: () => (state) => {
        state?.ensureBuiltin()
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<WordbookState> | undefined
        return {
          ...current,
          ...p,
          wordbooks: mergeBuiltin(p?.wordbooks ?? current.wordbooks),
        }
      },
    },
  ),
)
