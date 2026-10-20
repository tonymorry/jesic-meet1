/**
 * JESic Meet - Integrazione Reale Google Calendar & Google Meet
 * Junior Enterprise Sicilia
 * 
 * Utilizza la libreria ufficiale 'googleapis' (v3) per creare automaticamente
 * eventi con stanza Google Meet reale tramite il Google Refresh Token dell'utente.
 */

import { google } from 'googleapis';

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  '';

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

/**
 * Inizializza l'OAuth2Client di Google per la creazione di eventi
 */
export function getOAuth2Client(refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'postmessage'
  );

  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return oauth2Client;
}

export interface CreateGoogleCalendarEventParams {
  googleRefreshToken?: string;
  refreshToken?: string;
  accessToken?: string;
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isOnline?: boolean;
  location?: string;
  attendeeEmails?: string[];
}

export interface GoogleCalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  meetLink?: string;
  error?: string;
}

/**
 * Crea silente ed automaticamente l'evento su Google Calendar con conferenza Google Meet
 * tramite la vera libreria googleapis (nessun setTimeout né link finti).
 */
export async function createGoogleCalendarEvent(
  params: CreateGoogleCalendarEventParams
): Promise<GoogleCalendarEventResult> {
  const {
    googleRefreshToken,
    refreshToken,
    title,
    description,
    date,
    startTime,
    endTime,
    isOnline = true,
    location,
    attendeeEmails = [],
  } = params;

  const actualToken = googleRefreshToken || refreshToken;

  if (!actualToken) {
    console.warn("Token Google assente, evento non inserito in Calendar");
    return {
      success: false,
      error: 'Google Refresh Token non presente',
    };
  }

  try {
    const oauth2Client = getOAuth2Client(actualToken);
    if (params.accessToken) {
      oauth2Client.setCredentials({
        access_token: params.accessToken,
        ...(actualToken ? { refresh_token: actualToken } : {}),
      });
    }
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Format ISO standard con Timezone Europe/Rome
    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const descriptionParts = [
      description || '',
      '',
      'Organizzato tramite JESic Meet (Junior Enterprise Sicilia)',
    ]
      .filter(Boolean)
      .join('\n');

    const requestId = `jesic-${Date.now()}`;

    const eventPayload: any = {
      summary: `[JESic] ${title}`,
      description: descriptionParts,
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Rome',
      },
      location: isOnline ? 'Google Meet' : location || 'Sede JESic',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    if (attendeeEmails.length > 0) {
      eventPayload.attendees = attendeeEmails.map((email) => ({ email }));
    }

    // Parametro obbligatorio per far generare a Google la stanza Meet reale
    if (isOnline) {
      eventPayload.conferenceData = {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: isOnline ? 1 : 0,
      sendUpdates: attendeeEmails.length > 0 ? 'all' : 'none',
      requestBody: eventPayload,
    });

    const data = response.data;
    const realMeetLink =
      data.hangoutLink ||
      data.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri;

    return {
      success: true,
      eventId: data.id || undefined,
      htmlLink: data.htmlLink || undefined,
      meetLink: realMeetLink || undefined,
    };
  } catch (err: any) {
    console.error('Errore creazione evento Google Calendar:', err.message || err);
    return {
      success: false,
      error: err.message || 'Errore chiamata Google Calendar API',
    };
  }
}

export interface UpdateGoogleCalendarEventData {
  title?: string;
  description?: string;
  date?: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  isOnline?: boolean;
  location?: string;
}

/**
 * Aggiorna data, ora o dettagli di un evento già esistente su Google Calendar.
 */
