import { supabase } from "../../../lib/supabase";

import { getSales } from "../../sales/services/salesService";

import type {
  DashboardData,
  DashboardStats,
  LowStockProduct,
} from "../types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  /*
   * -------------------------------------------------------
   * 1. Get products
   * -------------------------------------------------------
   */

  const {
    data: products,
    error: productsError,
  } = await supabase
    .from("products")
    .select(
      "id, name, stock_quantity, minimum_stock",
    )
    .order("name", {
      ascending: true,
    });

  if (productsError) {
    console.error(
      "getDashboardData products error:",
      productsError,
    );

    throw productsError;
  }

  /*
   * -------------------------------------------------------
   * 2. Get sales
   * -------------------------------------------------------
   *
   * Sales are owned by the Sales feature.
   *
   * We reuse getSales() instead of duplicating the
   * sales queries here.
   * -------------------------------------------------------
   */

  const sales = await getSales();

  /*
   * -------------------------------------------------------
   * 3. Recent sales
   * -------------------------------------------------------
   *
   * getSales() already returns sales ordered from newest
   * to oldest.
   *
   * The Dashboard only needs the latest 5 sales.
   * -------------------------------------------------------
   */

  const recentSales = sales.slice(0, 5);

  /*
   * -------------------------------------------------------
   * 4. Dashboard statistics
   * -------------------------------------------------------
   */

  const totalProducts =
    products?.length ?? 0;

  const totalStock =
    products?.reduce(
      (total, product) =>
        total +
        Number(
          product.stock_quantity ?? 0,
        ),
      0,
    ) ?? 0;

  const totalSales =
    sales.reduce(
      (total, sale) =>
        total +
        Number(
          sale.total_amount ?? 0,
        ),
      0,
    );

  /*
   * -------------------------------------------------------
   * 5. Sales today
   * -------------------------------------------------------
   */

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const salesToday =
    sales.reduce(
      (total, sale) => {
        const saleDate = new Date(
          sale.created_at,
        );

        if (
          saleDate >= startOfToday &&
          saleDate < endOfToday
        ) {
          return (
            total +
            Number(
              sale.total_amount ?? 0,
            )
          );
        }

        return total;
      },
      0,
    );

  /*
   * -------------------------------------------------------
   * 6. Low stock products
   * -------------------------------------------------------
   */

  const lowStockProducts: LowStockProduct[] =
    (products ?? [])
      .filter(
        (product) =>
          Number(
            product.stock_quantity ?? 0,
          ) <=
          Number(
            product.minimum_stock ?? 0,
          ),
      )
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock_quantity: Number(
          product.stock_quantity ?? 0,
        ),
        minimum_stock: Number(
          product.minimum_stock ?? 0,
        ),
      }));

  /*
   * -------------------------------------------------------
   * 7. Build dashboard statistics
   * -------------------------------------------------------
   */

  const stats: DashboardStats = {
    totalProducts,
    totalStock,
    totalSales,
    salesToday,
  };

  /*
   * -------------------------------------------------------
   * 8. Return dashboard data
   * -------------------------------------------------------
   */

  return {
    stats,
    recentSales,
    lowStockProducts,
  };
}