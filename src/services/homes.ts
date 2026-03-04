import { supabase } from "./supabase";
import { generateInviteCode } from "../utils/inviteCode";
import { Home, HomeType } from "../types/models";
import { mapHome } from "../utils/mappers";

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

export const fetchHome = async (homeId: string): Promise<Home> => {
  try {
    const { data, error } = await supabase
      .from("homes")
      .select("*")
      .eq("id", homeId)
      .single();
    if (error || !data) throw error;
    return mapHome(data as Record<string, unknown>);
  } catch {
    throw new Error("Failed to fetch home.");
  }
};

export const updateHomeProfile = async (
  homeId: string,
  profile: { homeType: HomeType | null; rooms: string[]; hasPets: boolean }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("homes")
      .update({
        home_type: profile.homeType,
        rooms: profile.rooms,
        has_pets: profile.hasPets,
      })
      .eq("id", homeId);
    if (error) throw error;
  } catch {
    throw new Error("Failed to save home profile. Please try again.");
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
