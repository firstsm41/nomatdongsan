import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { BUILTIN_WORDBOOK_ID } from '../data/builtin'
import { countByCategory } from '../lib/categories'
import { useStudySummary } from '../hooks/useStudyStats'
import { useStudyStore } from '../store/studyStore'
import { useWordbookStore } from '../store/wordbookStore'
import type { QuizType } from '../types/vocabulary'

const quickQuiz: { type: QuizType; label: string; desc: string }[] = [
  { type: 'word-to-meaning', label: '단어→뜻', desc: '4지선다' },
  { type: 'meaning-to-word', label: '뜻→단어', desc: '4지선다' },
  { type: 'abbreviation', label: '약어', desc: '4지선다' },
  { type: 'mixed', label: '혼합', desc: '랜덤' },
]

const TOP_CATEGORIES = ['내과', '외과', '산부인과', '소아청소년과', '공통 의학용어']

export function HomePage() {
  const wb = useWordbookStore((s) => s.getPrimaryWordbook())
  const wrongCount = useStudyStore((s) => s.totalWrongCount(BUILTIN_WORDBOOK_ID))
  const summary = useStudySummary(wb.id, wb.entries.length)
  const abbrCount = wb.entries.filter((e) => e.abbreviation).length
  const categories = countByCategory(wb.entries)
  const topCats = TOP_CATEGORIES.map(
    (name) => categories.find((c) => c.category === name) ?? { category: name, count: 0 },
  ).filter((c) => c.count > 0)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[#0f766e] p-6 text-white shadow-[var(--shadow-card)]">
        <p className="text-sm font-medium text-white/80">의학용어 단어장</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug">
          {wb.name}
        </h1>
        <p className="mt-2 text-sm text-white/90">
          {wb.entries.length}단어 · 약어 {abbrCount}개
          {summary.accuracy != null && ` · 정답률 ${summary.accuracy}%`}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/wordbooks/${wb.id}/quiz`}>
            <button
              type="button"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-accent)] shadow-sm"
            >
              퀴즈 시작
            </button>
          </Link>
          <Link to={`/wordbooks/${wb.id}/study`}>
            <button
              type="button"
              className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30"
            >
              단어 암기
            </button>
          </Link>
          <Link to="/stats">
            <button
              type="button"
              className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30"
            >
              통계
            </button>
          </Link>
        </div>
      </section>

      {wrongCount > 0 && (
        <Link to="/wrong">
          <Card className="flex items-center justify-between border-[var(--color-error)]/20 bg-red-50/80">
            <div>
              <p className="font-semibold text-[var(--color-error)]">오답 노트</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                틀린 {wrongCount}개 — 다시 풀어보세요
              </p>
            </div>
            <span className="text-2xl text-[var(--color-error)]">→</span>
          </Card>
        </Link>
      )}

      {topCats.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-ink-muted)]">
              분야별 퀴즈
            </h2>
            <Link
              to={`/wordbooks/${wb.id}/quiz`}
              className="text-xs font-medium text-[var(--color-accent)]"
            >
              전체 설정 →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {topCats.map(({ category, count }) => (
              <Link
                key={category}
                to={`/wordbooks/${wb.id}/quiz/play?type=word-to-meaning&count=${Math.min(15, count)}&category=${encodeURIComponent(category)}`}
                className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent)]"
              >
                <span className="font-semibold">{category}</span>
                <span className="ml-1 text-xs text-[var(--color-ink-muted)]">
                  {count}단어
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-muted)]">
          빠른 퀴즈 (전체)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {quickQuiz.map(({ type, label, desc }) => (
            <Link
              key={type}
              to={`/wordbooks/${wb.id}/quiz/play?type=${type}&count=20`}
              className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent)]"
            >
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {desc} · 20문제
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-muted)]">
          학습 메뉴
        </h2>
        <ul className="space-y-2">
          <MenuLink
            to={`/wordbooks/${wb.id}/study`}
            title="단어장 보기"
            desc="검색 · 분야별 · 카드 암기"
          />
          <MenuLink
            to={`/wordbooks/${wb.id}/quiz`}
            title="퀴즈 설정"
            desc="분야·유형·문항 수 선택"
          />
          <MenuLink
            to="/stats"
            title="학습 통계"
            desc={
              summary.sessionsCount > 0
                ? `정답률 ${summary.accuracy}% · ${summary.sessionsCount}회`
                : '퀴즈 후 자동 집계'
            }
          />
          <MenuLink to="/wrong" title="오답 노트" desc="틀린 문제만 복습" />
        </ul>
      </section>
    </div>
  )
}

function MenuLink({
  to,
  title,
  desc,
}: {
  to: string
  title: string
  desc: string
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3.5 shadow-[var(--shadow-card)]"
      >
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">{desc}</p>
        </div>
        <span className="text-[var(--color-ink-muted)]">→</span>
      </Link>
    </li>
  )
}
