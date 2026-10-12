import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../app/providers/useAuth";

import type { LowStockProduct } from "../types/dashboard";

type LowStockSectionProps = {
  products: LowStockProduct[];
};

function LowStockSection({
  products,
}: LowStockSectionProps) {
  const navigate = useNavigate();
  const { role } = useAuth();

  const canAdjustStock =
    role === "owner" || role === "manager";

  function handleAdjustStock(productId: string) {
    navigate(
      `/inventory?productId=${encodeURIComponent(productId)}`,
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-olive-100 bg-olive-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-olive-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-xl font-bold text-mauve-600">
            Low Stock
          </h2>

          <p className="mt-1 text-sm text-mauve-600">
            Products that need attention.
          </p>
        </div>

        {products.length > 0 && (
          <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"}
          </span>
        )}
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-900">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6 text-olive-50"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <h3 className="mt-3 text-sm font-semibold text-mauve-600">
            All stock levels look good
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-mauve-600">
            There are no products currently at or below their minimum stock level.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile-friendly product cards */}
          <div className="divide-y divide-olive-100 md:hidden">
            {products.map((product) => (
              <article
                key={product.id}
                className="space-y-3 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words font-medium text-mauve-600">
                    {product.name}
                  </h3>

                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                    Low stock
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-olive-100 p-3">
                    <dt className="text-xs text-teal-900">
                      Current stock
                    </dt>

                    <dd className="mt-1 text-lg font-semibold text-mauve-600">
                      {product.stock_quantity}
                    </dd>
                  </div>

                  <div className="rounded-lg bg-olive-100 p-3">
                    <dt className="text-xs text-teal-900">
                      Minimum stock
                    </dt>

                    <dd className="mt-1 text-lg font-semibold text-mauve-600">
                      {product.minimum_stock}
                    </dd>
                  </div>
                </dl>

                {canAdjustStock && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAdjustStock(product.id)
                    }
                    className="min-h-11 w-full rounded-lg border border-mauve-600 bg-mauve-600 px-4 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 "
                  >
                    Adjust Stock
                  </button>
                )}
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Products at or below their minimum stock levels
              </caption>

              <thead className="bg-olive-200">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 text-center font-semibold text-teal-900">
                    Product
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-center font-semibold text-teal-900">
                    Current Stock
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-center font-semibold text-teal-900">
                    Minimum Stock
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 font-semibold text-teal-900">
                    Status
                  </th>

                  {canAdjustStock && (
                    <th className="whitespace-nowrap px-5 py-3 text-center font-semibold text-teal-900">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-olive-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-olive-100"
                  >
                    <td className="max-w-xs break-words px-5 py-4 text-center font-medium text-mauve-600">
                      {product.name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-center text-mauve-600">
                      {product.stock_quantity}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-center text-mauve-600">
                      {product.minimum_stock}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                        Low stock
                      </span>
                    </td>

                    {canAdjustStock && (
                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustStock(product.id)
                          }
                          className="min-h-10 rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 "
                        >
                          Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default LowStockSection;