import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({
  title,
  subtitle,
  backTo,
  action,
}: {
  title: string
  subtitle?: string
  backTo?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6">
      {backTo && (
        <Link
          to={backTo}
          className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
        >
          <span aria-hidden>←</span> 돌아가기
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}
