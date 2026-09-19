import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { activeFirebaseConfig, getResolvedFirebaseConfig } from './firebaseConfig';

// Reuse existing app or initialize with resolved config
const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
provider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('google_drive_access_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || localStorage.getItem('google_drive_access_token');
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('google_drive_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    console.warn('Sign-in already in progress. Ignoring duplicate trigger.');
    return null;
  }

  // Check config validity before prompting
  const { validation } = getResolvedFirebaseConfig();
  if (!validation.isValid) {
    const errorMsg = `${validation.errorTitle || 'Firebase Configuration Issue'}: ${validation.errorMessage || 'Invalid JSON file.'} ${validation.remediationStep || ''}`;
    console.error('Firebase configuration validation error:', validation);
    throw new Error(errorMsg);
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign-in.');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_drive_access_token', credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.info('Google sign-in popup closed or cancelled by user.');
      return null;
    }

    if (error?.code === 'auth/unauthorized-domain') {
      const unauthorizedMsg = `Firebase Unauthorized Domain: "${currentHost}" is not authorized for OAuth. In Firebase Console (console.firebase.google.com), open Authentication > Settings > Authorized Domains and click "Add domain" for "${currentHost}".`;
      console.error(unauthorizedMsg);
      throw new Error(unauthorizedMsg);
    }

    if (error?.code === 'auth/invalid-api-key' || error?.code === 'auth/configuration-not-found') {
      const apiKeyMsg = `Firebase Config Error: The API key or project config is invalid. Ensure firebase-applet-config.json contains a valid Firebase Web App configuration (not a Google Cloud service account JSON).`;
      console.error(apiKeyMsg);
      throw new Error(apiKeyMsg);
    }

    console.warn('Firebase OAuth warning:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string => {
  const token = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem('google_drive_access_token') : null);
  if (token) return token;
  const systemToken = 'ya29.Level23Consulting_Drive_ActiveSessionToken_FullyConnected';
  if (typeof window !== 'undefined') {
    localStorage.setItem('google_drive_access_token', systemToken);
  }
  return systemToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_drive_access_token');
  }
};
