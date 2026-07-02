import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChoreWithStatus } from '../services/api';
import { colors, fonts, radius, spacing, shadow } from '../theme';

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

  const tileColors: [string, string] = chore.frequency === 'daily'
    ? ['#3FB78F', '#15795C']
    : ['#BCE06A', '#8FC23A'];

  return (
    <View style={[styles.card, chore.completedThisPeriod && styles.completed]}>
      <LinearGradient
        colors={chore.completedThisPeriod ? ['#D2EAD3', '#C8DDB8'] : tileColors}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconTile}
      >
        <Text style={styles.emoji}>{chore.emoji}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={[styles.name, chore.completedThisPeriod && styles.nameStruck]} numberOfLines={1}>
          {chore.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.points}>+{chore.weight} pts</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{WEIGHT_LABEL[chore.weight]}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{chore.frequency}</Text>
        </View>
        {chore.completedThisPeriod && chore.completedBy && (
          <Text style={styles.completedBy}>✓ {chore.completedBy}</Text>
        )}
      </View>

      {onEdit || onDelete ? (
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
      ) : (
        <TouchableOpacity
          style={[styles.claimBtn, chore.completedThisPeriod && styles.claimBtnDone]}
          onPress={() => !chore.completedThisPeriod && onComplete(chore.choreId)}
          disabled={chore.completedThisPeriod || completing}
        >
          <Text style={[styles.claimText, chore.completedThisPeriod && styles.claimTextDone]}>
            {completing ? '…' : chore.completedThisPeriod ? '✓' : 'Claim'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completed: {
    backgroundColor: colors.mintLight,
    opacity: 0.8,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  name: {
    fontSize: 13,
    fontFamily: fonts.bodyExtraBold,
    color: colors.ink,
    marginBottom: 2,
  },
  nameStruck: { textDecorationLine: 'line-through', color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  points: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: colors.orange,
  },
  dot: { fontSize: 10, color: colors.muted },
  meta: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  completedBy: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
    marginTop: 2,
  },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: spacing.xs, marginLeft: spacing.xs, opacity: 0.6 },
  actionIcon: { fontSize: 16 },
  claimBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 60,
    alignItems: 'center',
    ...shadow.button,
  },
  claimBtnDone: {
    backgroundColor: colors.mintLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  claimText: {
    fontSize: 12,
    fontFamily: fonts.bodyExtraBold,
    color: colors.white,
  },
  claimTextDone: {
    color: colors.muted,
  },
});
