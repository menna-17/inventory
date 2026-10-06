import DashboardStats from "./DashboardStats";
import LowStockSection from "./LowStockSection";
import RecentSalesSection from "./RecentSalesSection";

import { useDashboard } from "../hooks/useDashboard";

function DashboardPage() {
  const {
    stats,
    recentSales,
    lowStockProducts,
    loading,
    error,
  } = useDashboard();

  if (loading) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Loading dashboard...
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Overview of your inventory and sales.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <DashboardStats
        stats={stats}
      />

      {/* Low Stock */}
      <LowStockSection
        products={lowStockProducts}
      />

      {/* Recent Sales */}
      <RecentSalesSection
        sales={recentSales}
      />
    </section>
  );
}

export default DashboardPage;