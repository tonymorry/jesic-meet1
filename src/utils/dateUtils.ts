/**
 * JESic Meet - Utility Date ed Eventi
 * Gestione dello stato di scadenza / eventi passati
 */

import { MeetingEvent } from '../types';

/**
 * Verifica se un evento (sondaggio When2meet o evento associativo ufficiale)
 * è già passato rispetto alla data e ora corrente.
 *
 * Regole:
 * 1. Se l'evento ha una data definitiva (finalizedSlot):
 *    - Controlla la data e l'orario di fine (es. "18:00").
 *    - Se l'orario di fine è passato (o se la data è precedente a oggi), l'evento è passato.
 * 2. Se l'evento è un sondaggio aperto con multiple date:
 *    - Controlla l'ultima data proposta nell'array `dates` e l'orario `endHour`.
 *    - Se tale data e ora sono trascorse, il sondaggio è passato.
 */
export const isEventPassed = (event: MeetingEvent): boolean => {
  const now = new Date();

  // Caso 1: Evento con slot definitivo (Eventi associativi o Sondaggi confermati)
  if (event.finalizedSlot?.date) {
    const rawEndTime = event.finalizedSlot.endTime || '23:59';
    const timeFormatted = rawEndTime.length === 5 ? `${rawEndTime}:00` : rawEndTime;
    const endDateTime = new Date(`${event.finalizedSlot.date}T${timeFormatted}`);

    if (!isNaN(endDateTime.getTime())) {
      return endDateTime < now;
    }

    // Fallback confronto per giorno 'YYYY-MM-DD'
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return event.finalizedSlot.date < todayStr;
  }

  // Caso 2: Evento o sondaggio con array di date
  if (event.dates && event.dates.length > 0) {
    const sortedDates = [...event.dates].sort();
    const latestDate = sortedDates[sortedDates.length - 1];
    const hour = event.endHour !== undefined ? event.endHour : 23;
    const hourStr = String(hour).padStart(2, '0');
    const endDateTime = new Date(`${latestDate}T${hourStr}:00:00`);

    if (!isNaN(endDateTime.getTime())) {
      return endDateTime < now;
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return latestDate < todayStr;
  }

  return false;
};

/**
 * Formatta una data YYYY-MM-DD in forma breve leggibile (es. "Lun 13 Ott")
 */
export const formatDateShort = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const weekday = new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(d);
    const monthStr = new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(d);
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${monthStr}`;
  } catch {
    return dateStr;
  }
};

/**
 * Converte una data 'YYYY-MM-DD' e un'ora 'HH:mm' nella stringa RFC3339 corretta
 * con l'offset per il fuso orario 'Europe/Rome' (es. +01:00 d'inverno, +02:00 in estate/ora legale).
 * Previene che Google Calendar interpreti l'orario come UTC e lo sposti avanti di 1 o 2 ore.
 */
export const formatRomeDateTimeRFC3339 = (dateStr: string, timeStr: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.trim().split('T')[0];
  const timeParts = (timeStr || '09:00').trim().split(':');
  const h = (timeParts[0] || '09').padStart(2, '0');
  const m = (timeParts[1] || '00').padStart(2, '0');
  const s = (timeParts[2] || '00').padStart(2, '0');
  const cleanTime = `${h}:${m}:${s}`;

  try {
    const refDate = new Date(`${cleanDate}T12:00:00Z`);
    const dtf = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome',
      timeZoneName: 'longOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tzPart = dtf.formatToParts(refDate).find((p) => p.type === 'timeZoneName')?.value;
    const offset = tzPart ? tzPart.replace('GMT', '') : '+01:00';
    return `${cleanDate}T${cleanTime}${offset}`;
  } catch {
    return `${cleanDate}T${cleanTime}+01:00`;
  }
};

