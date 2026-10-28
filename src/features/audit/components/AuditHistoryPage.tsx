import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../lib/supabase";
import type { AuditLog } from "../types/auditTypes";
import AuditHistoryFilters from "../components/AuditHistoryFilters";
import Pagination from "../../../components/ui/Pagination";

type AuditHistoryRow = AuditLog & {
  user_name: string | null;
};

type AuditItemDetails = Record<string, unknown>;

function formatAction(action: string): string {
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocalDateKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatAmount(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function getActionStyle(action: string): string {
  if (action === "sale_created") {
    return "bg-yellow-300 text-olive-50 ring-yellow-300";
  }

  if (action === "stock_added") {
    return "bg-teal-900 text-olive-50 ring-teal-900";
  }

  if (action === "stock_removed") {
    return "bg-red-700 text-olive-50 ring-red-700";
  }

  return "bg-mauve-600 text-olive-50 ring-mauve-600";
}

function AuditHistoryPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page"));

    return Number.isInteger(page) && page > 0 ? page : 1;
  });

  const [selectedDate, setSelectedDate] = useState(
    () => new URLSearchParams(window.location.search).get("date") ?? "",
  );
  const [selectedUser, setSelectedUser] = useState(
    () => new URLSearchParams(window.location.search).get("user") ?? "",
  );
  const [selectedActivity, setSelectedActivity] = useState(
    () => new URLSearchParams(window.location.search).get("activity") ?? "all",
  );
  

  // Restore filters when the user navigates with browser Back/Forward
  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      setSelectedDate(params.get("date") ?? "");
      setSelectedUser(params.get("user") ?? "");
      setSelectedActivity(params.get("activity") ?? "all");
      const page = Number(params.get("page"));
      setCurrentPage(Number.isInteger(page) && page > 0 ? page : 1);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      try {
        const { data, error: fetchError } = await supabase.rpc(
          "get_audit_history",
        );

        if (fetchError) {
          throw fetchError;
        }

        if (cancelled) return;

        setLogs((data ?? []) as AuditHistoryRow[]);
        setError(null);
      } catch (err) {
        console.error("Audit history load error:", err);

        if (cancelled) return;

        setLogs([]);
        setError(
          "Unable to load audit history. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  function handleRetry() {
    setError(null);
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  function handleClearFilters() {
    setCurrentPage(1);
    setSelectedDate("");
    setSelectedUser("");
    setSelectedActivity("all");

    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    url.searchParams.delete("user");
    url.searchParams.delete("activity");
    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }

  function handleDateChange(date: string) {
    setCurrentPage(1);
    setSelectedDate(date);

    const url = new URL(window.location.href);
    if (date) {
      url.searchParams.set("date", date);
    } else {
      url.searchParams.delete("date");
    }
    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }

  function handleUserChange(user: string) {
    setCurrentPage(1);
    setSelectedUser(user);

    const url = new URL(window.location.href);
    if (user) {
      url.searchParams.set("user", user);
    } else {
      url.searchParams.delete("user");
    }
    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }

  function handleActivityChange(activity: string) {
    setCurrentPage(1);
    setSelectedActivity(activity);

    const url = new URL(window.location.href);
    if (activity !== "all") {
      url.searchParams.set("activity", activity);
    } else {
      url.searchParams.delete("activity");
    }
    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }


  const filteredLogs = logs.filter((log) => {
    const matchesDate =
      !selectedDate ||
      getLocalDateKey(log.created_at) === selectedDate;

    const matchesUser =
      !selectedUser ||
      (log.user_name || "Unknown user")
        .toLowerCase()
        .includes(selectedUser.toLowerCase());

    const matchesActivity =
      selectedActivity === "all" ||
      log.action === selectedActivity;

    return matchesDate && matchesUser && matchesActivity;
  });

  const totalCount = filteredLogs.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedLogs = filteredLogs.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function handlePageChange(page: number) {
    const nextPage = Math.max(1, Math.min(page, totalPages));

    setCurrentPage(nextPage);

    const params = new URLSearchParams(window.location.search);

    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

     navigate(
      {
        pathname: window.location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: false },
    );

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  return (
    <section
      className="min-w-0 space-y-6"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-mauve-600">
            Audit History
          </h1>

          <p className="mt-1 text-sm text-mauve-600">
            Track sales and inventory changes across your business.
          </p>
        </div>

        {!loading && !error && (
          <div className="rounded-lg border border-olive-100 bg-olive-100 px-4 py-2">
            <p className="text-xs text-mauve-600">
              Total records loaded
            </p>

            <p className="text-lg font-semibold text-mauve-600">
              {logs.length}
            </p>
          </div>
        )}
      </header>

      {loading && (
        <div
          className="space-y-3 rounded-xl border border-olive-100 bg-olive-100 p-6 sm:p-10"
          aria-busy="true"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-olive-200" />
          <div className="h-12 animate-pulse rounded-lg bg-olive-200" />
          <div className="h-12 animate-pulse rounded-lg bg-olive-200" />

          <p className="sr-only text-mauve-600" aria-live="polite">
            Loading audit history...
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">
            Failed to load audit history
          </p>

          <p className="mt-1">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 min-h-11 w-full rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2  sm:w-auto"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <AuditHistoryFilters
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          selectedUser={selectedUser}
          onUserChange={handleUserChange}
          selectedActivity={selectedActivity}
          onActivityChange={handleActivityChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-xl border border-dashed border-olive-100 bg-olive-100 p-10 text-center">
          <h2 className="font-semibold text-mauve-600">
            No activity recorded yet
          </h2>

          <p className="mt-2 text-sm text-mauve-600">
            Sales and stock changes will appear here when recorded.
          </p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && filteredLogs.length === 0 && (
        <div className="rounded-xl border border-dashed border-olive-100 bg-olive-100 p-10 text-center">
          <h2 className="font-semibold text-mauve-600">
            No records match your filters
          </h2>

          <p className="mt-2 text-sm text-mauve-600">
            Try changing your filters or clear them to see all records.
          </p>

          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-4 min-h-11 rounded-lg bg-mauve-600 px-4 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none focus:ring-2 focus:ring-mauve-200"
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && filteredLogs.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-olive-100 bg-olive-100 shadow-sm">
            {/* Mobile layout */}
            <div className="divide-y divide-olive-300 sm:hidden">
              {paginatedLogs.map((log) => {
                const details: AuditItemDetails = log.details ?? {};

                const items = Array.isArray(details.items)
                  ? (details.items as AuditItemDetails[])
                  : [];

                const isSale = log.action === "sale_created";

                const isStockChange =
                  log.action === "stock_added" ||
                  log.action === "stock_removed";

                return (
                  <article
                    key={log.id}
                    className="space-y-4 bg-olive-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-teal-900">
                          Date &amp; Time
                        </p>
                        <p className="mt-1 break-words font-medium text-teal-900">
                          {formatDate(log.created_at)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getActionStyle(log.action)}`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-teal-900">
                        User
                      </p>
                      <p className="mt-1 break-words font-medium text-mauve-600">
                        {log.user_name || "Unknown user"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-teal-900">
                        Details
                      </p>

                      {isSale && (
                        <div className="space-y-3">
                          {items.length > 0 ? (
                            <div className="divide-y divide-olive-200 rounded-lg border border-olive-200 bg-olive-200">
                              {items.map((item, index) => (
                                <div
                                  key={`${String(item.product_id ?? index)}-${index}`}
                                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                                >
                                  <div className="min-w-0">
                                    <p className="break-words font-medium text-mauve-600">
                                      {String(
                                        item.product_name ??
                                          "Unknown product",
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-teal-900">
                                      Qty: {formatAmount(item.quantity)}
                                      {" · "}
                                      Unit price: {formatAmount(item.unit_price)}
                                    </p>
                                  </div>

                                  <p className="font-medium text-mauve-600">
                                    {formatAmount(
                                      Number(item.quantity) *
                                        Number(item.unit_price),
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-mauve-600">
                              Sale details are unavailable.
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-olive-200 px-3 py-3">
                            <span className="font-medium text-mauve-600">
                              Total amount
                            </span>

                            <span className="text-base font-bold text-mauve-600">
                              {formatAmount(details.total_amount)}
                            </span>
                          </div>
                        </div>
                      )}

                      {isStockChange && (
                        <div className="space-y-2">
                          <p className="break-words font-medium text-mauve-600">
                            {String(details.product_name ?? "Product")}
                          </p>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-teal-900">
                            <span>
                              Quantity:{" "}
                              <strong className="text-mauve-600">
                                {formatAmount(details.quantity)}
                              </strong>
                            </span>

                            <span>
                              Previous stock:{" "}
                              <strong className="text-mauve-600">
                                {formatAmount(details.previous_stock)}
                              </strong>
                            </span>

                            <span>
                              New stock:{" "}
                              <strong className="text-mauve-600">
                                {formatAmount(details.new_stock)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {!isSale && !isStockChange && (
                        <p className="break-words text-sm text-mauve-600">
                          {JSON.stringify(details)}
                        </p>
                      )}

                      {log.entity_id && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium text-mauve-600 hover:text-mauve-700">
                            View record ID
                          </summary>

                          <p className="mt-2 break-all font-mono text-xs text-teal-900">
                            {log.entity_id}
                          </p>
                        </details>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop and tablet table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full divide-y divide-olive-100 text-sm">
                <caption className="sr-only">
                  Recent sales and inventory audit records
                </caption>

                <thead className="bg-olive-200">
                  <tr>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left font-semibold text-teal-900"
                    >
                      Date &amp; Time
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-4 text-center font-semibold text-teal-900"
                    >
                      User
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-4 text-center font-semibold text-teal-900"
                    >
                      Activity
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-4 text-left font-semibold text-teal-900"
                    >
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-olive-200">
                  {paginatedLogs.map((log) => {
                    const details: AuditItemDetails =
                      log.details ?? {};

                    const items = Array.isArray(details.items)
                      ? (details.items as AuditItemDetails[])
                      : [];

                    const isSale = log.action === "sale_created";

                    const isStockChange =
                      log.action === "stock_added" ||
                      log.action === "stock_removed";

                    return (
                      <tr
                        key={log.id}
                        className="align-top transition hover:bg-olive-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-medium text-teal-900">
                            {formatDate(log.created_at)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <p className="font-medium text-mauve-600">
                            {log.user_name || "Unknown user"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getActionStyle(log.action)}`}
                          >
                            {formatAction(log.action)}
                          </span>
                        </td>

                        <td className="min-w-[280px] px-5 py-4">
                          {isSale && (
                            <div className="space-y-3">
                              {items.length > 0 ? (
                                <div className="divide-y divide-olive-200 rounded-lg border border-olive-200 bg-olive-200">
                                  {items.map((item, index) => (
                                    <div
                                      key={`${String(item.product_id ?? index)}-${index}`}
                                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                                    >
                                      <div>
                                        <p className="font-medium text-mauve-600">
                                          {String(
                                            item.product_name ??
                                              "Unknown product",
                                          )}
                                        </p>

                                        <p className="mt-1 text-xs text-teal-900">
                                          Qty: {formatAmount(item.quantity)}
                                          {" · "}
                                          Unit price: {formatAmount(item.unit_price)}
                                        </p>
                                      </div>

                                      <p className="font-medium text-mauve-600">
                                        {formatAmount(
                                          Number(item.quantity) *
                                            Number(item.unit_price),
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-mauve-600">
                                  Sale details are unavailable.
                                </p>
                              )}

                              <div className="flex items-center justify-between gap-3 rounded-lg bg-olive-200 px-3 py-3">
                                <span className="font-medium text-mauve-600">
                                  Total amount
                                </span>

                                <span className="text-base font-bold text-mauve-600">
                                  {formatAmount(details.total_amount)}
                                </span>
                              </div>
                            </div>
                          )}

                          {isStockChange && (
                            <div className="space-y-2">
                              <p className="font-medium text-mauve-600">
                                {String(details.product_name ?? "Product")}
                              </p>

                              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-teal-900">
                                <span>
                                  Quantity:{" "}
                                  <strong className="text-mauve-600">
                                    {formatAmount(details.quantity)}
                                  </strong>
                                </span>

                                <span>
                                  Previous stock:{" "}
                                  <strong className="text-mauve-600">
                                    {formatAmount(details.previous_stock)}
                                  </strong>
                                </span>

                                <span>
                                  New stock:{" "}
                                  <strong className="text-mauve-600">
                                    {formatAmount(details.new_stock)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          )}

                          {!isSale && !isStockChange && (
                            <p className="break-words text-sm text-mauve-600">
                              {JSON.stringify(details)}
                            </p>
                          )}

                          {log.entity_id && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-xs font-medium text-mauve-600 hover:text-mauve-700">
                                View record ID
                              </summary>

                              <p className="mt-2 break-all font-mono text-xs text-teal-900">
                                {log.entity_id}
                              </p>
                            </details>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-olive-200 bg-olive-200 px-5 py-3">
              <p className="text-xs text-teal-900">
                Showing {filteredLogs.length} filtered records, from {logs.length} loaded records, up to 200.
              </p>
            </div>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </section>
  );
}

export default AuditHistoryPage;