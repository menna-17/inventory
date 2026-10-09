
import type { StockMovement } from "../types/inventory";

type StockMovementHistoryProps = {
  movements: StockMovement[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleString();
}

function StockMovementHistory({
  movements,
  isLoading,
  error,
  onRetry,
}: StockMovementHistoryProps) {
  return (
    <section className="mt-8 min-w-0">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Stock Movement History
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Track when stock was added or removed and who made the change.
        </p>
      </div>

      {isLoading && (
        <div
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
          aria-busy="true"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <p className="sr-only" aria-live="polite">
            Loading stock history...
          </p>
        </div>
      )}

      {!isLoading && error && (
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
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
          <p className="font-medium text-slate-900">
            No stock movements yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Stock additions and removals will appear here.
          </p>
        </div>
      )}

      {!isLoading && !error && movements.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Mobile cards */}
          <div className="divide-y divide-slate-200 md:hidden">
            {movements.map((movement) => (
              <article
                key={movement.id}
                className="space-y-3 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words font-medium text-slate-900">
                    {movement.product?.name ?? "Unknown Product"}
                  </h3>

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
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-slate-500">Quantity</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {movement.quantity}
                    </dd>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-slate-500">User</dt>
                    <dd className="mt-1 break-words font-medium text-slate-900">
                      {movement.user?.full_name ?? "Unknown User"}
                    </dd>
                  </div>
                </dl>

                <p className="text-xs text-slate-500">
                  {formatDate(movement.created_at)}
                </p>
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="max-w-xs break-words px-6 py-4 text-sm font-medium text-slate-900">
                      {movement.product?.name ?? "Unknown Product"}
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

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {movement.quantity}
                    </td>

                    <td className="max-w-xs break-words px-6 py-4 text-sm text-slate-700">
                      {movement.user?.full_name ?? "Unknown User"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(movement.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default StockMovementHistory;
