
import { useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";
import type { AuditLog } from "../types/auditTypes";

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function getActionStyle(action: string) {
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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("audit_logs")
          .select(
            "id, user_id, action, entity_type, entity_id, details, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(200);

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError.message);
          setLogs([]);
        } else {
          setLogs((data ?? []) as AuditLog[]);
        }
      } catch {
        if (!cancelled) {
          setError("An unexpected error occurred while loading audit history.");
          setLogs([]);
        }
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
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            Loading audit history...
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">
            Failed to load audit history
          </p>
          <p className="mt-1">{error}</p>
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
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 text-left font-semibold text-slate-600">
                    Date &amp; Time
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 text-left font-semibold text-slate-600">
                    Activity
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 text-left font-semibold text-slate-600">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const details = log.details ?? {};
                  const items = Array.isArray(details.items)
                    ? details.items as Array<Record<string, unknown>>
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
                                        {String(item.product_name ?? "Unknown product")}
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
                          <p className="text-sm text-slate-600">
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
