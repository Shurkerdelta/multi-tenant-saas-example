import { apiFetch } from './client'
import type { ProductFormValues, ProductResponse } from '../types'

function toRequestBody(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() ? values.description.trim() : null,
    price: Number(values.price),
    stockQuantity: Number(values.stockQuantity),
  }
}

export function listProducts() {
  return apiFetch<ProductResponse[]>('/products')
}

export function getProduct(id: string) {
  return apiFetch<ProductResponse>(`/products/${id}`)
}

export function createProduct(values: ProductFormValues) {
  return apiFetch<ProductResponse>('/products', {
    method: 'POST',
    body: JSON.stringify(toRequestBody(values)),
  })
}

export function updateProduct(id: string, values: ProductFormValues) {
  return apiFetch<void>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toRequestBody(values)),
  })
}

export function deleteProduct(id: string) {
  return apiFetch<void>(`/products/${id}`, { method: 'DELETE' })
}
