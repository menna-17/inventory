
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getInventoryItems,
  getInventoryStatusCounts,
  updateStock,
  type InventoryFilters,
  type InventoryStatusCounts,
} from "../services/inventoryService";

import type {
  InventoryItem,
  StockMovementType,
} from "../types/inventory";

type UseInventoryResult = {
  items: InventoryItem[];
  statusCounts: InventoryStatusCounts;
  isLoading: boolean;
  isUpdatingStock: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  totalCount: number;
  setPage: (page: number) => void;
  setFilters: (filters: InventoryFilters) => void;
  refetch: () => Promise<void>;
  adjustStock: (
    productId: string,
    movementType: StockMovementType,
    quantity: number,
  ) => Promise<boolean>;
};

function normalizeError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback);
}

function normalizePage(page: number): number {
  return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
}

function normalizeFilters(
  filters: InventoryFilters,
): InventoryFilters {
  return {
    searchTerm: filters.searchTerm?.trim() ?? "",
    categoryFilter: filters.categoryFilter ?? "all",
    statusFilter: filters.statusFilter ?? "all",
  };
}

function areFiltersEqual(
  first: InventoryFilters,
  second: InventoryFilters,
): boolean {
  return (
    first.searchTerm === second.searchTerm &&
    first.categoryFilter === second.categoryFilter &&
    first.statusFilter === second.statusFilter
  );
}

const emptyStatusCounts: InventoryStatusCounts = {
  all: 0,
  in_stock: 0,
  low_stock: 0,
  out_of_stock: 0,
};

export function useInventory(): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statusCounts, setStatusCounts] =
    useState<InventoryStatusCounts>(emptyStatusCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFiltersState] = useState<InventoryFilters>({
    searchTerm: "",
    categoryFilter: "all",
    statusFilter: "all",
  });

  const [refreshVersion, setRefreshVersion] = useState(0);

  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const filtersRef = useRef<InventoryFilters>(filters);
  const hasLoadedRef = useRef(false);

  const refreshWaitersRef = useRef<
    Array<{
      resolve: () => void;
      reject: (error: Error) => void;
    }>
  >([]);

  const settleRefreshWaiters = useCallback(
    (requestError?: Error) => {
      const waiters = refreshWaitersRef.current;
      refreshWaitersRef.current = [];

      waiters.forEach(({ resolve, reject }) => {
        if (requestError) {
          reject(requestError);
        } else {
          resolve();
        }
      });
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    async function fetchPage() {
      try {
        const [result, counts] = await Promise.all([
          getInventoryItems({
            ...filters,
            page,
          }),
          getInventoryStatusCounts(filters),
        ]);

        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        setItems(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setStatusCounts(counts);
        setError(null);

        hasLoadedRef.current = true;

        // The service may correct the page if the total count changes.
        if (result.page !== page) {
          pageRef.current = result.page;
          setPageState(result.page);
        } else {
          pageRef.current = page;
        }

        settleRefreshWaiters();
      } catch (requestError) {
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        const normalized = normalizeError(
          requestError,
          "Failed to load inventory.",
        );

        setError(normalized);
        setItems([]);
        setTotalCount(0);
        setTotalPages(0);
        setStatusCounts(emptyStatusCounts);

        settleRefreshWaiters(normalized);
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    void fetchPage();

    return () => {
      cancelled = true;

      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
      }
    };
  }, [filters, page, refreshVersion, settleRefreshWaiters]);

  const setFilters = useCallback((nextFilters: InventoryFilters) => {
    const normalized = normalizeFilters(nextFilters);
    const current = filtersRef.current;

    if (areFiltersEqual(current, normalized)) {
      return;
    }

    filtersRef.current = normalized;
    pageRef.current = 1;

    setError(null);
    setPageState(1);
    setFiltersState(normalized);

    // Preserve the initial skeleton, but keep existing content visible
    // when filters change after the first successful load.
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
  }, []);

  const setPage = useCallback((nextPage: number) => {
    const normalized = normalizePage(nextPage);

    if (normalized === pageRef.current) {
      return;
    }

    pageRef.current = normalized;
    setError(null);
    setPageState(normalized);

    // Do not set isLoading(true) for page changes.
    // Existing rows remain visible until the new page arrives.
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    const promise = new Promise<void>((resolve, reject) => {
      refreshWaitersRef.current.push({ resolve, reject });
    });

    setIsLoading(true);
    setError(null);
    setRefreshVersion((version) => version + 1);

    await promise;
  }, []);

  const adjustStock = useCallback(
    async (
      productId: string,
      movementType: StockMovementType,
      quantity: number,
    ): Promise<boolean> => {
      setIsUpdatingStock(true);
      setError(null);

      try {
        await updateStock(productId, movementType, quantity);
        await refetch();
        return true;
      } catch (requestError) {
        setError(
          normalizeError(requestError, "Failed to adjust stock."),
        );
        return false;
      } finally {
        setIsUpdatingStock(false);
      }
    },
    [refetch],
  );

  return {
    items,
    statusCounts,
    isLoading,
    isUpdatingStock,
    error,
    page,
    totalPages,
    totalCount,
    setPage,
    setFilters,
    refetch,
    adjustStock,
  };
}
