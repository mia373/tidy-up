import React from "react";
import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/models";
import { colors } from "../theme";
import TasksScreen from "../screens/TasksScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Tasks: "✏️",
  AddTask: "➕",
  Leaderboard: "🏆",
};

// Outer View fills the corner gaps with the screen background color.
// Inner View is the cream pill with rounded top corners.
function TabBarBackground() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFF8E7",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }}
      />
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 12,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{ tabBarLabel: "Add Task" }}
      />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
}
