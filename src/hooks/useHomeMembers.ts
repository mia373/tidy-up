import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { mapUser } from "../utils/mappers";
import { AppUser } from "../types/models";

export function useHomeMembers(homeId: string | null): AppUser[] {
  const [members, setMembers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!homeId) return;
    supabase
      .from("users")
      .select("*")
      .eq("home_id", homeId)
      .order("name", { ascending: true })
      .then(({ data }) =>
        setMembers((data ?? []).map((r) => mapUser(r as Record<string, unknown>)))
      );
  }, [homeId]);

  return members;
}
