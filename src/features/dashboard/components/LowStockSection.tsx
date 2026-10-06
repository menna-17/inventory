import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../app/providers/useAuth";

import type {
  LowStockProduct,
} from "../types/dashboard";

type LowStockSectionProps = {
  products: LowStockProduct[];
};

function LowStockSection({
  products,
}: LowStockSectionProps) {
  const navigate = useNavigate();

  const { role } = useAuth();

  /*
   * Only Owner and Manager can adjust stock.
   *
   * Staff can see low-stock products, but they
   * cannot manually change inventory.
   */
  const canAdjustStock =
    role === "owner" ||
    role === "manager";

  return (
    <div className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Low Stock
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Products that need attention.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          No low-stock products.
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
                  Current Stock
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Minimum Stock
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Status
                </th>

                {canAdjustStock && (
                  <th className="px-5 py-3 text-right font-medium text-slate-600">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  {/* Product */}
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {product.name}
                  </td>

                  {/* Current stock */}
                  <td className="px-5 py-4 text-slate-700">
                    {product.stock_quantity}
                  </td>

                  {/* Minimum stock */}
                  <td className="px-5 py-4 text-slate-700">
                    {product.minimum_stock}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                      Low Stock
                    </span>
                  </td>

                  {/* Action */}
                  {canAdjustStock && (
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/inventory?productId=${encodeURIComponent(
                              product.id,
                            )}`,
                          )
                        }
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LowStockSection;