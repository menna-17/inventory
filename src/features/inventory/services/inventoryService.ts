
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

  return (data ?? []) as InventoryItem[];
}

/*
 * -------------------------------------------------------
 * Update stock
 * -------------------------------------------------------
 *
 * Stock adjustment is handled by the database RPC.
 *
 * The database function must:
 * - verify Owner / Manager permissions
 * - validate the movement type and quantity
 * - prevent negative stock
 * - enforce appropriate numeric bounds
 * - update the product and record the movement
 *   atomically
 * -------------------------------------------------------
 */

export async function updateStock(
  productId: string,
  movementType: StockMovementType,
  movementQuantity: number,
): Promise<InventoryItem> {
  // Validate the product ID.
  if (
    typeof productId !== "string" ||
    productId.trim().length === 0
  ) {
    throw new Error("Product is required.");
  }

  // Require a positive, safe whole number.
  if (
    !Number.isSafeInteger(movementQuantity) ||
    movementQuantity <= 0
  ) {
    throw new Error(
      "Stock quantity must be a positive whole number.",
    );
  }

  // Validate the movement type.
  if (
    movementType !== "add" &&
    movementType !== "remove"
  ) {
    throw new Error(
      "Invalid stock movement type.",
    );
  }

  // Perform the adjustment through the database RPC.
  const { data, error } = await supabase.rpc(
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
      "Stock was not updated. The database returned no product.",
    );
  }

  return data as InventoryItem;
}
