import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { generateInviteCode } from "../utils/inviteCode";

export const createHome = async (
  name: string,
  userId: string
): Promise<string> => {
  try {
    const inviteCode = generateInviteCode();
    const homeRef = await addDoc(collection(db, "homes"), {
      name,
      inviteCode,
      members: [userId],
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "users", userId), {
      homeId: homeRef.id,
    });
    return homeRef.id;
  } catch (error) {
    throw new Error("Failed to create home. Please try again.");
  }
};

export const joinHome = async (
  inviteCode: string,
  userId: string
): Promise<string> => {
  try {
    const q = query(
      collection(db, "homes"),
      where("inviteCode", "==", inviteCode.toUpperCase())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error("Invalid invite code. Please check and try again.");
    }
    const homeDoc = snapshot.docs[0];
    const batch = writeBatch(db);
    batch.update(doc(db, "homes", homeDoc.id), {
      members: arrayUnion(userId),
    });
    batch.update(doc(db, "users", userId), {
      homeId: homeDoc.id,
    });
    await batch.commit();
    return homeDoc.id;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to join home. Please try again.");
  }
};
