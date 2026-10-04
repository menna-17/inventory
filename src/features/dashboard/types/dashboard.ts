export type DashboardStats = {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  salesToday: number;
};

export type RecentSale = {
  id: string;
  created_at: string;
  total_amount: number;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentSales: RecentSale[];
  lowStockProducts: LowStockProduct[];
};