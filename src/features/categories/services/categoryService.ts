
import { supabase } from "../../../lib/supabase";
import type { Category } from "../types/category";

type CreateCategoryInput = {
  name: string;
};

type UpdateCategoryInput = {
  id: string;
  name: string;
};

const DUPLICATE_CATEGORY_MESSAGE =
  "A category with this name already exists. Please choose another name.";

function validateCategoryName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  if (trimmedName.length > 100) {
    throw new Error(
      "Category name must be 100 characters or fewer.",
    );
  }

  return trimmedName;
}

function isDuplicateError(error: { code?: string }): boolean {
  return error.code === "23505";
}

async function ensureUniqueCategoryName(
  name: string,
  excludeCategoryId?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name");

  if (error) {
    console.error(
      "Category uniqueness check failed:",
      error,
    );
    throw new Error(
      "Unable to validate the category name. Please try again.",
    );
  }

  const normalizedName = name.trim().toLowerCase();

  const duplicate = (data ?? []).some((category) => {
    if (category.id === excludeCategoryId) {
      return false;
    }

    return (
      category.name.trim().toLowerCase() === normalizedName
    );
  });

  if (duplicate) {
    throw new Error(DUPLICATE_CATEGORY_MESSAGE);
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("getCategories Supabase error:", error);
    throw error;
  }

  return data ?? [];
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const name = validateCategoryName(input.name);

  await ensureUniqueCategoryName(name);

  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error("createCategory Supabase error:", error);

    if (isDuplicateError(error)) {
      throw new Error(DUPLICATE_CATEGORY_MESSAGE);
    }

    throw new Error(
      "Failed to create category. Please try again.",
    );
  }

  return data;
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<Category> {
  if (!input.id.trim()) {
    throw new Error("Category ID is required.");
  }

  const name = validateCategoryName(input.name);

  await ensureUniqueCategoryName(name, input.id);

  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    console.error("updateCategory Supabase error:", error);

    if (isDuplicateError(error)) {
      throw new Error(DUPLICATE_CATEGORY_MESSAGE);
    }

    throw new Error(
      "Failed to update category. Please try again.",
    );
  }

  return data;
}

export async function deleteCategory(
  id: string,
): Promise<void> {
  if (!id.trim()) {
    throw new Error("Category ID is required.");
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("deleteCategory Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23503") {
      throw new Error(
        "This category cannot be deleted because it is referenced by existing records. Remove or reassign its products first.",
      );
    }

    throw new Error(
      `Failed to delete category: ${error.message}`,
    );
  }

  if (!data || data.length === 0) {
    throw new Error(
      "The category was not deleted. It may not exist, or your database permissions may prevent deletion.",
    );
  }
}
