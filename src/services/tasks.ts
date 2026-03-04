import { supabase } from "./supabase";
import { Task } from "../types/models";
import { mapTask } from "../utils/mappers";

export const addTask = async (
  homeId: string,
  title: string,
  points: number,
  createdBy: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        home_id: homeId,
        title,
        points,
        status: "open",
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
      .select("*")
      .eq("home_id", homeId)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    callback((data ?? []).map(mapTask));
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
