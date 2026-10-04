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
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Adjust Stock
          </h2>

          <p className="mt-1 text-sm text-slate-600">
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
          aria-label="Close adjustment"
          className="text-xl leading-none text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
        >
          ×
        </button>
      </div>

      {/* Error */}
      {saveError && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {/* Adjustment type */}
      <div className="mt-5">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            Adjustment
          </legend>

          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={`adjustment-type-${item.id}`}
                value="add"
                checked={
                  adjustmentType === "add"
                }
                onChange={() =>
                  onAdjustmentTypeChange(
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
                name={`adjustment-type-${item.id}`}
                value="remove"
                checked={
                  adjustmentType === "remove"
                }
                onChange={() =>
                  onAdjustmentTypeChange(
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

      {/* Quantity */}
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
            onQuantityChange(
              event.target.value,
            )
          }
          disabled={isSaving}
          className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Enter quantity"
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving..."
            : "Save Adjustment"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default StockAdjustmentModal;