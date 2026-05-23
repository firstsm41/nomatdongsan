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
  category?: string
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
  builtin?: boolean
}

export interface EntryStat {
  correct: number
  wrong: number
  lastAnsweredAt?: string
}

export interface QuizSessionRecord {
  id: string
  wordbookId: string
  quizType: QuizType
  category: string | null
  total: number
  correct: number
  finishedAt: string
}

export interface WrongAnswerRecord {
  id: string
  wordbookId: string
  entryId: string
  word: string
  meaning: string
  abbreviation?: string
  userAnswer: string
  correctAnswer: string
  quizType: QuizType
  wrongAt: string
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
