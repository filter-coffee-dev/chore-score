import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { api, Completion } from '../services/api';
import { colors, fonts, spacing, radius } from '../theme';

const STATS_ASSETS = {
  guy: require('../../assets/stats-guy.png'),
  girl: require('../../assets/stats-girl.png'),
};

type TimeRange = '7d' | '6w' | '6m';

const RANGE_LABELS: Record<TimeRange, string> = { '7d': '7D', '6w': '6W', '6m': '6M' };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface ChartData {
  myPoints: number[];
  partnerPoints: number[];
  labels: string[];
}

function computeChartData(completions: Completion[], myUserId: string, range: TimeRange): ChartData {
  const nowUtc = new Date();
  const todayUtc = nowUtc.toISOString().slice(0, 10);

  if (range === '7d') {
    const myPoints: number[] = [], partnerPoints: number[] = [], labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const ms = Date.parse(todayUtc + 'T00:00:00Z') - i * 86400000;
      const dateStr = new Date(ms).toISOString().slice(0, 10);
      labels.push(DAY_NAMES[new Date(ms).getUTCDay()]);
      const day = completions.filter((c) => c.completedAt.slice(0, 10) === dateStr);
      myPoints.push(day.filter((c) => c.userId === myUserId).reduce((s, c) => s + c.pointsEarned, 0));
      partnerPoints.push(day.filter((c) => c.userId !== myUserId).reduce((s, c) => s + c.pointsEarned, 0));
    }
    return { myPoints, partnerPoints, labels };
  }

  if (range === '6w') {
    const myPoints: number[] = [], partnerPoints: number[] = [], labels: string[] = [];
    const todayMs = Date.parse(todayUtc + 'T00:00:00Z');
    const utcDay = new Date(todayMs).getUTCDay();
    const thisMondayMs = todayMs - (utcDay === 0 ? 6 : utcDay - 1) * 86400000;
    for (let i = 5; i >= 0; i--) {
      const weekStartMs = thisMondayMs - i * 7 * 86400000;
      const weekEndMs = weekStartMs + 7 * 86400000;
      labels.push(`W${6 - i}`);
      const week = completions.filter(
        (c) => c.completedAt >= new Date(weekStartMs).toISOString() && c.completedAt < new Date(weekEndMs).toISOString()
      );
      myPoints.push(week.filter((c) => c.userId === myUserId).reduce((s, c) => s + c.pointsEarned, 0));
      partnerPoints.push(week.filter((c) => c.userId !== myUserId).reduce((s, c) => s + c.pointsEarned, 0));
    }
    return { myPoints, partnerPoints, labels };
  }

  // 6m
  const myPoints: number[] = [], partnerPoints: number[] = [], labels: string[] = [];
  const utcYear = nowUtc.getUTCFullYear(), utcMonth = nowUtc.getUTCMonth();
  for (let i = 5; i >= 0; i--) {
    let yr = utcYear, mo = utcMonth - i;
    if (mo < 0) { yr -= 1; mo += 12; }
    const monthStr = `${yr}-${String(mo + 1).padStart(2, '0')}`;
    labels.push(MONTH_NAMES[mo]);
    const month = completions.filter((c) => c.completedAt.slice(0, 7) === monthStr);
    myPoints.push(month.filter((c) => c.userId === myUserId).reduce((s, c) => s + c.pointsEarned, 0));
    partnerPoints.push(month.filter((c) => c.userId !== myUserId).reduce((s, c) => s + c.pointsEarned, 0));
  }
  return { myPoints, partnerPoints, labels };
}

// ── Line Chart ────────────────────────────────────────────────────────────────

const CHART_H = 110;
const DOT_R = 4;
const LINE_W = 2;

