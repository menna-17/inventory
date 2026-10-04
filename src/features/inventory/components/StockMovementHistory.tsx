import type { StockMovement } from "../services/stockMovementService";

type StockMovementHistoryProps = {
  movements: StockMovement[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

function formatDate(
  date: string,
) {
  return new Date(
    date,
  ).toLocaleString();
}

function StockMovementHistory({
  movements,
  isLoading,
  error,
  onRetry,
}: StockMovementHistoryProps) {
  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Stock Movement History
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Track when stock was added or removed.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p
            className="text-sm text-slate-600"
            aria-live="polite"
          >
            Loading stock history...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>
            Failed to load stock movement
            history.
          </p>

          <p className="mt-1">
            {error}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* History table */}
      {!isLoading && !error && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Product
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Quantity
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {movements.map(
                  (movement) => (
                    <tr
                      key={
                        movement.id
                      }
                    >
                      {/* Product */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {movement.product
                          ?.name ??
                          "Unknown Product"}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            movement.movement_type ===
                            "add"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {movement.movement_type ===
                          "add"
                            ? "Added"
                            : "Removed"}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {
                          movement.quantity
                        }
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(
                          movement.created_at,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {movements.length ===
            0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              No stock movements yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockMovementHistory;