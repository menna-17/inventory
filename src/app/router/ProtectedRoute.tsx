import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/useAuth";

function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-live="polite"
      >
        <p className="text-slate-600">Loading...</p>
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

  return <Outlet />;
}

export default ProtectedRoute;