/**
 * JESic Meet - Gestore Notifiche Push Reali lato Client (Browser Web Push API)
 * Registrazione Service Worker, richiesta permessi e sincronizzazione con MongoDB
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica se il browser supporta le Notifiche Push e i Service Worker
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Registra il Service Worker /sw.js
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[PushManager] Registrazione Service Worker non riuscita:', err);
    return null;
  }
}

/**
 * Ottiene la sottoscrizione push attiva per questo browser
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[PushManager] Errore verifica sottoscrizione esistente:', err);
    return null;
  }
}

/**
 * Attiva le notifiche push per l'utente su questo dispositivo:
 * 1. Richiede il permesso al browser
 * 2. Recupera la chiave pubblica VAPID dal backend
 * 3. Iscrive il dispositivo al Push Service
 * 4. Salva l'endpoint in MongoDB
 */
export async function subscribeToPushNotifications(userId: string): Promise<{
  success: boolean;
  permission: NotificationPermission;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      permission: 'denied',
      error: 'Il tuo browser non supporta le notifiche push web.',
    };
  }

  try {
    // 1. Richiedi permesso all'utente
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error:
          permission === 'denied'
            ? 'Permesso notifiche negato nelle impostazioni del browser.'
            : 'Permesso notifiche non concesso.',
      };
    }

    // 2. Registra o ottieni il service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return {
        success: false,
        permission,
        error: 'Impossibile inizializzare il Service Worker.',
      };
    }
    await navigator.serviceWorker.ready;

    // 3. Recupera la VAPID public key dal backend
    const keyRes = await fetch('/api/push/public-key');
    if (!keyRes.ok) {
      throw new Error('Impossibile ottenere la chiave pubblica VAPID dal server');
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      throw new Error('Chiave pubblica VAPID assente');
    }

    // 4. Iscrivi al PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // 5. Salva la sottoscrizione nel database MongoDB
    const subJSON = subscription.toJSON();
    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subJSON,
        userAgent: navigator.userAgent,
      }),
    });

    if (!saveRes.ok) {
      const errData = await saveRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Errore salvataggio sottoscrizione su MongoDB');
    }

    return { success: true, permission: 'granted' };
  } catch (err: any) {
    console.error('[PushManager] Errore attivazione notifiche push:', err);
    return {
      success: false,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
      error: err.message || 'Errore imprevisto durante l\'attivazione delle notifiche push.',
    };
  }
}

/**
 * Disattiva le notifiche push su questo dispositivo e le rimuove da MongoDB
 */
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, endpoint }),
      });
    }

    return true;
  } catch (err) {
    console.error('[PushManager] Errore disiscrizione push:', err);
    return false;
  }
}

/**
 * Invia una notifica di prova reale al dispositivo corrente dell'utente
 */
export async function sendTestNotification(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return {
      success: data.success && data.sent > 0,
      message: data.message || 'Notifica di prova inviata!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Errore invio notifica di prova',
    };
  }
}
