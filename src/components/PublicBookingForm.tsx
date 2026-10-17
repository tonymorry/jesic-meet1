/**
 * JESic Meet - Form Pubblico di Prenotazione Call B2B (/prenota-call)
 * Accessibile dall'esterno senza registrazione.
 * 
 * Specifiche Richieste:
 * 1. Grafica identica alle scelte degli associati nel sondaggio When2meet (Tabella oraria a celle interattive).
 * 2. Finestra temporale: parte esattamente da 5 giorni dopo l'invio (i sabati e le domeniche tra quei 5 giorni
 *    vengono contati nel tempo di preavviso), con giorni selezionabili feriali (esclusi sab e dom).
 * 3. Snello, pulito, istituzionale.
 * 4. Validazione vincolante: Min 2, Max 3 slot con blocco e messaggio dedicato.
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Building,
  Mail,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { ClientSlotPreference, ClientRequest } from '../types';

interface PublicBookingFormProps {
  onBackToApp?: () => void;
  onSubmitRequest: (request: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean> | boolean;
}

// Orari standard per le call esterne B2B JESic:
// Ogni mezz'ora dalle 9:00 alle 12:00 e dalle 15:00 alle 19:00
export const B2B_TIME_SLOTS = [
  // Mattina (dalle 09:00 alle 12:00, ogni 30 min)
  { start: '09:00', end: '09:30', label: '09:00', period: 'mattina' as const },
  { start: '09:30', end: '10:00', label: '09:30', period: 'mattina' as const },
  { start: '10:00', end: '10:30', label: '10:00', period: 'mattina' as const },
  { start: '10:30', end: '11:00', label: '10:30', period: 'mattina' as const },
  { start: '11:00', end: '11:30', label: '11:00', period: 'mattina' as const },
  { start: '11:30', end: '12:00', label: '11:30', period: 'mattina' as const },

  // Pomeriggio (dalle 15:00 alle 19:00, ogni 30 min)
  { start: '15:00', end: '15:30', label: '15:00', period: 'pomeriggio' as const },
  { start: '15:30', end: '16:00', label: '15:30', period: 'pomeriggio' as const },
  { start: '16:00', end: '16:30', label: '16:00', period: 'pomeriggio' as const },
  { start: '16:30', end: '17:00', label: '16:30', period: 'pomeriggio' as const },
  { start: '17:00', end: '17:30', label: '17:00', period: 'pomeriggio' as const },
  { start: '17:30', end: '18:00', label: '17:30', period: 'pomeriggio' as const },
  { start: '18:00', end: '18:30', label: '18:00', period: 'pomeriggio' as const },
  { start: '18:30', end: '19:00', label: '18:30', period: 'pomeriggio' as const },
];

/**
 * Calcola i giorni selezionabili:
 * - Parte da 3 giorni dopo oggi (la finestra di preavviso di 3 giorni include sabato e domenica se capitano in mezzo)
 * - I giorni selezionabili per l'incontro escludono sabato e domenica (solo giorni lavorativi).
 */
