import type { Sale } from "../../sales/types/sales";

export type DashboardStats = {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  salesToday: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentSales: Sale[];
  lowStockProducts: LowStockProduct[];
};