import type { Sale } from "../types/sales";

type SalesHistoryProps = {
  sales: Sale[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatPrice(price: number) {
  return Number(price).toFixed(2);
}

function SalesHistory({
  sales,
}: SalesHistoryProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Sales History
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          View previous sales and their dates.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Product
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Quantity
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unit Price
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {sales.map((sale) => {
                const item = sale.items[0];

                if (!item) {
                  return (
                    <tr key={sale.id}>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-sm text-slate-500"
                      >
                        Sale has no items.
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {item.product?.name ??
                        "Unknown Product"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      $
                      {formatPrice(
                        item.unit_price,
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      $
                      {formatPrice(
                        sale.total_amount,
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        sale.created_at,
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sales.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">
            No sales yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesHistory;