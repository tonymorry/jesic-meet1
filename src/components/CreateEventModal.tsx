/**
 * JESic Meet - Creazione Nuovo Sondaggio di Disponibilità
 * Semplificato:
 * 1. Step 1: Dettagli Riunione (Titolo, Descrizione, Modalità, Scadenza Sondaggio)
 * 2. Step 2: Date & Fascia Oraria (Calendario multi-selezione rapido in un colpo solo + Fascia oraria da... a...)
 * 3. Step 3: Invita Membri & Priorità (Essenziale ⭐ vs Opzionale)
 * NOTA: Rimosso lo step 3 precedente della disponibilità organizzatore, rendendo il flusso rapido e snello.
 */

import React, { useState, useRef } from 'react';
import { User, MeetingEvent, InviteeConfig, ClientSlotPreference, Group } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Star,
  Check,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  AlertCircle,
  RotateCcw,
  Lock,
  Mail,
} from 'lucide-react';

export interface PreFillClientData {
  title?: string;
  description?: string;
  clientRequestId?: string;
  clientInfo?: {
    companyName: string;
    contactEmail: string;
  };
  fixedSlots?: ClientSlotPreference[];
}

interface CreateEventModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onCreateEvent: (
    newEvent: Omit<MeetingEvent, 'id' | 'createdAt'>,
    creatorAvailability: string[],
    newUsersToRegister?: User[]
  ) => void;
  prefillData?: PreFillClientData;
  eventToEdit?: MeetingEvent;
  onUpdateEvent?: (updatedEvent: MeetingEvent) => void;
  activeGroup?: Group;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onCreateEvent,
  prefillData,
  eventToEdit,
  onUpdateEvent,
  activeGroup,
}) => {
  // Ora il wizard ha solo 3 step (rimosso step orari disponibilità organizzatore)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // STEP 1: Dettagli Riunione
  const [title, setTitle] = useState(eventToEdit?.title || prefillData?.title || '');
  const [description, setDescription] = useState(eventToEdit?.description || prefillData?.description || '');
  const [meetingType, setMeetingType] = useState<'online' | 'in_person'>(eventToEdit?.type || 'online');
  const [location, setLocation] = useState(eventToEdit?.location || '');

  // Scadenza sondaggio (default domani sera)
  const defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  defaultDeadline.setHours(20, 0, 0, 0);
  const [pollDeadline, setPollDeadline] = useState(
    eventToEdit?.pollDeadline
      ? new Date(eventToEdit.pollDeadline).toISOString().slice(0, 16)
      : defaultDeadline.toISOString().slice(0, 16)
  );

  const pollDeadlineInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDeadlinePicker = (e?: React.MouseEvent) => {
    if (e && e.target === pollDeadlineInputRef.current) {
      return;
    }
    if (pollDeadlineInputRef.current) {
      try {
        if (typeof pollDeadlineInputRef.current.showPicker === 'function') {
          pollDeadlineInputRef.current.showPicker();
        } else {
          pollDeadlineInputRef.current.focus();
        }
      } catch {
        pollDeadlineInputRef.current.focus();
      }
    }
  };

  // STEP 2: Date & Fascia Oraria
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    if (eventToEdit?.dates && eventToEdit.dates.length > 0) {
      return eventToEdit.dates;
    }
    if (prefillData?.fixedSlots && prefillData.fixedSlots.length > 0) {
      return Array.from(new Set(prefillData.fixedSlots.map((s) => s.date))).sort();
    }
    return [tomorrowStr];
  });
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Calendario per selezionare più giorni "in un colpo solo"
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Fascia Oraria (Da ... A ...)
  const [startHour, setStartHour] = useState<number>(eventToEdit?.startHour ?? 9);
  const [endHour, setEndHour] = useState<number>(eventToEdit?.endHour ?? 18);
  const [slotInterval, setSlotInterval] = useState<30 | 60>((eventToEdit?.slotIntervalMinutes as 30 | 60) ?? 60);

  // Selezione intervallo rapido (da data a data)
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [rangeStart, setRangeStart] = useState(tomorrowStr);
  const [rangeEnd, setRangeEnd] = useState(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // STEP 3: Invitati & Priorità
  const [selectedInvitees, setSelectedInvitees] = useState<
    { user: User; isMandatory: boolean }[]
  >(() => {
    if (eventToEdit?.invitees && eventToEdit.invitees.length > 0) {
      return eventToEdit.invitees.map((inv) => {
        const u =
          allUsers.find((user) => user.id === inv.userId) ||
          (inv.userId === currentUser.id
            ? currentUser
            : { id: inv.userId, name: 'Utente', surname: '', email: '', role: 'user' as const });
        return { user: u, isMandatory: inv.isMandatory };
      });
    }
    return [{ user: currentUser, isMandatory: true }];
  });

  // Stato tendina membri registrati
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownFilterQuery, setDropdownFilterQuery] = useState('');

  // Stato input manuale per nome/email
  const [manualNameInput, setManualNameInput] = useState('');
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [showManualAddFields, setShowManualAddFields] = useState(false);
  const [directEmailInput, setDirectEmailInput] = useState('');
  const [externalInviteEmails, setExternalInviteEmails] = useState<string[]>(
    eventToEdit?.externalInviteEmails || []
  );

  // Lista nuovi utenti generati al volo durante la creazione
  const [newlyCreatedUsers, setNewlyCreatedUsers] = useState<User[]>([]);

  // Formatta data per chip visivo (es. "Lun 13 Ott")
  const formatDateChip = (dateStr: string) => {
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

  // Navigazione mese calendario
  const handlePrevMonth = () => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Toggle giorno sul calendario
  const handleToggleCalendarDate = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      if (selectedDates.length > 1) {
        setSelectedDates(selectedDates.filter((d) => d !== dateStr));
        setDateWarning(null);
      } else {
        setDateWarning('Devi mantenere almeno un giorno selezionato.');
        setTimeout(() => setDateWarning(null), 3000);
      }
    } else {
      if (selectedDates.length >= 15) {
        setDateWarning('Hai raggiunto il limite massimo di 15 giorni per questo evento.');
        setTimeout(() => setDateWarning(null), 3500);
        return;
      }
      setDateWarning(null);
      setSelectedDates([...selectedDates, dateStr].sort());
    }
  };

  // Rimuovi data singola dai chip
  const handleRemoveDate = (dateToRemove: string) => {
    if (selectedDates.length > 1) {
      setSelectedDates(selectedDates.filter((d) => d !== dateToRemove));
      setDateWarning(null);
    } else {
      setDateWarning('Devi mantenere almeno un giorno selezionato.');
      setTimeout(() => setDateWarning(null), 3000);
    }
  };

  // Funzioni per scegliere più giorni "in un colpo solo"
  const handleAddConsecutiveDays = (count: number) => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1); // da domani
    const newDates: string[] = [];
    for (let i = 0; i < count && newDates.length < 15; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      newDates.push(d.toISOString().split('T')[0]);
    }
    setDateWarning(null);
    setSelectedDates(newDates.sort());
  };

  const handleSelectWorkWeek = () => {
    const baseDate = new Date();
    const dayOfWeek = baseDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(monday.getDate() + (diffToMonday === 0 ? 7 : diffToMonday));

    const newDates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      newDates.push(d.toISOString().split('T')[0]);
    }
    setDateWarning(null);
    setSelectedDates(newDates.sort());
  };

  const handleApplyRange = () => {
    if (!rangeStart || !rangeEnd) return;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    if (start > end) {
      setDateWarning('La data di inizio deve essere precedente alla data di fine.');
      setTimeout(() => setDateWarning(null), 3500);
      return;
    }
    const days: string[] = [];
    const cur = new Date(start);
    while (cur <= end && days.length < 15) {
      days.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    if (days.length === 0) return;
    setDateWarning(null);
    setSelectedDates(days.sort());
    setShowRangePicker(false);
  };

  // Generatore di tutti gli slot possibili in base alle date e alla fascia oraria da... a...
  const getAllPossibleSlots = () => {
    // Se pre-compilato da richiesta cliente B2B, usa ESATTAMENTE i 2 o 3 slot scelti dal cliente
    if (prefillData?.fixedSlots && prefillData.fixedSlots.length > 0) {
      return prefillData.fixedSlots.map((s) => ({
        slotKey: s.slotKey,
        date: s.date,
        time: s.startTime,
      }));
    }

    const slots: { slotKey: string; date: string; time: string }[] = [];
    for (const date of selectedDates) {
      for (let h = startHour; h < endHour; h++) {
        const minutes = slotInterval === 30 ? [0, 30] : [0];
        for (const m of minutes) {
          const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          slots.push({ slotKey: `${date}T${time}`, date, time });
        }
      }
    }
    return slots;
  };

  // Calcolo celle calendario
  const calYear = calendarViewDate.getFullYear();
  const calMonth = calendarViewDate.getMonth();
  const firstDayOfMonth = new Date(calYear, calMonth, 1);
  const lastDayOfMonth = new Date(calYear, calMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Lunedì = 0
  const monthNameStr = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(calendarViewDate);
  const monthCapitalized = monthNameStr.charAt(0).toUpperCase() + monthNameStr.slice(1);

  // Helper invitati dalla tendina
  const handleToggleUserFromDropdown = (user: User) => {
    const alreadySelected = selectedInvitees.some((i) => i.user.id === user.id);
    if (alreadySelected) {
      if (user.id !== currentUser.id) {
        setSelectedInvitees(selectedInvitees.filter((i) => i.user.id !== user.id));
      }
    } else {
      setSelectedInvitees([
        ...selectedInvitees,
        {
          user,
          isMandatory: Boolean(user.role?.includes('Presidente') || user.role?.includes('Responsabile')),
        },
      ]);
    }
  };

  // Inserimento manuale per nome/email
  const handleAddManualPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNameInput.trim()) return;

    const trimmedName = manualNameInput.trim();
    const parts = trimmedName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'JESic';
    const emailVal =
      manualEmailInput.trim() ||
      `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@jesic.it`;

    const existing = [...allUsers, ...newlyCreatedUsers].find(
      (u) => u.email.toLowerCase() === emailVal.toLowerCase()
    );

    if (existing) {
      if (!selectedInvitees.some((i) => i.user.id === existing.id)) {
        setSelectedInvitees([...selectedInvitees, { user: existing, isMandatory: false }]);
      }
    } else {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: firstName,
        surname: lastName,
        email: emailVal,
        role: 'user',
        jesicRole: 'Consulente Junior',
        googleCalendarConnected: false,
      };

      setNewlyCreatedUsers([...newlyCreatedUsers, newUser]);
      setSelectedInvitees([...selectedInvitees, { user: newUser, isMandatory: false }]);
    }

    setManualNameInput('');
    setManualEmailInput('');
    setShowManualAddFields(false);
  };

  // Inserimento rapido diretto via email (sia dentro che fuori dal gruppo)
  const handleDirectEmailAdd = () => {
    const emailClean = directEmailInput.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) return;

    const existing = combinedRegisteredUsers.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      if (!selectedInvitees.some((i) => i.user.id === existing.id)) {
        setSelectedInvitees([...selectedInvitees, { user: existing, isMandatory: false }]);
      }
    } else {
      const [localPart] = emailClean.split('@');
      const derivedName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
      const newUser: User = {
        id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: derivedName,
        surname: '',
        email: emailClean,
        role: 'user',
        systemRole: 'associate',
        googleCalendarConnected: false,
      };
      setNewlyCreatedUsers((prev) => [...prev, newUser]);
      setSelectedInvitees((prev) => [...prev, { user: newUser, isMandatory: false }]);
    }

    if (!externalInviteEmails.includes(emailClean)) {
      setExternalInviteEmails((prev) => [...prev, emailClean]);
    }
    setDirectEmailInput('');
  };

  const toggleInviteeMandatory = (userId: string) => {
    setSelectedInvitees((prev) =>
      prev.map((item) =>
        item.user.id === userId
          ? { ...item, isMandatory: !item.isMandatory }
          : item
      )
    );
  };

  const handleRemoveInvitee = (userId: string) => {
    if (userId === currentUser.id) return;
    setSelectedInvitees(selectedInvitees.filter((i) => i.user.id !== userId));
  };

  const combinedRegisteredUsers = [...allUsers, ...newlyCreatedUsers];
  const filteredDropdownUsers = combinedRegisteredUsers.filter((u) =>
    `${u.name} ${u.surname} ${u.role || ''} ${u.email}`
      .toLowerCase()
      .includes(dropdownFilterQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedDates.length === 0) return;

    const meetLink =
      meetingType === 'online'
        ? `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`
        : undefined;

    const inviteesConfig: InviteeConfig[] = selectedInvitees.map((i) => ({
      userId: i.user.id,
      isMandatory: i.isMandatory,
    }));

    if (eventToEdit && onUpdateEvent) {
      onUpdateEvent({
        ...eventToEdit,
        title: title.trim(),
        description: description.trim(),
        dates: selectedDates,
        startHour,
        endHour,
        slotIntervalMinutes: slotInterval,
        type: meetingType,
        location: meetingType === 'in_person' ? location : undefined,
        meetLink: meetingType === 'online' ? (eventToEdit.meetLink || meetLink) : undefined,
        pollDeadline: new Date(pollDeadline).toISOString(),
        invitees: inviteesConfig,
        groupId: activeGroup?.id || eventToEdit.groupId,
        externalInviteEmails: externalInviteEmails.length > 0 ? externalInviteEmails : eventToEdit.externalInviteEmails,
      });
      onClose();
      return;
    }

    // L'organizzatore non pre-compila tutti gli slot in automatico: compilerà successivamente come tutti gli altri
    onCreateEvent(
      {
        title: title.trim(),
        description: description.trim(),
        creatorId: currentUser.id,
        eventType: 'poll',
        dates: selectedDates,
        startHour,
        endHour,
        slotIntervalMinutes: slotInterval,
        type: meetingType,
        location: meetingType === 'in_person' ? location : undefined,
        meetLink,
        pollDeadline: new Date(pollDeadline).toISOString(),
        status: 'voting',
        invitees: inviteesConfig,
        clientRequestId: prefillData?.clientRequestId,
        clientInfo: prefillData?.clientInfo,
        allowedSlots: prefillData?.fixedSlots?.map((s) => s.slotKey),
        groupId: activeGroup?.id,
        externalInviteEmails: externalInviteEmails.length > 0 ? externalInviteEmails : undefined,
      },
      [], // Inizialmente nessun orario spuntato in automatico
      newlyCreatedUsers
    );
  };

  const slotsPerDay = (endHour - startHour) * (slotInterval === 30 ? 2 : 1);
  const totalSlots = selectedDates.length * slotsPerDay;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-xl sm:max-w-2xl md:max-w-3xl max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        
        {/* Header con Step indicator (3 step) */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
              {eventToEdit ? 'Modifica Sondaggio' : `Step ${step} di 3`}
            </span>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">
              {step === 1 && 'Dettagli Riunione'}
              {step === 2 && 'Date & Fascia Oraria'}
              {step === 3 && 'Invita Membri & Priorità'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="h-1 bg-neutral-100 dark:bg-neutral-800 w-full flex">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* STEP 1: INFO GENERALI */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Titolo Riunione *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Board Direttivo JESic, Allineamento Clienti..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Descrizione & Obiettivi
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ordine del giorno, note organizzative..."
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                />
              </div>

              {/* Modalità: Online vs In presenza */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Modalità di Incontro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingType('online')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      meetingType === 'online'
                        ? 'border-red-600 bg-red-50/50 dark:bg-red-950/40 text-red-950 dark:text-red-200 font-bold ring-1 ring-red-500'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Video className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Online (Google Meet)</span>
                    </div>
                    <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                      Link Meet generato automaticamente
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType('in_person')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      meetingType === 'in_person'
                        ? 'border-red-600 bg-red-50/50 dark:bg-red-950/40 text-red-950 dark:text-red-200 font-bold ring-1 ring-red-500'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>In presenza</span>
                    </div>
                    <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                      Presso sede o aula
                    </span>
                  </button>
                </div>
              </div>

              {meetingType === 'in_person' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Luogo / Sede
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Es. Sede JESic - Aula Magna, Catania"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div
                onClick={handleOpenDeadlinePicker}
                className="cursor-pointer group p-3 bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-[#f23e2e]/50 dark:hover:border-[#f23e2e]/50 transition-all shadow-2xs"
              >
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5 cursor-pointer select-none">
                  <Calendar className="w-3.5 h-3.5 text-[#f23e2e]" />
                  <span>Scadenza Sondaggio (Poll Deadline)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={pollDeadlineInputRef}
                    type="datetime-local"
                    required
                    value={pollDeadline}
                    onChange={(e) => setPollDeadline(e.target.value)}
                    className="w-full relative px-3.5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] hover:border-[#f23e2e]/60 dark:hover:border-[#f23e2e]/60 transition-all cursor-pointer overflow-hidden"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 select-none">
                  I partecipanti riceveranno un promemoria 24 ore prima della scadenza.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & FASCIA ORARIA (SEMPLIFICATO - CALENDARIO MULTI-SELEZIONE + FASCIA DA... A...) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Alert Warning se superato limite o errore date */}
              {dateWarning && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{dateWarning}</span>
                </div>
              )}

              {/* Banner se originato da conversione Richiesta Cliente B2B con slot vincolati */}
              {prefillData?.fixedSlots && prefillData.fixedSlots.length > 0 && (
                <div className="bg-red-50/90 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-[#f23e2e] uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Slot Vincolati alla Richiesta del Cliente ({prefillData.clientInfo?.companyName || 'B2B'})</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    Questo sondaggio team è pre-compilato con <strong>esattamente i {prefillData.fixedSlots.length} slot indicati dal cliente</strong>. Gli associati interni voteranno esclusivamente su queste opzioni:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {prefillData.fixedSlots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="py-1.5 px-3 rounded-xl bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900 text-xs font-bold text-neutral-900 dark:text-white shadow-2xs flex items-center gap-2"
                      >
                        <span className="text-[#f23e2e]">Opzione {sIdx + 1}:</span>
                        <span>{slot.date}</span>
                        <span className="font-mono text-[11px] text-[#f23e2e]">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GRIGLIA A 2 COLONNE: CALENDARIO MULTI-GIORNO ACCANTO ALLA FASCIA ORARIA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. CALENDARIO PER SELEZIONARE PIÙ GIORNI "IN UN COLPO SOLO" */}
                <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
                  <div>
                    {/* Header mese con frecce */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {monthCapitalized}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                          title="Mese precedente"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                          title="Mese successivo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Intestazione giorni settimana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 mb-1">
                      <span>Lu</span>
                      <span>Ma</span>
                      <span>Me</span>
                      <span>Gi</span>
                      <span>Ve</span>
                      <span>Sa</span>
                      <span>Do</span>
                    </div>

                    {/* Griglia giorni del mese */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isPast = dateStr < todayStr;
                        const isSelected = selectedDates.includes(dateStr);
                        const isToday = dateStr === todayStr;

                        return (
                          <button
                            type="button"
                            key={dateStr}
                            disabled={isPast}
                            onClick={() => handleToggleCalendarDate(dateStr)}
                            className={`h-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer relative ${
                              isSelected
                                ? 'bg-red-600 text-white font-black shadow-xs ring-2 ring-red-400/40 scale-105'
                                : isPast
                                ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed opacity-30'
                                : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                            } ${isToday && !isSelected ? 'border border-red-500 font-extrabold text-red-600 dark:text-red-400' : ''}`}
                            title={isPast ? 'Data passata' : dateStr}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pulsanti per scegliere più giorni in un colpo solo */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                      <span>Scegli in un colpo solo:</span>
                      <button
                        type="button"
                        onClick={() => setShowRangePicker(!showRangePicker)}
                        className="text-red-600 dark:text-red-400 hover:underline cursor-pointer lowercase"
                      >
                        {showRangePicker ? 'chiudi intervallo' : 'intervallo da... a...'}
                      </button>
                    </div>

                    {showRangePicker ? (
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="date"
                            min={todayStr}
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-medium"
                          />
                          <input
                            type="date"
                            min={rangeStart || todayStr}
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyRange}
                          className="w-full py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Applica Intervallo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleAddConsecutiveDays(3)}
                          className="py-1 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +3 Giorni
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectWorkWeek}
                          className="py-1 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Settimana (Lun-Ven)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddConsecutiveDays(7)}
                          className="py-1 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +7 Giorni
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDates([tomorrowStr])}
                          className="py-1 px-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-[10px] flex items-center gap-0.5 ml-auto cursor-pointer"
                          title="Ripristina a solo domani"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. ACCANTO AL CALENDARIO: FASCIA ORARIA (DA ... A ...) */}
                <div className="bg-neutral-50/80 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/70 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        <span>Fascia Oraria</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                        {endHour - startHour} ore al giorno
                      </span>
                    </div>

                    {/* Bottone indicatore fascia oraria da... a... */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-center shadow-2xs mb-3">
                      <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                        Fascia Oraria Selezionata
                      </p>
                      <p className="text-base font-black text-neutral-900 dark:text-white font-mono mt-0.5">
                        Da {String(startHour).padStart(2, '0')}:00 a {String(endHour).padStart(2, '0')}:00
                      </p>
                    </div>

                    {/* Tendine Da ... A ... */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                          Da (Ora Inizio)
                        </label>
                        <select
                          value={startHour}
                          onChange={(e) => {
                            const newStart = Number(e.target.value);
                            setStartHour(newStart);
                            if (endHour <= newStart) {
                              setEndHour(Math.min(24, newStart + 2));
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 5).map((h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                          A (Ora Fine)
                        </label>
                        <select
                          value={endHour}
                          onChange={(e) => {
                            const newEnd = Number(e.target.value);
                            setEndHour(newEnd);
                            if (startHour >= newEnd) {
                              setStartHour(Math.max(0, newEnd - 1));
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 5)
                            .filter((h) => h > startHour)
                            .map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Durata Slot */}
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Durata Slot
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSlotInterval(60)}
                        className={`py-1.5 text-xs rounded-xl font-bold transition-all border cursor-pointer ${
                          slotInterval === 60
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        60 minuti (1h)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlotInterval(30)}
                        className={`py-1.5 text-xs rounded-xl font-bold transition-all border cursor-pointer ${
                          slotInterval === 30
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        30 minuti
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* CHIP DEI GIORNI PROPOSTI (Spuntano come adesso, con badge chiaro e pulsante X) */}
              <div className="bg-neutral-50/70 dark:bg-neutral-800/40 p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Giorni Proposti ({selectedDates.length} di max 15)
                  </label>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    Totale: {totalSlots} slot orari nel sondaggio
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedDates.map((dateStr) => (
                    <span
                      key={dateStr}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900 text-xs font-bold shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                      <span>{formatDateChip(dateStr)}</span>
                      {selectedDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(dateStr)}
                          className="hover:text-red-600 dark:hover:text-red-400 ml-0.5 p-0.5 rounded cursor-pointer transition-colors"
                          title="Rimuovi data"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: INVITA PERSONE & PRIORITÀ (TENDINA CON RICERCA + INSERIMENTO NOME/EMAIL + PRIORITÀ) */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-3 text-xs text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white mb-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>Priorità Membri Essenziali (⭐)</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Contrassegna come <strong>Essenziale (⭐)</strong> le persone indispensabili per la riunione.
                  L'algoritmo di matching garantirà la loro presenza al 100%.
                </p>
              </div>

              {/* BANNER SE APERTO DENTRO UN GRUPPO: INVITO RAPIDO MEMBRI GRUPPO */}
              {activeGroup && (
                <div className="bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0 p-1 bg-white dark:bg-neutral-800 rounded-xl border border-red-100 dark:border-red-900/40">
                      {activeGroup.avatar || '👥'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-neutral-900 dark:text-white truncate">
                        Gruppo: {activeGroup.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {activeGroup.members.length} membri in questo gruppo
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const groupUserIds = activeGroup.members.map((m) => m.userId);
                      const groupUsers = allUsers.filter((u) => groupUserIds.includes(u.id));
                      const newSelected = [...selectedInvitees];
                      groupUsers.forEach((u) => {
                        if (!newSelected.some((item) => item.user.id === u.id)) {
                          newSelected.push({ user: u, isMandatory: false });
                        }
                      });
                      setSelectedInvitees(newSelected);
                    }}
                    className="px-3 py-1.5 bg-[#f23e2e] hover:bg-red-600 text-white rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    + Invita tutti i membri
                  </button>
                </div>
              )}

              {/* INVITO DIRETTO TRAMITE EMAIL (CASO UTENTE FUORI DAL GRUPPO & INVITATI ESTERNI) */}
              <div className="bg-neutral-50 dark:bg-neutral-800/80 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#f23e2e]" />
                    <span>Invita per indirizzo email {!activeGroup ? '(Fuori dal gruppo)' : ''}</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Rapido & Diretto
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={directEmailInput}
                    onChange={(e) => setDirectEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDirectEmailAdd();
                      }
                    }}
                    placeholder="Es. collega@jesic.it oppure mario@azienda.com"
                    className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleDirectEmailAdd}
                    disabled={!directEmailInput.trim()}
                    className="px-3.5 py-2 bg-[#f23e2e] hover:bg-red-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                  >
                    + Invita
                  </button>
                </div>
              </div>

              {/* TENDINA PER SELEZIONARE DAI REGISTRATI */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>
                      Scegli tra i membri registrati ({combinedRegisteredUsers.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      isDropdownOpen ? 'rotate-180 text-red-600 dark:text-red-400' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="mt-2 p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl space-y-2 animate-in fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                      <input
                        type="text"
                        autoFocus
                        value={dropdownFilterQuery}
                        onChange={(e) => setDropdownFilterQuery(e.target.value)}
                        placeholder="Scrivi il nome o ruolo per filtrare..."
                        className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-medium focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {filteredDropdownUsers.length === 0 ? (
                        <p className="text-xs text-neutral-400 p-2 text-center">
                          Nessun membro corrisponde alla ricerca.
                        </p>
                      ) : (
                        filteredDropdownUsers.map((user) => {
                          const isSelected = selectedInvitees.some((i) => i.user.id === user.id);
                          const isCreator = user.id === currentUser.id;

                          return (
                            <button
                              type="button"
                              key={user.id}
                              onClick={() => handleToggleUserFromDropdown(user)}
                              disabled={isCreator}
                              className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-red-50/80 dark:bg-red-950/60 text-red-950 dark:text-red-200 font-semibold'
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <UserAvatar user={user} size="sm" />
                                <div className="truncate">
                                  <p className="truncate text-neutral-900 dark:text-white">
                                    {user.name} {user.surname}
                                    {isCreator && ' (Tu - Organizzatore)'}
                                  </p>
                                  <p className="text-[10px] text-neutral-400 truncate">
                                    {user.role ? `${user.role} · ${user.email}` : user.email}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 ml-2">
                                {isSelected ? (
                                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                                    <Check className="w-3 h-3 stroke-[3px]" />
                                    Aggiunto
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                                    + Aggiungi
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* INSERIMENTO DIRETTO PER NOME O EMAIL */}
              <div className="bg-neutral-50 dark:bg-neutral-800/80 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                {!showManualAddFields ? (
                  <button
                    type="button"
                    onClick={() => setShowManualAddFields(true)}
                    className="w-full text-left text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Inserisci una persona digitando il nome o email</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Inserisci invitato direttamente
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowManualAddFields(false)}
                        className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={manualNameInput}
                        onChange={(e) => setManualNameInput(e.target.value)}
                        placeholder="Nome e Cognome (es. Luca Bianchi)"
                        className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs"
                      />
                      <input
                        type="email"
                        value={manualEmailInput}
                        onChange={(e) => setManualEmailInput(e.target.value)}
                        placeholder="Email (opzionale)"
                        className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddManualPerson}
                      disabled={!manualNameInput.trim()}
                      className="w-full py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Aggiungi alla lista invitati
                    </button>
                  </div>
                )}
              </div>

              {/* LISTA INVITATI SELEZIONATI CON TOGGLE ESSENZIALE/OPZIONALE */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Invitati alla riunione ({selectedInvitees.length}):
                </p>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {selectedInvitees.map(({ user, isMandatory }) => {
                    const isCreator = user.id === currentUser.id;
                    return (
                      <div
                        key={user.id}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <UserAvatar user={user} size="sm" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {user.name} {user.surname}
                              {isCreator && ' (Organizzatore)'}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {user.role} · {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Azioni: Toggle Priorità Essenziale & Rimuovi */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleInviteeMandatory(user.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isMandatory
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                            }`}
                            title="Cambia tra Essenziale e Opzionale"
                          >
                            <Star
                              className={`w-3 h-3 ${isMandatory ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'}`}
                            />
                            <span>{isMandatory ? 'Essenziale' : 'Opzionale'}</span>
                          </button>

                          {!isCreator && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInvitee(user.id)}
                              className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded cursor-pointer"
                              title="Rimuovi invitato"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigazione Step (1, 2, 3) */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-800/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="py-2 px-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Indietro
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !title.trim()}
              onClick={() => setStep((step + 1) as 2 | 3)}
              className="py-2 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/30 cursor-pointer"
            >
              <span>Avanti</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="py-2.5 px-5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/40 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{eventToEdit ? 'Salva Modifiche Sondaggio' : 'Crea & Avvia Sondaggio'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
