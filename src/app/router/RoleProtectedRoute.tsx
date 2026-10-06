import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../providers/useAuth";
import type { Role } from "../providers/auth-context";

type RoleProtectedRouteProps = {
  allowedRoles: Role[];
};

function RoleProtectedRoute({
  allowedRoles,
}: RoleProtectedRouteProps) {
  const {
    session,
    role,
    isLoading,
    error,
  } = useAuth();

  const location = useLocation();

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-live="polite"
      >
        <p className="text-sm text-slate-600">
          Loading account permissions...
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (error) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6"
        aria-live="polite"
      >
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Unable to load your account
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6"
        aria-live="polite"
      >
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Access denied
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            You do not have permission to access
            this page.
          </p>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}

export default RoleProtectedRoute;