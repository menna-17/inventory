import { supabase } from "../../../lib/supabase";

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: {
    name: string;
  };
};

export type Sale = {
  id: string;
  user_id: string;
  total_amount: number;
  created_at: string;
  items: SaleItem[];
};

type CreateSaleInput = {
  productId: string;
  quantity: number;
};

export async function getSales(): Promise<Sale[]> {
  const { data: salesData, error: salesError } =
    await supabase
      .from("sales")
      .select(
        "id, user_id, total_amount, created_at",
      )
      .order("created_at", {
        ascending: false,
      });

  if (salesError) {
    console.error(
      "getSales sales error:",
      salesError,
    );

    throw salesError;
  }

  if (!salesData || salesData.length === 0) {
    return [];
  }

  const saleIds = salesData.map(
    (sale) => sale.id,
  );

  const { data: itemsData, error: itemsError } =
    await supabase
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

  return salesData.map((sale) => {
    const saleItems = (itemsData ?? [])
      .filter(
        (item) => item.sale_id === sale.id,
      )
      .map((item) => ({
        ...item,
        product: products.find(
          (product) =>
            product.id === item.product_id,
        ),
      }));

    return {
      ...sale,
      items: saleItems,
    };
  });
}

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
    !Number.isInteger(input.quantity) ||
    input.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero.",
    );
  }

  const { data, error } =
    await supabase.rpc("create_sale", {
      p_items: [
        {
          product_id: input.productId,
          quantity: input.quantity,
        },
      ],
    });

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