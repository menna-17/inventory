
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

const AuditHistoryPage = lazy(
  () =>
    import(
      "../../features/audit/components/AuditHistoryPage"
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
  const allRoles: Role[] = [
    "owner",
    "manager",
    "staff",
  ];

  const managementRoles: Role[] = [
    "owner",
    "manager",
  ];

  const ownerRoles: Role[] = ["owner"];

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
          {/* Public Routes */}

          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* Protected Routes */}

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>

              {/* Dashboard: all roles */}

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

              {/* Products and Categories: owner + manager */}

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

                <Route
                  path="/categories"
                  element={<CategoriesPage />}
                />
              </Route>

              {/* Inventory: all roles */}

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

              {/* Sales: all roles */}

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

              {/* Audit History: owner only */}

              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={ownerRoles}
                  />
                }
              >
                <Route
                  path="/audit-history"
                  element={<AuditHistoryPage />}
                />
              </Route>

            </Route>
          </Route>

          {/* Unknown Routes */}

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
