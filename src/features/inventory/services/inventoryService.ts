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
 * Stock adjustment is handled by the database RPC.
 *
 * The RPC:
 * - checks Owner / Manager permission
 * - validates the movement
 * - calculates the new stock
 * - prevents negative stock
 * - updates the product
 * - records the stock movement
 * - performs the operation atomically
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

  if (
    movementType !== "add" &&
    movementType !== "remove"
  ) {
    throw new Error(
      "Invalid stock movement type.",
    );
  }

  /*
   * Let Supabase/PostgreSQL handle the
   * stock adjustment.
   */

  const {
    data,
    error,
  } = await supabase.rpc(
    "adjust_stock",
    {
      p_product_id: productId,
      p_movement_type: movementType,
      p_quantity: movementQuantity,
    },
  );

  if (error) {
    console.error(
      "updateStock RPC error:",
      error,
    );

    throw error;
  }

  if (!data) {
    throw new Error(
      "Stock was not updated.",
    );
  }

  return data as InventoryItem;
}