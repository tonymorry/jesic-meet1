/**
 * JESic Meet - Calendario Grafico In-App (Vista Mensile & Settimanale)
 * 
 * Specifiche da implementare:
 * - Un vero e proprio calendario visivo (vista mensile e settimanale)
 * - Mostra SOLTANTO gli eventi di JESic:
 *     1. Le riunioni nate dai sondaggi che sono state confermate e a cui l'utente partecipa.
 *     2. Gli "Eventi Associativi" (creati dagli Admin) che l'utente ha accettato premendo "Partecipa" nella bacheca.
 * - Cliccando su un evento nel calendario, si apre un modal con i dettagli (chi partecipa, data, ora, luogo, link Google Meet).
 */

import React, { useState } from 'react';
import { MeetingEvent, User } from '../types';
import { isEventPassed } from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  MapPin,
  Users,
  ExternalLink,
  X,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  Edit3,
} from 'lucide-react';
import { EditConfirmedPollModal } from './EditConfirmedPollModal';

interface CalendarViewProps {
  currentUser: User;
  allEvents: MeetingEvent[];
  allUsers: User[];
  onOpenEventDetail?: (event: MeetingEvent) => void;
  onEventUpdated?: (updatedEvent: MeetingEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  allEvents,
  allUsers,
  onOpenEventDetail,
  onEventUpdated,
}) => {
  // Modalità visualizzazione: 'month' (mensile) o 'week' (settimanale)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [pollToEditConfirmed, setPollToEditConfirmed] = useState<MeetingEvent | null>(null);

  // Mese/Anno o Data corrente selezionata
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<MeetingEvent | null>(null);

  // FILTRO FONDAMENTALE SPECIFICA:
  // Mostra SOLTANTO gli eventi di JESic:
  // A) Riunioni da sondaggio confermate ('poll' && status === 'confirmed' && utente tra gli invitati o creatore)
  // B) Eventi Associativi accettati ('official' && status === 'confirmed' && participant status === 'accepted')
  const visibleEvents = allEvents.filter((e) => {
    if (e.eventType === 'official') {
      // Deve aver accettato premendo "Partecipa" (o essere il creatore)
      if (e.creatorId === currentUser.id) return true;
      const participant = e.participants?.find((p) => p.userId === currentUser.id);
      return participant?.status === 'accepted';
    } else {
      // Sondaggio confermato
      if (e.status !== 'confirmed') return false;
      const isInvited = e.invitees.some((i) => i.userId === currentUser.id);
      return isInvited || e.creatorId === currentUser.id;
    }
  });

  // Mese visualizzato
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Helper navigazione
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Calcolo celle griglia mensile
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // getDay(): 0 è domenica, convertiamo in 0 per Lunedì, 6 per Domenica
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const getEventDate = (evt: MeetingEvent): string => {
    if (evt.finalizedSlot?.date) return evt.finalizedSlot.date;
    if (typeof evt.finalDate === 'object' && (evt.finalDate as any)?.date) return String((evt.finalDate as any).date);
    if (typeof evt.finalDate === 'string' && evt.finalDate) return evt.finalDate;
    return evt.dates?.[0] || '';
  };

  const getEventStartTime = (evt: MeetingEvent): string => {
    if (evt.finalizedSlot?.startTime) return evt.finalizedSlot.startTime;
    if (typeof evt.finalDate === 'object' && (evt.finalDate as any)?.startTime) return String((evt.finalDate as any).startTime);
    if (evt.startHour !== undefined && evt.startHour !== null) return `${String(evt.startHour).padStart(2, '0')}:00`;
    return '09:00';
  };

  const getEventEndTime = (evt: MeetingEvent): string => {
    if (evt.finalizedSlot?.endTime) return evt.finalizedSlot.endTime;
    if (typeof evt.finalDate === 'object' && (evt.finalDate as any)?.endTime) return String((evt.finalDate as any).endTime);
    if (evt.endHour !== undefined && evt.endHour !== null) return `${String(evt.endHour).padStart(2, '0')}:00`;
    return '10:00';
  };

  // Mappa di eventi per data 'YYYY-MM-DD'
  const eventsByDate = new Map<string, MeetingEvent[]>();
  visibleEvents.forEach((evt) => {
    const dateKey = getEventDate(evt);
    if (dateKey) {
      const list = eventsByDate.get(dateKey) || [];
      list.push(evt);
      eventsByDate.set(dateKey, list);
    }
  });

  // Calcolo giorni della settimana corrente (per vista settimanale)
  const getWeekDates = (baseDate: Date): Date[] => {
    const day = (baseDate.getDay() + 6) % 7; // Lunedi = 0
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - day);
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const currentWeekDates = getWeekDates(currentDate);

  const formatIsoDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatIsoDate(new Date());

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 sm:px-6 pt-2">
      
      {/* Header Calendario */}
      <div className="pt-2 pb-1 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Calendario JESic</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e]">
                {visibleEvents.length} Impegni
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Solo meeting confermati ed eventi ufficiali a cui partecipi
            </p>
          </div>

          {/* Switch Mese / Settimana */}
          <div className="flex p-0.5 bg-neutral-200/80 dark:bg-neutral-800 rounded-xl border border-neutral-300/60 dark:border-neutral-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-2xs font-black'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Mese
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-2xs font-black'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Settimana
            </button>
          </div>
        </div>
      </div>

      {/* Barra di Navigazione Mese / Settimana */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-neutral-900 dark:text-white capitalize">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            Oggi
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Successivo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VISTA 1: MENSILE */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-3.5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-2">
          
          {/* Intestazione Giorni Settimana */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-neutral-400 uppercase tracking-wider pb-1">
            {daysOfWeek.map((d) => (
              <div key={d} className="py-0.5">{d}</div>
            ))}
          </div>

          {/* Griglia Giorni Mese */}
          <div className="grid grid-cols-7 gap-1">
            {/* Slot vuoti prima del primo giorno del mese */}
            {Array.from({ length: startDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 sm:h-20 md:h-28 lg:h-32 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/20" />
            ))}

            {/* Giorni del mese */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayEvents = eventsByDate.get(dateStr) || [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  className={`h-16 sm:h-20 md:h-28 lg:h-32 p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-[#f23e2e] bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-500/30'
                      : 'border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-mono leading-none ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#f23e2e] text-white font-black flex items-center justify-center'
                          : 'font-bold text-neutral-700 dark:text-neutral-300 pl-0.5'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f23e2e] mr-0.5" />
                    )}
                  </div>

                  {/* Micro-eventi badge */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onOpenEventDetail ? onOpenEventDetail(ev) : setSelectedCalendarEvent(ev)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] font-black truncate block cursor-pointer transition-transform hover:scale-102 ${
                          ev.eventType === 'official'
                            ? 'bg-[#f23e2e] text-white'
                            : 'bg-neutral-800 text-white dark:bg-neutral-700'
                        }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] font-bold text-[#f23e2e] block text-center">
                        +{dayEvents.length - 3} altri
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: SETTIMANALE */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="space-y-2">
            {currentWeekDates.map((dateObj) => {
              const dateStr = formatIsoDate(dateObj);
              const dayEvents = eventsByDate.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const dayName = daysOfWeek[(dateObj.getDay() + 6) % 7];

              return (
                <div
                  key={dateStr}
                  className={`p-3 rounded-2xl border transition-all ${
                    isToday
                      ? 'border-[#f23e2e] bg-red-50/40 dark:bg-red-950/20'
                      : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200/60 dark:border-neutral-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-neutral-400">
                        {dayName}
                      </span>
                      <span
                        className={`text-xs font-mono font-black ${
                          isToday ? 'text-[#f23e2e]' : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {dateObj.getDate()} {monthNames[dateObj.getMonth()]}
                      </span>
                    </div>

                    {isToday && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f23e2e] text-white">
                        Oggi
                      </span>
                    )}
                  </div>

                  {/* Lista eventi in questo giorno */}
                  <div className="pt-2 space-y-1.5">
                    {dayEvents.length === 0 ? (
                      <p className="text-[11px] text-neutral-400 italic py-0.5">
                        Nessun impegno JESic programmato
                      </p>
                    ) : (
                      dayEvents.map((ev) => {
                        const startTime = ev.finalizedSlot?.startTime || `${String(ev.startHour).padStart(2, '0')}:00`;
                        const endTime = ev.finalizedSlot?.endTime || `${String(ev.endHour).padStart(2, '0')}:00`;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => onOpenEventDetail ? onOpenEventDetail(ev) : setSelectedCalendarEvent(ev)}
                            className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-between cursor-pointer hover:border-[#f23e2e] transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-black text-neutral-900 dark:text-white truncate">
                                  {ev.title}
                                </h4>
                                {ev.eventType === 'official' && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950 text-[#f23e2e]">
                                    Ufficiale
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-[#f23e2e]">{startTime} - {endTime}</span>
                                <span>•</span>
                                <span>{ev.type === 'online' ? 'Google Meet' : ev.location || 'Sede'}</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              className="text-xs font-bold text-[#f23e2e] ml-2 shrink-0"
                            >
                              Dettagli →
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FEED LISTA IMPEGNI SOTTOSTANTE */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#f23e2e]" />
          <span>Tutti gli impegni JESic ({visibleEvents.length})</span>
        </h3>

        {visibleEvents.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4">
            Nessun evento confermato o accettato al momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleEvents.map((ev) => {
              const eventDate = ev.finalizedSlot?.date || ev.dates[0];
              const startTime = ev.finalizedSlot?.startTime || `${String(ev.startHour).padStart(2, '0')}:00`;
              const endTime = ev.finalizedSlot?.endTime || `${String(ev.endHour).padStart(2, '0')}:00`;

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedCalendarEvent(ev)}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between gap-3 cursor-pointer hover:border-[#f23e2e] transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ev.eventType === 'official' ? 'bg-[#f23e2e]' : 'bg-neutral-900 dark:bg-white'
                        }`}
                      />
                      <h4 className="text-xs font-black text-neutral-900 dark:text-white truncate">
                        {ev.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {eventDate} • {startTime} - {endTime}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    Confermato
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETTAGLI EVENTO DA CALENDARIO */}
      {selectedCalendarEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e] inline-block">
                    {selectedCalendarEvent.eventType === 'official' ? 'Evento Associativo Ufficiale' : 'Riunione Confermata da Sondaggio'}
                  </span>
                  {isEventPassed(selectedCalendarEvent) && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-750">
                      Concluso
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black tracking-tight">
                  {selectedCalendarEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarEvent(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dettagli Principali */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/70 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold">
                <CalendarIcon className="w-4 h-4 text-[#f23e2e]" />
                <span>
                  {selectedCalendarEvent.finalizedSlot?.date || selectedCalendarEvent.dates[0]}
                </span>
              </div>

              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="font-mono font-semibold">
                  {selectedCalendarEvent.finalizedSlot?.startTime || `${String(selectedCalendarEvent.startHour).padStart(2, '0')}:00`} - {selectedCalendarEvent.finalizedSlot?.endTime || `${String(selectedCalendarEvent.endHour).padStart(2, '0')}:00`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                {selectedCalendarEvent.type === 'online' ? (
                  <>
                    <Video className="w-4 h-4 text-blue-500" />
                    <span>Meeting Online</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>{selectedCalendarEvent.location || 'Sede JESic'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Descrizione */}
            {selectedCalendarEvent.description && (
              <div className="text-xs text-neutral-600 dark:text-neutral-300 p-3 bg-neutral-50/60 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <p className="font-bold text-neutral-900 dark:text-white mb-1 text-[11px] uppercase tracking-wider">
                  Descrizione
                </p>
                <p className="leading-relaxed">{selectedCalendarEvent.description}</p>
              </div>
            )}

            {/* Link Google Meet se presente */}
            {selectedCalendarEvent.type === 'online' && selectedCalendarEvent.meetLink && (
              <a
                href={selectedCalendarEvent.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Entra con Google Meet</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            {/* Chi partecipa */}
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>Chi partecipa</span>
              </h4>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {(() => {
                  // Se official, guarda participants accepted
                  if (selectedCalendarEvent.eventType === 'official') {
                    const acceptedParticipants = (selectedCalendarEvent.participants || [])
                      .filter((p) => p.status === 'accepted')
                      .map((p) => allUsers.find((u) => u.id === p.userId))
                      .filter(Boolean) as User[];

                    if (acceptedParticipants.length === 0) {
                      return <p className="text-xs text-neutral-400 italic">Nessun partecipante confermato.</p>;
                    }

                    return acceptedParticipants.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{u.name} {u.surname}</span>
                        {u.role && <span className="text-[10px] text-neutral-400 font-normal">({u.role})</span>}
                      </div>
                    ));
                  } else {
                    // Sondaggio When2meet
                    return selectedCalendarEvent.invitees.map((inv) => {
                      const u = allUsers.find((user) => user.id === inv.userId);
                      if (!u) return null;
                      return (
                        <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{u.name} {u.surname}</span>
                          {inv.isMandatory && (
                            <span className="text-[9px] bg-red-100 dark:bg-red-950 text-[#f23e2e] px-1 rounded font-bold">
                              Essenziale
                            </span>
                          )}
                        </div>
                      );
                    });
                  }
                })()}
              </div>
            </div>

            {/* Azioni Modifica per il creatore / admin */}
            {(selectedCalendarEvent.creatorId === currentUser.id || currentUser.role === 'admin') && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const evtToEdit = selectedCalendarEvent;
                    setSelectedCalendarEvent(null);
                    setPollToEditConfirmed(evtToEdit);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifica Data e Orario</span>
                </button>
              </div>
            )}

            {/* Chiudi */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSelectedCalendarEvent(null)}
                className="w-full py-2.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Chiudi
              </button>
            </div>

          </div>
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
