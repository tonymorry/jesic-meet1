/**
 * JESic Meet - Scheda Notifiche Push
 * Design minimale: titolo Notifiche Push con stato e toggle switch on/off.
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Bell,
  BellRing,
} from 'lucide-react';
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  registerServiceWorker,
} from '../utils/pushManager';

interface PushNotificationCardProps {
  currentUser: User;
  onNotificationFeedback?: (msg: string) => void;
}

export const PushNotificationCard: React.FC<PushNotificationCardProps> = ({
  currentUser,
  onNotificationFeedback,
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      if (typeof Notification !== 'undefined') {
        setPermissionState(Notification.permission);
      }

      registerServiceWorker().then(() => {
        getExistingPushSubscription().then((sub) => {
          setIsSubscribed(Boolean(sub));
        });
      });
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      alert('Il tuo browser non supporta le notifiche push web.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        const ok = await unsubscribeFromPushNotifications(currentUser.id);
        if (ok) {
          setIsSubscribed(false);
          onNotificationFeedback?.('Notifiche push disattivate su questo dispositivo.');
        }
      } else {
        const result = await subscribeToPushNotifications(currentUser.id);
        setPermissionState(result.permission);

        if (result.success) {
          setIsSubscribed(true);
          onNotificationFeedback?.('Notifiche push attivate!');
        }
      }
    } catch {
      // Ignora errori non critici
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
              isSubscribed
                ? 'bg-[#00a884] text-white shadow-emerald-500/20'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {isSubscribed ? (
              <BellRing className="w-5 h-5 stroke-[2.2px]" />
            ) : (
              <Bell className="w-5 h-5 stroke-[2px]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                Notifiche Push
              </h3>
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  isSubscribed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : permissionState === 'denied'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {isSubscribed ? 'Attive' : permissionState === 'denied' ? 'Bloccate' : 'Disattivate'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {isSubscribed ? 'Riceverai avvisi per messaggi, sondaggi ed eventi' : 'Attiva per ricevere avvisi in tempo reale'}
            </p>
          </div>
        </div>

        {/* Pulsantino Toggle Switch On/Off */}
        <button
          type="button"
          role="switch"
          aria-checked={isSubscribed}
          disabled={isLoading}
          onClick={handleToggle}
          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none disabled:opacity-50 ${
            isSubscribed ? 'bg-[#00a884]' : 'bg-neutral-300 dark:bg-neutral-700'
          }`}
          title={isSubscribed ? 'Disattiva notifiche push' : 'Attiva notifiche push'}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              isSubscribed ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
