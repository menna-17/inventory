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

  const [quantity, setQuantity] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);

    const success = await onCreateSale(
      selectedProductId,
      parsedQuantity,
    );

    if (success) {
      setSelectedProductId("");
      setQuantity("");
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Create Sale
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        Record a sale and automatically update
        inventory.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Product */}
          <div>
            <label
              htmlFor="sale-product"
              className="block text-sm font-medium text-slate-700"
            >
              Product
            </label>

            <select
              id="sale-product"
              value={selectedProductId}
              onChange={(event) =>
                setSelectedProductId(
                  event.target.value,
                )
              }
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
            >
              <option value="">
                Select a product
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={
                    product.stock_quantity === 0
                  }
                >
                  {product.name} — Stock:{" "}
                  {product.stock_quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="sale-quantity"
              className="block text-sm font-medium text-slate-700"
            >
              Quantity
            </label>

            <input
              id="sale-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              disabled={saving}
              placeholder="Enter quantity"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Creating Sale..."
            : "Create Sale"}
        </button>
      </form>
    </div>
  );
}

export default SaleForm;