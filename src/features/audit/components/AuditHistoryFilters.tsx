
import { useEffect, useState, useCallback } from "react";

type AuditHistoryFiltersProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedUser: string;
  onUserChange: (user: string) => void;
  selectedActivity: string;
  onActivityChange: (activity: string) => void;
  onClearFilters: () => void;
};

export default function AuditHistoryFilters({
  selectedDate,
  onDateChange,
  selectedUser,
  onUserChange,
  selectedActivity,
  onActivityChange,
  onClearFilters,
}: AuditHistoryFiltersProps) {
  const [userSearch, setUserSearch] = useState(selectedUser);

  const handleUserChange = useCallback(
    (user: string) => {
      onUserChange(user);
    },
    [onUserChange],
  );

  useEffect(() => {
    const trimmedUserSearch = userSearch.trim();

    if (trimmedUserSearch === selectedUser) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleUserChange(trimmedUserSearch);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [userSearch, selectedUser, handleUserChange]);

  const controlClassName =
    "mt-1 block min-h-11 w-full min-w-0 max-w-full box-border rounded-lg border border-mauve-600 bg-olive-100 px-3 py-2 text-sm text-mauve-500 placeholder:text-mauve-300 outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200";

  return (
    <section className="rounded-xl border border-olive-200 bg-olive-200 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <label
            htmlFor="audit-date-filter"
            className="text-sm font-semibold text-mauve-600"
          >
            Date
          </label>
          <input
            id="audit-date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            onClick={(event) => {
              if ("showPicker" in HTMLInputElement.prototype) {
                event.currentTarget.showPicker();
              }
            }}
            className={controlClassName}
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="audit-user-filter"
            className="text-sm font-semibold text-mauve-600"
          >
            User
          </label>
          <input
            id="audit-user-filter"
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Search user..."
            autoComplete="off"
            className={controlClassName}
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="audit-activity-filter"
            className="text-sm font-semibold text-mauve-600"
          >
            Activity
          </label>
          <select
            id="audit-activity-filter"
            value={selectedActivity}
            onChange={(event) => onActivityChange(event.target.value)}
            className={controlClassName}
          >
            <option value="all">All Activities</option>
            <option value="sale_created">Sale Created</option>
            <option value="stock_added">Stock Added</option>
            <option value="stock_removed">Stock Removed</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setUserSearch("");
              onClearFilters();
            }}
            className="min-h-11 w-full rounded-lg border border-mauve-600 bg-mauve-600 px-4 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </section>
  );
}
