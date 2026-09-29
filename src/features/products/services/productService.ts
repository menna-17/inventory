import { supabase } from "../../../lib/supabase";
import type { Category, Product } from "../types/product";

type CreateProductInput = {
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  description?: string;
  image_url?: string;
};

type UpdateProductInput = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  description?: string;
  image_url?: string;
};

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProducts Supabase error:", error);
    throw error;
  }

  return data ?? [];
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

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      category_id: input.category_id,
      price: input.price,
      stock_quantity: input.stock_quantity,
      minimum_stock: input.minimum_stock,
      description: input.description || null,
      image_url: input.image_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("createProduct Supabase error:", error);
    throw error;
  }

  return data;
}

export async function updateProduct(
  input: UpdateProductInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      category_id: input.category_id,
      price: input.price,
      stock_quantity: input.stock_quantity,
      minimum_stock: input.minimum_stock,
      description: input.description || null,
      image_url: input.image_url || null,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    console.error("updateProduct Supabase error:", error);
    throw error;
  }

  return data;
}
export async function deleteProduct(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteProduct Supabase error:", error);
    throw error;
  }
}