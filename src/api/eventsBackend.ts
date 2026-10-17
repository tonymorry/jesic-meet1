/**
 * JESic Meet - Backend Express Route & Google Calendar Integration
 * 
 * Specifica Richiesta:
 * "La logica backend (Express.js) per gestire il click su 'Partecipa',
 * l'aggiornamento del DB e la chiamata calendar.events.insert a Google.
 * APPROCCIO LIBERTÀ TOTALE: nessun blocco di disponibilità, l'app inserisce
 * l'evento anche se c'è un accavallamento sul calendario personale."
 */

import express, { Request, Response } from 'express';

export const eventsRouter = express.Router();

/**
 * Converte data ('YYYY-MM-DD') e orario ('HH:mm') in formato RFC3339 con timezone italiana (Europe/Rome)
 */
export function formatRfc3339(dateStr: string, timeStr: string): string {
  // es. "2026-10-15T09:30:00"
  const paddedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${paddedTime}`;
}

/**
 * Stringa di codice sorgente di produzione Express + googleapis (google.calendar.events.insert)
 * esportabile e documentata per il backend server.ts di produzione.
 */
export const EXPRESS_BACKEND_PARTICIPATE_CODE = `
import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import { User, Event } from './models/schemas';

export const eventsRouter = express.Router();

export function getGoogleCalendarClient(userAccessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: userAccessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// POST /api/events/:id/participate
eventsRouter.post('/:id/participate', async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { userId, userAccessToken } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Evento non trovato' });

    let googleCalendarEventId = null;
    let syncSuccess = false;

    // 1. Chiamata Google Calendar API (calendar.events.insert)
    // APPROCCIO LIBERTÀ TOTALE: nessun blocco di disponibilità né lettura eventi personali
    const token = userAccessToken || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const calendar = getGoogleCalendarClient(token);
        const targetDate = event.dataOraDefinitiva?.date || event.dateProposte[0];
        const startTime = event.dataOraDefinitiva?.startTime || '10:00';
        const endTime = event.dataOraDefinitiva?.endTime || '11:00';

        const googleResponse = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: \`[JESic] \${event.titolo}\`,
            description: \`\${event.descrizione || ''}\\n\\nOrganizzato da Junior Enterprise Sicilia (JESic Meet)\`,
            start: { dateTime: \`\${targetDate}T\${startTime}:00\`, timeZone: 'Europe/Rome' },
            end: { dateTime: \`\${targetDate}T\${endTime}:00\`, timeZone: 'Europe/Rome' },
            location: event.tipo === 'online' ? 'Google Meet' : event.luogo || 'Sede JESic',
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 30 },
                { method: 'email', minutes: 1440 },
              ],
            },
          },
          conferenceDataVersion: event.tipo === 'online' ? 1 : 0,
        });
        googleCalendarEventId = googleResponse.data.id || null;
        syncSuccess = true;
      } catch (gcalErr) {
        console.warn('Avviso sincronizzazione Google Calendar:', gcalErr);
      }
    }

    // 2. Aggiornamento Database Mongoose
    await Event.updateOne(
      { _id: eventId, 'participants.userId': userId },
      {
        $set: {
          'participants.$.status': 'accepted',
          'participants.$.respondedAt': new Date(),
          'participants.$.googleCalendarSynced': syncSuccess,
        },
      }
    );

    return res.json({ success: true, status: 'accepted', googleCalendarSynced: syncSuccess });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
`;

/**
 * Handler HTTP Express per endpoint mock o server integrato
 */
eventsRouter.post('/:id/participate', async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { userId, userAccessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId obbligatorio' });
    }

    // Simulazione inserimento Google Calendar con approccio Libertà Totale
    const simulatedGcalId = `gcal-evt-${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: 'Partecipazione confermata con successo!',
      status: 'accepted',
      googleCalendarSynced: true,
      googleCalendarEventId: simulatedGcalId,
      eventId,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

eventsRouter.post('/:id/decline', async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    return res.status(200).json({
      success: true,
      message: 'Hai rifiutato l\'invito all\'evento',
      status: 'declined',
      eventId,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
