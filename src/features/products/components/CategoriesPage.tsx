
import { useCallback, useEffect, useState } from "react";

import CategoryForm from "./CategoryForm";

import {
  deleteCategory,
  getCategories,
} from "../services/categoryService";

import { useAuth } from "../../../app/providers/useAuth";

import type { Category } from "../types/product";

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

  const loadCategories = useCallback(async () => {
    setError(null);

    try {
      const data = await getCategories();
      setCategories(data);
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
  }

  function handleCloseForm() {
    setSelectedCategory(null);
    setIsFormOpen(false);
  }

  async function handleFormSuccess() {
    handleCloseForm();
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
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Manage your product categories.
          </p>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-600">
              Loading categories...
            </p>
          </div>

          <div
            className="mt-5 space-y-3"
            aria-hidden="true"
          >
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
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
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Categories
          </h1>

          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Manage your product categories.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCategory}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 sm:w-auto"
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
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Add/edit form */}
      {isFormOpen && (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {selectedCategory ? "Edit Category" : "Add Category"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {selectedCategory
                  ? "Update the category details."
                  : "Enter a name for your new category."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
          </div>

          <CategoryForm
            key={selectedCategory?.id ?? "new-category"}
            category={selectedCategory}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:px-8">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-hidden="true"
          >
            <span className="text-2xl">+</span>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No categories yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Create a category to help organize your products.
          </p>

          {!isFormOpen && (
            <button
              type="button"
              onClick={handleAddCategory}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Create your first category
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile category cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {categories.map((category) => {
              const isDeleting = deletingId === category.id;

              return (
                <article
                  key={category.id}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <h3 className="break-words font-semibold text-slate-900">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500">
                    Created{" "}
                    {category.created_at
                      ? new Date(category.created_at).toLocaleDateString()
                      : "—"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      disabled={Boolean(deletingId)}
                      className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    {canDeleteCategories && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(category)}
                        disabled={Boolean(deletingId)}
                        className="min-h-10 flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Category
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Created
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
                  {categories.map((category) => {
                    const isDeleting = deletingId === category.id;

                    return (
                      <tr
                        key={category.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <span className="break-words font-medium text-slate-900">
                            {category.name}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {category.created_at
                            ? new Date(category.created_at).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              disabled={Boolean(deletingId)}
                              className="min-h-9 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>

                            {canDeleteCategories && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteCategory(category)}
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
    </section>
  );
}

export default CategoriesPage;
