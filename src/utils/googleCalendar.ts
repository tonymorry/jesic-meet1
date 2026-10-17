/**
 * JESic Meet - Integrazione Google Calendar, Google Meet & .ICS Export
 * Junior Enterprise Sicilia
 */

import { MeetingEvent, User } from '../types';

/**
 * Converte data e ora in stringa compatibile con formato ISO compatto per URL Google Calendar:
 * es. "20261015T100000Z"
 */
function toCalendarDateTime(dateStr: string, timeStr: string): string {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Genera il link Web Intent per Google Calendar (apre direttamente l'interfaccia di aggiunta evento)
 */
export function generateGoogleCalendarWebUrl(
  event: MeetingEvent,
  date: string,
  startTime: string,
  endTime: string,
  inviteeEmails: string[] = []
): string {
  const startIso = toCalendarDateTime(date, startTime);
  const endIso = toCalendarDateTime(date, endTime);

  const titleParam = encodeURIComponent(`[JESic] ${event.title}`);
  
  const descriptionText = [
    event.description || '',
    '',
    event.type === 'online' && event.meetLink ? `🔗 Link Google Meet: ${event.meetLink}` : '',
    event.type === 'in_person' && event.location ? `📍 Luogo: ${event.location}` : '',
    'Organizzato con JESic Meet - Junior Enterprise Sicilia',
  ]
    .filter(Boolean)
    .join('\n');

  const detailsParam = encodeURIComponent(descriptionText);
  const locationParam = encodeURIComponent(
    event.type === 'online'
      ? event.meetLink || 'Google Meet'
      : event.location || 'Sede JESic'
  );

  const addAttendees = inviteeEmails.length > 0 ? `&add=${encodeURIComponent(inviteeEmails.join(','))}` : '';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleParam}&dates=${startIso}/${endIso}&details=${detailsParam}&location=${locationParam}${addAttendees}`;
}

/**
 * Genera il contenuto in formato RFC 5545 iCalendar (.ics) per integrazione universale (Apple, Google, Outlook)
 */
export function generateIcsContent(
  event: MeetingEvent,
  date: string,
  startTime: string,
  endTime: string,
  creator: User,
  attendees: User[]
): string {
  const uid = `jesic-meet-${event.id}-${Date.now()}@jesic.it`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtStart = toCalendarDateTime(date, startTime);
  const dtEnd = toCalendarDateTime(date, endTime);

  const location =
    event.type === 'online'
      ? event.meetLink || 'Google Meet'
      : event.location || 'Sede JESic';

  const attendeeLines = attendees
    .map(
      (a) =>
        `ATTENDEE;CN=${a.name} ${a.surname};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a.email}`
    )
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Junior Enterprise Sicilia//JESic Meet//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:[JESic] ${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}\\n\\nOrganizzato tramite JESic Meet`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=${creator.name} ${creator.surname}:mailto:${creator.email}`,
    attendeeLines,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria Meeting JESic',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Scarica il file .ics direttamente nel browser
 */
export function downloadIcsFile(
  event: MeetingEvent,
  date: string,
  startTime: string,
  endTime: string,
  creator: User,
  attendees: User[]
): void {
  const icsData = generateIcsContent(event, date, startTime, endTime, creator, attendees);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Codice di riferimento per Backend Node.js con Googleapis, OAuth2 e Nodemailer
 */
export const GOOGLE_CALENDAR_BACKEND_CODE = `
/**
 * BACKEND NODE.JS: Creazione evento Google Calendar con Google Meet e Inviti Email
 * Librerie: googleapis, nodemailer
 */

import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// 1. Inizializzazione Client OAuth2
export function getOAuth2Client(accessToken, refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // es. https://app.jesic.it/api/auth/google/callback
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

// 2. Creazione Evento con generazione automatica Google Meet
export async function createGoogleCalendarEvent({
  auth,
  title,
  description,
  date,
  startTime,
  endTime,
  isOnline,
  location,
  attendeeEmails,
}) {
  const calendar = google.calendar({ version: 'v3', auth });

  const startDateTime = new Date(\`\${date}T\${startTime}:00\`).toISOString();
  const endDateTime = new Date(\`\${date}T\${endTime}:00\`).toISOString();

  const eventPayload = {
    summary: \`[JESic] \${title}\`,
    description,
    location: isOnline ? 'Google Meet' : location,
    start: {
      dateTime: startDateTime,
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Europe/Rome',
    },
    attendees: attendeeEmails.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 giorno prima
        { method: 'popup', minutes: 15 },      // 15 minuti prima
      ],
    },
  };

  // Se l'incontro è online, chiediamo a Google Calendar di generare un link Google Meet
  if (isOnline) {
    eventPayload.conferenceData = {
      createRequest: {
        requestId: \`jesic-meet-\${Date.now()}\`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: eventPayload,
    conferenceDataVersion: 1, // FONDAMENTALE per far creare il link Google Meet
    sendUpdates: 'all',       // Invia automaticamente l'invito email a tutti i partecipanti!
  });

  const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri;

  return {
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    meetLink: meetLink,
  };
}

// 3. Invio Email con Nodemailer di backup / conferma personalizzata con logo JESic
export async function sendConfirmationEmail({
  to,
  eventTitle,
  dateFormatted,
  timeFormatted,
  meetLink,
  location,
  isOnline,
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: '"JESic Meet" <no-reply@jesic.it>',
    to,
    subject: \`✅ Confermato: \${eventTitle} - Junior Enterprise Sicilia\`,
    html: \`
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f23e2e; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">JESic Meet</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">Junior Enterprise Sicilia</p>
        </div>
        <div style="padding: 24px; color: #1e1e1e;">
          <h2 style="color: #f23e2e; margin-top: 0;">Meeting Confermato!</h2>
          <p>Tutti gli slot sono stati analizzati e l'orario ideale con la massima presenza è stato stabilito:</p>
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p><strong>Evento:</strong> \${eventTitle}</p>
            <p><strong>Data & Ora:</strong> \${dateFormatted} | \${timeFormatted}</p>
            <p><strong>Modalità:</strong> \${isOnline ? 'Online (Google Meet)' : 'In presenza'}</p>
            \${isOnline && meetLink ? \`<p><strong>Link Meet:</strong> <a href="\${meetLink}" style="color: #f23e2e; font-weight: bold;">\${meetLink}</a></p>\` : ''}
            \${!isOnline && location ? \`<p><strong>Luogo:</strong> \${location}</p>\` : ''}
          </div>
          <p style="font-size: 13px; color: #666;">L'evento è stato sincronizzato con il tuo Google Calendar.</p>
        </div>
      </div>
    \`,
  };

  await transporter.sendMail(mailOptions);
}
`;
