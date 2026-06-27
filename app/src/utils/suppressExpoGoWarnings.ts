import Constants from 'expo-constants';

if (Constants?.appOwnership === 'expo') {
  const _error = console.error.bind(console);
  const _warn = console.warn.bind(console);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('expo-notifications')) return;
    _error(...args);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('expo-notifications')) return;
    _warn(...args);
  };
}
