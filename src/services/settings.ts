import { supabase } from "./supabase";

export const updateName = async (
  userId: string,
  name: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", userId);
    if (error) throw error;
  } catch {
    throw new Error("Failed to update name. Please try again.");
  }
};

export const leaveHome = async (
  userId: string,
  homeId: string
): Promise<void> => {
  try {
    const { data: home, error: fetchError } = await supabase
      .from("homes")
      .select("members")
      .eq("id", homeId)
      .single();
    if (fetchError || !home) throw new Error("Home not found.");

    const updatedMembers = (home.members as string[]).filter(
      (m) => m !== userId
    );

    const { error: homeError } = await supabase
      .from("homes")
      .update({ members: updatedMembers })
      .eq("id", homeId);
    if (homeError) throw homeError;

    const { error: userError } = await supabase
      .from("users")
      .update({ home_id: null })
      .eq("id", userId);
    if (userError) throw userError;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to leave home. Please try again.");
  }
};
