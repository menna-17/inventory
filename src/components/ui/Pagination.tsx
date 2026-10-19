
type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize = 20,
  onPageChange,
}: PaginationProps) {
  if (totalCount === 0 || totalPages <= 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  // Show the first page and up to two nearby pages.
  let pages: number[];

  if (totalPages <= 3) {
    pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  } else if (page <= 2) {
    pages = [1, 2, 3];
  } else if (page >= totalPages) {
    pages = [page - 1, page];
  } else {
    pages = [page, page + 1];
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-olive-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-mauve-600">
        Showing {start}–{end} of {totalCount}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="min-h-10 rounded-lg border border-olive-200  bg-olive-100 text-mauve-600 hover:bg-olive-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="min-h-10 min-w-10 rounded-lg border border-olive-200 text-mauve-600 bg-olive-200 hover:bg-olive-300 px-3 text-sm"
            >
              1
            </button>

            <span className="px-2 text-sm text-mauve-600">...</span>
          </>
        )}

        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === page ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm ${
              pageNumber === page
                ? "border-mauve-600 bg-mauve-600 font-semibold text-olive-50"
                : "border-olive-200 text-mauve-600 bg-olive-200 hover:bg-olive-300"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="min-h-10 rounded-lg border border-olive-200 bg-olive-100 text-mauve-600 hover:bg-olive-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
