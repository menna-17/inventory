import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useInventory } from "../hooks/useInventory";
import { updateStock } from "../services/inventoryService";
import {
  getStockMovements,
  type StockMovement,
} from "../services/stockMovementService";

import type { InventoryItem } from "../types/inventory";

import InventoryTable from "./InventoryTable";
import StockAdjustmentModal from "./StockAdjustmentModal";
import StockMovementHistory from "./StockMovementHistory";

function InventoryPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const {
    items,
    isLoading,
    error,
    refetch,
  } = useInventory();

  const [movements, setMovements] =
    useState<StockMovement[]>([]);

  const [
    isLoadingMovements,
    setIsLoadingMovements,
  ] = useState(true);

  const [movementError, setMovementError] =
    useState<string | null>(null);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [adjustmentType, setAdjustmentType] =
    useState<"add" | "remove">("add");

  const [quantity, setQuantity] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * Dashboard → Inventory product selection
   * -------------------------------------------------------
   *
   * Dashboard sends:
   *
   * /inventory?productId=PRODUCT_ID
   *
   * We derive the product directly from the URL.
   * We do NOT use useEffect to set selectedItem.
   */

  const productId =
    searchParams.get("productId");

  const productFromUrl =
    productId
      ? items.find(
          (item) => item.id === productId,
        ) ?? null
      : null;

  /*
   * If the user clicked Adjust Stock inside
   * Inventory, selectedItem is used.
   *
   * If the user came from Dashboard,
   * productFromUrl is used.
   */

  const activeItem =
    selectedItem ?? productFromUrl;

  /*
   * -------------------------------------------------------
   * Load stock movement history
   * -------------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true;

    async function loadInitialMovements() {
      try {
        const data =
          await getStockMovements();

        if (!isMounted) {
          return;
        }

        setMovements(data);
        setMovementError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          "loadInitialMovements error:",
          error,
        );

        if (error instanceof Error) {
          setMovementError(error.message);
        } else {
          setMovementError(
            "Failed to load stock movement history.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMovements(false);
        }
      }
    }

    void loadInitialMovements();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * -------------------------------------------------------
   * Reload stock movement history
   * -------------------------------------------------------
   */

  async function loadMovements() {
    setIsLoadingMovements(true);
    setMovementError(null);

    try {
      const data =
        await getStockMovements();

      setMovements(data);
    } catch (error) {
      console.error(
        "loadMovements error:",
        error,
      );

      if (error instanceof Error) {
        setMovementError(error.message);
      } else {
        setMovementError(
          "Failed to load stock movement history.",
        );
      }
    } finally {
      setIsLoadingMovements(false);
    }
  }

  /*
   * -------------------------------------------------------
   * Open adjustment
   * -------------------------------------------------------
   */

  function openAdjustment(
    item: InventoryItem,
  ) {
    setSelectedItem(item);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);

    /*
     * Store the selected product in the URL.
     *
     * Example:
     * /inventory?productId=abc-123
     */
    setSearchParams(
      {
        productId: item.id,
      },
      {
        replace: true,
      },
    );
  }

  /*
   * -------------------------------------------------------
   * Close adjustment
   * -------------------------------------------------------
   */

  function closeAdjustment() {
    if (isSaving) {
      return;
    }

    setSelectedItem(null);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);

    /*
     * Remove productId from URL.
     */
    setSearchParams(
      {},
      {
        replace: true,
      },
    );
  }

  /*
   * -------------------------------------------------------
   * Save stock adjustment
   * -------------------------------------------------------
   */

  async function handleSaveAdjustment() {
    if (!activeItem) {
      return;
    }

    const parsedQuantity =
      Number(quantity);

    /*
     * Validate quantity.
     */
    if (
      !Number.isInteger(
        parsedQuantity,
      ) ||
      parsedQuantity <= 0
    ) {
      setSaveError(
        "Please enter a valid positive whole number.",
      );

      return;
    }

    let newQuantity: number;

    /*
     * Add stock.
     */
    if (
      adjustmentType === "add"
    ) {
      newQuantity =
        activeItem.stock_quantity +
        parsedQuantity;
    } else {
      /*
       * Remove stock.
       */
      newQuantity =
        activeItem.stock_quantity -
        parsedQuantity;
    }

    /*
     * Stock cannot go below zero.
     */
    if (newQuantity < 0) {
      setSaveError(
        "Stock cannot be less than zero.",
      );

      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      /*
       * Update products.stock_quantity
       * and create stock movement.
       */
      await updateStock(
        activeItem.id,
        newQuantity,
        adjustmentType,
        parsedQuantity,
      );

      /*
       * Close adjustment.
       */
      setSelectedItem(null);
      setAdjustmentType("add");
      setQuantity("");

      /*
       * Remove productId from URL.
       */
      setSearchParams(
        {},
        {
          replace: true,
        },
      );

      /*
       * Refresh inventory.
       */
      await refetch();

      /*
       * Refresh movement history.
       */
      await loadMovements();
    } catch (error) {
      console.error(
        "handleSaveAdjustment error:",
        error,
      );

      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError(
          "Failed to update stock.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  /*
   * -------------------------------------------------------
   * Loading
   * -------------------------------------------------------
   */

  if (isLoading) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <p
          className="mt-4 text-slate-600"
          aria-live="polite"
        >
          Loading inventory...
        </p>
      </section>
    );
  }

  /*
   * -------------------------------------------------------
   * Inventory error
   * -------------------------------------------------------
   */

  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p className="font-medium">
            Failed to load inventory.
          </p>

          <p className="mt-2 text-sm">
            {error.message}
          </p>

          <button
            type="button"
            onClick={() =>
              void refetch()
            }
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  /*
   * -------------------------------------------------------
   * Page
   * -------------------------------------------------------
   */

  return (
    <section>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <p className="mt-1 text-slate-600">
          Monitor and adjust your current
          stock levels.
        </p>
      </div>

      {/* Save error */}
      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {/* Stock adjustment */}
      {activeItem && (
        <StockAdjustmentModal
          item={activeItem}
          adjustmentType={adjustmentType}
          quantity={quantity}
          isSaving={isSaving}
          saveError={saveError}
          onAdjustmentTypeChange={
            setAdjustmentType
          }
          onQuantityChange={setQuantity}
          onSave={() =>
            void handleSaveAdjustment()
          }
          onClose={closeAdjustment}
        />
      )}

      {/* Inventory table */}
      <InventoryTable
        items={items}
        onAdjustStock={openAdjustment}
      />

      {/* Movement history */}
      <StockMovementHistory
        movements={movements}
        isLoading={isLoadingMovements}
        error={movementError}
        onRetry={() =>
          void loadMovements()
        }
      />
    </section>
  );
}

export default InventoryPage;