import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthStore } from "../store/useAuthStore";
import { AppUser } from "../types/models";

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          setUser({ id: snap.id, ...snap.data() } as AppUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
}
