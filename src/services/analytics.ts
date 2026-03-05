import { supabase } from "./supabase";

export interface PointHistoryEntry {
  date: string; // "YYYY-MM-DD"
  userId: string;
  userName: string;
  totalPoints: number;
}

export const fetchPointHistory = async (
  homeId: string,
  days: number | null // null = all time (fetches all events, shows last 12 weeks in chart)
): Promise<PointHistoryEntry[]> => {
  let query = supabase
    .from("point_events")
    .select("user_id, points, created_at, users(name)")
    .eq("home_id", homeId)
    .order("created_at", { ascending: true });

  if (days !== null) {
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Group by userId + date client-side
  const daily: Record<string, Record<string, number>> = {};
  const userNames: Record<string, string> = {};

  for (const row of data ?? []) {
    const userId = row.user_id as string;
    const date = (row.created_at as string).split("T")[0];
    const pts = row.points as number;
    const usersJoin = row.users as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(usersJoin)
      ? (usersJoin[0]?.name ?? "Unknown")
      : (usersJoin?.name ?? "Unknown");

    if (!daily[userId]) daily[userId] = {};
    daily[userId][date] = (daily[userId][date] ?? 0) + pts;
    userNames[userId] = name;
  }

  const result: PointHistoryEntry[] = [];
  for (const [userId, dateMap] of Object.entries(daily)) {
    for (const [date, totalPoints] of Object.entries(dateMap)) {
      result.push({ date, userId, userName: userNames[userId], totalPoints });
    }
  }
  return result;
};
