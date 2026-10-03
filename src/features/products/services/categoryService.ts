import { supabase } from "../../../lib/supabase";
import type { Category } from "../types/product";

type CreateCategoryInput = {
  name: string;
};

type UpdateCategoryInput = {
  id: string;
  name: string;
};

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(
      "getCategories Supabase error:",
      error,
    );

    throw error;
  }

  return data ?? [];
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error(
      "createCategory Supabase error:",
      error,
    );

    throw error;
  }

  return data;
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name.trim(),
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    console.error(
      "updateCategory Supabase error:",
      error,
    );

    throw error;
  }

  return data;
}

export async function deleteCategory(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "deleteCategory Supabase error:",
      error,
    );

    throw error;
  }
}