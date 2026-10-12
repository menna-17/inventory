
import { useState } from "react";

import type { Sale } from "../types/sales";

type SalesHistoryProps = {
  sales: Sale[];
  title?: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  employeeSearch?: string;
  selectedDate?: string;
  onEmployeeSearchChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
  onClearFilters?: () => void;
  totalFilteredCount?: number;
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
  return `${Number(price).toLocaleString("en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} EGP`;
}

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl: string | null | undefined;
  productName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        aria-label={`No image available for ${productName}`}
        title="No image available"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-olive-200 bg-olive-200 text-sm font-semibold text-teal-900"
      >
        {productName.trim().slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="h-10 w-10 shrink-0 rounded-lg border border-olive-200 bg-olive-100 "
    />
  );
}

function SalesHistory({
  sales,
  title = "Sales History",
  description = "View previous sales, who processed them, and their dates.",
  titleClassName = "text-xl font-bold text-mauve-600",
  descriptionClassName = "mt-1 text-sm text-mauve-600",
  employeeSearch = "",
  selectedDate = "",
  onEmployeeSearchChange,
  onDateChange,
  onClearFilters,
  totalFilteredCount = 0,
}: SalesHistoryProps) {
  const hasActiveFilters = Boolean(
    employeeSearch.trim() || selectedDate,
  );



  return (
    <section className="relative mt-1 min-w-0 space-y-4 pb-6">
      {/* Header */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={titleClassName}>{title}</h2>

          {sales.length > 0 && (
            <span className="shrink-0 rounded-full bg-mauve-600 px-3 py-1 text-xs font-semibold text-olive-50">
              {sales.length} {sales.length === 1 ? "sale" : "sales"}
            </span>
          )}
        </div>

        <p className={descriptionClassName}>{description}</p>
      </div>

      {/* Filters directly below the Sales History heading */}
      <div className="rounded-xl border border-olive-100 bg-olive-100 p-4 shadow-sm sm:p-5">
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Search by employee name */}
          <div className="min-w-0">
            <label
              htmlFor="sales-employee-search"
              className="mb-1.5 block text-sm font-medium text-mauve-600"
            >
              Search by employee name
            </label>

            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-mauve-600"
              >
                <circle cx="11" cy="11" r="7" />
                <path
                  strokeLinecap="round"
                  d="m16 16 4 4"
                />
              </svg>

              <input
                id="sales-employee-search"
                type="search"
                value={employeeSearch}
                onChange={(event) =>
                  onEmployeeSearchChange(event.target.value)
                }
                placeholder="Enter employee name..."
                className="min-h-11 w-full rounded-lg border border-mauve-500 bg-olive-100 py-2 pl-10 pr-3 text-sm text-mauve-500 outline-none transition placeholder:text-mauve-500 focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200"
              />
            </div>
          </div>

          {/* Search by date */}
          <div className="min-w-0">
            <label
              htmlFor="sales-date-search"
              className="mb-1.5 block text-sm font-medium text-mauve-600"
            >
              Search by date
            </label>

            <input
              id="sales-date-search"
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-mauve-600 bg-olive-100 px-3 py-2 text-sm text-mauve-500 outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3  pt-3">
            <p className="text-sm text-teal-900" aria-live="polite">
              {totalFilteredCount}{" "}
              {totalFilteredCount === 1 ? "sale" : "sales"} found
            </p>

            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-10 rounded-lg border border-mauve-600 bg-mauve-600 px-4 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none  "
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {sales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-olive-100 bg-olive-100 px-4 py-10 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mauve-600">
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
                d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"
              />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </div>

          <h3 className="mt-3 text-sm font-semibold text-mauve-600">
            {hasActiveFilters ? "No matching sales" : "No sales yet"}
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-teal-900">
            {hasActiveFilters
              ? "Try a different employee name or date, or clear the filters to see all sales."
              : "Completed sales will appear here when a sale is processed."}
          </p>
        </div>
      ) : (
        <div className="min-w-0 rounded-xl border border-olive-100 bg-olive-100 shadow-sm">
          {/* Mobile cards */}
          <div className="min-w-0 divide-y divide-olive-100 py-2 md:hidden">
            {sales.map((sale) => (
              <article
                key={sale.id}
                className="min-w-0 space-y-4 px-4 py-5"
              >
                {/* Sale title and total */}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-teal-900">
                      Sale
                    </p>

                    <p className="mt-1 break-words font-semibold text-mauve-600">
                      {sale.items.length === 1
                        ? sale.items[0].product?.name ?? "Unknown Product"
                        : `${sale.items.length} products`}
                    </p>
                  </div>

                  <p className="shrink-0 text-base font-bold text-mauve-600">
                    {formatPrice(sale.total_amount)}
                  </p>
                </div>

                {/* Sale items */}
                <div className="min-w-0 space-y-3">
                  {sale.items.length === 0 ? (
                    <p className="text-sm text-teal-900">
                      This sale has no items.
                    </p>
                  ) : (
                    sale.items.map((item, index) => {
                      const productName =
                        item.product?.name ?? "Unknown Product";

                      return (
                        <div
                          key={`${sale.id}-${item.product?.name ?? "item"}-${index}`}
                          className="flex min-w-0 items-center gap-3 rounded-lg bg-olive-200 p-3"
                        >
                          <ProductThumbnail
                            imageUrl={item.product?.image_url}
                            productName={productName}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-mauve-600">
                              {productName}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-teal-900">
                              <span>Qty: {item.quantity}</span>

                              <span>
                                Unit price: {formatPrice(item.unit_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sale details */}
                <dl className="grid min-w-0 grid-cols-1 gap-3 border-t border-olive-300 pt-3 text-sm min-[360px]:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-xs text-teal-900">
                      Processed by
                    </dt>

                    <dd className="mt-1 break-words font-medium text-mauve-600">
                      {sale.user?.full_name ?? "Unknown User"}
                    </dd>
                  </div>

                  <div className="min-w-0">
                    <dt className="text-xs text-teal-900">Date</dt>

                    <dd className="mt-1 break-words text-mauve-600">
                      {formatDate(sale.created_at)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {/* Tablet and desktop table */}
          <div className="hidden max-w-full overflow-x-auto rounded-xl md:block">
       
<table className="min-w-full divide-y divide-olive-100 text-sm">
  <thead className="bg-olive-200">
    <tr>
      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
        Product
      </th>
      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
        Quantity
      </th>
      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
        Unit Price
      </th>
      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
        Sale Total
      </th>
      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
        Processed By
      </th>
      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
        Date
      </th>
    </tr>
  </thead>

  <tbody className="divide-y divide-olive-100">
    {sales.map((sale) =>
      sale.items.length === 0 ? (
        <tr key={sale.id}>
          <td colSpan={6} className="px-4 py-4 text-teal-900">
            Sale has no items.
          </td>
        </tr>
      ) : (
        sale.items.map((item, index) => {
          const productName = item.product?.name ?? "Unknown Product";

          return (
            <tr
              key={`${sale.id}-${item.product?.name ?? "item"}-${index}`}
              className="align-middle transition hover:bg-olive-50"
            >
              <td className="max-w-xs break-words px-4 py-4 font-medium text-teal-900">
                <div className="flex items-center gap-3">
                  <ProductThumbnail
                    imageUrl={item.product?.image_url}
                    productName={productName}
                  />

                  <span className="break-words">{productName}</span>
                </div>
              </td>

              <td className="whitespace-nowrap px-4 py-4 align-middle text-mauve-600">
                {item.quantity}
              </td>

              <td className="whitespace-nowrap px-4 py-4 align-middle text-teal-900">
                {formatPrice(item.unit_price)}
              </td>

              <td className="whitespace-nowrap px-4 py-4 align-middle font-medium text-mauve-600">
                {index === 0 ? formatPrice(sale.total_amount) : "—"}
              </td>

              <td className="whitespace-nowrap px-4 py-4 align-middle text-teal-900">
                {sale.user?.full_name ?? "Unknown User"}
              </td>

              <td className="whitespace-nowrap px-4 py-4 align-middle text-mauve-600">
                {formatDate(sale.created_at)}
              </td>
            </tr>
          );
        })
      ),
    )}
  </tbody>
</table>

          </div>

          {/* Footer */}
          <div className="border-t border-olive-200 bg-olive-200 px-4 py-3 sm:px-5">
            <p className="text-xs text-teal-900">
              Showing {sales.length}{" "}
              {sales.length === 1
                ? "sale on this page."
                : "sales on this page."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default SalesHistory;
