import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTenant, slugify } from '../../api/tenants'
import { ApiError } from '../../api/client'

const SLUG_PATTERN = /^[a-z0-9-]+$/
const LIMITS = { name: 200, slug: 100 }

export function TenantCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const validate = () => {
    const next: { name?: string; slug?: string } = {}
    if (!name.trim()) next.name = 'Name is required.'
    else if (name.length > LIMITS.name) next.name = `Keep it under ${LIMITS.name} characters.`

    if (!slug.trim()) next.slug = 'Slug is required.'
    else if (slug.length > LIMITS.slug) next.slug = `Keep it under ${LIMITS.slug} characters.`
    else if (!SLUG_PATTERN.test(slug)) next.slug = 'Lowercase letters, numbers, and hyphens only.'

    return next
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const tenant = await createTenant({ name: name.trim(), slug: slug.trim() })
      navigate('/tenants', {
        state: { flash: `${tenant.name} created. Set up its users in Keycloak to give anyone access.` },
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ slug: 'This slug is already in use.' })
      } else {
        setErrors({ name: 'Something went wrong — check your connection and try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <h1>Add tenant</h1>
      <p className="page-sub">This creates the tenant's database row. It won't create any Keycloak users.</p>

      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => handleNameChange(e.target.value)} maxLength={LIMITS.name} autoFocus />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

      <label className="field">
        <span>Slug</span>
        <input
          className="mono"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          maxLength={LIMITS.slug}
        />
        <span className="field-hint">Lowercase letters, numbers, and hyphens — must be unique platform-wide.</span>
        {errors.slug && <span className="field-error">{errors.slug}</span>}
      </label>

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => navigate('/tenants')} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Add tenant'}
        </button>
      </div>
    </form>
  )
}
