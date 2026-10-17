/**
 * JESic Meet - Algoritmo di Matching Intelligente
 * Junior Enterprise Sicilia
 * 
 * Logica di prioritizzazione:
 * 1. Priorità Assoluta: Massimizzare la presenza dei membri ESSENZIALI (isMandatory: true).
 * 2. Condizione Ottima: Slot in cui il 100% degli essenziali è disponibile.
 * 3. Fallback: Se nessuno slot ha il 100% degli essenziali, ordina per:
 *    a) Numero (o %) di Essenziali presenti (peso dominante: es. moltiplicatore 10.000)
 *    b) Numero di Opzionali presenti a parità di essenziali (peso secondario)
 * 4. Calcola e restituisce i Top 3 migliori slot orari con metadati completi.
 */

import { MeetingEvent, EventResponse, User, SlotAnalysis } from '../types';

/**
 * Genera tutti gli slot orari possibili per un evento in formato "YYYY-MM-DDTHH:mm"
 */
export function generateAllEventSlots(event: MeetingEvent): { slotKey: string; date: string; startTime: string; endTime: string }[] {
  const slots: { slotKey: string; date: string; startTime: string; endTime: string }[] = [];
  const step = event.slotIntervalMinutes || 60;

  // Determina le ore valide in base alla fascia oraria
  let hoursList: number[] = [];
  if (event.timeSlotBand === 'morning') {
    hoursList = [8, 9, 10, 11]; // Mattina: 8:00 - 12:00
  } else if (event.timeSlotBand === 'afternoon') {
    hoursList = [15, 16, 17, 18, 19]; // Pomeriggio: 15:00 - 20:00
  } else if (event.timeSlotBand === 'morning_afternoon') {
    hoursList = [8, 9, 10, 11, 15, 16, 17, 18, 19]; // Mattina e Pomeriggio (8-12 e 15-20)
  } else {
    for (let h = event.startHour; h < event.endHour; h++) {
      hoursList.push(h);
    }
  }

  for (const date of event.dates) {
    for (const hour of hoursList) {
      const minutesList = step === 30 ? [0, 30] : [0];

      for (const minute of minutesList) {
        const startHStr = String(hour).padStart(2, '0');
        const startMStr = String(minute).padStart(2, '0');
        const startTime = `${startHStr}:${startMStr}`;

        // Calcolo fine slot
        const endTotalMinutes = hour * 60 + minute + step;
        const endH = Math.floor(endTotalMinutes / 60);
        const endM = endTotalMinutes % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const slotKey = `${date}T${startTime}`;

        slots.push({
          slotKey,
          date,
          startTime,
          endTime,
        });
      }
    }
  }

  return slots;
}

/**
 * Calcola l'analisi completa di matching per ogni slot e restituisce la classifica ordinata.
 */
