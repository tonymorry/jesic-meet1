/**
 * JESic Meet - Creazione "Evento Associativo" (Solo Admin)
 * 
 * Specifiche da implementare:
 * - Titolo, Descrizione breve, Data/e (multi-giorno), Orario inizio/fine.
 * - Selezione Invitati: Ricerca manuale associati E un bottone rapido "Invita tutti gli associati".
 * - Modalità: Online (Google Meet) o In presenza (Luogo).
 */

import React, { useState } from 'react';
import { User, MeetingEvent, InviteeConfig, ParticipantResponse, Group, Subgroup } from '../types';
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
  Mail,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
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
  activeGroup?: Group;
  activeSubgroup?: Subgroup | null;
}

export const CreateOfficialEventModal: React.FC<CreateOfficialEventModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onCreateOfficialEvent,
  eventToEdit,
  onUpdateOfficialEvent,
  activeGroup,
  activeSubgroup,
}) => {
  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  
  // Date (supporto multi-giorno, fino a max 15 giorni)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [selectedDates, setSelectedDates] = useState<string[]>(
    eventToEdit?.dates && eventToEdit.dates.length > 0 ? eventToEdit.dates : [tomorrowStr]
  );
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Mese/Anno navigazione per mini-calendario visuale
  const [navYear, setNavYear] = useState<number>(() => {
    const dStr = (eventToEdit?.dates && eventToEdit.dates[0]) || tomorrowStr;
    const parts = dStr.split('-');
    return parts.length >= 1 ? parseInt(parts[0], 10) : new Date().getFullYear();
  });

  const [navMonth, setNavMonth] = useState<number>(() => {
    const dStr = (eventToEdit?.dates && eventToEdit.dates[0]) || tomorrowStr;
    const parts = dStr.split('-');
    return parts.length >= 2 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
  });

  const MONTH_NAMES_IT = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];
  const WEEKDAY_NAMES_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  };

  // Toggle selezione giorno nel mini-calendario
  const handleToggleCalendarDate = (dateStr: string) => {
    setDateWarning(null);
    if (selectedDates.includes(dateStr)) {
      if (selectedDates.length <= 1) {
        setDateWarning('È necessario selezionare almeno un giorno.');
        setTimeout(() => setDateWarning(null), 3000);
        return;
      }
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      if (selectedDates.length >= 15) {
        setDateWarning('Massimo 15 giorni consentiti per questo evento.');
        setTimeout(() => setDateWarning(null), 3000);
        return;
      }
      setSelectedDates([...selectedDates, dateStr].sort());
    }
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

  // Calcolo giorni del mese corrente per la griglia
  const firstDayOfMonth = new Date(navYear, navMonth, 1);
  const rawFirstDayOfWeek = firstDayOfMonth.getDay();
  // Lunedì = 0, Domenica = 6
  const startDayIndex = rawFirstDayOfWeek === 0 ? 6 : rawFirstDayOfWeek - 1;
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const emptyPaddingDays = Array.from({ length: startDayIndex });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const buildDateString = (dayNum: number): string => {
    const m = String(navMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${navYear}-${m}-${d}`;
  };

  // Scorciatoie rapide date
  const handleAddConsecutiveDays = (count: number) => {
    const base = new Date(tomorrowStr);
    const newDates: string[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      newDates.push(d.toISOString().split('T')[0]);
    }
    setSelectedDates(newDates);
  };

  const handleSelectWorkWeek = () => {
    const curr = new Date();
    // Prossimo lunedì
    const daysUntilNextMonday = ((1 - curr.getDay() + 7) % 7) || 7;
    const nextMonday = new Date(curr.getTime() + daysUntilNextMonday * 24 * 60 * 60 * 1000);
    const workWeek: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(nextMonday.getTime() + i * 24 * 60 * 60 * 1000);
      workWeek.push(d.toISOString().split('T')[0]);
    }
    setSelectedDates(workWeek);
  };

  // Orario inizio e fine (qualsiasi ora)
  const [startTime, setStartTime] = useState(
    eventToEdit?.finalizedSlot?.startTime || `${String(eventToEdit?.startHour || 10).padStart(2, '0')}:00`
  );
  const [endTime, setEndTime] = useState(
    eventToEdit?.finalizedSlot?.endTime || `${String(eventToEdit?.endHour || 12).padStart(2, '0')}:00`
  );

  // Scorciatoia durata in minuti
  const setDurationFromStart = (minsToAdd: number) => {
    if (!startTime) return;
    const [hStr, mStr] = startTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return;

    const totalMinutes = h * 60 + m + minsToAdd;
    const newH = Math.min(23, Math.floor(totalMinutes / 60));
    const newM = totalMinutes % 60;
    setEndTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  const setQuickStartHour = (hour: number) => {
    const hStr = `${String(hour).padStart(2, '0')}:00`;
    setStartTime(hStr);
    const [curEndH] = endTime.split(':');
    const curEndInt = parseInt(curEndH, 10);
    if (isNaN(curEndInt) || curEndInt <= hour) {
      const newEnd = Math.min(23, hour + 1);
      setEndTime(`${String(newEnd).padStart(2, '0')}:00`);
    }
  };

  // Formattazione data italiana per display testuale
  const formatDateHuman = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return new Intl.DateTimeFormat('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Modalità
  const [meetingType, setMeetingType] = useState<'online' | 'in_person'>(eventToEdit?.type || 'online');
  const [location, setLocation] = useState<string>(eventToEdit?.location || 'Sede JESic, Catania');

  // Selezione invitati
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
    if (eventToEdit?.invitees) {
      return eventToEdit.invitees.filter((i) => i.userId !== currentUser.id).map((i) => i.userId);
    }
    return otherUsers.map((u) => u.id);
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle singolo utente
  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const [directEmailInput, setDirectEmailInput] = useState('');
  const [externalInviteEmails, setExternalInviteEmails] = useState<string[]>(
    eventToEdit?.externalInviteEmails || []
  );

  const handleAddDirectEmail = () => {
    const email = directEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (!externalInviteEmails.includes(email)) {
      setExternalInviteEmails([...externalInviteEmails, email]);
    }
    setDirectEmailInput('');
  };

  // BOTTONE RAPIDO: "Invita tutti gli associati"
  const handleInviteAll = () => {
    setSelectedUserIds(otherUsers.map((u) => u.id));
  };

  // BOTTONE RAPIDO: "Invita membri del gruppo attivo"
  const handleInviteGroupMembers = () => {
    if (!activeGroup) return;
    const groupUserIds = activeGroup.members.map((m) => m.userId).filter((id) => id !== currentUser.id);
    setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...groupUserIds])));
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
        groupId: activeGroup?.id || eventToEdit.groupId,
        subgroupId: activeSubgroup?.id || eventToEdit.subgroupId,
        externalInviteEmails: externalInviteEmails.length > 0 ? externalInviteEmails : eventToEdit.externalInviteEmails,
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
      groupId: activeGroup?.id,
      subgroupId: activeSubgroup?.id,
      externalInviteEmails: externalInviteEmails.length > 0 ? externalInviteEmails : undefined,
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black tracking-tight">
                  {eventToEdit ? 'Modifica Evento Associativo' : 'Crea Evento Associativo'}
                </h2>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e]">
                  {activeSubgroup ? 'Admin Sottogruppo' : 'Admin'}
                </span>
                {activeSubgroup && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    📁 {activeSubgroup.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {eventToEdit
                  ? 'Aggiorna dettagli, orari o partecipanti di questo evento'
                  : activeSubgroup
                  ? `Pubblica un invito ufficiale per il sottogruppo "${activeSubgroup.name}"`
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

          {/* Date & Orari - Mini Calendario In-App & Orari Cliccabili */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-bold text-sm">
                <Calendar className="w-4 h-4 text-[#f23e2e]" />
                <span>1. Data dell'Evento</span>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-[#f23e2e] dark:bg-red-950/60 dark:text-red-400">
                {selectedDates.length} {selectedDates.length === 1 ? 'giorno selezionato' : 'giorni selezionati'} (max 15)
              </span>
            </div>

            {dateWarning && (
              <p className="text-[11px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{dateWarning}</span>
              </p>
            )}

            {/* Scorciatoie Rapide per i Giorni */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedDates([tomorrowStr]);
                  const p = tomorrowStr.split('-');
                  if (p.length >= 2) {
                    setNavYear(parseInt(p[0], 10));
                    setNavMonth(parseInt(p[1], 10) - 1);
                  }
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedDates.length === 1 && selectedDates[0] === tomorrowStr
                    ? 'bg-[#f23e2e] text-white border-[#f23e2e] shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                Solo Domani
              </button>

              <button
                type="button"
                onClick={() => handleAddConsecutiveDays(3)}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                +3 Giorni
              </button>

              <button
                type="button"
                onClick={handleSelectWorkWeek}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Settimana (Lun-Ven)
              </button>

              <button
                type="button"
                onClick={() => setSelectedDates([tomorrowStr])}
                className="text-[10px] font-bold px-2 py-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 ml-auto flex items-center gap-1 cursor-pointer"
                title="Ripristina data a domani"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Mini Calendario In-App Visivo */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-neutral-200 dark:border-neutral-700/80 shadow-2xs">
              {/* Header Mese/Anno con Tasti Navigazione */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Mese precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[10px] font-bold hidden sm:inline">Prec</span>
                </button>

                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white capitalize">
                    {MONTH_NAMES_IT[navMonth]} {navYear}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Mese successivo"
                >
                  <span className="text-[10px] font-bold hidden sm:inline">Succ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Intestazione giorni settimana */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAY_NAMES_IT.map((dName) => (
                  <div
                    key={dName}
                    className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-0.5"
                  >
                    {dName}
                  </div>
                ))}
              </div>

              {/* Griglia giorni del mese */}
              <div className="grid grid-cols-7 gap-1">
                {emptyPaddingDays.map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-7 sm:h-8" />
                ))}

                {monthDays.map((dayNum) => {
                  const dateStr = buildDateString(dayNum);
                  const isPast = dateStr < todayStr;
                  const isSelected = selectedDates.includes(dateStr);
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleToggleCalendarDate(dateStr)}
                      className={`h-7 sm:h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#f23e2e] text-white font-black shadow-xs ring-2 ring-red-400/40 scale-105'
                          : isPast
                          ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed opacity-30'
                          : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      } ${isToday && !isSelected ? 'border border-[#f23e2e] font-extrabold text-[#f23e2e]' : ''}`}
                      title={isPast ? 'Data passata' : dateStr}
                    >
                      <span>{dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-[#f23e2e] absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chips Giorni Selezionati */}
            {selectedDates.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {selectedDates.map((dateStr) => (
                    <span
                      key={dateStr}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs"
                    >
                      <span>{formatDateHuman(dateStr)}</span>
                      {selectedDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(dateStr)}
                          className="text-neutral-400 hover:text-red-500 cursor-pointer font-black text-sm ml-0.5"
                          title="Rimuovi questo giorno"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium capitalize flex items-center gap-1.5 bg-neutral-100/70 dark:bg-neutral-800/80 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-700">
                  <Check className="w-3.5 h-3.5 text-[#f23e2e] shrink-0 stroke-[2.5px]" />
                  <span>
                    {selectedDates.length === 1 ? (
                      <>Data stabilita: <strong className="text-neutral-900 dark:text-white">{formatDateHuman(selectedDates[0])}</strong></>
                    ) : (
                      <>{selectedDates.length} date stabilite per l'evento</>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* SEZIONE 2: ORARI CLICCABILI & DURATA */}
            <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-bold text-sm">
                  <Clock className="w-4 h-4 text-[#f23e2e]" />
                  <span>2. Orario Inizio e Fine</span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                  Clicca o digita
                </span>
              </div>

              {/* Bottoni Rapidi Inizio Incontro */}
              <div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                  Orario d'inizio rapido:
                </span>
                <div className="flex flex-wrap gap-1">
                  {[9, 10, 11, 14, 15, 16, 17, 18, 19].map((h) => {
                    const label = `${String(h).padStart(2, '0')}:00`;
                    const isSelected = startTime === label;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setQuickStartHour(h)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#f23e2e] text-white border-[#f23e2e] shadow-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Inizio / Fine esatti */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#f23e2e]" />
                    <span>Ora Inizio *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ colorScheme: 'light dark' }}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f23e2e]/30 focus:border-[#f23e2e] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#f23e2e]" />
                    <span>Ora Fine *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ colorScheme: 'light dark' }}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f23e2e]/30 focus:border-[#f23e2e] text-sm"
                  />
                </div>
              </div>

              {/* Scorciatoie Durata Rapida */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Imposta Durata:
                </span>
                {[
                  { label: '30 min', mins: 30 },
                  { label: '45 min', mins: 45 },
                  { label: '1 ora', mins: 60 },
                  { label: '1h 30m', mins: 90 },
                  { label: '2 ore', mins: 120 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDurationFromStart(preset.mins)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-[#f23e2e] dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>

              {/* Badge Riepilogo Orario */}
              <div className="p-2 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200/60 dark:border-red-800/60 flex items-center gap-2 text-[11px] text-[#f23e2e] dark:text-red-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#f23e2e] shrink-0" />
                <span>
                  Fascia oraria impostata: <strong>{startTime} - {endTime}</strong>
                </span>
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

              {/* Tasti Rapidi Selezione */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeGroup && (
                  <button
                    type="button"
                    onClick={handleInviteGroupMembers}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Membri Gruppo ({activeGroup.members.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleInviteAll}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-[#f23e2e] rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Tutti ({otherUsers.length})</span>
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

            {/* Inserimento Diretto via Email */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>Invita inserendo email {!activeGroup ? '(Fuori dal gruppo)' : ''}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  value={directEmailInput}
                  onChange={(e) => setDirectEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDirectEmail();
                    }
                  }}
                  placeholder="Es. collega@jesic.it oppure mario@azienda.com"
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#f23e2e]"
                />
                <button
                  type="button"
                  onClick={handleAddDirectEmail}
                  disabled={!directEmailInput.trim()}
                  className="px-3 py-1.5 bg-[#f23e2e] hover:bg-red-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  + Aggiungi
                </button>
              </div>

              {externalInviteEmails.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {externalInviteEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-[#f23e2e] text-[10px] font-mono font-bold"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => setExternalInviteEmails(externalInviteEmails.filter((e) => e !== email))}
                        className="hover:text-red-900 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
