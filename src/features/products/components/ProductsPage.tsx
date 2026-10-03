import { useState } from "react";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";
import { useProducts } from "../hooks/useProducts";
import { deleteProduct } from "../services/productService";
import type { Product } from "../types/product";

function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(
    null,
  );

  const {
    products,
    categories,
    isLoading,
    error,
    refetch,
  } = useProducts();

  function handleAddProduct() {
    setSelectedProduct(null);
    setDeleteError(null);
    setIsFormOpen(true);
  }

  function handleEditProduct(product: Product) {
    setSelectedProduct(product);
    setDeleteError(null);
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
    setDeleteError(null);

    try {
      await deleteProduct(productId);
      await refetch();
    } catch (error) {
      console.error("deleteProduct error:", error);

      if (error && typeof error === "object") {
        const supabaseError = error as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };

        const message = [
          supabaseError.message,
          supabaseError.details,
          supabaseError.hint,
          supabaseError.code
            ? `Code: ${supabaseError.code}`
            : undefined,
        ]
          .filter(Boolean)
          .join(" — ");

        setDeleteError(
          message || "Failed to delete product.",
        );
      } else {
        setDeleteError("Failed to delete product.");
      }

      throw error;
    }
  }

  if (isLoading) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Products
        </h1>

        <p
          className="mt-4 text-slate-600"
          aria-live="polite"
        >
          Loading products...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Products
        </h1>

        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p className="font-medium">
            Failed to load products.
          </p>

          <p className="mt-2 text-sm">
            {error.message}
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-1 text-slate-600">
            Manage your inventory products.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProduct}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Add Product
        </button>
      </div>

      {/* Delete Error */}
      {deleteError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-medium">
            Failed to delete product.
          </p>

          <p className="mt-1">
            {deleteError}
          </p>
        </div>
      )}

      {/* Add/Edit Form */}
      {isFormOpen && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedProduct
                  ? "Edit Product"
                  : "Add Product"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedProduct
                  ? "Update the product information below."
                  : "Enter the product information below."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              className="rounded-md px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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

      {/* Product List */}
      <ProductList
        products={products}
        categories={categories}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />
    </section>
  );
}

export default ProductsPage;