
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
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Low Stock
          </h2>

          <p className="mt-1 text-sm text-slate-500">
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6 text-emerald-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            All stock levels look good
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            There are no products currently below their minimum stock level.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile-friendly product cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {products.map((product) => (
              <article
                key={product.id}
                className="space-y-3 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words font-medium text-slate-900">
                    {product.name}
                  </h3>

                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                    Low stock
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">
                      Current stock
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">
                      {product.stock_quantity}
                    </dd>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">
                      Minimum stock
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">
                      {product.minimum_stock}
                    </dd>
                  </div>
                </dl>

                {canAdjustStock && (
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(product.id)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold text-slate-600">
                    Product
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 font-semibold text-slate-600">
                    Current Stock
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 font-semibold text-slate-600">
                    Minimum Stock
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 font-semibold text-slate-600">
                    Status
                  </th>

                  {canAdjustStock && (
                    <th className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-600">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="max-w-xs break-words px-5 py-4 font-medium text-slate-900">
                      {product.name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {product.stock_quantity}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {product.minimum_stock}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                        Low stock
                      </span>
                    </td>

                    {canAdjustStock && (
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(product.id)}
                          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
