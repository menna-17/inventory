
import {
  useState,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type { Product } from "../../products/types/product";

type SaleItemInput = {
  productId: string;
  quantity: number;
};

type SaleFormProps = {
  products: Product[];
  saving: boolean;
  onCreateSale: (
    items: SaleItemInput[],
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

  const [items, setItems] = useState<SaleItemInput[]>([]);

  const quantityInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  const availableProducts = products.filter(
    (product) => product.stock_quantity > 0,
  );

  function handleAddItem() {
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

    if (!selectedProduct) {
      setValidationError("Please select a valid product.");
      return;
    }

    const existingItem = items.find(
      (item) => item.productId === selectedProductId,
    );

    const existingQuantity = existingItem?.quantity ?? 0;
    const totalQuantity = existingQuantity + parsedQuantity;

    if (totalQuantity > selectedProduct.stock_quantity) {
      setValidationError(
        `Quantity exceeds available stock (${selectedProduct.stock_quantity} available).`,
      );
      return;
    }

    if (existingItem) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.productId === selectedProductId
            ? { ...item, quantity: totalQuantity }
            : item,
        ),
      );
    } else {
      setItems((currentItems) => [
        ...currentItems,
        {
          productId: selectedProductId,
          quantity: parsedQuantity,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity("");
    setValidationError("");
  }

  function handleRemoveItem(productId: string) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.productId !== productId,
      ),
    );

    setValidationError("");
  }

  function handleQuantityChange(
    productId: string,
    nextQuantity: number,
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    );

    setValidationError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setValidationError("");

    if (items.length === 0) {
      setValidationError(
        "Please add at least one product to the sale.",
      );
      return;
    }

    for (const item of items) {
      const product = products.find(
        (product) => product.id === item.productId,
      );

      if (!product) {
        setValidationError(
          "One of the selected products could not be found. Please refresh and try again.",
        );
        return;
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        setValidationError(
          "Every product must have a valid positive whole-number quantity.",
        );
        return;
      }

      if (item.quantity > product.stock_quantity) {
        setValidationError(
          `Not enough stock for ${product.name}. Available stock: ${product.stock_quantity}.`,
        );
        return;
      }
    }

    try {
      const success = await onCreateSale(items);

      if (success) {
        setSelectedProductId("");
        setQuantity("");
        setItems([]);
        setValidationError("");
      }
    } catch {
      setValidationError(
        "Something went wrong while creating the sale. Please try again.",
      );
    }
  }

  function handleProductKeyDown(
    event: KeyboardEvent<HTMLSelectElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (selectedProductId) {
        quantityInputRef.current?.focus();
      }
    }
  }

  function handleQuantityKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddItem();
    }
  }

  const totalAmount = items.reduce((total, item) => {
    const product = products.find(
      (product) => product.id === item.productId,
    );

    return total + Number(product?.price ?? 0) * item.quantity;
  }, 0);

  return (
    <div className="w-full min-w-0">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Product */}
          <div className="min-w-0">
            <label
              htmlFor="sale-product"
              className="mb-2 block text-base font-medium text-mauve-600"
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
              className="h-14 w-full rounded-xl border border-mauve-600 bg-olive-100 px-4 text-base text-mauve-500 outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200 disabled:cursor-not-allowed disabled:bg-olive-100 disabled:text-mauve-200"
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
              <p className="mt-2 text-sm text-teal-900">
                Available stock: {selectedProduct.stock_quantity}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="min-w-0">
            <label
              htmlFor="sale-quantity"
              className="mb-2 block text-base font-medium text-mauve-600"
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
              placeholder="Enter quantity"
              className="h-14 w-full rounded-xl border border-mauve-600 bg-olive-100 px-4 text-base text-mauve-500 outline-none transition placeholder:text-mauve-300 focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200 disabled:cursor-not-allowed disabled:bg-olive-200 disabled:text-mauve-200"
            />

            <p className="mt-2 text-sm text-mauve-400">
              Enter a whole number greater than zero.
            </p>
          </div>
        </div>

        {/* Add product */}
        <div className="mt-4 flex justify-start">
          <button
            type="button"
            onClick={handleAddItem}
            disabled={
              saving || availableProducts.length === 0
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-mauve-600 bg-mauve-600 px-5 py-2 text-base font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Product
          </button>
        </div>

        {/* Selected products */}
        {items.length > 0 && (
          <div className="mt-6 min-w-0">
            <div className="space-y-3">
              {items.map((item) => {
                const product = products.find(
                  (product) => product.id === item.productId,
                );

                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="grid grid-cols-1 items-center gap-3 rounded-xl border border-olive-100 bg-olive-100 p-4 sm:grid-cols-[minmax(0,1fr)_110px_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium text-mauve-600">
                        {product.name}
                      </p>

                      <p className="mt-1 text-sm text-teal-900">
                        {Number(product.price).toLocaleString("en-EG", {
                          maximumFractionDigits: 2,
                        })} EGP per item
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`sale-item-quantity-${item.productId}`}
                        className="mb-1 block text-sm font-medium text-mauve-600"
                      >
                        Quantity
                      </label>

                      <input
                        id={`sale-item-quantity-${item.productId}`}
                        type="number"
                        min="1"
                        max={product.stock_quantity}
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(
                            item.productId,
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value),
                          )
                        }
                        disabled={saving}
                        className="h-11 w-full rounded-lg border border-mauve-600 bg-olive-50 px-3 text-mauve-500 outline-none focus:ring-2 focus:ring-mauve-200 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-mauve-600">
                        Subtotal
                      </p>

                      <p className="font-semibold text-mauve-600">
                        {(Number(product.price) * item.quantity).toLocaleString("en-EG", {
                          maximumFractionDigits: 2,
                        })} EGP
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveItem(item.productId)
                      }
                      disabled={saving}
                      className="min-h-11 rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-olive-300 pt-4">
              <p className="text-base font-semibold text-mauve-600">
                Total
              </p>

              <p className="text-xl font-bold text-mauve-600">
                {totalAmount.toLocaleString("en-EG", {
                  maximumFractionDigits: 2,
                })} EGP
              </p>
            </div>
          </div>
        )}

        {validationError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {validationError}
          </p>
        )}

        {/* Create sale */}
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-mauve-600 px-6 py-3 text-base font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none focus:ring-2 focus:ring-mauve-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-mauve/40 border-t-mauve-600"
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
