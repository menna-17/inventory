
import { supabase } from "../../../lib/supabase";

import type {
  StockMovement,
  StockMovementType,
} from "../types/inventory";

type StockMovementRpcRow = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  user_id: string | null;
  created_at: string;
  product_name: string | null;
  user_name: string | null;
};

function isStockMovementType(
  value: string,
): value is StockMovementType {
  return value === "add" || value === "remove";
}

export async function getStockMovements(): Promise<
  StockMovement[]
> {
  const { data, error } = await supabase.rpc(
    "get_stock_movements",
  );

  if (error) {
    console.error(
      "getStockMovements Supabase error:",
      error,
    );

    throw error;
  }

  if (!data) {
    return [];
  }

  return (data as StockMovementRpcRow[]).map(
    (movement): StockMovement => {
      if (!isStockMovementType(movement.movement_type)) {
        throw new Error(
          `Invalid stock movement type received for movement ${movement.id}.`,
        );
      }

      return {
        id: movement.id,
        product_id: movement.product_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        user_id: movement.user_id,
        created_at: movement.created_at,

        product: movement.product_name
          ? {
              name: movement.product_name,
            }
          : undefined,

        user: movement.user_name
          ? {
              full_name: movement.user_name,
            }
          : undefined,
      };
    },
  );
}
