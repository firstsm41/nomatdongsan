import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { useStudySummary } from '../hooks/useStudyStats'
import { useStudyStore } from '../store/studyStore'
import { useWordbookStore } from '../store/wordbookStore'

export function WordbookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const wordbook = useWordbookStore((s) => s.getWordbook(id ?? ''))
  const wrongCount = useStudyStore((s) => s.totalWrongCount(id ?? ''))
  const summary = useStudySummary(
    wordbook?.id ?? id ?? '',
    wordbook?.entries.length ?? 0,
  )

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

  const abbrCount = wordbook.entries.filter((e) => e.abbreviation).length
  const categories = new Set(wordbook.entries.map((e) => e.category).filter(Boolean))

  return (
    <div className="space-y-5">
      <PageHeader
        title={wordbook.name}
        subtitle={wordbook.description}
        backTo="/"
      />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="단어" value={String(wordbook.entries.length)} />
        <Stat label="약어" value={String(abbrCount)} />
        <Stat label="분야" value={String(categories.size)} />
      </div>

      {wrongCount > 0 && (
        <Link to="/wrong">
          <Card className="flex items-center justify-between bg-red-50/60">
            <span className="text-sm font-semibold text-[var(--color-error)]">
              오답 {wrongCount}개 복습하기
            </span>
            <span>→</span>
          </Card>
        </Link>
      )}

      <div className="grid gap-2">
        <ActionCard
          to={`/wordbooks/${id}/study`}
          title="단어장 · 암기 카드"
          desc="검색, 분야 필터, 카드 넘기기"
          accent
        />
        <ActionCard
          to={`/wordbooks/${id}/quiz`}
          title="퀴즈"
          desc="분야·유형·문항 수 선택"
        />
        <ActionCard
          to="/stats"
          title="학습 통계"
          desc={
            summary.sessionsCount > 0
              ? `정답률 ${summary.accuracy}%`
              : '분야별·취약 단어 분석'
          }
        />
        <ActionCard to="/wrong" title="오답 노트" desc="틀린 문제만 모아보기" />
      </div>

      <Link to={`/wordbooks/${id}/quiz/play?type=word-to-meaning&count=20`}>
        <Button fullWidth>바로 퀴즈 (20문제)</Button>
      </Link>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white py-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-lg font-bold text-[var(--color-accent)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
    </div>
  )
}

function ActionCard({
  to,
  title,
  desc,
  accent,
}: {
  to: string
  title: string
  desc: string
  accent?: boolean
}) {
  return (
    <Link
      to={to}
      className={`block rounded-xl border p-4 shadow-[var(--shadow-card)] transition ${
        accent
          ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/50'
          : 'border-[var(--color-border)] bg-white'
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">{desc}</p>
    </Link>
  )
}
