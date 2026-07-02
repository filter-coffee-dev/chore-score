import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../utils/alert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { signOut } from '../services/auth';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { colors, fonts, spacing, radius, shadow } from '../theme';

const AVATAR_ASSETS = {
  guy: require('../../assets/avatar-guy2.png'),
  girl: require('../../assets/avatar-girl2.png'),
};

export default function SettingsScreen() {
  const [signingOut, setSigningOut] = useState(false);
  const { userName, household, scores, userId, streak, memberBadges, reset, setScores, setMyAvatar } = useStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  useFocusEffect(useCallback(() => {
    api.scores.get()
      .then((d) => {
        setScores(d.scores, d.streak, d.taunt);
        const mine = d.scores.find((s) => s.userId === userId);
        if (mine?.avatar) setMyAvatar(mine.avatar);
      })
      .catch(() => {});
  }, [userId, setScores, setMyAvatar]));

  const myScore = scores.find((s) => s.userId === userId);
  const partnerScoreItem = scores.find((s) => s.userId !== userId);
  const myAvatarChoice = myScore?.avatar ?? 'guy';
  const partnerAvatarChoice = partnerScoreItem?.avatar ?? 'girl';

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

  const myBadges = memberBadges.find((m) => m.userId === userId);
  const totalChores = myScore?.totalCompletions ?? 0;
  const earnedBadges = myBadges?.badges.length ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {/* Hero gradient band — full bleed to top of screen */}
      <LinearGradient
        colors={['#C8E8CE', '#5DB88A', '#15795C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        {/* Decorative circles */}
        <View style={styles.decCircleTR} pointerEvents="none" />
        <View style={styles.decCircleBL} pointerEvents="none" />

        {/* Avatars */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircleWrap}>
              <View style={styles.avatarCircle}>
                <Image source={AVATAR_ASSETS[myAvatarChoice]} style={styles.avatarImg} resizeMode="contain" />
              </View>
              <TouchableOpacity
                style={styles.editBadge}
                onPress={() => navigation.getParent()?.navigate('ChooseAvatar', { mode: 'edit' })}
                activeOpacity={0.8}
              >
                <Text style={styles.editBadgeIcon}>✎</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarName}>{household?.member1Name ?? userName?.split(' ')[0] ?? 'You'}</Text>
            <Text style={styles.avatarPts}>{myScore?.totalPoints ?? 0} pts</Text>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircleWrap}>
              <View style={styles.avatarCircle}>
                <Image source={AVATAR_ASSETS[partnerAvatarChoice]} style={styles.avatarImg} resizeMode="contain" />
              </View>
            </View>
            <Text style={styles.avatarName}>{household?.member2Name ?? 'Partner'}</Text>
            <Text style={styles.avatarPts}>{partnerScoreItem?.totalPoints ?? 0} pts</Text>
          </View>
        </View>

        {/* Stat chips */}
        <View style={styles.statRow}>
          <View style={styles.statChip}>
            <Text style={[styles.statVal, { color: '#B4DD52' }]}>{streak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statVal}>{totalChores}</Text>
            <Text style={styles.statLabel}>CHORES</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statVal, { color: '#EE8C3C' }]}>{earnedBadges}</Text>
            <Text style={styles.statLabel}>BADGES</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Household */}
        {household && (
          <>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionLabel}>HOUSEHOLD</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Member 1</Text>
                <Text style={styles.rowValue}>{household.member1Name}</Text>
              </View>
              {household.member2Name && (
                <View style={[styles.row, styles.rowDivider]}>
                  <Text style={styles.rowLabel}>Member 2</Text>
                  <Text style={styles.rowValue}>{household.member2Name}</Text>
                </View>
              )}
              <View style={[styles.row, styles.rowDivider, { borderBottomWidth: 0 }]}>
                <Text style={styles.rowLabel}>Invite Code</Text>
                <TouchableOpacity onPress={copyInviteCode}>
                  <View style={styles.codePill}>
                    <Text style={styles.codeText}>{household.inviteCode} 📋</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            {!household.member2Name && (
              <View style={styles.waitCard}>
                <Text style={styles.waitText}>⏳ Waiting for your partner to join — share the invite code above!</Text>
              </View>
            )}
          </>
        )}

        {/* About */}
        <View style={styles.sectionPill}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App</Text>
            <Text style={styles.rowValue}>ChoreScore</Text>
          </View>
          <View style={[styles.row, styles.rowDivider, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : '👋 Sign Out'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Hero band
  hero: {
    paddingBottom: 24,
    paddingHorizontal: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  decCircleTR: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  decCircleBL: {
    position: 'absolute',
    left: -16,
    bottom: -16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatarCircleWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.27,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarImg: {
    width: 80,
    height: 80,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A6D44F',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeIcon: {
    fontSize: 13,
    color: '#15795C',
    lineHeight: 16,
  },
  avatarName: {
    fontSize: 13,
    fontFamily: fonts.headingBold,
    color: colors.white,
    marginTop: 7,
  },
  avatarPts: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#A8DFC4',
    marginTop: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.094)',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.white,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    color: '#A8DFC4',
    letterSpacing: 0.5,
  },

  // Settings list
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  sectionPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  sectionLabel: {
    fontSize: 10, fontFamily: fonts.bodyExtraBold, color: '#7C8A72',
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  rowDivider: {
    borderTopWidth: 1, borderTopColor: colors.mintLight,
  },
  rowLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.mid },
  rowValue: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  codePill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  codeText: { fontSize: 12, fontFamily: fonts.bodyExtraBold, color: colors.white },
  waitCard: {
    backgroundColor: colors.mintLight, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.sm,
  },
  waitText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.mid, textAlign: 'center' },
  signOutBtn: {
    backgroundColor: colors.white, borderRadius: radius.full,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 2, borderColor: colors.redLight,
    marginTop: spacing.xl,
    ...shadow.sm,
  },
  signOutText: { fontSize: 15, fontFamily: fonts.headingBold, color: colors.red },
});
