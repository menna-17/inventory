
import { useDashboard } from "../hooks/useDashboard";

import DashboardStats from "./DashboardStats";
import LowStockSection from "./LowStockSection";
import RecentSalesSection from "./RecentSalesSection";

function DashboardPage() {
  const {
    stats,
    recentSales,
    lowStockProducts,
    loading,
    error,
    refetch,
  } = useDashboard();

  if (loading) {
    return (
      <section
        className="space-y-6"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Overview of your inventory and sales.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-36 max-w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-16 animate-pulse rounded bg-slate-100" />
        </div>

        <p
          className="text-sm text-slate-500"
          role="status"
        >
          Loading dashboard data...
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-6 sm:space-y-8">
      {/* Dashboard header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Overview of your inventory and sales.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load some dashboard data
            </h2>
            <p className="mt-1 break-words text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 shrink-0 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="min-w-0">
        <DashboardStats stats={stats} />
      </div>

      {/* Dashboard sections */}
      <div className="grid min-w-0 grid-cols-1 gap-6">
        <div className="min-w-0">
          <LowStockSection products={lowStockProducts} />
        </div>

        <div className="min-w-0">
          <RecentSalesSection sales={recentSales} />
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
