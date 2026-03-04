import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<void> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      email,
      homeId: null,
      points: 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error("Failed to create account. Please try again.");
  }
};

export const signIn = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error("Invalid email or password.");
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error("Failed to sign out. Please try again.");
  }
};

export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
