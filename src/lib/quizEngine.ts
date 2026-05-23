import { v4 as uuidv4 } from 'uuid'
import type { QuizQuestion, QuizType, WordEntry } from '../types/vocabulary'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(
  pool: string[],
  correct: string,
  count: number,
): string[] {
  const others = shuffle(pool.filter((v) => v !== correct))
  return others.slice(0, count)
}

function resolveQuizType(type: QuizType, entry: WordEntry): QuizType {
  if (type !== 'mixed') return type
  const types: QuizType[] = ['word-to-meaning', 'meaning-to-word']
  if (entry.abbreviation) types.push('abbreviation')
  types.push('short-answer')
  return types[Math.floor(Math.random() * types.length)]
}

function buildQuestion(
  entry: WordEntry,
  type: QuizType,
  allEntries: WordEntry[],
): QuizQuestion | null {
  const meanings = allEntries.map((e) => e.meaning)
  const words = allEntries.map((e) => e.word)
  const abbrs = allEntries.filter((e) => e.abbreviation).map((e) => e.abbreviation!)

  const id = uuidv4()
  const resolved = resolveQuizType(type, entry)

  switch (resolved) {
    case 'word-to-meaning':
    case 'multiple-choice': {
      const options = shuffle([
        entry.meaning,
        ...pickDistractors(meanings, entry.meaning, 3),
      ])
      return {
        id,
        type: 'word-to-meaning',
        prompt: entry.word,
        subPrompt: '올바른 뜻을 고르세요',
        correctAnswer: entry.meaning,
        options,
        entryId: entry.id,
      }
    }
    case 'meaning-to-word': {
      const options = shuffle([
        entry.word,
        ...pickDistractors(words, entry.word, 3),
      ])
      return {
        id,
        type: 'meaning-to-word',
        prompt: entry.meaning,
        subPrompt: '올바른 단어를 고르세요',
        correctAnswer: entry.word,
        options,
        entryId: entry.id,
      }
    }
    case 'abbreviation': {
      if (!entry.abbreviation) return null
      const options = shuffle([
        entry.abbreviation,
        ...pickDistractors(abbrs, entry.abbreviation, 3),
      ])
      return {
        id,
        type: 'abbreviation',
        prompt: entry.word,
        subPrompt: '올바른 약어를 고르세요',
        correctAnswer: entry.abbreviation,
        options,
        entryId: entry.id,
      }
    }
    case 'short-answer': {
      const askWord = Math.random() > 0.5
      return {
        id,
        type: 'short-answer',
        prompt: askWord ? entry.meaning : entry.word,
        subPrompt: askWord ? '단어를 입력하세요' : '뜻을 입력하세요',
        correctAnswer: askWord ? entry.word : entry.meaning,
        entryId: entry.id,
      }
    }
    default:
      return null
  }
}

export function generateQuiz(
  entries: WordEntry[],
  quizType: QuizType,
  count: number,
  onlyEntryIds?: string[],
  category?: string | null,
): QuizQuestion[] {
  if (entries.length === 0) return []

  let base = entries
  if (category) {
    base = base.filter((e) => e.category === category)
  }
  if (onlyEntryIds && onlyEntryIds.length > 0) {
    const idSet = new Set(onlyEntryIds)
    base = base.filter((e) => idSet.has(e.id))
  }

  const pool =
    quizType === 'abbreviation'
      ? base.filter((e) => e.abbreviation)
      : base

  if (pool.length === 0) return []

  const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
  const questions: QuizQuestion[] = []

  for (const entry of selected) {
    let q = buildQuestion(entry, quizType, entries)
    let attempts = 0
    while (!q && attempts < 5) {
      q = buildQuestion(entry, 'word-to-meaning', entries)
      attempts++
    }
    if (q) questions.push(q)
  }

  return shuffle(questions)
}

export function checkAnswer(
  question: QuizQuestion,
  userAnswer: string,
): boolean {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')

  return normalize(userAnswer) === normalize(question.correctAnswer)
}

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  'word-to-meaning': '단어 → 뜻 (4지선다)',
  'meaning-to-word': '뜻 → 단어 (4지선다)',
  abbreviation: '약어 맞추기 (4지선다)',
  'multiple-choice': '4지선다 (단어→뜻)',
  'short-answer': '단답형',
  mixed: '혼합 (랜덤 유형)',
}

export const QUIZ_TYPE_DESCRIPTIONS: Record<QuizType, string> = {
  'word-to-meaning': '영어 단어를 보고 뜻을 고릅니다.',
  'meaning-to-word': '뜻을 보고 영어 단어를 고릅니다.',
  abbreviation: '단어에 맞는 약어를 고릅니다. (약어 열 필요)',
  'multiple-choice': '단어→뜻 4지선다와 동일합니다.',
  'short-answer': '단어 또는 뜻을 직접 입력합니다.',
  mixed: '문제마다 유형이 랜덤으로 바뀝니다.',
}
