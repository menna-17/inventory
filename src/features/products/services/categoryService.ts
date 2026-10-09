
import { supabase } from "../../../lib/supabase";
import type { Category } from "../types/product";

type CreateCategoryInput = {
  name: string;
};

type UpdateCategoryInput = {
  id: string;
  name: string;
};

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

  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error("createCategory Supabase error:", error);
    throw error;
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

  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    console.error("updateCategory Supabase error:", error);
    throw error;
  }

  return data;
}

export async function deleteCategory(
  id: string,
): Promise<void> {
  if (!id.trim()) {
    throw new Error("Category ID is required.");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteCategory Supabase error:", error);
    throw error;
  }
}
