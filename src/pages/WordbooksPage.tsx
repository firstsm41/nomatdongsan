import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useWordbookStore } from '../store/wordbookStore'

export function WordbooksPage() {
  const wordbooks = useWordbookStore((s) => s.wordbooks)
  const deleteWordbook = useWordbookStore((s) => s.deleteWordbook)

  if (wordbooks.length === 0) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-[var(--color-ink-muted)]">아직 단어장이 없습니다.</p>
        <Link to="/wordbooks/new">
          <Button>엑셀로 단어장 만들기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어장</h1>
        <Link to="/wordbooks/new">
          <Button variant="secondary">+ 새 단어장</Button>
        </Link>
      </div>
      <ul className="space-y-3">
        {wordbooks.map((wb) => (
          <li key={wb.id}>
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link
                  to={`/wordbooks/${wb.id}`}
                  className="text-lg font-semibold hover:text-[var(--color-accent)]"
                >
                  {wb.name}
                </Link>
                {wb.description && (
                  <p className="text-sm text-[var(--color-ink-muted)]">{wb.description}</p>
                )}
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  {wb.entries.length}단어
                  {wb.entries.some((e) => e.abbreviation) && ' · 약어 포함'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/wordbooks/${wb.id}/quiz`}>
                  <Button>퀴즈 시작</Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`「${wb.name}」 단어장을 삭제할까요?`)) {
                      deleteWordbook(wb.id)
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
