
export type InventoryItem = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

export type StockMovementType =
  | "add"
  | "remove";

export type StockMovement = {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  user_id: string | null;
  created_at: string;

  product?: {
    name: string;
  };

  user?: {
    full_name: string | null;
  };
};

/**
 * Row returned by the get_stock_movements Supabase RPC.
 * Keep these fields aligned with the SQL function's RETURNS TABLE.
 */
export type StockMovementRpcRow = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  user_id: string | null;
  created_at: string;
  product_name: string | null;
  user_name: string | null;
};
