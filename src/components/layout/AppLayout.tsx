import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../app/providers/useAuth";

import { signOut } from "../../features/auth/services/authService";

function AppLayout() {
  const navigate = useNavigate();

  const { role } = useAuth();

  const canAccessProducts =
    role === "owner" ||
    role === "manager";

  const canAccessCategories =
    role === "owner" ||
    role === "manager";

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Failed to sign out:",
        error,
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Smart Inventory
            </h1>

            {role && (
              <p className="text-xs font-medium capitalize text-slate-500">
                {role} account
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r bg-white p-4">
          <nav aria-label="Main navigation">
            <ul className="space-y-1">
              {/* Dashboard */}
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              </li>

              {/* Products - Owner + Manager */}
              {canAccessProducts && (
                <li>
                  <NavLink
                    to="/products"
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    Products
                  </NavLink>
                </li>
              )}

              {/* Categories - Owner + Manager */}
              {canAccessCategories && (
                <li>
                  <NavLink
                    to="/categories"
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    Categories
                  </NavLink>
                </li>
              )}

              {/* Inventory - All roles */}
              <li>
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  Inventory
                </NavLink>
              </li>

              {/* Sales - All roles */}
              <li>
                <NavLink
                  to="/sales"
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  Sales
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;