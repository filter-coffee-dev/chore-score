import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParams } from '../../navigation';
import { confirmSignUp, resendConfirmationCode } from '../../services/auth';
import { colors, spacing, radius, fontSize, shadow } from '../../theme';

type Props = {
  navigation: StackNavigationProp<AuthStackParams, 'ConfirmSignUp'>;
  route: RouteProp<AuthStackParams, 'ConfirmSignUp'>;
};

export default function ConfirmSignUpScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!code) return showAlert('Enter the code from your email!');
    setLoading(true);
    try {
      await confirmSignUp(email, code.trim());
      Alert.alert('You\'re in! 🎉', 'Account confirmed. Now let\'s set up your household.', [
        { text: 'Let\'s go!', onPress: () => navigation.navigate('SignIn') },
      ]);
    } catch (err: unknown) {
      showAlert('Oops!', (err as Error).message ?? 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendConfirmationCode(email);
      showAlert('Code sent! 📬', 'Check your inbox (and spam, just in case).');
    } catch (err: unknown) {
      showAlert('Oops!', (err as Error).message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>📬</Text>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}<Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor={colors.text.light}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          <TouchableOpacity style={styles.btn} onPress={handleConfirm} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Confirming...' : 'Confirm! ✅'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} style={styles.link}>
            <Text style={styles.linkText}>Didn't get it? Resend →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl },
  email: { fontWeight: '700', color: colors.primary },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.md,
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
    letterSpacing: 8,
    marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  btnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
