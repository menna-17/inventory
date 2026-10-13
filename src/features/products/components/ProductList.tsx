import { useMemo, useRef, useState } from "react";

import type { Product } from "../types/product";

import ProductFilters from "./ProductFilters";

import {
  filterProducts,
  type FilterStatus,
} from "./productFilters.utils";

import Pagination from "../../../components/ui/Pagination";

const PAGE_SIZE = 10;

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

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

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

function ProductImage({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = src?.trim();

  if (!imageUrl || imageFailed) {
    return (
      <div
        role="img"
        aria-label={`No image available for ${name}`}
        className={`flex shrink-0 items-center justify-center bg-olive-200 text-olive-200 ${className}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m21 15-5-5L5 20" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className={`shrink-0 object-cover ${className}`}
    />
  );
}

function ProductList({
  products,
  categories,
  onEdit,
  onDelete,
  canDelete,
}: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const productListRef = useRef<HTMLDivElement>(null);

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  function getCategoryName(categoryId: string) {
    return categoryNames.get(categoryId) ?? "Uncategorized";
  }

  const filteredProducts = useMemo(
    () =>
      filterProducts(
        products,
        searchTerm,
        statusFilter,
        categoryFilter,
      ),
    [products, searchTerm, statusFilter, categoryFilter],
  );

  const totalCount = filteredProducts.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const paginatedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filteredProducts, currentPage],
  );

  function handlePageChange(nextPage: number) {
    setPage(nextPage);

    requestAnimationFrame(() => {
      productListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleEdit(product: Product) {
    onEdit(product);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

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
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  function handleStatusChange(value: FilterStatus) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  if (products.length === 0) {
    return (
      <div className="w-full rounded-xl border border-dashed border-olive-100 bg-olive-100 px-5 py-10 text-center">
        <h2 className="text-lg font-semibold text-mauve-600">
          No products available
        </h2>
        <p className="mt-2 text-sm text-mauve-600">
          Products will appear here when they have been added.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={productListRef}
      className="w-full min-w-0 space-y-5 scroll-mt-4"
    >
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

      <ProductFilters
        products={products}
        categories={categories}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onCategoryChange={handleCategoryChange}
        filteredCount={filteredProducts.length}
        onClearFilters={clearFilters}
      />

      {filteredProducts.length === 0 ? (
        <div className="w-full rounded-xl border border-dashed border-olive-100 bg-olive-100 px-5 py-10 text-center">
          <h2 className="text-lg font-semibold text-mauve-600">
            No matching products
          </h2>
          <p className="mt-2 text-sm text-mauve-600">
            Try changing your search or filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 min-h-11 rounded-lg bg-mauve-600 px-4 py-2.5 text-sm font-semibold text-olive-50 hover:bg-mauve-700"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <>
          {/* Mobile product cards */}
          <div className="grid w-full grid-cols-1 gap-3 md:hidden">
            {paginatedProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const isDeleting = deletingId === product.id;

              return (
                <article
                  key={product.id}
                  className="min-w-0 rounded-xl border border-olive-100 bg-olive-100 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <ProductImage
                      src={product.image_url}
                      name={product.name}
                      className="h-24 w-20 rounded-lg border border-olive-100"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="break-words font-semibold text-mauve-600">
                          {product.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </div>

                      <p className="mt-1 break-words text-sm text-teal-900">
                        {getCategoryName(product.category_id)}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-mauve-600">
                        {Number(product.price).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })} EGP
                      </p>
                    </div>
                  </div>

                  {product.description?.trim() && (
                    <p className="mt-3 break-words text-sm leading-5 text-mauve-600">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-olive-200 p-3">
                    <div>
                      <p className="text-xs text-teal-900">Current stock</p>
                      <p className="mt-1 text-sm font-semibold text-mauve-600">
                        {product.stock_quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-900">Minimum stock</p>
                      <p className="mt-1 text-sm text-mauve-600">
                        {product.minimum_stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      disabled={Boolean(deletingId)}
                      className="min-h-10 flex-1 rounded-lg border border-mauve-600 px-4 py-2 bg-mauve-600 text-sm font-semibold text-olive-50 hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(product)}
                        disabled={Boolean(deletingId)}
                        className="min-h-10 flex-1 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-olive-50 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="hidden w-full min-w-0 rounded-xl border border-olive-100 bg-olive-100 md:block">
            <div className="w-full overflow-x-auto rounded-xl">
              <table className="w-full min-w-[1000px] table-fixed divide-y divide-olive-200">
                <thead className="bg-olive-200">
                  <tr>
                    <th
                      scope="col"
                      className="w-28 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Image
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="w-40 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="w-36 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="w-24 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Stock
                    </th>
                    <th
                      scope="col"
                      className="w-36 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="w-28 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Minimum
                    </th>
                    <th
                      scope="col"
                      className="w-44 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-olive-200">
                  {paginatedProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const isDeleting = deletingId === product.id;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-olive-50"
                      >
                        <td className="px-5 py-4 text-center">
                          <ProductImage
                            src={product.image_url}
                            name={product.name}
                            className="mx-auto h-16 w-14 rounded-md border border-olive-100"
                          />
                        </td>

                        <td className="min-w-0 px-5 py-4 text-center">
                          <p className="break-words font-medium text-mauve-600">
                            {product.name}
                          </p>
                          {product.description?.trim() && (
                            <p className="mt-1 break-words text-sm text-mauve-600">
                              {product.description}
                            </p>
                          )}
                        </td>

                        <td className="break-words px-5 py-4 text-center text-sm text-teal-900">
                          {getCategoryName(product.category_id)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-mauve-600">
                          {Number(product.price).toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })} EGP
                        </td>

                        <td className="px-5 py-4 text-center text-sm text-teal-900">
                          {product.stock_quantity}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                          >
                            {stockStatus.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center text-sm text-mauve-600">
                          {product.minimum_stock}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              disabled={Boolean(deletingId)}
                              className="min-h-9 rounded-lg border bg-mauve-600 border-mauve-600 px-3 py-1.5 text-sm font-medium text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(product)}
                                disabled={Boolean(deletingId)}
                                className="min-h-9 rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-olive-50 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
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

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

export default ProductList;
