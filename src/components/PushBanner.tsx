/**
 * JESic Meet - Banner Rapido Attivazione Notifiche Push
 * Mostrato in modo discreto ed elegante se l'utente non ha ancora autorizzato le notifiche.
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Bell, X, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  subscribeToPushNotifications,
} from '../utils/pushManager';

interface PushBannerProps {
  currentUser: User;
  onActivated?: () => void;
}

export const PushBanner: React.FC<PushBannerProps> = ({ currentUser, onActivated }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isPushNotificationSupported()) return;

    // Se l'utente ha già chiuso il banner in questa sessione, non riaprirlo continuamente
    const dismissed = sessionStorage.getItem('jesic_push_banner_dismissed');
    if (dismissed === 'true') return;

    // Se il permesso è già 'granted' o 'denied', controlla se è già iscritto
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'denied') return;
      if (Notification.permission === 'granted') {
        getExistingPushSubscription().then((sub) => {
          if (!sub) {
            // Permesso concesso in precedenza ma non ancora registrato in MongoDB per questa sessione
            setIsVisible(true);
          }
        });
        return;
      }
    }

    setIsVisible(true);
  }, []);

  const handleActivate = async () => {
    setIsSubscribing(true);
    try {
      const res = await subscribeToPushNotifications(currentUser.id);
      if (res.success) {
        setIsSuccess(true);
        onActivated?.();
        setTimeout(() => {
          setIsVisible(false);
        }, 2200);
      } else {
        setIsVisible(false);
      }
    } catch {
      setIsVisible(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('jesic_push_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-[#f23e2e] to-red-600 text-white px-4 py-2.5 sm:py-3 shadow-md border-b border-red-700/40 relative z-20 animate-in slide-in-from-top duration-300">
      <div className="max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5px]" />
            ) : (
              <Bell className="w-4 h-4 text-white stroke-[2.2px] animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-xs sm:text-sm font-extrabold truncate">
              {isSuccess ? 'Notifiche Push Attivate con Successo!' : 'Attiva le Notifiche Push in Stile WhatsApp'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-white/90 truncate">
              {isSuccess
                ? 'Riceverai avvisi per chat, sondaggi ed eventi anche a sito chiuso.'
                : 'Ricevi suoni e banner per messaggi in chat, sondaggi ed eventi.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isSuccess && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={isSubscribing}
              className="px-3 py-1.5 rounded-xl bg-white text-[#f23e2e] hover:bg-neutral-100 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isSubscribing ? 'Attivazione...' : 'Attiva Ora'}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Chiudi avviso"
            aria-label="Chiudi avviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
