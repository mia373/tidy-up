import { supabase } from "./supabase";
import { generateInviteCode } from "../utils/inviteCode";

export const createHome = async (
  name: string,
  userId: string
): Promise<string> => {
  try {
    const inviteCode = generateInviteCode();

    const { data: home, error: homeError } = await supabase
      .from("homes")
      .insert({ name, invite_code: inviteCode, members: [userId] })
      .select("id")
      .single();
    if (homeError) throw homeError;

    const { error: userError } = await supabase
      .from("users")
      .update({ home_id: home.id })
      .eq("id", userId);
    if (userError) throw userError;

    return home.id as string;
  } catch {
    throw new Error("Failed to create home. Please try again.");
  }
};

export const joinHome = async (
  inviteCode: string,
  userId: string
): Promise<string> => {
  try {
    const { data: home, error: findError } = await supabase
      .from("homes")
      .select("id, members")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();
    if (findError || !home) throw new Error("Invalid invite code. Please check and try again.");

    const updatedMembers = [...(home.members as string[]), userId];

    const { error: homeError } = await supabase
      .from("homes")
      .update({ members: updatedMembers })
      .eq("id", home.id);
    if (homeError) throw homeError;

    const { error: userError } = await supabase
      .from("users")
      .update({ home_id: home.id })
      .eq("id", userId);
    if (userError) throw userError;

    return home.id as string;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to join home. Please try again.");
  }
};
