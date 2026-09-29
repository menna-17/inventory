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

const ProductsPage = lazy(
  () => import("../../features/products/components/ProductsPage"),
);

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <LoginForm />
    </main>
  );
}

function DashboardPage() {
  return <h1>Dashboard</h1>;
}

function InventoryPage() {
  return <h1>Inventory</h1>;
}

function SalesPage() {
  return <h1>Sales</h1>;
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
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/sales" element={<SalesPage />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;