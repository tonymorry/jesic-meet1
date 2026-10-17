/**
 * JESic Meet - Bacheca Eventi Associativi (Feed Inviti Ufficiali)
 * 
 * Specifiche da implementare:
 * - Lista a feed degli "Eventi Associativi" a cui l'utente è stato invitato ma a cui NON ha ancora risposto
 * - Ogni card mostra Titolo, Data, Ora e Descrizione espandibile
 * - Bottoni: "Partecipa" e "Non Partecipo"
 * - Azione "Partecipa":
 *   1. Sposta l'evento nella pagina "Calendario" interna dell'app (status: 'accepted')
 *   2. Inserisce l'evento nel Google Calendar personale dell'utente (Approccio Libertà Totale, nessun blocco di disponibilità)
 * - Include anche una vista secondaria per rivedere gli eventi a cui si è già data risposta
 */

import React, { useState } from 'react';
import { MeetingEvent, User } from '../types';
import { isEventPassed } from '../utils/dateUtils';
import { UserAvatar } from './UserAvatar';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Users,
  CheckCircle2,
  History,
  Edit3,
} from 'lucide-react';

interface EventsFeedViewProps {
  currentUser: User;
  allEvents: MeetingEvent[];
  allUsers: User[];
  onParticipate: (event: MeetingEvent) => Promise<void> | void;
  onDecline: (event: MeetingEvent) => void;
  onOpenCalendarTab: () => void;
  onOpenOfficialEventDetail?: (event: MeetingEvent) => void;
  onEditOfficialEvent?: (event: MeetingEvent) => void;
}

