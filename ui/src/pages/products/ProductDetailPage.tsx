import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { deleteProduct, getProduct, updateProduct } from '../../api/products'
import type { ProductFormValues, ProductResponse } from '../../types'
import { ProductForm } from './ProductForm'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorState } from '../../components/States'
import { NotFound } from '../NotFound'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../types'

const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function toFormValues(p: ProductResponse): ProductFormValues {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    stockQuantity: String(p.stockQuantity),
  }
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { hasRole } = useAuth()
  const canEdit = hasRole(ROLES.tenantAdmin)
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [loadError, setLoadError] = useState<'not-found' | 'other' | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [flash, setFlash] = useState<string | null>((location.state as { flash?: string } | null)?.flash ?? null)

  const load = () => {
    if (!id) return
    setLoadError(null)
    setProduct(null)
    getProduct(id)
      .then(setProduct)
      .catch((err) => setLoadError(err instanceof ApiError && err.status === 404 ? 'not-found' : 'other'))
  }

  useEffect(load, [id])

  if (loadError === 'not-found') {
    return <NotFound title="Product not found" backTo="/products" backLabel="Back to products" />
  }
  if (loadError === 'other') {
    return <ErrorState body="Couldn't load this product." onRetry={load} />
  }
  if (!product) {
    return <p className="dim">Loading…</p>
  }

  if (editing) {
    return (
      <ProductForm
        title="Edit product"
        initialValues={toFormValues(product)}
        submitLabel="Save changes"
        onCancel={() => setEditing(false)}
        onSubmit={async (values) => {
          await updateProduct(product.id, values)
          setProduct({
            ...product,
            name: values.name,
            description: values.description || null,
            price: Number(values.price),
            stockQuantity: Number(values.stockQuantity),
            updatedAt: new Date().toISOString(),
          })
          setFlash(`${values.name} updated.`)
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="page-stack">
      {flash && <p className="flash">{flash}</p>}

      <div className="page-header">
        <div>
          <h1>{product.name}</h1>
          {product.stockQuantity === 0 && <span className="tag-out-of-stock">Out of stock</span>}
        </div>
        {canEdit && (
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          </div>
        )}
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Description</dt>
          <dd>{product.description || <span className="dim">No description.</span>}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{currency.format(product.price)}</dd>
        </div>
        <div>
          <dt>Stock quantity</dt>
          <dd>{product.stockQuantity}</dd>
        </div>
        <div>
          <dt>Added</dt>
          <dd>{dateTimeFormat.format(new Date(product.createdAt))}</dd>
        </div>
        {product.updatedAt && (
          <div>
            <dt>Last updated</dt>
            <dd>{dateTimeFormat.format(new Date(product.updatedAt))}</dd>
          </div>
        )}
      </dl>

      {!canEdit && (
        <p className="dim small">Only tenant admins can edit or remove products.</p>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete ${product.name}?`}
          body="This can't be undone."
          confirmLabel="Delete"
          busy={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            setDeleting(true)
            try {
              await deleteProduct(product.id)
              navigate('/products', { state: { flash: `${product.name} deleted.` } })
            } finally {
              setDeleting(false)
            }
          }}
        />
      )}
    </div>
  )
}
