import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useWordbookStore } from '../store/wordbookStore'

export function WordbookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const wordbook = useWordbookStore((s) => s.getWordbook(id ?? ''))

  if (!wordbook) {
    return (
      <div className="space-y-4 text-center py-12">
        <p>단어장을 찾을 수 없습니다.</p>
        <Link to="/wordbooks">
          <Button variant="secondary">목록으로</Button>
        </Link>
      </div>
    )
  }

  const withAbbr = wordbook.entries.filter((e) => e.abbreviation).length

  return (
    <div className="space-y-6">
      <div>
        <Link to="/wordbooks" className="text-sm text-[var(--color-ink-muted)] hover:underline">
          ← 단어장 목록
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{wordbook.name}</h1>
        {wordbook.description && (
          <p className="text-[var(--color-ink-muted)]">{wordbook.description}</p>
        )}
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {wordbook.entries.length}단어
          {withAbbr > 0 && ` · 약어 ${withAbbr}개`}
        </p>
      </div>

      <Link to={`/wordbooks/${wordbook.id}/quiz`}>
        <Button fullWidth>퀴즈 시작</Button>
      </Link>

      <Card>
        <h2 className="mb-3 font-semibold">단어 목록</h2>
        <div className="max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-[var(--color-ink-muted)]">
              <tr>
                <th className="pb-2 pr-2">단어</th>
                <th className="pb-2 pr-2">뜻</th>
                <th className="pb-2">약어</th>
              </tr>
            </thead>
            <tbody>
              {wordbook.entries.map((e) => (
                <tr key={e.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-2 font-medium">{e.word}</td>
                  <td className="py-2 pr-2">{e.meaning}</td>
                  <td className="py-2 text-[var(--color-ink-muted)]">{e.abbreviation ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
