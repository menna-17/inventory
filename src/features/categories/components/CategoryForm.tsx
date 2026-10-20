import { useState } from "react";
import type { FormEvent } from "react";

import {
  createCategory,
  updateCategory,
} from "../services/categoryService";

import type { Category } from "../types/category";

type CategoryFormProps = {
  category?: Category | null;
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
};

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error && typeof error === "object") {
    const details = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [
      details.message,
      details.details,
      details.hint,
      details.code ? `Code: ${details.code}` : undefined,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" — ");
    }
  }

  return fallback;
}

function CategoryForm({
  category,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const isEditMode = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Category name is required.";
    }

    if (trimmedName.length < 4) {
      return "Category name must be at least 4 characters.";
    }

    if (trimmedName.length > 30) {
      return "Category name must be 30 characters or less.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const categoryName = name.trim();

      if (category) {
        await updateCategory({
          id: category.id,
          name: categoryName,
        });
      } else {
        await createCategory({
          name: categoryName,
        });
      }

      await onSuccess();
    } catch (error) {
      console.error(
        isEditMode
          ? "updateCategory error:"
          : "createCategory error:",
        error,
      );

      setError(
        getErrorMessage(
          error,
          isEditMode
            ? "Failed to update category. Please try again."
            : "Failed to create category. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="min-w-0"
    >
      <div>
        <label
          htmlFor="category-name"
          className="block text-sm font-medium text-mauve-600"
        >
          Category name
        </label>

        <input
          id="category-name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          minLength={4}
          maxLength={30}
          autoComplete="off"
          placeholder="e.g. Shoes"
          disabled={isSubmitting}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "category-name-error" : undefined}
         className={`mt-2 block min-h-11 w-full rounded-lg border border-mauve-600 bg-olive-100 px-3 py-2.5 text-base text-mauve-600 outline-none transition placeholder:text-mauve-300 focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200 disabled:cursor-not-allowed disabled:bg-olive-100 disabled:text-mauve-300 sm:text-sm ${
  error
    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
    : ""
}`}
        />

        <div className="mt-1.5 flex justify-between gap-3">
          <p className="text-xs text-mauve-400">
            Use a clear name that helps organize your products.
          </p>

          <span className="shrink-0 text-xs text-teal-900">
            {name.length}/30
          </span>
        </div>
      </div>

      {error && (
        <div
          id="category-name-error"
          role="alert"
          className="mt-4 break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3  pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-olive-100 bg-olive-100 px-4 py-2.5 text-sm font-semibold text-mauve-600 transition hover:bg-olive-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-mauve-600 px-5 py-2.5 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              {isEditMode ? "Updating..." : "Saving..."}
            </>
          ) : isEditMode ? (
            "Update Category"
          ) : (
            "Save Category"
          )}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
