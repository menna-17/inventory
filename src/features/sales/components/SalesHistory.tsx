
import type { Sale } from "../types/sales";

type SalesHistoryProps = {
  sales: Sale[];
  title?: string;
  description?: string;
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number) {
  return Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SalesHistory({
  sales,
  title = "Sales History",
  description = "View previous sales, who processed them, and their dates.",
}: SalesHistoryProps) {
  return (
    <section className="mt-8 min-w-0 space-y-4">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>

          {sales.length > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {sales.length} {sales.length === 1 ? "sale" : "sales"}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-slate-600">
          {description}
        </p>
      </div>

      {/* Empty state */}
      {sales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"
              />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </div>

          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            No sales yet
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Completed sales will appear here when a sale is processed.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {sales.map((sale) => (
              <article key={sale.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Sale
                    </p>
                    <p className="mt-1 break-words font-semibold text-slate-900">
                      {sale.items.length === 1
                        ? sale.items[0].product?.name ?? "Unknown Product"
                        : `${sale.items.length} products`}
                    </p>
                  </div>

                  <p className="shrink-0 text-base font-bold text-slate-900">
                    ${formatPrice(sale.total_amount)}
                  </p>
                </div>

                <div className="space-y-3">
                  {sale.items.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      This sale has no items.
                    </p>
                  ) : (
                    sale.items.map((item, index) => (
                      <div
                        key={`${sale.id}-${item.product?.name ?? "item"}-${index}`}
                        className="rounded-lg bg-slate-50 p-3"
                      >
                        <p className="break-words text-sm font-medium text-slate-800">
                          {item.product?.name ?? "Unknown Product"}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Qty: {item.quantity}</span>
                          <span>
                            Unit price: ${formatPrice(item.unit_price)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">
                      Processed by
                    </dt>
                    <dd className="mt-1 break-words font-medium text-slate-800">
                      {sale.user?.full_name ?? "Unknown User"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">
                      Date
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {formatDate(sale.created_at)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {/* Tablet and desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                    Product
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                    Quantity
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                    Unit Price
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                    Sale Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                    Processed By
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) =>
                  sale.items.length === 0 ? (
                    <tr key={sale.id}>
                      <td
                        colSpan={6}
                        className="px-4 py-4 text-slate-500"
                      >
                        Sale has no items.
                      </td>
                    </tr>
                  ) : (
                    sale.items.map((item, index) => (
                      <tr
                        key={`${sale.id}-${item.product?.name ?? "item"}-${index}`}
                        className="align-top transition hover:bg-slate-50/70"
                      >
                        <td className="max-w-xs break-words px-4 py-4 font-medium text-slate-900">
                          {item.product?.name ?? "Unknown Product"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {item.quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          ${formatPrice(item.unit_price)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">
                          {index === 0
                            ? `$${formatPrice(sale.total_amount)}`
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {sale.user?.full_name ?? "Unknown User"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {formatDate(sale.created_at)}
                        </td>
                      </tr>
                    ))
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-500">
              Showing {sales.length} {sales.length === 1 ? "sale" : "sales"}.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default SalesHistory;
