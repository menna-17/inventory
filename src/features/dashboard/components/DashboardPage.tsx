import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type RecentSale = {
  id: string;
  created_at: string;
  total_amount: number;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type LowStockProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
};

type DashboardStats = {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  salesToday: number;
};

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    totalSales: 0,
    salesToday: 0,
  });

  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<
    LowStockProduct[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [
        { data: products, error: productsError },
        { data: sales, error: salesError },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, stock_quantity, minimum_stock",
          ),

        supabase
          .from("sales")
          .select(
            "id, total_amount, created_at",
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (productsError) {
        throw productsError;
      }

      if (salesError) {
        throw salesError;
      }

      const productRows = products ?? [];
      const salesRows = sales ?? [];

      // ---------------------------------------------
      // Statistics
      // ---------------------------------------------

      const totalProducts = productRows.length;

      const totalStock = productRows.reduce(
        (total, product) =>
          total +
          Number(product.stock_quantity ?? 0),
        0,
      );

      const totalSales = salesRows.reduce(
        (total, sale) =>
          total +
          Number(sale.total_amount ?? 0),
        0,
      );

      // ---------------------------------------------
      // Sales today
      // ---------------------------------------------

      const today = new Date();

      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const salesToday = salesRows.reduce(
        (total, sale) => {
          const saleDate = new Date(
            sale.created_at,
          );

          if (saleDate >= startOfToday) {
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

      // ---------------------------------------------
      // Low stock
      // ---------------------------------------------

      const lowStock = productRows
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
        }))
        .sort(
          (a, b) =>
            a.stock_quantity -
            b.stock_quantity,
        );

      // ---------------------------------------------
      // Recent sales
      // ---------------------------------------------

      const recentSaleIds = salesRows
        .slice(0, 5)
        .map((sale) => sale.id);

      let recentSalesData: RecentSale[] = [];

      if (recentSaleIds.length > 0) {
        const {
          data: saleItems,
          error: saleItemsError,
        } = await supabase
          .from("sale_items")
          .select(
            "id, sale_id, product_id, quantity, unit_price",
          )
          .in(
            "sale_id",
            recentSaleIds,
          );

        if (saleItemsError) {
          throw saleItemsError;
        }

        const productIds = [
          ...new Set(
            (saleItems ?? []).map(
              (item) => item.product_id,
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
            throw productNamesError;
          }

          productNames = data ?? [];
        }

        recentSalesData = salesRows
          .slice(0, 5)
          .flatMap((sale) => {
            const items = (
              saleItems ?? []
            ).filter(
              (item) =>
                item.sale_id === sale.id,
            );

            return items.map((item) => ({
              id: sale.id,
              created_at: sale.created_at,
              total_amount: Number(
                sale.total_amount ?? 0,
              ),
              product_name:
                productNames.find(
                  (product) =>
                    product.id ===
                    item.product_id,
                )?.name ??
                "Unknown product",
              quantity: Number(
                item.quantity ?? 0,
              ),
              unit_price: Number(
                item.unit_price ?? 0,
              ),
            }));
          });
      }

      // ---------------------------------------------
      // Update state
      // ---------------------------------------------

      setStats({
        totalProducts,
        totalStock,
        totalSales,
        salesToday,
      });

      setLowStockProducts(lowStock);
      setRecentSales(recentSalesData);
    } catch (error) {
      console.error(
        "Failed to load dashboard:",
        error,
      );

      setError(
        "Failed to load dashboard data.",
      );
    }
  }, []);

  // ---------------------------------------------
  // Initial load
  // ---------------------------------------------

  useEffect(() => {
    async function loadInitialDashboard() {
      setLoading(true);

      await loadDashboard();

      setLoading(false);
    }

    loadInitialDashboard();
  }, [loadDashboard]);

  // ---------------------------------------------
  // Refresh
  // ---------------------------------------------

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError("");

      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }

  // ---------------------------------------------
  // Loading screen
  // ---------------------------------------------

  if (loading) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Loading dashboard...
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Overview of your inventory and sales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Products
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalProducts}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Stock
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalStock}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Sales
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            ${stats.totalSales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Sales Today
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            ${stats.salesToday.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Low Stock */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Low Stock
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Products that have reached or fallen below their
            minimum stock level.
          </p>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            All products are sufficiently stocked.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Current Stock
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Minimum Stock
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {lowStockProducts.map(
                  (product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {product.name}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {product.stock_quantity}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {product.minimum_stock}
                      </td>

                      <td className="px-5 py-4">
                        {product.stock_quantity ===
                        0 ? (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Low Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Sales
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest sales transactions.
          </p>
        </div>

        {recentSales.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            No sales yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Quantity
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Unit Price
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Total
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {recentSales.map(
                  (sale, index) => (
                    <tr
                      key={`${sale.id}-${index}`}
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {sale.product_name}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {sale.quantity}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        ${sale.unit_price.toFixed(2)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        $
                        {(
                          sale.unit_price *
                          sale.quantity
                        ).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(
                          sale.created_at,
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;