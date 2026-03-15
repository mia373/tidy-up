# TidyUp — App Demo

A multi-user household task manager with gamified rewards. Built with **Expo + React Native**, **TypeScript**, and **Supabase**.

---

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src="demo/tasks.png" width="220" /><br/>
      <b>Tasks</b><br/>
      Browse open chores grouped by room, see who they're assigned to, and mark them done to earn points. Overdue tasks are highlighted in red.
    </td>
    <td align="center">
      <img src="demo/add_task.png" width="220" /><br/>
      <b>Add Task</b><br/>
      Create a task with a title, point value, optional room, due date, repeat schedule (once / daily / weekly), and assign it to a household member.
    </td>
    <td align="center">
      <img src="demo/ai_task_suggestions.png" width="220" /><br/>
      <b>AI Task Suggestions</b><br/>
      Generate a tailored chore list based on your home profile (rooms, pets, etc.). Re-roll suggestions per room and bulk-add selected tasks in one tap.
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="demo/leaderboard_ranking.png" width="220" /><br/>
      <b>Leaderboard — Ranking</b><br/>
      Live leaderboard showing all household members ranked by points earned.
    </td>
    <td align="center">
      <img src="demo/leaderboard_stats.png" width="220" /><br/>
      <b>Leaderboard — Stats</b><br/>
      Points-over-time chart per member with 7-day / 30-day / all-time filters and line or bar views.
    </td>
    <td align="center">
      <img src="demo/wishlist.png" width="220" /><br/>
      <b>Wishlist</b><br/>
      Spend earned points on household rewards. Locked rewards show how many more points are needed.
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="demo/settings.png" width="220" /><br/>
      <b>Settings</b><br/>
      Edit your display name and share the home's invite code so others can join.
    </td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo + React Native (TypeScript strict) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| State | Zustand |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| Build | Expo EAS |
