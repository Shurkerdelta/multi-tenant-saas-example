import { useState, type FormEvent } from 'react'
import type { ProductFormValues } from '../../types'
import { ApiError } from '../../api/client'

type FieldErrors = Partial<Record<keyof ProductFormValues, string>>

const FIELD_LIMITS = { name: 200, description: 2000 }

function validate(values: ProductFormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.name.trim()) errors.name = 'Name is required.'
  else if (values.name.length > FIELD_LIMITS.name) errors.name = `Keep it under ${FIELD_LIMITS.name} characters.`

  if (values.description.length > FIELD_LIMITS.description) {
    errors.description = `Keep it under ${FIELD_LIMITS.description} characters.`
  }

  const price = Number(values.price)
  if (values.price.trim() === '' || Number.isNaN(price) || price < 0) {
    errors.price = 'Enter a price of 0 or more.'
  }

  const stock = Number(values.stockQuantity)
  if (values.stockQuantity.trim() === '' || !Number.isInteger(stock) || stock < 0) {
    errors.stockQuantity = 'Enter a whole number of 0 or more.'
  }

  return errors
}

const FORM_FIELDS: (keyof ProductFormValues)[] = ['name', 'description', 'price', 'stockQuantity']

// Maps ASP.NET's ModelState field names (PascalCase) onto our form's keys, so a
// server-side validation error the client missed still lands on the right field.
function serverFieldErrors(err: ApiError): FieldErrors {
  const errors: FieldErrors = {}
  const modelErrors = err.body?.errors
  if (!modelErrors) return errors
  for (const [field, messages] of Object.entries(modelErrors)) {
    const key = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof ProductFormValues
    if (FORM_FIELDS.includes(key)) {
      errors[key] = messages[0]
    }
  }
  return errors
}

interface Props {
  title: string
  initialValues: ProductFormValues
  submitLabel: string
  onSubmit: (values: ProductFormValues) => Promise<void>
  onCancel: () => void
}

export function ProductForm({ title, initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const set = (key: keyof ProductFormValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const clientErrors = validate(values)
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setErrors({})
    setFormError(null)
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      if (err instanceof ApiError && err.body?.errors) {
        setErrors(serverFieldErrors(err))
      } else {
        setFormError('Save failed. Check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <h1>{title}</h1>

      <label className="field">
        <span>Name</span>
        <input value={values.name} onChange={set('name')} maxLength={FIELD_LIMITS.name} autoFocus />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          value={values.description}
          onChange={set('description')}
          maxLength={FIELD_LIMITS.description}
          rows={3}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </label>

      <div className="field-row">
        <label className="field">
          <span>Price</span>
          <input type="number" min="0" step="0.01" value={values.price} onChange={set('price')} />
          {errors.price && <span className="field-error">{errors.price}</span>}
        </label>

        <label className="field">
          <span>Stock quantity</span>
          <input type="number" min="0" step="1" value={values.stockQuantity} onChange={set('stockQuantity')} />
          {errors.stockQuantity && <span className="field-error">{errors.stockQuantity}</span>}
        </label>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
