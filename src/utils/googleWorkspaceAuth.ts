/**
 * JESic Meet - Google Workspace Integration (Google Calendar & Pure Google OAuth2)
 * Rimosso completamente qualsiasi dipendenza da Firebase.
 */

import { MeetingEvent, User } from '../types';
import { formatRomeDateTimeRFC3339 } from './dateUtils';

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
 * Inserisce l'evento nel Google Calendar primario dell'utente
 * tramite API Google Calendar REST v3 (client-side con token Bearer)
 */
export async function insertEventToGoogleCalendar(
  params: SyncCalendarEventParams,
  token?: string
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  if (!token) {
    return {
      success: false,
      error: 'Token non attivo',
    };
  }

  const startDateTime = formatRomeDateTimeRFC3339(params.date, params.startTime);
  const endDateTime = formatRomeDateTimeRFC3339(params.date, params.endTime);

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
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  if (params.attendeeEmails && params.attendeeEmails.length > 0) {
    payload.attendees = params.attendeeEmails.map((email) => ({ email }));
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
      return { success: false, error: 'Errore API Google Calendar' };
    }
  } catch (err: any) {
    console.warn('[Google Calendar API] Errore di rete:', err);
    return { success: false, error: err?.message || 'Errore di rete' };
  }
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
  const token = creator?.googleAccessToken;
  if (!token) {
    return { success: false };
  }

  const attendeeEmails = attendees.map((a) => a.email).filter(Boolean);

  return insertEventToGoogleCalendar(
    {
      title: event.title,
      description: event.description,
      location: event.location,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isOnline: event.type === 'online',
      meetLink: event.meetLink,
      attendeeEmails,
    },
    token
  );
}
