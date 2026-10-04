import { useSearchParams } from "react-router-dom";
import { useState } from "react";

import { useInventory } from "../hooks/useInventory";
import { updateStock } from "../services/inventoryService";

import type { InventoryItem } from "../types/inventory";

function InventoryPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const {
    items,
    isLoading,
    error,
    refetch,
  } = useInventory();

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
   * Product selected from Dashboard
   * -------------------------------------------------------
   *
   * Example:
   *
   * /inventory?productId=abc-123
   *
   * We do NOT use useEffect here.
   * The active product is derived directly from the URL.
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
   * If the user clicked Adjust Stock directly
   * inside Inventory, selectedItem is used.
   *
   * If the user came from Dashboard, productFromUrl
   * is used.
   */
  const activeItem =
    selectedItem ?? productFromUrl;

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
     * Keep the selected product in the URL.
     *
     * This means:
     *
     * /inventory?productId=abc-123
     *
     * represents the product currently being adjusted.
     */
    setSearchParams({
      productId: item.id,
    });
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
    setQuantity("");
    setSaveError(null);

    /*
     * Remove the product from the URL.
     */
    setSearchParams({});
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
        activeItem.stock_quantity +
        parsedQuantity;
    } else {
      newQuantity =
        activeItem.stock_quantity -
        parsedQuantity;
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
        activeItem.id,
        newQuantity,
        adjustmentType,
        parsedQuantity,
      );

      /*
       * Close the adjustment form.
       */
      setSelectedItem(null);
      setQuantity("");

      /*
       * Remove productId from URL.
       */
      setSearchParams({});

      /*
       * Reload inventory so the new stock
       * quantity appears immediately.
       */
      await refetch();
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
   * Error
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <p className="mt-1 text-slate-600">
          Monitor and adjust your current
          stock levels.
        </p>
      </div>

      {/*
       * ---------------------------------------------------
       * Save error
       * ---------------------------------------------------
       */}

      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {/*
       * ---------------------------------------------------
       * Adjustment form
       * ---------------------------------------------------
       */}

      {activeItem && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Adjust Stock
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Product:{" "}
            <span className="font-medium text-slate-900">
              {activeItem.name}
            </span>
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Current stock:{" "}
            <span className="font-medium text-slate-900">
              {activeItem.stock_quantity}
            </span>
          </p>

          {/*
           * Adjustment type
           */}

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
                      adjustmentType ===
                      "add"
                    }
                    onChange={() =>
                      setAdjustmentType(
                        "add",
                      )
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
                      adjustmentType ===
                      "remove"
                    }
                    onChange={() =>
                      setAdjustmentType(
                        "remove",
                      )
                    }
                    disabled={isSaving}
                  />

                  Remove Stock
                </label>
              </div>
            </fieldset>
          </div>

          {/*
           * Quantity
           */}

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
                setQuantity(
                  event.target.value,
                )
              }
              disabled={isSaving}
              className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Enter quantity"
            />
          </div>

          {/*
           * Buttons
           */}

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
              onClick={
                closeAdjustment
              }
              disabled={isSaving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/*
       * ---------------------------------------------------
       * Inventory table
       * ---------------------------------------------------
       */}

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
                const status =
                  getStockStatus(
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
                          openAdjustment(
                            item,
                          )
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
    </section>
  );
}

export default InventoryPage;