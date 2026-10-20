import React, { useState } from 'react';
import { MeetingEvent, User } from '../types';
import { Calendar, Clock, X, Check, AlertCircle, RefreshCw, CalendarDays, Sparkles } from 'lucide-react';

interface EditConfirmedPollModalProps {
  poll: MeetingEvent;
  currentUser: User;
  onClose: () => void;
  onSuccess: (updatedPoll: MeetingEvent) => void;
}

export const EditConfirmedPollModal: React.FC<EditConfirmedPollModalProps> = ({
  poll,
  currentUser,
  onClose,
  onSuccess,
}) => {
  // Estrai data iniziale in modo sicuro evitando oggetti o undefined
  const getInitialDate = (): string => {
    const fd: any = poll.finalDate;
    if (typeof fd === 'object' && fd?.date) {
      return String(fd.date);
    }
    if (typeof fd === 'string' && fd) {
      return fd;
    }
    if (poll.finalizedSlot?.date) {
      return String(poll.finalizedSlot.date);
    }
    if (poll.dates && poll.dates.length > 0 && typeof poll.dates[0] === 'string') {
      return poll.dates[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  // Estrai orario di inizio in modo sicuro
  const getInitialStartTime = (): string => {
    const fd: any = poll.finalDate;
    if (typeof fd === 'object' && fd?.startTime) {
      return String(fd.startTime);
    }
    if (poll.finalizedSlot?.startTime) {
      return String(poll.finalizedSlot.startTime);
    }
    if (poll.startHour !== undefined && poll.startHour !== null) {
      return `${String(poll.startHour).padStart(2, '0')}:00`;
    }
    return '09:00';
  };

  // Estrai orario di fine in modo sicuro
  const getInitialEndTime = (): string => {
    const fd: any = poll.finalDate;
    if (typeof fd === 'object' && fd?.endTime) {
      return String(fd.endTime);
    }
    if (poll.finalizedSlot?.endTime) {
      return String(poll.finalizedSlot.endTime);
    }
    if (poll.endHour !== undefined && poll.endHour !== null) {
      return `${String(poll.endHour).padStart(2, '0')}:00`;
    }
    return '10:00';
  };

  const initialDate = getInitialDate();
  const initialStartTime = getInitialStartTime();
  const initialEndTime = getInitialEndTime();

  // Stati locali controllati
  const [editDate, setEditDate] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formattazione data italiana per leggibilità
  const formatDateHuman = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
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

  // Calcola durata in minuti tra due orari "HH:mm"
  const setDurationFromStart = (minutesToAdd: number) => {
    if (!startTime) return;
    const [hStr, mStr] = startTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return;

    const totalMinutes = h * 60 + m + minutesToAdd;
    const newH = Math.min(23, Math.floor(totalMinutes / 60));
    const newM = totalMinutes % 60;
    setEndTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!editDate) {
      setErrorMessage('La data del meeting è obbligatoria.');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage('Gli orari di inizio e fine sono obbligatori.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMessage("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        finalDate: {
          date: editDate,
          startTime,
          endTime,
        },
        date: editDate,
        startTime,
        endTime,
        userId: currentUser.id,
        googleRefreshToken: currentUser.googleRefreshToken,
        googleAccessToken: currentUser.googleAccessToken,
      };

      const res = await fetch(`/api/polls/${poll.id}/confirmed-date`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser.googleAccessToken
            ? { Authorization: `Bearer ${currentUser.googleAccessToken}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Errore durante la sincronizzazione della data confermata'
        );
      }

      const resData = await res.json();
      const updatedPoll: MeetingEvent = resData.poll || resData.event || {
        ...poll,
        finalDate: {
          date: editDate,
          startTime,
          endTime,
        },
        dates: [editDate],
        finalizedSlot: {
          date: editDate,
          startTime,
          endTime,
        },
        startHour: parseInt(startTime.split(':')[0], 10),
        endHour: parseInt(endTime.split(':')[0], 10),
        status: 'confirmed',
      };

      onSuccess(updatedPoll);
      onClose();
    } catch (err: any) {
      console.error('Errore modifica data/ora evento confermato:', err);
      setErrorMessage(
        err.message || 'Si è verificato un errore durante il salvataggio. Riprova.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date alternative candidate del sondaggio
  const candidateDates = (poll.dates || []).filter((d) => Boolean(d));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className="relative z-10 w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Intestazione */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white leading-tight">
                Modifica Data e Orario
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-xs sm:max-w-sm">
                {poll.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form con preventDefault immediato */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* =========================================================================
              1. SEZIONE PER SELEZIONARE IL GIORNO (Può anche rimanere lo stesso)
             ========================================================================= */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label
                htmlFor="edit-confirmed-date"
                className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-[#f23e2e]" />
                <span>1. Seleziona il Giorno</span>
              </label>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                (può anche rimanere lo stesso)
              </span>
            </div>

            {/* Pulsanti Rapidi Date (Mantieni data attuale o scegli tra quelle proposte) */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setEditDate(initialDate)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  editDate === initialDate
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                Mantieni data attuale ({initialDate})
              </button>

              {candidateDates.map((d) => {
                if (d === initialDate) return null;
                const isSelected = editDate === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEditDate(d)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Input Data Nativo Standard Controllato */}
            <div className="pt-1">
              <input
                id="edit-confirmed-date"
                name="editDate"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
                style={{ colorScheme: 'light dark' }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-xs"
              />
            </div>

            {/* Indicazione Giorno Selezionato */}
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium capitalize flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5px]" />
              <span>Giorno impostato: <strong className="text-neutral-900 dark:text-white">{formatDateHuman(editDate)}</strong></span>
            </p>
          </div>

          {/* =========================================================================
              2. SOTTO UNA PICCOLA SEZIONE PER MODIFICARE L'ORARIO
             ========================================================================= */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Modifica Orario</span>
              </label>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                Inizio e Fine del Meeting
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Ora Inizio */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-confirmed-start-time"
                  className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block"
                >
                  Ora Inizio:
                </label>
                <input
                  id="edit-confirmed-start-time"
                  name="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={{ colorScheme: 'light dark' }}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all cursor-pointer shadow-xs"
                />
              </div>

              {/* Ora Fine */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-confirmed-end-time"
                  className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block"
                >
                  Ora Fine:
                </label>
                <input
                  id="edit-confirmed-end-time"
                  name="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  style={{ colorScheme: 'light dark' }}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all cursor-pointer shadow-xs"
                />
              </div>
            </div>

            {/* Scorciatoie Durata Rapida */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Durata:
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
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                >
                  +{preset.label}
                </button>
              ))}
            </div>

            {/* Riepilogo Orario */}
            <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Nuovo orario: <strong>{startTime} - {endTime}</strong> ({editDate})</span>
            </div>
          </div>

          {/* Badge Informativo Google Calendar & Calendario In-App */}
          <div className="bg-neutral-100/90 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-3 text-[11px] text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            <span>
              L'evento già creato su Google Calendar e nel calendario in-app verrà aggiornato direttamente, senza crearne uno nuovo.
            </span>
          </div>

          {/* =========================================================================
              3. IN BASSO I TASTI CONFERMA MODIFICA E ANNULLA
             ========================================================================= */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Annulla
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>Conferma Modifica</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
