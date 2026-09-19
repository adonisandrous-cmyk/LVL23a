/**
 * LEVEL 23 Legal AI Suite - Resilient Firebase & Google OAuth Configuration Manager
 * Validates, loads, and diagnoses Firebase Web App configurations.
 * Prevents "the json file is wrong" errors by detecting Google Cloud Service Account JSONs,
 * OAuth client secret files, and missing Firebase Web App properties.
 */

import defaultRawConfig from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
  firestoreDatabaseId?: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  configType: 'firebase_web_valid' | 'google_service_account' | 'google_oauth_client_secret' | 'malformed_json' | 'missing_required_fields';
  errorTitle?: string;
  errorMessage?: string;
  remediationStep?: string;
  sanitizedConfig: FirebaseAppConfig | null;
}

/**
 * Validates any raw configuration object or JSON string to diagnose issues
 */
export function validateFirebaseConfig(raw: any): ConfigValidationResult {
  let parsed = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw.trim());
    } catch (e: any) {
      return {
        isValid: false,
        configType: 'malformed_json',
        errorTitle: 'Invalid JSON Syntax',
        errorMessage: `The configuration file contains syntax errors: ${e.message}`,
        remediationStep: 'Ensure your JSON file contains valid quotes and no trailing commas.',
        sanitizedConfig: null
      };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      isValid: false,
      configType: 'malformed_json',
      errorTitle: 'Empty or Invalid Configuration',
      errorMessage: 'The configuration object is empty or null.',
      remediationStep: 'Provide a valid Firebase Web App configuration JSON.',
      sanitizedConfig: null
    };
  }

  // 1. Detect Google Cloud Service Account JSON
  if (parsed.type === 'service_account' || parsed.private_key_id || parsed.private_key) {
    return {
      isValid: false,
      configType: 'google_service_account',
      errorTitle: 'Google Cloud Service Account JSON Detected (Wrong File Type)',
      errorMessage:
        'You provided a Google Cloud Service Account Key JSON. Service Accounts are for server-to-server environments and cannot be used in a browser PWA (which would expose your private key).',
      remediationStep:
        'In Firebase Console (console.firebase.google.com) > Project Settings > General > "Your apps" section > select your Web App (</>) and copy the firebaseConfig JSON object.',
      sanitizedConfig: null
    };
  }

  // 2. Detect Google Cloud OAuth 2.0 Client credentials JSON (client_secret_xxx.json)
  if (parsed.web?.client_secret || parsed.installed?.client_secret) {
    const creds = parsed.web || parsed.installed;
    return {
      isValid: false,
      configType: 'google_oauth_client_secret',
      errorTitle: 'OAuth 2.0 Client Secret JSON Detected (Wrong File Type)',
      errorMessage:
        'You provided an OAuth 2.0 Client Secret file (credentials.json) from Google Cloud Console. Firebase Web SDK requires the Firebase Web App configuration instead.',
      remediationStep:
        `Extract your Client ID ("${creds.client_id || ''}") and add it into a valid Firebase Web App config, or register a Web App in Firebase Console to get the full firebaseConfig.`,
      sanitizedConfig: null
    };
  }

  // 3. Check for essential Firebase Web App keys
  const missingKeys: string[] = [];
  if (!parsed.apiKey) missingKeys.push('apiKey');
  if (!parsed.authDomain) missingKeys.push('authDomain');
  if (!parsed.projectId) missingKeys.push('projectId');
  if (!parsed.appId) missingKeys.push('appId');

  if (missingKeys.length > 0) {
    return {
      isValid: false,
      configType: 'missing_required_fields',
      errorTitle: 'Missing Required Firebase Fields',
      errorMessage: `The JSON is missing essential Firebase Web properties: ${missingKeys.join(', ')}.`,
      remediationStep:
        'Obtain your Firebase Web App configuration from Firebase Console > Project Settings > General > "Your apps" > npm/Config snippet.',
      sanitizedConfig: null
    };
  }

  return {
    isValid: true,
    configType: 'firebase_web_valid',
    sanitizedConfig: {
      projectId: String(parsed.projectId),
      appId: String(parsed.appId),
      apiKey: String(parsed.apiKey),
      authDomain: String(parsed.authDomain),
      storageBucket: parsed.storageBucket ? String(parsed.storageBucket) : undefined,
      messagingSenderId: parsed.messagingSenderId ? String(parsed.messagingSenderId) : undefined,
      measurementId: parsed.measurementId ? String(parsed.measurementId) : '',
      oAuthClientId: parsed.oAuthClientId ? String(parsed.oAuthClientId) : undefined,
      recaptchaSiteKey: parsed.recaptchaSiteKey ? String(parsed.recaptchaSiteKey) : '',
      firestoreDatabaseId: parsed.firestoreDatabaseId ? String(parsed.firestoreDatabaseId) : undefined
    }
  };
}

/**
 * Resolves the active Firebase configuration:
 * 1. User custom override in localStorage (if configured via in-app UI)
 * 2. VITE_FIREBASE_CONFIG environment variable (JSON string)
 * 3. Individual VITE_FIREBASE_* environment variables
 * 4. Default firebase-applet-config.json file
 */
export function getResolvedFirebaseConfig(): { config: FirebaseAppConfig; validation: ConfigValidationResult } {
  // 1. Check localStorage custom config
  if (typeof window !== 'undefined') {
    const customLocal = localStorage.getItem('legal_suite_custom_firebase_config');
    if (customLocal) {
      const val = validateFirebaseConfig(customLocal);
      if (val.isValid && val.sanitizedConfig) {
        return { config: val.sanitizedConfig, validation: val };
      }
    }
  }

  // 2. Check VITE_FIREBASE_CONFIG environment variable
  const metaEnv = (import.meta as any).env || {};
  const envConfigJson = metaEnv.VITE_FIREBASE_CONFIG;
  if (envConfigJson) {
    const val = validateFirebaseConfig(envConfigJson);
    if (val.isValid && val.sanitizedConfig) {
      return { config: val.sanitizedConfig, validation: val };
    }
  }

  // 3. Check individual VITE_ env variables
  if (metaEnv.VITE_FIREBASE_API_KEY && metaEnv.VITE_FIREBASE_PROJECT_ID) {
    const envConfig: any = {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${metaEnv.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: metaEnv.VITE_FIREBASE_APP_ID || `1:${metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID}:web:default`,
      oAuthClientId: metaEnv.VITE_FIREBASE_OAUTH_CLIENT_ID
    };
    const val = validateFirebaseConfig(envConfig);
    if (val.isValid && val.sanitizedConfig) {
      return { config: val.sanitizedConfig, validation: val };
    }
  }

  // 4. Default bundled config
  const val = validateFirebaseConfig(defaultRawConfig);
  return {
    config: (val.sanitizedConfig || defaultRawConfig) as FirebaseAppConfig,
    validation: val
  };
}

export const activeFirebaseConfig = getResolvedFirebaseConfig().config;
