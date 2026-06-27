import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { colors, spacing, radius, fontSize, shadow } from '../../theme';
import { showAlert } from '../../utils/alert';

export default function HouseholdSetupScreen() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { setHousehold } = useStore();

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await api.household.create();
      const household = await api.household.get();
      setHousehold(household);
      showAlert(
        'Household created! 🏠',
        `Your invite code is: ${result.inviteCode}\n\nShare it with your partner so they can join.`,
      );
    } catch (err: unknown) {
      showAlert('Oops!', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return showAlert('Enter the invite code your partner shared!');
    setLoading(true);
    try {
      await api.household.join(inviteCode.trim().toUpperCase());
      const household = await api.household.get();
      setHousehold(household);
      showAlert('You\'re in! 🎉', 'Welcome to the household. Now go do some chores. 😄');
    } catch (err: unknown) {
      showAlert('Oops!', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'choose') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={styles.title}>Set up your household</Text>
          <Text style={styles.subtitle}>
            Create a new household or join one your partner already set up.
          </Text>

          <TouchableOpacity style={styles.optionCard} onPress={() => setMode('create')}>
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>✨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Create household</Text>
              <Text style={styles.optionDesc}>You go first. Get an invite code to share.</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={() => setMode('join')}>
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🔗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Join household</Text>
              <Text style={styles.optionDesc}>Enter the code your partner shared with you.</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'create') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.backWrap}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Create your household</Text>
          <Text style={styles.subtitle}>
            You'll get a unique invite code to share with your partner.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Household 🚀'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setMode('choose')} style={styles.backWrap}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>Join a household</Text>
        <Text style={styles.subtitle}>
          Ask your partner for their invite code and enter it below.
        </Text>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="e.g. FROG-7842"
            placeholderTextColor={colors.text.light}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            textAlign="center"
          />
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleJoin} disabled={loading}>
          <Text style={[styles.btnText, styles.btnTextSecondary]}>{loading ? 'Joining...' : 'Join Household 🎉'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  backWrap: { marginBottom: spacing.xl },
  back: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionEmoji: { fontSize: 24 },
  optionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary },
  optionDesc: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  arrow: { fontSize: fontSize.lg, color: colors.text.light },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 4,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.white },
  btnTextSecondary: { color: colors.text.primary },
});
