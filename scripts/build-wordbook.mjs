/**
 * 엑셀 → src/data/medical-wordbook.json
 * 사용: node scripts/build-wordbook.mjs [엑셀경로]
 */
import XLSX from 'xlsx'
import { writeFileSync } from 'fs'

const path =
  process.argv[2] ||
  '/Users/sungmin/Downloads/의학용어_단어장_한시트_정리본 (1).xlsx'

const wb = XLSX.readFile(path)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

const entries = []
let skipped = 0

for (let i = 1; i < rows.length; i++) {
  const row = rows[i]
  const category = String(row[0] ?? '').trim()
  const abbreviation = String(row[2] ?? '').trim()
  const term = String(row[3] ?? '').trim()
  const meaning = String(row[4] ?? '').trim()

  if (!term && !abbreviation) {
    skipped++
    continue
  }

  let word, finalMeaning, abbr

  if (category === '진료과 약어' || (!meaning && abbreviation && term)) {
    word = abbreviation
    finalMeaning = term
    abbr = abbreviation
  } else if (!meaning) {
    skipped++
    continue
  } else {
    word = term
    finalMeaning = meaning
    abbr = abbreviation || undefined
  }

  if (!word || !finalMeaning) {
    skipped++
    continue
  }

  entries.push({
    id: `m${String(entries.length + 1).padStart(4, '0')}`,
    word,
    meaning: finalMeaning,
    ...(abbr ? { abbreviation: abbr } : {}),
    ...(category ? { category } : {}),
  })
}

const out = {
  id: 'builtin-medical',
  name: '의학용어 단어장',
  description: `의학용어 정리본 · ${entries.length}단어`,
  entries,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

writeFileSync('src/data/medical-wordbook.json', JSON.stringify(out))
console.log(`✓ ${entries.length}단어 저장 (건너뜀 ${skipped})`)
console.log(`  약어 ${entries.filter((e) => e.abbreviation).length}개`)
