export type QuizType =
  | 'word-to-meaning'
  | 'meaning-to-word'
  | 'abbreviation'
  | 'multiple-choice'
  | 'short-answer'
  | 'mixed'

export interface WordEntry {
  id: string
  word: string
  meaning: string
  abbreviation?: string
  example?: string
  note?: string
}

export interface Wordbook {
  id: string
  name: string
  description?: string
  entries: WordEntry[]
  createdAt: string
  updatedAt: string
}

export interface QuizSession {
  wordbookId: string
  quizType: QuizType
  questionCount: number
  startedAt: string
}

export interface QuizQuestion {
  id: string
  type: QuizType
  prompt: string
  subPrompt?: string
  correctAnswer: string
  options?: string[]
  entryId: string
}

export interface QuizAnswer {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  correctAnswer: string
}

export interface QuizResult {
  session: QuizSession
  answers: QuizAnswer[]
  score: number
  total: number
  finishedAt: string
}
