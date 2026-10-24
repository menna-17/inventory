
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getProducts } from "../../products/services/productService";
import type { Product } from "../../products/types/product";

import { getCategories } from "../../categories/services/categoryService";
import type { Category } from "../../categories/types/category";

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
  categories: Category[];
}> {
  const [sales, products, categories] = await Promise.all([
    getSales(),
    getProducts(),
    getCategories(),
  ]);

  return { sales, products, categories };
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
  const [categories, setCategories] = useState<Category[]>([]);
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
    setCategories(data.categories);
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
        setCategories(data.categories);
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
   * Create a sale containing multiple products.
   */
  const submitSale = useCallback(
    async (
      input: CreateSaleInput,
    ): Promise<boolean> => {
      setError(null);

      if (!input.items || input.items.length === 0) {
        setError("Please add at least one product.");
        return false;
      }

      const productIds = new Set<string>();

      for (const item of input.items) {
        if (!item.productId) {
          setError("Please select a product for every item.");
          return false;
        }

        if (
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
        ) {
          setError(
            "Every product must have a valid positive whole-number quantity.",
          );
          return false;
        }

        if (productIds.has(item.productId)) {
          setError(
            "The same product cannot appear more than once in a sale.",
          );
          return false;
        }

        productIds.add(item.productId);

        const selectedProduct = products.find(
          (product) => product.id === item.productId,
        );

        if (!selectedProduct) {
          setError(
            "One of the selected products could not be found. Please refresh and try again.",
          );
          return false;
        }

        if (
          item.quantity > selectedProduct.stock_quantity
        ) {
          setError(
            `Not enough stock for ${selectedProduct.name}. Available stock: ${selectedProduct.stock_quantity}.`,
          );
          return false;
        }
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
    categories,
    loading,
    saving,
    error,
    submitSale,
    refresh,
  };
}
