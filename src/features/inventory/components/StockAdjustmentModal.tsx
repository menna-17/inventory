
import type { InventoryItem } from "../types/inventory";

type StockAdjustmentModalProps = {
  item: InventoryItem;
  adjustmentType: "add" | "remove";
  quantity: string;
  isSaving: boolean;
  saveError: string | null;

  onAdjustmentTypeChange: (
    type: "add" | "remove",
  ) => void;

  onQuantityChange: (
    quantity: string,
  ) => void;

  onSave: () => void;
  onClose: () => void;
};

function StockAdjustmentModal({
  item,
  adjustmentType,
  quantity,
  isSaving,
  saveError,
  onAdjustmentTypeChange,
  onQuantityChange,
  onSave,
  onClose,
}: StockAdjustmentModalProps) {
  const parsedQuantity = Number(quantity);

  const hasValidQuantity =
    quantity.trim() !== "" &&
    Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity > 0;

  const resultingStock = hasValidQuantity
    ? adjustmentType === "add"
      ? item.stock_quantity + parsedQuantity
      : item.stock_quantity - parsedQuantity
    : item.stock_quantity;

  const wouldGoBelowZero =
    adjustmentType === "remove" &&
    hasValidQuantity &&
    resultingStock < 0;

  const isQuantityInvalid =
    quantity !== "" && !hasValidQuantity;

  const canSave =
    !isSaving &&
    hasValidQuantity &&
    !wouldGoBelowZero;

  return (
    <section
      aria-labelledby="stock-adjustment-title"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="stock-adjustment-title"
            className="text-lg font-semibold text-slate-900"
          >
            Adjust Stock
          </h2>

          <p className="mt-1 break-words text-sm text-slate-600">
            Product:{" "}
            <span className="font-medium text-slate-900">
              {item.name}
            </span>
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Current stock:{" "}
            <span className="font-medium text-slate-900">
              {item.stock_quantity}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Close stock adjustment"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {/* Error */}
      {saveError && (
        <div
          id="stock-adjustment-error"
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {/* Adjustment type */}
      <div className="mt-5">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            Adjustment type
          </legend>

          <div className="mt-2 flex flex-wrap gap-4 sm:gap-6">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={`adjustment-type-${item.id}`}
                value="add"
                checked={adjustmentType === "add"}
                onChange={() =>
                  onAdjustmentTypeChange("add")
                }
                disabled={isSaving}
                className="h-4 w-4 accent-slate-900 focus:ring-2 focus:ring-slate-400"
              />
              Add Stock
            </label>

            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={`adjustment-type-${item.id}`}
                value="remove"
                checked={adjustmentType === "remove"}
                onChange={() =>
                  onAdjustmentTypeChange("remove")
                }
                disabled={isSaving}
                className="h-4 w-4 accent-slate-900 focus:ring-2 focus:ring-slate-400"
              />
              Remove Stock
            </label>
          </div>
        </fieldset>
      </div>

      {/* Quantity */}
      <div className="mt-4">
        <label
          htmlFor={`stock-quantity-${item.id}`}
          className="block text-sm font-medium text-slate-700"
        >
          Quantity
        </label>

        <input
          id={`stock-quantity-${item.id}`}
          type="number"
          min="1"
          step="1"
          required
          inputMode="numeric"
          value={quantity}
          onChange={(event) =>
            onQuantityChange(event.target.value)
          }
          disabled={isSaving}
          aria-invalid={isQuantityInvalid || wouldGoBelowZero}
          aria-describedby={
            saveError
              ? "stock-adjustment-error"
              : "stock-quantity-help"
          }
          className="mt-1 block min-h-11 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Enter quantity"
        />

        <p
          id="stock-quantity-help"
          className="mt-1 text-xs text-slate-500"
        >
          Enter a positive whole number.
        </p>
      </div>

      {/* Stock preview */}
      <div
        className="mt-4 rounded-lg bg-slate-50 p-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-600">
            Current stock
          </span>

          <span className="font-medium tabular-nums text-slate-900">
            {item.stock_quantity}
          </span>
        </div>

        {hasValidQuantity && (
          <>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">
                {adjustmentType === "add"
                  ? "Adding"
                  : "Removing"}
              </span>

              <span className="font-medium tabular-nums text-slate-900">
                {adjustmentType === "add"
                  ? `+${parsedQuantity}`
                  : `-${parsedQuantity}`}
              </span>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-700">
                  New stock
                </span>

                <span
                  className={`font-semibold tabular-nums ${
                    resultingStock < 0
                      ? "text-red-600"
                      : "text-slate-900"
                  }`}
                >
                  {resultingStock}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Validation warning */}
      {wouldGoBelowZero && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600"
        >
          You cannot remove more stock than is currently available.
        </p>
      )}

      {isQuantityInvalid && (
        <p
          role="alert"
          className="mt-2 text-sm text-red-600"
        >
          Enter a positive whole number for the quantity.
        </p>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSaving && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}

          {isSaving ? "Saving..." : "Save Adjustment"}
        </button>
      </div>
    </section>
  );
}

export default StockAdjustmentModal;
