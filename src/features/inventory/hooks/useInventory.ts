
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getInventoryItems,
  updateStock,
} from "../services/inventoryService";

import type {
  InventoryItem,
  StockMovementType,
} from "../types/inventory";

type UseInventoryResult = {
  items: InventoryItem[];
  isLoading: boolean;
  isUpdatingStock: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  adjustStock: (
    productId: string,
    movementType: StockMovementType,
    quantity: number,
  ) => Promise<boolean>;
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

export function useInventory(): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialInventory() {
      try {
        const data = await getInventoryItems();

        if (cancelled) return;

        setItems(data);
        setError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Initial inventory load error:", error);
        setError(
          normalizeError(error, "Failed to load inventory."),
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getInventoryItems();
      setItems(data);
    } catch (error) {
      console.error("useInventory refetch error:", error);

      const normalized = normalizeError(
        error,
        "Failed to refresh inventory.",
      );

      setError(normalized);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adjustStock = useCallback(
    async (
      productId: string,
      movementType: StockMovementType,
      quantity: number,
    ): Promise<boolean> => {
      setIsUpdatingStock(true);
      setError(null);

      try {
        await updateStock(productId, movementType, quantity);

        const data = await getInventoryItems();
        setItems(data);

        return true;
      } catch (error) {
        console.error("adjustStock error:", error);

        setError(
          normalizeError(error, "Failed to adjust stock."),
        );

        return false;
      } finally {
        setIsUpdatingStock(false);
      }
    },
    [],
  );

  return {
    items,
    isLoading,
    isUpdatingStock,
    error,
    refetch,
    adjustStock,
  };
}
