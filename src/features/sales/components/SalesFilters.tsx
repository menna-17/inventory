
type SalesFiltersProps = {
  employeeSearch: string;
  selectedDate: string;
  onEmployeeSearchChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
  onClearFilters?: () => void;
  totalFilteredCount: number;
};

function SalesFilters({
  employeeSearch,
  selectedDate,
  onEmployeeSearchChange,
  onDateChange,
  onClearFilters,
  totalFilteredCount,
}: SalesFiltersProps) {
  const hasActiveFilters = Boolean(
    employeeSearch.trim() || selectedDate,
  );

  return (
    <div className="rounded-xl border border-olive-200 bg-olive-200 p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Search by employee name */}
        <div className="min-w-0">
          <label
            htmlFor="sales-employee-search"
            className="mb-1.5 block text-sm font-medium text-mauve-600"
          >
            Search by employee name
          </label>

          <div className="relative min-w-0">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-mauve-600"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m16 16 4 4" />
            </svg>

            <input
              id="sales-employee-search"
              type="search"
              value={employeeSearch}
              onChange={(event) =>
                onEmployeeSearchChange?.(event.target.value)
              }
              placeholder="Enter employee name..."
              className="mt-1 block min-h-11 w-full min-w-0 max-w-full box-border rounded-lg border border-mauve-500 bg-olive-100 py-2 pl-10 pr-3 text-sm text-mauve-500 outline-none transition placeholder:text-mauve-300 focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200"
            />
          </div>
        </div>

        {/* Search by date */}
        <div className="min-w-0">
          <label
            htmlFor="sales-date-search"
            className="mb-1.5 block text-sm font-medium text-mauve-600"
          >
            Search by date
          </label>

          <input
            id="sales-date-search"
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange?.(event.target.value)}
            onClick={(event) => {
              const input = event.currentTarget;

              if ("showPicker" in HTMLInputElement.prototype) {
                input.showPicker();
              }
            }}
           className="mt-1 block min-h-11 w-full min-w-0 max-w-full box-border appearance-none cursor-pointer rounded-lg border border-mauve-600 bg-olive-100 px-3 py-2 text-sm text-mauve-500 outline-none transition focus:border-mauve-600 focus:ring-2 focus:ring-mauve-200"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="text-sm text-teal-900" aria-live="polite">
            {totalFilteredCount}{" "}
            {totalFilteredCount === 1 ? "sale" : "sales"} found
          </p>

          <button
            type="button"
            onClick={onClearFilters}
            className="min-h-10 rounded-lg border border-mauve-600 bg-mauve-600 px-4 py-2 text-sm font-semibold text-olive-50 transition hover:bg-mauve-700 focus:outline-none"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default SalesFilters;
