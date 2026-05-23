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

function normalizeForCompare(s: string): string {
  return s.trim().toLowerCase()
}

/** 오답 후보 점수 — 높을수록 정답과 헷갈리기 쉬움 */
function scoreDistractor(
  entry: WordEntry,
  candidate: string,
  field: 'meaning' | 'word' | 'abbreviation',
  candidateEntry: WordEntry | undefined,
): number {
  const correct =
    field === 'meaning'
      ? entry.meaning
      : field === 'word'
        ? entry.word
        : entry.abbreviation ?? ''

  if (normalizeForCompare(candidate) === normalizeForCompare(correct)) return -999

  let score = 0

  if (candidateEntry?.category && candidateEntry.category === entry.category) {
    score += 12
  }

  if (field === 'word' || field === 'abbreviation') {
    const c0 = correct.charAt(0).toLowerCase()
    const d0 = candidate.charAt(0).toLowerCase()
    if (c0 && c0 === d0) score += 6
    const lenDiff = Math.abs(correct.length - candidate.length)
    if (lenDiff <= 2) score += 4
    else if (lenDiff <= 5) score += 2
    const prefixLen = Math.min(3, correct.length, candidate.length)
    if (
      prefixLen > 0 &&
      correct.slice(0, prefixLen).toLowerCase() ===
        candidate.slice(0, prefixLen).toLowerCase()
    ) {
      score += 5
    }
  }

  if (field === 'meaning') {
    if (correct.charAt(0) === candidate.charAt(0)) score += 5
    const lenDiff = Math.abs(correct.length - candidate.length)
    if (lenDiff <= 3) score += 4
    else if (lenDiff <= 6) score += 2
    if (correct.includes('증') && candidate.includes('증')) score += 3
    if (correct.includes('염') && candidate.includes('염')) score += 3
    if (correct.includes('의') && candidate.endsWith('의') && candidate.endsWith('의'))
      score += 2
  }

  if (field === 'abbreviation') {
    const clean = (s: string) => s.replace(/[^a-zA-Z]/g, '').toLowerCase()
    const pc = clean(correct)
    const pd = clean(candidate)
    if (pc && pd && pc.slice(0, 2) === pd.slice(0, 2)) score += 6
    if (Math.abs(correct.length - candidate.length) <= 2) score += 3
  }

  score += Math.random() * 2
  return score
}

function pickSimilarDistractors(
  entry: WordEntry,
  allEntries: WordEntry[],
  field: 'meaning' | 'word' | 'abbreviation',
  count: number,
): string[] {
  const sameCategory = allEntries.filter(
    (e) => e.id !== entry.id && e.category === entry.category,
  )
  const pool = (sameCategory.length >= 8 ? sameCategory : allEntries).filter(
    (e) => e.id !== entry.id,
  )

  const candidates: { value: string; score: number }[] = []
  const seen = new Set<string>()

  for (const e of pool) {
    const value =
      field === 'meaning' ? e.meaning : field === 'word' ? e.word : e.abbreviation
    if (!value || seen.has(value)) continue
    seen.add(value)
    candidates.push({
      value,
      score: scoreDistractor(entry, value, field, e),
    })
  }

  candidates.sort((a, b) => b.score - a.score)

  const top = candidates.filter((c) => c.score > 0).slice(0, count)
  if (top.length >= count) return top.map((c) => c.value)

  const rest = shuffle(
    candidates.filter((c) => !top.some((t) => t.value === c.value)),
  ).slice(0, count - top.length)

  return [...top.map((c) => c.value), ...rest.map((c) => c.value)]
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
  const id = uuidv4()
  const resolved = resolveQuizType(type, entry)

  switch (resolved) {
    case 'word-to-meaning':
    case 'multiple-choice': {
      const options = shuffle([
        entry.meaning,
        ...pickSimilarDistractors(entry, allEntries, 'meaning', 3),
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
        ...pickSimilarDistractors(entry, allEntries, 'word', 3),
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
      const isDeptAbbr = entry.category === '진료과 약어'
      const prompt = isDeptAbbr ? entry.meaning : entry.word
      const options = shuffle([
        entry.abbreviation,
        ...pickSimilarDistractors(entry, allEntries, 'abbreviation', 3),
      ])
      return {
        id,
        type: 'abbreviation',
        prompt,
        subPrompt: isDeptAbbr
          ? '진료과에 맞는 약어를 고르세요'
          : '올바른 약어를 고르세요',
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
  'word-to-meaning': '영어 단어를 보고 뜻을 고릅니다. (같은 분야·유사 단어 오답)',
  'meaning-to-word': '뜻을 보고 영어 단어를 고릅니다. (같은 분야·유사 단어 오답)',
  abbreviation: '단어에 맞는 약어를 고릅니다. (비슷한 약어 오답)',
  'multiple-choice': '단어→뜻 4지선다와 동일합니다.',
  'short-answer': '단어 또는 뜻을 직접 입력합니다.',
  mixed: '문제마다 유형이 랜덤으로 바뀝니다.',
}
