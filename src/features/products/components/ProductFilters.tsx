
import {
  getStatus,
  type FilterStatus,
  type FilterableItem,
} from "./productFilters.utils";

type ProductFiltersProps<T extends FilterableItem> = {
  products: T[];
  categories: { id: string; name: string }[];
  searchTerm: string;
  statusFilter: FilterStatus;
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: FilterStatus) => void;
  onCategoryChange: (value: string) => void;
  filteredCount: number;
  onClearFilters: () => void;
};

export default function ProductFilters<T extends FilterableItem>({
  products,
  categories,
  searchTerm,
  statusFilter,
  categoryFilter,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  filteredCount,
  onClearFilters,
}: ProductFiltersProps<T>) {
  const counts = products.reduce(
    (result, item) => {
      const status = getStatus(item);

      if (status !== "all") {
        result[status] += 1;
      }

      return result;
    },
    { in_stock: 0, low_stock: 0, out_of_stock: 0 },
  );

  const filters: {
    value: FilterStatus;
    label: string;
    count: number;
    activeClass: string;
  }[] = [
    {
      value: "all",
      label: "All",
      count: products.length,
      activeClass: "bg-slate-900 text-white",
    },
    {
      value: "in_stock",
      label: "In Stock",
      count: counts.in_stock,
      activeClass: "bg-emerald-700 text-white",
    },
    {
      value: "low_stock",
      label: "Low Stock",
      count: counts.low_stock,
      activeClass: "bg-amber-500 text-white",
    },
    {
      value: "out_of_stock",
      label: "Out of Stock",
      count: counts.out_of_stock,
      activeClass: "bg-red-600 text-white",
    },
  ];

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  return (
    <div className="w-full space-y-5">
      <div className="grid w-full grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
        <div className="min-w-0">
          <label
            htmlFor="product-search"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Search products
          </label>

          <input
            id="product-search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Name or description..."
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="category-filter"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Category
          </label>

          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Filter by stock status
        </p>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(filter.value)}
                className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                  active
                    ? filter.activeClass
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500" aria-live="polite">
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {filteredCount}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800">
            {products.length}
          </span>{" "}
          products
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
