
import { useState } from "react";

import type { Sale } from "../types/sales";
import SalesFilters from "./SalesFilters";

type SalesHistoryProps = {
  sales: Sale[];
  title?: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  showFilters?: boolean;
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
      className="h-10 w-10 shrink-0 rounded-lg border border-olive-100 bg-olive-100 "
    />
  );
}

function SalesHistory({
  sales,
  title = "Sales History",
  titleClassName = "text-xl font-bold text-mauve-600",
  showFilters = false,
  employeeSearch = "",
  selectedDate = "",
  onEmployeeSearchChange,
  onDateChange,
  onClearFilters,
  totalFilteredCount = 0,
}: SalesHistoryProps) {
  return (
    <section className="relative mt-1 min-w-0 space-y-4 pb-6">
      {/* Header */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={titleClassName}>{title}</h2>

          {sales.length > 0 && (
            <span className="shrink-0 rounded-full bg-mauve-600 px-3 py-1 text-xs font-semibold text-olive-50">
              {sales.length} {sales.length === 1 ? "sale" : "sales"} on this page
            </span>
          )}
        </div>
      </div>

      {/* Sales filters - directly below the heading and description */}
      {showFilters && (
        <SalesFilters
          employeeSearch={employeeSearch}
          selectedDate={selectedDate}
          onEmployeeSearchChange={onEmployeeSearchChange}
          onDateChange={onDateChange}
          onClearFilters={onClearFilters}
          totalFilteredCount={totalFilteredCount}
        />
      )}

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
            No sales yet
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-mauve-600">
            Completed sales will appear here when a sale is processed.
          </p>
        </div>
      ) : (
        <div className="min-w-0 rounded-xl border border-olive-100 bg-olive-100 shadow-sm">
          {/* Mobile cards */}
          <div className="flex min-w-0 flex-col divide-y divide-olive-300 py-2 md:hidden">
            {sales.map((sale) => (
              <article
                key={sale.id}
                className="block w-full min-w-0 space-y-4 overflow-visible bg-olive-100 px-4 py-5"
              >
                {/* Sale title and total */}
                <div className="flex min-w-0 flex-col gap-2 min-[360px]:flex-row min-[360px]:items-start min-[360px]:justify-between">
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

                  <p className="break-words text-base font-bold text-mauve-600 min-[360px]:shrink-0">
                    {formatPrice(sale.total_amount)}
                  </p>
                </div>

                {/* Sale items */}
                <div className="flex min-w-0 flex-col gap-3">
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
                          className="flex w-full min-w-0 items-start gap-3 rounded-lg bg-olive-200 p-3"
                        >
                          <ProductThumbnail
                            imageUrl={item.product?.image_url}
                            productName={productName}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-mauve-600">
                              {productName}
                            </p>

                            <div className="mt-1 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-teal-900">
                              <span>Qty: {item.quantity}</span>

                              <span className="break-words">
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
                <dl className="grid w-full min-w-0 grid-cols-1 gap-3 pt-3 text-sm min-[360px]:grid-cols-2">
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
            <table className="w-full table-auto divide-y divide-olive-100 text-sm">
              <thead className="bg-olive-200">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-teal-900">
                    Product
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-teal-900">
                    Quantity
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-teal-900">
                    Unit Price
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-teal-900">
                    Sale Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-teal-900">
                    Processed By
                  </th>
                  <th className="w-1 whitespace-nowrap px-4 py-3 text-center font-semibold text-teal-900">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-olive-200">
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="align-top transition hover:bg-olive-50"
                  >
                    {/* Products in this sale */}
                    <td className="px-4 py-4 text-teal-900">
                      {sale.items.length === 0 ? (
                        <span>Sale has no items.</span>
                      ) : (
                        <div className="flex min-w-0 flex-col gap-3">
                          {sale.items.map((item, index) => {
                            const productName =
                              item.product?.name ?? "Unknown Product";

                            return (
                              <div
                                key={`${sale.id}-${item.product_id}-${index}`}
                                className="flex min-w-0 items-center gap-3"
                              >
                                <ProductThumbnail
                                  imageUrl={item.product?.image_url}
                                  productName={productName}
                                />

                                <span className="break-words font-medium">
                                  {productName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Quantities */}
                    <td className="px-4 py-4 text-center text-mauve-600">
                      <div className="flex flex-col gap-3">
                        {sale.items.map((item, index) => (
                          <span
                            key={`${sale.id}-quantity-${item.product_id}-${index}`}
                            className="flex min-h-10 items-center justify-center"
                          >
                            {item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Unit prices */}
                    <td className="px-4 py-4 text-center text-teal-900">
                      <div className="flex flex-col gap-3">
                        {sale.items.map((item, index) => (
                          <span
                            key={`${sale.id}-price-${item.product_id}-${index}`}
                            className="flex min-h-10 items-center justify-center whitespace-nowrap"
                          >
                            {formatPrice(item.unit_price)}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Sale total appears once */}
                    <td className="whitespace-nowrap px-4 py-4 text-center align-middle font-semibold text-mauve-600">
                      {formatPrice(sale.total_amount)}
                    </td>

                    {/* Employee appears once */}
                    <td className="px-4 py-4 text-center align-middle text-teal-900">
                      {sale.user?.full_name ?? "Unknown User"}
                    </td>

                    {/* Date appears once */}
                    <td className="whitespace-nowrap px-4 py-4 text-center align-middle text-mauve-600">
                      {formatDate(sale.created_at)}
                    </td>
                  </tr>
                ))}
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
