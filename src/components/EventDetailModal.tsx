/**
 * JESic Meet - Dettaglio Evento & Sondaggio Disponibilità
 * Junior Enterprise Sicilia
 * 
 * Flusso ordinato e ottimizzato:
 * 1. Tabella degli orari (AvailabilityGrid When2meet style)
 * 2. Sotto la tabella: Box con i presenti/assenti in base all'orario selezionato con il cursore
 * 3. Box Creatore per scelta giorno/orario: interamente modificabile e a piena discrezione del creatore,
 *    con nello stesso riquadro i Top 3 slot consigliati in piccolo.
 * 4. Elenco Partecipanti con aggiunta/rimozione e solleciti.
 */

import React, { useState } from 'react';
import { MeetingEvent, User, EventResponse, SlotAnalysis, InviteeConfig } from '../types';
import { AvailabilityGrid } from './AvailabilityGrid';
import { UserAvatar } from './UserAvatar';
import { calculateBestMeetingSlots } from '../utils/matchingAlgorithm';
import { generateGoogleCalendarWebUrl, downloadIcsFile } from '../utils/googleCalendar';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  CheckCircle2,
  BellRing,
  ExternalLink,
  Download,
  AlertTriangle,
  Star,
  Check,
  UserPlus,
  Trash2,
  Search,
  Sparkles,
  ChevronRight,
  Edit3,
} from 'lucide-react';

