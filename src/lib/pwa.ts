/**
 * LEVEL 23 Legal AI Suite - PWA Management Service
 * Handles Service Worker registration, offline caching, and PWA installation prompts.
 */

type PwaInstallState = {
  isInstallable: boolean;
  isInstalled: boolean;
  swRegistered: boolean;
  swActive: boolean;
  isOnline: boolean;
};

let deferredPrompt: any = null;
const listeners = new Set<(state: PwaInstallState) => void>();

function notifyListeners() {
  const state = getPwaState();
  listeners.forEach((listener) => listener(state));
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function getPwaState(): PwaInstallState {
  if (typeof window === 'undefined') {
    return {
      isInstallable: false,
      isInstalled: false,
      swRegistered: false,
      swActive: false,
      isOnline: true
    };
  }

  const isInstalled = isStandalone();
  const isInstallable = Boolean(deferredPrompt) && !isInstalled;
  const swRegistered = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller);
  const swActive = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
  const isOnline = navigator.onLine;

  return {
    isInstallable,
    isInstalled,
    swRegistered,
    swActive,
    isOnline
  };
}

export function subscribePwaState(callback: (state: PwaInstallState) => void): () => void {
  listeners.add(callback);
  callback(getPwaState());
  return () => {
    listeners.delete(callback);
  };
}

export async function promptInstallPwa(): Promise<{ outcome: 'accepted' | 'dismissed' | 'unsupported' }> {
  if (!deferredPrompt) {
    // If not supported or already installed
    return { outcome: 'unsupported' };
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
    return { outcome };
  } catch (err) {
    console.error('PWA install prompt failed:', err);
    return { outcome: 'dismissed' };
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Level 23 PWA] Service Worker registered successfully:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Level 23 PWA] New update available; ready to reload.');
          }
          notifyListeners();
        });
      }
    });

    notifyListeners();
  } catch (err) {
    console.warn('[Level 23 PWA] Service Worker registration failed (ignorable in sandbox):', err);
  }
}

export async function clearPwaCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
    console.log('[Level 23 PWA] Cleared all local service worker caches.');
    return true;
  } catch (err) {
    console.error('Failed to clear PWA cache:', err);
    return false;
  }
}

// Global Event Listeners setup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[Level 23 PWA] Native install prompt intercepted and ready for UI trigger');
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('[Level 23 PWA] App successfully installed as Desktop/Mobile PWA');
    notifyListeners();
  });

  window.addEventListener('online', () => notifyListeners());
  window.addEventListener('offline', () => notifyListeners());
}
