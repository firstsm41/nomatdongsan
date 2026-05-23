import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { BUILTIN_WORDBOOK_ID } from '../data/builtin'
import { QUIZ_TYPE_LABELS } from '../lib/quizEngine'
import { useStudyStore } from '../store/studyStore'
import { useWordbookStore } from '../store/wordbookStore'

export function WrongNotesPage() {
  const wrongAnswers = useStudyStore((s) => s.wrongAnswers)
  const removeWrong = useStudyStore((s) => s.removeWrong)
  const clearAllWrong = useStudyStore((s) => s.clearAllWrong)
  const getWordbook = useWordbookStore((s) => s.getWordbook)

  const sorted = [...wrongAnswers].sort(
    (a, b) => new Date(b.wrongAt).getTime() - new Date(a.wrongAt).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <div>
        <PageHeader title="오답 노트" subtitle="틀린 문제가 여기에 쌓입니다" />
        <Card className="py-12 text-center">
          <p className="text-4xl">✓</p>
          <p className="mt-3 font-medium">오답이 없습니다</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            퀴즈를 풀고 틀리면 자동으로 저장됩니다.
          </p>
          <Link to={`/wordbooks/${BUILTIN_WORDBOOK_ID}/quiz`} className="mt-6 inline-block">
            <Button>퀴즈 시작</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const primaryId = sorted[0]?.wordbookId ?? BUILTIN_WORDBOOK_ID

  return (
    <div className="space-y-4">
      <PageHeader
        title="오답 노트"
        subtitle={`${sorted.length}개 단어`}
        action={
          <button
            type="button"
            onClick={() => {
              if (confirm('오답 노트를 모두 비울까요?')) {
                clearAllWrong()
              }
            }}
            className="text-xs font-medium text-[var(--color-ink-muted)] underline"
          >
            전체 삭제
          </button>
        }
      />

      <Link
        to={`/wordbooks/${primaryId}/quiz/play?mode=wrong&type=mixed&count=${Math.min(sorted.length, 30)}`}
      >
        <Button fullWidth>오답만 다시 풀기 ({sorted.length}문제)</Button>
      </Link>

      <ul className="space-y-3 pb-4">
        {sorted.map((w) => {
          const wb = getWordbook(w.wordbookId)
          return (
            <li
              key={w.id}
              className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-sage)]">{w.word}</p>
                  <p className="mt-0.5 text-sm">{w.meaning}</p>
                  {w.abbreviation && (
                    <p className="mt-1 text-xs text-[var(--color-accent)]">약어: {w.abbreviation}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeWrong(w.id)}
                  className="shrink-0 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-error)]"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </div>
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
                <p className="text-[var(--color-error)]">
                  내 답: <span className="font-medium">{w.userAnswer}</span>
                </p>
                <p className="mt-0.5 text-[var(--color-success)]">
                  정답: <span className="font-medium">{w.correctAnswer}</span>
                </p>
              </div>
              <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                {QUIZ_TYPE_LABELS[w.quizType]}
                {wb ? ` · ${wb.name}` : ''}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
