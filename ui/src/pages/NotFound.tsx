import { Link } from 'react-router-dom'

interface Props {
  title?: string
  body?: string
  backTo?: string
  backLabel?: string
}

// Covers both a genuinely missing id and a cross-tenant one (spec §05) — the API
// can't tell those apart on purpose, so this copy doesn't try to either.
export function NotFound({
  title = 'Not found',
  body = "This doesn't exist, or isn't visible from here.",
  backTo = '/',
  backLabel = 'Back',
}: Props) {
  return (
    <div className="state-block">
      <p className="state-title">{title}</p>
      <p className="state-body">{body}</p>
      <Link className="btn" to={backTo}>
        {backLabel}
      </Link>
    </div>
  )
}
