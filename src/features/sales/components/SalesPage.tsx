
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";

import SaleForm from "./SaleForm";
import SalesHistory from "./SalesHistory";

import { useSales } from "../hooks/useSales";
import type { CreateSaleItemInput } from "../types/sales";

import Pagination from "../../../components/ui/Pagination";

const PAGE_SIZE = 10;

function SalesPage() {
const {
  sales,
  products,
  categories,
  loading,
  saving,
  error,
  submitSale,
  refresh,
} = useSales();

  const [searchParams, setSearchParams] = useSearchParams();
  const salesHistoryRef = useRef<HTMLDivElement>(null);

  const parsedPage = Number(searchParams.get("page"));
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const employeeSearch = searchParams.get("employee") ?? "";
  const selectedDate = searchParams.get("date") ?? "";

  function updateUrlState(
    updates: Record<string, string>,
    replace = true,
  ) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams, { replace });
  }

  // Filter sales by employee name.
  const normalizedEmployeeSearch = employeeSearch.trim().toLowerCase();

  const nameFilteredSales = normalizedEmployeeSearch
    ? sales.filter((sale) =>
        (sale.user?.full_name ?? "")
          .toLowerCase()
          .includes(normalizedEmployeeSearch),
      )
    : sales;

  // Filter sales by the selected local calendar date.
  const filteredSales = selectedDate
    ? nameFilteredSales.filter((sale) => {
        const saleDate = new Date(sale.created_at);

        if (Number.isNaN(saleDate.getTime())) {
          return false;
        }

        const year = saleDate.getFullYear();
        const month = String(saleDate.getMonth() + 1).padStart(2, "0");
        const day = String(saleDate.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}` === selectedDate;
      })
    : nameFilteredSales;

  // Pagination uses the filtered results.
  const totalCount = filteredSales.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const currentPage = Math.max(
    1,
    Math.min(page, Math.max(1, totalPages)),
  );

  async function handleCreateSale(
    items: CreateSaleItemInput[],
  ) {
    return submitSale({
      items,
    });
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    updateUrlState(
      { page: String(nextPage) },
      false,
    );

    requestAnimationFrame(() => {
      salesHistoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleEmployeeSearchChange(value: string) {
    updateUrlState({
      employee: value,
      page: "",
    });
  }

  function handleDateChange(value: string) {
    updateUrlState({
      date: value,
      page: "",
    });
  }

  function clearFilters() {
    updateUrlState({
      employee: "",
      date: "",
      page: "",
    });
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedSales = filteredSales.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  if (loading) {
    return (
      <section
        className="min-w-0 space-y-6"
        aria-busy="true"
        aria-label="Loading sales"
      >
        <div>
          <h1 className="text-2xl font-bold text-mauve-600">
            Sales
          </h1>

          <p className="mt-1 text-sm text-mauve-600">
            Record sales and view your sales history.
          </p>
        </div>

        <div className="animate-pulse rounded-xl border border-olive-100 bg-olive-100 p-5">
          <div className="h-5 w-32 rounded bg-olive-200" />
          <div className="mt-4 h-11 w-full rounded bg-olive-200" />
          <div className="mt-4 h-11 w-full rounded bg-olive-200" />
          <div className="mt-4 h-10 w-28 rounded bg-olive-200" />
        </div>

        <p className="text-sm text-mauve-600" role="status">
          Loading sales...
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-mauve-600 sm:text-3xl">
          Sales
        </h1>

        <p className="mt-1 text-sm text-mauve-600 sm:text-base">
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
            className="min-h-11 shrink-0 rounded-lg border border-red-300 bg-olive-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Reload sales
          </button>
        </div>
      )}

      {/* Create sale */}
      <div className="relative isolate my-2 min-w-0 rounded-2xl border border-olive-100 bg-olive-200 p-5 shadow-sm sm:p-6">
<SaleForm
  products={products}
  categories={categories}
  saving={saving}
  onCreateSale={handleCreateSale}
/>
      </div>

      {/* Sales history */}
      <div
        ref={salesHistoryRef}
        className="mt-12 min-w-0 scroll-mt-20"
      >
        <SalesHistory
          sales={paginatedSales}
          title="Sales History"
          description="View previous sales, who processed them, and their dates."
          showFilters
          employeeSearch={employeeSearch}
          selectedDate={selectedDate}
          onEmployeeSearchChange={handleEmployeeSearchChange}
          onDateChange={handleDateChange}
          onClearFilters={clearFilters}
          totalFilteredCount={totalCount}
        />

        {/* Pagination */}
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
}

export default SalesPage;
