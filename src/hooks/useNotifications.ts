import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Task } from "../types/models";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let hasShownOverdue = false;

function formatTaskList(titles: string[]): string {
  if (titles.length <= 3) return titles.join(", ");
  return titles.slice(0, 3).join(", ") + ` + ${titles.length - 3} more`;
}

async function scheduleTaskReminders(
  tasks: Task[],
  userId: string
): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  hasShownOverdue = false;

  const assigned = tasks.filter(
    (t) => t.assignedTo === userId && t.status === "open"
  );
  if (assigned.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const withDue = assigned.filter((t) => t.dueDate);
  const dueToday = withDue.filter((t) => t.dueDate === todayStr);
  const overdue = withDue.filter(
    (t) => new Date(t.dueDate + "T00:00:00") < today
  );

  if (dueToday.length > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Tasks due today",
        body: formatTaskList(dueToday.map((t) => t.title)),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  }

  if (overdue.length > 0 && !hasShownOverdue) {
    hasShownOverdue = true;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Overdue tasks",
        body: formatTaskList(overdue.map((t) => t.title)),
      },
      trigger: null,
    });
  }

  // Evening fallback reminder for any assigned tasks
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "TidyUp",
      body: "Don't forget to complete your tasks today!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });
}

async function notifyTaskAssigned(taskTitle: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New task assigned",
      body: `You've been assigned: ${taskTitle}`,
    },
    trigger: null,
  });
}

export function useNotifications() {
  const notifyTaskComplete = useCallback(
    async (taskTitle: string, points: number) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task complete!",
          body: `"${taskTitle}" done — +${points} pts earned`,
        },
        trigger: null,
      });
    },
    []
  );

  return { notifyTaskComplete, scheduleTaskReminders, notifyTaskAssigned };
}
