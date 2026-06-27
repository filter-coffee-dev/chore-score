import AsyncStorage from '@react-native-async-storage/async-storage';

const REGION = process.env.EXPO_PUBLIC_AWS_REGION!;
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!;
const ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

const KEYS = {
  id: '@cs/id',
  access: '@cs/access',
  refresh: '@cs/refresh',
};

async function callCognito(action: string, body: object): Promise<Record<string, unknown>> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error((data.message as string) || (data.__type as string) || `${action} failed`);
    (err as Error & { code: string }).code = (data.__type as string) || '';
    throw err;
  }
  return data as Record<string, unknown>;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = decodeJwtPayload(token) as { exp: number };
    return Date.now() / 1000 >= exp - 60; // 60s buffer
  } catch {
    return true;
  }
}

async function refreshSession(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(KEYS.refresh);
  if (!refreshToken) return null;
  try {
    const data = await callCognito('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    const result = data.AuthenticationResult as Record<string, string>;
    await AsyncStorage.multiSet([[KEYS.id, result.IdToken], [KEYS.access, result.AccessToken]]);
    return result.IdToken;
  } catch {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    return null;
  }
}

export async function signUp(email: string, password: string, name: string): Promise<void> {
  await callCognito('SignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'name', Value: name }],
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await callCognito('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await callCognito('ResendConfirmationCode', {
    ClientId: CLIENT_ID,
    Username: email,
  });
}

export interface SignInSession {
  getIdToken(): { decodePayload(): Record<string, unknown> };
}

export async function signIn(email: string, password: string): Promise<SignInSession> {
  const data = await callCognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const result = data.AuthenticationResult as Record<string, string>;
  await AsyncStorage.multiSet([
    [KEYS.id, result.IdToken],
    [KEYS.access, result.AccessToken],
    [KEYS.refresh, result.RefreshToken],
  ]);
  const payload = decodeJwtPayload(result.IdToken);
  return { getIdToken: () => ({ decodePayload: () => payload }) };
}

export async function signOut(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export async function getIdToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(KEYS.id);
  if (!token) return null;
  if (!isTokenExpired(token)) return token;
  return refreshSession();
}

export async function getCurrentUserId(): Promise<string | null> {
  const token = await getIdToken();
  if (!token) return null;
  return (decodeJwtPayload(token).sub as string) ?? null;
}

export async function getCurrentUserName(): Promise<string | null> {
  const token = await getIdToken();
  if (!token) return null;
  const p = decodeJwtPayload(token);
  return ((p.name || p.email) as string) ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getIdToken()) !== null;
}
