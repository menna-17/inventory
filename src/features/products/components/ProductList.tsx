
import { useMemo, useState } from "react";

import type { Product } from "../types/product";

type ProductListProps = {
  products: Product[];
  categories: {
    id: string;
    name: string;
  }[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void | Promise<void>;
  canDelete: boolean;
};

type StockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

type FilterStatus = "all" | StockStatus;

function getStockStatus(product: Product): {
  key: StockStatus;
  label: string;
  className: string;
} {
  if (product.stock_quantity <= 0) {
    return {
      key: "out_of_stock",
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (product.stock_quantity <= product.minimum_stock) {
    return {
      key: "low_stock",
      label: "Low Stock",
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    key: "in_stock",
    label: "In Stock",
    className: "bg-emerald-100 text-emerald-800",
  };
}

function ProductList({
  products,
  categories,
  onEdit,
  onDelete,
  canDelete,
}: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categoryNames = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [categories],
  );

  function getCategoryName(categoryId: string) {
    return categoryNames.get(categoryId) ?? "Uncategorized";
  }

  const statusCounts = useMemo(() => {
    return products.reduce(
      (counts, product) => {
        counts[getStockStatus(product).key] += 1;
        return counts;
      },
      {
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
      },
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        getStockStatus(product).key === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        product.category_id === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  async function handleDelete(product: Product) {
    if (!canDelete || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setDeleteError(null);

    try {
      await onDelete(product.id);
    } catch (error) {
      console.error("deleteProduct error:", error);

      if (error instanceof Error) {
        setDeleteError(error.message);
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Failed to delete product. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  const statusFilters: {
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
      count: statusCounts.in_stock,
      activeClass: "bg-emerald-700 text-white",
    },
    {
      value: "low_stock",
      label: "Low Stock",
      count: statusCounts.low_stock,
      activeClass: "bg-amber-500 text-white",
    },
    {
      value: "out_of_stock",
      label: "Out of Stock",
      count: statusCounts.out_of_stock,
      activeClass: "bg-red-600 text-white",
    },
  ];

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No products available
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Products will appear here when they have been added.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Delete error */}
      {deleteError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-semibold text-red-800">
              Failed to delete product
            </p>
            <p className="mt-1 break-words text-sm text-red-700">
              {deleteError}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="min-h-10 shrink-0 self-start rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and category filters */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
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
            onChange={(event) => setSearchTerm(event.target.value)}
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
            onChange={(event) => setCategoryFilter(event.target.value)}
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

      {/* Stock status filters */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          Filter by stock status
        </p>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(filter.value)}
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

      {/* Results summary */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className="text-sm text-slate-500"
          aria-live="polite"
        >
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {filteredProducts.length}
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
            onClick={clearFilters}
            className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* No matching results */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No matching products
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try changing your search or filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 min-h-11 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <>
          {/* Mobile product cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const isDeleting = deletingId === product.id;

              return (
                <article
                  key={product.id}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-slate-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 break-words text-sm text-slate-500">
                        {getCategoryName(product.category_id)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </div>

                  {product.description && (
                    <p className="mt-3 break-words text-sm leading-5 text-slate-600">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        Price
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                        {Number(product.price).toFixed(2)} EGP
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        Current stock
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {product.stock_quantity}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        Minimum stock
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {product.minimum_stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      disabled={Boolean(deletingId)}
                      className="min-h-10 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(product)}
                        disabled={Boolean(deletingId)}
                        className="min-h-10 flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Stock
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Minimum
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const isDeleting = deletingId === product.id;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="max-w-sm px-5 py-4">
                          <p className="break-words font-medium text-slate-900">
                            {product.name}
                          </p>

                          {product.description && (
                            <p className="mt-1 break-words text-sm text-slate-500">
                              {product.description}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {getCategoryName(product.category_id)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-slate-900">
                          {Number(product.price).toFixed(2)} EGP
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-slate-900">
                          {product.stock_quantity}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                          >
                            {stockStatus.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-slate-600">
                          {product.minimum_stock}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(product)}
                              disabled={Boolean(deletingId)}
                              className="min-h-9 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(product)}
                                disabled={Boolean(deletingId)}
                                className="min-h-9 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductList;
