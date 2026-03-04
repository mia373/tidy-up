export type HomeType = 'apartment' | 'house' | 'dorm' | 'studio';

export interface Home {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdAt: string;
  homeType: HomeType | null;
  rooms: string[];
  hasPets: boolean;
  memberCount: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  homeId: string | null;
  points: number;
  streak: number;
  lastStreakDate: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  homeId: string;
  title: string;
  points: number;
  status: "open" | "completed";
  frequency: "once" | "daily" | "weekly";
  createdBy: string;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CompletedTask extends Task {
  completerName: string | null;
}

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Tasks: undefined;
  AddTask: undefined;
  Leaderboard: undefined;
  History: undefined;
  Settings: undefined;
};
