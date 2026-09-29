import { useState } from "react";
import type { Product } from "../types/product";

type ProductListProps = {
  products: Product[];
  categories: {
    id: string;
    name: string;
  }[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void | Promise<void>;
};

function ProductList({
  products,
  categories,
  onEdit,
  onDelete,
}: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const [deleteError, setDeleteError] = useState<string | null>(
    null,
  );

  function getCategoryName(categoryId: string) {
    return (
      categories.find(
        (category) => category.id === categoryId,
      )?.name ?? "Uncategorized"
    );
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setDeleteError(null);

    try {
      await onDelete(product.id);
    } catch (error) {
      console.error("deleteProduct error:", error);

      if (error && typeof error === "object") {
        const supabaseError = error as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };

        setDeleteError(
          [
            supabaseError.message,
            supabaseError.details,
            supabaseError.hint,
            supabaseError.code
              ? `Code: ${supabaseError.code}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" — ") || "Failed to delete product.",
        );
      } else {
        setDeleteError("Failed to delete product.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div>
      {deleteError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-medium">
            Failed to delete product.
          </p>

          <p className="mt-1">
            {deleteError}
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Product
              </th>

              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Category
              </th>

              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                Price
              </th>

              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                Stock
              </th>

              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                Minimum
              </th>

              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {products.map((product) => {
              const isDeleting =
                deletingId === product.id;

              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50"
                >
                  {/* Product */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {product.name}
                    </div>

                    {product.description && (
                      <div className="mt-1 max-w-md text-sm text-slate-500">
                        {product.description}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {getCategoryName(
                      product.category_id,
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                    {Number(product.price).toFixed(2)} EGP
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4 text-right text-sm text-slate-900">
                    {product.stock_quantity}
                  </td>

                  {/* Minimum Stock */}
                  <td className="px-6 py-4 text-right text-sm text-slate-600">
                    {product.minimum_stock}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        disabled={isDeleting}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(product)
                        }
                        disabled={isDeleting}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductList;