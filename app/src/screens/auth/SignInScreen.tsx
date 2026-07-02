import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParams } from '../../navigation';
import { signIn } from '../../services/auth';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { colors, fonts, spacing, radius, shadow } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParams, 'SignIn'> };

// login-hero.png: 941×1672 portrait
const SCREEN_W = Dimensions.get('window').width;
const HERO_NATURAL_H = Math.round(SCREEN_W * 1672 / 941);
const HERO_CROP_H = Math.min(Math.round(HERO_NATURAL_H * 0.72), 530);

export default function SignInScreen({ navigation }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setHousehold } = useStore();

  async function handleSignIn() {
    if (!email || !password) return showAlert('Fill in both fields, champ. 💪');
    setLoading(true);
    try {
      const session = await signIn(email.trim(), password);
      const payload = session.getIdToken().decodePayload();
      setUser(payload.sub as string, (payload.name || payload.email) as string);
      try {
        const household = await api.household.get();
        setHousehold(household);
      } catch {
        navigation.navigate('ChooseAvatar', { mode: 'onboarding' });
      }
    } catch (err: unknown) {
      const code = (err as Error & { code?: string }).code ?? '';
      const msg = (err as Error).message ?? 'Sign in failed';
      if (code === 'UserNotConfirmedException') {
        showAlert('Almost there! 📬', 'Confirm your email first. Check your inbox.');
        navigation.navigate('ConfirmSignUp', { email: email.trim() });
      } else if (code === 'NotAuthorizedException') {
        showAlert('Wrong email or password', 'Double-check your credentials and try again. 🤔');
      } else if (code === 'UserNotFoundException') {
        showAlert('Account not found', 'No account with that email. Sign up instead? 👇');
      } else {
        showAlert('Oops!', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Sign-in form (01b) ────────────────────────────────────────────────────
  if (showForm) {
    return (
      <View style={styles.siSafe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Hero band: mint-to-teal gradient */}
          <LinearGradient
            colors={['#CFE9D2', '#E2F1DA', '#A8D8B0', '#5DB88A']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.siHero}
          >
            <SafeAreaView edges={['top', 'left', 'right']} style={{ width: '100%' }}>
              {/* Frosted pill back button */}
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                style={[styles.siBackBtn, { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } as any]}
              >
                <Text style={styles.siBackText}>
                  <Text style={styles.siBackArrow}>{'← '}</Text>Back
                </Text>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Kid mascot — mix-blend-mode:multiply removes white bg on colored surface */}
            <Image
              source={require('../../../assets/mascot-kid3.png')}
              style={[styles.siMascot, { mixBlendMode: 'multiply' } as any]}
              resizeMode="contain"
            />

            {/* Bottom fade into mint */}
            <LinearGradient
              colors={['#C8E8CE00', '#C8E8CE']}
              style={styles.siHeroFade}
              pointerEvents="none"
            />
          </LinearGradient>

          {/* White card — overlaps hero by 2px, contains heading + form */}
          <View style={styles.siForm}>
            <View style={styles.siCard}>
              <Text style={styles.siHeading}>Welcome back!</Text>
              <Text style={styles.siSubtitle}>
                Your chores missed you. (They didn't. The mess is still there.)
              </Text>

              <View style={styles.siFields}>
                <Text style={styles.siLabel}>Email</Text>
                <TextInput
                  style={[styles.siInput, { marginTop: 5 }]}
                  placeholder="you@example.com"
                  placeholderTextColor="#9EBBA4"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={[styles.siLabel, { marginTop: 8 }]}>Password</Text>
                <TextInput
                  style={[styles.siInput, { marginTop: 5 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#9EBBA4"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity onPress={handleSignIn} disabled={loading} style={styles.siBtnWrap}>
                  <LinearGradient
                    colors={['#27A07C', '#15795C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.siBtn}
                  >
                    <Text style={styles.siBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.siLink}>
                  <Text style={styles.siLinkText}>
                    No account?{' '}
                    <Text style={styles.siLinkAccent}>Create an Account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Splash / onboarding (01) ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.splashContainer}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image
            source={require('../../../assets/login-hero.png')}
            style={styles.heroImage}
            resizeMode="stretch"
          />
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.heroFade}
          />
        </View>

        {/* Copy */}
        <View style={styles.copySection}>
          <Text style={styles.headline}>Make chores fun.{'\n'}Win together.</Text>
          <Text style={styles.subline}>
            Turn the house into an arena. Claim chores, earn points, and grow stronger as a team.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaSection}>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.createBtnWrap}>
            <LinearGradient
              colors={['#27A07C', '#15795C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.createBtn}
            >
              <Text style={styles.createBtnText}>Create an Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowForm(true)} style={styles.alreadyRow}>
            <Text style={styles.alreadyText}>
              Already playing?{' '}
              <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Shared ──
  safe: { flex: 1, backgroundColor: colors.background },

  // ── Splash ──
  splashContainer: { flex: 1 },
  heroWrap: {
    height: HERO_CROP_H,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  heroImage: {
    width: '100%',
    height: HERO_NATURAL_H,
  },
  heroFade: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 120,
  },
  copySection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  headline: {
    fontSize: 29,
    fontFamily: fonts.headingBold,
    color: colors.primary,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subline: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.mid,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  createBtnWrap: { width: '100%', marginBottom: spacing.md },
  createBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadow.button,
  },
  createBtnText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  alreadyRow: { paddingVertical: spacing.sm },
  alreadyText: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.mid },
  signInLink: { fontFamily: fonts.bodyExtraBold, color: colors.orange },

  // ── Sign-in form (01b) ──
  siSafe: {
    flex: 1,
    backgroundColor: '#C8E8CE',
  },
  siHero: {
    height: 310,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  siBackBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 14,
  },
  siBackArrow: {
    fontSize: 16,
    fontFamily: fonts.bodyExtraBold,
    color: '#15795C',
    lineHeight: 20,
  },
  siBackText: {
    fontSize: 13,
    fontFamily: fonts.bodyExtraBold,
    color: '#15795C',
  },
  siMascot: {
    position: 'absolute',
    bottom: 20,
    height: 196,
    width: 196,
  },
  siHeroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  siForm: {
    backgroundColor: '#C8E8CE',
  },
  siHeading: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: '#16463A',
    lineHeight: 25,
  },
  siSubtitle: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#9EBBA4',
    marginTop: 3,
    lineHeight: 17,
  },
  siCard: {
    marginHorizontal: 14,
    marginTop: -2,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    paddingBottom: 18,
    shadowColor: 'rgba(20,70,56,0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  siFields: {
    marginTop: 14,
  },
  siLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyExtraBold,
    color: '#16463A',
  },
  siInput: {
    backgroundColor: '#EEF5E6',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#16463A',
  },
  siBtnWrap: { marginTop: 12 },
  siBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#15795C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.53,
    shadowRadius: 16,
    elevation: 8,
  },
  siBtnText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  siLink: { alignItems: 'center', marginTop: 6 },
  siLinkText: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#4E7C5F' },
  siLinkAccent: { fontFamily: fonts.bodyExtraBold, color: '#EE8C3C' },
});
