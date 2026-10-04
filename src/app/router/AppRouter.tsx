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

/*
 * -------------------------------------------------------
 * Lazy-loaded pages
 * -------------------------------------------------------
 */

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

/*
 * -------------------------------------------------------
 * Login page
 * -------------------------------------------------------
 */

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <LoginForm />
    </main>
  );
}

/*
 * -------------------------------------------------------
 * App Router
 * -------------------------------------------------------
 */

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-slate-50">
            <p className="text-sm text-slate-600">
              Loading page...
            </p>
          </main>
        }
      >
        <Routes>
          {/* =================================================
              Public Routes
              ================================================= */}

          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* =================================================
              Protected Routes
              ================================================= */}

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              {/* Products */}
              <Route
                path="/products"
                element={<ProductsPage />}
              />

              {/* Categories */}
              <Route
                path="/categories"
                element={<CategoriesPage />}
              />

              {/* Inventory */}
              <Route
                path="/inventory"
                element={<InventoryPage />}
              />

              {/* Sales */}
              <Route
                path="/sales"
                element={<SalesPage />}
              />

            </Route>
          </Route>

          {/* =================================================
              Unknown Routes
              ================================================= */}

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