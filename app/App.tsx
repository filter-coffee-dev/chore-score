// Must be first import — patches console before expo-notifications initializes
import './src/utils/suppressExpoGoWarnings';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold,
  Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { AppNavigator } from './src/navigation';
import { isAuthenticated, getCurrentUserId, getCurrentUserName } from './src/services/auth';
import { setupNotificationHandler, registerPushToken } from './src/services/notifications';
import { api } from './src/services/api';
import { useStore } from './src/store/useStore';
import { colors } from './src/theme';

setupNotificationHandler();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const { setUser, setHousehold, userId, household } = useStore();
  const isLoggedIn = userId !== null;
  const hasHousehold = household !== null;

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const loggedIn = await isAuthenticated();
      if (loggedIn) {
        const [uid, uname] = await Promise.all([getCurrentUserId(), getCurrentUserName()]);
        setUser(uid, uname);
        try {
          const h = await api.household.get();
          setHousehold(h);
          await registerPushToken((token) => api.users.updateMe({ deviceToken: token }));
        } catch {
          // No household yet
        }
      }
    } catch {
      // Not authenticated
    } finally {
      setAppReady(true);
    }
  }

  if (!appReady || !fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator isLoggedIn={isLoggedIn} hasHousehold={hasHousehold} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
