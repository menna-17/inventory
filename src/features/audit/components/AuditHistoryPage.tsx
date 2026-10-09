
import { useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";
import type { AuditLog } from "../types/auditTypes";

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
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  if (action === "stock_added") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (action === "stock_removed") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  return "bg-slate-100 text-slate-700 ring-slate-500/20";
}

function AuditHistoryPage() {
  const [logs, setLogs] = useState<AuditHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  return (
    <section className="min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit History
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Track sales and inventory changes across your business.
          </p>
        </div>

        {!loading && !error && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2">
            <p className="text-xs text-slate-500">
              Total records loaded
            </p>

            <p className="text-lg font-semibold text-slate-900">
              {logs.length}
            </p>
          </div>
        )}
      </header>

      {loading && (
        <div
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 sm:p-10"
          aria-busy="true"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />

          <p className="sr-only" aria-live="polite">
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
            className="mt-4 min-h-11 w-full rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-900">
            No activity recorded yet
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Sales and stock changes will appear here when recorded.
          </p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">
                Recent sales and inventory audit records
              </caption>

              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-5 py-4 text-left font-semibold text-slate-600"
                  >
                    Date &amp; Time
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-4 text-left font-semibold text-slate-600"
                  >
                    User
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-4 text-left font-semibold text-slate-600"
                  >
                    Activity
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-4 text-left font-semibold text-slate-600"
                  >
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
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
                      className="align-top transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <p className="font-medium text-slate-800">
                          {formatDate(log.created_at)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {log.user_name || "Unknown user"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getActionStyle(log.action)}`}
                        >
                          {formatAction(log.action)}
                        </span>

                        <p className="mt-2 text-xs text-slate-500">
                          {formatAction(log.entity_type)}
                        </p>
                      </td>

                      <td className="min-w-[280px] px-5 py-4">
                        {isSale && (
                          <div className="space-y-3">
                            {items.length > 0 ? (
                              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                                {items.map((item, index) => (
                                  <div
                                    key={`${String(item.product_id ?? index)}-${index}`}
                                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                                  >
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {String(
                                          item.product_name ??
                                            "Unknown product",
                                        )}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500">
                                        Qty: {formatAmount(item.quantity)}
                                        {" · "}
                                        Unit price: {formatAmount(item.unit_price)}
                                      </p>
                                    </div>

                                    <p className="font-medium text-slate-800">
                                      {formatAmount(
                                        Number(item.quantity) *
                                          Number(item.unit_price),
                                      )}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Sale details are unavailable.
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
                              <span className="font-medium text-slate-600">
                                Total amount
                              </span>

                              <span className="text-base font-bold text-slate-900">
                                {formatAmount(details.total_amount)}
                              </span>
                            </div>
                          </div>
                        )}

                        {isStockChange && (
                          <div className="space-y-2">
                            <p className="font-medium text-slate-900">
                              {String(details.product_name ?? "Product")}
                            </p>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                              <span>
                                Quantity:{" "}
                                <strong className="text-slate-900">
                                  {formatAmount(details.quantity)}
                                </strong>
                              </span>

                              <span>
                                Previous stock:{" "}
                                <strong className="text-slate-900">
                                  {formatAmount(details.previous_stock)}
                                </strong>
                              </span>

                              <span>
                                New stock:{" "}
                                <strong className="text-slate-900">
                                  {formatAmount(details.new_stock)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        )}

                        {!isSale && !isStockChange && (
                          <p className="break-words text-sm text-slate-600">
                            {JSON.stringify(details)}
                          </p>
                        )}

                        {log.entity_id && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">
                              View record ID
                            </summary>

                            <p className="mt-2 break-all font-mono text-xs text-slate-500">
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

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing the latest {logs.length} records, up to 200.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default AuditHistoryPage;
