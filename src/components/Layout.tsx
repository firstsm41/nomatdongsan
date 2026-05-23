import { Link, Outlet, useLocation } from 'react-router-dom'

const nav = [
  { to: '/', label: '홈' },
  { to: '/wordbooks', label: '단어장' },
]

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-cream)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-accent)]"
          >
            노맛동산
          </Link>
          <nav className="flex gap-1">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === to || (to !== '/' && pathname.startsWith(to))
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-border)]/60'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-ink-muted)]">
        엑셀 단어장 · 다양한 퀴즈 유형
      </footer>
    </div>
  )
}
