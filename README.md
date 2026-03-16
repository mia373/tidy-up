# TidyUp 🏠✨

A gamified household task manager — earn points for chores, compete with your housemates.

## Demo

https://github.com/mia373/tidy-up/blob/main/DEMO.md

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
| AI           | Gemini 2.5 Flash Lite (via Supabase Edge Function) |
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

### 4. Deploy the AI Edge Function

The AI task generation feature uses a Supabase Edge Function backed by **Gemini 2.5 Flash Lite** (free tier available at [aistudio.google.com](https://aistudio.google.com)).

**Option A: Supabase Dashboard (no CLI needed)**
1. Go to **Edge Functions** → create a new function named `generate-tasks`
2. Paste the contents of `supabase/functions/generate-tasks/index.ts`
3. **Edge Functions → Manage secrets** → add `GEMINI_API_KEY` = your Google AI Studio key
4. **Edge Functions → generate-tasks → Settings** → turn off **Verify JWT**

**Option B: Supabase CLI**
```bash
supabase login
supabase link --project-ref your-project-ref
supabase secrets set GEMINI_API_KEY=your-google-ai-studio-key
supabase functions deploy generate-tasks --no-verify-jwt
```

> Skip this step if you're not using the AI task generation feature yet.

### 5. Run in Expo Go

```bash
npx expo start
```

Scan the QR code with Expo Go — Supabase Auth works fully in Expo Go with no native build required.

### 6. Build for iOS (App Store / TestFlight)

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
- **AI task generation** — Gemini 2.5 Flash Lite generates a personalised chore list based on home type, rooms, and pets

## License

MIT
