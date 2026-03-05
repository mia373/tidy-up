import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, StackedBarChart } from "react-native-chart-kit";
import { colors, spacing, shadow } from "../theme";
import { subscribeToLeaderboard } from "../services/leaderboard";
import { fetchPointHistory, PointHistoryEntry } from "../services/analytics";
import { useAuthStore } from "../store/useAuthStore";
import { AppUser } from "../types/models";

const MEDALS = ["🥇", "🥈", "🥉"];
const CHART_WIDTH = Dimensions.get("window").width - spacing.lg * 2;
const USER_COLORS = ["#548BF8", "#FF6B6B", "#68D368", "#F97316", "#A855F7", "#EC4899"];

type Tab = "leaderboard" | "stats";
type TimeRange = 7 | 30 | null;
type ChartType = "line" | "bar";

// --- Chart helpers ---

type Period = { label: string; dates: string[] };

function buildPeriods(timeRange: TimeRange): Period[] {
  const today = new Date();

  if (timeRange === 7 || timeRange === 30) {
    const periods: Period[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const showLabel = timeRange === 7 || i % 5 === 0;
      const label = showLabel ? `${d.getMonth() + 1}/${d.getDate()}` : "";
      periods.push({ label, dates: [dateStr] });
    }
    return periods;
  }

  // All time: 12 weekly buckets
  const periods: Period[] = [];
  for (let week = 11; week >= 0; week--) {
    const weekDates: string[] = [];
    for (let day = 6; day >= 0; day--) {
      const d = new Date(today);
      d.setDate(today.getDate() - week * 7 - day);
      weekDates.push(d.toISOString().split("T")[0]);
    }
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - week * 7);
    const label = week % 2 === 0 ? `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}` : "";
    periods.push({ label, dates: weekDates });
  }
  return periods;
}

function buildEventLookup(events: PointHistoryEntry[]): Record<string, Record<string, number>> {
  const lookup: Record<string, Record<string, number>> = {};
  for (const e of events) {
    if (!lookup[e.userId]) lookup[e.userId] = {};
    lookup[e.userId][e.date] = (lookup[e.userId][e.date] ?? 0) + e.totalPoints;
  }
  return lookup;
}

function getUniqueUsers(events: PointHistoryEntry[]): { id: string; name: string }[] {
  const map: Record<string, string> = {};
  for (const e of events) map[e.userId] = e.userName;
  return Object.entries(map).map(([id, name]) => ({ id, name }));
}

function computeWeeklySummary(events: PointHistoryEntry[]): string | null {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceStr = since.toISOString().split("T")[0];

  const weekEvents = events.filter((e) => e.date >= sinceStr);
  if (weekEvents.length === 0) return null;

  const totals: Record<string, { name: string; pts: number }> = {};
  for (const e of weekEvents) {
    if (!totals[e.userId]) totals[e.userId] = { name: e.userName, pts: 0 };
    totals[e.userId].pts += e.totalPoints;
  }

  const top = Object.values(totals).reduce((a, b) => (b.pts > a.pts ? b : a));
  return `This week: ${top.name} earned the most (${top.pts} pts) 🏆`;
}

// --- Component ---

