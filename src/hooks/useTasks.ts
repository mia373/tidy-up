import { useEffect, useState } from "react";
import { Task } from "../types/models";
import { subscribeToTasks } from "../services/tasks";

export function useTasks(homeId: string | null): {
  tasks: Task[];
  loading: boolean;
} {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeId) return;

    const unsubscribe = subscribeToTasks(homeId, (result) => {
      setTasks(result);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [homeId]);

  return { tasks, loading };
}
