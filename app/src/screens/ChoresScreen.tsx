import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, RefreshControl, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api, ChoreWithStatus } from '../services/api';
import { useStore } from '../store/useStore';
import { colors, fonts, spacing, fontSize, radius, shadow } from '../theme';

const HERO_IMG = require('../../assets/slide2-laundry.png');

const EMOJIS = ['🧹', '🍽️', '🧺', '🚽', '🪟', '🌿', '🐕', '🛏️', '🧼', '🗑️', '🏠', '✨', '🪴', '🧴', '🪣'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'on_demand'] as const;
const WEIGHTS = [1, 2, 3, 4, 5] as const;
const FREQ_LABEL: Record<string, string> = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', on_demand: 'AS NEEDED' };
const FREQ_DISPLAY: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', on_demand: 'As Needed' };
const WEIGHT_LABEL: Record<number, string> = { 1: 'Quick', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Beast' };

function ChoreCard({
  chore,
  onEdit,
  onDelete,
  onComplete,
  completing,
  isDaily,
}: {
  chore: ChoreWithStatus;
  onEdit: (c: ChoreWithStatus) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  completing?: boolean;
  isDaily: boolean;
}) {
  const pts = chore.weight;
  const difficulty = WEIGHT_LABEL[chore.weight] ?? 'Medium';
  const freq = FREQ_DISPLAY[chore.frequency] ?? chore.frequency;

  return (
    <TouchableOpacity
      style={styles.choreCard}
      onPress={() => onComplete(chore.choreId)}
      disabled={completing}
      activeOpacity={0.75}
    >
      {/* Icon tile */}
      <LinearGradient
        colors={isDaily ? ['#3FB78F', '#15795C'] : ['#BCE06A', '#8FC23A']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.iconTile}
      >
        <Text style={styles.iconEmoji}>{chore.emoji}</Text>
      </LinearGradient>

      {/* Name + meta */}
      <View style={styles.choreContent}>
        <Text style={styles.choreName}>{chore.name}</Text>
        <Text style={styles.choreMeta}>+{pts} pts · {difficulty} · {freq}</Text>
      </View>

      {/* Edit/delete */}
      <View style={styles.choreActions}>
        <TouchableOpacity onPress={() => onEdit(chore)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(chore.choreId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ChoresScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreWithStatus | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧹');
  const [weight, setWeight] = useState(2);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'on_demand'>('weekly');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const { chores, setChores } = useStore();

  const load = useCallback(async () => {
    try {
      const data = await api.chores.list();
      setChores(data.chores);
    } catch (err: unknown) {
      showAlert('Failed to load chores', (err as Error).message);
    }
  }, [setChores]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openAdd() {
    setEditingChore(null);
    setName(''); setEmoji('🧹'); setWeight(2); setFrequency('weekly');
    setModalVisible(true);
  }

  function openEdit(chore: ChoreWithStatus) {
    setEditingChore(chore);
    setName(chore.name); setEmoji(chore.emoji);
    setWeight(chore.weight); setFrequency(chore.frequency);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) return showAlert('Give the chore a name! It has feelings. 🧹');
    setSaving(true);
    try {
      if (editingChore) {
        await api.chores.update(editingChore.choreId, { name: name.trim(), emoji, weight, frequency });
      } else {
        await api.chores.create({ name: name.trim(), emoji, weight, frequency });
      }
      setModalVisible(false);
      await load();
    } catch (err: unknown) {
      showAlert('Oops!', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(choreId: string) {
    try {
      await api.chores.delete(choreId);
      await load();
    } catch (err: unknown) {
      showAlert('Delete failed', (err as Error).message);
    }
  }

  async function handleComplete(choreId: string) {
    setCompleting(choreId);
    try {
      const result = await api.chores.complete(choreId);
      showAlert('Done! 💥', `+${result.pointsEarned} points earned!`);
      await load();
    } catch (err: unknown) {
      showAlert('Oops', (err as Error).message);
    } finally {
      setCompleting(null);
    }
  }

  const byFrequency = {
    daily: chores.filter((c) => c.frequency === 'daily'),
    weekly: chores.filter((c) => c.frequency === 'weekly'),
    monthly: chores.filter((c) => c.frequency === 'monthly'),
    on_demand: chores.filter((c) => (c.frequency as string) === 'on_demand'),
  };

  const SECTIONS: Array<{ key: 'daily' | 'weekly' | 'monthly' | 'on_demand'; isDaily: boolean }> = [
    { key: 'daily', isDaily: true },
    { key: 'weekly', isDaily: false },
    { key: 'monthly', isDaily: false },
    { key: 'on_demand', isDaily: false },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed hero banner */}
        <View style={styles.heroWrap}>
          <Image source={HERO_IMG} style={styles.heroBanner} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroScrim}
            pointerEvents="none"
          />
        </View>

        {/* Header — below the banner */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Chores</Text>
            <Text style={styles.subtitle}>Your chores. Your glory.</Text>
          </View>
          <TouchableOpacity onPress={openAdd}>
            <LinearGradient
              colors={['#27A07C', '#15795C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {chores.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No chores yet!</Text>
            <Text style={styles.emptySubtext}>Add some so you can fight over who does more.</Text>
          </View>
        ) : (
          SECTIONS.map(({ key, isDaily }) =>
            byFrequency[key].length > 0 ? (
              <View key={key} style={styles.group}>
                <View style={[styles.sectionPill, key === 'daily' ? styles.pillDaily : styles.pillWeekly]}>
                  <Text style={[styles.sectionLabel, key === 'daily' ? styles.labelDaily : styles.labelWeekly]}>
                    {FREQ_LABEL[key]}
                  </Text>
                </View>
                {byFrequency[key].map((chore) => (
                  <ChoreCard
                    key={chore.choreId}
                    chore={chore}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                    completing={completing === chore.choreId}
                    isDaily={isDaily}
                  />
                ))}
              </View>
            ) : null
          )
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingChore ? 'Edit Chore' : 'New Chore'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={styles.save}>{saving ? '…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Chore name, e.g. Vacuum living room"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Effort</Text>
            <View style={styles.pillRow}>
              {WEIGHTS.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.pill, weight === w && styles.pillSelected]}
                  onPress={() => setWeight(w)}
                >
                  <Text style={[styles.pillText, weight === w && styles.pillTextSelected]}>
                    {WEIGHT_LABEL[w]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.pillRow}>
              {FREQUENCIES.map((f) => {
                const selected = frequency === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqChip, selected && styles.freqChipSelected]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text style={[styles.freqChipText, selected && styles.freqChipTextSelected]}>
                      {FREQ_DISPLAY[f]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F8EC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontFamily: fonts.headingBold, color: '#16463A' },
  subtitle: { fontSize: 12, fontFamily: fonts.bodyBold, color: '#9EBBA4', marginTop: 1 },
  addBtn: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: 'rgba(21,121,92,0.53)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  addBtnText: { fontFamily: fonts.headingBold, fontSize: 13, color: colors.white },

  // Content
  content: { paddingBottom: spacing.xxl },

  // Hero banner
  heroWrap: {
    height: 210,
    overflow: 'hidden',
  },
  heroBanner: {
    width: '100%',
    height: 210,
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontFamily: fonts.headingBold, color: colors.ink, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.mid, textAlign: 'center' },

  // Sections
  group: { marginTop: 14, paddingHorizontal: spacing.lg, gap: 8 },
  sectionPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 2,
  },
  pillDaily: { borderColor: '#15795C' },
  pillWeekly: { borderColor: '#8FC23A' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelDaily: { color: '#15795C' },
  labelWeekly: { color: '#8FC23A' },

  // Chore cards
  choreCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 20 },
  choreContent: { flex: 1 },
  choreName: {
    fontSize: 14,
    fontFamily: fonts.bodyExtraBold,
    color: '#16463A',
  },
  choreMeta: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#EE8C3C',
    marginTop: 2,
  },
  choreActions: {
    flexDirection: 'row',
    gap: 10,
    opacity: 0.5,
  },
  actionIcon: { fontSize: 14 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 16, fontFamily: fonts.headingBold, color: colors.ink },
  cancel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted },
  save: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: colors.primary },
  modalContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  fieldLabel: {
    fontSize: 12, fontFamily: fonts.bodyExtraBold, color: colors.mid,
    marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.white, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: 13, fontFamily: fonts.bodyBold, color: colors.ink,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiBtn: {
    width: 52, height: 52, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.mintLight,
  },
  emojiBtnSelected: {
    borderColor: colors.primary, borderWidth: 2.5,
    backgroundColor: colors.mintLight,
    shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  emojiText: { fontSize: 24 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.mid },
  pillTextSelected: { color: colors.white, fontFamily: fonts.bodyExtraBold },
  // Frequency chips — uniform style
  freqChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#C8DDB8',
  },
  freqChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  freqChipText: { fontSize: 12, fontFamily: fonts.bodyExtraBold, color: '#16463A' },
  freqChipTextSelected: { color: colors.white },
});
