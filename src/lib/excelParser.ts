import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import type { WordEntry } from '../types/vocabulary'

const SKIP_SHEETS = new Set(['요약', 'summary', 'readme', '안내'])

const HEADER_ALIASES: Record<string, string[]> = {
  word: [
    '단어',
    'word',
    '영어',
    'english',
    '용어',
    'term',
    '의학용어',
    'medical term',
  ],
  meaning: ['뜻', 'meaning', '의미', 'definition', '해석'],
  abbreviation: ['약어', 'abbreviation', 'abbr', '약칭'],
  category: ['분야', 'category', '과목', '주제'],
  department: ['진료과명', '진료과', 'department'],
  subAbbr: ['세부약어', '세부 약어', 'sub abbreviation'],
  example: ['예문', 'example', '문장', 'sentence'],
  note: ['메모', 'note', '비고', '설명', 'comment', '검수메모', '검수'],
}

export type SheetSchema = 'medical-term' | 'department-abbr' | 'generic'

export interface ExcelSheetInfo {
  name: string
  schema: SheetSchema
  rowCount: number
  abbrCount: number
}

export interface ParseExcelResult {
  entries: WordEntry[]
  skipped: number
  warnings: string[]
  sheets: ExcelSheetInfo[]
}

export interface ParseExcelOptions {
  sheetNames?: string[]
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function findColumnIndex(headers: string[], aliases: string[]): number {
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

function detectSchema(headers: string[]): SheetSchema | null {
  const wordIdx = findColumnIndex(headers, HEADER_ALIASES.word)
  const meaningIdx = findColumnIndex(headers, HEADER_ALIASES.meaning)
  const abbrIdx = findColumnIndex(headers, HEADER_ALIASES.abbreviation)
  const deptIdx = findColumnIndex(headers, HEADER_ALIASES.department)

  if (wordIdx >= 0 && meaningIdx >= 0) return 'medical-term'
  if (abbrIdx >= 0 && deptIdx >= 0) return 'department-abbr'
  if (wordIdx >= 0 && meaningIdx < 0 && abbrIdx >= 0) return 'generic'
  return null
}

function parseMedicalRow(
  row: unknown[],
  headers: string[],
): Omit<WordEntry, 'id'> | null {
  const wordIdx = findColumnIndex(headers, HEADER_ALIASES.word)
  const meaningIdx = findColumnIndex(headers, HEADER_ALIASES.meaning)
  const abbrIdx = findColumnIndex(headers, HEADER_ALIASES.abbreviation)
  const categoryIdx = findColumnIndex(headers, HEADER_ALIASES.category)
  const noteIdx = findColumnIndex(headers, HEADER_ALIASES.note)

  const word = cellValue(row, wordIdx)
  const meaning = cellValue(row, meaningIdx)
  if (!word || !meaning) return null

  const abbreviation = cellValue(row, abbrIdx) || undefined
  const category = cellValue(row, categoryIdx) || undefined
  const note = cellValue(row, noteIdx) || undefined

  return { word, meaning, abbreviation, category, note }
}

function parseDepartmentRow(
  row: unknown[],
  headers: string[],
): Omit<WordEntry, 'id'> | null {
  const abbrIdx = findColumnIndex(headers, HEADER_ALIASES.abbreviation)
  const subIdx = findColumnIndex(headers, HEADER_ALIASES.subAbbr)
  const deptIdx = findColumnIndex(headers, HEADER_ALIASES.department)

  const abbr = cellValue(row, abbrIdx)
  const department = cellValue(row, deptIdx)
  if (!abbr || !department) return null

  const sub = cellValue(row, subIdx)
  const meaning = sub ? `${department} (${sub})` : department

  return {
    word: abbr,
    meaning,
    abbreviation: abbr,
    category: '진료과 약어',
    note: sub || undefined,
  }
}

function parseGenericRow(
  row: unknown[],
  headers: string[],
): Omit<WordEntry, 'id'> | null {
  const wordIdx = findColumnIndex(headers, HEADER_ALIASES.word)
  const meaningIdx = findColumnIndex(headers, HEADER_ALIASES.meaning)
  const abbrIdx = findColumnIndex(headers, HEADER_ALIASES.abbreviation)
  const categoryIdx = findColumnIndex(headers, HEADER_ALIASES.category)
  const noteIdx = findColumnIndex(headers, HEADER_ALIASES.note)

  const word = cellValue(row, wordIdx)
  const meaning = meaningIdx >= 0 ? cellValue(row, meaningIdx) : ''
  if (!word) return null
  if (!meaning && abbrIdx < 0) return null

  return {
    word,
    meaning: meaning || word,
    abbreviation: cellValue(row, abbrIdx) || undefined,
    category: cellValue(row, categoryIdx) || undefined,
    note: cellValue(row, noteIdx) || undefined,
  }
}

function parseSheetRows(
  rows: unknown[][],
  schema: SheetSchema,
  sheetName: string,
): { entries: Omit<WordEntry, 'id'>[]; skipped: number } {
  if (rows.length < 2) return { entries: [], skipped: 0 }

  const headers = rows[0].map(normalizeHeader)
  const entries: Omit<WordEntry, 'id'>[] = []
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every((c) => c == null || String(c).trim() === '')) {
      skipped++
      continue
    }

    let parsed: Omit<WordEntry, 'id'> | null = null
    if (schema === 'medical-term') parsed = parseMedicalRow(row, headers)
    else if (schema === 'department-abbr') parsed = parseDepartmentRow(row, headers)
    else parsed = parseGenericRow(row, headers)

    if (!parsed) {
      skipped++
      continue
    }

    if (!parsed.category && sheetName !== '단어장_전체') {
      parsed = { ...parsed, category: sheetName.replace(/_/g, ' ') }
    }

    entries.push(parsed)
  }

