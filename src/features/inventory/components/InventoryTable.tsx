
import { useState } from "react";

import { useAuth } from "../../../app/providers/useAuth";
import type { InventoryItem } from "../types/inventory";

type InventoryTableProps = {
  items: InventoryItem[];
  onAdjustStock: (item: InventoryItem) => void;
};

function getStockStatus(
  stockQuantity: number,
  minimumStock: number,
) {
  if (stockQuantity <= 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (stockQuantity <= minimumStock) {
    return {
      label: "Low Stock",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    label: "In Stock",
    className: "bg-green-100 text-green-700",
  };
}

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl: string | null;
  productName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-olive-200 bg-olive-200 text-sm font-semibold text-teal-900"
        aria-label={`No image available for ${productName}`}
        title="No image available"
      >
        {productName.slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="h-10 w-10 shrink-0 rounded-lg border border-olive-200 bg-white object-cover"
    />
  );
}

function InventoryTable({
  items,
  onAdjustStock,
}: InventoryTableProps) {
  const { role } = useAuth();

  const canAdjustStock =
    role === "owner" || role === "manager";


const handleAdjustStock = (item: InventoryItem) => {
  onAdjustStock(item);

  window.requestAnimationFrame(() => {
    const adjustForm = document.getElementById("adjust-stock-form");

    if (!adjustForm) return;

    const top =
      adjustForm.getBoundingClientRect().top +
      window.scrollY -
      100;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  });
};


  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-olive-100 bg-olive-100 px-4 py-10 text-center">
        <p className="font-medium text-mauve-600">
          No inventory items found
        </p>
        <p className="mt-1 text-sm text-mauve-600">
          Products will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-olive-100 bg-olive-100">
      {/* Mobile cards */}
      <div className="divide-y divide-olive-100 md:hidden">
        {items.map((item) => {
          const status = getStockStatus(
            item.stock_quantity,
            item.minimum_stock,
          );

          return (
            <article
              key={item.id}
              className="space-y-3 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumbnail
                    imageUrl={item.image_url}
                    productName={item.name}
                  />

                  <h3 className="min-w-0 break-words font-semibold text-mauve-600">
                    {item.name}
                  </h3>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-olive-200 p-3">
                  <p className="text-xs text-teal-900">
                    Current stock
                  </p>
                  <p className="mt-1 text-lg font-semibold text-mauve-600">
                    {item.stock_quantity}
                  </p>
                </div>

                <div className="rounded-lg bg-olive-200 p-3">
                  <p className="text-xs text-teal-900">
                    Minimum stock
                  </p>
                  <p className="mt-1 text-lg font-semibold text-mauve-600">
                    {item.minimum_stock}
                  </p>
                </div>
              </div>

              {canAdjustStock && (
                <button
                  type="button"
                  onClick={() => handleAdjustStock(item)}
                  className="min-h-11 w-full rounded-lg border border-mauve-600 bg-mauve-600 px-4 py-2 text-sm font-medium text-olive-50 transition hover:bg-mauve-700"
                >
                  Adjust Stock
                </button>
              )}
            </article>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-olive-200">
          <thead className="bg-olive-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                Product
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                Stock
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                Minimum Stock
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-teal-900">
                Status
              </th>

              {canAdjustStock && (
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-teal-900">
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-olive-200">
            {items.map((item) => {
              const status = getStockStatus(
                item.stock_quantity,
                item.minimum_stock,
              );

              return (
                <tr
                  key={item.id}
                  className="transition hover:bg-olive-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-teal-900">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail
                        imageUrl={item.image_url}
                        productName={item.name}
                      />

                      <span className="break-words">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-mauve-600">
                    {item.stock_quantity}
                  </td>

                  <td className="px-6 py-4 text-sm text-teal-900">
                    {item.minimum_stock}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  {canAdjustStock && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(item)}
                        className="min-h-10 rounded-lg border border-mauve-600 bg-mauve-600 px-3 py-2 text-sm font-medium text-olive-50 transition hover:bg-mauve-700"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryTable;