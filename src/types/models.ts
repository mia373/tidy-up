import { Timestamp } from "firebase/firestore";

export interface Home {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdAt: Timestamp;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  homeId: string | null;
  points: number;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  homeId: string;
  title: string;
  points: number;
  status: "open" | "completed";
  createdBy: string;
  completedBy: string | null;
  completedAt: Timestamp | null;
  createdAt: Timestamp;
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
