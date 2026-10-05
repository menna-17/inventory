import {
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

export function useInventory(): UseInventoryResult {
  const [items, setItems] = useState<
    InventoryItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUpdatingStock, setIsUpdatingStock] =
    useState(false);

  const [error, setError] =
    useState<Error | null>(null);

  /*
   * -------------------------------------------------------
   * Load inventory
   * -------------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      try {
        const data =
          await getInventoryItems();

        if (!isMounted) {
          return;
        }

        setItems(data);
        setError(null);
      } catch (error) {
        console.error(
          "useInventory error:",
          error,
        );

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

  /*
   * -------------------------------------------------------
   * Refetch inventory
   * -------------------------------------------------------
   */

  async function refetch() {
    setIsLoading(true);
    setError(null);

    try {
      const data =
        await getInventoryItems();

      setItems(data);
    } catch (error) {
      console.error(
        "useInventory refetch error:",
        error,
      );

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

  /*
   * -------------------------------------------------------
   * Adjust stock
   * -------------------------------------------------------
   */

  async function adjustStock(
    productId: string,
    movementType: StockMovementType,
    quantity: number,
  ): Promise<boolean> {
    setError(null);
    setIsUpdatingStock(true);

    try {
      await updateStock(
        productId,
        movementType,
        quantity,
      );

      /*
       * Reload inventory so the table immediately
       * shows the new stock quantity.
       */

      const data =
        await getInventoryItems();

      setItems(data);

      return true;
    } catch (error) {
      console.error(
        "adjustStock error:",
        error,
      );

      if (error instanceof Error) {
        setError(error);
      } else {
        setError(
          new Error(
            `Unknown error: ${JSON.stringify(error)}`,
          ),
        );
      }

      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }

  return {
    items,
    isLoading,
    isUpdatingStock,
    error,
    refetch,
    adjustStock,
  };
}