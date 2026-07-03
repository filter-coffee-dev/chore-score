import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ConfirmSignUpScreen from '../screens/auth/ConfirmSignUpScreen';
import ChooseAvatarScreen from '../screens/auth/ChooseAvatarScreen';
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
  ChooseAvatar: { mode: 'onboarding' };
  HouseholdSetup: undefined;
};

export type MainStackParams = {
  Tabs: undefined;
  ChooseAvatar: { mode: 'edit' };
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
const MainStack = createStackNavigator<MainStackParams>();
const Tab = createBottomTabNavigator<MainTabParams>();
const RootStack = createStackNavigator<RootStackParams>();

const TAB_ICONS = {
  Home: require('../../assets/icon-home.png'),
  Chores: require('../../assets/icon-tasks.png'),
  History: require('../../assets/icon-stats.png'),
  Badges: require('../../assets/icon-star.png'),
  Settings: require('../../assets/icon-profile.png'),
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Chores: 'Chores',
  History: 'Stats',
  Badges: 'Badges',
  Settings: 'Us',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // React Navigation consumes the bottom inset in its container, so
  // useSafeAreaInsets() often returns 0 here on Android edge-to-edge.
  // Fall back to initialWindowMetrics which reads the raw screen-level value.
  const bottomInset = insets.bottom || (initialWindowMetrics?.insets.bottom ?? 0);

  return (
    <View style={{ backgroundColor: '#ffffff' }}>
      <View style={[tabStyles.bar, { paddingBottom: bottomInset }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = TAB_LABELS[route.name] ?? route.name;
          const icon = TAB_ICONS[route.name as keyof typeof TAB_ICONS];

          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.tab}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              activeOpacity={0.7}
            >
              <View style={[tabStyles.tabContent, !focused && tabStyles.tabInactive]}>
                <Image source={icon} style={tabStyles.tabIcon} resizeMode="contain" />
                <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>{label}</Text>
                {focused && <View style={tabStyles.tabDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,70,56,0.06)',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  tabContent: {
    alignItems: 'center',
  },
  tabInactive: {
    opacity: 0.40,
  },
  tabIcon: {
    width: 26,
    height: 26,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyExtraBold,
    color: '#9EBBA4',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#ffffff' } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chores" component={ChoresScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Badges" component={BadgesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen name="ChooseAvatar" component={ChooseAvatarScreen} />
    </MainStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
      <AuthStack.Screen name="ChooseAvatar" component={ChooseAvatarScreen} />
      <AuthStack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
    </AuthStack.Navigator>
  );
}

interface AppNavigatorProps {
  isLoggedIn: boolean;
  hasHousehold: boolean;
}

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#e8faf4',
    card: '#ffffff',
  },
};

export function AppNavigator({ isLoggedIn, hasHousehold }: AppNavigatorProps) {
  return (
    <NavigationContainer theme={AppTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn || !hasHousehold ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
