import {
  addDoc,
  collection,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Task } from "../types/models";

export const addTask = async (
  homeId: string,
  title: string,
  points: number,
  createdBy: string
): Promise<string> => {
  try {
    const ref = await addDoc(collection(db, "tasks"), {
      homeId,
      title,
      points,
      status: "open",
      createdBy,
      completedBy: null,
      completedAt: null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    throw new Error("Failed to create task. Please try again.");
  }
};

export const completeTask = async (
  taskId: string,
  userId: string,
  taskPoints: number
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const taskRef = doc(db, "tasks", taskId);
    const userRef = doc(db, "users", userId);

    batch.update(taskRef, {
      status: "completed",
      completedBy: userId,
      completedAt: serverTimestamp(),
    });

    batch.update(userRef, {
      points: increment(taskPoints),
    });

    await batch.commit();
  } catch (error) {
    throw new Error("Failed to complete task. Please try again.");
  }
};

export const subscribeToTasks = (
  homeId: string,
  callback: (tasks: Task[]) => void
): (() => void) => {
  const q = query(
    collection(db, "tasks"),
    where("homeId", "==", homeId),
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Task[];
    callback(tasks);
  });
};
