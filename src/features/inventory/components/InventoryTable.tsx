import type { InventoryItem } from "../types/inventory";

type InventoryTableProps = {
  items: InventoryItem[];
  onAdjustStock: (item: InventoryItem) => void;
};

function getStockStatus(
  stockQuantity: number,
  minimumStock: number,
) {
  if (stockQuantity === 0) {
    return {
      label: "Out of Stock",
      className:
        "bg-red-100 text-red-700",
    };
  }

  if (stockQuantity <= minimumStock) {
    return {
      label: "Low Stock",
      className:
        "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "In Stock",
    className:
      "bg-green-100 text-green-700",
  };
}

function InventoryTable({
  items,
  onAdjustStock,
}: InventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Product
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Stock
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Minimum Stock
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {items.map((item) => {
              const status = getStockStatus(
                item.stock_quantity,
                item.minimum_stock,
              );

              return (
                <tr key={item.id}>
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

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onAdjustStock(item)
                      }
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="p-6 text-center text-sm text-slate-500">
          No inventory items found.
        </div>
      )}
    </div>
  );
}

export default InventoryTable;