import {
  useState,
  useRef,
  type FormEvent,
  type KeyboardEvent,
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

  const quantityInputRef = useRef<HTMLInputElement>(null);

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

  function handleProductKeyDown(event: KeyboardEvent<HTMLSelectElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (selectedProductId) {
        quantityInputRef.current?.focus();
      }
    }
  }

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  }

  return (
    <div className="min-w-0 max-w-5xl pl-2 sm:pl-4">
      {availableProducts.length === 0 && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
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
              className="mb-1.5 block text-sm font-medium text-mauve-600"
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
              onKeyDown={handleProductKeyDown}
              disabled={
                saving || availableProducts.length === 0
              }
              required
              className="h-10 w-full rounded-lg border border-mauve-600 bg-olive-100 px-3 py-2 text-sm text-mauve-500 outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200 disabled:cursor-not-allowed disabled:bg-mauve-200 disabled:text-mauve-300"
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
              <p className="mt-1.5 text-xs text-teal-900">
                Available stock: {selectedProduct.stock_quantity}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="min-w-0">
            <label
              htmlFor="sale-quantity"
              className="mb-1.5 block text-sm font-medium text-mauve-600"
            >
              Quantity
            </label>

            <input
              ref={quantityInputRef}
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
              onKeyDown={handleQuantityKeyDown}
              disabled={saving || !selectedProductId}
              required
              placeholder="Enter quantity"
              className="h-10 w-full rounded-lg border border-mauve-600 px-3 py-2 text-sm text-mauve-600 outline-none transition placeholder:text-mauve-500 focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200 disabled:cursor-not-allowed disabled:bg-mauve-200 disabled:text-mauve-300"
            />

            <p className="mt-1.5 text-xs text-teal-900">
              Enter a whole number greater than zero.
            </p>
          </div>
        </div>

        {validationError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {validationError}
          </p>
        )}

        <div className="mt-3 flex justify-start pl-0.5">
          <button
            type="submit"
            disabled={
              saving || availableProducts.length === 0
            }
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-mauve-600 px-5 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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