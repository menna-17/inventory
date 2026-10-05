export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: {
    name: string;
  };
};

export type Sale = {
  id: string;
  user_id: string;
  total_amount: number;
  created_at: string;
  items: SaleItem[];
};

export type CreateSaleInput = {
  productId: string;
  quantity: number;
};