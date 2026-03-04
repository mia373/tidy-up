import { useEffect } from "react";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { mapUser } from "../utils/mappers";

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setUser(data ? mapUser(data as Record<string, unknown>) : null);
        } else {
          setUser(null);
        }
        if (event === "INITIAL_SESSION") {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
