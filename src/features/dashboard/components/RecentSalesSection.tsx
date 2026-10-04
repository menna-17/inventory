import type {
  RecentSale,
} from "../types/dashboard";

type RecentSalesSectionProps = {
  sales: RecentSale[];
};

function RecentSalesSection({
  sales,
}: RecentSalesSectionProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Sales
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your latest sales transactions.
        </p>
      </div>

      {sales.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          No sales yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-3 font-medium text-slate-600">
                  Product
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Quantity
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Unit Price
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Total
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {sales.map(
                (sale, index) => {
                  const isEmptySale =
                    sale.quantity ===
                    0;

                  return (
                    <tr
                      key={`${sale.id}-${index}`}
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {
                          sale.product_name
                        }
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {isEmptySale
                          ? "—"
                          : sale.quantity}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {isEmptySale
                          ? "—"
                          : `$${sale.unit_price.toFixed(
                              2,
                            )}`}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {isEmptySale
                          ? `$${sale.total_amount.toFixed(
                              2,
                            )}`
                          : `$${(
                              sale.unit_price *
                              sale.quantity
                            ).toFixed(
                              2,
                            )}`}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(
                          sale.created_at,
                        ).toLocaleString()}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentSalesSection;