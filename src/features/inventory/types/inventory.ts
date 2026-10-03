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