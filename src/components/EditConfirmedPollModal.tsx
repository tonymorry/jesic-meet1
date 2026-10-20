import React, { useState } from 'react';
import { MeetingEvent, User } from '../types';
import { Calendar, Clock, X, Check, AlertCircle, RefreshCw } from 'lucide-react';

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

  // Stati locali controllati garantiti come stringhe (mai undefined)
  const [editDate, setEditDate] = useState<string>(getInitialDate());
  const [startTime, setStartTime] = useState<string>(getInitialStartTime());
  const [endTime, setEndTime] = useState<string>(getInitialEndTime());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      // Oggetto strutturato con finalDate { date, startTime, endTime } come da specifica
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
        status: 'confirmed',
      };

      // Aggiorna la UI locale ed esci dal modale
      onSuccess(updatedPoll);
      onClose();
    } catch (err: any) {
      console.error('Errore modifica data/ora sondaggio confermato:', err);
      setErrorMessage(
        err.message || 'Si è verificato un errore durante il salvataggio. Riprova.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-neutral-900 dark:text-neutral-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intestazione */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/70 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
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
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 rounded-2xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#f23e2e]" />
              <span>Data del Meeting</span>
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* 2 & 3. Orario di Inizio e Orario di Fine */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ora Inizio</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ora Fine</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Info Badge Google Calendar */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              La nuova data e gli orari verranno salvati nel database e sincronizzati in tempo reale
              sul calendario di Google e nel meeting associato.
            </span>
          </div>

          {/* Bottoni Azione */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
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
                  <span>Salva Modifiche</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
