# TidyUp 🏠✨

A gamified household task manager — earn points for chores, compete with your housemates.

## What It Does

- Create or join a household via invite code
- Add chores with point values
- Mark tasks complete to earn points
- Live leaderboard ranks everyone in the home

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Framework    | Expo + React Native (TypeScript)                 |
| Auth         | Supabase Auth (email/password)                   |
| Database     | Supabase Postgres (real-time via channels)       |
| State        | Zustand                                          |
| Navigation   | React Navigation                                 |
| Build/Deploy | Expo EAS (cloud builds for iOS)                  |

## Prerequisites

- **Node.js** ≥ 18 LTS
- **npm** (comes with Node)
- **Expo Go** app on your phone (for development testing)
- **Supabase project** (free tier works)
- **EAS CLI** (`npm install -g eas-cli`) — only needed for App Store / TestFlight builds

> **Windows users:** You do NOT need a Mac. EAS builds iOS in the cloud.

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd tidyup
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → create a new project
2. **Authentication → Providers → Email** → toggle off **"Confirm email"** → Save
3. **SQL Editor** → New query → paste contents of `supabase-setup.sql` → Run
4. **Project Settings → API** → copy **Project URL** and **Publishable** key

### 3. Environment Variables

Create a `.env` file in the project root (this file is git-ignored):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_publishable_key
```

### 4. Run in Expo Go

```bash
npx expo start
```

Scan the QR code with Expo Go — Supabase Auth works fully in Expo Go with no native build required.

### 5. Build for iOS (App Store / TestFlight)

```bash
# Login to Expo
eas login

# Configure the project (first time only)
eas build:configure

# Build for iOS
eas build --platform ios
```

EAS will build in the cloud and give you a download link or push to TestFlight.

## Project Structure

```
/src
├── app.tsx               # Entry point
├── theme.ts              # Colors, spacing, typography
├── navigation/           # Auth gate + tab navigator
├── screens/              # One file per screen
├── components/           # Reusable UI pieces
├── services/             # Supabase calls (auth, tasks, homes, leaderboard, settings)
├── store/                # Zustand state
├── hooks/                # Custom React hooks
├── types/                # TypeScript interfaces
└── utils/                # Helpers (invite code generator, mappers)
```

## Available Scripts

| Command                    | What it does                   |
| -------------------------- | ------------------------------ |
| `npx expo start`           | Start dev server (Expo Go)     |
| `eas build --platform ios` | Cloud build for iOS            |
| `npx eslint src/`          | Lint TypeScript files          |
| `npx tsc --noEmit`         | Type-check without emitting    |

## MVP Scope

The MVP includes: email auth, home creation/joining via invite code, task CRUD, point tracking, and a leaderboard. That's it — intentionally small to ship fast.

## Post-MVP Features

These features have been implemented beyond the MVP:

- **Push notifications** — alerts for new tasks (expo-notifications)
- **Recurring tasks** — frequency field with automatic reopen logic
- **Streak tracking** — consecutive days of completing tasks
- **Task history screen** — view all completed tasks
- **Settings screen** — leave home, change display name

## License

MIT
