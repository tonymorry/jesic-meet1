/**
 * JESic Meet - Template Email Transazionale per Clienti B2B
 * Stile formale, istituzionale e privo di emoji.
 * Inviata direttamente dall'indirizzo email dell'Admin Cliente.
 * 
 * Brand Identity JESic:
 * - Rosso Istituzionale: #f23e2e
 * - Grigio Antracite / Nero: #111827
 * - Bianco: #FFFFFF
 * - Sfondo: #F8F9FA
 */

export interface EmailTemplateData {
  companyName: string;
  contactEmail: string;
  meetingTitle: string;
  description?: string;
  dateStr: string; // 'YYYY-MM-DD'
  formattedDate: string; // Es. 'Giovedì 16 Ottobre 2026'
  startTime: string; // '10:00'
  endTime: string; // '11:00'
  meetLink: string; // 'https://meet.google.com/abc-defg-hij'
  organizerName: string;
  organizerRole?: string;
  organizerEmail: string; // Email dell'Admin Cliente
}

/**
 * Genera il link per aggiungere l'evento a Google Calendar
 */
export function generateGoogleCalendarUrl(data: EmailTemplateData): string {
  const cleanDate = data.dateStr.replace(/-/g, '');
  const cleanStart = data.startTime.replace(':', '') + '00';
  const cleanEnd = data.endTime.replace(':', '') + '00';
  const dates = `${cleanDate}T${cleanStart}/${cleanDate}T${cleanEnd}`;

  const detailsText = [
    `Riunione confermata con Junior Enterprise Sicilia (JESic).`,
    `Referente JESic: ${data.organizerName} (${data.organizerEmail})`,
    `Collegamento Google Meet: ${data.meetLink}`,
    data.description ? `Oggetto: ${data.description}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[JESic] ${data.meetingTitle}`,
    dates,
    details: detailsText,
    location: data.meetLink,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera il contenuto iCalendar (.ics) per l'allegato
 */
export function generateIcsContent(data: EmailTemplateData): string {
  const cleanDate = data.dateStr.replace(/-/g, '');
  const cleanStart = data.startTime.replace(':', '') + '00';
  const cleanEnd = data.endTime.replace(':', '') + '00';
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `jesic-${Date.now()}@jesic.it`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Junior Enterprise Sicilia//JESic Meet//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${cleanDate}T${cleanStart}`,
    `DTEND:${cleanDate}T${cleanEnd}`,
    `SUMMARY:[JESic] ${data.meetingTitle}`,
    `DESCRIPTION:Riunione concordata con Junior Enterprise Sicilia.\\nReferente: ${data.organizerName} (${data.organizerEmail})\\nCollegamento: ${data.meetLink}`,
    `ORGANIZER;CN="${data.organizerName}":MAILTO:${data.organizerEmail}`,
    `LOCATION:${data.meetLink}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Genera il template HTML istituzionale e formale (senza emoji) per la conferma al cliente.
 */
export function generateClientConfirmationEmailHtml(data: EmailTemplateData): string {
  const googleCalLink = generateGoogleCalendarUrl(data);
  const organizer = data.organizerName || 'Team Junior Enterprise Sicilia';
  const role = data.organizerRole || 'Admin Clienti';
  const adminEmail = data.organizerEmail;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Appuntamento - Junior Enterprise Sicilia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F8F9FA; color: #1F2937; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F9FA; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Contenitore Principale -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Testata Istituzionale -->
          <tr>
            <td style="background-color: #111827; border-top: 5px solid #f23e2e; padding: 24px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 19px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.3px;">
                      JESic <span style="color: #f23e2e;">Meet</span>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px;">
                      Junior Enterprise Sicilia &bull; Consulenza d'Impresa
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #1F2937; color: #D1D5DB; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 6px; border: 1px solid #374151;">
                      Conferma Incontro
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo Lettera -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f23e2e; margin-bottom: 8px;">
                Comunicazione Ufficiale
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 21px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">
                Conferma appuntamento: ${data.meetingTitle}
              </h1>

              <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
                Gentile <strong>${data.companyName}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; color: #4B5563; text-align: justify;">
                con la presente confermiamo la data e l'orario definitivo per la riunione con il nostro team, concordati sulla base delle preferenze di disponibilità da Lei indicate.
              </p>

              <!-- Riepilogo Dati Appuntamento -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">
                      Riepilogo della Riunione
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px; color: #374151;">
                      <tr>
                        <td style="padding: 6px 0; width: 140px; color: #6B7280; font-weight: 500;">Data:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #111827;">${data.formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Orario:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #111827;">dalle ore ${data.startTime} alle ore ${data.endTime} (CET)</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Modalità:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #111827;">Videoconferenza Google Meet</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Referente JESic:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #111827;">${organizer} (${adminEmail})</td>
                      </tr>
                      ${
                        data.description
                          ? `<tr>
                        <td style="padding: 8px 0 0 0; color: #6B7280; font-weight: 500; vertical-align: top;">Oggetto richiesta:</td>
                        <td style="padding: 8px 0 0 0; color: #4B5563; font-style: italic;">"${data.description}"</td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Pulsante Ingresso Google Meet -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.meetLink}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #f23e2e; color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; padding: 14px 24px; border-radius: 8px; letter-spacing: 0.2px;">
                      Partecipa alla riunione Google Meet
                    </a>
                    <div style="font-size: 11px; color: #6B7280; margin-top: 8px; font-family: monospace;">
                      Collegamento diretto: <a href="${data.meetLink}" target="_blank" style="color: #f23e2e; text-decoration: underline;">${data.meetLink}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Aggiungi al Calendario -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #F3F4F6; padding-top: 18px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <span style="font-size: 12px; color: #6B7280; margin-right: 8px;">Promemoria calendario:</span>
                    <a href="${googleCalLink}" target="_blank" style="display: inline-block; background-color: #FFFFFF; color: #374151; border: 1px solid #D1D5DB; font-size: 12px; font-weight: 600; text-decoration: none; padding: 7px 14px; border-radius: 6px;">
                      Aggiungi a Google Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Firma Formale -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 13px; color: #374151;">
                <p style="margin: 0 0 4px 0;">Cordiali saluti,</p>
                <p style="margin: 0 0 2px 0; font-weight: 700; color: #111827;">${organizer}</p>
                <p style="margin: 0 0 2px 0; color: #4B5563;">${role}</p>
                <p style="margin: 0 0 2px 0; color: #6B7280;">Junior Enterprise Sicilia</p>
                <p style="margin: 4px 0 0 0; color: #f23e2e; font-size: 12px;">
                  Email: <a href="mailto:${adminEmail}" style="color: #f23e2e; text-decoration: underline;">${adminEmail}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Istituzionale -->
          <tr>
            <td style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 20px 36px; text-align: center; color: #6B7280; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">
                Junior Enterprise Sicilia (JESic) &bull; Confederazione Nazionale Junior Enterprises
              </p>
              <p style="margin: 0;">
                Messaggio inviato da ${adminEmail} per la conferma dell'incontro. In caso di necessità o per richiedere una variazione, La invitiamo a rispondere direttamente a questa email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dati per l'email di notifica immediata di ricezione richiesta al cliente
 */
export interface ClientRequestReceivedEmailData {
  companyName: string;
  contactEmail: string;
  description: string;
  slots: { date: string; startTime: string; endTime: string }[];
  adminEmail?: string;
  adminName?: string;
}

/**
 * Genera il template HTML formale e istituzionale (privo di emoji)
 * inviato al cliente subito dopo la compilazione del form /prenota-call,
 * per confermare la corretta ricezione e comunicare che riceverà a breve la conferma definitiva.
 */
export function generateClientRequestReceivedEmailHtml(data: ClientRequestReceivedEmailData): string {
  const adminEmail = data.adminEmail || 'antoniomorry26@gmail.com';
  const adminName = data.adminName || 'Admin Clienti JESic';

  const slotsListHtml = data.slots
    .map((s) => {
      const [y, m, d] = s.date.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const formatted = !isNaN(dateObj.getTime())
        ? new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj)
        : s.date;
      return `<li style="margin-bottom: 6px; color: #1F2937;"><strong>${formatted}</strong>: dalle ore ${s.startTime} alle ${s.endTime}</li>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ricezione Richiesta di Incontro - Junior Enterprise Sicilia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F8F9FA; color: #1F2937; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F9FA; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Contenitore Principale -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Testata Istituzionale -->
          <tr>
            <td style="background-color: #111827; border-top: 5px solid #f23e2e; padding: 24px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 19px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.3px;">
                      JESic <span style="color: #f23e2e;">Meet</span>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px;">
                      Junior Enterprise Sicilia &bull; Consulenza d'Impresa
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #1F2937; color: #D1D5DB; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 6px; border: 1px solid #374151;">
                      Presa in Carico
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo Lettera -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f23e2e; margin-bottom: 8px;">
                Notifica di Ricezione
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 21px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">
                Abbiamo ricevuto la tua richiesta di appuntamento
              </h1>

              <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
                Gentile <strong>${data.companyName}</strong>,
              </p>

              <p style="margin: 0 0 16px 0; font-size: 14px; color: #4B5563; text-align: justify;">
                La ringraziamo per aver contattato Junior Enterprise Sicilia. Le confermiamo che la Sua richiesta di incontro è stata registrata correttamente nel nostro sistema con le preferenze di disponibilità indicate.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; color: #4B5563; text-align: justify;">
                Il nostro team interno sta verificando le disponibilità dei consulenti incaricati. <strong>Riceverà a breve un'ulteriore email con la conferma dell'orario definitivo e il collegamento Google Meet per la videocall.</strong>
              </p>

              <!-- Riepilogo Preferenze Indicate -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">
                      Riepilogo delle preferenze indicate
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px; color: #374151;">
                      <tr>
                        <td style="padding: 6px 0; width: 140px; color: #6B7280; font-weight: 500;">Azienda / Referente:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #111827;">${data.companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Email di contatto:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #111827;">${data.contactEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6B7280; font-weight: 500; vertical-align: top;">Oggetto richiesta:</td>
                        <td style="padding: 6px 0; color: #4B5563; font-style: italic;">"${data.description}"</td>
                      </tr>
                    </table>

                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
                      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B7280; margin-bottom: 6px;">
                        Fasce orarie opzionate:
                      </div>
                      <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                        ${slotsListHtml}
                      </ul>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Firma Formale -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 13px; color: #374151;">
                <p style="margin: 0 0 4px 0;">Cordiali saluti,</p>
                <p style="margin: 0 0 2px 0; font-weight: 700; color: #111827;">${adminName}</p>
                <p style="margin: 0 0 2px 0; color: #4B5563;">Area Relazioni Esterne & B2B</p>
                <p style="margin: 0 0 2px 0; color: #6B7280;">Junior Enterprise Sicilia</p>
                <p style="margin: 4px 0 0 0; color: #f23e2e; font-size: 12px;">
                  Email: <a href="mailto:${adminEmail}" style="color: #f23e2e; text-decoration: underline;">${adminEmail}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Istituzionale -->
          <tr>
            <td style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 20px 36px; text-align: center; color: #6B7280; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">
                Junior Enterprise Sicilia (JESic) &bull; Confederazione Nazionale Junior Enterprises
              </p>
              <p style="margin: 0;">
                Messaggio automatico inviato a ${data.contactEmail} per attestare la ricezione della richiesta. Riceverà a breve la conferma con i dettagli operativi dell'incontro.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

