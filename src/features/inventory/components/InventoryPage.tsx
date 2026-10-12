
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../../../app/providers/useAuth";
import { useInventory } from "../hooks/useInventory";
import { updateStock } from "../services/inventoryService";
import {
  getStockMovements,
  type StockMovementPageResult,
} from "../services/stockMovementService";

import { getCategories } from "../../products/services/categoryService";

import type { Category } from "../../products/types/product";
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementPage, setMovementPage] = useState(1);
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
   * Apply filters through the inventory hook.
   * Search is debounced to avoid querying for every keystroke.
   * The hook should reset the inventory page to page 1 when filters change.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters({
        searchTerm: searchTerm.trim(),
        statusFilter,
        categoryFilter,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, statusFilter, categoryFilter, setFilters]);

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMovements(1);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMovements]);

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

    setSearchParams({ productId: item.id }, { replace: true });
  }

  function closeAdjustment() {
    if (isSaving) return;

    setSelectedItem(null);
    setAdjustmentType("add");
    setQuantity("");
    setSaveError(null);

    setSearchParams({}, { replace: true });
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
    setSearchParams({}, { replace: true });
    setIsSaving(false);

    // Refresh the current inventory page and show the newest movement.
    const refreshResults = await Promise.allSettled([
      refetch(),
      loadMovements(1),
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

        <div className="mt-6 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-olive-200" />
          <div className="h-24 animate-pulse rounded-xl bg-olive-100" />
          <div className="h-24 animate-pulse rounded-xl bg-olive-100" />
        </div>

        <p className="sr-only" aria-live="polite">
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
            className="mt-4 min-h-11 w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 sm:w-auto"
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
          className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
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
          <h2 className="text-lg font-semibold text-teal-900">
            {searchTerm.trim() ||
            statusFilter !== "all" ||
            categoryFilter !== "all"
              ? "No matching inventory items"
              : "No inventory available"}
          </h2>

          <p className="mt-2 text-sm text-teal-900">
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
