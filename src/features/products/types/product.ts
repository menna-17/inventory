export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};