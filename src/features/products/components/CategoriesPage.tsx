import { useEffect, useState } from "react";

import CategoryForm from "./CategoryForm";

import {
  deleteCategory,
  getCategories,
} from "../services/categoryService";

import { useAuth } from "../../../app/providers/useAuth";

import type { Category } from "../types/product";

function CategoriesPage() {
  const { role } = useAuth();

  const canDeleteCategories =
    role === "owner";

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCategories() {
      try {
        const data =
          await getCategories();

        if (!isMounted) {
          return;
        }

        setCategories(data);
        setError(null);
      } catch (error) {
        console.error(
          "loadInitialCategories error:",
          error,
        );

        if (!isMounted) {
          return;
        }

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Failed to load categories.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadCategories() {
    setError(null);

    try {
      const data =
        await getCategories();

      setCategories(data);
    } catch (error) {
      console.error(
        "loadCategories error:",
        error,
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to load categories.",
        );
      }
    }
  }

  function handleAddCategory() {
    setSelectedCategory(null);
    setIsFormOpen(true);
  }

  function handleEditCategory(
    category: Category,
  ) {
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

  async function handleDeleteCategory(
    category: Category,
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setError(null);

    try {
      await deleteCategory(category.id);
      await loadCategories();
    } catch (error) {
      console.error(
        "deleteCategory error:",
        error,
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to delete category.",
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Categories
        </h1>

        <p
          className="mt-4 text-slate-600"
          aria-live="polite"
        >
          Loading categories...
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Categories
          </h1>

          <p className="mt-1 text-slate-600">
            Manage your product categories.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCategory}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Category
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p className="font-medium">
            Something went wrong.
          </p>

          <p className="mt-1 text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadCategories()
            }
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Category Form */}
      {isFormOpen && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedCategory
                ? "Edit Category"
                : "Add Category"}
            </h2>

            <button
              type="button"
              onClick={handleCloseForm}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <CategoryForm
            key={
              selectedCategory?.id ??
              "new-category"
            }
            category={selectedCategory}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Categories Table */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-slate-600">
            No categories found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Category
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Created
                </th>

                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {categories.map((category) => {
                const isDeleting =
                  deletingId ===
                  category.id;

                return (
                  <tr
                    key={category.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {category.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {category.created_at
                        ? new Date(
                            category.created_at,
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() =>
                            handleEditCategory(
                              category,
                            )
                          }
                          disabled={isDeleting}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        {/* Delete - Owner only */}
                        {canDeleteCategories && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteCategory(
                                category,
                              )
                            }
                            disabled={isDeleting}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
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
      )}
    </section>
  );
}

export default CategoriesPage;