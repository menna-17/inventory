
import { supabase } from "../../../lib/supabase";
import type {
  StockMovement,
  StockMovementType,
} from "../types/inventory";

export const STOCK_MOVEMENTS_PAGE_SIZE = 10;

type StockMovementRpcRow = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  user_id: string | null;
  created_at: string;
  product_name: string | null;
  user_name: string | null;
  image_url: string | null;
};

export type StockMovementPageResult = {
  items: StockMovement[];
  totalCount: number;
  totalPages: number;
  page: number;
};

function isStockMovementType(
  value: string,
): value is StockMovementType {
  return value === "add" || value === "remove";
}

export async function getStockMovements(
  requestedPage = 1,
): Promise<StockMovementPageResult> {
  const normalizedPage = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;

  // Count movements first so we can validate the requested page.
  const { data: countData, error: countError } = await supabase.rpc(
    "get_stock_movements_count",
  );

  if (countError) {
    console.error("Stock movement count error:", countError);
    throw countError;
  }

  const totalCount = Number(countData ?? 0);

  if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
    throw new Error(
      "The stock movement count returned an invalid value.",
    );
  }

  const totalPages = Math.ceil(
    totalCount / STOCK_MOVEMENTS_PAGE_SIZE,
  );

  // Empty results use page 1. Otherwise, clamp to the last valid page.
  const validPage =
    totalPages === 0
      ? 1
      : Math.min(normalizedPage, totalPages);

  // Fetch using the validated page offset.
  const { data, error } = await supabase.rpc(
    "get_stock_movements_page",
    {
      p_offset: (validPage - 1) * STOCK_MOVEMENTS_PAGE_SIZE,
      p_limit: STOCK_MOVEMENTS_PAGE_SIZE,
    },
  );

  if (error) {
    console.error("Stock movement page error:", error);
    throw error;
  }

  const items = ((data ?? []) as StockMovementRpcRow[]).map(
    (movement): StockMovement => {
      if (!isStockMovementType(movement.movement_type)) {
        throw new Error(
          `Invalid stock movement type for movement ${movement.id}.`,
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
              image_url: movement.image_url ?? null,
            }
          : undefined,

        user: movement.user_name
          ? { full_name: movement.user_name }
          : undefined,
      };
    },
  );

  return {
    items,
    totalCount,
    totalPages,
    page: validPage,
  };
}
