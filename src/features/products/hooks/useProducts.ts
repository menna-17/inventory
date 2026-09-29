import { useEffect, useState } from "react";
import {
  getCategories,
  getProducts,
} from "../services/productService";
import type { Category, Product } from "../types/product";

type UseProductsResult = {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(productsData);
        setCategories(categoriesData);
        setError(null);
      } catch (error) {
        console.error("useProducts error:", error);

        if (!isMounted) {
          return;
        }

        if (error instanceof Error) {
          setError(error);
        } else {
          setError(
            new Error(
              `Unknown error: ${JSON.stringify(error)}`,
            ),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refetch() {
    setIsLoading(true);
    setError(null);

    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("useProducts refetch error:", error);

      if (error instanceof Error) {
        setError(error);
      } else {
        setError(
          new Error(
            `Unknown error: ${JSON.stringify(error)}`,
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return {
    products,
    categories,
    isLoading,
    error,
    refetch,
  };
}