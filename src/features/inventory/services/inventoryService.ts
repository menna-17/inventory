import { supabase } from "../../../lib/supabase";
import type { InventoryItem } from "../types/inventory";

export async function getInventoryItems(): Promise<
  InventoryItem[]
> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(
      "getInventoryItems Supabase error:",
      error,
    );

    throw error;
  }

  return data ?? [];
}

export async function updateStock(
  productId: string,
  newQuantity: number,
  movementType: "add" | "remove",
  movementQuantity: number,
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("products")
    .update({
      stock_quantity: newQuantity,
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    console.error(
      "updateStock Supabase error:",
      error,
    );

    throw error;
  }

  const { error: movementError } = await supabase
    .from("stock_movements")
    .insert({
      product_id: productId,
      movement_type: movementType,
      quantity: movementQuantity,
    });

  if (movementError) {
    console.error(
      "create stock movement Supabase error:",
      movementError,
    );

    throw movementError;
  }

  return data;
}