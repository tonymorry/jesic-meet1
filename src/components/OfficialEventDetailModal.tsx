/**
 * JESic Meet - Dettaglio Pagina Evento Associativo Ufficiale
 * 
 * Consente di:
 * 1. Aprire l'evento associativo a schermo intero/modale dedicato
 * 2. Leggere chiaramente la descrizione estesa dell'evento, data, ora e luogo/link Meet
 * 3. In basso: bottoni di azione immediata "Partecipa" o "Non Partecipo"
 * 4. Per l'organizzatore: pulsante "Modifica Evento" per aggiornare dettagli, orari o invitati
 */

import React, { useState } from 'react';
import { MeetingEvent, User } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Check,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Edit3,
  CalendarCheck,
  Trash2,
} from 'lucide-react';

interface OfficialEventDetailModalProps {
  event: MeetingEvent;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onParticipate: (event: MeetingEvent) => Promise<void> | void;
  onDecline: (event: MeetingEvent) => void;
  onEditEvent?: (event: MeetingEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const OfficialEventDetailModal: React.FC<OfficialEventDetailModalProps> = ({
  event,
  currentUser,
  allUsers,
  onClose,
  onParticipate,
  onDecline,
  onEditEvent,
  onDeleteEvent,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const isCreator = event.creatorId === currentUser.id;
  const creatorUser = allUsers.find((u) => u.id === event.creatorId);

  // Partecipazione dell'utente corrente
  const myParticipant = event.participants?.find((p) => p.userId === currentUser.id);
  const myStatus = myParticipant?.status || 'pending';

  // Dati data e ora
  const eventDate = event.finalizedSlot?.date || event.dates[0];
  const startTime = event.finalizedSlot?.startTime || `${String(event.startHour).padStart(2, '0')}:00`;
  const endTime = event.finalizedSlot?.endTime || `${String(event.endHour).padStart(2, '0')}:00`;

  const formatDateFull = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return new Intl.DateTimeFormat('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const handleParticipate = async () => {
    setIsLoading(true);
    try {
      await onParticipate(event);
      setFeedbackMsg('Presenza confermata! L\'evento è stato aggiunto al tuo Calendario.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline(event);
    setFeedbackMsg('Hai indicato che non parteciperai a questo evento.');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Liste partecipanti
  const acceptedList = (event.participants || [])
    .filter((p) => p.status === 'accepted')
    .map((p) => allUsers.find((u) => u.id === p.userId))
    .filter(Boolean) as User[];

  const declinedList = (event.participants || [])
    .filter((p) => p.status === 'declined')
    .map((p) => allUsers.find((u) => u.id === p.userId))
    .filter(Boolean) as User[];

  const pendingList = event.invitees
    .filter((inv) => {
      const p = event.participants?.find((part) => part.userId === inv.userId);
      return !p || p.status === 'pending';
    })
    .map((inv) => allUsers.find((u) => u.id === inv.userId))
    .filter(Boolean) as User[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white w-full max-w-xl sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col border border-neutral-200/90 dark:border-neutral-800 overflow-hidden">
        
        {/* Header Modale */}
        <div className="p-4 sm:p-5 border-b border-neutral-200/90 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f23e2e] text-white flex items-center justify-center font-black shadow-md shadow-red-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e]">
                  Evento Ufficiale JESic
                </span>
                {isCreator && (
                  <span className="text-[9px] font-bold text-neutral-400">
                    (Sei l'organizzatore)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <UserAvatar user={creatorUser} size="xs" />
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Organizzato da <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{creatorUser ? `${creatorUser.name} ${creatorUser.surname}` : 'Admin JESic'}</strong>
                  {creatorUser?.role ? ` • ${creatorUser.role}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tasto Modifica Evento per l'organizzatore */}
            {isCreator && onEditEvent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditEvent(event);
                }}
                className="py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Modifica questo evento associativo"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span className="hidden sm:inline">Modifica Evento</span>
              </button>
            )}

            {(isCreator || currentUser.role === 'admin') && onDeleteEvent && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Sei sicuro di voler eliminare definitivamente l'evento "${event.title}"? L'eliminazione è definitiva e non comparirà più a nessun invitato.`
                    )
                  ) {
                    onClose();
                    onDeleteEvent(event.id);
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-red-200/80 dark:border-red-900/50"
                title="Elimina definitivamente questo evento per te e per tutti gli invitati"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Elimina</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Feedback Notifica */}
        {feedbackMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 px-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackMsg}</span>
          </div>
        )}

        {/* Corpo Scheda con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          
          {/* Titolo Principale */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {event.title}
            </h1>
          </div>

          {/* Griglia Data, Orario e Luogo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box Data */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Data dell'evento
              </span>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
                <Calendar className="w-4 h-4 text-[#f23e2e] shrink-0" />
                <span className="capitalize">{formatDateFull(eventDate)}</span>
              </div>
            </div>

            {/* Box Orario */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Fascia Oraria
              </span>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="font-mono">{startTime} - {endTime}</span>
              </div>
            </div>

            {/* Box Modalità / Luogo / Meet */}
            <div className="sm:col-span-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                {event.type === 'online' ? (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Modalità
                  </span>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                    {event.type === 'online' ? 'Riunione Online Google Meet' : (event.location || 'In presenza (Sede JESic)')}
                  </p>
                </div>
              </div>

              {event.type === 'online' && event.meetLink && (
                <a
                  href={event.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Apri Google Meet</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              )}
            </div>
          </div>

          {/* DESCRIZIONE DETTAGLIATA (Richiesta specifica utente) */}
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <span>Descrizione dell'evento</span>
            </h2>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {event.description?.trim() ? (
                event.description
              ) : (
                <span className="text-neutral-400 italic">
                  Nessuna descrizione specificata per questo evento associativo.
                </span>
              )}
            </div>
          </div>

          {/* PARTECIPANTI / STATO RISPOSTE */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#f23e2e]" />
                <span>Partecipazione associati ({acceptedList.length} confermati su {event.invitees.length} invitati)</span>
              </span>
            </div>

            {/* Lista chip partecipanti con foto profilo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {acceptedList.map((u) => (
                <div
                  key={u.id}
                  className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200"
                >
                  <div className="flex items-center gap-2 truncate">
                    <UserAvatar user={u} size="xs" />
                    <span className="truncate">{u.name} {u.surname}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Presente
                  </span>
                </div>
              ))}

              {declinedList.map((u) => (
                <div
                  key={u.id}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 opacity-70"
                >
                  <div className="flex items-center gap-2 truncate">
                    <UserAvatar user={u} size="xs" />
                    <span className="truncate">{u.name} {u.surname}</span>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-1">
                    <X className="w-3 h-3 text-neutral-400" />
                    Assente
                  </span>
                </div>
              ))}

              {pendingList.map((u) => (
                <div
                  key={u.id}
                  className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400"
                >
                  <div className="flex items-center gap-2 truncate">
                    <UserAvatar user={u} size="xs" />
                    <span className="truncate">{u.name} {u.surname}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-neutral-200/60 dark:bg-neutral-700/60 px-1.5 py-0.2 rounded shrink-0">
                    In attesa
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* IN BASSO: BOTTONI PARTECIPA O NON PARTECIPA */}
        <div className="p-4 sm:p-5 border-t border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 space-y-2">
          
          {/* Indicatore Stato Personale Attuale */}
          <div className="flex items-center justify-between text-[11px] px-1 font-bold">
            <span className="text-neutral-500 dark:text-neutral-400">Il tuo stato di partecipazione:</span>
            {myStatus === 'accepted' ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-black">
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Hai confermato la presenza</span>
              </span>
            ) : myStatus === 'declined' ? (
              <span className="text-neutral-500 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                <span>Hai indicato che non parteciperai</span>
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Risposta in sospeso</span>
              </span>
            )}
          </div>

          {/* Griglia Pulsanti "Non Partecipo" e "Partecipa" */}
          <div className="flex items-center gap-3">
            {/* Bottone "Non Partecipo" */}
            <button
              type="button"
              onClick={handleDecline}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                myStatus === 'declined'
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
                  : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 active:scale-98'
              }`}
            >
              <X className="w-4 h-4 text-neutral-400" />
              <span>{myStatus === 'declined' ? 'Non Partecipi (Confermato)' : 'Non Partecipo'}</span>
            </button>

            {/* Bottone "Partecipa" */}
            <button
              type="button"
              onClick={handleParticipate}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                myStatus === 'accepted'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-98'
                  : 'bg-[#f23e2e] hover:bg-red-600 text-white shadow-red-500/25 active:scale-98'
              }`}
            >
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Check className="w-4 h-4 stroke-[3px]" />
              )}
              <span>{myStatus === 'accepted' ? 'Partecipazione Confermata ✓' : 'Partecipa'}</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 pt-0.5">
            Confermando la presenza, l'evento viene salvato nel tuo Calendario in-app e sincronizzato con Google Calendar.
          </p>
        </div>

      </div>
    </div>
  );
};
