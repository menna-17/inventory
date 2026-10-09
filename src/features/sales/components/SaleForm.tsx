
import {
  useState,
  type FormEvent,
} from "react";

import type { Product } from "../../products/types/product";

type SaleFormProps = {
  products: Product[];
  saving: boolean;
  onCreateSale: (
    productId: string,
    quantity: number,
  ) => Promise<boolean>;
};

function SaleForm({
  products,
  saving,
  onCreateSale,
}: SaleFormProps) {
  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [quantity, setQuantity] = useState("");
  const [validationError, setValidationError] =
    useState("");

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  const availableProducts = products.filter(
    (product) => product.stock_quantity > 0,
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setValidationError("");

    if (availableProducts.length === 0) {
      setValidationError(
        "There are no products currently in stock.",
      );
      return;
    }

    if (!selectedProductId) {
      setValidationError("Please select a product.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      quantity.trim() === "" ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setValidationError(
        "Enter a valid positive whole number for quantity.",
      );
      return;
    }

    if (
      !selectedProduct ||
      parsedQuantity > selectedProduct.stock_quantity
    ) {
      setValidationError(
        `Quantity exceeds available stock${
          selectedProduct
            ? ` (${selectedProduct.stock_quantity} available)`
            : ""
        }.`,
      );
      return;
    }

    try {
      const success = await onCreateSale(
        selectedProductId,
        parsedQuantity,
      );

      if (success) {
        setSelectedProductId("");
        setQuantity("");
        setValidationError("");
      }
    } catch {
      setValidationError(
        "Something went wrong while creating the sale. Please try again.",
      );
    }
  }

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Create Sale
        </h2>

        <p className="mt-1 text-sm leading-5 text-slate-600">
          Record a sale and automatically update inventory.
        </p>
      </div>

      {availableProducts.length === 0 && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <p className="font-medium">
            No products available
          </p>
          <p className="mt-1">
            Products must have stock available before you can record a sale.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Product */}
          <div className="min-w-0">
            <label
              htmlFor="sale-product"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Product
            </label>

            <select
              id="sale-product"
              value={selectedProductId}
              onChange={(event) => {
                setSelectedProductId(event.target.value);
                setValidationError("");
              }}
              disabled={
                saving || availableProducts.length === 0
              }
              required
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">
                Select a product
              </option>

              {availableProducts.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name} — {product.stock_quantity} in stock
                </option>
              ))}
            </select>

            {selectedProduct && (
              <p className="mt-1.5 text-xs text-slate-500">
                Available stock: {selectedProduct.stock_quantity}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="min-w-0">
            <label
              htmlFor="sale-quantity"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Quantity
            </label>

            <input
              id="sale-quantity"
              type="number"
              min="1"
              step="1"
              max={selectedProduct?.stock_quantity}
              inputMode="numeric"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setValidationError("");
              }}
              disabled={saving || !selectedProductId}
              required
              placeholder="Enter quantity"
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Enter a whole number greater than zero.
            </p>
          </div>
        </div>

        {validationError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {validationError}
          </p>
        )}

        <div className="mt-5">
          <button
            type="submit"
            disabled={
              saving || availableProducts.length === 0
            }
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Creating sale...
              </>
            ) : (
              "Create Sale"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SaleForm;
