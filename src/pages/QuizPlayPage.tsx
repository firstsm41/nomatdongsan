import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { checkAnswer, generateQuiz, QUIZ_TYPE_LABELS } from '../lib/quizEngine'
import { useStudyStore } from '../store/studyStore'
import { useWordbookStore } from '../store/wordbookStore'
import type { QuizAnswer, QuizQuestion, QuizType, WordEntry } from '../types/vocabulary'

export function QuizPlayPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const wordbook = useWordbookStore((s) => s.getWordbook(id ?? ''))
  const getWrongEntryIds = useStudyStore((s) => s.getWrongEntryIds)
  const recordWrong = useStudyStore((s) => s.recordWrongFromQuiz)
  const recordQuizSession = useStudyStore((s) => s.recordQuizSession)
  const removeWrongByEntryId = useStudyStore((s) => s.removeWrongByEntryId)
  const recordedRef = useRef(false)

  const mode = searchParams.get('mode')
  const isWrongMode = mode === 'wrong'
  const quizType = (searchParams.get('type') ?? 'word-to-meaning') as QuizType
  const count = Number(searchParams.get('count') ?? 10)
  const category = searchParams.get('category')

  const entryMap = useMemo(() => {
    const m = new Map<string, WordEntry>()
    wordbook?.entries.forEach((e) => m.set(e.id, e))
    return m
  }, [wordbook])

  const questions = useMemo(() => {
    if (!wordbook) return []
    const wrongIds = isWrongMode ? getWrongEntryIds(wordbook.id) : undefined
    if (isWrongMode && (!wrongIds || wrongIds.length === 0)) return []
    return generateQuiz(
      wordbook.entries,
      isWrongMode ? 'mixed' : quizType,
      count,
      wrongIds,
      isWrongMode ? null : category,
    )
  }, [wordbook, quizType, count, isWrongMode, getWrongEntryIds, category])

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selected, setSelected] = useState('')
  const [textInput, setTextInput] = useState('')
  const [revealed, setRevealed] = useState(false)

  const finished = index >= questions.length

  useEffect(() => {
    if (!finished || !wordbook || recordedRef.current) return
    recordedRef.current = true

    const wrongItems = answers
      .filter((a) => !a.isCorrect)
      .map((a) => {
        const q = questions.find((x) => x.id === a.questionId)
        const entry = q ? entryMap.get(q.entryId) : undefined
        if (!q || !entry) return null
        return {
          entryId: entry.id,
          word: entry.word,
          meaning: entry.meaning,
          abbreviation: entry.abbreviation,
          userAnswer: a.userAnswer,
          correctAnswer: q.correctAnswer,
          quizType: isWrongMode ? 'mixed' : quizType,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    if (wrongItems.length > 0) {
      recordWrong(wordbook.id, wrongItems)
    }

    const sessionResults = answers
      .map((a) => {
        const q = questions.find((x) => x.id === a.questionId)
        if (!q) return null
        return { entryId: q.entryId, isCorrect: a.isCorrect }
      })
      .filter((x): x is { entryId: string; isCorrect: boolean } => x !== null)

    if (sessionResults.length > 0) {
      recordQuizSession(
        wordbook.id,
        isWrongMode ? 'mixed' : quizType,
        category,
        sessionResults,
      )
    }
  }, [
    finished,
    wordbook,
    answers,
    questions,
    entryMap,
    recordWrong,
    recordQuizSession,
    quizType,
    isWrongMode,
    category,
  ])

  if (!wordbook) {
    return <p className="py-12 text-center">단어장을 찾을 수 없습니다.</p>
  }

  if (isWrongMode && getWrongEntryIds(wordbook.id).length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p>복습할 오답이 없습니다.</p>
        <Link to="/wrong">
          <Button variant="secondary">오답 노트</Button>
        </Link>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p>
          {category
            ? `「${category}」에서 낼 수 있는 문제가 없습니다.`
            : '이 유형으로 낼 수 있는 문제가 없습니다.'}
        </p>
        <Link to={`/wordbooks/${id}/quiz`}>
          <Button variant="secondary">설정으로</Button>
        </Link>
      </div>
    )
  }

  function submitChoice(value: string, question: QuizQuestion) {
    if (revealed || !wordbook) return
    setSelected(value)
    const isCorrect = checkAnswer(question, value)
    setAnswers((a) => [
      ...a,
      {
        questionId: question.id,
        userAnswer: value,
        isCorrect,
        correctAnswer: question.correctAnswer,
      },
    ])
    if (isCorrect && isWrongMode) {
      removeWrongByEntryId(wordbook.id, question.entryId)
    }
    setRevealed(true)
  }

  function submitText(question: QuizQuestion) {
    if (!textInput.trim()) return
    submitChoice(textInput.trim(), question)
  }

  function next() {
    setSelected('')
    setTextInput('')
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  if (finished) {
    const score = answers.filter((a) => a.isCorrect).length
    const pct = Math.round((score / answers.length) * 100)
    const wrongN = answers.length - score

    return (
      <div className="space-y-6">
        <PageHeader
          title="퀴즈 결과"
          subtitle={
            isWrongMode
              ? '오답 복습'
              : [QUIZ_TYPE_LABELS[quizType].split(' (')[0], category]
                  .filter(Boolean)
                  .join(' · ')
          }
        />
        <Card className="text-center">
          <p className="font-[family-name:var(--font-display)] text-5xl font-bold text-[var(--color-accent)]">
            {score}/{answers.length}
          </p>
          <p className="mt-1 text-lg font-medium">{pct}%</p>
          {wrongN > 0 && (
            <p className="mt-2 text-sm text-[var(--color-error)]">
              {wrongN}개 오답 노트에 저장됨
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-2">
          {wrongN > 0 && (
            <Link to="/wrong">
              <Button fullWidth variant="secondary">
                오답 노트 보기
              </Button>
            </Link>
          )}
          {wrongN > 0 && (
            <Link
              to={`/wordbooks/${id}/quiz/play?mode=wrong&type=mixed&count=${Math.min(wrongN, 30)}`}
            >
              <Button fullWidth>틀린 문제만 다시</Button>
            </Link>
          )}
          <Link to={`/wordbooks/${id}/quiz`}>
            <Button variant="secondary" fullWidth>
              다른 퀴즈
            </Button>
          </Link>
          <Link to="/stats">
            <Button variant="ghost" fullWidth>
              학습 통계
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" fullWidth>
              홈
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const current = questions[index]
  if (!current) return null

  const progress = ((index + 1) / questions.length) * 100
  const isShort = current.type === 'short-answer'
  const lastAnswer = answers[answers.length - 1]
  const wasCorrect = lastAnswer?.isCorrect

  return (
    <div className="space-y-5">
      {index === 0 && (
        <PageHeader
          title={isWrongMode ? '오답 복습' : '퀴즈'}
          subtitle={
            isWrongMode
              ? '틀렸던 단어만'
              : [QUIZ_TYPE_LABELS[quizType].split(' (')[0], category]
                  .filter(Boolean)
                  .join(' · ')
          }
          backTo={isWrongMode ? '/wrong' : `/wordbooks/${id}/quiz`}
        />
      )}

      <div>
        <div className="mb-2 flex justify-between text-sm text-[var(--color-ink-muted)]">
          <span>
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="text-center">
        {current.subPrompt && (
          <p className="text-sm text-[var(--color-ink-muted)]">{current.subPrompt}</p>
        )}
        <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold break-words sm:text-3xl">
          {current.prompt}
        </p>
      </Card>

      {isShort ? (
        <div className="space-y-3">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={revealed}
            onKeyDown={(e) => e.key === 'Enter' && submitText(current)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-center text-lg outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            placeholder="답 입력"
            autoFocus
          />
          {!revealed && (
            <Button fullWidth onClick={() => submitText(current)} disabled={!textInput.trim()}>
              확인
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-2.5">
          {current.options?.map((opt) => {
            let style =
              'border-[var(--color-border)] bg-white active:border-[var(--color-accent)]'
            if (revealed) {
              if (opt === current.correctAnswer) {
                style = 'border-[var(--color-success)] bg-emerald-50'
              } else if (opt === selected) {
                style = 'border-[var(--color-error)] bg-red-50'
              }
            }
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => submitChoice(opt, current)}
                  className={`w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium sm:text-base ${style}`}
                >
                  {opt}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {revealed && (
        <div className="space-y-3 text-center">
          <p
            className={`text-lg font-bold ${wasCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
          >
            {wasCorrect ? '정답!' : `오답 — 정답: ${current.correctAnswer}`}
          </p>
          <Button fullWidth onClick={next}>
            {index + 1 < questions.length ? '다음' : '결과 보기'}
          </Button>
        </div>
      )}
    </div>
  )
}
