import { useNavigate } from 'react-router-dom'
import { ProductForm } from './ProductForm'
import { createProduct } from '../../api/products'
import type { ProductFormValues } from '../../types'

const EMPTY: ProductFormValues = { name: '', description: '', price: '', stockQuantity: '' }

export function ProductCreatePage() {
  const navigate = useNavigate()

  const handleSubmit = async (values: ProductFormValues) => {
    const product = await createProduct(values)
    navigate(`/products/${product.id}`, { state: { flash: `${product.name} added.` } })
  }

  return (
    <ProductForm
      title="Add product"
      initialValues={EMPTY}
      submitLabel="Add product"
      onSubmit={handleSubmit}
      onCancel={() => navigate('/products')}
    />
  )
}