interface EventDetailModalProps {
  event: MeetingEvent;
  currentUser: User;
  allUsers: User[];
  allResponses: EventResponse[];
  onClose: () => void;
  onSaveAvailability: (eventId: string, slots: string[]) => void;
  onConfirmMeetingSlot: (eventId: string, slot: { date: string; startTime: string; endTime: string }) => void;
  onTriggerReminders: (eventId: string) => void;
  onUpdateEventInvitees: (
    eventId: string,
    updatedInvitees: InviteeConfig[],
    newUsersToRegister?: User[]
  ) => void;
  onEditPoll?: (event: MeetingEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  currentUser,
  allUsers,
  allResponses,
  onClose,
  onSaveAvailability,
  onConfirmMeetingSlot,
  onTriggerReminders,
  onUpdateEventInvitees,
  onEditPoll,
}) => {
  const isCreator = event.creatorId === currentUser.id;
  const creatorUser = allUsers.find((u) => u.id === event.creatorId) || currentUser;

  // Risposta attuale dell'utente corrente
  const myResponse = allResponses.find(
    (r) => r.eventId === event.id && r.userId === currentUser.id
  );

  const [myDraftSlots, setMyDraftSlots] = useState<string[]>(
    myResponse?.availability || []
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Calcolo analisi di matching per l'evento
  const eventResponses = allResponses.filter((r) => r.eventId === event.id);
  const { top3, allRankedSlots } = calculateBestMeetingSlots(
    event,
    eventResponses,
    allUsers
  );

  // Modalità visualizzazione griglia ('group' o 'individual')
  const [gridMode, setGridMode] = useState<'group' | 'individual'>('group');

  // Slot attivo selezionato con cursore o click
  const defaultSlotKey = top3.length > 0 ? top3[0].slotKey : (allRankedSlots[0]?.slotKey || null);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(defaultSlotKey);

  // Mappa di analisi slot
  const slotAnalysisMap = new Map<string, SlotAnalysis>(
    allRankedSlots.map((s) => [s.slotKey, s])
  );

  // Dettagli slot attualmente selezionato
  const activeSlotDetails = activeSlotKey ? slotAnalysisMap.get(activeSlotKey) : (allRankedSlots[0] || null);

  // Opzioni orari possibili tra ora inizio e fine
  const step = event.slotIntervalMinutes || 60;
  const possibleStartTimes: string[] = [];
  const possibleEndTimes: string[] = [];

  for (let h = event.startHour; h < event.endHour; h++) {
    const minutes = step === 30 ? [0, 30] : [0];
    for (const m of minutes) {
      possibleStartTimes.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  for (let h = event.startHour; h <= event.endHour; h++) {
    const minutes = step === 30 ? [0, 30] : [0];
    for (const m of minutes) {
      if (h === event.startHour && m === 0) continue;
      possibleEndTimes.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  // STATO PER SCELTA DATA E ORA CREATORE (Piena discrezione + sincronizzato con slot o top 3)
  const [selectedFinalDate, setSelectedFinalDate] = useState<string>(
    top3.length > 0 ? top3[0].date : (event.dates[0] || '')
  );
  const [selectedFinalStartTime, setSelectedFinalStartTime] = useState<string>(
    top3.length > 0 ? top3[0].startTime : (possibleStartTimes[0] || '09:00')
  );
  const [selectedFinalEndTime, setSelectedFinalEndTime] = useState<string>(
    top3.length > 0 ? top3[0].endTime : (possibleEndTimes[0] || '10:00')
  );

  // STATO PER AGGIUNGERE NUOVI PARTECIPANTI DOPO LA CREAZIONE
  const [showAddAttendeeSection, setShowAddAttendeeSection] = useState(false);
  const [attendeeFilterQuery, setAttendeeFilterQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [newAttendeeIsMandatory, setNewAttendeeIsMandatory] = useState(false);

  // Formatta data per leggibilità (es. "Ven 17 Ott")
  const formatDateHuman = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d);
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  };

  const handleUpdateSlots = (newSlots: string[]) => {
    setMyDraftSlots(newSlots);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveAvailability(event.id, myDraftSlots);
    setHasChanges(false);
    setNotificationMsg('Disponibilità salvate con successo!');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Selezione slot dalla griglia o dai consigliati
  const handleSelectSlot = (slotKey: string) => {
    setActiveSlotKey(slotKey);
    const analysis = slotAnalysisMap.get(slotKey);
    if (analysis && isCreator) {
      setSelectedFinalDate(analysis.date);
      setSelectedFinalStartTime(analysis.startTime);
      setSelectedFinalEndTime(analysis.endTime);
    }
  };

  // Modifica ora inizio nel form creatore
  const handleStartTimeChange = (newStartTime: string) => {
    setSelectedFinalStartTime(newStartTime);
    // Se l'ora di fine è precedente o uguale alla nuova ora inizio, imposta la successiva
    if (selectedFinalEndTime <= newStartTime) {
      const laterTimes = possibleEndTimes.filter((t) => t > newStartTime);
      if (laterTimes.length > 0) {
        setSelectedFinalEndTime(laterTimes[0]);
      }
    }
    setActiveSlotKey(`${selectedFinalDate}T${newStartTime}`);
  };

  // Esecuzione conferma data & ora (anche con assenze di essenziali)
  const handleExecuteConfirmation = () => {
    if (!selectedFinalDate || !selectedFinalStartTime || !selectedFinalEndTime) return;
    const slot = {
      date: selectedFinalDate,
      startTime: selectedFinalStartTime,
      endTime: selectedFinalEndTime,
    };
    onConfirmMeetingSlot(event.id, slot);
    setNotificationMsg(`Meeting confermato per il ${slot.date} (${slot.startTime} - ${slot.endTime})!`);
  };

  const handleTriggerSimulatedReminders = () => {
    onTriggerReminders(event.id);
    setNotificationMsg('Promemoria email inviati agli invitati in attesa!');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // GESTIONE PARTECIPANTI: AGGIUNTA
  const handleAddExistingUser = (user: User) => {
    if (event.invitees.some((i) => i.userId === user.id)) return;

    const updated = [
      ...event.invitees,
      { userId: user.id, isMandatory: newAttendeeIsMandatory },
    ];
    onUpdateEventInvitees(event.id, updated);
    setNotificationMsg(`${user.name} ${user.surname} aggiunto all'evento!`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleAddManualPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const parts = manualName.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'JESic';
    const emailVal =
      manualEmail.trim() ||
      `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@jesic.it`;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: firstName,
      surname: lastName,
      email: emailVal,
      role: 'user',
      jesicRole: 'Consulente Junior',
      googleCalendarConnected: false,
    };

    const updated = [
      ...event.invitees,
      { userId: newUser.id, isMandatory: newAttendeeIsMandatory },
    ];

    onUpdateEventInvitees(event.id, updated, [newUser]);
    setManualName('');
    setManualEmail('');
    setShowAddAttendeeSection(false);
    setNotificationMsg(`${newUser.name} ${newUser.surname} invitato con successo!`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // GESTIONE PARTECIPANTI: RIMOZIONE
  const handleRemoveAttendee = (userId: string) => {
    if (userId === event.creatorId) return;
    const updated = event.invitees.filter((i) => i.userId !== userId);
    onUpdateEventInvitees(event.id, updated);
    setNotificationMsg('Partecipante rimosso dall\'evento.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Invitati e loro ruoli
  const inviteesWithDetails = event.invitees.map((inv) => {
    const user = allUsers.find((u) => u.id === inv.userId);
    const resp = eventResponses.find((r) => r.userId === inv.userId);
    return {
      user,
      isMandatory: inv.isMandatory,
      status: resp?.status || 'pending',
    };
  });

  const mandatoryPendingCount = inviteesWithDetails.filter(
    (i) => i.isMandatory && i.status === 'pending'
  ).length;

  // Utenti disponibili sulla piattaforma che non sono ancora invitati
  const invitedIds = new Set(event.invitees.map((i) => i.userId));
  const availableUsersToInvite = allUsers.filter(
    (u) =>
      !invitedIds.has(u.id) &&
      `${u.name} ${u.surname} ${u.role} ${u.email}`
        .toLowerCase()
        .includes(attendeeFilterQuery.toLowerCase())
  );

  // Controllo dello slot scelto nel form per la decisione finale
  const currentFormSlotKey = `${selectedFinalDate}T${selectedFinalStartTime}`;
  const formSlotAnalysis = slotAnalysisMap.get(currentFormSlotKey);
  const formMissingMandatory = formSlotAnalysis?.missingMandatoryUsers || [];
  const isAnyMandatoryMissingInForm = formMissingMandatory.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        
        {/* Header Modale */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-800/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  event.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : event.status === 'ready'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}
              >
                {event.status === 'confirmed'
                  ? 'Confermato'
                  : event.status === 'ready'
                  ? 'Pronto per la scelta'
                  : 'In votazione'}
              </span>

              {event.type === 'online' ? (
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
                  <Video className="w-3.5 h-3.5 text-neutral-400" />
                  Google Meet
                </span>
              ) : (
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  In presenza
                </span>
              )}
            </div>

            <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white leading-snug">
              {event.title}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <UserAvatar user={creatorUser} size="xs" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Organizzato da <strong className="text-neutral-800 dark:text-neutral-200">{creatorUser.name} {creatorUser.surname}</strong>{creatorUser.role ? ` (${creatorUser.role})` : ''}
                {isCreator && ' · Tu sei l\'organizzatore'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCreator && onEditPoll && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditPoll(event);
                }}
                className="py-1.5 px-3 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Modifica impostazioni sondaggio, orari o invitati"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span className="hidden sm:inline">Modifica Sondaggio</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Notifica interna */}
        {notificationMsg && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between animate-in fade-in">
            <span className="font-medium">{notificationMsg}</span>
            <button onClick={() => setNotificationMsg(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Corpo scrollabile */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* Se l'evento è già confermato: Banner data definitiva + Calendar Links */}
          {event.status === 'confirmed' && event.finalizedSlot && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Meeting Confermato Definitivamente</span>
              </div>
              <div className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                  📅 {event.finalizedSlot.date} · {event.finalizedSlot.startTime} - {event.finalizedSlot.endTime}
                </p>
                {event.type === 'online' && event.meetLink ? (
                  <p className="flex items-center gap-1.5 pt-1">
                    <Video className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Link Meet:</span>
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      {event.meetLink}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 pt-1 text-neutral-700 dark:text-neutral-300">
                    <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Luogo: {event.location || 'Sede JESic'}</span>
                  </p>
                )}
              </div>

              {/* Bottoni Calendario */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800">
                <a
                  href={generateGoogleCalendarWebUrl(
                    event,
                    event.finalizedSlot.date,
                    event.finalizedSlot.startTime,
                    event.finalizedSlot.endTime,
                    inviteesWithDetails.map((i) => i.user?.email || '').filter(Boolean)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/30"
                >
                  <Calendar className="w-4 h-4" />
                  Aggiungi a Google Calendar
                </a>

                <button
                  type="button"
                  onClick={() =>
                    downloadIcsFile(
                      event,
                      event.finalizedSlot!.date,
                      event.finalizedSlot!.startTime,
                      event.finalizedSlot!.endTime,
                      creatorUser,
                      inviteesWithDetails.map((i) => i.user!).filter(Boolean)
                    )
                  }
                  className="py-2 px-3 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Scarica .ICS
                </button>
              </div>
            </div>
          )}

          {/* Descrizione evento */}
          {event.description && (
            <div className="bg-neutral-50 dark:bg-neutral-800/70 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {event.description}
            </div>
          )}

          {/* =========================================================================
              1. TABELLA DEGLI ORARI (In cima come richiesto)
             ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-600" />
                <span>Tabella degli Orari</span>
              </h3>
              {hasChanges && (
                <span className="text-[11px] font-semibold text-amber-600 animate-pulse">
                  Modifiche non salvate
                </span>
              )}
            </div>

            <AvailabilityGrid
              event={event}
              currentUser={currentUser}
              mySelectedSlots={myDraftSlots}
              onChangeMySlots={handleUpdateSlots}
              allRankedSlots={allRankedSlots}
              isCreator={isCreator}
              viewMode={gridMode}
              onChangeViewMode={setGridMode}
              activeSlotKey={activeSlotKey}
              onSelectSlotKey={handleSelectSlot}
            />
          </div>

          {/* =========================================================================
              2. SOTTO LA TABELLA: PRESENZE IN BASE AL GIORNO SELEZIONATO CON IL CURSORE
             ========================================================================= */}
          {gridMode === 'group' && activeSlotDetails && (() => {
            const totalInviteesCount = event.invitees.length;
            const availableCount = activeSlotDetails.availableUsers.length;
            const percentage = totalInviteesCount > 0 ? Math.round((availableCount / totalInviteesCount) * 100) : 0;

            const availableUserIds = new Set(activeSlotDetails.availableUsers.map((u) => u.id));
            const unavailableUsers = event.invitees
              .map((inv) => allUsers.find((u) => u.id === inv.userId) || {
                id: inv.userId,
                name: 'Partecipante',
                surname: '',
                email: '',
                role: '',
                googleCalendarConnected: false,
              })
              .filter((u) => !availableUserIds.has(u.id));

            return (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3 animate-in fade-in duration-150">
                {/* Intestazione: Data, Ora, Conteggio e Percentuale calcolata sul totale invitati */}
                <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 dark:border-neutral-800 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse shrink-0"></span>
                    <span className="font-extrabold text-xs text-neutral-900 dark:text-white capitalize">
                      {formatDateHuman(activeSlotDetails.date)} · {activeSlotDetails.startTime} - {activeSlotDetails.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Presenti: <strong className="text-neutral-900 dark:text-white text-xs">{availableCount}</strong> su {totalInviteesCount}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Barra visiva di percentuale sul totale degli invitati */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 dark:bg-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* 1. Chi ha votato (Disponibili per questa data e ora) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                      <span>Hanno votato ({availableCount})</span>
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {percentage}% degli invitati
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {activeSlotDetails.availableUsers.length > 0 ? (
                      activeSlotDetails.availableUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[11px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 pl-1 pr-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <UserAvatar user={u} size="2xs" />
                          <span>{u.name} {u.surname}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
                        Nessun partecipante ha votato per questo orario
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Chi non ha votato (Non disponibili o non presenti in questa data e ora) */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5px]" />
                      <span>Non hanno votato ({unavailableUsers.length})</span>
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {totalInviteesCount > 0 ? Math.round((unavailableUsers.length / totalInviteesCount) * 100) : 0}% degli invitati
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {unavailableUsers.length > 0 ? (
                      unavailableUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700 pl-1 pr-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 shadow-2xs"
                          title="Non disponibile o non ha votato per questo orario"
                        >
                          <UserAvatar user={u} size="2xs" />
                          <span>{u.name} {u.surname}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tutti gli invitati hanno votato a favore di questo orario!
                      </span>
                    )}
                  </div>
                </div>

                {/* Pulsante rapido per l'organizzatore */}
                {isCreator && event.status !== 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFinalDate(activeSlotDetails.date);
                      setSelectedFinalStartTime(activeSlotDetails.startTime);
                      setSelectedFinalEndTime(activeSlotDetails.endTime);
                    }}
                    className="w-full mt-1.5 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Imposta questo orario nel modulo di conferma sottostante ↓</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Azione di salvataggio per la disponibilità individuale (Nascosto in visualizzazione gruppo come richiesto) */}
          {event.status !== 'confirmed' && gridMode === 'individual' && (
            <div className="bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl p-3 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 animate-in fade-in">
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  {myResponse?.status === 'submitted'
                    ? 'Le tue disponibilità sono salvate'
                    : 'Non hai ancora espresso le tue disponibilità'}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Slot selezionati: {myDraftSlots.length}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges && myResponse?.status === 'submitted'}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  hasChanges
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 active:scale-95'
                    : myResponse?.status === 'submitted'
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Salva Disponibilità
              </button>
            </div>
          )}

          {/* =========================================================================
              3. RIQUADRO SCELTA GIORNO CREATORE CON I TOP 3 CONSIGLIATI IN PICCOLO
                 (Riquadro BIANCO / SCURO in dark mode, interamente modificabile e a piena discrezione del creatore)
             ========================================================================= */}
          {isCreator && event.status !== 'confirmed' && (
            <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-2xl p-4 shadow-sm border border-neutral-200/90 dark:border-neutral-800 space-y-3.5 animate-in fade-in">
              {/* Header Box Creatore */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 fill-red-600/20" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-neutral-900 dark:text-white leading-tight">
                      Scelta Giorno & Conferma Meeting
                    </h3>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Piena discrezione del creatore (conferma anche se un essenziale è assente)
                    </p>
                  </div>
                </div>
              </div>

              {/* I TOP 3 SLOT CONSIGLIATI (In piccolo, nello stesso riquadro come richiesto) */}
              {top3.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <span>Top 3 Slot Consigliati (Tocca per compilare):</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {top3.map((slot, index) => {
                      const isSelected =
                        selectedFinalDate === slot.date &&
                        selectedFinalStartTime === slot.startTime;
                      const totalInvitees = event.invitees.length;
                      const slotPercentage =
                        totalInvitees > 0
                          ? Math.round((slot.availableUsers.length / totalInvitees) * 100)
                          : 0;

                      return (
                        <button
                          key={slot.slotKey}
                          type="button"
                          onClick={() => {
                            setSelectedFinalDate(slot.date);
                            setSelectedFinalStartTime(slot.startTime);
                            setSelectedFinalEndTime(slot.endTime);
                            setActiveSlotKey(slot.slotKey);
                          }}
                          className={`p-2.5 sm:p-3 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-50/80 dark:bg-red-950/60 border-red-500 ring-2 ring-red-500/20 text-neutral-900 dark:text-white shadow-xs'
                              : 'bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                              {index + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                              {slot.availableUsers.length}/{totalInvitees}
                            </span>
                          </div>
                          <div className="mt-2 font-black text-xs sm:text-sm leading-tight truncate text-neutral-900 dark:text-white">
                            {formatDateShort(slot.date)}
                          </div>
                          <div className="text-xs font-mono text-red-600 dark:text-red-400 font-bold mt-1">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <span
                            className={`text-[11px] sm:text-xs font-black mt-1.5 flex items-center gap-1 truncate ${
                              slotPercentage >= 75
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : slotPercentage >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3px] shrink-0" />
                            {slotPercentage}% presenti
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CAMPI INTERAMENTE MODIFICABILI A PIENA DISCREZIONE DEL CREATORE */}
              <div className="bg-neutral-50/90 dark:bg-neutral-800/90 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 space-y-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Orario Personalizzabile (Piena Discrezione):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Selezione Giorno */}
                  <div>
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold block mb-1">
                      Data:
                    </label>
                    <select
                      value={selectedFinalDate}
                      onChange={(e) => {
                        setSelectedFinalDate(e.target.value);
                        setActiveSlotKey(`${e.target.value}T${selectedFinalStartTime}`);
                      }}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs py-1.5 px-2 text-neutral-900 dark:text-white font-semibold shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                    >
                      {event.dates.map((d) => (
                        <option key={d} value={d} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                          {formatDateShort(d)} ({d})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selezione Ora Inizio */}
                  <div>
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold block mb-1">
                      Dalle:
                    </label>
                    <select
                      value={selectedFinalStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs py-1.5 px-2 text-neutral-900 dark:text-white font-semibold shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                    >
                      {possibleStartTimes.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selezione Ora Fine */}
                  <div>
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold block mb-1">
                      Alle:
                    </label>
                    <select
                      value={selectedFinalEndTime}
                      onChange={(e) => setSelectedFinalEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs py-1.5 px-2 text-neutral-900 dark:text-white font-semibold shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                    >
                      {possibleEndTimes
                        .filter((t) => t > selectedFinalStartTime)
                        .map((t) => (
                          <option key={t} value={t} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                            {t}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Riepilogo presenza & percentuale per l'orario scelto nel modulo */}
                {(() => {
                  const formAvailableCount = formSlotAnalysis?.availableUsers.length || 0;
                  const totalInviteesCount = event.invitees.length;
                  const formPercentage =
                    totalInviteesCount > 0
                      ? Math.round((formAvailableCount / totalInviteesCount) * 100)
                      : 0;
                  return (
                    <div className="p-2.5 bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/90 dark:border-neutral-700 rounded-lg text-[11px] text-neutral-800 dark:text-neutral-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                        <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                        <span>Presenti per questo orario:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {formAvailableCount} su {totalInviteesCount}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60">
                          {formPercentage}%
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Feedback presenza dello slot scelto */}
                {isAnyMandatoryMissingInForm ? (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Membri essenziali assenti in questo orario:</span>
                    </div>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                      {formMissingMandatory.map((u) => `${u.name} ${u.surname}`).join(', ')}
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      In qualità di organizzatore puoi comunque procedere e confermare questo orario a tua piena discrezione.
                    </p>
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Tutti i membri essenziali sono presenti per questo slot!</span>
                  </div>
                )}

                {/* Bottone di Conferma Definitiva */}
                <button
                  type="button"
                  onClick={handleExecuteConfirmation}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                    isAnyMandatoryMissingInForm
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>
                    Conferma Meeting ({formatDateShort(selectedFinalDate)} · {selectedFinalStartTime} - {selectedFinalEndTime})
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              4. SEZIONE PARTECIPANTI (Gestione e Invito)
             ========================================================================= */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Partecipanti ({inviteesWithDetails.length})
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Bottone per aggiungere altri partecipanti */}
                {isCreator && event.status !== 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => setShowAddAttendeeSection(!showAddAttendeeSection)}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 p-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{showAddAttendeeSection ? 'Chiudi' : '+ Invita Persone'}</span>
                  </button>
                )}

                {/* Bottone sollecito */}
                {isCreator && event.status !== 'confirmed' && (
                  <button
                    type="button"
                    onClick={handleTriggerSimulatedReminders}
                    className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 p-1"
                    title="Invia sollecito automatico agli invitati in attesa"
                  >
                    <BellRing className="w-3 h-3" />
                    <span>Solleciti ({mandatoryPendingCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* SEZIONE ESPANDIBILE PER AGGIUNGERE PERSONE DOPO LA CREAZIONE */}
            {isCreator && showAddAttendeeSection && event.status !== 'confirmed' && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Aggiungi Invitati all'evento
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Priorità:</span>
                    <button
                      type="button"
                      onClick={() => setNewAttendeeIsMandatory(!newAttendeeIsMandatory)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        newAttendeeIsMandatory
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${newAttendeeIsMandatory ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>{newAttendeeIsMandatory ? 'Essenziale' : 'Opzionale'}</span>
                    </button>
                  </div>
                </div>

                {/* Membri registrati disponibili */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Scegli tra i membri registrati non ancora invitati:
                  </p>

                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      value={attendeeFilterQuery}
                      onChange={(e) => setAttendeeFilterQuery(e.target.value)}
                      placeholder="Cerca per nome o ruolo..."
                      className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {availableUsersToInvite.length === 0 ? (
                      <p className="text-[11px] text-neutral-400 p-2 text-center">
                        Nessun altro membro registrato da invitare.
                      </p>
                    ) : (
                      availableUsersToInvite.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-1.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <UserAvatar user={user} size="xs" />
                            <div className="truncate">
                              <span className="font-bold text-neutral-900 dark:text-white truncate">
                                {user.name} {user.surname}
                              </span>
                              <span className="text-[10px] text-neutral-400 ml-1">
                                ({user.role})
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddExistingUser(user)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                          >
                            + Invita
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Inserimento per nome/email libera */}
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Oppure inserisci nome o email direttamente:
                  </p>
                  <form onSubmit={handleAddManualPerson} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nome e Cognome (es. Luca Rossi)"
                      className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Email (opzionale)"
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={!manualName.trim()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0"
                      >
                        + Aggiungi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* LISTA PARTECIPANTI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inviteesWithDetails.map(({ user, isMandatory, status }) => {
                if (!user) return null;
                const isSubmitted = status === 'submitted';
                const isEventCreator = user.id === event.creatorId;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <UserAvatar user={user} size="sm" />
                      <div className="truncate">
                        <div className="flex items-center gap-1 truncate">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {user.name} {user.surname}
                          </span>
                          {isMandatory && (
                            <span title="Membro Essenziale">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate block">
                          {user.role ? `${user.role} · ` : ''}{isMandatory ? 'Essenziale' : 'Opzionale'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSubmitted
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {isSubmitted ? 'Votato' : 'In attesa'}
                      </span>

                      {/* Tasto Rimuovi per il creatore */}
                      {isCreator && !isEventCreator && event.status !== 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(user.id)}
                          className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors"
                          title="Rimuovi questo partecipante dall'evento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
