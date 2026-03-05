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
  room: string | null;
  createdBy: string;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CompletedTask extends Task {
  completerName: string | null;
}

export interface WishlistItem {
  id: string;
  homeId: string;
  title: string;
  description: string | null;
  cost: number;
  imageUrl: string | null;
  createdBy: string;
  redeemedBy: string | null;
  redeemedAt: string | null;
  redeemerName: string | null;
  status: "available" | "redeemed";
  createdAt: string;
}

export interface SuggestedTask {
  title: string;
  points: number;
  room: string;
}

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  HomeSetup: undefined;
  Main: undefined;
  HomeProfile: { mode?: "edit" } | undefined;
  SuggestedTasks: { tasks: SuggestedTask[] };
  AddWishlistItem: undefined;
};

export type MainTabParamList = {
  Tasks: undefined;
  AddTask: undefined;
  Leaderboard: undefined;
  Wishlist: undefined;
  History: undefined;
  Settings: undefined;
};