export default function LeaderboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const [tab, setTab] = useState<Tab>("leaderboard");
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [historyData, setHistoryData] = useState<PointHistoryEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!user?.homeId) return;
    const unsubscribe = subscribeToLeaderboard(user.homeId, (result) => {
      setMembers(result);
      setLoadingLeaderboard(false);
    });
    return () => unsubscribe();
  }, [user?.homeId]);

  useEffect(() => {
    if (tab !== "stats" || !user?.homeId) return;
    setLoadingStats(true);
    fetchPointHistory(user.homeId, timeRange)
      .then(setHistoryData)
      .catch((err: Error) => Alert.alert("Error", err.message))
      .finally(() => setLoadingStats(false));
  }, [tab, timeRange, user?.homeId]);

  const chartData = useMemo(() => {
    if (historyData.length === 0) return null;

    const periods = buildPeriods(timeRange);
    const users = getUniqueUsers(historyData);
    const lookup = buildEventLookup(historyData);
    const userColors = users.map((_, i) => USER_COLORS[i % USER_COLORS.length]);
    const labels = periods.map((p) => p.label);

    if (chartType === "line") {
      const datasets = users.map((u, i) => {
        let cumulative = 0;
        const data = periods.map((p) => {
          for (const d of p.dates) cumulative += lookup[u.id]?.[d] ?? 0;
          return cumulative;
        });
        return { data, color: () => userColors[i], strokeWidth: 2 };
      });
      if (labels.length < 2) {
        labels.unshift("");
        datasets.forEach((ds) => ds.data.unshift(0));
      }
      return { type: "line" as const, lineData: { labels, datasets }, users, userColors };
    }

    // Bar chart
    const data = periods.map((p) =>
      users.map((u) => p.dates.reduce((sum, d) => sum + (lookup[u.id]?.[d] ?? 0), 0))
    );
    const legend = users.map((u) => u.name);
    return {
      type: "bar" as const,
      barData: { labels, legend, data, barColors: userColors },
      users,
      userColors,
    };
  }, [historyData, timeRange, chartType]);

  const weeklySummary = useMemo(
    () => (historyData.length > 0 ? computeWeeklySummary(historyData) : null),
    [historyData]
  );

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(84, 139, 248, ${opacity})`,
    labelColor: () => colors.text,
    style: { borderRadius: 12 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: colors.border },
  };

  const numPeriods = buildPeriods(timeRange).length;
  const showDots = numPeriods <= 14;

  const renderStatsContent = () => {
    if (loadingStats) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
    }

    if (historyData.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Complete some tasks to see your stats!</Text>
        </View>
      );
    }

    return (
      <>
        {chartData?.type === "line" && chartData.lineData && (
          <LineChart
            data={chartData.lineData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
            withDots={showDots}
            style={styles.chart}
          />
        )}
        {chartData?.type === "bar" && chartData.barData && (
          <StackedBarChart
            data={chartData.barData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            hideLegend
          />
        )}

        {/* Custom legend */}
        {chartData && (
          <View style={styles.legend}>
            {chartData.users.map((u, i) => (
              <View key={u.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: chartData.userColors[i] }]} />
                <Text style={styles.legendLabel}>{u.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weekly summary callout */}
        {weeklySummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{weeklySummary}</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboard ✨</Text>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "leaderboard" && styles.tabBtnActive]}
          onPress={() => setTab("leaderboard")}
        >
          <Text style={[styles.tabBtnText, tab === "leaderboard" && styles.tabBtnTextActive]}>
            Ranking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "stats" && styles.tabBtnActive]}
          onPress={() => setTab("stats")}
        >
          <Text style={[styles.tabBtnText, tab === "stats" && styles.tabBtnTextActive]}>
            Stats 📊
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "leaderboard" ? (
        loadingLeaderboard ? (
          <ActivityIndicator size="large" color={colors.border} style={styles.loader} />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.row,
                  item.id === user?.id && styles.rowHighlight,
                  index === 0 && styles.rowFirst,
                ]}
              >
                <Text style={styles.medal}>
                  {index < 3 ? MEDALS[index] : `${index + 1}.`}
                </Text>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                  {item.id === user?.id ? " (you)" : ""}
                </Text>
                <View style={styles.pointsPill}>
                  <Text style={styles.points}>{item.points} pts</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🌸</Text>
                <Text style={styles.emptyText}>No members yet.</Text>
              </View>
            }
            contentContainerStyle={members.length === 0 ? styles.emptyContainer : styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.statsContent}>
          {/* Time range selector */}
          <View style={styles.controlRow}>
            {([7, 30, null] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={String(range)}
                style={[styles.controlBtn, timeRange === range && styles.controlBtnActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  style={[
                    styles.controlBtnText,
                    timeRange === range && styles.controlBtnTextActive,
                  ]}
                >
                  {range === 7 ? "7 days" : range === 30 ? "30 days" : "All time"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart type selector */}
          <View style={styles.controlRow}>
            {(["line", "bar"] as ChartType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.controlBtn, chartType === type && styles.controlBtnActive]}
                onPress={() => setChartType(type)}
              >
                <Text
                  style={[
                    styles.controlBtnText,
                    chartType === type && styles.controlBtnTextActive,
                  ]}
                >
                  {type === "line" ? "Line 📈" : "Bar 📊"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderStatsContent()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  // --- Tab toggle ---
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    padding: 3,
    ...shadow,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  // --- Leaderboard list ---
  list: {
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  rowHighlight: {
    backgroundColor: "#E8F0FF",
  },
  rowFirst: {
    backgroundColor: colors.accent,
  },
  medal: {
    fontSize: 24,
    width: 38,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  pointsPill: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  points: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  // --- Stats tab ---
  statsContent: {
    paddingBottom: spacing.lg,
  },
  controlRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  controlBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  controlBtnTextActive: {
    color: "#fff",
  },
  chart: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  // --- Shared empty state ---
  empty: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    opacity: 0.6,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
