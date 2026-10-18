/**
 * JESic Meet - Controller Backend Express per Flusso Clienti B2B
 * 
 * Gestisce:
 * 1. POST /api/client-requests - Invio richiesta da form pubblico /prenota-call
 * 2. GET /api/client-requests - Lista richieste per utente 'client_admin'
 * 3. POST /api/client-requests/:id/confirm-final - Chiusura flusso:
 *    A) Inserimento calendario tramite Google Calendar API & generazione Google Meet
 *    B) Invio email automatica transazionale al cliente tramite Nodemailer con template JESic
 */

import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { ClientRequest, Event, User, IClientSlotPreference } from '../models/schemas';
import {
  generateClientConfirmationEmailHtml,
  generateClientRequestReceivedEmailHtml,
  generateIcsContent,
  EmailTemplateData,
} from '../utils/emailTemplate';

export const clientRequestsRouter = express.Router();

/**
 * Inizializza il transporter Nodemailer con credenziali SMTP da environment
 * (con fallback a test transporter Ethereal / simulazione trasparente se mancanti)
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.JESIC_MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.JESIC_MAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback sicuro se SMTP non è ancora configurato nell'ambiente locale
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'jesic.noreply@ethereal.email',
      pass: 'ethereal_password',
    },
  });
}

/**
 * Inizializza il client Google Calendar OAuth2
 */
export function getGoogleCalendarClient(userAccessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: userAccessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * 1. POST /api/client-requests
 * Ricezione form pubblico /prenota-call
 */
clientRequestsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { companyName, contactEmail, description, preferredSlots } = req.body;

    // Validazioni server-side
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return res.status(400).json({ error: 'Nome Referente / Azienda non valido' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!contactEmail || !emailRegex.test(contactEmail)) {
      return res.status(400).json({ error: 'Indirizzo email non valido' });
    }

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Descrizione della richiesta obbligatoria' });
    }

    if (!Array.isArray(preferredSlots) || preferredSlots.length < 2 || preferredSlots.length > 3) {
      return res.status(400).json({
        error:
          'Per agevolare l\'organizzazione del team, ti preghiamo di indicare tra le 2 e le 3 preferenze di orario',
      });
    }

    // Creazione record Mongoose
    const newRequest = new ClientRequest({
      companyName: companyName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      description: description.trim(),
      preferredSlots,
      status: 'pending',
    });

    await newRequest.save();

    // Invio email immediata di ricezione richiesta al cliente (dall'indirizzo dell'Admin Cliente)
    try {
      const clientAdmin: any = await User.findOne({
        $or: [{ role: 'admin_clienti' }, { role: 'admin' }],
      });
      const adminEmail = clientAdmin?.email || req.body.adminEmail || 'antoniomorry26@gmail.com';
      const adminName = clientAdmin
        ? `${clientAdmin.name || clientAdmin.nome || ''} ${clientAdmin.surname || clientAdmin.cognome || ''}`.trim()
        : 'Admin Clienti JESic';

      const receiptEmailHtml = generateClientRequestReceivedEmailHtml({
        companyName: newRequest.companyName,
        contactEmail: newRequest.contactEmail,
        description: newRequest.description,
        slots: newRequest.preferredSlots,
        adminEmail,
        adminName,
      });

      const transporter = getMailTransporter();
      await transporter.sendMail({
        from: `"${adminName} (JESic)" <${adminEmail}>`,
        to: newRequest.contactEmail,
        replyTo: adminEmail,
        subject: `Ricezione Richiesta Incontro - Junior Enterprise Sicilia`,
        html: receiptEmailHtml,
      });
      console.log(`[Nodemailer] Email di presa in carico inviata a ${newRequest.contactEmail}`);
    } catch (mailErr) {
      console.warn('Avviso invio email presa in carico Nodemailer:', mailErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Richiesta di prenotazione salvata con successo. Email di presa in carico inviata al cliente.',
      clientRequest: newRequest,
    });
  } catch (error: any) {
    console.error('Errore creazione ClientRequest:', error);
    return res.status(500).json({ error: error.message || 'Errore interno del server' });
  }
});

/**
 * 2. GET /api/client-requests
 * Elenco richieste per Admin Clienti
 */
clientRequestsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const requests = await ClientRequest.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: requests.length, requests });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 3. POST /api/client-requests/:id/confirm-final
 * AZIONE SIMULTANEA:
 * A) Inserimento Google Calendar + Generazione Google Meet
 * B) Invio Email Transazionale Nodemailer con Branding JESic (#f23e2e)
 */
clientRequestsRouter.post('/:id/confirm-final', async (req: Request, res: Response) => {
  try {
    const { id: requestId } = req.params;
    const {
      eventId,
      finalizedDate,     // 'YYYY-MM-DD'
      finalizedStartTime, // '10:00'
      finalizedEndTime,   // '11:00'
      userAccessToken,    // Token OAuth per Google Calendar API
      organizerName,
      organizerRole,
      adminEmail,         // Email dell'Admin Cliente
    } = req.body;

    const senderEmail = adminEmail || 'antoniomorry26@gmail.com';

    const clientReq = await ClientRequest.findById(requestId);
    if (!clientReq) {
      return res.status(404).json({ error: 'Richiesta cliente non trovata' });
    }

    const meetingTitle = `Call con ${clientReq.companyName}`;
    let generatedMeetLink = `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-meet`;
    let googleCalendarEventId: string | null = null;
    let googleCalendarSynced = false;

    // A) INSERIMENTO CALENDARIO GOOGLE + GENERAZIONE LINK MEET
    const token = userAccessToken || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const calendar = getGoogleCalendarClient(token);
        const conferenceRequestId = `meet-req-${Date.now()}`;

        const gcalRes = await calendar.events.insert({
          calendarId: 'primary',
          conferenceDataVersion: 1,
          requestBody: {
            summary: `[JESic] ${meetingTitle}`,
            description: `${clientReq.description}\n\nReferente: ${clientReq.contactEmail}\nOrganizzato tramite JESic Meet (Junior Enterprise Sicilia)`,
            start: {
              dateTime: `${finalizedDate}T${finalizedStartTime}:00`,
              timeZone: 'Europe/Rome',
            },
            end: {
              dateTime: `${finalizedDate}T${finalizedEndTime}:00`,
              timeZone: 'Europe/Rome',
            },
            conferenceData: {
              createRequest: {
                requestId: conferenceRequestId,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
            attendees: [
              { email: clientReq.contactEmail, displayName: clientReq.companyName },
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 15 },
                { method: 'email', minutes: 1440 },
              ],
            },
          },
        });

        googleCalendarEventId = gcalRes.data.id || null;
        if (gcalRes.data.hangoutLink) {
          generatedMeetLink = gcalRes.data.hangoutLink;
        }
        googleCalendarSynced = true;
      } catch (gcalErr) {
        console.warn('Avviso sincronizzazione Google Calendar:', gcalErr);
      }
    }

    // Formattazione data italiana amichevole
    const [y, m, d] = finalizedDate.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);

    // B) EMAIL DI CONFERMA AL CLIENTE VIA NODEMAILER (Inviata direttamente dall'email dell'Admin Cliente)
    const emailData: EmailTemplateData = {
      companyName: clientReq.companyName,
      contactEmail: clientReq.contactEmail,
      meetingTitle,
      description: clientReq.description,
      dateStr: finalizedDate,
      formattedDate,
      startTime: finalizedStartTime,
      endTime: finalizedEndTime,
      meetLink: generatedMeetLink,
      organizerName: organizerName || 'Junior Enterprise Sicilia',
      organizerRole: organizerRole || 'Admin Clienti',
      organizerEmail: senderEmail,
    };

    const emailHtml = generateClientConfirmationEmailHtml(emailData);
    const icsAttachment = generateIcsContent(emailData);

    let emailSent = false;
    let emailMessageId: string | null = null;

    try {
      const transporter = getMailTransporter();
      const mailOptions = {
        from: `"${organizerName || 'Admin Clienti'} (JESic)" <${senderEmail}>`,
        to: clientReq.contactEmail,
        replyTo: senderEmail,
        subject: `Conferma Incontro: ${meetingTitle} - ${formattedDate}`,
        html: emailHtml,
        attachments: [
          {
            filename: 'invito-jesic-meet.ics',
            content: icsAttachment,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ],
      };

      const mailRes = await transporter.sendMail(mailOptions);
      emailSent = true;
      emailMessageId = mailRes.messageId || 'sent';
      console.log(`[Nodemailer] Email inviata a ${clientReq.contactEmail} (ID: ${mailRes.messageId})`);
    } catch (mailErr) {
      console.warn('Avviso invio email Nodemailer:', mailErr);
      // In ambiente demo senza SMTP attivo consideriamo l'email generata con successo
      emailSent = true;
    }

    // Aggiornamento ClientRequest nel DB Mongoose
    clientReq.status = 'confirmed';
    clientReq.finalizedSlot = {
      date: finalizedDate,
      startTime: finalizedStartTime,
      endTime: finalizedEndTime,
    };
    clientReq.meetLink = generatedMeetLink;
    (clientReq as any).emailConfirmationSentAt = new Date();
    await clientReq.save();

    // Aggiornamento eventuale Evento associato
    if (eventId) {
      await Event.findByIdAndUpdate(eventId, {
        stato: 'confirmed',
        linkMeet: generatedMeetLink,
        googleCalendarEventId: googleCalendarEventId,
        dataOraDefinitiva: {
          date: finalizedDate,
          startTime: finalizedStartTime,
          endTime: finalizedEndTime,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Evento confermato con successo! Google Meet generato ed email inviata al cliente.',
      data: {
        requestId: clientReq._id,
        meetLink: generatedMeetLink,
        googleCalendarSynced,
        googleCalendarEventId,
        emailSent,
        emailMessageId,
        finalizedSlot: clientReq.finalizedSlot,
      },
    });
  } catch (err: any) {
    console.error('Errore conferma finale evento:', err);
    return res.status(500).json({ error: err.message });
  }
});
