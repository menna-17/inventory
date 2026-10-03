import { useEffect, useState } from "react";
import { getInventoryItems } from "../services/inventoryService";
import type { InventoryItem } from "../types/inventory";

type UseInventoryResult = {
  items: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useInventory(): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      try {
        const data = await getInventoryItems();

        if (!isMounted) {
          return;
        }

        setItems(data);
        setError(null);
      } catch (error) {
        console.error("useInventory error:", error);

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

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refetch() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getInventoryItems();

      setItems(data);
    } catch (error) {
      console.error("useInventory refetch error:", error);

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
    items,
    isLoading,
    error,
    refetch,
  };
}