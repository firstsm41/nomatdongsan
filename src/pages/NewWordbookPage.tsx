import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { downloadExcelTemplate, parseExcelFile } from '../lib/excelParser'
import { useWordbookStore } from '../store/wordbookStore'

export function NewWordbookPage() {
  const navigate = useNavigate()
  const addWordbook = useWordbookStore((s) => s.addWordbook)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ count: number; warnings: string[] } | null>(null)

  async function handleFileChange(f: File | null) {
    setFile(f)
    setError(null)
    setPreview(null)
    if (!f) return
    setLoading(true)
    try {
      const result = await parseExcelFile(f)
      setPreview({ count: result.entries.length, warnings: result.warnings })
      if (!name) {
        setName(f.name.replace(/\.(xlsx|xls|csv)$/i, ''))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일 오류')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { entries } = await parseExcelFile(file)
      const id = addWordbook(name.trim(), entries, description.trim() || undefined)
      navigate(`/wordbooks/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">새 단어장</h1>

      <Card>
        <p className="text-sm text-[var(--color-ink-muted)]">
          엑셀(.xlsx, .xls) 첫 시트를 읽습니다. 아래 버튼으로 양식을 받을 수 있습니다.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => downloadExcelTemplate()}
        >
          엑셀 양식 다운로드
        </Button>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">단어장 이름</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            placeholder="예: 토익 필수 500"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">설명 (선택)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
            placeholder="메모"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">엑셀 파일</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            required
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:text-white file:font-medium"
          />
        </label>

        {loading && <p className="text-sm text-[var(--color-ink-muted)]">파일 분석 중…</p>}
        {preview && (
          <p className="text-sm text-[var(--color-success)] font-medium">
            {preview.count}개 단어 인식됨
          </p>
        )}
        {preview?.warnings.map((w) => (
          <p key={w} className="text-sm text-amber-700">
            {w}
          </p>
        ))}
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <Button type="submit" fullWidth disabled={loading || !file || !name.trim()}>
          단어장 만들기
        </Button>
      </form>
    </div>
  )
}
