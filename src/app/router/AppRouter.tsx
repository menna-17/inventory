import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginForm from "../../features/auth/components/LoginForm";

const DashboardPage = lazy(
  () =>
    import(
      "../../features/dashboard/components/DashboardPage"
    ),
);

const ProductsPage = lazy(
  () =>
    import(
      "../../features/products/components/ProductsPage"
    ),
);

const CategoriesPage = lazy(
  () =>
    import(
      "../../features/products/components/CategoriesPage"
    ),
);

const InventoryPage = lazy(
  () =>
    import(
      "../../features/inventory/components/InventoryPage"
    ),
);

const SalesPage = lazy(
  () =>
    import(
      "../../features/sales/components/SalesPage"
    ),
);

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <LoginForm />
    </main>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center">
            <p>Loading page...</p>
          </main>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              <Route
                path="/products"
                element={<ProductsPage />}
              />

              <Route
                path="/categories"
                element={<CategoriesPage />}
              />

              <Route
                path="/inventory"
                element={<InventoryPage />}
              />

              <Route
                path="/sales"
                element={<SalesPage />}
              />
            </Route>
          </Route>

          {/* Unknown route */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;