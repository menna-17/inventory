import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  createSale,
  getSales,
  type Sale,
} from "../services/salesService";

import { getProducts } from "../../products/services/productService";
import type { Product } from "../../products/types/product";

function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [quantity, setQuantity] = useState("");

  /*
   * Initial page load
   */
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [salesData, productsData] =
          await Promise.all([
            getSales(),
            getProducts(),
          ]);

        if (!isMounted) {
          return;
        }

        setSales(salesData);
        setProducts(productsData);
        setError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          "loadInitialData error:",
          error,
        );

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load sales.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Refresh sales and products after
   * creating a sale.
   */
  async function refreshSalesData() {
    try {
      const [salesData, productsData] =
        await Promise.all([
          getSales(),
          getProducts(),
        ]);

      setSales(salesData);
      setProducts(productsData);
      setError(null);
    } catch (error) {
      console.error(
        "refreshSalesData error:",
        error,
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to refresh sales.",
        );
      }
    }
  }

  async function handleCreateSale(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Please enter a valid positive whole number.",
      );

      return;
    }

    const selectedProduct = products.find(
      (product) =>
        product.id === selectedProductId,
    );

    if (!selectedProduct) {
      setError("Selected product was not found.");
      return;
    }

    if (
      parsedQuantity >
      selectedProduct.stock_quantity
    ) {
      setError(
        `Not enough stock. Available stock: ${selectedProduct.stock_quantity}.`,
      );

      return;
    }

    setIsSaving(true);

    try {
      await createSale({
        productId: selectedProductId,
        quantity: parsedQuantity,
      });

      setSelectedProductId("");
      setQuantity("");

      await refreshSalesData();
    } catch (error) {
      console.error(
        "create sale error:",
        error,
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create sale.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function formatPrice(price: number) {
    return Number(price).toFixed(2);
  }

  if (isLoading) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Sales
        </h1>

        <p
          className="mt-4 text-slate-600"
          aria-live="polite"
        >
          Loading sales...
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Sales
        </h1>

        <p className="mt-1 text-slate-600">
          Record sales and view your sales history.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Create Sale */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Create Sale
        </h2>

        <form
          onSubmit={handleCreateSale}
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
                disabled={isSaving}
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
                disabled={isSaving}
                placeholder="Enter quantity"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Creating Sale..."
              : "Create Sale"}
          </button>
        </form>
      </div>

      {/* Sales History */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Sales History
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            View previous sales and their dates.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Product
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Quantity
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Unit Price
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {sales.map((sale) => {
                  const item = sale.items[0];

                  if (!item) {
                    return (
                      <tr key={sale.id}>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-sm text-slate-500"
                        >
                          Sale has no items.
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={sale.id}>
                      {/* Product */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.product?.name ??
                          "Unknown Product"}
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {item.quantity}
                      </td>

                      {/* Unit Price */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        $
                        {formatPrice(
                          item.unit_price,
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        $
                        {formatPrice(
                          sale.total_amount,
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(
                          sale.created_at,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sales.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              No sales yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SalesPage;