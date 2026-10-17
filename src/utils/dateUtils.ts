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
