import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { checkAnswer, generateQuiz, QUIZ_TYPE_LABELS } from '../lib/quizEngine'
import { useWordbookStore } from '../store/wordbookStore'
import type { QuizAnswer, QuizQuestion, QuizType } from '../types/vocabulary'

export function QuizPlayPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const wordbook = useWordbookStore((s) => s.getWordbook(id ?? ''))

  const quizType = (searchParams.get('type') ?? 'word-to-meaning') as QuizType
  const count = Number(searchParams.get('count') ?? 10)

  const questions = useMemo(() => {
    if (!wordbook) return []
    return generateQuiz(wordbook.entries, quizType, count)
  }, [wordbook, quizType, count])

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selected, setSelected] = useState('')
  const [textInput, setTextInput] = useState('')
  const [revealed, setRevealed] = useState(false)

  if (!wordbook) {
    return <p className="text-center py-12">단어장을 찾을 수 없습니다.</p>
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4 text-center py-12">
        <p>이 유형으로 낼 수 있는 문제가 없습니다.</p>
        <Link to={`/wordbooks/${id}/quiz`}>
          <Button variant="secondary">설정으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const finished = index >= questions.length

  function submitChoice(value: string, question: QuizQuestion) {
    if (revealed) return
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
    return (
      <div className="space-y-6 text-center">
        <Card>
          <p className="text-sm text-[var(--color-ink-muted)]">결과</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-[var(--color-accent)]">
            {score}/{answers.length}
          </p>
          <p className="text-lg font-medium">{pct}%</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            {QUIZ_TYPE_LABELS[quizType]}
          </p>
        </Card>

        <details className="text-left">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-accent)]">
            오답 노트 보기
          </summary>
          <ul className="mt-3 space-y-2">
            {answers
              .filter((a) => !a.isCorrect)
              .map((a) => (
                <li
                  key={a.questionId}
                  className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
                >
                  <span className="text-[var(--color-error)]">내 답: {a.userAnswer}</span>
                  <br />
                  <span className="text-[var(--color-success)]">정답: {a.correctAnswer}</span>
                </li>
              ))}
            {answers.every((a) => a.isCorrect) && (
              <li className="text-sm text-[var(--color-ink-muted)]">모두 정답입니다!</li>
            )}
          </ul>
        </details>

        <div className="flex flex-col gap-2">
          <Link to={`/wordbooks/${id}/quiz`}>
            <Button fullWidth>다시 풀기</Button>
          </Link>
          <Link to={`/wordbooks/${id}`}>
            <Button variant="secondary" fullWidth>
              단어장으로
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
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex justify-between text-sm text-[var(--color-ink-muted)]">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>{QUIZ_TYPE_LABELS[current.type]}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="text-center">
        {current.subPrompt && (
          <p className="text-sm text-[var(--color-ink-muted)]">{current.subPrompt}</p>
        )}
        <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold break-words">
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
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-center text-lg outline-none focus:border-[var(--color-accent)]"
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
        <ul className="grid gap-2">
          {current.options?.map((opt) => {
            let style = 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            if (revealed) {
              if (opt === current.correctAnswer) {
                style = 'border-[var(--color-success)] bg-[var(--color-success)]/10'
              } else if (opt === selected) {
                style = 'border-[var(--color-error)] bg-[var(--color-error)]/10'
              }
            } else if (opt === selected) {
              style = 'border-[var(--color-accent)]'
            }
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => submitChoice(opt, current)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left font-medium transition-colors disabled:cursor-default ${style}`}
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
            {index + 1 < questions.length ? '다음 문제' : '결과 보기'}
          </Button>
        </div>
      )}
    </div>
  )
}
