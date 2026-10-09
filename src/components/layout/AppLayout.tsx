
import { useState } from "react";
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canAccessProducts =
    role === "owner" || role === "manager";

  const canAccessCategories =
    role === "owner" || role === "manager";

  const canAccessAuditHistory = role === "owner";

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block min-h-11 rounded-md px-3 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  function handleNavigation() {
    setMobileMenuOpen(false);
  }

  const navigation = (
    <nav aria-label="Main navigation">
      <ul className="space-y-1">
        <li>
          <NavLink
            to="/dashboard"
            className={navLinkClass}
            onClick={handleNavigation}
          >
            Dashboard
          </NavLink>
        </li>

        {canAccessProducts && (
          <li>
            <NavLink
              to="/products"
              className={navLinkClass}
              onClick={handleNavigation}
            >
              Products
            </NavLink>
          </li>
        )}

        {canAccessCategories && (
          <li>
            <NavLink
              to="/categories"
              className={navLinkClass}
              onClick={handleNavigation}
            >
              Categories
            </NavLink>
          </li>
        )}

        <li>
          <NavLink
            to="/inventory"
            className={navLinkClass}
            onClick={handleNavigation}
          >
            Inventory
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/sales"
            className={navLinkClass}
            onClick={handleNavigation}
          >
            Sales
          </NavLink>
        </li>

        {canAccessAuditHistory && (
          <li>
            <NavLink
              to="/audit-history"
              className={navLinkClass}
              onClick={handleNavigation}
            >
              Audit History
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 md:hidden"
              aria-label={
                mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    d="m6 6 12 12M18 6 6 18"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                Smart Inventory
              </h1>

              {role && (
                <p className="text-xs font-medium capitalize text-slate-500">
                  {role} account
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-4rem)]">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
          {navigation}
        </aside>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 top-16 z-30 bg-slate-900/30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside
              id="mobile-navigation"
              className="absolute inset-y-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl md:hidden"
            >
              {navigation}
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