function MomentumLine({ data, myName, partnerName }: { data: ChartData; myName: string; partnerName: string }) {
  const [chartW, setChartW] = useState(0);
  const N = data.myPoints.length;
  const maxVal = Math.max(...data.myPoints, ...data.partnerPoints, 1);

  const xs = data.myPoints.map((_, i) =>
    N <= 1 ? chartW / 2 : (i / (N - 1)) * chartW
  );
  const toY = (v: number) => DOT_R + (1 - v / maxVal) * (CHART_H - DOT_R * 2);
  const myYs = data.myPoints.map(toY);
  const ptYs = data.partnerPoints.map(toY);

  function segments(ys: number[], color: string) {
    return xs.slice(0, -1).map((x0, i) => {
      const x1 = xs[i + 1], y0 = ys[i], y1 = ys[i + 1];
      const dx = x1 - x0, dy = y1 - y0;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      return (
        <View key={i} style={{
          position: 'absolute',
          left: (x0 + x1) / 2 - len / 2,
          top: (y0 + y1) / 2 - LINE_W / 2,
          width: len, height: LINE_W,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }],
        }} />
      );
    });
  }

  function dots(ys: number[], color: string) {
    return xs.map((x, i) => (
      <View key={i} style={{
        position: 'absolute',
        left: x - DOT_R, top: ys[i] - DOT_R,
        width: DOT_R * 2, height: DOT_R * 2,
        borderRadius: DOT_R,
        backgroundColor: color,
        borderWidth: 1.5, borderColor: '#fff',
      }} />
    ));
  }

  const Y_AXIS_W = 26;
  const yTicks = [1, 0.75, 0.5, 0.25, 0];

  // Faint horizontal grid lines
  const gridLines = [0.25, 0.5, 0.75].map((frac) => (
    <View key={frac} style={{
      position: 'absolute',
      left: 0, right: 0,
      top: DOT_R + (1 - frac) * (CHART_H - DOT_R * 2),
      height: 1, backgroundColor: '#E8F0E4',
    }} />
  ));

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Y-axis labels */}
        <View style={{ width: Y_AXIS_W, height: CHART_H }}>
          {yTicks.map((frac) => {
            const y = DOT_R + (1 - frac) * (CHART_H - DOT_R * 2);
            return (
              <Text key={frac} style={{
                position: 'absolute',
                top: y - 5,
                right: 4,
                fontSize: 8,
                fontFamily: fonts.bodyBold,
                color: '#9EBBA4',
                textAlign: 'right',
              }}>
                {Math.round(maxVal * frac)}
              </Text>
            );
          })}
        </View>

        {/* Chart area */}
        <View
          style={{ flex: 1, height: CHART_H }}
          onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
        >
          {gridLines}
          {chartW > 0 && (
            <>
              {segments(myYs, '#15795C')}
              {segments(ptYs, '#EE8C3C')}
              {dots(myYs, '#15795C')}
              {dots(ptYs, '#EE8C3C')}
            </>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 5, marginLeft: Y_AXIS_W }}>
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

// ── Shared sub-components ─────────────────────────────────────────────────────

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

