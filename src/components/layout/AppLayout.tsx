import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../app/providers/useAuth";

import {
  getCurrentUserName,
  signOut,
} from "../../features/auth/services/authService";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(location.pathname);

  const canAccessProducts =
    role === "owner" || role === "manager";

  const canAccessCategories =
    role === "owner" || role === "manager";

  const canAccessAuditHistory = role === "owner";

  useEffect(() => {
    let active = true;

    async function loadUserName() {
      if (!user?.id) {
        setUserName("User");
        return;
      }

      // Show the name from auth metadata while loading the profile.
      const metadataName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name;

      if (
        typeof metadataName === "string" &&
        metadataName.trim()
      ) {
        setUserName(metadataName.trim());
      } else {
        setUserName("User");
      }

      try {
        const profileName = await getCurrentUserName(user.id);

        if (active && profileName) {
          setUserName(profileName);
        }
      } catch (error) {
        console.error(
          "Unable to load user name:",
          error,
        );
      }
    }

    void loadUserName();

    return () => {
      active = false;
    };
  }, [user?.id, user?.user_metadata]);

  function closeMobileMenu(restoreFocus = false) {
    setMobileMenuOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        menuButtonRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      mobileMenuRef.current
        ?.querySelector<HTMLAnchorElement>("a")
        ?.focus();
    }
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
      closeMobileMenu();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to sign out:", error);

      setSignOutError(
        "Unable to sign out. Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  const navLinkClass = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    `block min-h-11 rounded-md px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 ${
      isActive
        ? "bg-olive-50 text-teal-900"
        : "text-olive-50 hover:bg-olive-50 hover:text-teal-900"
    }`;

  function handleNavigation() {
    closeMobileMenu();
  }

  const greeting = `Hello${role ? ` ${role}` : ""} ${userName}`;

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
    <div className="min-h-screen bg-olive-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:p-3 focus:text-teal-900 focus:ring-2 focus:ring-teal-700"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-teal-900 bg-teal-900">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-olive-50 hover:bg-olive-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-50 md:hidden"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                if (mobileMenuOpen) {
                  closeMobileMenu(true);
                } else {
                  setMobileMenuOpen(true);
                }
              }}
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
              <h1 className="truncate text-lg font-bold leading-tight text-olive-50 sm:text-xl">
                Michael Kors Inventory
              </h1>

              <p className="truncate text-xs font-medium capitalize text-olive-50">
                {greeting}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="min-h-11 shrink-0 rounded-md px-3 py-2 text-md font-medium text-olive-50 hover:bg-olive-50 hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        {signOutError && (
          <p
            role="alert"
            className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 sm:px-6"
          >
            {signOutError}
          </p>
        )}
      </header>

      <div className="relative flex min-h-[calc(100vh-4rem)]">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-teal-900 bg-teal-900 p-4 md:block">
          {navigation}
        </aside>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-x-0 bottom-0 top-16 z-30 bg-teal-900/30 md:hidden"
              onClick={() => closeMobileMenu(true)}
            />

            <aside
              ref={mobileMenuRef}
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className="absolute inset-y-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-r border-teal-900 bg-teal-900 p-4 shadow-xl md:hidden"
            >
              {navigation}
            </aside>
          </>
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;