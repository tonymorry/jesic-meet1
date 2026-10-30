/**
 * JESic Meet - Scheda Gestione Notifiche Push Reali (Stile WhatsApp)
 * Permette all'utente di attivare/disattivare le notifiche su smartphone o PC
 * e di testare istantaneamente con un click l'arrivo della notifica.
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Bell,
  BellRing,
  BellOff,
  Send,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Smartphone,
  Laptop,
} from 'lucide-react';
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestNotification,
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
  const [isTesting, setIsTesting] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Inizializza service worker e verifica stato sottoscrizione
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
    setStatusMsg(null);

    try {
      if (isSubscribed) {
        // Disattiva
        const ok = await unsubscribeFromPushNotifications(currentUser.id);
        if (ok) {
          setIsSubscribed(false);
          const msg = 'Notifiche push disattivate su questo dispositivo.';
          setStatusMsg(msg);
          onNotificationFeedback?.(msg);
        }
      } else {
        // Attiva
        const result = await subscribeToPushNotifications(currentUser.id);
        setPermissionState(result.permission);

        if (result.success) {
          setIsSubscribed(true);
          const msg = 'Notifiche push reali attivate! Riceverai avvisi anche a sito chiuso.';
          setStatusMsg(msg);
          onNotificationFeedback?.(msg);
        } else {
          setStatusMsg(result.error || 'Impossibile attivare le notifiche push.');
        }
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Errore durante l\'aggiornamento delle notifiche push.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!isSubscribed) {
      setStatusMsg('Attiva prima le notifiche push con lo switch per ricevere il test!');
      return;
    }

    setIsTesting(true);
    setStatusMsg(null);

    try {
      const res = await sendTestNotification(currentUser.id);
      setStatusMsg(res.message);
      if (res.success) {
        onNotificationFeedback?.('Notifica di prova inviata! Controlla il tuo dispositivo.');
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Errore invio notifica test.');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2.5 text-neutral-400">
          <BellOff className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Notifiche Push Dispositivo
            </h3>
            <p className="text-[11px] text-neutral-400">
              Il browser in uso non supporta il protocollo standard Web Push Notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
      
      {/* Intestazione e Toggle Switch */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
              isSubscribed
                ? 'bg-[#00a884] text-white shadow-emerald-500/20'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {isSubscribed ? (
              <BellRing className="w-5 h-5 stroke-[2.2px] animate-bounce" />
            ) : (
              <Bell className="w-5 h-5 stroke-[2px]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                Notifiche Push Reali
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
                {isSubscribed
                  ? 'Attive sul dispositivo'
                  : permissionState === 'denied'
                  ? 'Permesso Bloccato'
                  : 'Disattivate'}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Stile WhatsApp con suono e banner anche a sito chiuso o in background
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isSubscribed}
          disabled={isLoading}
          onClick={handleToggle}
          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none disabled:opacity-50 ${
            isSubscribed ? 'bg-[#00a884]' : 'bg-neutral-300 dark:bg-neutral-700'
          }`}
          title={isSubscribed ? 'Disattiva notifiche su questo dispositivo' : 'Attiva notifiche su questo dispositivo'}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              isSubscribed ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Spiegazione 3 situazioni automatiche */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-1">
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00a884] shrink-0" />
            Chat di Gruppo
          </span>
          <p className="text-neutral-500 dark:text-neutral-400 text-[10px] leading-relaxed">
            Messaggi nei gruppi e sottogruppi con anteprima di testo o media.
          </p>
        </div>

        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-1">
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            Nuovi Sondaggi
          </span>
          <p className="text-neutral-500 dark:text-neutral-400 text-[10px] leading-relaxed">
            Invito immediato a votare le disponibilità per nuove riunioni.
          </p>
        </div>

        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-1">
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f23e2e] shrink-0" />
            Eventi a Calendario
          </span>
          <p className="text-neutral-500 dark:text-neutral-400 text-[10px] leading-relaxed">
            Notifica quando un meeting è confermato o viene creato un evento associativo.
          </p>
        </div>
      </div>

      {/* Messaggio di stato / Feedback */}
      {statusMsg && (
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
          <Sparkles className="w-4 h-4 text-[#00a884] shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tasto Notifica di Prova */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
          <Smartphone className="w-3.5 h-3.5" />
          <span>+</span>
          <Laptop className="w-3.5 h-3.5" />
          <span>Supporta telefoni (Android, iOS PWA) e computer (Chrome, Edge, Safari, Firefox)</span>
        </div>

        <button
          type="button"
          onClick={handleSendTest}
          disabled={!isSubscribed || isTesting}
          className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-[#00a884] hover:text-white dark:bg-neutral-800 dark:hover:bg-[#00a884] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          title="Invia una notifica di prova reale al tuo dispositivo"
        >
          <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Invio in corso...' : 'Invia Notifica di Prova'}</span>
        </button>
      </div>

    </div>
  );
};
