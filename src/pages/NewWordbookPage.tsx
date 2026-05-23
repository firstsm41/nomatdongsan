import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWordbookStore } from '../store/wordbookStore'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  downloadExcelTemplate,
  inspectExcelFile,
  parseExcelFile,
  type ExcelSheetInfo,
} from '../lib/excelParser'

const SCHEMA_LABEL: Record<ExcelSheetInfo['schema'], string> = {
  'medical-term': '의학용어',
  'department-abbr': '진료과 약어',
  generic: '일반',
}

export function NewWordbookPage() {
  const navigate = useNavigate()
  const addWordbook = useWordbookStore((s) => s.addWordbook)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheets, setSheets] = useState<ExcelSheetInfo[]>([])
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [preview, setPreview] = useState<{
    count: number
    abbrCount: number
    warnings: string[]
  } | null>(null)

  async function refreshPreview(f: File, selected: string[]) {
    const result = await parseExcelFile(f, { sheetNames: selected })
    setPreview({
      count: result.entries.length,
      abbrCount: result.entries.filter((e) => e.abbreviation).length,
      warnings: result.warnings,
    })
  }

  async function handleFileChange(f: File | null) {
    setFile(f)
    setError(null)
    setPreview(null)
    setSheets([])
    setSelectedSheets([])
    if (!f) return
    setLoading(true)
    try {
      const { sheets: found, defaultSheetNames, preview: initial } =
        await inspectExcelFile(f)
      setSheets(found)
      setSelectedSheets(defaultSheetNames)
      setPreview({
        count: initial.entries.length,
        abbrCount: initial.entries.filter((e) => e.abbreviation).length,
        warnings: initial.warnings,
      })
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

  async function toggleSheet(sheetName: string) {
    if (!file) return
    const next = selectedSheets.includes(sheetName)
      ? selectedSheets.filter((s) => s !== sheetName)
      : [...selectedSheets, sheetName]
    if (next.length === 0) return
    setSelectedSheets(next)
    setLoading(true)
    try {
      await refreshPreview(file, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '미리보기 오류')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name.trim() || selectedSheets.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const { entries } = await parseExcelFile(file, { sheetNames: selectedSheets })
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
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          의학용어 정리본처럼 여러 시트가 있어도 됩니다. 기본으로{' '}
          <strong>단어장_전체</strong> 시트를 불러옵니다. 진료과 약어 시트는
          따로 선택할 수 있습니다.
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
            placeholder="예: 의학용어 단어장"
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

        {sheets.length > 1 && (
          <fieldset className="space-y-2 rounded-xl border border-[var(--color-border)] p-3">
            <legend className="px-1 text-sm font-semibold">가져올 시트</legend>
            {sheets.map((s) => (
              <label
                key={s.name}
                className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-[var(--color-border)]/30"
              >
                <input
                  type="checkbox"
                  checked={selectedSheets.includes(s.name)}
                  onChange={() => toggleSheet(s.name)}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[var(--color-ink-muted)]">
                    {' '}
                    — {s.rowCount}개 · {SCHEMA_LABEL[s.schema]}
                    {s.abbrCount > 0 && ` · 약어 ${s.abbrCount}`}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {loading && <p className="text-sm text-[var(--color-ink-muted)]">파일 분석 중…</p>}
        {preview && (
          <p className="text-sm font-medium text-[var(--color-success)]">
            {preview.count}개 단어 · 약어 {preview.abbrCount}개
          </p>
        )}
        {preview?.warnings.map((w) => (
          <p key={w} className="text-sm text-amber-700">
            {w}
          </p>
        ))}
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <Button
          type="submit"
          fullWidth
          disabled={loading || !file || !name.trim() || selectedSheets.length === 0}
        >
          단어장 만들기
        </Button>
      </form>
    </div>
  )
}
