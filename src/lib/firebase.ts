import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Silence internal WebChannel reconnect and offline warning logs in browser console
try {
  setLogLevel('silent');
} catch {}

// Initialize Firestore with auto-detect long-polling and multi-tab persistent local cache
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, (firebaseConfig as any).firestoreDatabaseId);
} catch {
  firestoreDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  const isPermissionError = 
    errCode === 'permission-denied' ||
    errMessage.includes('permission-denied') ||
    errMessage.includes('insufficient permissions') ||
    errMessage.includes('Missing or insufficient permissions');

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // For offline, unavailable, or transient network conditions, warn cleanly without uncaught throws
    console.warn(`Firestore ${operationType} notice on ${path || 'unknown'}:`, errInfo.error);
    return errInfo;
  }
}

/**
 * Recursively cleans an object or array to ensure it contains NO undefined values.
 * Firestore strictly throws an exception if any field in a setDoc/updateDoc/addDoc payload is undefined.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

/**
 * Validates connection to Firestore backend as recommended by Firestore integration standards.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || (error as any).code === 'unavailable')) {
      console.warn("Firestore client is operating in offline mode.");
    }
    return false;
  }
}

/**
 * Ensures the user is authenticated (anonymously) to allow Firestore rules clearance 
 * without demanding interactive manual login unless desired. Falls back gracefully
 * to guest/unauthenticated state if anonymous auth is restricted by administrator policies.
 */
export async function ensureAuthenticated(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const credential = await signInAnonymously(auth);
          unsubscribe();
          resolve(credential.user);
        } catch (err) {
          console.warn("Anonymous sign-in notice. Proceeding as unauthenticated guest.", err);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });
}

