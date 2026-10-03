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
};

type StockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

type FilterStatus = "all" | StockStatus;

function ProductList({
  products,
  categories,
  onEdit,
  onDelete,
}: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const [deleteError, setDeleteError] = useState<string | null>(
    null,
  );

  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("all");

  const [categoryFilter, setCategoryFilter] =
    useState<string>("all");

  const [searchTerm, setSearchTerm] = useState("");

  function getCategoryName(categoryId: string) {
    return (
      categories.find(
        (category) => category.id === categoryId,
      )?.name ?? "Uncategorized"
    );
  }

  function getStockStatus(
    product: Product,
  ): {
    key: StockStatus;
    label: string;
    className: string;
  } {
    if (product.stock_quantity === 0) {
      return {
        key: "out_of_stock",
        label: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (
      product.stock_quantity <=
      product.minimum_stock
    ) {
      return {
        key: "low_stock",
        label: "Low Stock",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      key: "in_stock",
      label: "In Stock",
      className: "bg-green-100 text-green-700",
    };
  }

  const statusCounts = useMemo(() => {
    return products.reduce(
      (counts, product) => {
        const status = getStockStatus(product).key;

        counts[status] += 1;

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
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (product.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        getStockStatus(product).key ===
          statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        product.category_id === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    products,
    searchTerm,
    statusFilter,
    categoryFilter,
  ]);

  async function handleDelete(product: Product) {
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
      console.error(
        "deleteProduct error:",
        error,
      );

      if (
        error &&
        typeof error === "object"
      ) {
        const supabaseError = error as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };

        setDeleteError(
          [
            supabaseError.message,
            supabaseError.details,
            supabaseError.hint,
            supabaseError.code
              ? `Code: ${supabaseError.code}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" — ") ||
            "Failed to delete product.",
        );
      } else {
        setDeleteError(
          "Failed to delete product.",
        );
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

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div>
      {deleteError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-medium">
            Failed to delete product.
          </p>

          <p className="mt-1">
            {deleteError}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <label
          htmlFor="product-search"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Search products
        </label>

        <div className="flex gap-2">
          <input
            id="product-search"
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="Search by product name or description..."
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <label
          htmlFor="category-filter"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Category
        </label>

        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:w-64"
        >
          <option value="all">
            All Categories
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setStatusFilter("all")
          }
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            statusFilter === "all"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          All ({products.length})
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter("in_stock")
          }
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            statusFilter === "in_stock"
              ? "bg-green-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          In Stock ({statusCounts.in_stock})
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter("low_stock")
          }
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            statusFilter === "low_stock"
              ? "bg-yellow-500 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          Low Stock ({statusCounts.low_stock})
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter("out_of_stock")
          }
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            statusFilter === "out_of_stock"
              ? "bg-red-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          Out of Stock (
          {statusCounts.out_of_stock})
        </button>
      </div>

      {/* Results count */}
      <div className="mb-3 text-sm text-slate-500">
        Showing{" "}
        <span className="font-medium text-slate-700">
          {filteredProducts.length}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-700">
          {products.length}
        </span>{" "}
        products
      </div>

      {/* Empty search/filter result */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-slate-600">
            No products match your search or
            filters.
          </p>

          {(searchTerm ||
            statusFilter !== "all" ||
            categoryFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Product
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Category
                </th>

                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Price
                </th>

                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Stock
                </th>

                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                  Status
                </th>

                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Minimum
                </th>

                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map(
                (product) => {
                  const isDeleting =
                    deletingId === product.id;

                  const stockStatus =
                    getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50"
                    >
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {product.name}
                        </div>

                        {product.description && (
                          <div className="mt-1 max-w-md text-sm text-slate-500">
                            {
                              product.description
                            }
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getCategoryName(
                          product.category_id,
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                        {Number(
                          product.price,
                        ).toFixed(2)}{" "}
                        EGP
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 text-right text-sm text-slate-900">
                        {
                          product.stock_quantity
                        }
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                        >
                          {
                            stockStatus.label
                          }
                        </span>
                      </td>

                      {/* Minimum Stock */}
                      <td className="px-6 py-4 text-right text-sm text-slate-600">
                        {
                          product.minimum_stock
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                product,
                              )
                            }
                            disabled={
                              isDeleting
                            }
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                product,
                              )
                            }
                            disabled={
                              isDeleting
                            }
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductList;