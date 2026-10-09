
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getProducts } from "../../products/services/productService";
import type { Product } from "../../products/types/product";

import {
  createSale,
  getSales,
} from "../services/salesService";

import type {
  CreateSaleInput,
  Sale,
} from "../types/sales";

async function fetchSalesData(): Promise<{
  sales: Sale[];
  products: Product[];
}> {
  const [sales, products] = await Promise.all([
    getSales(),
    getProducts(),
  ]);

  return { sales, products };
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Shared data-loading function.
   * Throws errors so callers can handle them appropriately.
   */
  const loadSales = useCallback(async () => {
    const data = await fetchSalesData();

    setSales(data.sales);
    setProducts(data.products);
  }, []);

  /*
   * Initial load.
   */
  useEffect(() => {
    let cancelled = false;

    async function initializeSales() {
      try {
        const data = await fetchSalesData();

        if (cancelled) return;

        setSales(data.sales);
        setProducts(data.products);
        setError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Initial sales load error:", error);

        setError(
          getErrorMessage(
            error,
            "Failed to load sales.",
          ),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeSales();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Refresh sales and products.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await loadSales();
    } catch (error) {
      console.error("Refresh sales error:", error);

      setError(
        getErrorMessage(
          error,
          "Failed to refresh sales.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [loadSales]);

  /*
   * Create a sale.
   */
  const submitSale = useCallback(
    async (
      input: CreateSaleInput,
    ): Promise<boolean> => {
      setError(null);

      if (!input.productId) {
        setError("Please select a product.");
        return false;
      }

      if (
        !Number.isInteger(input.quantity) ||
        input.quantity <= 0
      ) {
        setError(
          "Please enter a valid positive whole number.",
        );
        return false;
      }

      const selectedProduct = products.find(
        (product) => product.id === input.productId,
      );

      if (!selectedProduct) {
        setError("Selected product was not found.");
        return false;
      }

      if (
        input.quantity > selectedProduct.stock_quantity
      ) {
        setError(
          `Not enough stock. Available stock: ${selectedProduct.stock_quantity}.`,
        );
        return false;
      }

      setSaving(true);

      try {
        await createSale(input);

        /*
         * The sale has already been created.
         * If refreshing fails, report the refresh problem
         * without claiming the sale itself failed.
         */
        try {
          await loadSales();
        } catch (refreshError) {
          console.error(
            "Sale created, but refresh failed:",
            refreshError,
          );

          setError(
            "Sale was created, but the latest data could not be loaded. Please refresh the page.",
          );
        }

        return true;
      } catch (error) {
        console.error("Create sale error:", error);

        setError(
          getErrorMessage(
            error,
            "Failed to create sale.",
          ),
        );

        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadSales, products],
  );

  return {
    sales,
    products,
    loading,
    saving,
    error,
    submitSale,
    refresh,
  };
}
