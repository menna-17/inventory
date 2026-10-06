import { supabase } from "../../../lib/supabase";

import type {
  StockMovement,
  StockMovementType,
} from "../types/inventory";

export async function getStockMovements(): Promise<
  StockMovement[]
> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_stock_movements",
  );

  if (error) {
    console.error(
      "getStockMovements Supabase error:",
      error,
    );

    throw error;
  }

  return (data ?? []).map(
    (movement) => ({
      id: movement.id,
      product_id:
        movement.product_id,
      movement_type:
        movement.movement_type as StockMovementType,
      quantity:
        movement.quantity,
      user_id:
        movement.user_id,
      created_at:
        movement.created_at,

      product: movement.product_name
        ? {
            name:
              movement.product_name,
          }
        : undefined,

      user: movement.user_name
        ? {
            full_name:
              movement.user_name,
          }
        : undefined,
    }),
  );
}