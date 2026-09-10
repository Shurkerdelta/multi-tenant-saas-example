import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listProducts } from '../../api/products'
import type { ProductResponse } from '../../types'
import { EmptyState, ErrorState, SkeletonRows } from '../../components/States'
import { useAuth } from '../../auth/AuthContext'

const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function ProductsList() {
  const { me } = useAuth()
  const location = useLocation()
  const [products, setProducts] = useState<ProductResponse[] | null>(null)
  const [error, setError] = useState(false)
  const [flash] = useState<string | null>((location.state as { flash?: string } | null)?.flash ?? null)

  const load = () => {
    setError(false)
    setProducts(null)
    listProducts()
      .then(setProducts)
      .catch(() => setError(true))
  }

  useEffect(load, [])

  return (
    <div className="page-stack">
      {flash && <p className="flash">{flash}</p>}
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-sub">{me.tenantSlug ? `Catalog for ${me.tenantSlug}` : 'Your catalog'}</p>
        </div>
        <Link to="/products/new" className="btn primary">
          Add product
        </Link>
      </div>

      {error ? (
        <ErrorState body="Couldn't load products." onRetry={load} />
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Updated</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {products === null && <SkeletonRows columns={5} />}
              {products?.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="num">{currency.format(p.price)}</td>
                  <td className="num">
                    {p.stockQuantity}
                    {p.stockQuantity === 0 && <span className="tag-out-of-stock">Out of stock</span>}
                  </td>
                  <td className="dim">{dateFormat.format(new Date(p.updatedAt ?? p.createdAt))}</td>
                  <td className="row-actions">
                    <Link to={`/products/${p.id}`} className="btn small">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products?.length === 0 && (
            <EmptyState
              title="No products yet"
              body="Products your tenant adds will show up here."
              action={
                <Link to="/products/new" className="btn primary">
                  Add product
                </Link>
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
