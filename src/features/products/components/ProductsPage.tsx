
import { useState } from "react";

import ProductList from "./ProductList";
import ProductForm from "./ProductForm";

import { useProducts } from "../hooks/useProducts";
import { deleteProduct } from "../services/productService";

import { useAuth } from "../../../app/providers/useAuth";

import type { Product } from "../types/product";

function ProductsPage() {
  const { role } = useAuth();

  const canDeleteProducts = role === "owner";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingProductId, setDeletingProductId] =
    useState<string | null>(null);

  const {
    products,
    categories,
    isLoading,
    error,
    refetch,
  } = useProducts();

  function handleAddProduct() {
    setSelectedProduct(null);
    setDeleteError("");
    setIsFormOpen(true);
  }

  function handleEditProduct(product: Product) {
    setSelectedProduct(product);
    setDeleteError("");
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setSelectedProduct(null);
    setIsFormOpen(false);
  }

  async function handleFormSuccess() {
    handleCloseForm();
    await refetch();
  }

  async function handleDeleteProduct(productId: string) {
    if (!canDeleteProducts || deletingProductId) {
      return;
    }

    setDeleteError("");
    setDeletingProductId(productId);

    try {
      await deleteProduct(productId);
      await refetch();
    } catch (error) {
      console.error("Failed to delete product:", error);

      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete product. Please try again.",
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your inventory products.
          </p>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-600">
              Loading products...
            </p>
          </div>

          <div className="mt-6 space-y-3" aria-hidden="true">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your inventory products.
          </p>
        </div>

        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5"
        >
          <h2 className="font-semibold text-red-800">
            Couldn't load products
          </h2>

          <p className="mt-2 break-words text-sm text-red-700">
            {error.message}
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Manage your inventory products.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProduct}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 sm:w-auto"
        >
          <span className="mr-2 text-lg leading-none" aria-hidden="true">
            +
          </span>
          Add Product
        </button>
      </div>

      {/* Product form */}
      {isFormOpen && (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {selectedProduct ? "Edit Product" : "Add Product"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {selectedProduct
                  ? "Update the product details below."
                  : "Enter the details for your new product."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
          </div>

          <ProductForm
            key={selectedProduct?.id ?? "new-product"}
            categories={categories}
            product={selectedProduct}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      {/* Delete errors */}
      {deleteError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="break-words text-sm text-red-700">
            {deleteError}
          </p>

          <button
            type="button"
            onClick={() => setDeleteError("")}
            className="min-h-10 shrink-0 self-start rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Product list */}
      {products.length === 0 && !isFormOpen ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:px-8">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-hidden="true"
          >
            <span className="text-2xl">+</span>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No products yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Add your first product to start managing your inventory.
          </p>

          <button
            type="button"
            onClick={handleAddProduct}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <ProductList
          products={products}
          categories={categories}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          canDelete={canDeleteProducts}
        />
      )}

      {deletingProductId && (
        <p className="text-sm text-slate-500" role="status">
          Deleting product...
        </p>
      )}
    </section>
  );
}

export default ProductsPage;
