import { supabase } from "./supabase";

export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<void> => {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned");

    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      name,
      email,
      home_id: null,
      points: 0,
    });
    if (insertError) throw insertError;
  } catch {
    throw new Error("Failed to create account. Please try again.");
  }
};

export const signIn = async (email: string, password: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch {
    throw new Error("Invalid email or password.");
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch {
    throw new Error("Failed to sign out. Please try again.");
  }
};
