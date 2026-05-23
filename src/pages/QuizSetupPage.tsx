import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  QUIZ_TYPE_DESCRIPTIONS,
  QUIZ_TYPE_LABELS,
} from '../lib/quizEngine'
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
  const [quizType, setQuizType] = useState<QuizType>('word-to-meaning')
  const [count, setCount] = useState(10)

  if (!wordbook) {
    return (
      <div className="text-center py-12">
        <p>단어장을 찾을 수 없습니다.</p>
        <Link to="/wordbooks">
          <Button variant="secondary" className="mt-4">
            목록으로
          </Button>
        </Link>
      </div>
    )
  }

  const maxCount = wordbook.entries.length
  const abbrCount = wordbook.entries.filter((e) => e.abbreviation).length

  function start() {
    const params = new URLSearchParams({
      type: quizType,
      count: String(Math.min(count, maxCount)),
    })
    navigate(`/wordbooks/${id}/quiz/play?${params}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/wordbooks/${id}`}
          className="text-sm text-[var(--color-ink-muted)] hover:underline"
        >
          ← {wordbook.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">퀴즈 설정</h1>
      </div>

      <Card className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">퀴즈 유형</legend>
          {QUIZ_OPTIONS.map((type) => {
            const disabled =
              type === 'abbreviation' && abbrCount === 0
            return (
              <label
                key={type}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                  quizType === type
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border)]'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="quizType"
                  value={type}
                  checked={quizType === type}
                  disabled={disabled}
                  onChange={() => setQuizType(type)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{QUIZ_TYPE_LABELS[type]}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {QUIZ_TYPE_DESCRIPTIONS[type]}
                    {type === 'abbreviation' && abbrCount === 0 && ' (약어 없음)'}
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
            min={1}
            max={maxCount}
            value={Math.min(count, maxCount)}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <p className="text-center text-lg font-bold">{Math.min(count, maxCount)}문제</p>
        </label>

        <Button fullWidth onClick={start}>
          시작
        </Button>
      </Card>
    </div>
  )
}
