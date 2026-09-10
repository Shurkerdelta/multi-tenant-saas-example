interface Props {
  title: string
  body: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// A destructive action gets a dialog naming exactly what it will do, not a generic
// "Are you sure?" — DELETE /api/products/{id} is a hard delete with no undo.
export function ConfirmDialog({ title, body, confirmLabel, busy, onConfirm, onCancel }: Props) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{body}</p>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
