import type { Wordbook } from '../types/vocabulary'
import medicalData from './medical-wordbook.json'

export const BUILTIN_WORDBOOK_ID = 'builtin-medical'

export const builtinWordbook: Wordbook = {
  ...(medicalData as Wordbook),
  id: BUILTIN_WORDBOOK_ID,
  builtin: true,
}
