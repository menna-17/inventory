
import { supabase } from "../../../lib/supabase";
import type { Product } from "../types/product";

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

type ProductFields = {
  name: string;
  category_id: string;
  price: number;
  minimum_stock: number;
  description?: string;
  image_url?: string;
};

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function validateProductFields(input: ProductFields): void {
  if (typeof input.name !== "string" || !input.name.trim()) {
    throw new Error("Product name is required.");
  }

  if (input.name.trim().length > 150) {
    throw new Error("Product name must be 150 characters or less.");
  }

  if (
    typeof input.category_id !== "string" ||
    !input.category_id.trim()
  ) {
    throw new Error("Category is required.");
  }

  if (
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price <= 0
  ) {
    throw new Error("Price must be greater than 0.");
  }

  if (
    !Number.isSafeInteger(input.minimum_stock) ||
    input.minimum_stock < 0
  ) {
    throw new Error(
      "Minimum stock must be a safe, non-negative whole number.",
    );
  }

  if ((input.description?.length ?? 0) > 1000) {
    throw new Error("Description must be 1000 characters or less.");
  }

  const imageUrl = input.image_url?.trim();

  if (imageUrl) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new Error("Enter a valid image URL.");
    }

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      throw new Error("Image URL must use HTTP or HTTPS.");
    }
  }
}

async function ensureUniqueProductName(
  name: string,
  categoryId: string,
  excludeProductId?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("category_id", categoryId);

  if (error) {
    console.error("Product name validation error:", error);

    throw new Error(
      "Unable to check product name availability. Please try again.",
    );
  }

  const normalizedName = normalizeName(name);

  const duplicate = (data ?? []).some(
    (existingProduct) =>
      existingProduct.id !== excludeProductId &&
      normalizeName(existingProduct.name) === normalizedName,
  );

  if (duplicate) {
    throw new Error(
      "A product with this name already exists in this category.",
    );
  }
}

/*
 * Get products
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProducts error:", error);
    throw error;
  }

  return data ?? [];
}

/*
 * Create product
 *
 * Initial stock can be set only during creation.
 * Later stock changes use Inventory -> Adjust Stock.
 */
export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  validateProductFields(input);

  if (
    !Number.isSafeInteger(input.stock_quantity) ||
    input.stock_quantity < 0
  ) {
    throw new Error(
      "Stock quantity must be a safe, non-negative whole number.",
    );
  }

  const name = input.name.trim();
  const categoryId = input.category_id.trim();

  await ensureUniqueProductName(name, categoryId);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      category_id: categoryId,
      price: input.price,
      stock_quantity: input.stock_quantity,
      minimum_stock: input.minimum_stock,
      description: input.description?.trim() || null,
      image_url: input.image_url?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("createProduct error:", error);

    if (error.code === "23505") {
      throw new Error(
        "A product with this name already exists in this category.",
      );
    }

    throw new Error(
      "Unable to create the product. Please check your information and try again.",
    );
  }

  return data;
}

/*
 * Update product
 *
 * Stock is intentionally not updated here.
 */
export async function updateProduct(
  input: UpdateProductInput,
): Promise<Product> {
  if (!input.id?.trim()) {
    throw new Error("Product is required.");
  }

  validateProductFields(input);

  const name = input.name.trim();
  const categoryId = input.category_id.trim();

  await ensureUniqueProductName(
    name,
    categoryId,
    input.id,
  );

  const { data, error } = await supabase
    .from("products")
    .update({
      name,
      category_id: categoryId,
      price: input.price,
      minimum_stock: input.minimum_stock,
      description: input.description?.trim() || null,
      image_url: input.image_url?.trim() || null,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    console.error("updateProduct error:", error);

    if (error.code === "23505") {
      throw new Error(
        "A product with this name already exists in this category.",
      );
    }

    throw new Error(
      "Unable to update the product. Please try again.",
    );
  }

  return data;
}

/*
 * Delete product
 *
 * Supabase RLS must enforce owner-only access.
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new Error("Product is required.");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteProduct error:", error);

    throw new Error(
      "Unable to delete the product. It may be in use or you may not have permission.",
    );
  }
}
