import { supabase } from "../../../lib/supabase";

import type {
  DashboardData,
  DashboardStats,
  LowStockProduct,
  RecentSale,
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
   */

  const {
    data: sales,
    error: salesError,
  } = await supabase
    .from("sales")
    .select(
      "id, total_amount, created_at",
    )
    .order("created_at", {
      ascending: false,
    });

  if (salesError) {
    console.error(
      "getDashboardData sales error:",
      salesError,
    );

    throw salesError;
  }

  /*
   * -------------------------------------------------------
   * 3. Dashboard statistics
   * -------------------------------------------------------
   */

  const totalProducts =
    products?.length ?? 0;

  const totalStock =
    products?.reduce(
      (total, product) =>
        total +
        Number(product.stock_quantity ?? 0),
      0,
    ) ?? 0;

  const totalSales =
    sales?.reduce(
      (total, sale) =>
        total +
        Number(sale.total_amount ?? 0),
      0,
    ) ?? 0;

  /*
   * -------------------------------------------------------
   * Sales today
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
    sales?.reduce(
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
    ) ?? 0;

  /*
   * -------------------------------------------------------
   * 4. Low stock products
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
   * 5. Get recent sales
   * -------------------------------------------------------
   */

  const recentSales =
    sales?.slice(0, 5) ?? [];

  let recentSalesData: RecentSale[] = [];

  if (recentSales.length > 0) {
    const saleIds =
      recentSales.map(
        (sale) => sale.id,
      );

    const {
      data: saleItems,
      error: saleItemsError,
    } = await supabase
      .from("sale_items")
      .select(
        "id, sale_id, product_id, quantity, unit_price",
      )
      .in("sale_id", saleIds);

    if (saleItemsError) {
      console.error(
        "getDashboardData sale_items error:",
        saleItemsError,
      );

      throw saleItemsError;
    }

    const productIds = [
      ...new Set(
        (saleItems ?? []).map(
          (item) =>
            item.product_id,
        ),
      ),
    ];

    let productNames: {
      id: string;
      name: string;
    }[] = [];

    if (productIds.length > 0) {
      const {
        data,
        error: productNamesError,
      } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      if (productNamesError) {
        console.error(
          "getDashboardData product names error:",
          productNamesError,
        );

        throw productNamesError;
      }

      productNames = data ?? [];
    }

    /*
     * -----------------------------------------------------
     * Convert sale data into dashboard rows
     * -----------------------------------------------------
     */

    recentSalesData =
      recentSales.flatMap(
        (sale) => {
          const items =
            (saleItems ?? []).filter(
              (item) =>
                item.sale_id ===
                sale.id,
            );

          /*
           * If a sale has no sale_items,
           * still show the sale.
           */

          if (items.length === 0) {
            return [
              {
                id: sale.id,
                created_at:
                  sale.created_at,
                total_amount: Number(
                  sale.total_amount,
                ),
                product_name:
                  "Sale has no items",
                quantity: 0,
                unit_price: 0,
              },
            ];
          }

          return items.map(
            (item) => ({
              id: sale.id,
              created_at:
                sale.created_at,
              total_amount: Number(
                sale.total_amount,
              ),
              product_name:
                productNames.find(
                  (product) =>
                    product.id ===
                    item.product_id,
                )?.name ??
                "Unknown product",
              quantity: Number(
                item.quantity,
              ),
              unit_price: Number(
                item.unit_price,
              ),
            }),
          );
        },
      );
  }

  /*
   * -------------------------------------------------------
   * 6. Return dashboard data
   * -------------------------------------------------------
   */

  const stats: DashboardStats = {
    totalProducts,
    totalStock,
    totalSales,
    salesToday,
  };

  return {
    stats,
    recentSales: recentSalesData,
    lowStockProducts,
  };
}