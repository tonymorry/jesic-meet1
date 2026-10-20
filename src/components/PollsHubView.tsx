/**
 * JESic Meet - PollsHubView (Tab "Sondaggi" al CENTRO della Home)
 * 
 * Requisiti:
 * 1. Tasto ben visibile per creare un nuovo sondaggio
 * 2. Due sotto-tab:
 *    - "Creati da te" (i sondaggi generati dall'utente loggato)
 *    - "A cui sei invitato" (i sondaggi ricevuti da altri, con possibilità di accettare/votare o rifiutare)
 * 3. Supporto sia per inviti interni ai gruppi sia per inviti diretti via email
 */

import React, { useState } from 'react';
import { MeetingEvent, User, EventResponse } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  Inbox,
  Check,
  Search,
  Filter,
  Trash2,
  Edit3,
} from 'lucide-react';
import { formatDateShort } from '../utils/dateUtils';
import { EditConfirmedPollModal } from './EditConfirmedPollModal';

interface PollsHubViewProps {
  currentUser: User;
  events: MeetingEvent[];
  allUsers: User[];
  responses: EventResponse[];
  onOpenCreatePoll: () => void;
  onOpenPollDetail: (eventId: string) => void;
  onDeclinePoll?: (eventId: string) => void;
  onDeletePoll?: (eventId: string) => void;
  onEventUpdated?: (updatedEvent: MeetingEvent) => void;
  onEditPoll?: (event: MeetingEvent) => void;
}

