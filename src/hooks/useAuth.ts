import { useEffect } from "react";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { useHomeStore } from "../store/useHomeStore";
import { fetchHome } from "../services/homes";
import { mapUser } from "../utils/mappers";

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setHome = useHomeStore((s) => s.setHome);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          const appUser = data ? mapUser(data as Record<string, unknown>) : null;
          setUser(appUser);
          if (appUser?.homeId) {
            fetchHome(appUser.homeId).then(setHome).catch(() => setHome(null));
          } else {
            setHome(null);
          }
        } else {
          setUser(null);
          setHome(null);
        }
        if (event === "INITIAL_SESSION") {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setHome]);
}
