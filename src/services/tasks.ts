import { supabase } from "./supabase";
import { CompletedTask, Task } from "../types/models";
import { mapCompletedTask, mapTask } from "../utils/mappers";

export const addTask = async (
  homeId: string,
  title: string,
  points: number,
  createdBy: string,
  frequency: "once" | "daily" | "weekly" = "once",
  room: string | null = null,
  assignedTo: string | null = null
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        home_id: homeId,
        title,
        points,
        status: "open",
        frequency,
        room: room || null,
        assigned_to: assignedTo || null,
        created_by: createdBy,
        completed_by: null,
        completed_at: null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch {
    throw new Error("Failed to create task. Please try again.");
  }
};

// Pure function — transforms AI suggestions into a Supabase insert payload (unit-testable).
export const buildBatchPayload = (
  tasks: Array<{ title: string; points: number; room?: string | null; assignedTo?: string | null }>,
  homeId: string,
  createdBy: string
) =>
  tasks.map((t) => ({
    home_id: homeId,
    title: t.title,
    points: t.points,
    status: "open" as const,
    frequency: "once" as const,
    room: t.room || null,
    assigned_to: t.assignedTo || null,
    created_by: createdBy,
    completed_by: null,
    completed_at: null,
  }));

// Batch-inserts all tasks in a single query (atomic — all succeed or all fail).
export const addTasksBatch = async (
  tasks: Array<{ title: string; points: number; room?: string | null; assignedTo?: string | null }>,
  homeId: string,
  createdBy: string
): Promise<number> => {
  try {
    const payload = buildBatchPayload(tasks, homeId, createdBy);
    const { data, error } = await supabase.from("tasks").insert(payload).select("id");
    if (error) throw error;
    return data?.length ?? 0;
  } catch {
    throw new Error("Failed to add tasks. Please try again.");
  }
};

export const fetchCompletedTasks = async (
  homeId: string
): Promise<CompletedTask[]> => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, completer:users!completed_by(name)")
      .eq("home_id", homeId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row) =>
      mapCompletedTask(row as Record<string, unknown>)
    );
  } catch {
    throw new Error("Failed to load task history.");
  }
};

export const completeTask = async (
  taskId: string,
  userId: string,
  taskPoints: number
): Promise<void> => {
  try {
    const { error } = await supabase.rpc("complete_task", {
      p_task_id: taskId,
      p_user_id: userId,
      p_points: taskPoints,
    });
    if (error) throw error;
  } catch {
    throw new Error("Failed to complete task. Please try again.");
  }
};

export const subscribeToTasks = (
  homeId: string,
  callback: (tasks: Task[]) => void
): (() => void) => {
  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, assignee:users!assigned_to(name)")
      .eq("home_id", homeId)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    callback((data ?? []).map((row) => mapTask(row as Record<string, unknown>)));
  };

  void fetchTasks();

  const channel = supabase
    .channel(`tasks:${homeId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks", filter: `home_id=eq.${homeId}` },
      () => void fetchTasks()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
