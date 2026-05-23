import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { filterEntries, getCategories } from '../lib/categories'
import { useWordbookStore } from '../store/wordbookStore'

type ViewMode = 'list' | 'card'

export function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const wordbook = useWordbookStore((s) => s.getWordbook(id ?? ''))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>('list')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const categories = useMemo(
    () => (wordbook ? getCategories(wordbook.entries) : []),
    [wordbook],
  )

  const filtered = useMemo(
    () =>
      wordbook ? filterEntries(wordbook.entries, query, category) : [],
    [wordbook, query, category],
  )

  if (!wordbook) {
    return <p className="py-12 text-center text-[var(--color-ink-muted)]">단어장 없음</p>
  }

  const card = filtered[cardIndex]

  function nextCard() {
    setFlipped(false)
    setCardIndex((i) => (i + 1) % Math.max(filtered.length, 1))
  }

  function prevCard() {
    setFlipped(false)
    setCardIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1))
  }

  return (
    <div>
      <PageHeader
        title="단어 암기"
        subtitle={`${filtered.length}개 표시`}
        backTo={`/wordbooks/${id}`}
      />

      <div className="mb-4 space-y-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setCardIndex(0)
            setFlipped(false)
          }}
          placeholder="단어, 뜻, 약어 검색"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <CategoryChip
            active={category === null}
            onClick={() => {
              setCategory(null)
              setCardIndex(0)
            }}
            label="전체"
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={category === c}
              onClick={() => {
                setCategory(c)
                setCardIndex(0)
              }}
              label={c}
            />
          ))}
        </div>
        <div className="flex rounded-xl bg-[var(--color-border)]/50 p-1">
          <ModeTab active={mode === 'list'} onClick={() => setMode('list')}>
            목록
          </ModeTab>
          <ModeTab active={mode === 'card'} onClick={() => setMode('card')}>
            카드
          </ModeTab>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-ink-muted)]">
          검색 결과가 없습니다.
        </p>
      ) : mode === 'list' ? (
        <ul className="max-h-[calc(100dvh-18rem)] space-y-2 overflow-y-auto">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[var(--color-sage)]">{e.word}</p>
                {e.abbreviation && (
                  <span className="shrink-0 rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                    {e.abbreviation}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[var(--color-ink)]">{e.meaning}</p>
              {e.category && (
                <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{e.category}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm text-[var(--color-ink-muted)]">
            {cardIndex + 1} / {filtered.length}
          </p>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="mx-auto flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-[var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-card)] transition active:scale-[0.99]"
          >
            {!flipped ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                  {card?.abbreviation || '탭하여 뜻 보기'}
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
                  {card?.word}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium leading-relaxed">{card?.meaning}</p>
                {card?.category && (
                  <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{card.category}</p>
                )}
              </>
            )}
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevCard}>
              이전
            </Button>
            <Button fullWidth onClick={nextCard}>
              다음
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link to={`/wordbooks/${id}/quiz`}>
          <Button fullWidth>퀴즈로 복습</Button>
        </Link>
      </div>
    </div>
  )
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'bg-white text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border)]'
      }`}
    >
      {label}
    </button>
  )
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
        active ? 'bg-white text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-ink-muted)]'
      }`}
    >
      {children}
    </button>
  )
}
