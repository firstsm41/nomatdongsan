import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { BUILTIN_WORDBOOK_ID } from '../data/builtin'
import { formatRelativeTime } from '../lib/stats'
import { QUIZ_TYPE_LABELS } from '../lib/quizEngine'
import { useStudyStore } from '../store/studyStore'
import { useWordbookStore } from '../store/wordbookStore'

export function StatsPage() {
  const wb = useWordbookStore((s) => s.getPrimaryWordbook())
  const getSummary = useStudyStore((s) => s.getSummary)
  const getCategoryStats = useStudyStore((s) => s.getCategoryStats)
  const getSessions = useStudyStore((s) => s.getSessions)
  const getWeakWords = useStudyStore((s) => s.getWeakWords)
  const clearStats = useStudyStore((s) => s.clearStats)

  const summary = getSummary(wb.id, wb.entries.length)
  const categoryStats = getCategoryStats(wb.id, wb.entries)
  const sessions = getSessions(wb.id).slice(0, 10)
  const weakWords = getWeakWords(wb.id, wb.entries, 8)
  const hasData = summary.sessionsCount > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="학습 통계"
        subtitle={wb.name}
        action={
          hasData ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('이 단어장의 학습 통계를 초기화할까요?')) {
                  clearStats(wb.id)
                }
              }}
              className="text-xs text-[var(--color-ink-muted)] underline"
            >
              초기화
            </button>
          ) : undefined
        }
      />

      {!hasData ? (
        <Card className="py-10 text-center">
          <p className="text-4xl opacity-40">📊</p>
          <p className="mt-3 font-medium">아직 학습 기록이 없습니다</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            퀴즈를 풀면 통계가 쌓입니다.
          </p>
          <Link to={`/wordbooks/${wb.id}/quiz`} className="mt-5 inline-block">
            <Button>퀴즈 시작</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="누적 정답률"
              value={summary.accuracy != null ? `${summary.accuracy}%` : '—'}
              highlight
            />
            <StatCard label="퀴즈 횟수" value={`${summary.sessionsCount}회`} />
            <StatCard
              label="학습한 단어"
              value={`${summary.studiedWords}/${summary.totalWords}`}
            />
            <StatCard
              label="총 풀이"
              value={`${summary.totalAttempts}문항`}
            />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-muted)]">
              분야별 정답률
            </h2>
            <Card className="space-y-4">
              {categoryStats.map((row) => (
                <CategoryBar key={row.category} row={row} wordbookId={wb.id} />
              ))}
            </Card>
          </section>

          {weakWords.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-muted)]">
                취약 단어
              </h2>
              <ul className="space-y-2">
                {weakWords.map(({ entry, accuracy, attempts, wrong }) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-[var(--shadow-card)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--color-sage)]">
                        {entry.word}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {entry.meaning}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold ${
                          accuracy < 50
                            ? 'text-[var(--color-error)]'
                            : 'text-[var(--color-ink-muted)]'
                        }`}
                      >
                        {accuracy}%
                      </p>
                      <p className="text-[10px] text-[var(--color-ink-muted)]">
                        {attempts}회 · 틀림 {wrong}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-muted)]">
              최근 퀴즈
            </h2>
            <ul className="space-y-2">
              {sessions.map((s) => {
                const pct = Math.round((s.correct / s.total) * 100)
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {s.correct}/{s.total} ({pct}%)
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {QUIZ_TYPE_LABELS[s.quizType].split(' (')[0]}
                        {s.category ? ` · ${s.category}` : ' · 전체'}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {formatRelativeTime(s.finishedAt)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}

      <Link to={`/wordbooks/${BUILTIN_WORDBOOK_ID}/quiz`}>
        <Button fullWidth variant="secondary">
          퀴즈 하러 가기
        </Button>
      </Link>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          highlight ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function CategoryBar({
  row,
  wordbookId,
}: {
  row: {
    category: string
    totalWords: number
    studied: number
    accuracy: number | null
  }
  wordbookId: string
}) {
  const encoded = encodeURIComponent(row.category)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{row.category}</span>
        <span className="text-[var(--color-ink-muted)]">
          {row.accuracy != null ? `${row.accuracy}%` : '—'} · {row.studied}/
          {row.totalWords} 학습
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${row.accuracy ?? 0}%` }}
        />
      </div>
      <Link
        to={`/wordbooks/${wordbookId}/quiz/play?type=word-to-meaning&count=15&category=${encoded}`}
        className="mt-1.5 inline-block text-xs font-medium text-[var(--color-accent)]"
      >
        이 분야 퀴즈 →
      </Link>
    </div>
  )
}
