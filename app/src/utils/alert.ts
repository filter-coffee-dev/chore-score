import { Alert, Platform } from 'react-native';

// React Native Web's Alert.alert is a no-op stub. Use window.alert on web.
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}