function fmtDate(iso: string) {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${h}:${m}`;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { scores, userId, household, setScores } = useStore();
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [range, setRange] = useState<TimeRange>('6m');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit/unclaim state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPts, setEditPts] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setFetchError(null);
    api.history.get(500)
      .then((d) => { setCompletions(d.completions); setLoading(false); })
      .catch((e) => { console.error('History fetch failed:', e); setFetchError(e?.message ?? 'Failed to load'); setLoading(false); });
  }, []));

  const myScore     = scores.find((s) => s.userId === userId);
  const partnerScore = scores.find((s) => s.userId !== userId);
  const samPts   = myScore?.totalPoints ?? 0;
  const jordanPts = partnerScore?.totalPoints ?? 0;
  const total    = samPts + jordanPts || 1;
  const samPct   = Math.round((samPts / total) * 100);
  const myName      = myScore?.userName?.split(' ')[0] ?? 'You';
  const partnerName = partnerScore?.userName?.split(' ')[0] ?? 'Partner';
  const chartData   = computeChartData(completions, userId ?? '', range);
  const rangeTitle  = range === '7d' ? 'LAST 7 DAYS' : range === '6w' ? 'LAST 6 WEEKS' : 'LAST 6 MONTHS';

  async function handleUnclaim(c: Completion) {
    Alert.alert('Unclaim?', `Remove "${c.choreEmoji} ${c.choreName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unclaim', style: 'destructive',
        onPress: async () => {
          setUnclaimingId(c.completionId);
          try {
            await api.history.delete(c.completionId);
            setCompletions((prev) => prev.filter((x) => x.completionId !== c.completionId));
            api.scores.get().then((d) => setScores(d.scores, d.streak, d.taunt)).catch(() => {});
          } catch (e: unknown) {
            Alert.alert('Error', (e as Error).message);
          } finally {
            setUnclaimingId(null);
          }
        },
      },
    ]);
  }

  async function handleSaveEdit(c: Completion) {
    const pts = Number(editPts);
    if (!pts || pts < 1 || pts > 100) {
      Alert.alert('Invalid', 'Points must be between 1 and 100');
      return;
    }
    setSavingId(c.completionId);
    try {
      await api.history.update(c.completionId, { pointsEarned: pts });
      setCompletions((prev) =>
        prev.map((x) => x.completionId === c.completionId ? { ...x, pointsEarned: pts } : x)
      );
      setEditingId(null);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#c8e0d4" />
      <View style={styles.header}>
        <Text style={styles.label}>ALL TIME</Text>
        <Text style={styles.title}>Stats</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Card 1 — Head to Head */}
        {partnerScore ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ALL TIME · HEAD TO HEAD</Text>
            <View style={styles.h2hRow}>
              <View style={styles.h2hSide}>
                <Image source={STATS_ASSETS[myScore?.avatar ?? 'guy']} style={[styles.statsMascot, { mixBlendMode: 'multiply' } as any]} resizeMode="contain" />
                <Text style={styles.h2hName}>{myName}</Text>
                <Text style={[styles.h2hScore, { color: '#15795C' }]}>{fmt(samPts)}</Text>
              </View>
              <View style={styles.vsCenter}>
                <View style={styles.vsStar}><Text style={styles.vsStarText}>VS</Text></View>
              </View>
              <View style={styles.h2hSide}>
                <Image source={STATS_ASSETS[partnerScore.avatar ?? 'girl']} style={[styles.statsMascot, { mixBlendMode: 'multiply' } as any]} resizeMode="contain" />
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
        ) : (
          <View style={[styles.card, styles.waitingCard]}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingTitle}>Waiting for your partner</Text>
            <Text style={styles.waitingSub}>Head-to-head stats will appear once your partner joins</Text>
          </View>
        )}

        {/* Card 2 — Momentum (line chart) */}
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
            <View style={styles.chartEmpty}><ActivityIndicator color={colors.primary} /></View>
          ) : fetchError ? (
            <View style={styles.chartEmpty}><Text style={styles.chartEmptyText}>⚠️ {fetchError}</Text></View>
          ) : completions.length === 0 ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>No activity yet — claim some chores! 🧹</Text>
            </View>
          ) : (
            <MomentumLine data={chartData} myName={myName} partnerName={partnerName} />
          )}
        </View>

        {/* Card 3 — Claim History */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CLAIM HISTORY</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : completions.length === 0 ? (
            <Text style={[styles.chartEmptyText, { textAlign: 'center', paddingVertical: 16 }]}>
              No claims yet — go do some chores! 🧹
            </Text>
          ) : (
            completions.map((c) => {
              const isEditing = editingId === c.completionId;
              const isUnclaiming = unclaimingId === c.completionId;
              const isSaving = savingId === c.completionId;
              const isMe = c.userId === userId;

              return (
                <View key={c.completionId} style={styles.claimRow}>
                  {/* Emoji bubble */}
                  <View style={[styles.claimEmoji, { backgroundColor: isMe ? '#E8F5EE' : '#FDF0E6' }]}>
                    <Text style={{ fontSize: 18 }}>{c.choreEmoji}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.claimContent}>
                    <Text style={styles.claimName}>{c.choreName}</Text>
                    <Text style={styles.claimMeta}>
                      {c.userName.split(' ')[0]} · {fmtDate(c.completedAt)}
                    </Text>

                    {isEditing && (
                      <View style={styles.editRow}>
                        <Text style={styles.editLabel}>Pts:</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editPts}
                          onChangeText={setEditPts}
                          keyboardType="number-pad"
                          maxLength={3}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.saveBtn}
                          onPress={() => handleSaveEdit(c)}
                          disabled={isSaving}
                        >
                          {isSaving
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setEditingId(null)}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Right side: pts + actions — edit/unclaim only for own claims */}
                  {!isEditing && isMe && (
                    <View style={styles.claimRight}>
                      <TouchableOpacity
                        style={[styles.ptsPill, { backgroundColor: isMe ? '#E8F5EE' : '#FDF0E6' }]}
                        onPress={() => { setEditingId(c.completionId); setEditPts(String(c.pointsEarned)); }}
                      >
                        <Text style={[styles.ptsText, { color: isMe ? '#15795C' : '#EE8C3C' }]}>
                          {c.pointsEarned} pts
                        </Text>
                        <Text style={[styles.editHint, { color: isMe ? '#27A07C' : '#F4A968' }]}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.unclaimBtn}
                        onPress={() => handleUnclaim(c)}
                        disabled={isUnclaiming}
                      >
                        {isUnclaiming
                          ? <ActivityIndicator size="small" color="#EE8C3C" />
                          : <Text style={styles.unclaimText}>Unclaim</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#c8e0d4' },
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

  // Chart
  chartHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  toggleRow: { flexDirection: 'row', gap: 5 },
  toggleChip: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1.5, borderColor: '#C8DDB8', backgroundColor: colors.white,
  },
  toggleChipActive: { backgroundColor: '#15795C', borderColor: '#15795C' },
  toggleText: { fontSize: 11, fontFamily: fonts.bodyExtraBold, color: '#15795C' },
  toggleTextActive: { color: colors.white },
  chartEmpty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#9EBBA4', textAlign: 'center' },
  xLabel: { fontSize: 9, fontFamily: fonts.bodyBold, color: '#9EBBA4' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 3, borderRadius: 2 },
  legendText: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#16463A' },

  // Claim history
  claimRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F7F2',
    gap: 10,
  },
  claimEmoji: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  claimContent: { flex: 1 },
  claimName: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: '#16463A' },
  claimMeta: { fontSize: 11, fontFamily: fonts.bodyBold, color: '#9EBBA4', marginTop: 1 },
  claimRight: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  ptsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  ptsText: { fontSize: 11, fontFamily: fonts.bodyExtraBold },
  editHint: { fontSize: 11 },
  unclaimBtn: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1.5, borderColor: '#EE8C3C',
  },
  unclaimText: { fontSize: 10, fontFamily: fonts.bodyExtraBold, color: '#EE8C3C' },

  // Inline edit
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  editLabel: { fontSize: 11, fontFamily: fonts.bodyBold, color: '#9EBBA4' },
  editInput: {
    borderWidth: 1.5, borderColor: '#C8DDB8', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    fontSize: 13, fontFamily: fonts.bodyExtraBold, color: '#16463A',
    width: 52, textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#15795C', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    minWidth: 44, alignItems: 'center',
  },
  saveBtnText: { fontSize: 11, fontFamily: fonts.bodyExtraBold, color: '#fff' },
  cancelBtn: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  cancelBtnText: { fontSize: 11, fontFamily: fonts.bodyBold, color: '#9EBBA4' },

  // Waiting-for-partner card
  waitingCard: { alignItems: 'center', paddingVertical: spacing.xl },
  waitingEmoji: { fontSize: 36, marginBottom: 8 },
  waitingTitle: { fontSize: 15, fontFamily: fonts.headingBold, color: colors.ink, marginBottom: 4 },
  waitingSub: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.mid, textAlign: 'center' },
});
