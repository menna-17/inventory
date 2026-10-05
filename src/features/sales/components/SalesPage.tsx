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
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Sales
        </h1>

        <p
          className="mt-4 text-slate-600"
          aria-live="polite"
        >
          Loading sales...
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Sales
        </h1>

        <p className="mt-1 text-slate-600">
          Record sales and view your sales history.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Create Sale */}
      <SaleForm
        products={products}
        saving={saving}
        onCreateSale={handleCreateSale}
      />

      {/* Sales History */}
      <SalesHistory sales={sales} />
    </section>
  );
}

export default SalesPage;