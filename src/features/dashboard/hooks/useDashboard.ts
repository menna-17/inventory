
import { useCallback, useEffect, useState } from "react";

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

  const fetchDashboard = useCallback(async () => {
    try {
      const dashboardData = await getDashboardData();
      setData(dashboardData);
      setError("");
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    await fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialDashboard() {
      try {
        const dashboardData = await getDashboardData();

        if (!cancelled) {
          setData(dashboardData);
          setError("");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load dashboard:", error);
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch,
  };
}
