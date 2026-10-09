
import { useAuth } from "../../../app/providers/useAuth";
import type { InventoryItem } from "../types/inventory";

type InventoryTableProps = {
  items: InventoryItem[];
  onAdjustStock: (item: InventoryItem) => void;
};

function getStockStatus(
  stockQuantity: number,
  minimumStock: number,
) {
  if (stockQuantity <= 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (stockQuantity <= minimumStock) {
    return {
      label: "Low Stock",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    label: "In Stock",
    className: "bg-green-100 text-green-700",
  };
}

function InventoryTable({
  items,
  onAdjustStock,
}: InventoryTableProps) {
  const { role } = useAuth();

  const canAdjustStock =
    role === "owner" || role === "manager";

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
        <p className="font-medium text-slate-900">
          No inventory items found
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Products will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Mobile cards */}
      <div className="divide-y divide-slate-200 md:hidden">
        {items.map((item) => {
          const status = getStockStatus(
            item.stock_quantity,
            item.minimum_stock,
          );

          return (
            <article
              key={item.id}
              className="space-y-3 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900">
                  {item.name}
                </h3>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Current stock
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {item.stock_quantity}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Minimum stock
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {item.minimum_stock}
                  </p>
                </div>
              </div>

              {canAdjustStock && (
                <button
                  type="button"
                  onClick={() => onAdjustStock(item)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Adjust Stock
                </button>
              )}
            </article>
          );
        })}
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
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Minimum Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              {canAdjustStock && (
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {items.map((item) => {
              const status = getStockStatus(
                item.stock_quantity,
                item.minimum_stock,
              );

              return (
                <tr
                  key={item.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.stock_quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.minimum_stock}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  {canAdjustStock && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onAdjustStock(item)}
                        className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryTable;
