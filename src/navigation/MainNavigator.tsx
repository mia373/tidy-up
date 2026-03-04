import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/models";
import TasksScreen from "../screens/TasksScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="AddTask" component={AddTaskScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
}
