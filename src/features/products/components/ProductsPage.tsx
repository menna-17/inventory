import { useState } from "react";

import ProductList from "./ProductList";
import ProductForm from "./ProductForm";

import { useProducts } from "../hooks/useProducts";
import { deleteProduct } from "../services/productService";

import { useAuth } from "../../../app/providers/useAuth";

import type { Product } from "../types/product";

function ProductsPage() {
  const { role } = useAuth();

  const canDeleteProducts =
    role === "owner";

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const {
    products,
    categories,
    isLoading,
    error,
    refetch,
  } = useProducts();

  function handleAddProduct() {
    setSelectedProduct(null);
    setIsFormOpen(true);
  }

  function handleEditProduct(
    product: Product,
  ) {
    setSelectedProduct(product);
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

  async function handleDeleteProduct(
    productId: string,
  ) {
    await deleteProduct(productId);
    await refetch();
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
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Product
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedProduct
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <button
              type="button"
              onClick={handleCloseForm}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <ProductForm
            key={
              selectedProduct?.id ??
              "new-product"
            }
            categories={categories}
            product={selectedProduct}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      <ProductList
        products={products}
        categories={categories}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        canDelete={canDeleteProducts}
      />
    </section>
  );
}

export default ProductsPage;