export const EventsFeedView: React.FC<EventsFeedViewProps> = ({
  currentUser,
  allEvents,
  allUsers,
  onParticipate,
  onDecline,
  onOpenCalendarTab,
  onOpenOfficialEventDetail,
  onEditOfficialEvent,
}) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'responded'>('pending');
  const [showPastArchive, setShowPastArchive] = useState(false);

  // Filtra solo gli eventi associativi ('official') in cui l'utente è invitato
  const officialEvents = allEvents.filter(
    (e) => e.eventType === 'official' && e.invitees.some((i) => i.userId === currentUser.id)
  );

  // Inviti in sospeso (a cui l'utente NON ha ancora risposto e NON ancora passati)
  const pendingEvents = officialEvents.filter((e) => {
    if (isEventPassed(e)) return false;
    const myParticipant = e.participants?.find((p) => p.userId === currentUser.id);
    return !myParticipant || myParticipant.status === 'pending';
  });

  // Eventi a cui ha già risposto (Partecipa o Non Partecipo) - ATTIVI (non ancora passati)
  // REGOLA SPECIFICA: nello storico risposte gli eventi devono seguire la stessa regola dei sondaggi di disponibilità
  // ossia scomparire da quella pagina appena passato il giorno dell'evento.
  const activeRespondedEvents = officialEvents.filter((e) => {
    if (isEventPassed(e)) return false;
    const myParticipant = e.participants?.find((p) => p.userId === currentUser.id);
    return myParticipant && (myParticipant.status === 'accepted' || myParticipant.status === 'declined');
  });

  // Eventi passati a cui aveva risposto (trascorsi)
  const pastRespondedEvents = officialEvents.filter((e) => {
    if (!isEventPassed(e)) return false;
    const myParticipant = e.participants?.find((p) => p.userId === currentUser.id);
    return myParticipant && (myParticipant.status === 'accepted' || myParticipant.status === 'declined');
  });

  const toggleExpand = (id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  const handleParticipateClick = async (event: MeetingEvent) => {
    setActionLoadingId(event.id);
    try {
      await onParticipate(event);
      setSuccessFeedback(`🎉 Partecipazione confermata per "${event.title}"! L'evento è ora visibile nel tuo Calendario e sincronizzato con Google Calendar.`);
      setTimeout(() => setSuccessFeedback(null), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineClick = (event: MeetingEvent) => {
    onDecline(event);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Data da definire';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 sm:px-6 pt-2">
      
      {/* Header Bacheca */}
      <div className="pt-2 pb-1 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Bacheca Eventi</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e]">
                Ufficiali
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Inviti formali dell'associazione JESic con conferma presenza
            </p>
          </div>
        </div>
      </div>

      {/* Banner Feedback Successo */}
      {successFeedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{successFeedback}</p>
            <button
              type="button"
              onClick={onOpenCalendarTab}
              className="mt-1 font-bold underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer inline-flex items-center gap-1"
            >
              <span>Visualizza nel Calendario In-App</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Sotto-schede: "In Sospeso" vs "Risposti" */}
      <div className="flex p-1 bg-neutral-200/60 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60">
        <button
          type="button"
          onClick={() => setActiveSubTab('pending')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'pending'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Inviti in Sospeso</span>
          {pendingEvents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#f23e2e] text-white">
              {pendingEvents.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('responded')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'responded'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Storico Risposte</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
            {activeRespondedEvents.length}
          </span>
        </button>
      </div>

      {/* FEED: INVITI IN SOSPESO */}
      {activeSubTab === 'pending' && (
        <div className="space-y-3">
          {pendingEvents.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200/80 dark:border-neutral-800 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  Sei al passo con tutti gli inviti!
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                  Non hai inviti a eventi ufficiali in sospeso a cui devi ancora rispondere.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingEvents.map((evt) => {
              const isExpanded = expandedEventId === evt.id;
              const creator = allUsers.find((u) => u.id === evt.creatorId);
              const eventDate = evt.finalizedSlot?.date || evt.dates[0];
              const startTime = evt.finalizedSlot?.startTime || `${String(evt.startHour).padStart(2, '0')}:00`;
              const endTime = evt.finalizedSlot?.endTime || `${String(evt.endHour).padStart(2, '0')}:00`;

              const acceptedCount = evt.participants?.filter((p) => p.status === 'accepted').length || 0;
              const totalInvitees = evt.invitees.length;

              return (
                <div
                  key={evt.id}
                  onClick={() => onOpenOfficialEventDetail && onOpenOfficialEventDetail(evt)}
                  className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border-2 border-red-500/30 dark:border-red-900/50 shadow-md relative overflow-hidden transition-all hover:border-[#f23e2e] cursor-pointer group"
                >
                  {/* Badge Tipo Evento & Azioni Organizzatore */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Evento Ufficiale JESic</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {evt.creatorId === currentUser.id && onEditOfficialEvent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditOfficialEvent(evt);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Modifica evento"
                        >
                          <Edit3 className="w-3 h-3 text-[#f23e2e]" />
                          <span>Modifica</span>
                        </button>
                      )}

                      <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{acceptedCount} di {totalInvitees}</span>
                      </span>
                    </div>
                  </div>

                  {/* Titolo Card */}
                  <h2 className="text-base font-black text-neutral-900 dark:text-white tracking-tight group-hover:text-[#f23e2e] transition-colors">
                    {evt.title}
                  </h2>

                  {/* Organizzatore con Immagine Profilo */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserAvatar user={creator} size="xs" />
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Organizzato da <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{creator ? `${creator.name} ${creator.surname}` : 'Admin JESic'}</strong>
                    </span>
                  </div>

                  {/* Data e Ora Card */}
                  <div className="mt-3.5 p-3 bg-neutral-50 dark:bg-neutral-800/70 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold">
                      <Calendar className="w-4 h-4 text-[#f23e2e] shrink-0" />
                      <span className="capitalize">{formatDateDisplay(eventDate)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-neutral-600 dark:text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="font-mono font-semibold">{startTime} - {endTime}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        {evt.type === 'online' ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                            <Video className="w-3.5 h-3.5" />
                            <span>Google Meet</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{evt.location || 'Sede'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descrizione con invito a leggere o espandere */}
                  {evt.description && (
                    <div className="mt-3">
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-800/80 leading-relaxed line-clamp-3">
                        {evt.description}
                      </div>
                      <div className="mt-1.5 flex justify-end">
                        <span className="text-[11px] font-bold text-[#f23e2e] group-hover:underline flex items-center gap-1">
                          <span>Apri pagina evento completa &rarr;</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* BOTTONI AZIONE: "Partecipa" & "Non Partecipo" */}
                  <div
                    className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Non Partecipo */}
                    <button
                      type="button"
                      onClick={() => handleDeclineClick(evt)}
                      disabled={actionLoadingId === evt.id}
                      className="flex-1 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-neutral-400" />
                      <span>Non Partecipo</span>
                    </button>

                    {/* Partecipa */}
                    <button
                      type="button"
                      onClick={() => handleParticipateClick(evt)}
                      disabled={actionLoadingId === evt.id}
                      className="flex-1 py-2.5 px-3 bg-[#f23e2e] hover:bg-red-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === evt.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3px]" />
                      )}
                      <span>Partecipa</span>
                    </button>
                  </div>

                  {/* Nota Libertà Totale & Google Calendar */}
                  <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 mt-2">
                    Premendo "Partecipa", l'evento verrà inserito nel Calendario interno e nel tuo Google Calendar personale.
                  </p>

                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* FEED: STORICO RISPOSTE (ACCETTATI O RIFIUTATI) */}
      {activeSubTab === 'responded' && (
        <div className="space-y-3">
          {activeRespondedEvents.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-7 border border-neutral-200/80 dark:border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <History className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  Nessuna risposta attiva per eventi imminenti
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Come per i sondaggi di disponibilità, gli eventi trascorsi scompaiono automaticamente da questa schermata. Tutti i tuoi impegni accettati rimangono sempre salvati e visibili nel tuo <strong>Calendario</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenCalendarTab}
                className="mt-1 py-2 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-[#f23e2e] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Apri Scheda Calendario</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeRespondedEvents.map((evt) => {
                const myParticipant = evt.participants?.find((p) => p.userId === currentUser.id);
                const isAccepted = myParticipant?.status === 'accepted';
                const eventDate = evt.finalizedSlot?.date || evt.dates[0];
                const startTime = evt.finalizedSlot?.startTime || `${String(evt.startHour).padStart(2, '0')}:00`;
                const endTime = evt.finalizedSlot?.endTime || `${String(evt.endHour).padStart(2, '0')}:00`;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onOpenOfficialEventDetail && onOpenOfficialEventDetail(evt)}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 shadow-2xs hover:border-[#f23e2e] cursor-pointer transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-black text-neutral-900 dark:text-white truncate group-hover:text-[#f23e2e] transition-colors">
                          {evt.title}
                        </h3>
                        {isAccepted ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>Partecipi</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-0.5">
                            <X className="w-2.5 h-2.5" />
                            <span>Non partecipi</span>
                          </span>
                        )}
                        {evt.creatorId === currentUser.id && onEditOfficialEvent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditOfficialEvent(evt);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Modifica evento"
                          >
                            <Edit3 className="w-3 h-3 text-[#f23e2e]" />
                            <span>Modifica</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span className="capitalize">{formatDateDisplay(eventDate)}</span>
                        <span>•</span>
                        <span className="font-mono">{startTime} - {endTime}</span>
                        <span>•</span>
                        <span className="text-[#f23e2e] font-bold group-hover:underline">Apri dettagli &rarr;</span>
                      </p>
                    </div>

                    {/* Pulsante cambia idea */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {isAccepted ? (
                        <button
                          type="button"
                          onClick={() => handleDeclineClick(evt)}
                          className="text-[11px] font-bold text-neutral-400 hover:text-red-500 cursor-pointer"
                        >
                          Cambia risposta
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleParticipateClick(evt)}
                          className="text-[11px] font-bold text-[#f23e2e] hover:underline cursor-pointer"
                        >
                          Partecipa ora
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sezione Archivio Eventi Passati (Regola come per la Dashboard dei sondaggi) */}
          {pastRespondedEvents.length > 0 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowPastArchive((prev) => !prev)}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  {showPastArchive
                    ? 'Nascondi archivio eventi passati'
                    : `Mostra archivio (${pastRespondedEvents.length} eventi conclusi)`}
                </span>
              </button>

              {showPastArchive && (
                <div className="mt-3 text-left space-y-2 animate-in fade-in">
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800/70 rounded-2xl text-[11px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-start gap-2">
                    <History className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <div>
                      <p>
                        <strong>Regola di archiviazione JESic:</strong> Gli eventi la cui data è trascorsa vengono rimossi dallo storico risposte attivo, ma restano sempre registrati e consultabili nel tuo <strong>Calendario</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenCalendarTab}
                        className="text-[#f23e2e] hover:underline font-bold mt-1 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Visualizzali nel Calendario In-App</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {pastRespondedEvents.map((evt) => {
                    const myParticipant = evt.participants?.find((p) => p.userId === currentUser.id);
                    const isAccepted = myParticipant?.status === 'accepted';
                    const eventDate = evt.finalizedSlot?.date || evt.dates[0];
                    return (
                      <div
                        key={evt.id}
                        className="p-3 bg-neutral-50/70 dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 opacity-60 hover:opacity-100 transition-opacity text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-neutral-700 dark:text-neutral-300">{evt.title}</p>
                          <p className="text-[10px] text-neutral-400">Concluso in data: {eventDate}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-neutral-400">
                          {isAccepted ? 'Partecipato' : 'Non partecipato'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
