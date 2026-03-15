# TidyUp — App Demo

A multi-user household task manager with gamified rewards. Built with **Expo + React Native**, **TypeScript**, and **Supabase**.

---

## Screenshots

### Tasks
Browse open chores grouped by room, see who they're assigned to, and mark them done to earn points. Overdue tasks are highlighted in red.

![Tasks Screen](demo/Image_20260314231909_1_34.png)

---

### Add Task
Create a task with a title, point value, optional room, due date, repeat schedule (once / daily / weekly), and assign it to a household member.

![Add Task Screen](demo/Image_20260314231911_2_34.png)

---

### AI Task Suggestions
Generate a tailored chore list based on your home profile (rooms, pets, etc.). Re-roll suggestions per room and bulk-add selected tasks in one tap.

![Review Tasks Screen](demo/Image_20260314231923_7_34.png)

---

### Leaderboard — Ranking
Live leaderboard showing all household members ranked by points earned.

![Leaderboard Ranking](demo/Image_20260314231913_3_34.png)

---

### Leaderboard — Stats
Points-over-time chart per member with 7-day / 30-day / all-time filters and line or bar views.

![Leaderboard Stats](demo/Image_20260314231915_4_34.png)

---

### Wishlist
Spend earned points on household rewards. Locked rewards show how many more points are needed.

![Wishlist Screen](demo/Image_20260314231919_5_34.png)

---

### Settings
Edit your display name and share the home's invite code so others can join.

![Settings Screen](demo/Image_20260314231921_6_34.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo + React Native (TypeScript strict) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| State | Zustand |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| Build | Expo EAS |
