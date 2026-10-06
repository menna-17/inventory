import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import LoginForm from "../../features/auth/components/LoginForm";

import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

import type { Role } from "../providers/auth-context";

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
  /*
   * Users who can access all operational pages.
   */
  const allRoles: Role[] = [
    "owner",
    "manager",
    "staff",
  ];

  /*
   * Users who can manage Products and Categories.
   *
   * Staff intentionally does not have access.
   */
  const managementRoles: Role[] = [
    "owner",
    "manager",
  ];

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

              {/* =================================================
                  Dashboard
                  Owner + Manager + Staff
                  ================================================= */}

              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={allRoles}
                  />
                }
              >
                <Route
                  path="/dashboard"
                  element={<DashboardPage />}
                />
              </Route>

              {/* =================================================
                  Products
                  Owner + Manager
                  Staff has no access
                  ================================================= */}

              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={managementRoles}
                  />
                }
              >
                <Route
                  path="/products"
                  element={<ProductsPage />}
                />

                {/* =================================================
                    Categories
                    Owner + Manager
                    Staff has no access
                    ================================================= */}

                <Route
                  path="/categories"
                  element={<CategoriesPage />}
                />
              </Route>

              {/* =================================================
                  Inventory
                  Owner + Manager + Staff
                  
                  IMPORTANT:
                  Staff can view inventory.
                  Staff will NOT be allowed to adjust stock.
                  That restriction will be implemented in the
                  Inventory UI/action layer next.
                  ================================================= */}

              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={allRoles}
                  />
                }
              >
                <Route
                  path="/inventory"
                  element={<InventoryPage />}
                />
              </Route>

              {/* =================================================
                  Sales
                  Owner + Manager + Staff

                  All roles can access Sales because Staff
                  needs to be able to process sales.
                  ================================================= */}

              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={allRoles}
                  />
                }
              >
                <Route
                  path="/sales"
                  element={<SalesPage />}
                />
              </Route>

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