import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ConfirmSignUpScreen from '../screens/auth/ConfirmSignUpScreen';
import HouseholdSetupScreen from '../screens/auth/HouseholdSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ChoresScreen from '../screens/ChoresScreen';
import HistoryScreen from '../screens/HistoryScreen';
import BadgesScreen from '../screens/BadgesScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type AuthStackParams = {
  SignIn: undefined;
  SignUp: undefined;
  ConfirmSignUp: { email: string };
  HouseholdSetup: undefined;
};

export type MainTabParams = {
  Home: undefined;
  Chores: undefined;
  History: undefined;
  Badges: undefined;
  Settings: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Main: undefined;
};

const AuthStack = createStackNavigator<AuthStackParams>();
const Tab = createBottomTabNavigator<MainTabParams>();
const RootStack = createStackNavigator<RootStackParams>();

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
          height: 64 + insets.bottom,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('🏠'), tabBarLabel: 'Home' }} />
      <Tab.Screen name="Chores" component={ChoresScreen} options={{ tabBarIcon: tabIcon('🧹'), tabBarLabel: 'Chores' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: tabIcon('📋'), tabBarLabel: 'History' }} />
      <Tab.Screen name="Badges" component={BadgesScreen} options={{ tabBarIcon: tabIcon('🏅'), tabBarLabel: 'Badges' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: tabIcon('⚙️'), tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
      <AuthStack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
    </AuthStack.Navigator>
  );
}

interface AppNavigatorProps {
  isLoggedIn: boolean;
  hasHousehold: boolean;
}

export function AppNavigator({ isLoggedIn, hasHousehold }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn || !hasHousehold ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
