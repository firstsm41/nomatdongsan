import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useWordbookStore } from '../store/wordbookStore'
import { QUIZ_TYPE_LABELS } from '../lib/quizEngine'
import type { QuizType } from '../types/vocabulary'

const features: { type: QuizType; icon: string }[] = [
  { type: 'word-to-meaning', icon: 'A→가' },
  { type: 'meaning-to-word', icon: '가→A' },
  { type: 'abbreviation', icon: 'Abbr' },
  { type: 'short-answer', icon: '✎' },
  { type: 'mixed', icon: '◇' },
]

export function HomePage() {
  const wordbooks = useWordbookStore((s) => s.wordbooks)
  const totalWords = wordbooks.reduce((n, wb) => n + wb.entries.length, 0)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight">
          엑셀로 만드는
          <br />
          <span className="text-[var(--color-accent)]">나만의 단어장</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] leading-relaxed">
          엑셀 파일을 올리면 단어장이 만들어지고, 4지선다·단답형·약어 퀴즈 등
          여러 유형으로 복습할 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/wordbooks/new">
            <Button>단어장 만들기</Button>
          </Link>
          {wordbooks.length > 0 && (
            <Link to="/wordbooks">
              <Button variant="secondary">단어장 보기 ({wordbooks.length})</Button>
            </Link>
          )}
        </div>
      </section>

      {wordbooks.length > 0 && (
        <Card>
          <p className="text-sm text-[var(--color-ink-muted)]">학습 현황</p>
          <p className="mt-1 text-2xl font-bold">
            {wordbooks.length}권 · {totalWords}단어
          </p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">지원 퀴즈 유형</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {features.map(({ type, icon }) => (
            <li
              key={type}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-sage-light)] text-xs font-bold text-[var(--color-sage)]">
                {icon}
              </span>
              <div>
                <p className="font-medium">{QUIZ_TYPE_LABELS[type]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Card className="bg-[var(--color-sage-light)]/40 border-[var(--color-sage)]/20">
        <h3 className="font-semibold text-[var(--color-sage)]">엑셀 형식 안내</h3>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
          첫 행: <strong>단어</strong>, <strong>뜻</strong> (필수) · <strong>약어</strong>,{' '}
          <strong>예문</strong>, <strong>메모</strong> (선택)
          <br />
          영문 헤더(word, meaning, abbreviation)도 인식합니다.
        </p>
        <Link to="/wordbooks/new" className="mt-3 inline-block text-sm font-semibold text-[var(--color-accent)]">
          양식 받으며 만들기 →
        </Link>
      </Card>
    </div>
  )
}
