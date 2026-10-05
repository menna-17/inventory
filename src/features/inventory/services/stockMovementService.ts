import { supabase } from "../../../lib/supabase";

import type {
  StockMovement,
  StockMovementType,
} from "../types/inventory";

export async function getStockMovements(): Promise<
  StockMovement[]
> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(`
      id,
      product_id,
      movement_type,
      quantity,
      created_at,
      products (
        name
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "getStockMovements Supabase error:",
      error,
    );

    throw error;
  }

  return (data ?? []).map((movement) => ({
    id: movement.id,
    product_id: movement.product_id,
    movement_type:
      movement.movement_type as StockMovementType,
    quantity: movement.quantity,
    created_at: movement.created_at,
    product: Array.isArray(movement.products)
      ? movement.products[0]
      : movement.products,
  }));
}