export const PollsHubView: React.FC<PollsHubViewProps> = ({
  currentUser,
  events,
  allUsers,
  responses,
  onOpenCreatePoll,
  onOpenPollDetail,
  onDeclinePoll,
  onDeletePoll,
  onEventUpdated,
  onEditPoll,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'created' | 'invited'>('created');
  const [searchQuery, setSearchQuery] = useState('');
  const [pollToEditConfirmed, setPollToEditConfirmed] = useState<MeetingEvent | null>(null);

  // Filtra solo sondaggi (eventType === 'poll' o senza eventType)
  // REGOLA: I sondaggi dei vari gruppi NON devono spuntare nella home fuori dal gruppo!
  const pollEvents = events.filter((e) => e.eventType !== 'official' && !e.groupId);

  // 1. Sondaggi CREATI DALL'UTENTE
  const createdPolls = pollEvents.filter((e) => e.creatorId === currentUser.id);

  // 2. Sondaggi A CUI L'UTENTE È INVITATO (da altri)
  const invitedPolls = pollEvents.filter((e) => {
    if (e.creatorId === currentUser.id) return false;
    const isInvitedById = e.invitees?.some((inv) => inv.userId === currentUser.id);
    const isInvitedByEmail = e.externalInviteEmails?.some(
      (email) => email.toLowerCase() === currentUser.email.toLowerCase()
    );
    return isInvitedById || isInvitedByEmail;
  });

  // Conteggio sondaggi in sospeso (ancora da votare)
  const pendingInvitesCount = invitedPolls.filter((e) => {
    const userResp = responses.find((r) => r.eventId === e.id && r.userId === currentUser.id);
    return !userResp || userResp.status === 'pending';
  }).length;

  // Filtraggio ricerca
  const displayedPolls = (activeSubTab === 'created' ? createdPolls : invitedPolls).filter((e) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = e.title.toLowerCase().includes(q);
    const descMatch = (e.description || '').toLowerCase().includes(q);
    const creatorUser = allUsers.find((u) => u.id === e.creatorId);
    const creatorMatch = creatorUser
      ? `${creatorUser.name} ${creatorUser.surname}`.toLowerCase().includes(q)
      : false;
    return titleMatch || descMatch || creatorMatch;
  });

  return (
    <div className="space-y-4 pb-24 animate-in fade-in">
      {/* Banner Principale con Tasto "Crea Nuovo Sondaggio" Ben Visibile */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                Sondaggi di Disponibilità
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Trova l'orario perfetto stile When2meet con colleghi e invitati esterni via email.
            </p>
          </div>

          {/* Tasto Ben Visibile per Creare Sondaggio */}
          <button
            type="button"
            onClick={onOpenCreatePoll}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 hover:shadow-red-600/40 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Crea Nuovo Sondaggio</span>
          </button>
        </div>

        {/* Segmented Sotto-Tab: "Creati da te" vs "A cui sei invitato" */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
          {/* Sotto-tab 1: Creati da te */}
          <button
            type="button"
            onClick={() => setActiveSubTab('created')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'created'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Creati da te</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeSubTab === 'created'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono'
              }`}
            >
              {createdPolls.length}
            </span>
          </button>

          {/* Sotto-tab 2: A cui sei invitato */}
          <button
            type="button"
            onClick={() => setActiveSubTab('invited')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeSubTab === 'invited'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>A cui sei invitato</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                pendingInvitesCount > 0
                  ? 'bg-[#f23e2e] text-white font-black'
                  : activeSubTab === 'invited'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono'
              }`}
            >
              {invitedPolls.length}
            </span>
          </button>
        </div>

        {/* Barra di ricerca se ci sono molti sondaggi */}
        {(createdPolls.length > 3 || invitedPolls.length > 3) && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per titolo, organizzatore o dettagli..."
              className="w-full pl-10 pr-3.5 py-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        )}
      </div>

      {/* LISTATO DEI SONDAGGI */}
      {displayedPolls.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-[#f23e2e] mx-auto flex items-center justify-center text-3xl">
            {activeSubTab === 'created' ? '📝' : '📬'}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {activeSubTab === 'created'
                ? 'Non hai ancora creato nessun sondaggio'
                : 'Nessun sondaggio ricevuto al momento'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {activeSubTab === 'created'
                ? 'Crea un sondaggio When2meet per raccogliere le disponibilità dei tuoi colleghi o clienti.'
                : 'Quando qualcuno ti inviterà a un sondaggio di disponibilità, comparirà qui con la notifica.'}
            </p>
          </div>
          {activeSubTab === 'created' && (
            <button
              type="button"
              onClick={onOpenCreatePoll}
              className="px-5 py-2.5 bg-[#f23e2e] text-white rounded-xl text-xs font-bold hover:bg-red-600 cursor-pointer shadow-sm shadow-red-600/25"
            >
              Crea il Tuo Primo Sondaggio
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPolls.map((poll) => {
            const isCreator = poll.creatorId === currentUser.id;
            const creatorUser = allUsers.find((u) => u.id === poll.creatorId);

            // Risposta dell'utente loggato
            const userResponse = responses.find(
              (r) => r.eventId === poll.id && r.userId === currentUser.id
            );
            const hasVoted = userResponse && userResponse.status === 'submitted';

            // Conteggio risposte totali
            const pollResponses = responses.filter((r) => r.eventId === poll.id);
            const submittedCount = pollResponses.filter((r) => r.status === 'submitted').length;
            const totalInvitees = Math.max(poll.invitees.length, pollResponses.length, 1);

            return (
              <div
                key={poll.id}
                onClick={() => onOpenPollDetail(poll.id)}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500/50 dark:hover:border-red-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-3.5"
              >
                {/* Intestazione Card: Stato + Titolo + Organizzatore */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge Stato Sondaggio */}
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          poll.status === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : poll.status === 'ready'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {poll.status === 'confirmed'
                          ? 'Confermato ✓'
                          : poll.status === 'ready'
                          ? 'Pronto per conferma'
                          : 'In votazione'}
                      </span>

                      {/* Modalità Online / Presenza */}
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                        {poll.type === 'online' ? '🌐 Google Meet' : `📍 ${poll.location || 'In presenza'}`}
                      </span>

                      {/* Tag Gruppo se associato */}
                      {poll.groupId && (
                        <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                          Gruppo
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white group-hover:text-[#f23e2e] transition-colors truncate">
                      {poll.title}
                    </h3>

                    {poll.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {/* Badge Risposta Utente (per i sondaggi a cui è invitato) */}
                  {!isCreator && (
                    <div className="shrink-0 text-right">
                      {hasVoted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                          <Check className="w-3 h-3 stroke-[3px]" />
                          <span>Hai votato</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>Da votare</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Dettagli Date & Organizzatore */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Organizzatore */}
                    {creatorUser && (
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={creatorUser} size="xs" />
                        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                          {isCreator ? 'Creato da te' : `${creatorUser.name} ${creatorUser.surname}`}
                        </span>
                      </div>
                    )}

                    {/* Date Proposte o Data Confermata */}
                    {poll.status === 'confirmed' && (poll.finalizedSlot?.date || (typeof (poll.finalDate as any) === 'object' && (poll.finalDate as any)?.date) || (typeof poll.finalDate === 'string' && poll.finalDate)) ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {poll.finalizedSlot?.date || (typeof (poll.finalDate as any) === 'object' ? (poll.finalDate as any)?.date : poll.finalDate)}
                          {poll.finalizedSlot?.startTime && poll.finalizedSlot?.endTime
                            ? ` (${poll.finalizedSlot.startTime} - ${poll.finalizedSlot.endTime})`
                            : ''}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 text-[#f23e2e]" />
                          <span>
                            {poll.dates.length === 1
                              ? formatDateShort(poll.dates[0])
                              : `${poll.dates.length} date proposte`}
                          </span>
                        </div>

                        {/* Fascia Oraria */}
                        <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{poll.startHour}:00 - {poll.endHour}:00</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Azione Rapida */}
                  <div className="flex items-center gap-2">
                    {/* Pulsante Modifica per il creatore: Modifica Data/Ora per confermati, o Modifica base per non confermati */}
                    {isCreator && (
                      poll.status === 'confirmed' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPollToEditConfirmed(poll);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs hover:scale-105 active:scale-95"
                          title="Modifica Data e Orario del meeting confermato"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Modifica Data/Ora</span>
                        </button>
                      ) : onEditPoll ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPoll(poll);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title="Modifica sondaggio"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#f23e2e]" />
                          <span>Modifica</span>
                        </button>
                      ) : null
                    )}

                    {/* Se creatore o admin: opzione Elimina */}
                    {(isCreator || currentUser.role === 'admin') && onDeletePoll && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Sei sicuro di voler eliminare il sondaggio "${poll.title}"? L'eliminazione è definitiva e non comparirà più a nessun invitato.`)) {
                            onDeletePoll(poll.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                        title="Elimina definitivamente questo sondaggio"
                        aria-label="Elimina sondaggio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Se invitato e non ha votato: opzione Rifiuta */}
                    {!isCreator && !hasVoted && onDeclinePoll && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeclinePoll(poll.id);
                        }}
                        className="text-[11px] font-semibold text-neutral-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        Rifiuta
                      </button>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-[#f23e2e] group-hover:translate-x-0.5 transition-transform">
                      <span>
                        {poll.status === 'confirmed'
                          ? 'Dettagli meeting'
                          : isCreator
                          ? 'Gestisci orari'
                          : hasVoted
                          ? 'Vedi risultati'
                          : 'Compila When2meet'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </div>
                  </div>
                </div>

                {/* Barra di avanzamento risposte */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                    <span>Avanzamento risposte</span>
                    <span className="font-mono font-bold text-neutral-600 dark:text-neutral-300">
                      {submittedCount} su {totalInvitees} ({Math.round((submittedCount / totalInvitees) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#f23e2e] to-red-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((submittedCount / totalInvitees) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale Modifica Data e Orario Sondaggio Confermato */}
      {pollToEditConfirmed && (
        <EditConfirmedPollModal
          poll={pollToEditConfirmed}
          currentUser={currentUser}
          onClose={() => setPollToEditConfirmed(null)}
          onSuccess={(updatedPoll) => {
            if (onEventUpdated) {
              onEventUpdated(updatedPoll);
            }
            setPollToEditConfirmed(null);
          }}
        />
      )}
    </div>
  );
};
