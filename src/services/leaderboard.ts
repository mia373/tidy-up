import { supabase } from "./supabase";
import { AppUser } from "../types/models";
import { mapUser } from "../utils/mappers";

export const subscribeToLeaderboard = (
  homeId: string,
  callback: (members: AppUser[]) => void
): (() => void) => {
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("home_id", homeId)
      .order("points", { ascending: false });
    callback((data ?? []).map(mapUser));
  };

  void fetchMembers();

  const channel = supabase
    .channel(`leaderboard:${homeId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "users", filter: `home_id=eq.${homeId}` },
      () => void fetchMembers()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
