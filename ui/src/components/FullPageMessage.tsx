interface Props {
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}

// The one screen rendered outside the app shell — used while auth is still
// resolving, and for whole-session failures (tenant suspended, account load failed).
export function FullPageMessage({ title, body, action }: Props) {
  return (
    <div className="full-page">
      <div className="full-page-card">
        <p className="full-page-mark" aria-hidden="true">
          ◆
        </p>
        <h1>{title}</h1>
        <p>{body}</p>
        {action && (
          <button type="button" className="btn primary" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
