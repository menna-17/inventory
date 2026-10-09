
import type { DashboardStats as DashboardStatsType } from "../types/dashboard";

type DashboardStatsProps = {
  stats: DashboardStatsType;
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      label: "Total Products",
      value: numberFormatter.format(stats.totalProducts),
      description: "Products in your catalog",
      accent: "border-l-blue-500",
    },
    {
      label: "Total Stock",
      value: numberFormatter.format(stats.totalStock),
      description: "Units currently in stock",
      accent: "border-l-violet-500",
    },
    {
      label: "Total Sales",
      value: currencyFormatter.format(stats.totalSales),
      description: "All recorded sales",
      accent: "border-l-emerald-500",
    },
    {
      label: "Sales Today",
      value: currencyFormatter.format(stats.salesToday),
      description: "Sales recorded today",
      accent: "border-l-amber-500",
    },
  ];

  return (
    <section
      aria-label="Inventory and sales statistics"
      className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          className={`min-w-0 rounded-xl border border-slate-200 border-l-4 ${card.accent} bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5`}
        >
          <h2 className="text-sm font-medium text-slate-500">
            {card.label}
          </h2>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {card.value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
            {card.description}
          </p>
        </article>
      ))}
    </section>
  );
}

export default DashboardStats;
