import { useState } from "react";

import type { Category, Product } from "../types/product";

import {
  createProduct,
  updateProduct,
} from "../services/productService";

type ProductFormProps = {
  categories: Category[];
  product?: Product | null;
  onSuccess: () => void | Promise<void>;
};

type FormValues = {
  name: string;
  category_id: string;
  price: string;
  stock_quantity: string;
  minimum_stock: string;
  description: string;
  image_url: string;
};

type FormErrors = Partial<
  Record<keyof FormValues, string>
>;

function getInitialFormValues(
  product?: Product | null,
): FormValues {
  return {
    name: product?.name ?? "",

    category_id:
      product?.category_id ?? "",

    price:
      product?.price !== undefined &&
      product?.price !== null
        ? String(product.price)
        : "",

    stock_quantity:
      product?.stock_quantity !== undefined &&
      product?.stock_quantity !== null
        ? String(product.stock_quantity)
        : "",

    minimum_stock:
      product?.minimum_stock !== undefined &&
      product?.minimum_stock !== null
        ? String(product.minimum_stock)
        : "",

    description:
      product?.description ?? "",

    image_url:
      product?.image_url ?? "",
  };
}

function ProductForm({
  categories,
  product,
  onSuccess,
}: ProductFormProps) {
  const isEditMode = Boolean(product);

  const [formValues, setFormValues] =
    useState<FormValues>(() =>
      getInitialFormValues(product),
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >,
  ) {
    const { name, value } =
      event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setSubmitError(null);
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const name =
      formValues.name.trim();

    const categoryId =
      formValues.category_id;

    const price =
      Number(formValues.price);

    const stockQuantity =
      Number(formValues.stock_quantity);

    const minimumStock =
      Number(formValues.minimum_stock);

    const imageUrl =
      formValues.image_url.trim();

    /*
     * Product name
     */

    if (!name) {
      nextErrors.name =
        "Product name is required.";
    } else if (name.length > 150) {
      nextErrors.name =
        "Product name must be 150 characters or less.";
    }

    /*
     * Category
     */

    if (!categoryId) {
      nextErrors.category_id =
        "Category is required.";
    }

    /*
     * Price
     */

    if (!formValues.price.trim()) {
      nextErrors.price =
        "Price is required.";
    } else if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      nextErrors.price =
        "Price must be greater than 0.";
    }

    /*
     * Stock quantity
     *
     * Only validate this as user input when
     * creating a product.
     *
     * During edit, the current stock comes
     * from the existing product and is not
     * being adjusted here.
     */

    if (!isEditMode) {
      if (
        !formValues.stock_quantity.trim()
      ) {
        nextErrors.stock_quantity =
          "Stock quantity is required.";
      } else if (
        !Number.isInteger(
          stockQuantity,
        ) ||
        stockQuantity < 0
      ) {
        nextErrors.stock_quantity =
          "Stock quantity must be a whole number of 0 or more.";
      }
    }

    /*
     * Minimum stock
     */

    if (
      !formValues.minimum_stock.trim()
    ) {
      nextErrors.minimum_stock =
        "Minimum stock is required.";
    } else if (
      !Number.isInteger(
        minimumStock,
      ) ||
      minimumStock < 0
    ) {
      nextErrors.minimum_stock =
        "Minimum stock must be a whole number of 0 or more.";
    }

    /*
     * Description
     */

    if (
      formValues.description.length >
      1000
    ) {
      nextErrors.description =
        "Description must be 1000 characters or less.";
    }

    /*
     * Image URL
     */

    if (
      imageUrl &&
      !/^https?:\/\/.+/i.test(
        imageUrl,
      )
    ) {
      nextErrors.image_url =
        "Image URL must start with http:// or https://.";
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationErrors =
      validate();

    if (
      Object.keys(
        validationErrors,
      ).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      /*
       * Common product information.
       */

      const productData = {
        name: formValues.name.trim(),

        category_id:
          formValues.category_id,

        price:
          Number(formValues.price),

        minimum_stock:
          Number(
            formValues.minimum_stock,
          ),

        description:
          formValues.description.trim(),

        image_url:
          formValues.image_url.trim(),
      };

      /*
       * CREATE
       *
       * Initial stock is allowed here.
       */

      if (!product) {
        await createProduct({
          ...productData,
          stock_quantity:
            Number(
              formValues.stock_quantity,
            ),
        });
      }

      /*
       * UPDATE
       *
       * Do NOT change stock quantity here.
       *
       * Current stock belongs to Inventory.
       */

      if (product) {
        await updateProduct({
          id: product.id,

          ...productData,

          stock_quantity:
            product.stock_quantity,
        });
      }

      await onSuccess();
    } catch (error) {
      console.error(
        isEditMode
          ? "updateProduct error:"
          : "createProduct error:",
        error,
      );

      if (
        error &&
        typeof error === "object"
      ) {
        const supabaseError =
          error as {
            message?: string;
            details?: string;
            hint?: string;
            code?: string;
          };

        setSubmitError(
          [
            supabaseError.message,
            supabaseError.details,
            supabaseError.hint,
            supabaseError.code
              ? `Code: ${supabaseError.code}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" — ") ||
            (isEditMode
              ? "Failed to update product."
              : "Failed to create product."),
        );
      } else {
        setSubmitError(
          isEditMode
            ? "Failed to update product."
            : "Failed to create product.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* Product name */}

        <div className="md:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            Product name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={formValues.name}
            onChange={handleChange}
            maxLength={150}
            required
            autoComplete="off"
            placeholder="e.g. Nike T-Shirt"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Category */}

        <div>
          <label
            htmlFor="category_id"
            className="block text-sm font-medium text-slate-700"
          >
            Category
          </label>

          <select
            id="category_id"
            name="category_id"
            value={
              formValues.category_id
            }
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              Select a category
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>

          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category_id}
            </p>
          )}
        </div>

        {/* Price */}

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-slate-700"
          >
            Price (EGP)
          </label>

          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formValues.price}
            onChange={handleChange}
            required
            inputMode="decimal"
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          {errors.price && (
            <p className="mt-1 text-sm text-red-600">
              {errors.price}
            </p>
          )}
        </div>

        {/* Stock */}

        <div>
          <label
            htmlFor="stock_quantity"
            className="block text-sm font-medium text-slate-700"
          >
            {isEditMode
              ? "Current stock"
              : "Initial stock"}
          </label>

          <input
            id="stock_quantity"
            name="stock_quantity"
            type="number"
            min="0"
            step="1"
            value={
              formValues.stock_quantity
            }
            onChange={handleChange}
            required={!isEditMode}
            disabled={isEditMode}
            readOnly={isEditMode}
            inputMode="numeric"
            placeholder="0"
            className={`mt-1 block w-full rounded-md border px-3 py-2 outline-none focus:ring-2 ${
              isEditMode
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                : "border-slate-300 bg-white focus:border-slate-500 focus:ring-slate-200"
            }`}
          />

          {isEditMode ? (
            <p className="mt-1 text-xs text-slate-500">
              To change current stock, use
              Inventory → Adjust Stock.
            </p>
          ) : (
            errors.stock_quantity && (
              <p className="mt-1 text-sm text-red-600">
                {errors.stock_quantity}
              </p>
            )
          )}
        </div>

        {/* Minimum stock */}

        <div>
          <label
            htmlFor="minimum_stock"
            className="block text-sm font-medium text-slate-700"
          >
            Minimum stock
          </label>

          <input
            id="minimum_stock"
            name="minimum_stock"
            type="number"
            min="0"
            step="1"
            value={
              formValues.minimum_stock
            }
            onChange={handleChange}
            required
            inputMode="numeric"
            placeholder="0"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          {errors.minimum_stock && (
            <p className="mt-1 text-sm text-red-600">
              {errors.minimum_stock}
            </p>
          )}
        </div>

        {/* Description */}

        <div className="md:col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700"
          >
            Description

            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={1000}
            value={
              formValues.description
            }
            onChange={handleChange}
            placeholder="Short description of the product"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          <div className="mt-1 text-right text-xs text-slate-400">
            {
              formValues.description
                .length
            }
            /1000
          </div>

          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description}
            </p>
          )}
        </div>

        {/* Image URL */}

        <div className="md:col-span-2">
          <label
            htmlFor="image_url"
            className="block text-sm font-medium text-slate-700"
          >
            Image URL

            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            id="image_url"
            name="image_url"
            type="url"
            value={
              formValues.image_url
            }
            onChange={handleChange}
            placeholder="https://example.com/product.jpg"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          {errors.image_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.image_url}
            </p>
          )}
        </div>
      </div>

      {/* Submit error */}

      {submitError && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <p className="font-medium">
            {isEditMode
              ? "Failed to update product."
              : "Failed to create product."}
          </p>

          <p className="mt-1">
            {submitError}
          </p>
        </div>
      )}

      {/* Submit */}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
              ? "Update Product"
              : "Save Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;