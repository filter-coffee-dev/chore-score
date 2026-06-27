import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api, ChoreWithStatus } from '../services/api';
import { useStore } from '../store/useStore';
import { ChoreItem } from '../components/ChoreItem';
import { colors, spacing, fontSize, radius, shadow } from '../theme';

const EMOJIS = ['🧹', '🍽️', '🧺', '🚽', '🪟', '🌿', '🐕', '🛏️', '🧼', '🗑️', '🏠', '✨'];
const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
const WEIGHTS = [1, 2, 3, 4, 5] as const;
const WEIGHT_LABEL: Record<number, string> = { 1: 'Quick (1)', 2: 'Easy (2)', 3: 'Medium (3)', 4: 'Hard (4)', 5: 'Beast (5)' };

export default function ChoresScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreWithStatus | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧹');
  const [weight, setWeight] = useState(2);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [saving, setSaving] = useState(false);
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
    try {
      const result = await api.chores.complete(choreId);
      showAlert('Done! 💥', `+${result.pointsEarned} points earned!`);
      await load();
    } catch (err: unknown) {
      showAlert('Oops', (err as Error).message);
    }
  }

  const byFrequency = {
    daily: chores.filter((c) => c.frequency === 'daily'),
    weekly: chores.filter((c) => c.frequency === 'weekly'),
    monthly: chores.filter((c) => c.frequency === 'monthly'),
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Chores 🧹</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {chores.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No chores yet!</Text>
            <Text style={styles.emptySubtext}>Add some so you can fight over who's doing more work.</Text>
          </View>
        )}

        {(['daily', 'weekly', 'monthly'] as const).map((freq) =>
          byFrequency[freq].length > 0 ? (
            <View key={freq} style={styles.group}>
              <Text style={styles.groupTitle}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</Text>
              {byFrequency[freq].map((chore) => (
                <ChoreItem
                  key={chore.choreId}
                  chore={chore}
                  onComplete={handleComplete}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          ) : null
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
              <Text style={styles.save}>{saving ? '...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Vacuum living room"
              placeholderTextColor={colors.text.light}
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

            <Text style={styles.fieldLabel}>Effort (affects points)</Text>
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
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.pill, frequency === f && styles.pillSelected]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.pillText, frequency === f && styles.pillTextSelected]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
  emptySubtext: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
  group: { marginBottom: spacing.lg },
  groupTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text.light, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary },
  cancel: { color: colors.text.secondary, fontSize: fontSize.md },
  save: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  modalContent: { padding: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, fontSize: fontSize.md, color: colors.text.primary,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiBtn: {
    width: 48, height: 48, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderWidth: 2, borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: colors.primary, backgroundColor: colors.highlight },
  emojiText: { fontSize: 24 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text.secondary },
  pillTextSelected: { color: colors.white },
});
