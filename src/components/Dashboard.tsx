/**
 * JESic Meet - Dashboard Principale
 * Due schede fluide: "Creati da me" e "I miei inviti"
 * Filtra automaticamente gli eventi passati (Data Evento < Ora Corrente)
 */

import React, { useState } from 'react';
import { MeetingEvent, User, EventResponse } from '../types';
import { isEventPassed } from '../utils/dateUtils';
import { UserAvatar } from './UserAvatar';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  ExternalLink,
  History,
  Star,
  Inbox,
  ArrowRight,
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  allEvents: MeetingEvent[];
  allResponses: EventResponse[];
  allUsers: User[];
  onOpenEvent: (event: MeetingEvent) => void;
  onOpenCreateModal: () => void;
  onNavigateToRequests?: () => void;
  pendingClientRequestsCount?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  allEvents,
  allResponses,
  allUsers,
  onOpenEvent,
  onOpenCreateModal,
  onNavigateToRequests,
  pendingClientRequestsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'created_by_me' | 'my_invites'>('created_by_me');
  const [showPastArchive, setShowPastArchive] = useState(false);

  // 1. SONDAGGI CREATI DA ME (Esclusivamente sondaggi di disponibilità When2meet)
  const pollEvents = allEvents.filter((e) => !e.eventType || e.eventType === 'poll');
  const myCreatedEvents = pollEvents.filter((e) => e.creatorId === currentUser.id);
  const activeCreatedEvents = myCreatedEvents.filter((e) => !isEventPassed(e));
  const pastCreatedEvents = myCreatedEvents.filter((e) => isEventPassed(e));

  // 2. I MIEI INVITI AI SONDAGGI (escludendo quelli creati da me)
  const myInvites = pollEvents.filter(
    (e) => e.creatorId !== currentUser.id && e.invitees.some((i) => i.userId === currentUser.id)
  );
  const activeInvites = myInvites.filter((e) => !isEventPassed(e));

  // Divisi in: "Da votare" e "Confermati / Votati"
  const pendingInvites = activeInvites.filter((e) => {
    if (e.status === 'confirmed') return false;
    const resp = allResponses.find((r) => r.eventId === e.id && r.userId === currentUser.id);
    return !resp || resp.status === 'pending';
  });

  const confirmedOrVotedInvites = activeInvites.filter(
    (e) => !pendingInvites.some((p) => p.id === e.id)
  );

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  };

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 sm:px-6 pt-2">
      
      {/* Saluto */}
      <div className="pt-2 pb-1 px-1">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
          Ciao, {currentUser.name} 👋
        </h1>
      </div>

      {/* Scheda Esclusiva Admin Clienti & Super Admin (Accesso rapido a Richieste Clienti) */}
      {(currentUser.role === 'admin' || currentUser.role === 'admin_clienti' || (currentUser.systemRole as unknown as string) === 'client_admin') && onNavigateToRequests && (
        <div
          onClick={onNavigateToRequests}
          className="bg-gradient-to-r from-red-950/80 via-neutral-900 to-neutral-900 border border-red-800/60 rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-red-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f23e2e] text-white flex items-center justify-center font-black shadow-md shadow-red-500/30 group-hover:scale-105 transition-transform">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#f23e2e]">
                  Admin Clienti
                </span>
                {pendingClientRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#f23e2e] text-white text-[9px] font-black animate-pulse">
                    {pendingClientRequestsCount} nuove
                  </span>
                )}
              </div>
              <h2 className="text-sm font-black text-white tracking-tight">
                Gestione Richieste Clienti B2B
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-neutral-300 group-hover:text-white">
            <span>Apri</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      {/* Tabs Fluidi: "Creati da me" vs "I miei inviti" */}
      <div className="flex p-1 bg-neutral-200/60 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60">
        <button
          type="button"
          onClick={() => setActiveTab('created_by_me')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'created_by_me'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Creati da me</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'created_by_me'
                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {activeCreatedEvents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_invites')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'my_invites'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>I miei inviti</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              pendingInvites.length > 0
                ? 'bg-red-600 text-white'
                : activeTab === 'my_invites'
                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {activeInvites.length}
          </span>
        </button>
      </div>

      {/* CONTENUTO TAB 1: CREATI DA ME */}
      {activeTab === 'created_by_me' && (
        <div className="space-y-3">
          
          {/* Lista eventi attivi (quelli passati sono automaticamente rimossi) */}
          {activeCreatedEvents.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Nessun meeting attivo creato da te
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                  Crea un nuovo sondaggio per trovare l'orario perfetto con il tuo team JESic.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
              >
                + Avvia Nuovo Sondaggio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {activeCreatedEvents.map((event) => {
              const eventResp = allResponses.filter((r) => r.eventId === event.id);
              const submittedCount = eventResp.filter((r) => r.status === 'submitted').length;
              const totalInvitees = event.invitees.length;

              return (
                <div
                  key={event.id}
                  onClick={() => onOpenEvent(event)}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      {/* Stato Evento Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            event.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : event.status === 'ready'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-850'
                          }`}
                        >
                          {event.status === 'confirmed'
                            ? 'Confermato'
                            : event.status === 'ready'
                            ? 'Pronto per la scelta'
                            : 'In votazione'}
                        </span>

                        <span className="text-[11px] text-neutral-400 font-medium">
                          {event.dates.length} {event.dates.length === 1 ? 'data' : 'date'} proposte
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {event.title}
                      </h3>

                      {event.status === 'confirmed' && event.finalizedSlot ? (
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {formatDateDisplay(event.finalizedSlot.date)} · {event.finalizedSlot.startTime} - {event.finalizedSlot.endTime}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {event.description || 'Nessuna descrizione specificata'}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                  </div>

                  {/* Barra info footer card */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        Risposte: <strong className="text-neutral-900 dark:text-neutral-200">{submittedCount}</strong>/{totalInvitees}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                      {event.type === 'online' ? (
                        <>
                          <Video className="w-3.5 h-3.5" />
                          <span>Google Meet</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>In presenza</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Toggle Archivio Eventi Passati */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowPastArchive(!showPastArchive)}
              className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors inline-flex items-center gap-1 p-1 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>
                {showPastArchive ? 'Nascondi archivio eventi passati' : `Mostra archivio (${pastCreatedEvents.length} eventi conclusi)`}
              </span>
            </button>

            {showPastArchive && (
              <div className="mt-2 text-left space-y-2 animate-in fade-in">
                <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  ℹ️ <strong>Logica applicata:</strong> Come da specifica, gli eventi la cui data è passata vengono automaticamente nascosti dalla lista principale della Dashboard.
                </div>
                {pastCreatedEvents.map((pEvt) => (
                  <div
                    key={pEvt.id}
                    onClick={() => onOpenEvent(pEvt)}
                    className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-xs"
                  >
                    <p className="font-bold text-neutral-700 dark:text-neutral-300">{pEvt.title}</p>
                    <p className="text-[10px] text-neutral-400">
                      Concluso in data: {pEvt.finalizedSlot?.date || pEvt.dates[0]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* CONTENUTO TAB 2: I MIEI INVITI */}
      {activeTab === 'my_invites' && (
        <div className="space-y-4">
          
          {/* Sezione A: DA VOTARE */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                Da Votare ({pendingInvites.length})
              </h2>
            </div>

            {pendingInvites.length === 0 ? (
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ottimo lavoro! Hai risposto a tutti gli inviti in sospeso.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {pendingInvites.map((event) => {
                  const creator = allUsers.find((u) => u.id === event.creatorId);
                  const myInviteConfig = event.invitees.find((i) => i.userId === currentUser.id);
                  const isMandatory = myInviteConfig?.isMandatory;

                  return (
                    <div
                      key={event.id}
                      onClick={() => onOpenEvent(event)}
                      className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border-2 border-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
                              Disponibilità Richiesta
                            </span>
                            {isMandatory && (
                              <span className="text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                Membro Essenziale
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <UserAvatar user={creator} size="xs" />
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              Organizzato da <strong className="text-neutral-800 dark:text-neutral-200">{creator?.name} {creator?.surname}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                        >
                          Vota Ora
                        </button>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>Scadenza: {event.pollDeadline ? new Date(event.pollDeadline).toLocaleDateString('it-IT') : 'Non definita'}</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">Tocca per inserire orari →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sezione B: CONFERMATI O GIÀ VOTATI */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Confermati & Risposte Inviate ({confirmedOrVotedInvites.length})
              </h2>
            </div>

            {confirmedOrVotedInvites.length === 0 ? (
              <p className="text-xs text-neutral-400 p-2 text-center">
                Nessun evento confermato al momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {confirmedOrVotedInvites.map((event) => {
                  const creator = allUsers.find((u) => u.id === event.creatorId);
                  const isConfirmed = event.status === 'confirmed';

                  return (
                    <div
                      key={event.id}
                      onClick={() => onOpenEvent(event)}
                      className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isConfirmed
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                              }`}
                            >
                              {isConfirmed ? 'Confermato' : 'In attesa di altri voti'}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {event.title}
                          </h3>

                          {isConfirmed && event.finalizedSlot ? (
                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 pt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {formatDateDisplay(event.finalizedSlot.date)} · {event.finalizedSlot.startTime} - {event.finalizedSlot.endTime}
                              </span>
                            </p>
                          ) : (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <UserAvatar user={creator} size="xs" />
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Creato da <strong className="text-neutral-800 dark:text-neutral-200">{creator?.name} {creator?.surname}</strong>
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors shrink-0 mt-2" />
                      </div>

                      {/* Link diretto Google Meet o Location se confermato */}
                      {isConfirmed && (
                        <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                          {event.type === 'online' && event.meetLink ? (
                            <a
                              href={event.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Apri Google Meet</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{event.location || 'Sede JESic'}</span>
                            </span>
                          )}

                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            Sincronizzato Calendar ✓
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
