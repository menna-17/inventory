
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";

import type {
  Category,
  Product,
} from "../types/product";

type UseProductsResult = {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

function normalizeError(
  error: unknown,
  fallback: string,
): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async () => {
    const [productsData, categoriesData] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    setProducts(productsData);
    setCategories(categoriesData);
  }, []);

  /*
   * Initial load with unmount protection.
   */
  useEffect(() => {
    let cancelled = false;

    async function initializeProducts() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (cancelled) {
          return;
        }

        setProducts(productsData);
        setCategories(categoriesData);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Initial products load error:", error);

        setError(
          normalizeError(
            error,
            "Failed to load products and categories.",
          ),
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initializeProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Refresh products and categories.
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadProducts();
    } catch (error) {
      console.error("Products refresh error:", error);

      setError(
        normalizeError(
          error,
          "Failed to refresh products and categories.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadProducts]);

  return {
    products,
    categories,
    isLoading,
    error,
    refetch,
  };
}
