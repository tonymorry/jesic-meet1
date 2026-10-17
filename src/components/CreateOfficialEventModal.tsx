/**
 * JESic Meet - Creazione "Evento Associativo" (Solo Admin)
 * 
 * Specifiche da implementare:
 * - Titolo, Descrizione breve, Data/e (multi-giorno), Orario inizio/fine.
 * - Selezione Invitati: Ricerca manuale associati E un bottone rapido "Invita tutti gli associati".
 * - Modalità: Online (Google Meet) o In presenza (Luogo).
 */

import React, { useState } from 'react';
import { User, MeetingEvent, InviteeConfig, ParticipantResponse } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Search,
  Check,
  Sparkles,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

interface CreateOfficialEventModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onCreateOfficialEvent: (
    event: Omit<MeetingEvent, 'id' | 'createdAt'>
  ) => void;
  eventToEdit?: MeetingEvent;
  onUpdateOfficialEvent?: (updatedEvent: MeetingEvent) => void;
}

export const CreateOfficialEventModal: React.FC<CreateOfficialEventModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onCreateOfficialEvent,
  eventToEdit,
  onUpdateOfficialEvent,
}) => {
  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  
  // Date (supporto multi-giorno, fino a max 15 giorni)
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [selectedDates, setSelectedDates] = useState<string[]>(
    eventToEdit?.dates && eventToEdit.dates.length > 0 ? eventToEdit.dates : [tomorrowStr]
  );
  const [newDateInput, setNewDateInput] = useState('');
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Orario inizio e fine (qualsiasi ora)
  const [startTime, setStartTime] = useState(
    eventToEdit?.finalizedSlot?.startTime || `${String(eventToEdit?.startHour || 10).padStart(2, '0')}:00`
  );
  const [endTime, setEndTime] = useState(
    eventToEdit?.finalizedSlot?.endTime || `${String(eventToEdit?.endHour || 12).padStart(2, '0')}:00`
  );

  // Modalità
  const [meetingType, setMeetingType] = useState<'online' | 'in_person'>(eventToEdit?.type || 'online');
  const [location, setLocation] = useState(eventToEdit?.location || 'Sede JESic, Catania');

  // Selezione invitati
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
    if (eventToEdit?.invitees) {
      return eventToEdit.invitees.filter((i) => i.userId !== currentUser.id).map((i) => i.userId);
    }
    return otherUsers.map((u) => u.id);
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Aggiungi / Rimuovi data
  const handleAddDate = () => {
    if (!newDateInput) return;
    if (selectedDates.includes(newDateInput)) {
      setDateWarning('Data già selezionata.');
      setTimeout(() => setDateWarning(null), 3000);
      return;
    }
    if (selectedDates.length >= 15) {
      setDateWarning('Massimo 15 giorni consentiti per questo evento.');
      setTimeout(() => setDateWarning(null), 3000);
      return;
    }
    setDateWarning(null);
    setSelectedDates([...selectedDates, newDateInput].sort());
    setNewDateInput('');
  };

  const handleRemoveDate = (d: string) => {
    if (selectedDates.length > 1) {
      setSelectedDates(selectedDates.filter((date) => date !== d));
      setDateWarning(null);
    } else {
      setDateWarning('È necessario selezionare almeno un giorno.');
      setTimeout(() => setDateWarning(null), 3000);
    }
  };

  // Toggle singolo utente
  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // BOTTONE RAPIDO: "Invita tutti gli associati"
  const handleInviteAll = () => {
    setSelectedUserIds(otherUsers.map((u) => u.id));
  };

  const handleDeselectAll = () => {
    setSelectedUserIds([]);
  };

  const filteredUsers = otherUsers.filter((u) =>
    `${u.name} ${u.surname} ${u.role || ''} ${u.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedDates.length === 0) return;

    // Converte orari in numeri interi
    const startHourInt = parseInt(startTime.split(':')[0], 10) || 9;
    const endHourInt = parseInt(endTime.split(':')[0], 10) || 18;

    // Crea lista invitati
    const allInviteesList: InviteeConfig[] = [
      { userId: currentUser.id, isMandatory: true },
      ...selectedUserIds.map((uid) => ({ userId: uid, isMandatory: false })),
    ];

    // Crea partecipanti con stato iniziale
    const initialParticipants: ParticipantResponse[] = [
      {
        userId: currentUser.id,
        status: 'accepted',
        respondedAt: new Date().toISOString(),
        googleCalendarSynced: true,
      },
      ...selectedUserIds.map((uid) => ({
        userId: uid,
        status: 'pending' as const,
        googleCalendarSynced: false,
      })),
    ];

    const meetLink =
      meetingType === 'online'
        ? `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`
        : undefined;

    if (eventToEdit && onUpdateOfficialEvent) {
      // Mantiene le risposte dei partecipanti già esistenti e aggiunge i nuovi
      const existingParticipantMap = new Map((eventToEdit.participants || []).map((p) => [p.userId, p]));
      const updatedParticipants: ParticipantResponse[] = allInviteesList.map((inv) => {
        const existing = existingParticipantMap.get(inv.userId);
        if (existing) return existing;
        return {
          userId: inv.userId,
          status: inv.userId === currentUser.id ? 'accepted' : 'pending',
          googleCalendarSynced: false,
        };
      });

      onUpdateOfficialEvent({
        ...eventToEdit,
        title: title.trim(),
        description: description.trim(),
        dates: selectedDates,
        startHour: startHourInt,
        endHour: endHourInt,
        type: meetingType,
        location: meetingType === 'in_person' ? location : undefined,
        meetLink: meetingType === 'online' ? (eventToEdit.meetLink || meetLink) : undefined,
        finalizedSlot: {
          date: selectedDates[0],
          startTime,
          endTime,
        },
        invitees: allInviteesList,
        participants: updatedParticipants,
      });
      onClose();
      return;
    }

    onCreateOfficialEvent({
      title: title.trim(),
      description: description.trim(),
      creatorId: currentUser.id,
      eventType: 'official',
      dates: selectedDates,
      startHour: startHourInt,
      endHour: endHourInt,
      slotIntervalMinutes: 60,
      type: meetingType,
      location: meetingType === 'in_person' ? location : undefined,
      meetLink,
      status: 'confirmed', // Gli eventi associativi nascono già confermati con data fissa
      finalizedSlot: {
        date: selectedDates[0],
        startTime,
        endTime,
      },
      invitees: allInviteesList,
      participants: initialParticipants,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white w-full max-w-lg max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        
        {/* Header Modale */}
        <div className="p-4 sm:p-5 border-b border-neutral-200/90 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f23e2e] text-white flex items-center justify-center font-black shadow-md shadow-red-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  {eventToEdit ? 'Modifica Evento Associativo' : 'Crea Evento Associativo'}
                </h2>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e]">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {eventToEdit
                  ? 'Aggiorna dettagli, orari o partecipanti di questo evento'
                  : 'Pubblica un invito ufficiale sulla bacheca di tutti gli associati'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body con Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Titolo & Descrizione */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Titolo Evento Associativo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Assemblea Generale dei Soci 2026, Workshop IT..."
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-[#f23e2e]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Descrizione Breve
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dettagli, ordine del giorno o note importanti per gli associati..."
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#f23e2e] resize-none"
              />
            </div>
          </div>

          {/* Date & Orari */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-bold">
                <Calendar className="w-4 h-4 text-[#f23e2e]" />
                <span>Data/e e Orario</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-[#f23e2e] dark:bg-red-950/60 dark:text-red-400">
                {selectedDates.length} di 15 giorni (max 15)
              </span>
            </div>

            {dateWarning && (
              <p className="text-[11px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900">
                {dateWarning}
              </p>
            )}

            {/* Date selezionate (Multi-giorno) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Date dell'Evento (fino a 15 giorni)
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg font-mono font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    <span>{dateStr}</span>
                    {selectedDates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(dateStr)}
                        className="text-neutral-400 hover:text-red-500 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Aggiungi altra data */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newDateInput}
                  disabled={selectedDates.length >= 15}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-xs disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  disabled={!newDateInput || selectedDates.length >= 15}
                  className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-40 cursor-pointer"
                >
                  + Aggiungi Data
                </button>
              </div>
            </div>

            {/* Orario Inizio / Fine */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#f23e2e]" />
                  <span>Orario Inizio *</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#f23e2e]" />
                  <span>Orario Fine *</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Modalità Online vs Presenza */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Modalità Svolgimento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMeetingType('online')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold ${
                  meetingType === 'online'
                    ? 'border-[#f23e2e] bg-red-50 dark:bg-red-950/40 text-[#f23e2e]'
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Online (Google Meet)</span>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType('in_person')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold ${
                  meetingType === 'in_person'
                    ? 'border-[#f23e2e] bg-red-50 dark:bg-red-950/40 text-[#f23e2e]'
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>In Presenza</span>
              </button>
            </div>

            {meetingType === 'in_person' && (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Indica la sede o l'aula..."
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
            )}
          </div>

          {/* SELEZIONE INVITATI: Ricerca manuale + Tasto "Invita tutti gli associati" */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                <Users className="w-4 h-4 text-[#f23e2e]" />
                <span>Destinatari Invito ({selectedUserIds.length} selezionati)</span>
              </div>

              {/* Tasto Rapido: Invita tutti gli associati */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleInviteAll}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-[#f23e2e] rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Invita tutti ({otherUsers.length})</span>
                </button>
                {selectedUserIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2 py-1 text-[10px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    Deseleziona
                  </button>
                )}
              </div>
            </div>

            {/* Barra di ricerca associati */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca associati per nome, ruolo o email..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-xs focus:outline-none focus:border-[#f23e2e]"
              />
            </div>

            {/* Lista scrollabile associati */}
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-3 text-[11px] text-neutral-400">
                  Nessun associato trovato.
                </p>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40'
                          : 'bg-white dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={u} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {u.name} {u.surname}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            {u.role || 'Associato'} • {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-[#f23e2e]">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 fill-red-100 dark:fill-red-950" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || selectedDates.length === 0}
              className="w-full py-3 bg-[#f23e2e] hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{eventToEdit ? 'Salva Modifiche Evento' : 'Pubblica Evento Associativo'}</span>
            </button>
            <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 mt-2">
              L'evento apparirà immediatamente nella scheda "Eventi" degli associati invitati.
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
