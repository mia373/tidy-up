// Architecture: Supabase Edge Function (supabase/functions/generate-tasks/index.ts)
// The Gemini API key is stored as a Supabase secret and never shipped in the app bundle.
// This client calls supabase.functions.invoke(), which automatically attaches the user's JWT.
// To deploy: supabase functions deploy generate-tasks --no-verify-jwt
// To set the secret: supabase secrets set GEMINI_API_KEY=your-google-ai-studio-key

import { supabase } from "./supabase";
import { SuggestedTask } from "../types/models";

// Extracts the error message from an edge function HTTP error response.
const extractErrorMessage = async (
  error: { message: string; context?: unknown }
): Promise<string> => {
  const ctx = error.context as { json?: () => Promise<{ error?: string }> } | undefined;
  if (ctx?.json) {
    try {
      const body = await ctx.json();
      if (body.error) return body.error;
    } catch {
      // fall through to default
    }
  }
  return error.message;
};

const TIMEOUT_MS = 30_000;

const invoke = async (homeId: string): Promise<SuggestedTask[]> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out. Please try again.")), TIMEOUT_MS)
  );

  const request = supabase.functions.invoke("generate-tasks", { body: { homeId } });

  const { data, error } = await Promise.race([request, timeout]);
  if (error) {
    const message = await extractErrorMessage(error);
    throw new Error(message);
  }
  if (!Array.isArray(data)) throw new Error("Invalid response from AI");
  return data as SuggestedTask[];
};

// Fetch existing open task titles for this home (case-insensitive dedup set).
const fetchExistingTitles = async (homeId: string): Promise<Set<string>> => {
  const { data } = await supabase
    .from("tasks")
    .select("title")
    .eq("home_id", homeId)
    .eq("status", "open");
  return new Set((data ?? []).map((t: { title: string }) => t.title.toLowerCase()));
};

// Returns true if the error looks like a network connectivity failure.
const isOfflineError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("fetch failed") ||
    msg.includes("network error")
  );
};

export const generateTasks = async (homeId: string): Promise<SuggestedTask[]> => {
  try {
    const raw = await invoke(homeId);

    // 9.9.1 — deduplicate titles returned by AI (case-insensitive)
    const seen = new Set<string>();
    const deduped = raw.filter((t) => {
      const key = t.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 9.9.2 — filter out tasks that already exist as open tasks in this home
    const existingTitles = await fetchExistingTitles(homeId);
    return deduped.filter((t) => !existingTitles.has(t.title.toLowerCase()));
  } catch (firstError) {
    // Surface offline errors immediately with a clear message
    if (isOfflineError(firstError)) {
      throw new Error("No internet connection. Please check your network and try again.");
    }
    // Don't retry rate/quota limit errors — surface them immediately
    const msg = firstError instanceof Error ? firstError.message.toLowerCase() : "";
    if (msg.includes("limit") || msg.includes("quota") || msg.includes("exceeded")) {
      throw firstError;
    }
    // Retry once for transient failures (network blip, malformed AI JSON)
    try {
      return await invoke(homeId);
    } catch (error) {
      if (isOfflineError(error)) {
        throw new Error("No internet connection. Please check your network and try again.");
      }
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate tasks. Please try again."
      );
    }
  }
};
