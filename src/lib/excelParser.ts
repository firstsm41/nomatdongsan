import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import type { WordEntry } from '../types/vocabulary'

/** 엑셀 첫 행 헤더 — 한글/영문 모두 인식 */
const HEADER_ALIASES: Record<keyof Omit<WordEntry, 'id'>, string[]> = {
  word: ['단어', 'word', '영어', 'english', '용어', 'term'],
  meaning: ['뜻', 'meaning', '의미', 'definition', '해석'],
  abbreviation: ['약어', 'abbreviation', 'abbr', '약칭'],
  example: ['예문', 'example', '문장', 'sentence'],
  note: ['메모', 'note', '비고', '설명', 'comment'],
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function findColumnIndex(
  headers: string[],
  aliases: string[],
): number {
  return headers.findIndex((h) =>
    aliases.some((a) => h === a.toLowerCase() || h.includes(a.toLowerCase())),
  )
}

function cellValue(row: unknown[], index: number): string {
  if (index < 0) return ''
  const v = row[index]
  if (v == null) return ''
  return String(v).trim()
}

export interface ParseExcelResult {
  entries: WordEntry[]
  skipped: number
  warnings: string[]
}

export function parseExcelFile(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          reject(new Error('시트가 비어 있습니다.'))
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: '',
        }) as unknown[][]

        if (rows.length < 2) {
          reject(new Error('데이터 행이 없습니다. 헤더와 최소 1개 단어가 필요합니다.'))
          return
        }

        const headerRow = rows[0].map(normalizeHeader)
        const wordIdx = findColumnIndex(headerRow, HEADER_ALIASES.word)
        const meaningIdx = findColumnIndex(headerRow, HEADER_ALIASES.meaning)

        const warnings: string[] = []
        if (wordIdx < 0 || meaningIdx < 0) {
          reject(
            new Error(
              '「단어」「뜻」 열을 찾을 수 없습니다. 첫 행에 단어/word, 뜻/meaning 헤더를 넣어 주세요.',
            ),
          )
          return
        }

        const abbrIdx = findColumnIndex(headerRow, HEADER_ALIASES.abbreviation)
        const exampleIdx = findColumnIndex(headerRow, HEADER_ALIASES.example)
        const noteIdx = findColumnIndex(headerRow, HEADER_ALIASES.note)

        if (abbrIdx < 0) {
          warnings.push('약어 열이 없습니다. 약어 퀴즈는 해당 단어장에서 제외됩니다.')
        }

        const entries: WordEntry[] = []
        let skipped = 0

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.every((c) => c == null || String(c).trim() === '')) {
            skipped++
            continue
          }
          const word = cellValue(row, wordIdx)
          const meaning = cellValue(row, meaningIdx)
          if (!word || !meaning) {
            skipped++
            continue
          }
          const abbreviation = cellValue(row, abbrIdx) || undefined
          const example = cellValue(row, exampleIdx) || undefined
          const note = cellValue(row, noteIdx) || undefined

          entries.push({
            id: uuidv4(),
            word,
            meaning,
            abbreviation,
            example,
            note,
          })
        }

        if (entries.length === 0) {
          reject(new Error('유효한 단어가 하나도 없습니다.'))
          return
        }

        resolve({ entries, skipped, warnings })
      } catch (err) {
        reject(err instanceof Error ? err : new Error('엑셀 파싱 실패'))
      }
    }
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'))
    reader.readAsArrayBuffer(file)
  })
}

export function downloadExcelTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    ['단어', '뜻', '약어', '예문', '메모'],
    ['abandon', '포기하다', '—', 'He abandoned the plan.', ''],
    ['benefit', '이익', 'ben.', 'for your benefit', ''],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '단어장')
  XLSX.writeFile(wb, '노맛동산_단어장_양식.xlsx')
}
