
import { useEffect, useRef,useState  } from "react";

import type { StockMovement } from "../types/inventory";
import Pagination from "./Pagination";

type StockMovementHistoryProps = {
  movements: StockMovement[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleString();
}

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl?: string | null;
  productName: string;
}) {
  const [imageFailed, setImageFailed] =useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-olive-200 bg-olive-200 text-xs font-semibold text-teal-900"
        aria-label={`No image available for ${productName}`}
        title="No image available"
      >
        {productName.slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="h-10 w-10 shrink-0 rounded-lg border border-olive-200 bg-white object-cover"
    />
  );
}

function StockMovementHistory({
  movements,
  isLoading,
  error,
  onRetry,
  page,
  totalPages,
  totalCount,
  onPageChange,
}: StockMovementHistoryProps) {
  const historyRef = useRef<HTMLElement>(null);
  const previousPageRef = useRef(page);
  const shouldScrollRef = useRef(false);

  function handlePageChange(nextPage: number) {
    if (nextPage === page) return;

    shouldScrollRef.current = true;
    onPageChange(nextPage);
  }

  useEffect(() => {
    if (
      !shouldScrollRef.current ||
      isLoading ||
      error ||
      page === previousPageRef.current
    ) {
      return;
    }

    shouldScrollRef.current = false;
    previousPageRef.current = page;

    window.requestAnimationFrame(() => {
      historyRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [page, isLoading, error]);

  // Keep the remembered page in sync when the page changes externally.
  useEffect(() => {
    if (!shouldScrollRef.current) {
      previousPageRef.current = page;
    }
  }, [page]);

  return (
    <section
      ref={historyRef}
      className="mt-8 min-w-0 scroll-mt-24"
      aria-busy={isLoading}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-mauve-600">
          Stock Movement History
        </h2>

        <p className="mt-1 text-sm text-mauve-600">
          Track when stock was added or removed and who made the change.
        </p>
      </div>

      {isLoading && movements.length === 0 && !error && (
        <div
          className="space-y-3 rounded-xl border border-olive-100 bg-olive-100 p-4 sm:p-6"
          aria-busy="true"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-olive-200" />
          <div className="h-12 animate-pulse rounded-lg bg-olive-100" />
          <div className="h-12 animate-pulse rounded-lg bg-olive-100" />

          <p className="sr-only" aria-live="polite">
            Loading stock history...
          </p>
        </div>
      )}

      {error && movements.length === 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">
            Failed to load stock movement history.
          </p>

          <p className="mt-1 break-words">{error}</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-11 w-full rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && movements.length === 0 && (
        <div className="rounded-xl border border-olive-100 bg-olive-100 px-4 py-10 text-center">
          <p className="font-medium text-mauve-600">
            No stock movements yet
          </p>

          <p className="mt-1 text-sm text-mauve-600">
            Stock additions and removals will appear here.
          </p>
        </div>
      )}

      {movements.length > 0 && (
        <>
          {error && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              The latest history could not be loaded. The previously loaded
              movements are still displayed.

              <button
                type="button"
                onClick={onRetry}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div
            className={`overflow-hidden rounded-xl border border-olive-100 bg-olive-100 ${
              isLoading ? "opacity-75" : ""
            }`}
          >
            {/* Mobile cards */}
            <div className="divide-y divide-olive-200 md:hidden">
              {movements.map((movement) => {
                const productName =
                  movement.product?.name ?? "Unknown Product";

                return (
                  <article
                    key={movement.id}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductThumbnail
                          imageUrl={movement.product?.image_url}
                          productName={productName}
                        />

                        <h3 className="min-w-0 break-words font-medium text-mauve-600">
                          {productName}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          movement.movement_type === "add"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {movement.movement_type === "add"
                          ? "Added"
                          : "Removed"}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-olive-200 p-3">
                        <dt className="text-teal-900">Quantity</dt>

                        <dd className="mt-1 font-semibold text-mauve-600">
                          {movement.quantity}
                        </dd>
                      </div>

                      <div className="rounded-lg bg-olive-200 p-3">
                        <dt className="text-teal-900">User</dt>

                        <dd className="mt-1 break-words font-medium text-mauve-600">
                          {movement.user?.full_name ?? "Unknown User"}
                        </dd>
                      </div>
                    </dl>

                    <p className="text-xs text-teal-900">
                      {formatDate(movement.created_at)}
                    </p>
                  </article>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-olive-200">
                <thead className="bg-olive-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                      Product
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                      Action
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                      Quantity
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                      User
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-olive-200">
                  {movements.map((movement) => {
                    const productName =
                      movement.product?.name ?? "Unknown Product";

                    return (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-olive-50"
                      >
                        <td className="max-w-xs break-words px-6 py-4 text-sm font-medium text-teal-900">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail
                              imageUrl={movement.product?.image_url}
                              productName={productName}
                            />

                            <span>{productName}</span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              movement.movement_type === "add"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {movement.movement_type === "add"
                              ? "Added"
                              : "Removed"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-mauve-600">
                          {movement.quantity}
                        </td>

                        <td className="max-w-xs break-words px-6 py-4 text-sm text-teal-900">
                          {movement.user?.full_name ?? "Unknown User"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-mauve-600">
                          {formatDate(movement.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Numbered pagination */}
          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={10}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </section>
  );
}

export default StockMovementHistory;
