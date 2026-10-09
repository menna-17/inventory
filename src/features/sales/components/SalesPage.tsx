
import SaleForm from "./SaleForm";
import SalesHistory from "./SalesHistory";

import { useSales } from "../hooks/useSales";

function SalesPage() {
  const {
    sales,
    products,
    loading,
    saving,
    error,
    submitSale,
    refresh,
  } = useSales();

  async function handleCreateSale(
    productId: string,
    quantity: number,
  ) {
    return submitSale({
      productId,
      quantity,
    });
  }

  if (loading) {
    return (
      <section
        className="min-w-0 space-y-6"
        aria-busy="true"
        aria-label="Loading sales"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sales
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Record sales and view your sales history.
          </p>
        </div>

        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-4 h-11 w-full rounded bg-slate-100" />
          <div className="mt-4 h-11 w-full rounded bg-slate-100" />
          <div className="mt-4 h-10 w-28 rounded bg-slate-200" />
        </div>

        <p className="text-sm text-slate-500" role="status">
          Loading sales...
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sales
        </h1>

        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Record sales and view your sales history.
        </p>
      </div>

      {/* Error and retry */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h2 className="font-semibold text-red-800">
              Something went wrong
            </h2>
            <p className="mt-1 break-words text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="min-h-11 shrink-0 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Reload sales
          </button>
        </div>
      )}

      {/* Create sale */}
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SaleForm
          products={products}
          saving={saving}
          onCreateSale={handleCreateSale}
        />
      </div>

      {/* Sales history */}
      <div className="min-w-0">
        <SalesHistory
          sales={sales}
          title="Sales History"
          description="View previous sales, who processed them, and their dates."
        />
      </div>
    </section>
  );
}

export default SalesPage;
