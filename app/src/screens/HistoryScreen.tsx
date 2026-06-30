import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { api, Completion } from '../services/api';
import { colors, fonts, spacing, radius } from '../theme';

const STATS_GUY = require('../../assets/stats-guy.png');
const STATS_GIRL = require('../../assets/stats-girl.png');

type TimeRange = '7d' | '6w' | '6m';

const RANGE_LABELS: Record<TimeRange, string> = { '7d': '7D', '6w': '6W', '6m': '6M' };

const CATEGORIES = [
  { emoji: '🍳', name: 'Kitchen',  samVal: 124, jordanVal: 58 },
  { emoji: '🧹', name: 'Cleaning', samVal: 62,  jordanVal: 98 },
  { emoji: '🧺', name: 'Laundry',  samVal: 80,  jordanVal: 82 },
  { emoji: '🌿', name: 'Outdoor',  samVal: 34,  jordanVal: 88 },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface ChartData {
  myPoints: number[];
  partnerPoints: number[];
  labels: string[];
}

function computeChartData(completions: Completion[], myUserId: string, range: TimeRange): ChartData {
  // All completedAt values are stored as UTC ISO strings.
  // Use UTC-based math throughout so timezone never shifts bucket boundaries.
  const nowUtc = new Date();
  const todayUtc = nowUtc.toISOString().slice(0, 10); // "YYYY-MM-DD"

  if (range === '7d') {
    const myPoints: number[] = [];
    const partnerPoints: number[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const ms = Date.parse(todayUtc + 'T00:00:00Z') - i * 86400000;
      const dateStr = new Date(ms).toISOString().slice(0, 10);
      const dayOfWeek = new Date(ms).getUTCDay();
      labels.push(DAY_NAMES[dayOfWeek]);
      const day = completions.filter((c) => c.completedAt.slice(0, 10) === dateStr);
      myPoints.push(day.filter((c) => c.userId === myUserId).reduce((s, c) => s + c.pointsEarned, 0));
      partnerPoints.push(day.filter((c) => c.userId !== myUserId).reduce((s, c) => s + c.pointsEarned, 0));
    }
    return { myPoints, partnerPoints, labels };
  }

  if (range === '6w') {
    const myPoints: number[] = [];
    const partnerPoints: number[] = [];
    const labels: string[] = [];
    // Find the most recent Monday in UTC
    const todayMs = Date.parse(todayUtc + 'T00:00:00Z');
    const utcDay = new Date(todayMs).getUTCDay(); // 0=Sun, 1=Mon...
    const thisMondayMs = todayMs - (utcDay === 0 ? 6 : utcDay - 1) * 86400000;

    for (let i = 5; i >= 0; i--) {
      const weekStartMs = thisMondayMs - i * 7 * 86400000;
      const weekEndMs = weekStartMs + 7 * 86400000;
      const weekStartIso = new Date(weekStartMs).toISOString();
      const weekEndIso = new Date(weekEndMs).toISOString();
      labels.push(`W${6 - i}`);
      const week = completions.filter(
        (c) => c.completedAt >= weekStartIso && c.completedAt < weekEndIso
      );
      myPoints.push(week.filter((c) => c.userId === myUserId).reduce((s, c) => s + c.pointsEarned, 0));
      partnerPoints.push(week.filter((c) => c.userId !== myUserId).reduce((s, c) => s + c.pointsEarned, 0));
    }
    return { myPoints, partnerPoints, labels };
  }

  // 6m — use UTC year/month to avoid local-midnight shifting the month boundary
  const myPoints: number[] = [];
  const partnerPoints: number[] = [];
  const labels: string[] = [];
  const utcYear = nowUtc.getUTCFullYear();
  const utcMonth = nowUtc.getUTCMonth(); // 0-indexed
  for (let i = 5; i >= 0; i--) {
    // Compute target month in UTC
    let yr = utcYear;
    let mo = utcMonth - i;
    if (mo < 0) { yr -= 1; mo += 12; }
    const monthStr = `${yr}-${String(mo + 1).padStart(2, '0')}`;
    labels.push(MONTH_NAMES[mo]);
    const month = completions.filter((c) => c.completedAt.slice(0, 7) === monthStr);
    myPoints.push(month.filter((c) => c.userId === myUserId).reduce((s, c) => s + c.pointsEarned, 0));
    partnerPoints.push(month.filter((c) => c.userId !== myUserId).reduce((s, c) => s + c.pointsEarned, 0));
  }
  return { myPoints, partnerPoints, labels };
}

const CHART_H = 80;

function MomentumBars({ data, myName, partnerName }: { data: ChartData; myName: string; partnerName: string }) {
  const maxVal = Math.max(...data.myPoints, ...data.partnerPoints, 1);
  return (
    <View>
      <View style={{ height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        {data.myPoints.map((myPts, i) => {
          const ptPts = data.partnerPoints[i];
          const myH = myPts > 0 ? Math.max(Math.round((myPts / maxVal) * CHART_H), 5) : 2;
          const ptH = ptPts > 0 ? Math.max(Math.round((ptPts / maxVal) * CHART_H), 5) : 2;
          return (
            <View key={i} style={{ flex: 1, height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
              <View style={{ flex: 1, height: myH, backgroundColor: myPts > 0 ? '#15795C' : '#E8F0E4', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
              <View style={{ flex: 1, height: ptH, backgroundColor: ptPts > 0 ? '#EE8C3C' : '#E8F0E4', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 5 }}>
        {data.labels.map((l, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.xLabel}>{l}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#15795C' }]} />
          <Text style={styles.legendText}>{myName}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#EE8C3C' }]} />
          <Text style={styles.legendText}>{partnerName}</Text>
        </View>
      </View>
    </View>
  );
}

function fmt(n: number) { return n.toLocaleString(); }

function SplitBar({ samPct, height = 8 }: { samPct: number; height?: number }) {
  return (
    <View style={[styles.splitBarTrack, { height }]}>
      <LinearGradient
        colors={['#27A07C', '#15795C']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.splitBarSam, { width: `${samPct}%` as any }]}
      />
      <LinearGradient
        colors={['#F4A968', '#EE8C3C']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.splitBarJordan}
      />
    </View>
  );
}

export default function HistoryScreen() {
  const { scores, userId, household } = useStore();
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [range, setRange] = useState<TimeRange>('6m');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setFetchError(null);
    api.history.get(500)
      .then((d) => { setCompletions(d.completions); setLoading(false); })
      .catch((e) => { console.error('History fetch failed:', e); setFetchError(e?.message ?? 'Failed to load'); setLoading(false); });
  }, []));

  const myScore = scores.find((s) => s.userId === userId);
  const partnerScore = scores.find((s) => s.userId !== userId);

  const samPts = myScore?.totalPoints ?? 0;
  const jordanPts = partnerScore?.totalPoints ?? 0;
  const total = samPts + jordanPts || 1;
  const samPct = Math.round((samPts / total) * 100);

  const myName = household?.member1Name ?? myScore?.userName?.split(' ')[0] ?? 'You';
  const partnerName = household?.member2Name ?? partnerScore?.userName?.split(' ')[0] ?? 'Partner';

  const chartData = computeChartData(completions, userId ?? '', range);
  const rangeTitle = range === '7d' ? 'LAST 7 DAYS' : range === '6w' ? 'LAST 6 WEEKS' : 'LAST 6 MONTHS';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.label}>ALL TIME</Text>
        <Text style={styles.title}>Stats</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Card 1 — Head to Head */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ALL TIME · HEAD TO HEAD</Text>
          <View style={styles.h2hRow}>
            <View style={styles.h2hSide}>
              <Image source={STATS_GUY} style={[styles.statsMascot, { mixBlendMode: 'multiply' } as any]} resizeMode="contain" />
              <Text style={styles.h2hName}>{myName}</Text>
              <Text style={[styles.h2hScore, { color: '#15795C' }]}>{fmt(samPts)}</Text>
            </View>
            <View style={styles.vsCenter}>
              <View style={styles.vsStar}>
                <Text style={styles.vsStarText}>VS</Text>
              </View>
            </View>
            <View style={styles.h2hSide}>
              <Image source={STATS_GIRL} style={[styles.statsMascot, { mixBlendMode: 'multiply' } as any]} resizeMode="contain" />
              <Text style={styles.h2hName}>{partnerName}</Text>
              <Text style={[styles.h2hScore, { color: '#EE8C3C' }]}>{fmt(jordanPts)}</Text>
            </View>
          </View>
          <SplitBar samPct={samPct} height={8} />
          <View style={styles.splitLabels}>
            <Text style={styles.splitLabelSam}>{samPct}% · {fmt(samPts)} pts</Text>
            <Text style={styles.splitLabelJordan}>{100 - samPct}% · {fmt(jordanPts)} pts</Text>
          </View>
        </View>

        {/* Card 2 — Momentum */}
        <View style={styles.card}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.cardLabel}>MOMENTUM · {rangeTitle}</Text>
            <View style={styles.toggleRow}>
              {(['7d', '6w', '6m'] as TimeRange[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.toggleChip, range === r && styles.toggleChipActive]}
                  onPress={() => setRange(r)}
                >
                  <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>
                    {RANGE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.chartEmpty}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : fetchError ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>⚠️ {fetchError}</Text>
            </View>
          ) : completions.length === 0 ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>No activity yet — claim some chores! 🧹</Text>
            </View>
          ) : (
            <MomentumBars data={chartData} myName={myName} partnerName={partnerName} />
          )}
        </View>

        {/* Card 3 — By Category */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>BY CATEGORY</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((cat) => {
              const pct = Math.round((cat.samVal / (cat.samVal + cat.jordanVal)) * 100);
              return (
                <View key={cat.name} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{cat.emoji} {cat.name}</Text>
                    <Text style={styles.catValues}>{myName} {cat.samVal} · {partnerName} {cat.jordanVal}</Text>
                  </View>
                  <SplitBar samPct={pct} height={7} />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 4 },
  label: { fontSize: 11, fontFamily: fonts.bodyExtraBold, color: '#9EBBA4', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontSize: 22, fontFamily: fonts.headingBold, color: '#16463A', lineHeight: 23, marginTop: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 48, gap: 10 },

  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 14,
    shadowColor: '#14463840',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  cardLabel: { fontSize: 11, fontFamily: fonts.bodyExtraBold, color: '#9EBBA4', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  // Head to head
  h2hRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  h2hSide: { flex: 1, alignItems: 'center' },
  statsMascot: { height: 72, width: 72 },
  h2hName: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: '#16463A', marginTop: 2 },
  h2hScore: { fontSize: 28, fontFamily: fonts.headingBold, lineHeight: 30 },
  vsCenter: { flex: 0, width: 64, alignItems: 'center' },
  vsStar: { width: 36, height: 36, backgroundColor: '#A6D44F', alignItems: 'center', justifyContent: 'center' },
  vsStarText: { fontSize: 12, fontFamily: fonts.headingBold, color: '#2c5a16' },

  // Split bar
  splitBarTrack: { borderRadius: 999, backgroundColor: colors.background, overflow: 'hidden', flexDirection: 'row' },
  splitBarSam: { borderRadius: 999 },
  splitBarJordan: { flex: 1, borderRadius: 999 },
  splitLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  splitLabelSam: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#15795C' },
  splitLabelJordan: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#EE8C3C' },

  // Momentum chart header
  chartHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  toggleRow: { flexDirection: 'row', gap: 5 },
  toggleChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#C8DDB8',
    backgroundColor: colors.white,
  },
  toggleChipActive: { backgroundColor: '#15795C', borderColor: '#15795C' },
  toggleText: { fontSize: 11, fontFamily: fonts.bodyExtraBold, color: '#15795C' },
  toggleTextActive: { color: colors.white },

  // Chart
  chartEmpty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#9EBBA4', textAlign: 'center' },
  xLabel: { fontSize: 9, fontFamily: fonts.bodyBold, color: '#9EBBA4' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#16463A' },

  // By category
  categories: { gap: 9 },
  catRow: { gap: 4 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 11, fontFamily: fonts.bodyExtraBold, color: '#16463A' },
  catValues: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#9EBBA4' },
});
