
import { useCallback, useEffect, useMemo, useState } from "react";

import CategoryForm from "../components/CategoryForm";

import {
  deleteCategory,
  getCategories,
} from "../services/categoryService";

import { useAuth } from "../../../app/providers/useAuth";

import type { Category } from "../types/category";

import Pagination from "../../../components/ui/Pagination";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function CategoriesPage() {
  const { role } = useAuth();

  const canDeleteCategories = role === "owner";

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page, setPage] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pageParam = Number(searchParams.get("page"));

    return Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("search") ?? "";
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    () => new URLSearchParams(window.location.search).get("search")?.trim() ?? "",
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedSearch = searchTerm.trim();

      setDebouncedSearchTerm((previousSearch) => {
        if (previousSearch !== trimmedSearch) {
          setPage(1);
        }

        return trimmedSearch;
      });

      const url = new URL(window.location.href);

      if (trimmedSearch) {
        url.searchParams.set("search", trimmedSearch);
      } else {
        url.searchParams.delete("search");
      }

      if (trimmedSearch !== debouncedSearchTerm) {
        url.searchParams.delete("page");
      }

      window.history.replaceState({}, "", url);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (page === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", String(page));
    }

    window.history.replaceState({}, "", url);
  }, [page]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase();

    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedSearch),
    );
  }, [categories, debouncedSearchTerm]);

  const totalCount = filteredCategories.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const currentPage = Math.max(
    1,
    Math.min(page, Math.max(1, totalPages)),
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredCategories.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  }

  const loadCategories = useCallback(async () => {
    setError(null);

    try {
      const data = await getCategories();
      setCategories(data);

      setPage((currentPage) =>
        Math.min(
          currentPage,
          Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
        ),
      );
    } catch (error) {
      console.error("loadCategories error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load categories. Please try again.",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialCategories() {
      try {
        const data = await getCategories();

        if (cancelled) return;

        setCategories(data);
        setError(null);

        setPage((currentPage) =>
          Math.min(
            currentPage,
            Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
          ),
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Initial categories load error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load categories.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleAddCategory() {
    setSelectedCategory(null);
    setIsFormOpen(true);
  }

  function handleEditCategory(category: Category) {
    setSelectedCategory(category);
    setIsFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCloseForm() {
    setSelectedCategory(null);
    setIsFormOpen(false);
  }

  async function handleFormSuccess() {
    handleCloseForm();
    setPage(1);
    await loadCategories();
  }

  async function handleDeleteCategory(category: Category) {
    if (!canDeleteCategories || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setError(null);

    try {
      await deleteCategory(category.id);
      setPage(1);
      await loadCategories();
    } catch (error) {
      console.error("deleteCategory error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-mauve-600 sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-mauve-600 sm:text-base">
            Manage your product categories.
          </p>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-olive-100 bg-olive-100 p-5 sm:p-6"
        >
          <div
            className="mt-5 space-y-3"
            aria-hidden="true"
          >
            <div className="h-12 animate-pulse rounded-lg bg-olive-200" />
            <div className="h-12 animate-pulse rounded-lg bg-olive-200" />
            <div className="h-12 animate-pulse rounded-lg bg-olive-200" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-mauve-600 sm:text-3xl">
            Categories
          </h1>

          <p className="mt-1 text-sm text-mauve-600 sm:text-base">
            Manage your product categories.
          </p>

          <p className="mt-2 text-sm text-teal-900">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCategory}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-mauve-600 px-5 py-2.5 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none sm:w-auto"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            +
          </span>
          Add Category
        </button>
      </div>

      {/* Error and retry */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5"
        >
          <p className="font-semibold text-red-800">
            Something went wrong
          </p>

          <p className="mt-2 break-words text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadCategories()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-olive-50 transition hover:bg-red-800 focus:outline-none"
          >
            Try again
          </button>
        </div>
      )}

      {/* Add/edit form */}
      {isFormOpen && (
        <div className="min-w-0 rounded-xl border border-olive-200 bg-olive-200 p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
          
            </div>

        
          </div>

          <CategoryForm
            key={selectedCategory?.id ?? "new-category"}
            category={selectedCategory}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Filter by category name */}
      {categories.length > 0 && (
        <div className="min-w-0">
          <label
            htmlFor="category-name-search"
            className="mb-1.5 block text-sm font-medium text-mauve-600"
          ></label>

          <input
            id="category-name-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search category name..."
            className="min-h-11 w-full rounded-lg border border-mauve-600 bg-olive-100 px-3 py-2.5 text-sm text-mauve-600 outline-none transition placeholder:text-mauve-300 focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200"
          />
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-olive-100 bg-olive-100 px-5 py-10 text-center sm:px-8">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-olive-100 text-mauve-600"
            aria-hidden="true"
          >
            <span className="text-2xl">+</span>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-mauve-600">
            No categories yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-mauve-600">
            Create a category to help organize your products.
          </p>

          {!isFormOpen && (
            <button
              type="button"
              onClick={handleAddCategory}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-mauve-600 px-5 py-2.5 text-sm font-semibold text-olive-50 hover:bg-mauve-700 focus:outline-none"
            >
              Create your first category
            </button>
          )}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-olive-100 bg-olive-100 px-5 py-10 text-center sm:px-8">
          <h2 className="text-lg font-semibold text-mauve-600">
            No matching categories found
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-mauve-600">
            Try another category name.
          </p>

          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-mauve-600 px-5 py-2.5 text-sm font-semibold text-olive-50 hover:bg-mauve-700 focus:outline-none"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* Mobile category cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {paginatedCategories.map((category) => {
              const isDeleting = deletingId === category.id;

              return (
                <article
                  key={category.id}
                  className="min-w-0 rounded-xl border border-olive-100 bg-olive-100 p-4 shadow-sm"
                >
                  <h3 className="break-words font-semibold text-mauve-600">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-xs text-teal-900">
                    Created{" "}
                    {category.created_at
                      ? new Date(category.created_at).toLocaleDateString()
                      : "—"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      disabled={Boolean(deletingId)}
                      className="min-h-10 flex-1 rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-2 text-sm font-semibold text-olive-50 hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    {canDeleteCategories && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(category)}
                        disabled={Boolean(deletingId)}
                        className="min-h-10 flex-1 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-olive-50 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="hidden overflow-hidden rounded-xl border border-olive-100 bg-olive-100 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-olive-200">
                <thead className="bg-olive-200">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Category
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
                    >
                      Created
                    </th>

                    <th
  scope="col"
  className="w-1 whitespace-nowrap px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-teal-900"
>
  Actions
</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-olive-200">
                  {paginatedCategories.map((category) => {
                    const isDeleting = deletingId === category.id;

                    return (
                      <tr
                        key={category.id}
                        className="transition hover:bg-olive-50"
                      >
                        <td className="px-5 py-4">
                          <span className="break-words font-medium text-teal-900">
                            {category.name}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center text-sm text-mauve-600">
                          {category.created_at
                            ? new Date(category.created_at).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                           <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              disabled={Boolean(deletingId)}
                              className="min-h-9 rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-1.5 text-sm font-medium text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>

                            {canDeleteCategories && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteCategory(category)}
                                disabled={Boolean(deletingId)}
                                className="min-h-9 rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-olive-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* Pagination */}
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </section>
  );
}

export default CategoriesPage;
