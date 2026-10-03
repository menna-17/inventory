import { useState } from "react";
import {
  createCategory,
  updateCategory,
} from "../services/categoryService";
import type { Category } from "../types/product";

type CategoryFormProps = {
  category?: Category | null;
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
};

function CategoryForm({
  category,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const isEditMode = Boolean(category);

  const [name, setName] = useState(
    category?.name ?? "",
  );

  const [error, setError] = useState<string | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function validate(): string | null {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Category name is required.";
    }

    if (trimmedName.length > 100) {
      return "Category name must be 100 characters or less.";
    }

    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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

      if (error && typeof error === "object") {
        const supabaseError = error as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };

        setError(
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
            (isEditMode
              ? "Failed to update category."
              : "Failed to create category."),
        );
      } else {
        setError(
          isEditMode
            ? "Failed to update category."
            : "Failed to create category.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-slate-200 bg-white p-6"
    >
      <div>
        <label
          htmlFor="category-name"
          className="block text-sm font-medium text-slate-700"
        >
          Category name
        </label>

        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          maxLength={100}
          autoComplete="off"
          placeholder="e.g. Electronics"
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
              ? "Update Category"
              : "Save Category"}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;