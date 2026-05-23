import { Navigate } from 'react-router-dom'
import { BUILTIN_WORDBOOK_ID } from '../data/builtin'

/** 하단 탭 「단어장」 → 기본 내장 단어장으로 이동 */
export function WordbooksPage() {
  return <Navigate to={`/wordbooks/${BUILTIN_WORDBOOK_ID}`} replace />
}
