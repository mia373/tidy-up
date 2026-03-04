import { AppUser, CompletedTask, Home, HomeType, Task } from "../types/models";

export function mapUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    homeId: (row.home_id as string | null) ?? null,
    points: row.points as number,
    streak: (row.streak as number | undefined) ?? 0,
    lastStreakDate: (row.last_streak_date as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapHome(row: Record<string, unknown>): Home {
  return {
    id: row.id as string,
    name: row.name as string,
    inviteCode: row.invite_code as string,
    members: row.members as string[],
    createdAt: row.created_at as string,
    homeType: (row.home_type as HomeType | null) ?? null,
    rooms: (row.rooms as string[] | null) ?? [],
    hasPets: (row.has_pets as boolean | null) ?? false,
    memberCount: (row.member_count as number | null) ?? 0,
  };
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    homeId: row.home_id as string,
    title: row.title as string,
    points: row.points as number,
    status: row.status as "open" | "completed",
    frequency: (row.frequency as "once" | "daily" | "weekly" | undefined) ?? "once",
    createdBy: row.created_by as string,
    completedBy: (row.completed_by as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapCompletedTask(
  row: Record<string, unknown>
): CompletedTask {
  return {
    ...mapTask(row),
    completerName:
      (row.completer as { name: string } | null)?.name ?? null,
  };
}