export function calculateBestMeetingSlots(
  event: MeetingEvent,
  responses: EventResponse[],
  users: User[]
): {
  top3: SlotAnalysis[];
  allRankedSlots: SlotAnalysis[];
  mandatoryTotalCount: number;
  optionalTotalCount: number;
} {
  const allSlots = generateAllEventSlots(event);
  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

  // Identifica quali partecipanti sono essenziali e quali opzionali
  const mandatoryUserIds = new Set<string>();
  const optionalUserIds = new Set<string>();

  for (const inv of event.invitees) {
    if (inv.isMandatory) {
      mandatoryUserIds.add(inv.userId);
    } else {
      optionalUserIds.add(inv.userId);
    }
  }

  const mandatoryTotalCount = mandatoryUserIds.size;
  const optionalTotalCount = optionalUserIds.size;

  // Mappa di disponibilità: slotKey -> Set<userId>
  const slotAvailabilityMap = new Map<string, Set<string>>();
  for (const slot of allSlots) {
    slotAvailabilityMap.set(slot.slotKey, new Set<string>());
  }

  for (const resp of responses) {
    if (resp.status === 'submitted' && resp.availability) {
      for (const slotKey of resp.availability) {
        const userSet = slotAvailabilityMap.get(slotKey);
        if (userSet) {
          userSet.add(resp.userId);
        }
      }
    }
  }

  // Valutazione e scoring di ogni slot
  const analyzedSlots: SlotAnalysis[] = allSlots.map((slot) => {
    const presentUserIds = slotAvailabilityMap.get(slot.slotKey) || new Set<string>();

    let mandatoryPresent = 0;
    let optionalPresent = 0;

    const availableUsers: User[] = [];
    const missingMandatoryUsers: User[] = [];
    const missingOptionalUsers: User[] = [];

    // Controllo Essenziali
    mandatoryUserIds.forEach((uId) => {
      const u = userMap.get(uId);
      if (presentUserIds.has(uId)) {
        mandatoryPresent++;
        if (u) availableUsers.push(u);
      } else {
        if (u) missingMandatoryUsers.push(u);
      }
    });

    // Controllo Opzionali
    optionalUserIds.forEach((uId) => {
      const u = userMap.get(uId);
      if (presentUserIds.has(uId)) {
        optionalPresent++;
        if (u) availableUsers.push(u);
      } else {
        if (u) missingOptionalUsers.push(u);
      }
    });

    const isAllMandatoryPresent =
      mandatoryTotalCount === 0 || mandatoryPresent === mandatoryTotalCount;

    /**
     * FORMULA DI SCORING JESic:
     * - Se tutti gli essenziali sono presenti: Bonus base enorme (1.000.000)
     * - Moltiplicatore essenziali: mandatoryPresent * 10.000
     * - Moltiplicatore opzionali: optionalPresent * 10
     * In questo modo 1 membro essenziale batte SEMPRE qualsiasi numero di opzionali!
     */
    const score =
      (isAllMandatoryPresent ? 1000000 : 0) +
      mandatoryPresent * 10000 +
      optionalPresent * 10;

    return {
      slotKey: slot.slotKey,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      mandatoryPresent,
      mandatoryTotal: mandatoryTotalCount,
      optionalPresent,
      optionalTotal: optionalTotalCount,
      isAllMandatoryPresent,
      score,
      availableUsers,
      missingMandatoryUsers,
      missingOptionalUsers,
    };
  });

  // Ordinamento decrescente: punteggio più alto in cima.
  // In caso di parità di punteggio, preferisci orari più vicini o mattutini.
  analyzedSlots.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // A parità di score, mantieni ordine cronologico naturale
    return a.slotKey.localeCompare(b.slotKey);
  });

  // Filtra slot con almeno 1 partecipante disponibile per i top 3
  const validSlotsWithAttendees = analyzedSlots.filter(
    (s) => s.mandatoryPresent > 0 || s.optionalPresent > 0
  );

  const top3 = (
    validSlotsWithAttendees.length > 0 ? validSlotsWithAttendees : analyzedSlots
  ).slice(0, 3);

  return {
    top3,
    allRankedSlots: analyzedSlots,
    mandatoryTotalCount,
    optionalTotalCount,
  };
}

/**
 * Codice sorgente dell'algoritmo pronto per backend Node.js
 */
export const NODEJS_ALGORITHM_SNIPPET = `
/**
 * BACKEND NODE.JS: Algoritmo di matching prioritario per JESic Meet
 * 
 * @param {Object} event - Modello Event con invitati (con flag isMandatory)
 * @param {Array} responses - Risposte inviate dai partecipanti
 * @returns {Array} I 3 migliori slot orari con dettagli di presenza
 */
function findBestMeetingSlots(event, responses) {
  const mandatoryUserIds = new Set(
    event.invitati.filter(i => i.isMandatory).map(i => i.userId.toString())
  );
  const optionalUserIds = new Set(
    event.invitati.filter(i => !i.isMandatory).map(i => i.userId.toString())
  );

  const totalMandatory = mandatoryUserIds.size;
  const totalOptional = optionalUserIds.size;

  // 1. Mappatura disponibilità per ogni slot
  const slotAttendance = {}; // { [slotKey]: Set of userIds }
  
  for (const resp of responses) {
    if (resp.status !== 'submitted') continue;
    const uId = resp.userId.toString();
    for (const slotKey of resp.disponibilita) {
      if (!slotAttendance[slotKey]) slotAttendance[slotKey] = new Set();
      slotAttendance[slotKey].add(uId);
    }
  }

  // 2. Calcolo punteggio per ciascuno slot registrato
  const rankedSlots = Object.keys(slotAttendance).map(slotKey => {
    const attendees = slotAttendance[slotKey];
    let mandatoryCount = 0;
    let optionalCount = 0;

    for (const uId of attendees) {
      if (mandatoryUserIds.has(uId)) mandatoryCount++;
      if (optionalUserIds.has(uId)) optionalCount++;
    }

    const allMandatoryAvailable = (totalMandatory === 0) || (mandatoryCount === totalMandatory);

    // Score con dominanza assoluta dei partecipanti ESSENZIALI
    const score = (allMandatoryAvailable ? 1000000 : 0) + (mandatoryCount * 10000) + (optionalCount * 10);

    return {
      slotKey,
      mandatoryPresent: mandatoryCount,
      mandatoryTotal: totalMandatory,
      optionalPresent: optionalCount,
      optionalTotal: totalOptional,
      allMandatoryAvailable,
      totalAttendees: attendees.size,
      score
    };
  });

  // 3. Ordinamento decrescente
  rankedSlots.sort((a, b) => b.score - a.score);

  // 4. Ritorna i primi 3
  return rankedSlots.slice(0, 3);
}
`;
