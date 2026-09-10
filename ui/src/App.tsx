import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { AppShell } from './components/AppShell'
import { RoleRoute } from './components/RoleRoute'
import { ROLES } from './types'
import { SignIn } from './pages/SignIn'
import { AuthCallback } from './pages/AuthCallback'
import { Landing } from './pages/Landing'
import { Account } from './pages/Account'
import { NotFound } from './pages/NotFound'
import { ProductsList } from './pages/products/ProductsList'
import { ProductCreatePage } from './pages/products/ProductCreatePage'
import { ProductDetailPage } from './pages/products/ProductDetailPage'
import { MyTenant } from './pages/tenant/MyTenant'
import { TenantsList } from './pages/tenants/TenantsList'
import { TenantCreatePage } from './pages/tenants/TenantCreatePage'

const TENANT_STAFF = [ROLES.tenantMember, ROLES.tenantAdmin]

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<Landing />} />

            <Route
              path="/products"
              element={
                <RoleRoute allow={TENANT_STAFF}>
                  <ProductsList />
                </RoleRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <RoleRoute allow={TENANT_STAFF}>
                  <ProductCreatePage />
                </RoleRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <RoleRoute allow={TENANT_STAFF}>
                  <ProductDetailPage />
                </RoleRoute>
              }
            />

            <Route
              path="/tenant"
              element={
                <RoleRoute allow={TENANT_STAFF}>
                  <MyTenant />
                </RoleRoute>
              }
            />

            <Route
              path="/tenants"
              element={
                <RoleRoute allow={[ROLES.platformAdmin]}>
                  <TenantsList />
                </RoleRoute>
              }
            />
            <Route
              path="/tenants/new"
              element={
                <RoleRoute allow={[ROLES.platformAdmin]}>
                  <TenantCreatePage />
                </RoleRoute>
              }
            />

            <Route path="/account" element={<Account />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
