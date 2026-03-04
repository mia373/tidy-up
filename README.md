# TidyUp 🏠✨

A gamified household task manager — earn points for chores, compete with your housemates.

## What It Does

- Create or join a household via invite code
- Add chores with point values
- Mark tasks complete to earn points
- Live leaderboard ranks everyone in the home

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Expo + React Native (TypeScript)    |
| Auth         | Firebase Authentication (email/pw)  |
| Database     | Cloud Firestore (real-time)         |
| State        | Zustand                             |
| Navigation   | React Navigation                    |
| Build/Deploy | Expo EAS (cloud builds for iOS)     |

## Prerequisites

- **Node.js** ≥ 18 LTS
- **npm** (comes with Node)
- **EAS CLI:** `npm install -g eas-cli`
- **Firebase project** with Auth + Firestore enabled
- **Apple Developer Account** ($99/year) for iOS builds via EAS

> **Windows users:** You do NOT need a Mac. EAS builds iOS in the cloud.

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd tidyup
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a new project called `tidyup`
2. Enable **Authentication** → Sign-in method → Email/Password → Enable
3. Enable **Cloud Firestore** → Create database → Start in test mode (we'll lock it down next)
4. Go to Project Settings → Your Apps → Add Web App → Copy the config object

### 3. Environment Variables

Create a `.env` file in the project root (this file is git-ignored):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /homes/{homeId} {
      allow read: if request.auth != null
                  && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null
                    && request.auth.uid in resource.data.members;
    }

    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 5. Run Locally

```bash
npx expo start
```

Scan the QR code with Expo Go for quick preview (note: full Firebase Auth requires a dev build — see below).

### 6. Build for iOS (from Windows)

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
├── services/             # Firebase calls (auth, tasks, homes)
├── store/                # Zustand state
├── hooks/                # Custom React hooks
├── types/                # TypeScript interfaces
└── utils/                # Helpers (invite code generator, etc.)
```

## Available Scripts

| Command                    | What it does                  |
| -------------------------- | ----------------------------- |
| `npx expo start`           | Start dev server              |
| `eas build --platform ios` | Cloud build for iOS           |
| `npx eslint src/`          | Lint TypeScript files         |
| `npx tsc --noEmit`         | Type-check without emitting   |

## MVP Scope

The MVP includes: email auth, home creation/joining via invite code, task CRUD, point tracking, and a leaderboard. That's it — intentionally small to ship fast.

## Post-MVP Roadmap

- Push notifications for new tasks
- Task reminders and recurring tasks
- Streak system (consecutive days of completing tasks)
- AI task suggestions
- Apple Watch widget

## License

MIT
