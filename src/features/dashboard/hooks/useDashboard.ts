import { useEffect, useState } from "react";

import { getDashboardData } from "../services/dashboardService";

import type {
  DashboardData,
} from "../types/dashboard";

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
  const [data, setData] =
    useState<DashboardData>(
      initialData,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const dashboardData =
          await getDashboardData();

        if (cancelled) {
          return;
        }

        setData(dashboardData);
        setError("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load dashboard:",
          error,
        );

        setError(
          "Failed to load dashboard data.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
  };
}