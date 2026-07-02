import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { fonts } from '../../theme';

type AvatarChoice = 'guy' | 'girl';

const AVATAR_GUY  = require('../../../assets/avatar-guy2.png');
const AVATAR_GIRL = require('../../../assets/avatar-girl2.png');

export default function ChooseAvatarScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ ChooseAvatar: { mode?: 'onboarding' | 'edit' } }, 'ChooseAvatar'>>();
  const mode = route.params?.mode ?? 'edit';

  const { myAvatar, setMyAvatar, userName } = useStore();
  const [selected, setSelected] = useState<AvatarChoice>(myAvatar);
  const [saving, setSaving] = useState(false);

  const displayName = userName?.split(' ')[0] ?? 'You';

  async function handleConfirm() {
    setSaving(true);
    try {
      await api.users.updateMe({ avatar: selected });
      setMyAvatar(selected);
      if (mode === 'onboarding') {
        navigation.navigate('HouseholdSetup');
      } else {
        navigation.goBack();
      }
    } catch {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Hero band */}
      <LinearGradient
        colors={['#D5EDD7', '#C2E4C2', '#8ACC9C', '#5CB886']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.05, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative circles */}
        <View style={styles.decCircleTR} pointerEvents="none" />
        <View style={styles.decCircleML} pointerEvents="none" />

        {/* Sparkle star (rotated square approximation) */}
        <View style={styles.sparkStar} pointerEvents="none" />
        {/* Sparkle dot */}
        <View style={styles.sparkDot} pointerEvents="none" />

        {/* Back button */}
        <SafeAreaView edges={['top']} style={styles.heroOverlay} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.eyebrow}>Almost there!</Text>
        <Text style={styles.heading}>Pick your avatar</Text>
        <Text style={styles.subtext}>How you'll show up in the arena.</Text>
      </View>

      {/* Avatar picker card */}
      <View style={styles.pickerCard}>
        <View style={styles.avatarRow}>
          {(['guy', 'girl'] as AvatarChoice[]).map((choice) => {
            const isSelected = selected === choice;
            return (
              <TouchableOpacity
                key={choice}
                onPress={() => setSelected(choice)}
                activeOpacity={0.85}
                style={[styles.avatarCircle, isSelected ? styles.avatarSelected : styles.avatarUnselected]}
              >
                <Image
                  source={choice === 'guy' ? AVATAR_GUY : AVATAR_GIRL}
                  style={styles.avatarImg}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Playing as readout */}
      <View style={styles.playingAs}>
        <Text style={styles.playingLabel}>Playing as</Text>
        <Text style={styles.playingName}>{displayName}</Text>
      </View>

      {/* CTA pinned to bottom */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity onPress={handleConfirm} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={['#27A07C', '#15795C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.ctaBtn}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaBtnText}>All Set! Let's Go →</Text>}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.ctaHelper}>You can change this anytime on the Us screen.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Hero
  hero: {
    height: 158,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: 22,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  backText: {
    fontSize: 13,
    fontFamily: fonts.bodyExtraBold,
    color: '#15795C',
  },
  decCircleTR: {
    position: 'absolute',
    right: -18, top: -18,
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(39,160,124,0.1)',
  },
  decCircleML: {
    position: 'absolute',
    left: -14, top: 52,
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(166,212,79,0.13)',
  },
  sparkStar: {
    position: 'absolute',
    top: 36, right: 58,
    width: 8, height: 8,
    backgroundColor: '#A6D44F',
    transform: [{ rotate: '45deg' }],
  },
  sparkDot: {
    position: 'absolute',
    top: 56, left: 58,
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#EE8C3C',
    opacity: 0.7,
  },

  // Title
  titleSection: {
    paddingTop: 10,
    paddingHorizontal: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: '#8FC23A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: '#16463A',
    marginTop: 2,
  },
  subtext: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#4E7C5F',
    marginTop: 2,
  },

  // Picker card
  pickerCard: {
    margin: 10,
    marginHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    paddingHorizontal: 16,
    shadowColor: '#14463840',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  avatarCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: '#15795C',
    backgroundColor: '#E8F5EE',
    shadowColor: '#A6D44F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.27,
    shadowRadius: 6,
    elevation: 4,
    opacity: 1,
  },
  avatarUnselected: {
    borderWidth: 2.5,
    borderColor: '#E8D4B8',
    backgroundColor: '#FEF5EC',
    opacity: 0.72,
  },
  avatarImg: {
    height: 92,
    width: 80,
  },

  // Playing as
  playingAs: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#E8F5EE',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playingLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#5E8C6E',
  },
  playingName: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: '#15795C',
  },

  // CTA
  ctaWrap: {
    position: 'absolute',
    left: 16, right: 16, bottom: 28,
  },
  ctaBtn: {
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#15795C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.53,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaBtnText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: '#fff',
  },
  ctaHelper: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#4E7C5F',
    textAlign: 'center',
    marginTop: 10,
  },
});
