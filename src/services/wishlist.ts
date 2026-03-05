import { supabase } from "./supabase";
import { WishlistItem } from "../types/models";
import { mapWishlistItem } from "../utils/mappers";

export const addWishlistItem = async (
  homeId: string,
  title: string,
  description: string | null,
  cost: number,
  createdBy: string
): Promise<void> => {
  const { error } = await supabase.from("wishlist_items").insert({
    home_id: homeId,
    title,
    description: description || null,
    cost,
    created_by: createdBy,
    status: "available",
  });
  if (error) throw new Error(error.message);
};

export const redeemItem = async (itemId: string, userId: string): Promise<void> => {
  const { error } = await supabase.rpc("redeem_item", {
    p_item_id: itemId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
};

export const deleteItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase.from("wishlist_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
};

export const subscribeToWishlist = (
  homeId: string,
  callback: (items: WishlistItem[]) => void
): (() => void) => {
  const fetchItems = async () => {
    const { data } = await supabase
      .from("wishlist_items")
      .select("*, redeemer:users!redeemed_by(name)")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false });
    callback((data ?? []).map((row) => mapWishlistItem(row as Record<string, unknown>)));
  };

  void fetchItems();

  const channel = supabase
    .channel(`wishlist:${homeId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wishlist_items", filter: `home_id=eq.${homeId}` },
      () => void fetchItems()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
