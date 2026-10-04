import type { DashboardStats as DashboardStatsType } from "../types/dashboard";

type DashboardStatsProps = {
  stats: DashboardStatsType;
};

function DashboardStats({
  stats,
}: DashboardStatsProps) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Products */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Total Products
        </p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {stats.totalProducts}
        </p>
      </div>

      {/* Total Stock */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Total Stock
        </p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {stats.totalStock}
        </p>
      </div>

      {/* Total Sales */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Total Sales
        </p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          $
          {stats.totalSales.toFixed(
            2,
          )}
        </p>
      </div>

      {/* Sales Today */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Sales Today
        </p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          $
          {stats.salesToday.toFixed(
            2,
          )}
        </p>
      </div>
    </div>
  );
}

export default DashboardStats;