import { useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  useEffect(() => {
    void (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      // Cancel any stale daily reminders and reschedule fresh
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "TidyUp 🧹",
          body: "Don't forget to complete your tasks today!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });
    })();
  }, []);

  const notifyTaskComplete = useCallback(
    async (taskTitle: string, points: number) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task complete! 🎉",
          body: `"${taskTitle}" done — +${points} pts earned`,
        },
        trigger: null,
      });
    },
    []
  );

  return { notifyTaskComplete };
}
