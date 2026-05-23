import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { countByCategory } from '../lib/categories'
import {
  QUIZ_TYPE_DESCRIPTIONS,
  QUIZ_TYPE_LABELS,
} from '../lib/quizEngine'
import { useCategoryStats } from '../hooks/useStudyStats'
import { useStudyStore } from '../store/studyStore'
import { useWordbookStore } from '../store/wordbookStore'
import type { QuizType } from '../types/vocabulary'

const QUIZ_OPTIONS: QuizType[] = [
  'word-to-meaning',
  'meaning-to-word',
  'abbreviation',
  'short-answer',
  'mixed',
]

export function QuizSetupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const wordbook = useWordbookStore((s) => s.getWordbook(id ?? ''))
  const wrongCount = useStudyStore((s) => s.totalWrongCount(id ?? ''))

  const [quizType, setQuizType] = useState<QuizType>('word-to-meaning')
  const [count, setCount] = useState(20)
  const [category, setCategory] = useState<string | null>(null)

  const categoryStats = useCategoryStats(
    wordbook?.id ?? id ?? '',
    wordbook?.entries ?? [],
  )

  const categories = useMemo(
    () => (wordbook ? countByCategory(wordbook.entries) : []),
    [wordbook],
  )

  const poolEntries = useMemo(() => {
    if (!wordbook) return []
    if (!category) return wordbook.entries
    return wordbook.entries.filter((e) => e.category === category)
  }, [wordbook, category])

  if (!wordbook) {
    return (
      <div className="py-12 text-center">
        <p>단어장을 찾을 수 없습니다.</p>
        <Link to="/">
          <Button variant="secondary" className="mt-4">
            홈으로
          </Button>
        </Link>
      </div>
    )
  }

  const maxCount = poolEntries.length
  const abbrCount = poolEntries.filter((e) => e.abbreviation).length
  const effectiveCount = Math.min(count, maxCount)

  function start() {
    const params = new URLSearchParams({
      type: quizType,
      count: String(effectiveCount),
    })
    if (category) params.set('category', category)
    navigate(`/wordbooks/${id}/quiz/play?${params}`)
  }

  function accuracyFor(cat: string): number | null {
    return categoryStats.find((c) => c.category === cat)?.accuracy ?? null
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="퀴즈 설정"
        subtitle={
          category
            ? `${category} · ${maxCount}단어`
            : `전체 ${wordbook.entries.length}단어`
        }
        backTo={`/wordbooks/${id}`}
      />

      {wrongCount > 0 && (
        <Link
          to={`/wordbooks/${id}/quiz/play?mode=wrong&type=mixed&count=${Math.min(wrongCount, 30)}`}
        >
          <Card className="flex items-center justify-between border-[var(--color-error)]/20 bg-red-50/70">
            <div>
              <p className="font-semibold text-[var(--color-error)]">오답만 다시 풀기</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{wrongCount}개</p>
            </div>
            <span className="font-bold text-[var(--color-error)]">→</span>
          </Card>
        </Link>
      )}

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-[var(--color-ink-muted)]">분야 선택</p>
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={category === null}
            label={`전체 (${wordbook.entries.length})`}
            onClick={() => {
              setCategory(null)
              setCount(20)
            }}
          />
          {categories.map(({ category: cat, count: n }) => {
            const acc = accuracyFor(cat)
            return (
              <CategoryChip
                key={cat}
                active={category === cat}
                label={`${cat} (${n})`}
                sub={acc != null ? `${acc}%` : undefined}
                onClick={() => {
                  setCategory(cat)
                  setCount(Math.min(20, n))
                }}
              />
            )
          })}
        </div>
      </Card>

      <Card className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--color-ink-muted)]">
            유형
          </legend>
          {QUIZ_OPTIONS.map((type) => {
            const disabled = type === 'abbreviation' && abbrCount === 0
            return (
              <label
                key={type}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  quizType === type
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/40'
                    : 'border-[var(--color-border)] bg-white'
                } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <input
                  type="radio"
                  name="quizType"
                  checked={quizType === type}
                  disabled={disabled}
                  onChange={() => setQuizType(type)}
                  className="mt-1 accent-[var(--color-accent)]"
                />
                <div>
                  <p className="font-medium">{QUIZ_TYPE_LABELS[type]}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {QUIZ_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </label>
            )
          })}
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">
            문제 수 (최대 {maxCount})
          </span>
          <input
            type="range"
            min={5}
            max={Math.max(5, Math.min(maxCount, 50))}
            step={5}
            value={effectiveCount}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            disabled={maxCount === 0}
          />
          <p className="text-center text-xl font-bold text-[var(--color-accent)]">
            {effectiveCount}문제
          </p>
        </label>

        <Button fullWidth onClick={start} disabled={maxCount === 0}>
          {category ? `「${category}」 퀴즈 시작` : '퀴즈 시작'}
        </Button>
      </Card>
    </div>
  )
}

function CategoryChip({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean
  label: string
  sub?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'bg-white text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border)]'
      }`}
    >
      {label}
      {sub != null && (
        <span className={active ? 'text-white/80' : 'text-[var(--color-accent)]'}>
          {' '}
          · {sub}
        </span>
      )}
    </button>
  )
}
