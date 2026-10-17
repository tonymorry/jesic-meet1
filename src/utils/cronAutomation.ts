/**
 * JESic Meet - Automazione Background Cron Job (Node.js + node-cron)
 * Junior Enterprise Sicilia
 * 
 * Controlla ogni ora le scadenze dei sondaggi (pollDeadline).
 * Se mancano meno di 24 ore alla chiusura e un utente invitato
 * ha ancora stato "pending", invia un'email di sollecito personalizzata.
 */

export const CRON_AUTOMATION_NODEJS_CODE = `
import cron from 'node-cron';
import { Event, Response, User } from './models/schemas';
import nodemailer from 'nodemailer';

/**
 * Inizializza il cron job che gira ogni ora: '0 * * * *'
 * (o ogni 15 minuti: '*/15 * * * *')
 */
export function setupPollReminderCron() {
  console.log('[CRON] Inizializzazione cron job solleciti JESic Meet...');

  // Gira ogni ora al minuto 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // Calcola la finestra temporale: eventi che scadono tra 23 e 24 ore da adesso
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      console.log(\`[CRON \${now.toISOString()}] Controllo sondaggi in scadenza...\`);

      // 1. Trova eventi attivi in votazione la cui pollDeadline è entro le prossime 24h
      const expiringEvents = await Event.find({
        stato: 'voting',
        pollDeadline: {
          $gt: now,
          $lte: in24Hours,
        },
      }).populate('creatore', 'nome cognome email');

      for (const event of expiringEvents) {
        // 2. Trova le risposte ancora in stato 'pending' per cui non è già stato inviato il sollecito
        const pendingResponses = await Response.find({
          eventId: event._id,
          status: 'pending',
          reminderSent: false,
        }).populate('userId', 'nome cognome email ruolo');

        console.log(
          \`[CRON] Evento "\${event.titolo}": trovati \${pendingResponses.length} utenti in attesa di compilazione.\`
        );

        for (const resp of pendingResponses) {
          const user = resp.userId;
          if (!user || !user.email) continue;

          // 3. Invio email sollecito con Nodemailer
          await sendReminderEmail({
            to: user.email,
            userName: user.nome,
            eventTitle: event.titolo,
            creatorName: \`\${event.creatore.nome} \${event.creatore.cognome}\`,
            pollDeadline: event.pollDeadline,
            isMandatory: resp.isMandatory,
            pollUrl: \`https://meet.jesic.it/events/\${event._id}\`,
          });

          // 4. Marca come reminderSent per evitare spam
          resp.reminderSent = true;
          await resp.save();

          console.log(\`[CRON] Sollecito inviato con successo a \${user.email}\`);
        }
      }
    } catch (error) {
      console.error('[CRON ERROR] Errore durante esecuzione del cron job:', error);
    }
  });
}

/**
 * Template email brandizzato JESic per il promemoria
 */
async function sendReminderEmail({
  to,
  userName,
  eventTitle,
  creatorName,
  pollDeadline,
  isMandatory,
  pollUrl,
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

  const formattedDeadline = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Rome',
  }).format(new Date(pollDeadline));

  const mandatoryWarning = isMandatory
    ? \`<div style="background-color: #ffebee; border-left: 4px solid #f23e2e; padding: 12px; margin: 16px 0; border-radius: 4px; color: #c62828; font-weight: bold;">
         ⚠️ ATTENZIONE: La tua presenza è contrassegnata come ESSENZIALE per lo svolgimento di questa riunione.
       </div>\`
    : '';

  const html = \`
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f23e2e, #C62828); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; letter-spacing: -0.5px;">JESic Meet</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Junior Enterprise Sicilia</p>
      </div>
      <div style="padding: 24px; color: #1e1e1e; line-height: 1.5;">
        <h2 style="color: #111; margin-top: 0; font-size: 18px;">Ciao \${userName}, mancano meno di 24 ore! ⏰</h2>
        <p>Ti ricordiamo di inserire le tue disponibilità per il meeting organizzato da <strong>\${creatorName}</strong>:</p>
        <h3 style="color: #f23e2e; margin: 12px 0;">\${eventTitle}</h3>
        \${mandatoryWarning}
        <p><strong>Scadenza sondaggio:</strong> \${formattedDeadline}</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="\${pollUrl}" style="background-color: #f23e2e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Compila le tue disponibilità
          </a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">
          JESic Meet · Junior Enterprise Sicilia · Via Reclusorio del Lume, Catania
        </p>
      </div>
    </div>
  \`;

  await transporter.sendMail({
    from: '"JESic Meet" <promemoria@jesic.it>',
    to,
    subject: \`⏳ Mancano 24h: Esprimi le tue disponibilità per "\${eventTitle}"\`,
    html,
  });
}
`;
