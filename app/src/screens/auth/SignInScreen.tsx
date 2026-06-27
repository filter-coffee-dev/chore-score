import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParams } from '../../navigation';
import { signIn } from '../../services/auth';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { colors, spacing, radius, fontSize, shadow } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParams, 'SignIn'> };

export default function SignInScreen({ navigation }: Props) {
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
        // Navigation will auto-update via App.tsx state
      } catch {
        navigation.navigate('HouseholdSetup');
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Image source={require('../../../assets/Banner-Family.png')} style={styles.banner} resizeMode="cover" />

          <View style={styles.card}>
            <Text style={styles.title}>Welcome back! 👋</Text>
            <Text style={styles.subtitle}>Your chores missed you. (They didn't. The mess is still there.)</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.text.light}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.text.light}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.btn} onPress={handleSignIn} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Let\'s Go! 🚀'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.link}>
              <Text style={styles.linkText}>No account? Join the chaos →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1 },
  banner: { width: '100%', height: 220 },
  card: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.text.secondary, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadow.sm,
  },
  btnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