export async function updateGoogleCalendarEvent(
  refreshToken: string | undefined,
  googleEventId: string,
  eventData: UpdateGoogleCalendarEventData
): Promise<{ success: boolean; eventId?: string; data?: any; error?: string }> {
  if (!refreshToken) {
    console.warn("Token Google assente, evento non aggiornato su Calendar");
    return { success: false, error: 'Google Refresh Token non presente' };
  }

  if (!googleEventId) {
    console.warn("googleEventId assente, impossibile aggiornare su Calendar");
    return { success: false, error: 'googleEventId non presente' };
  }

  try {
    const oauth2Client = getOAuth2Client(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const patchBody: any = {};

    if (eventData.title) {
      patchBody.summary = eventData.title.startsWith('[JESic]')
        ? eventData.title
        : `[JESic] ${eventData.title}`;
    }

    if (eventData.description !== undefined) {
      patchBody.description = [
        eventData.description,
        '',
        'Organizzato tramite JESic Meet (Junior Enterprise Sicilia)',
      ]
        .filter(Boolean)
        .join('\n');
    }

    if (eventData.date && eventData.startTime && eventData.endTime) {
      patchBody.start = {
        dateTime: new Date(`${eventData.date}T${eventData.startTime}:00`).toISOString(),
        timeZone: 'Europe/Rome',
      };
      patchBody.end = {
        dateTime: new Date(`${eventData.date}T${eventData.endTime}:00`).toISOString(),
        timeZone: 'Europe/Rome',
      };
    }

    if (eventData.location !== undefined || eventData.isOnline !== undefined) {
      patchBody.location = eventData.isOnline ? 'Google Meet' : eventData.location || 'Sede JESic';
    }

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: patchBody,
    });

    return {
      success: true,
      eventId: response.data.id || googleEventId,
      data: response.data,
    };
  } catch (err: any) {
    console.error('Errore aggiornamento evento Google Calendar:', err.message || err);
    return {
      success: false,
      error: err.message || 'Errore chiamata Google Calendar patch API',
    };
  }
}

/**
 * Elimina definitivamente un evento da Google Calendar tramite googleEventId.
 */
export async function deleteGoogleCalendarEvent(
  refreshToken: string | undefined,
  googleEventId: string
): Promise<{ success: boolean; error?: string }> {
  if (!refreshToken) {
    console.warn("Token Google assente, evento non cancellato da Calendar");
    return { success: false, error: 'Google Refresh Token non presente' };
  }

  if (!googleEventId) {
    console.warn("googleEventId assente, impossibile cancellare da Calendar");
    return { success: false, error: 'googleEventId non presente' };
  }

  try {
    const oauth2Client = getOAuth2Client(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Errore cancellazione evento Google Calendar:', err.message || err);
    return {
      success: false,
      error: err.message || 'Errore chiamata Google Calendar delete API',
    };
  }
}

export const GOOGLE_CALENDAR_BACKEND_CODE = `
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

export async function createGoogleCalendarEvent(params) {
  if (!params.googleRefreshToken) {
    console.warn("Token Google assente, evento non inserito in Calendar");
    return { success: false, error: 'Token assente' };
  }

  oauth2Client.setCredentials({ refresh_token: params.googleRefreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: '[JESic] ' + params.title,
      start: { dateTime: new Date(params.date + 'T' + params.startTime + ':00').toISOString(), timeZone: 'Europe/Rome' },
      end: { dateTime: new Date(params.date + 'T' + params.endTime + ':00').toISOString(), timeZone: 'Europe/Rome' },
      conferenceData: {
        createRequest: {
          requestId: 'jesic-' + Date.now(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }
  });

  return {
    success: true,
    eventId: res.data.id,
    meetLink: res.data.hangoutLink
  };
}

export async function updateGoogleCalendarEvent(refreshToken, googleEventId, eventData) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: eventData.title ? '[JESic] ' + eventData.title : undefined,
      start: eventData.date ? { dateTime: new Date(eventData.date + 'T' + eventData.startTime + ':00').toISOString(), timeZone: 'Europe/Rome' } : undefined,
      end: eventData.date ? { dateTime: new Date(eventData.date + 'T' + eventData.endTime + ':00').toISOString(), timeZone: 'Europe/Rome' } : undefined,
    }
  });
}

export async function deleteGoogleCalendarEvent(refreshToken, googleEventId) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
}
`;