  return { entries, skipped }
}

function scanWorkbook(workbook: XLSX.WorkBook): ExcelSheetInfo[] {
  const infos: ExcelSheetInfo[] = []

  for (const name of workbook.SheetNames) {
    if (SKIP_SHEETS.has(name)) continue

    const sheet = workbook.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
    }) as unknown[][]

    if (rows.length < 2) continue
    const headers = rows[0].map(normalizeHeader)
    const schema = detectSchema(headers)
    if (!schema) continue

    const { entries } = parseSheetRows(rows, schema, name)
    if (entries.length === 0) continue

    infos.push({
      name,
      schema,
      rowCount: entries.length,
      abbrCount: entries.filter((e) => e.abbreviation).length,
    })
  }

  return infos
}

function defaultSelectedSheets(sheets: ExcelSheetInfo[]): string[] {
  const full = sheets.find((s) => s.name === '단어장_전체')
  if (full) return [full.name]
  return sheets.map((s) => s.name)
}

function dedupeKey(e: Omit<WordEntry, 'id'>): string {
  return `${e.word.toLowerCase()}|${e.meaning.toLowerCase()}|${e.category ?? ''}`
}

export function parseWorkbook(
  workbook: XLSX.WorkBook,
  options: ParseExcelOptions = {},
): ParseExcelResult {
  const sheets = scanWorkbook(workbook)
  if (sheets.length === 0) {
    throw new Error(
      '인식 가능한 단어 시트가 없습니다. 「의학용어」「의미」 또는 「약어」「진료과명」 형식이 필요합니다.',
    )
  }

  const selected =
    options.sheetNames && options.sheetNames.length > 0
      ? options.sheetNames
      : defaultSelectedSheets(sheets)

  const warnings: string[] = []
  const seen = new Set<string>()
  const entries: WordEntry[] = []
  let skipped = 0
  let duplicate = 0

  for (const sheetName of selected) {
    const info = sheets.find((s) => s.name === sheetName)
    if (!info) continue

    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
    }) as unknown[][]

    const { entries: parsed, skipped: sheetSkipped } = parseSheetRows(
      rows,
      info.schema,
      sheetName,
    )
    skipped += sheetSkipped

    for (const item of parsed) {
      const key = dedupeKey(item)
      if (seen.has(key)) {
        duplicate++
        continue
      }
      seen.add(key)
      entries.push({ ...item, id: uuidv4() })
    }
  }

  if (selected.length > 1) {
    warnings.push(`${selected.length}개 시트를 합쳐 ${entries.length}개 단어를 등록합니다.`)
  }
  if (duplicate > 0) {
    warnings.push(`중복 ${duplicate}개는 제외했습니다.`)
  }
  if (entries.filter((e) => e.abbreviation).length === 0) {
    warnings.push('약어가 있는 단어가 없습니다. 약어 퀴즈는 사용할 수 없습니다.')
  }

  if (entries.length === 0) {
    throw new Error('선택한 시트에서 유효한 단어를 찾지 못했습니다.')
  }

  return { entries, skipped, warnings, sheets }
}

export async function inspectExcelFile(file: File): Promise<{
  sheets: ExcelSheetInfo[]
  defaultSheetNames: string[]
  preview: ParseExcelResult
}> {
  const workbook = await readWorkbookFromFile(file)
  const sheets = scanWorkbook(workbook)
  const defaultSheetNames = defaultSelectedSheets(sheets)
  const preview = parseWorkbook(workbook, { sheetNames: defaultSheetNames })
  return { sheets, defaultSheetNames, preview }
}

export function parseExcelFile(
  file: File,
  options: ParseExcelOptions = {},
): Promise<ParseExcelResult> {
  return readWorkbookFromFile(file).then((wb) => parseWorkbook(wb, options))
}

function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        resolve(XLSX.read(data, { type: 'array' }))
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
    ['No', '분야', '알파벳', '약어', '의학용어', '의미', '검수메모'],
    [1, '공통 의학용어', 'A', 'Abd', 'abdominal', '복부의', ''],
    [2, '공통 의학용어', 'A', '', 'abrasion', '찰과상', ''],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '단어장')
  XLSX.writeFile(wb, '노맛동산_단어장_양식.xlsx')
}
