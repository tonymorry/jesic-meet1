/**
 * JESic Meet - Google Workspace Integration (Google Calendar & Auth)
 * Gestione client-side token e sincronizzazione automatica eventi con Google Calendar.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MeetingEvent, User } from '../types';

// Inizializzazione singleton Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider Google con scope minimo Calendar Events
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');

// Flag per evitare race conditions durante il popup di login
let isSigningIn = false;

// Cache in memoria del token di accesso OAuth (MAI in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

/**
 * Inizializza l'ascoltatore dello stato di autenticazione Firebase
 */
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Accesso con Google (popup) per ottenere il token Google Calendar
 */
export const googleSignIn = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossibile ottenere il token di accesso Google Workspace');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.warn('Avviso Google Sign-in popup:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Restituisce il token di accesso in memoria (se presente)
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Disconnette la sessione Google
 */
export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface SyncCalendarEventParams {
  title: string;
  description?: string;
  location?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isOnline?: boolean;
  meetLink?: string;
  attendeeEmails?: string[];
}

/**
 * Inserisce direttamente l'evento nel Google Calendar primario dell'utente
 * tramite API Google Calendar REST v3 (client-side)
 */
export async function insertEventToGoogleCalendar(
  params: SyncCalendarEventParams,
  token?: string
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  const activeToken = token || cachedAccessToken;

  // Costruisci data/ora di inizio e fine in formato ISO con timezone Europe/Rome
  const startDateTime = new Date(`${params.date}T${params.startTime}:00`).toISOString();
  const endDateTime = new Date(`${params.date}T${params.endTime}:00`).toISOString();

  const descriptionParts = [
    params.description || '',
    '',
    params.isOnline && params.meetLink ? `🔗 Link Google Meet: ${params.meetLink}` : '',
    params.location ? `📍 Luogo: ${params.location}` : '',
    'Organizzato con JESic Meet - Junior Enterprise Sicilia',
  ]
    .filter(Boolean)
    .join('\n');

  const payload: any = {
    summary: `[JESic] ${params.title}`,
    description: descriptionParts,
    location: params.isOnline ? params.meetLink || 'Google Meet' : params.location || 'Sede JESic',
    start: {
      dateTime: startDateTime,
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Europe/Rome',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 giorno prima
        { method: 'popup', minutes: 15 },      // 15 minuti prima
      ],
    },
  };

  if (params.attendeeEmails && params.attendeeEmails.length > 0) {
    payload.attendees = params.attendeeEmails.map((email) => ({ email }));
  }

  // Se abbiamo il token di accesso autorizzato, effettua la chiamata diretta all'API Google Calendar
  if (activeToken) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          eventId: data.id,
          htmlLink: data.htmlLink,
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('[Google Calendar API] Errore risposta:', errData);
      }
    } catch (err: any) {
      console.warn('[Google Calendar API] Errore di rete:', err);
    }
  }

  // Se il token non è attivo o la sessione richiede autorizzazione,
  // l'evento è comunque registrato e formattato per sincronizzazione
  return {
    success: false,
    error: 'Token non attivo',
  };
}

/**
 * Helper per la sincronizzazione automatica degli eventi di meeting/ufficiali
 */
export async function autoSyncMeetingEventToCalendar(
  event: MeetingEvent,
  slot: { date: string; startTime: string; endTime: string },
  creator?: User | null,
  attendees: User[] = []
): Promise<{ success: boolean; htmlLink?: string }> {
  const attendeeEmails = attendees.map((a) => a.email).filter(Boolean);

  const res = await insertEventToGoogleCalendar({
    title: event.title,
    description: event.description,
    location: event.location,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isOnline: event.type === 'online',
    meetLink: event.meetLink,
    attendeeEmails,
  });

  return res;
}
