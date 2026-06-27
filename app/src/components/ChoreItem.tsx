import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ChoreWithStatus } from '../services/api';
import { colors, radius, spacing, fontSize, shadow } from '../theme';

const WEIGHT_LABEL: Record<number, string> = {
  1: 'Quick', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Beast',
};

interface Props {
  chore: ChoreWithStatus;
  onComplete: (choreId: string) => void;
  onEdit?: (chore: ChoreWithStatus) => void;
  onDelete?: (choreId: string) => void;
  completing?: boolean;
}

export function ChoreItem({ chore, onComplete, onEdit, onDelete, completing }: Props) {
  function confirmDelete() {
    Alert.alert(
      'Delete chore?',
      `"${chore.name}" will be gone forever. The mess remains. 🗑️`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(chore.choreId) },
      ],
    );
  }

  return (
    <View style={[styles.card, chore.completedThisPeriod && styles.completed]}>
      <TouchableOpacity
        style={styles.checkArea}
        onPress={() => !chore.completedThisPeriod && onComplete(chore.choreId)}
        disabled={chore.completedThisPeriod || completing}
      >
        <View style={[styles.check, chore.completedThisPeriod && styles.checkDone]}>
          {chore.completedThisPeriod && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.info}>
        <View style={styles.row}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{chore.emoji}</Text>
          </View>
          <Text style={[styles.name, chore.completedThisPeriod && styles.nameStruck]}>
            {chore.name}
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.weightPill}>
            <Text style={styles.weightText}>+{chore.weight} · {WEIGHT_LABEL[chore.weight]}</Text>
          </View>
          <Text style={styles.freq}>{chore.frequency}</Text>
        </View>
        {chore.completedThisPeriod && chore.completedBy && (
          <Text style={styles.completedBy}>Done by {chore.completedBy} ✅</Text>
        )}
      </View>

      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(chore)} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={confirmDelete} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  completed: { opacity: 0.55 },
  checkArea: { marginRight: spacing.sm },
  check: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: { color: colors.white, fontSize: 14, fontWeight: '800' },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  emojiWrap: {
    width: 28, height: 28, borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.xs,
  },
  emoji: { fontSize: 16 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text.primary, flex: 1 },
  nameStruck: { textDecorationLine: 'line-through', color: colors.text.light },
  weightPill: {
    backgroundColor: colors.highlight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginRight: spacing.sm,
  },
  weightText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text.secondary },
  freq: { fontSize: fontSize.xs, color: colors.text.light, textTransform: 'capitalize' },
  completedBy: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: spacing.xs, marginLeft: spacing.xs },
  actionIcon: { fontSize: 16 },
});
