import { supabase } from "../../../lib/supabase";

import type {
  InventoryItem,
  StockMovementType,
} from "../types/inventory";

/*
 * -------------------------------------------------------
 * Get inventory
 * -------------------------------------------------------
 */

export async function getInventoryItems(): Promise<
  InventoryItem[]
> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "getInventoryItems Supabase error:",
      error,
    );

    throw error;
  }

  return data ?? [];
}

/*
 * -------------------------------------------------------
 * Update stock
 * -------------------------------------------------------
 *
 * The service calculates the new stock quantity.
 *
 * Add:
 *   current stock + quantity
 *
 * Remove:
 *   current stock - quantity
 *
 * Stock can never become negative.
 * -------------------------------------------------------
 */

export async function updateStock(
  productId: string,
  movementType: StockMovementType,
  movementQuantity: number,
): Promise<InventoryItem> {
  if (!productId) {
    throw new Error(
      "Product is required.",
    );
  }

  if (
    !Number.isInteger(movementQuantity) ||
    movementQuantity <= 0
  ) {
    throw new Error(
      "Stock quantity must be a positive whole number.",
    );
  }

  /*
   * Get the current product stock.
   */

  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError) {
    console.error(
      "updateStock get product error:",
      productError,
    );

    throw productError;
  }

  if (!product) {
    throw new Error(
      "Product was not found.",
    );
  }

  const currentQuantity =
    product.stock_quantity;

  /*
   * Calculate the new quantity.
   */

  let newQuantity: number;

  if (movementType === "add") {
    newQuantity =
      currentQuantity + movementQuantity;
  } else {
    newQuantity =
      currentQuantity - movementQuantity;

    if (newQuantity < 0) {
      throw new Error(
        `Not enough stock. Available stock: ${currentQuantity}.`,
      );
    }
  }

  /*
   * Update the product stock.
   */

  const {
    data: updatedProduct,
    error: updateError,
  } = await supabase
    .from("products")
    .update({
      stock_quantity: newQuantity,
    })
    .eq("id", productId)
    .select()
    .single();

  if (updateError) {
    console.error(
      "updateStock Supabase error:",
      updateError,
    );

    throw updateError;
  }

  /*
   * Record the stock movement.
   */

  const {
    error: movementError,
  } = await supabase
    .from("stock_movements")
    .insert({
      product_id: productId,
      movement_type: movementType,
      quantity: movementQuantity,
    });

  if (movementError) {
    console.error(
      "create stock movement Supabase error:",
      movementError,
    );

    throw movementError;
  }

  return updatedProduct;
}