export function getClientAvailableDays(): {
  dateStr: string;
  label: string;
  dayName: string;
  dayNum: string;
  monthStr: string;
}[] {
  const result: {
    dateStr: string;
    label: string;
    dayName: string;
    dayNum: string;
    monthStr: string;
  }[] = [];

  const current = new Date();
  // Parte esattamente da 3 giorni dopo in cui viene mandato
  current.setDate(current.getDate() + 3);

  // Raccoglie 5 giorni feriali (Lun-Ven), escludendo sabati e domeniche per le riunioni
  while (result.length < 5) {
    const dayOfWeek = current.getDay(); // 0 = Domenica, 6 = Sabato
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayName = new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(current);
      const dayNum = String(current.getDate());
      const monthStr = new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(current);
      const label = `${dayName.toUpperCase().replace('.', '')} ${dayNum} ${monthStr}`;

      result.push({
        dateStr,
        label,
        dayName: dayName.toUpperCase().replace('.', ''),
        dayNum,
        monthStr,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export const PublicBookingForm: React.FC<PublicBookingFormProps> = ({
  onBackToApp,
  onSubmitRequest,
}) => {
  // Campi anagrafici essenziali
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');

  // Slot selezionati (Min 2, Max 3)
  const [selectedSlots, setSelectedSlots] = useState<ClientSlotPreference[]>([]);

  // Validazione & feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // 5 giorni lavorativi disponibili a partire da 3 giorni dopo
  const availableDays = useMemo(() => getClientAvailableDays(), []);

  // Suddivisione fasce orarie per leggibilità immediata (ogni mezz'ora)
  const morningSlots = useMemo(() => B2B_TIME_SLOTS.filter((s) => s.period === 'mattina'), []);
  const afternoonSlots = useMemo(() => B2B_TIME_SLOTS.filter((s) => s.period === 'pomeriggio'), []);

  // Gestione click/tap su una cella della griglia stile sondaggio When2meet
  const handleCellClick = (dateStr: string, slotTime: { start: string; end: string }) => {
    setErrorMessage(null);
    const slotKey = `${dateStr}T${slotTime.start}`;
    const exists = selectedSlots.some((s) => s.slotKey === slotKey);

    if (exists) {
      // Deseleziona
      setSelectedSlots((prev) => prev.filter((s) => s.slotKey !== slotKey));
    } else {
      // Limite massimo: 3 preferenze
      if (selectedSlots.length >= 3) {
        setErrorMessage(
          'Hai già selezionato 3 preferenze. Deseleziona una cella per sceglierne un\'altra.'
        );
        return;
      }

      const newSlot: ClientSlotPreference = {
        date: dateStr,
        startTime: slotTime.start,
        endTime: slotTime.end,
        slotKey,
      };
      setSelectedSlots((prev) => [...prev, newSlot]);
    }
  };

  const isSlotActive = (dateStr: string, startTime: string) => {
    return selectedSlots.some((s) => s.date === dateStr && s.startTime === startTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('Inserisci il nome del referente o della tua azienda.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      setErrorMessage('Inserisci un indirizzo email valido.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Inserisci una breve descrizione della richiesta.');
      return;
    }

    // Validazione Min 2, Max 3 slot
    if (selectedSlots.length < 2 || selectedSlots.length > 3) {
      setErrorMessage(
        'Per agevolare l\'organizzazione del team, ti preghiamo di indicare tra le 2 e le 3 preferenze di orario'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmitRequest({
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        description: description.trim(),
        preferredSlots: selectedSlots,
        status: 'pending',
      });

      if (success !== false) {
        setIsSubmittedSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Si è verificato un errore durante l\'invio. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Schermata di Conferma Finale (Pulita e Istituzionale)
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-950/80 text-green-400 border border-green-800 mx-auto flex items-center justify-center">
            <Check className="w-6 h-6 stroke-[3px]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Richiesta Ricevuta
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Grazie <strong>{companyName}</strong>. La tua richiesta di incontro è stata inoltrata al team di <strong>Junior Enterprise Sicilia</strong>.
            </p>
          </div>

          <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 text-left space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Preferenze orarie indicate ({selectedSlots.length}):
            </span>
            <div className="space-y-1">
              {selectedSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200"
                >
                  <span className="font-semibold">{slot.date}</span>
                  <span className="text-[#f23e2e] font-mono font-bold">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400 pt-1">
              Riceverai la conferma formale con il collegamento Google Meet direttamente via email all'indirizzo <strong>{contactEmail}</strong>.
            </p>
          </div>

          <div className="pt-1 flex gap-2">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer transition-all"
              >
                Torna all'App
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCompanyName('');
                setContactEmail('');
                setDescription('');
                setSelectedSlots([]);
                setErrorMessage(null);
                setIsSubmittedSuccess(false);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-bold cursor-pointer transition-all"
            >
              Nuova richiesta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* Header Pulito */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="JESic Logo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-none">
              <span className="text-base font-extrabold text-white tracking-tight">
                JESic <span className="text-[#f23e2e]">Meet</span>
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Junior Enterprise Sicilia &bull; Prenotazione B2B
              </span>
            </div>
          </div>

          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 transition-all border border-neutral-700/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Area Riservata</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenuto Principale Form (Ottimizzato per Mobile e Desktop / PC) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Titolo e istruzioni istituzionali */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-[#f23e2e] text-[10px] font-bold uppercase tracking-wider mb-1">
            Modulo di Contatto B2B
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Fissa un appuntamento con il nostro team
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Seleziona sulla griglia tra le 2 e le 3 preferenze orarie. Verificheremo le disponibilità del team e ti invieremo la conferma ufficiale via email con il link Google Meet.
          </p>
        </div>

        {/* Banner Errore */}
        {errorMessage && (
          <div className="bg-red-950/70 border border-red-500/80 rounded-2xl p-3.5 text-red-200 text-xs flex items-start gap-2.5 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-[#f23e2e] shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* LAYOUT RESPONSIVE: Su PC 2 colonne affiancate (Dati a sinistra, Griglia a destra), su Mobile stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            
            {/* COLONNA SINISTRA (PC: 5 colonne): Dati Referente & Note */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                  <Building className="w-4 h-4 text-[#f23e2e]" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dati di Contatto
                  </h2>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
                      Referente o Azienda <span className="text-[#f23e2e]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Es. Mario Rossi / Azienda SpA"
                      className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f23e2e] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
                      Email aziendale di contatto <span className="text-[#f23e2e]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="nome@azienda.it"
                      className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f23e2e] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
                      Breve descrizione della richiesta <span className="text-[#f23e2e]">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Oggetto dell'incontro (es. consulenza software, piano marketing, partnership strategica...)"
                      className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f23e2e] transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Box Informativo / Guida */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 text-xs text-neutral-400 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-neutral-200 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span>Come funziona la prenotazione:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-neutral-400 pl-4 list-disc leading-relaxed">
                  <li>Compila i tuoi recapiti aziendali e l'oggetto della richiesta.</li>
                  <li>Seleziona da 2 a 3 preferenze orarie sulla tabella a destra.</li>
                  <li>Riceverai subito un'email di presa in carico e, a seguire, la conferma definitiva con il link Google Meet.</li>
                </ul>
              </div>
            </div>

            {/* COLONNA DESTRA (PC: 7 colonne): TABELLA WHEN2MEET MATTINA & POMERIGGIO */}
            <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#f23e2e]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Disponibilità Orarie
                  </span>
                </div>

                {/* Contatore dinamico */}
                <div
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border transition-colors ${
                    selectedSlots.length >= 2 && selectedSlots.length <= 3
                      ? 'bg-green-950 text-green-300 border-green-700'
                      : selectedSlots.length === 1
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  <span>Scelte: {selectedSlots.length} / 3</span>
                  <span className="text-[10px] opacity-80">(Min 2, Max 3)</span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400">
                Tocca le celle sulla griglia per indicare i tuoi orari preferiti (minimo 2, massimo 3).
              </p>

              {/* CONTENITORE TABELLA */}
              <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-2 sm:p-3 select-none overflow-x-auto">
                <div className="min-w-[320px]">
                  
                  {/* Header Colonne Giorni */}
                  <div
                    className="grid gap-1 sm:gap-1.5 mb-2 items-stretch"
                    style={{ gridTemplateColumns: '50px repeat(5, minmax(0, 1fr))' }}
                  >
                    {/* Cella Angolo Ora */}
                    <div className="flex items-center justify-center text-[9px] font-bold text-neutral-500 uppercase">
                      ORA
                    </div>

                    {availableDays.map((day) => (
                      <div
                        key={day.dateStr}
                        className="p-1 sm:p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-center"
                      >
                        <span className="block text-[9px] font-extrabold uppercase text-neutral-400 tracking-wider">
                          {day.dayName}
                        </span>
                        <span className="block text-xs sm:text-sm font-black text-white leading-tight">
                          {day.dayNum}
                        </span>
                        <span className="block text-[8px] uppercase text-neutral-400">
                          {day.monthStr}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* SEZIONE 1: MATTINA (09:00 - 12:00) */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 py-1 px-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800/80">
                      <Clock className="w-3 h-3 text-[#f23e2e]" />
                      <span>Mattina (09:00 - 12:00)</span>
                    </div>

                    {morningSlots.map((slot) => (
                      <div
                        key={slot.start}
                        className="grid gap-1 sm:gap-1.5 items-stretch"
                        style={{ gridTemplateColumns: '50px repeat(5, minmax(0, 1fr))' }}
                      >
                        <div className="flex items-center justify-end pr-1 text-[10px] font-mono font-bold text-neutral-400">
                          {slot.label}
                        </div>

                        {availableDays.map((day) => {
                          const isSelected = isSlotActive(day.dateStr, slot.start);

                          return (
                            <button
                              key={day.dateStr}
                              type="button"
                              onClick={() => handleCellClick(day.dateStr, slot)}
                              className={`h-7 sm:h-8 rounded-lg border text-center transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                                isSelected
                                  ? 'bg-[#f23e2e] border-[#f23e2e] text-white font-bold shadow-xs'
                                  : 'bg-neutral-900 border-neutral-800/90 hover:border-neutral-700 text-neutral-400 hover:text-white'
                              }`}
                              title={`${day.label} ore ${slot.start} - ${slot.end}`}
                            >
                              {isSelected ? (
                                <Check className="w-3 h-3 stroke-[3px]" />
                              ) : (
                                <span className="text-[9px] font-mono opacity-30">
                                  {slot.label}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* SEZIONE 2: POMERIGGIO (15:00 - 19:00) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1 px-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800/80">
                      <Clock className="w-3 h-3 text-[#f23e2e]" />
                      <span>Pomeriggio (15:00 - 19:00)</span>
                    </div>

                    {afternoonSlots.map((slot) => (
                      <div
                        key={slot.start}
                        className="grid gap-1 sm:gap-1.5 items-stretch"
                        style={{ gridTemplateColumns: '50px repeat(5, minmax(0, 1fr))' }}
                      >
                        <div className="flex items-center justify-end pr-1 text-[10px] font-mono font-bold text-neutral-400">
                          {slot.label}
                        </div>

                        {availableDays.map((day) => {
                          const isSelected = isSlotActive(day.dateStr, slot.start);

                          return (
                            <button
                              key={day.dateStr}
                              type="button"
                              onClick={() => handleCellClick(day.dateStr, slot)}
                              className={`h-7 sm:h-8 rounded-lg border text-center transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                                isSelected
                                  ? 'bg-[#f23e2e] border-[#f23e2e] text-white font-bold shadow-xs'
                                  : 'bg-neutral-900 border-neutral-800/90 hover:border-neutral-700 text-neutral-400 hover:text-white'
                              }`}
                              title={`${day.label} ore ${slot.start} - ${slot.end}`}
                            >
                              {isSelected ? (
                                <Check className="w-3 h-3 stroke-[3px]" />
                              ) : (
                                <span className="text-[9px] font-mono opacity-30">
                                  {slot.label}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* RIEPILOGO SLOT SELEZIONATI & PULSANTE INVIO (A LARGHEZZA INTERA) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 space-y-4">
            {selectedSlots.length > 0 ? (
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-neutral-300 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Riepilogo slot selezionati ({selectedSlots.length}/3):</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-950/80 border border-red-800 text-red-100 text-xs font-mono shadow-2xs"
                    >
                      <span className="font-semibold">{s.date}</span>
                      <strong className="text-white font-black">{s.startTime} - {s.endTime}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          handleCellClick(s.date, { start: s.startTime, end: s.endTime })
                        }
                        className="text-red-400 hover:text-white cursor-pointer ml-1 text-sm font-bold leading-none"
                        title="Rimuovi questo slot"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">
                Nessuna preferenza selezionata. Tocca da 2 a 3 orari sulla tabella per abilitare l'invio.
              </p>
            )}

            <div className="pt-1 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || selectedSlots.length < 2 || selectedSlots.length > 3}
                className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedSlots.length >= 2 && selectedSlots.length <= 3
                    ? 'bg-[#f23e2e] hover:bg-red-600 text-white shadow-lg shadow-red-500/30 active:scale-[0.99]'
                    : 'bg-neutral-800 text-neutral-500 border border-neutral-700/60 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Invio in corso...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      Invia Richiesta di Incontro ({selectedSlots.length} preferenze)
                    </span>
                  </>
                )}
              </button>

              {selectedSlots.length < 2 && (
                <p className="text-[11px] text-center text-amber-400/90 font-medium">
                  Seleziona almeno 2 slot sulla tabella per abilitare l'invio
                </p>
              )}
            </div>
          </div>

        </form>
      </main>

      {/* Footer Istituzionale Formale */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-4 text-center text-[10px] text-neutral-500">
        Junior Enterprise Sicilia &bull; Sede Operativa: Palermo / Catania &bull; Confederazione Nazionale Junior Enterprises
      </footer>
    </div>
  );
};
