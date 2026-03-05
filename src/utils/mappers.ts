import { AppUser, CompletedTask, Home, HomeType, Task, WishlistItem } from "../types/models";

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
  const assignee = row.assignee as { name: string } | null;
  return {
    id: row.id as string,
    homeId: row.home_id as string,
    title: row.title as string,
    points: row.points as number,
    status: row.status as "open" | "completed",
    frequency: (row.frequency as "once" | "daily" | "weekly" | undefined) ?? "once",
    room: (row.room as string | null) ?? null,
    assignedTo: (row.assigned_to as string | null) ?? null,
    assigneeName: assignee?.name ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    createdBy: row.created_by as string,
    completedBy: (row.completed_by as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapWishlistItem(row: Record<string, unknown>): WishlistItem {
  const redeemer = row.redeemer as { name: string } | null;
  return {
    id: row.id as string,
    homeId: row.home_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    cost: row.cost as number,
    imageUrl: (row.image_url as string | null) ?? null,
    createdBy: row.created_by as string,
    redeemedBy: (row.redeemed_by as string | null) ?? null,
    redeemedAt: (row.redeemed_at as string | null) ?? null,
    redeemerName: redeemer?.name ?? null,
    status: row.status as "available" | "redeemed",
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
