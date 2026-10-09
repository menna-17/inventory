
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../../../app/providers/useAuth";
import { useInventory } from "../hooks/useInventory";
import { updateStock } from "../services/inventoryService";
import { getStockMovements } from "../services/stockMovementService";

import type {
  InventoryItem,
  StockMovement,
  StockMovementType,
} from "../types/inventory";

import InventoryTable from "./InventoryTable";
import StockAdjustmentModal from "./StockAdjustmentModal";
import StockMovementHistory from "./StockMovementHistory";

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error ? error.message : fallback;
}

function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  const {
    items,
    isLoading,
    error,
    refetch,
  } = useInventory();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);
  const [movementError, setMovementError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] =
    useState<StockMovementType>("add");
  const [quantity, setQuantity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canAdjustStock = role === "owner" || role === "manager";
  const productId = searchParams.get("productId");

  const productFromUrl = productId
    ? items.find((item) => item.id === productId) ?? null
    : null;

  // Staff must never get an adjustment modal from a URL parameter.
  const activeItem = canAdjustStock
    ? selectedItem ?? productFromUrl
    : null;

  const loadMovements = useCallback(async () => {
    setIsLoadingMovements(true);
    setMovementError(null);

    try {
      const data = await getStockMovements();
      setMovements(data);
    } catch (error) {
      console.error("loadMovements error:", error);
      setMovementError(
        getErrorMessage(
          error,
          "Failed to load stock movement history.",
        ),
      );
    } finally {
      setIsLoadingMovements(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMovements() {
      try {
        const data = await getStockMovements();

        if (cancelled) return;

        setMovements(data);
        setMovementError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Initial stock movements error:", error);
        setMovementError(
          getErrorMessage(
            error,
            "Failed to load stock movement history.",
          ),
        );
      } finally {
        if (!cancelled) {
          setIsLoadingMovements(false);
        }
      }
    }

    void loadInitialMovements();

    return () => {
      cancelled = true;
    };
  }, []);

  function openAdjustment(item: InventoryItem) {
    if (!canAdjustStock || isSaving) return;

    setSelectedItem(item);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);
    setNotice(null);

    setSearchParams(
      { productId: item.id },
      { replace: true },
    );
  }

  function closeAdjustment() {
    if (isSaving) return;

    setSelectedItem(null);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);

    setSearchParams({}, { replace: true });
  }

  async function handleSaveAdjustment() {
    if (!canAdjustStock || !activeItem || isSaving) return;

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setSaveError("Please enter a valid positive whole number.");
      return;
    }

    if (
      adjustmentType === "remove" &&
      parsedQuantity > activeItem.stock_quantity
    ) {
      setSaveError(
        `Not enough stock. Available stock: ${activeItem.stock_quantity}.`,
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setNotice(null);

    try {
      // Only this operation determines whether the adjustment succeeded.
      await updateStock(
        activeItem.id,
        adjustmentType,
        parsedQuantity,
      );
    } catch (error) {
      console.error("Stock adjustment error:", error);
      setSaveError(
        getErrorMessage(error, "Failed to update stock."),
      );
      setIsSaving(false);
      return;
    }

    // The stock change succeeded. Close the modal before refreshing data.
    setSelectedItem(null);
    setAdjustmentType("add");
    setQuantity("");
    setSearchParams({}, { replace: true });
    setIsSaving(false);

    const refreshResults = await Promise.allSettled([
      refetch(),
      loadMovements(),
    ]);

    if (refreshResults.some((result) => result.status === "rejected")) {
      setNotice(
        "Stock was updated, but some data could not be refreshed. Use the retry controls to reload the latest information.",
      );
    } else if (movementError) {
      // loadMovements handles errors internally, so check its current state
      // through the rendered movement-history section instead.
      setNotice(
        "Stock was updated. Check the stock movement history for any loading errors.",
      );
    } else {
      setNotice("Stock updated successfully.");
    }
  }

  if (isLoading) {
    return (
      <section aria-busy="true">
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <div className="mt-6 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <p className="sr-only" aria-live="polite">
          Loading inventory...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p className="font-semibold">Failed to load inventory.</p>
          <p className="mt-2 text-sm">{error.message}</p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 min-h-11 w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 sm:w-auto"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Monitor current stock levels
          {canAdjustStock ? " and adjust inventory." : "."}
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
        >
          {notice}
        </div>
      )}

      {saveError && !activeItem && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {canAdjustStock && activeItem && (
        <StockAdjustmentModal
          item={activeItem}
          adjustmentType={adjustmentType}
          quantity={quantity}
          isSaving={isSaving}
          saveError={saveError}
          onAdjustmentTypeChange={setAdjustmentType}
          onQuantityChange={setQuantity}
          onSave={() => void handleSaveAdjustment()}
          onClose={closeAdjustment}
        />
      )}

      <InventoryTable
        items={items}
        onAdjustStock={openAdjustment}
      />

      <StockMovementHistory
        movements={movements}
        isLoading={isLoadingMovements}
        error={movementError}
        onRetry={() => void loadMovements()}
      />
    </section>
  );
}

export default InventoryPage;
