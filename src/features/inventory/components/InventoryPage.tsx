import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../../../app/providers/useAuth";
import { useInventory } from "../hooks/useInventory";
import { updateStock } from "../services/inventoryService";
import {
  getStockMovements,
  type StockMovementPageResult,
} from "../services/stockMovementService";

import { getCategories } from "../../categories/services/categoryService";

import type { Category } from "../../categories/types/category";
import type {
  InventoryItem,
  StockMovement,
  StockMovementType,
} from "../types/inventory";

import ProductFilters from "../../products/components/ProductFilters";
import type { FilterStatus } from "../../products/components/productFilters.utils";

import InventoryTable from "./InventoryTable";
import Pagination from "../../../components/ui/Pagination";
import StockAdjustmentModal from "./StockAdjustmentModal";
import StockMovementHistory from "./StockMovementHistory";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  const {
    items,
    isLoading,
    error,
    page,
    totalPages,
    totalCount,
    setPage,
    setFilters,
    refetch,
  } = useInventory();

  const inventoryTableRef = useRef<HTMLDivElement>(null);
  const shouldScrollToInventoryRef = useRef(false);

  // Prevent the initial filter application from resetting the restored page.
  const skipInitialFilterEffectRef = useRef(true);

  // Prevent the initial URL synchronization from overwriting saved parameters.
  const skipInitialUrlSyncRef = useRef(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Restore filter values from the URL.
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") ?? "",
  );

  const [statusFilter, setStatusFilter] = useState<FilterStatus>(
    () => (searchParams.get("status") as FilterStatus | null) ?? "all",
  );

  const [categoryFilter, setCategoryFilter] = useState(
    () => searchParams.get("category") ?? "all",
  );

  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Restore the stock movement page from the URL.
  const [movementPage, setMovementPage] = useState(() => {
    const parsedPage = Number(searchParams.get("movementPage"));

    return Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;
  });

  const [movementTotalPages, setMovementTotalPages] = useState(0);
  const [movementTotalCount, setMovementTotalCount] = useState(0);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);
  const [movementError, setMovementError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] =
    useState<StockMovementType>("add");
  const [quantity, setQuantity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canAdjustStock = role === "owner" || role === "manager";
  const productId = searchParams.get("productId");

  const productFromUrl = productId
    ? items.find((item) => item.id === productId) ?? null
    : null;

  // Staff must never get an adjustment modal from a URL parameter.
  const activeItem = canAdjustStock
    ? selectedItem ?? productFromUrl
    : null;

  /*
   * Restore the saved inventory page and apply the saved filters on mount.
   * Apply the page after filters in case setFilters resets pagination.
   */
  useEffect(() => {
    const parsedPage = Number(searchParams.get("page"));
    const savedPage =
      Number.isSafeInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : 1;

    setFilters({
      searchTerm: searchTerm.trim(),
      statusFilter,
      categoryFilter,
    });

    setPage(savedPage);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark intentional inventory pagination changes for scrolling.
  function handleInventoryPageChange(nextPage: number) {
    if (nextPage === page) return;

    shouldScrollToInventoryRef.current = true;
    setPage(nextPage);
  }

  /*
   * Scroll after the inventory page has finished loading.
   * This does not respond to stock movement pagination.
   */
  useEffect(() => {
    if (isLoading || !shouldScrollToInventoryRef.current) return;

    shouldScrollToInventoryRef.current = false;

    window.requestAnimationFrame(() => {
      const table = inventoryTableRef.current;
      if (!table) return;

      const top = table.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: Math.max(0, top - 100),
        behavior: "smooth",
      });
    });
  }, [page, isLoading]);

  /*
   * Apply filters when they change.
   * Skip the initial effect because the initial restoration effect
   * above has already applied the URL filters.
   */
  useEffect(() => {
    if (skipInitialFilterEffectRef.current) {
      skipInitialFilterEffectRef.current = false;
      return;
    }

    setFilters({
      searchTerm: searchTerm.trim(),
      statusFilter,
      categoryFilter,
    });
  }, [searchTerm, statusFilter, categoryFilter, setFilters]);

  /*
   * Save the inventory page and filters in the URL.
   * Preserve other parameters, including productId.
   */
  useEffect(() => {
    if (skipInitialUrlSyncRef.current) {
      skipInitialUrlSyncRef.current = false;
      return;
    }

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);

        if (page > 1) {
          next.set("page", String(page));
        } else {
          next.delete("page");
        }

        if (searchTerm.trim()) {
          next.set("search", searchTerm.trim());
        } else {
          next.delete("search");
        }

        if (statusFilter !== "all") {
          next.set("status", statusFilter);
        } else {
          next.delete("status");
        }

        if (categoryFilter !== "all") {
          next.set("category", categoryFilter);
        } else {
          next.delete("category");
        }

        return next;
      },
      { replace: true },
    );
  }, [
    page,
    searchTerm,
    statusFilter,
    categoryFilter,
    setSearchParams,
  ]);

  /*
   * Load one page of stock movements.
   * Pagination is performed in the database.
   */
  const loadMovements = useCallback(async (requestedPage: number = 1) => {
    setIsLoadingMovements(true);
    setMovementError(null);

    try {
      const result: StockMovementPageResult =
        await getStockMovements(requestedPage);

      setMovements(result.items);
      setMovementPage(result.page);
      setMovementTotalPages(result.totalPages);
      setMovementTotalCount(result.totalCount);
    } catch (error) {
      console.error("loadMovements error:", error);

      setMovementError(
        getErrorMessage(
          error,
          "Failed to load stock movement history.",
        ),
      );
    } finally {
      setIsLoadingMovements(false);
    }
  }, []);

  // Load the stock movement page restored from the URL.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMovements(movementPage);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMovements]);

  // Save the stock movement page in the URL without removing other parameters.
  useEffect(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);

        if (movementPage > 1) {
          next.set("movementPage", String(movementPage));
        } else {
          next.delete("movementPage");
        }

        return next;
      },
      { replace: true },
    );
  }, [movementPage, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await getCategories();

        if (cancelled) return;

        setCategories(data);
        setCategoryError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("loadCategories error:", error);

        setCategoryError(
          getErrorMessage(error, "Failed to load categories."),
        );
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }

  function openAdjustment(item: InventoryItem) {
    if (!canAdjustStock || isSaving) return;

    setSelectedItem(item);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);
    setNotice(null);

    // Preserve the page and filters when opening the adjustment modal.
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("productId", item.id);
        return next;
      },
      { replace: true },
    );
  }

  function closeAdjustment() {
    if (isSaving) return;

    setSelectedItem(null);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);

    // Remove only the modal parameter.
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("productId");
        return next;
      },
      { replace: true },
    );
  }

  async function handleSaveAdjustment() {
    if (!canAdjustStock || !activeItem || isSaving) return;

    const parsedQuantity = Number(quantity);

    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0) {
      setSaveError("Please enter a valid positive whole number.");
      return;
    }

    if (
      adjustmentType === "remove" &&
      parsedQuantity > activeItem.stock_quantity
    ) {
      setSaveError(
        `Not enough stock. Available stock: ${activeItem.stock_quantity}.`,
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setNotice(null);

    try {
      // The database RPC remains responsible for securely updating stock.
      await updateStock(
        activeItem.id,
        adjustmentType,
        parsedQuantity,
      );
    } catch (error) {
      console.error("Stock adjustment error:", error);

      setSaveError(
        getErrorMessage(error, "Failed to update stock."),
      );

      setIsSaving(false);
      return;
    }

    // The adjustment succeeded. Close the modal before refreshing.
    setSelectedItem(null);
    setAdjustmentType("add");
    setQuantity("");

    // Remove only productId so saved pagination and filters remain.
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("productId");
        return next;
      },
      { replace: true },
    );

    setIsSaving(false);

    // Refresh the current inventory page and current movement page.
    const refreshResults = await Promise.allSettled([
      refetch(),
      loadMovements(movementPage),
    ]);

    if (refreshResults.some((result) => result.status === "rejected")) {
      setNotice(
        "Stock was updated, but some data could not be refreshed. Use the retry controls to reload the latest information.",
      );
    } else {
      setNotice("Stock updated successfully.");
    }
  }

  if (isLoading) {
    return (
      <section aria-busy="true">
        <h1 className="text-2xl font-bold text-mauve-600">
          Inventory
        </h1>

        <div className="mt-6 space-y-3 bg-olive-100">
          <div className="h-5 w-40 animate-pulse rounded bg-olive-200" />
          <div className="h-24 animate-pulse rounded-xl bg-olive-200" />
          <div className="h-24 animate-pulse rounded-xl bg-olive-200" />
        </div>

        <p className="sr-only text-mauve-600" aria-live="polite">
          Loading inventory...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-mauve-600">
          Inventory
        </h1>

        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p className="font-semibold">Failed to load inventory.</p>
          <p className="mt-2 text-sm">{error.message}</p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 min-h-11 w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-olive-50 hover:bg-red-800 sm:w-auto"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-mauve-600">
          Inventory
        </h1>

        <p className="mt-1 text-sm text-mauve-600 sm:text-base">
          Monitor current stock levels
          {canAdjustStock ? " and adjust inventory." : "."}
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-teal-900 bg-teal-600 p-4 text-sm text-olive-50"
        >
          {notice}
        </div>
      )}

      {saveError && !activeItem && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {categoryError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {categoryError} The category filter may be incomplete.

          <button
            type="button"
            onClick={() => {
              void getCategories()
                .then((data) => {
                  setCategories(data);
                  setCategoryError(null);
                })
                .catch((error: unknown) => {
                  setCategoryError(
                    getErrorMessage(
                      error,
                      "Failed to load categories.",
                    ),
                  );
                });
            }}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <ProductFilters
        products={items}
        categories={categories}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onCategoryChange={setCategoryFilter}
        filteredCount={totalCount}
        onClearFilters={clearFilters}
      />

      {canAdjustStock && activeItem && (
        <StockAdjustmentModal
          item={activeItem}
          adjustmentType={adjustmentType}
          quantity={quantity}
          isSaving={isSaving}
          saveError={saveError}
          onAdjustmentTypeChange={setAdjustmentType}
          onQuantityChange={setQuantity}
          onSave={() => void handleSaveAdjustment()}
          onClose={closeAdjustment}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-olive-100 bg-olive-100 px-5 py-10 text-center">
          <h2 className="text-lg font-semibold text-mauve-600">
            {searchTerm.trim() ||
            statusFilter !== "all" ||
            categoryFilter !== "all"
              ? "No matching inventory items"
              : "No inventory available"}
          </h2>

          <p className="mt-2 text-sm text-mauve-600">
            {searchTerm.trim() ||
            statusFilter !== "all" ||
            categoryFilter !== "all"
              ? "Try changing your search or filters."
              : "Inventory items will appear here when products have been added."}
          </p>

          {(searchTerm.trim() ||
            statusFilter !== "all" ||
            categoryFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 min-h-11 rounded-lg bg-mauve-600 px-4 py-2.5 text-sm font-semibold text-olive-50 hover:bg-mauve-600"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <div
          ref={inventoryTableRef}
          className="scroll-mt-4 space-y-4"
        >
          <InventoryTable
            items={items}
            onAdjustStock={openAdjustment}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={10}
            onPageChange={handleInventoryPageChange}
          />
        </div>
      )}

      <StockMovementHistory
        movements={movements}
        isLoading={isLoadingMovements}
        error={movementError}
        onRetry={() => void loadMovements(movementPage)}
        page={movementPage}
        totalPages={movementTotalPages}
        totalCount={movementTotalCount}
        onPageChange={(nextPage) => void loadMovements(nextPage)}
      />
    </section>
  );
}

export default InventoryPage;