import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { showAlert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from '../services/auth';
import { useStore } from '../store/useStore';
import { colors, spacing, fontSize, radius, shadow } from '../theme';

export default function SettingsScreen() {
  const [signingOut, setSigningOut] = useState(false);
  const { userName, household, reset } = useStore();

  async function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'The chores will still be there when you come back. 😅',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            reset();
            setSigningOut(false);
          },
        },
      ],
    );
  }

  function copyInviteCode() {
    if (household?.inviteCode) {
      showAlert('Invite Code 🔗', `Share this with your partner:\n\n${household.inviteCode}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings ⚙️</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userSubtext}>That's you. Looking good. 😎</Text>
          </View>
        </View>

        {/* Household */}
        {household && (
          <>
            <Text style={styles.sectionLabel}>HOUSEHOLD</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member 1</Text>
                <Text style={styles.infoValue}>{household.member1Name}</Text>
              </View>
              {household.member2Name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member 2</Text>
                  <Text style={styles.infoValue}>{household.member2Name}</Text>
                </View>
              )}
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Invite Code</Text>
                <TouchableOpacity onPress={copyInviteCode}>
                  <Text style={styles.inviteCode}>{household.inviteCode} 📋</Text>
                </TouchableOpacity>
              </View>
            </View>
            {!household.member2Name && (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingText}>
                  ⏳ Waiting for your partner to join... Share the invite code above!
                </Text>
              </View>
            )}
          </>
        )}

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App</Text>
            <Text style={styles.infoValue}>ChoreScore</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
        <Text style={styles.moto}>Make chores fun. Win together. 🏆</Text>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign Out 👋'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },
  content: { paddingHorizontal: spacing.md, paddingBottom: 110 },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.text.light,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    ...shadow.md,
  },
  avatar: {
    width: 52, height: 52, borderRadius: radius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.white },
  userName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary },
  userSubtext: { fontSize: fontSize.sm, color: colors.text.secondary },
  infoCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    ...shadow.md, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: fontSize.md, color: colors.text.secondary },
  infoValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.text.primary },
  inviteCode: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  waitingCard: {
    backgroundColor: colors.highlight, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.sm,
  },
  waitingText: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
  moto: {
    fontSize: fontSize.sm, color: colors.text.light, textAlign: 'center',
    marginTop: spacing.sm, marginBottom: spacing.xl, fontStyle: 'italic',
  },
  signOutBtn: {
    backgroundColor: colors.white, borderRadius: radius.full,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.danger,
    ...shadow.sm,
  },
  signOutText: { fontSize: fontSize.md, fontWeight: '700', color: colors.danger },
});
