import { supabase } from "../../../lib/supabase";

import type {
  CreateSaleInput,
  Sale,
} from "../types/sales";

type SalesHistoryRow = {
  id: string;
  user_id: string;
  total_amount: number;
  created_at: string;
  user_name: string | null;
};

/*
 * -------------------------------------------------------
 * Get sales history
 * -------------------------------------------------------
 *
 * This is the single source of truth for sales data.
 *
 * Sales page:
 *   uses all returned sales.
 *
 * Dashboard:
 *   will use the first few sales for Recent Sales.
 *
 * The database RPC safely provides the processor's
 * name without exposing the profiles table directly.
 * -------------------------------------------------------
 */

export async function getSales(): Promise<Sale[]> {
  const {
    data: salesData,
    error: salesError,
  } = await supabase.rpc(
    "get_sales_history",
  );

  if (salesError) {
    console.error(
      "getSales sales history error:",
      salesError,
    );

    throw salesError;
  }

  const sales =
    (salesData ?? []) as SalesHistoryRow[];

  if (sales.length === 0) {
    return [];
  }

  /*
   * -----------------------------------------------------
   * Get sale items
   * -----------------------------------------------------
   */

  const saleIds = sales.map(
    (sale) => sale.id,
  );

  const {
    data: itemsData,
    error: itemsError,
  } = await supabase
    .from("sale_items")
    .select(
      "id, sale_id, product_id, quantity, unit_price",
    )
    .in("sale_id", saleIds);

  if (itemsError) {
    console.error(
      "getSales sale_items error:",
      itemsError,
    );

    throw itemsError;
  }

  /*
   * -----------------------------------------------------
   * Get product names
   * -----------------------------------------------------
   */

  const productIds = [
    ...new Set(
      (itemsData ?? []).map(
        (item) => item.product_id,
      ),
    ),
  ];

  let products: {
    id: string;
    name: string;
  }[] = [];

  if (productIds.length > 0) {
    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);

    if (productsError) {
      console.error(
        "getSales products error:",
        productsError,
      );

      throw productsError;
    }

    products = productsData ?? [];
  }

  /*
   * -----------------------------------------------------
   * Combine sales, items, products, and users
   * -----------------------------------------------------
   */

  return sales.map(
    (sale) => {
      const saleItems = (
        itemsData ?? []
      )
        .filter(
          (item) =>
            item.sale_id ===
            sale.id,
        )
        .map((item) => ({
          ...item,
          product:
            products.find(
              (product) =>
                product.id ===
                item.product_id,
            ),
        }));

      return {
        id: sale.id,
        user_id: sale.user_id,
        total_amount:
          Number(
            sale.total_amount,
          ),
        created_at:
          sale.created_at,
        user: {
          full_name:
            sale.user_name,
        },
        items: saleItems,
      };
    },
  );
}

/*
 * -------------------------------------------------------
 * Create sale
 * -------------------------------------------------------
 *
 * Sale creation remains handled by the database RPC.
 *
 * The RPC:
 * - validates authentication
 * - validates products and quantities
 * - checks stock
 * - creates the sale
 * - creates sale items
 * - decreases inventory
 * - records the stock movement
 * - records the authenticated user
 * -------------------------------------------------------
 */

export async function createSale(
  input: CreateSaleInput,
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "createSale user error:",
      userError,
    );

    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to create a sale.",
    );
  }

  if (!input.productId) {
    throw new Error(
      "A product is required.",
    );
  }

  if (
    !Number.isInteger(
      input.quantity,
    ) ||
    input.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero.",
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "create_sale",
    {
      p_items: [
        {
          product_id:
            input.productId,
          quantity:
            input.quantity,
        },
      ],
    },
  );

  if (error) {
    console.error(
      "createSale RPC error:",
      error,
    );

    throw error;
  }

  if (!data) {
    throw new Error(
      "Sale was created but no sale ID was returned.",
    );
  }

  return data;
}