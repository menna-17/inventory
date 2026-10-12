
export type FilterStatus =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

export type FilterableItem = {
  id: string;
  name: string;
  category_id: string;
  description?: string | null;
  stock_quantity: number;
  minimum_stock: number;
};

export function getStatus(item: FilterableItem): FilterStatus {
  if (item.stock_quantity <= 0) {
    return "out_of_stock";
  }

  if (item.stock_quantity <= item.minimum_stock) {
    return "low_stock";
  }

  return "in_stock";
}

export function filterProducts<T extends FilterableItem>(
  products: T[],
  searchTerm: string,
  statusFilter: FilterStatus,
  categoryFilter: string,
): T[] {
  const search = searchTerm.trim().toLowerCase();

  return products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search) ||
      (item.description ?? "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" || getStatus(item) === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || item.category_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });
}
