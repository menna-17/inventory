
import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

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

type FormErrors = Partial<Record<keyof FormValues, string>>;

function getInitialFormValues(
  product?: Product | null,
): FormValues {
  return {
    name: product?.name ?? "",
    category_id: product?.category_id ?? "",
    price:
      product?.price !== undefined && product?.price !== null
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
    description: product?.description ?? "",
    image_url: product?.image_url ?? "",
  };
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error && typeof error === "object") {
    const details = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [
      details.message,
      details.details,
      details.hint,
      details.code ? `Code: ${details.code}` : undefined,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" — ");
    }
  }

  return fallback;
}

function ProductForm({
  categories,
  product,
  onSuccess,
}: ProductFormProps) {
  const isEditMode = Boolean(product);

  const [formValues, setFormValues] = useState<FormValues>(
    () => getInitialFormValues(product),
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(
    null,
  );

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

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

    const name = formValues.name.trim();
    const categoryId = formValues.category_id;
    const price = Number(formValues.price);
    const stockQuantity = Number(formValues.stock_quantity);
    const minimumStock = Number(formValues.minimum_stock);
    const imageUrl = formValues.image_url.trim();

    if (!name) {
      nextErrors.name = "Product name is required.";
    } else if (name.length > 150) {
      nextErrors.name =
        "Product name must be 150 characters or less.";
    }

    if (!categoryId) {
      nextErrors.category_id = "Category is required.";
    } else if (
      !categories.some((category) => category.id === categoryId)
    ) {
      nextErrors.category_id =
        "Please select a valid category.";
    }

    if (!formValues.price.trim()) {
      nextErrors.price = "Price is required.";
    } else if (!Number.isFinite(price) || price <= 0) {
      nextErrors.price = "Price must be greater than 0.";
    }

    if (!isEditMode) {
      if (!formValues.stock_quantity.trim()) {
        nextErrors.stock_quantity =
          "Initial stock quantity is required.";
      } else if (
        !Number.isInteger(stockQuantity) ||
        stockQuantity < 0
      ) {
        nextErrors.stock_quantity =
          "Stock quantity must be a whole number of 0 or more.";
      }
    }

    if (!formValues.minimum_stock.trim()) {
      nextErrors.minimum_stock = "Minimum stock is required.";
    } else if (
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      nextErrors.minimum_stock =
        "Minimum stock must be a whole number of 0 or more.";
    }

    if (formValues.description.length > 1000) {
      nextErrors.description =
        "Description must be 1000 characters or less.";
    }

    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          nextErrors.image_url =
            "Image URL must use HTTP or HTTPS.";
        }
      } catch {
        nextErrors.image_url = "Enter a valid image URL.";
      }
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validate();

    setErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: formValues.name.trim(),
        category_id: formValues.category_id,
        price: Number(formValues.price),
        minimum_stock: Number(formValues.minimum_stock),
        description: formValues.description.trim(),
        image_url: formValues.image_url.trim(),
      };

      if (product) {
        await updateProduct({
          id: product.id,
          ...productData,
          stock_quantity: product.stock_quantity,
        });
      } else {
        await createProduct({
          ...productData,
          stock_quantity: Number(formValues.stock_quantity),
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

      setSubmitError(
        getErrorMessage(
          error,
          isEditMode
            ? "Failed to update product."
            : "Failed to create product.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm";

  const labelClassName =
    "block text-sm font-medium text-slate-700";

  function errorClass(field: keyof FormValues) {
    return errors[field]
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "";
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {categories.length === 0 && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <p className="font-semibold">
            No categories available
          </p>
          <p className="mt-1">
            Create a category before adding a product.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {/* Product name */}
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="name" className={labelClassName}>
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
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="e.g. Nike T-Shirt"
            className={`${inputClassName} ${errorClass("name")}`}
          />

          {errors.name && (
            <p id="name-error" className="mt-1.5 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="min-w-0">
          <label
            htmlFor="category_id"
            className={labelClassName}
          >
            Category
          </label>

          <select
            id="category_id"
            name="category_id"
            value={formValues.category_id}
            onChange={handleChange}
            required
            disabled={isSubmitting || categories.length === 0}
            aria-invalid={Boolean(errors.category_id)}
            aria-describedby={
              errors.category_id
                ? "category_id-error"
                : undefined
            }
            className={`${inputClassName} ${errorClass("category_id")}`}
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {errors.category_id && (
            <p
              id="category_id-error"
              className="mt-1.5 text-sm text-red-600"
            >
              {errors.category_id}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="min-w-0">
          <label htmlFor="price" className={labelClassName}>
            Price (EGP)
          </label>

          <input
            id="price"
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={formValues.price}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? "price-error" : undefined}
            placeholder="0.00"
            className={`${inputClassName} ${errorClass("price")}`}
          />

          {errors.price && (
            <p id="price-error" className="mt-1.5 text-sm text-red-600">
              {errors.price}
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="min-w-0">
          <label
            htmlFor="stock_quantity"
            className={labelClassName}
          >
            {isEditMode ? "Current stock" : "Initial stock"}
          </label>

          <input
            id="stock_quantity"
            name="stock_quantity"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={formValues.stock_quantity}
            onChange={handleChange}
            required={!isEditMode}
            disabled={isEditMode || isSubmitting}
            aria-invalid={Boolean(errors.stock_quantity)}
            aria-describedby={
              isEditMode
                ? "stock-help"
                : errors.stock_quantity
                  ? "stock_quantity-error"
                  : undefined
            }
            placeholder="0"
            className={`${inputClassName} ${
              isEditMode
                ? "cursor-not-allowed bg-slate-100"
                : errorClass("stock_quantity")
            }`}
          />

          {isEditMode ? (
            <p
              id="stock-help"
              className="mt-1.5 text-xs leading-5 text-slate-500"
            >
              To change current stock, use Inventory → Adjust Stock.
            </p>
          ) : (
            errors.stock_quantity && (
              <p
                id="stock_quantity-error"
                className="mt-1.5 text-sm text-red-600"
              >
                {errors.stock_quantity}
              </p>
            )
          )}
        </div>

        {/* Minimum stock */}
        <div className="min-w-0">
          <label
            htmlFor="minimum_stock"
            className={labelClassName}
          >
            Minimum stock
          </label>

          <input
            id="minimum_stock"
            name="minimum_stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={formValues.minimum_stock}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.minimum_stock)}
            aria-describedby={
              errors.minimum_stock
                ? "minimum_stock-error"
                : undefined
            }
            placeholder="0"
            className={`${inputClassName} ${errorClass("minimum_stock")}`}
          />

          {errors.minimum_stock && (
            <p
              id="minimum_stock-error"
              className="mt-1.5 text-sm text-red-600"
            >
              {errors.minimum_stock}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="description"
              className={labelClassName}
            >
              Description
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <span className="shrink-0 text-xs text-slate-400">
              {formValues.description.length}/1000
            </span>
          </div>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={1000}
            value={formValues.description}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description
                ? "description-error"
                : undefined
            }
            placeholder="Short description of the product"
            className={`${inputClassName} min-h-24 resize-y`}
          />

          {errors.description && (
            <p
              id="description-error"
              className="mt-1.5 text-sm text-red-600"
            >
              {errors.description}
            </p>
          )}
        </div>

        {/* Image URL */}
        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor="image_url"
            className={labelClassName}
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
            inputMode="url"
            value={formValues.image_url}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.image_url)}
            aria-describedby={
              errors.image_url ? "image_url-error" : undefined
            }
            placeholder="https://example.com/product.jpg"
            className={`${inputClassName} ${errorClass("image_url")}`}
          />

          {errors.image_url && (
            <p
              id="image_url-error"
              className="mt-1.5 text-sm text-red-600"
            >
              {errors.image_url}
            </p>
          )}
        </div>
      </div>

      {/* Submission error */}
      {submitError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">
            {isEditMode
              ? "Failed to update product."
              : "Failed to create product."}
          </p>
          <p className="mt-1 break-words">{submitError}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={isSubmitting || categories.length === 0}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              {isEditMode ? "Updating..." : "Saving..."}
            </>
          ) : isEditMode ? (
            "Update Product"
          ) : (
            "Save Product"
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
