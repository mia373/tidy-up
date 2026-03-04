import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { AppUser } from "../types/models";

export const subscribeToLeaderboard = (
  homeId: string,
  callback: (members: AppUser[]) => void
): (() => void) => {
  const q = query(
    collection(db, "users"),
    where("homeId", "==", homeId),
    orderBy("points", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AppUser[];
    callback(members);
  });
};
