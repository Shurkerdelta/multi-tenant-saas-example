import type { ReactNode } from 'react'

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="state-block">
      <p className="state-title">{title}</p>
      <p className="state-body">{body}</p>
      {action}
    </div>
  )
}

export function ErrorState({ body, onRetry }: { body: string; onRetry: () => void }) {
  return (
    <div className="state-block state-block-error">
      <p className="state-title">Something went wrong</p>
      <p className="state-body">{body}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

// Skeleton rows sized to the eventual table, not a full-page spinner — a list is
// still recognizably a list while it loads.
export function SkeletonRows({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="skeleton-row">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c}>
              <span className="skeleton-bar" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
