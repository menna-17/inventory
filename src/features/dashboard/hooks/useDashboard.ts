
import { useCallback, useEffect, useRef, useState } from "react";

import { getDashboardData } from "../services/dashboardService";
import type { DashboardData } from "../types/dashboard";

const initialData: DashboardData = {
  stats: {
    totalProducts: 0,
    totalStock: 0,
    totalSales: 0,
    salesToday: 0,
  },
  recentSales: [],
  lowStockProducts: [],
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const dashboardData = await getDashboardData();

      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setData(dashboardData);
      }
    } catch (err) {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data.");
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const requestId = ++requestIdRef.current;

    async function loadInitialDashboard() {
      try {
        const dashboardData = await getDashboardData();

        if (
          !cancelled &&
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setData(dashboardData);
          setError("");
        }
      } catch (err) {
        if (
          !cancelled &&
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          console.error("Failed to load dashboard:", err);
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (
          !cancelled &&
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    }

    void loadInitialDashboard();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch,
  };
}
