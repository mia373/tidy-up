export interface Home {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  homeId: string | null;
  points: number;
  createdAt: string;
}

export interface Task {
  id: string;
  homeId: string;
  title: string;
  points: number;
  status: "open" | "completed";
  createdBy: string;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Tasks: undefined;
  AddTask: undefined;
  Leaderboard: undefined;
};
