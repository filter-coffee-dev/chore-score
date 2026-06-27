import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api, Completion } from '../services/api';
import { useStore } from '../store/useStore';
import { colors, spacing, fontSize, radius, shadow } from '../theme';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { completions, setCompletions, userId } = useStore();

  const load = useCallback(async () => {
    try {
      const data = await api.history.get(100);
      setCompletions(data.completions);
    } catch {}
  }, [setCompletions]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Group by date
  const grouped: { date: string; items: Completion[] }[] = [];
  for (const c of completions) {
    const date = formatDate(c.completedAt);
    const existing = grouped.find((g) => g.date === date);
    if (existing) existing.items.push(c);
    else grouped.push({ date, items: [c] });
  }

  function renderItem({ item }: { item: Completion }) {
    const isMe = item.userId === userId;
    return (
      <View style={[styles.item, isMe && styles.itemMe]}>
        <Text style={styles.itemEmoji}>{item.choreEmoji}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.choreName}</Text>
          <Text style={styles.itemMeta}>
            {isMe ? 'You' : item.userName} · {formatTime(item.completedAt)}
          </Text>
        </View>
        <View style={[styles.points, isMe && styles.pointsMe]}>
          <Text style={[styles.pointsText, isMe && styles.pointsTextMe]}>+{item.pointsEarned}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>History 📋</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {completions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Nothing here yet.</Text>
          <Text style={styles.emptySubtext}>Go complete some chores. The history will write itself. 📖</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={styles.dateLabel}>{group.date}</Text>
              {group.items.map((c) => renderItem({ item: c }))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },
  refreshIcon: { fontSize: 20 },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  group: { marginBottom: spacing.lg },
  dateLabel: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.text.light,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    ...shadow.sm,
  },
  itemMe: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  itemEmoji: { fontSize: 24, marginRight: spacing.sm },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text.primary },
  itemMeta: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  points: {
    backgroundColor: colors.highlight, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  pointsMe: { backgroundColor: colors.secondary },
  pointsText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text.secondary },
  pointsTextMe: { color: colors.text.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
  emptySubtext: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
});
