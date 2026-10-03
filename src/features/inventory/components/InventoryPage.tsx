import { useEffect, useState } from "react";

import { useInventory } from "../hooks/useInventory";
import { updateStock } from "../services/inventoryService";
import {
  getStockMovements,
  type StockMovement,
} from "../services/stockMovementService";
import type { InventoryItem } from "../types/inventory";

function InventoryPage() {
  const {
    items,
    isLoading,
    error,
    refetch,
  } = useInventory();

  const [movements, setMovements] = useState<
    StockMovement[]
  >([]);

  const [isLoadingMovements, setIsLoadingMovements] =
    useState(true);

  const [movementError, setMovementError] =
    useState<string | null>(null);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [adjustmentType, setAdjustmentType] =
    useState<"add" | "remove">("add");

  const [quantity, setQuantity] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  /*
   * Initial stock movement loading.
   *
   * We don't call setIsLoadingMovements(true) here
   * because the initial state is already true.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadInitialMovements() {
      try {
        const data = await getStockMovements();

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
   * Used when manually refreshing the movement history
   * or after changing stock.
   */
  async function loadMovements() {
    setIsLoadingMovements(true);
    setMovementError(null);

    try {
      const data = await getStockMovements();

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

  function getStockStatus(
    stockQuantity: number,
    minimumStock: number,
  ) {
    if (stockQuantity === 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (stockQuantity <= minimumStock) {
      return {
        label: "Low Stock",
        className:
          "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-green-100 text-green-700",
    };
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function openAdjustment(item: InventoryItem) {
    setSelectedItem(item);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);
  }

  function closeAdjustment() {
    if (isSaving) {
      return;
    }

    setSelectedItem(null);
    setQuantity("");
    setSaveError(null);
  }

  async function handleSaveAdjustment() {
    if (!selectedItem) {
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setSaveError(
        "Please enter a valid positive whole number.",
      );

      return;
    }

    let newQuantity: number;

    if (adjustmentType === "add") {
      newQuantity =
        selectedItem.stock_quantity + parsedQuantity;
    } else {
      newQuantity =
        selectedItem.stock_quantity - parsedQuantity;
    }

    if (newQuantity < 0) {
      setSaveError(
        "Stock cannot be less than zero.",
      );

      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateStock(
        selectedItem.id,
        newQuantity,
        adjustmentType,
        parsedQuantity,
      );

      setSelectedItem(null);
      setQuantity("");

      await refetch();
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
            onClick={() => void refetch()}
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <p className="mt-1 text-slate-600">
          Monitor and adjust your current stock levels.
        </p>
      </div>

      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {selectedItem && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Adjust Stock
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Product:{" "}
            <span className="font-medium text-slate-900">
              {selectedItem.name}
            </span>
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Current stock:{" "}
            <span className="font-medium text-slate-900">
              {selectedItem.stock_quantity}
            </span>
          </p>

          <div className="mt-4">
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                Adjustment
              </legend>

              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="adjustment-type"
                    value="add"
                    checked={
                      adjustmentType === "add"
                    }
                    onChange={() =>
                      setAdjustmentType("add")
                    }
                    disabled={isSaving}
                  />

                  Add Stock
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="adjustment-type"
                    value="remove"
                    checked={
                      adjustmentType === "remove"
                    }
                    onChange={() =>
                      setAdjustmentType("remove")
                    }
                    disabled={isSaving}
                  />

                  Remove Stock
                </label>
              </div>
            </fieldset>
          </div>

          <div className="mt-4">
            <label
              htmlFor="stock-quantity"
              className="block text-sm font-medium text-slate-700"
            >
              Quantity
            </label>

            <input
              id="stock-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              disabled={isSaving}
              className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Enter quantity"
            />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() =>
                void handleSaveAdjustment()
              }
              disabled={isSaving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : "Save Adjustment"}
            </button>

            <button
              type="button"
              onClick={closeAdjustment}
              disabled={isSaving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Inventory */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Product
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Stock
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Minimum Stock
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const status = getStockStatus(
                  item.stock_quantity,
                  item.minimum_stock,
                );

                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {item.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.stock_quantity}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.minimum_stock}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          openAdjustment(item)
                        }
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">
            No inventory items found.
          </div>
        )}
      </div>

      {/* Stock Movement History */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Stock Movement History
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Track when stock was added or removed.
          </p>
        </div>

        {isLoadingMovements && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p
              className="text-sm text-slate-600"
              aria-live="polite"
            >
              Loading stock history...
            </p>
          </div>
        )}

        {movementError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>
              Failed to load stock movement history.
            </p>

            <p className="mt-1">
              {movementError}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadMovements()
              }
              className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoadingMovements &&
          !movementError && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        Product
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        Action
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        Quantity
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {movements.map((movement) => (
                      <tr key={movement.id}>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {movement.product?.name ??
                            "Unknown Product"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              movement.movement_type ===
                              "add"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {movement.movement_type ===
                            "add"
                              ? "Added"
                              : "Removed"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {movement.quantity}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(
                            movement.created_at,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {movements.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  No stock movements yet.
                </div>
              )}
            </div>
          )}
      </div>
    </section>
  );
}

export default InventoryPage;