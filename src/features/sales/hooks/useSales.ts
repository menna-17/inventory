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

/*
 * -------------------------------------------------------
 * Helper
 * -------------------------------------------------------
 */

async function fetchSalesData(): Promise<{
  sales: Sale[];
  products: Product[];
}> {
  const [salesData, productsData] =
    await Promise.all([
      getSales(),
      getProducts(),
    ]);

  return {
    sales: salesData,
    products: productsData,
  };
}

/*
 * -------------------------------------------------------
 * useSales
 * -------------------------------------------------------
 */

export function useSales() {
  const [sales, setSales] = useState<Sale[]>(
    [],
  );

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * Load sales
   * -------------------------------------------------------
   */

  const loadSales = useCallback(
    async () => {
      try {
        setError(null);

        const {
          sales,
          products,
        } = await fetchSalesData();

        setSales(sales);
        setProducts(products);
      } catch (error) {
        console.error(
          "loadSales error:",
          error,
        );

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Failed to load sales.",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /*
   * -------------------------------------------------------
   * Initial load
   *
   * Do not call loadSales() directly inside
   * the effect. The request is started asynchronously
   * and state is updated after the request completes.
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function initializeSales() {
      try {
        const {
          sales,
          products,
        } = await fetchSalesData();

        if (cancelled) {
          return;
        }

        setSales(sales);
        setProducts(products);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Initial sales load error:",
          error,
        );

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Failed to load sales.",
          );
        }
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
   * -------------------------------------------------------
   * Create sale
   * -------------------------------------------------------
   */

  const submitSale = useCallback(
    async (
      input: CreateSaleInput,
    ): Promise<boolean> => {
      /*
       * Clear previous error
       */

      setError(null);

      /*
       * Validate product
       */

      if (!input.productId) {
        setError(
          "Please select a product.",
        );

        return false;
      }

      /*
       * Validate quantity
       */

      if (
        !Number.isInteger(input.quantity) ||
        input.quantity <= 0
      ) {
        setError(
          "Please enter a valid positive whole number.",
        );

        return false;
      }

      /*
       * Find selected product
       */

      const selectedProduct =
        products.find(
          (product) =>
            product.id === input.productId,
        );

      if (!selectedProduct) {
        setError(
          "Selected product was not found.",
        );

        return false;
      }

      /*
       * Check available stock
       */

      if (
        input.quantity >
        selectedProduct.stock_quantity
      ) {
        setError(
          `Not enough stock. Available stock: ${selectedProduct.stock_quantity}.`,
        );

        return false;
      }

      /*
       * Start saving
       */

      setSaving(true);

      try {
        /*
         * Create the sale in Supabase.
         */

        await createSale(input);

        /*
         * Refresh sales and products
         * after the sale is successfully created.
         */

        await loadSales();

        return true;
      } catch (error) {
        console.error(
          "submitSale error:",
          error,
        );

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Failed to create sale.",
          );
        }

        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadSales, products],
  );

  /*
   * -------------------------------------------------------
   * Return hook data
   * -------------------------------------------------------
   */

  return {
    sales,
    products,
    loading,
    saving,
    error,

    submitSale,

    refresh: loadSales,
  };
}