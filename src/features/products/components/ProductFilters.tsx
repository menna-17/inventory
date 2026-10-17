
import { useEffect, useState } from "react";

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
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    if (localSearchTerm === searchTerm) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [localSearchTerm, searchTerm, onSearchChange]);

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
      activeClass: "bg-mauve-600 text-olive-50",
    },
    {
      value: "in_stock",
      label: "In Stock",
      count: counts.in_stock,
      activeClass: "bg-teal-900 text-olive-50",
    },
    {
      value: "low_stock",
      label: "Low Stock",
      count: counts.low_stock,
      activeClass: "bg-yellow-400 text-olive-50",
    },
    {
      value: "out_of_stock",
      label: "Out of Stock",
      count: counts.out_of_stock,
      activeClass: "bg-red-700 text-olive-50",
    },
  ];

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    localSearchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  function handleClearFilters() {
    setLocalSearchTerm("");
    onClearFilters();
  }

  return (
    <div className="w-full space-y-5">
      <div className="grid w-full grid-cols-1 gap-4 rounded-xl border border-olive-100 bg-olive-100 p-4 sm:grid-cols-2 sm:p-5">
        <div className="min-w-0">
          <label
            htmlFor="product-search"
            className="mb-1.5 block text-sm font-medium text-mauve-600"
          >
            Search products
          </label>

          <input
            id="product-search"
            type="search"
            value={localSearchTerm}
            onChange={(event) => setLocalSearchTerm(event.target.value)}
            placeholder="Name or description..."
            className="min-h-11 w-full rounded-lg border border-mauve-600 bg-olive-200 px-3 py-2.5 text-sm outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200 placeholder:text-mauve-400"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="category-filter"
            className="mb-1.5 block text-sm font-medium text-mauve-600"
          >
            Category
          </label>

          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-mauve-600 bg-olive-200 px-3 py-2.5 text-sm text-mauve-500 outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200"
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
        <p className="mb-2 text-sm font-medium text-mauve-600">
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
                className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none  ${
                  active
                    ? filter.activeClass
                    : "border border-olive-200 bg-olive-200 text-mauve-600 hover:bg-olive-300"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-mauve-600" aria-live="polite">
          Showing{" "}
           <span className="font-semibold text-mauve-600">
            {filteredCount}
          </span>{" "}
         
          of{" "}
           <span className="font-semibold text-mauve-600">
            {products.length}
          </span>{" "}
         
          products
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-mauve-600 underline underline-offset-4 hover:text-mauve-700"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
