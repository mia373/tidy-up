import { AppUser, Home, Task } from "../types/models";

export function mapUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    homeId: (row.home_id as string | null) ?? null,
    points: row.points as number,
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
  };
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    homeId: row.home_id as string,
    title: row.title as string,
    points: row.points as number,
    status: row.status as "open" | "completed",
    createdBy: row.created_by as string,
    completedBy: (row.completed_by as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
