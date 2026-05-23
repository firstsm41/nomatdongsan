import { Link, Outlet, useLocation } from 'react-router-dom'
import { BUILTIN_WORDBOOK_ID } from '../data/builtin'
import { useStudyStore } from '../store/studyStore'

const nav = [
  { to: '/', label: '홈', icon: '⌂' },
  { to: `/wordbooks/${BUILTIN_WORDBOOK_ID}`, label: '단어장', icon: '☰' },
  { to: '/stats', label: '통계', icon: '◔' },
  { to: '/wrong', label: '오답', icon: '✎' },
]

export function Layout() {
  const { pathname } = useLocation()
  const wrongCount = useStudyStore((s) => s.totalWrongCount())

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-cream)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link
            to="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-accent)]"
          >
            노맛동산
          </Link>
          <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
            의학용어
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--color-border)] bg-white/95 backdrop-blur-md safe-bottom">
        <div className="mx-auto flex max-w-lg justify-around px-1 pt-2 pb-2">
          {nav.map(({ to, label, icon }) => {
            const active =
              to === '/'
                ? pathname === '/'
                : to === '/stats'
                  ? pathname === '/stats'
                  : pathname === to || pathname.startsWith(to + '/')
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors sm:min-w-[4rem] sm:text-xs ${
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-ink-muted)]'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                {label}
                {to === '/wrong' && wrongCount > 0 && (
                  <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[10px] font-bold text-white">
                    {wrongCount > 99 ? '99+' : wrongCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
