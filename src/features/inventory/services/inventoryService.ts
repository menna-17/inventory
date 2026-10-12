
import { supabase } from "../../../lib/supabase";
import type {
  InventoryItem,
  StockMovementType,
} from "../types/inventory";

export const INVENTORY_PAGE_SIZE = 10;

export type InventoryFilters = {
  searchTerm?: string;
  categoryFilter?: string;
  statusFilter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  page?: number;
};

export type InventoryPageResult = {
  items: InventoryItem[];
  totalCount: number;
  totalPages: number;
  page: number;
};

export async function getInventoryItems(
  filters: InventoryFilters = {},
): Promise<InventoryPageResult> {
  const {
    searchTerm = "",
    categoryFilter = "all",
    statusFilter = "all",
    page = 1,
  } = filters;

  const requestedPage = Number.isFinite(page)
    ? Math.max(1, Math.floor(page))
    : 1;

  const search = searchTerm.trim() || null;
  const categoryId =
    categoryFilter === "all" ? null : categoryFilter;

  // Count matching products first so we can validate the requested page.
  const { data: countData, error: countError } = await supabase.rpc(
    "get_inventory_count",
    {
      p_search: search,
      p_category_id: categoryId,
      p_status: statusFilter,
    },
  );

  if (countError) {
    console.error("Inventory count error:", countError);
    throw countError;
  }

  const totalCount = Number(countData ?? 0);

  if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
    throw new Error("The inventory count returned an invalid value.");
  }

  const totalPages = Math.ceil(totalCount / INVENTORY_PAGE_SIZE);

  // Empty results use page 1. Otherwise, clamp to the last valid page.
  const validPage =
    totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  // Query using the validated page, not the original requested page.
  const { data, error } = await supabase.rpc("get_inventory_page", {
    p_search: search,
    p_category_id: categoryId,
    p_status: statusFilter,
    p_offset: (validPage - 1) * INVENTORY_PAGE_SIZE,
    p_limit: INVENTORY_PAGE_SIZE,
  });

  if (error) {
    console.error("Inventory page error:", error);
    throw error;
  }

  return {
    items: (data ?? []) as InventoryItem[],
    totalCount,
    totalPages,
    page: validPage,
  };
}

export async function updateStock(
  productId: string,
  movementType: StockMovementType,
  movementQuantity: number,
): Promise<InventoryItem> {
  if (!productId.trim()) {
    throw new Error("A valid product ID is required.");
  }

  if (
    !Number.isSafeInteger(movementQuantity) ||
    movementQuantity <= 0
  ) {
    throw new Error("Quantity must be a positive whole number.");
  }

  if (movementType !== "add" && movementType !== "remove") {
    throw new Error("Invalid stock movement type.");
  }

  const { data, error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_movement_type: movementType,
    p_quantity: movementQuantity,
  });

  if (error) {
    console.error("updateStock Supabase error:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Stock adjustment returned no product.");
  }

  return data as InventoryItem;
}
