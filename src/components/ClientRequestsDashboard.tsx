/**
 * JESic Meet - Dashboard "Richieste Clienti" (Flusso B2B)
 * Esclusivo per utente con ruolo 'client_admin'
 * 
 * Funzionalità:
 * 1. Lista richieste clienti con status ('pending', 'converted_to_poll', 'confirmed')
 * 2. Visualizzazione dettagliata: Referente, Azienda, Email, Descrizione, Slot preferiti (2-3)
 * 3. Bottone "Converti in Sondaggio Team":
 *    Apre il form interno "Nuovo Evento" pre-compilato con:
 *    - Titolo: "Call con [Nome Azienda]"
 *    - Descrizione: testo richiesta cliente + email
 *    - Giorni/orari selezionabili: ESATTAMENTE i 2 o 3 slot scelti dal cliente
 * 4. Chiusura flusso: Conferma orario definitivo con generazione Google Meet ed invio email automatica
 * 5. Anteprima in-app del template email transazionale JESic (#f23e2e)
 */

import React, { useState } from 'react';
import {
  Inbox,
  Building,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Video,
  Eye,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { ClientRequest, MeetingEvent, User } from '../types';
import {
  generateClientConfirmationEmailHtml,
  EmailTemplateData,
} from '../utils/emailTemplate';

interface ClientRequestsDashboardProps {
  currentUser: User;
  requests: ClientRequest[];
  allEvents: MeetingEvent[];
  allUsers: User[];
  onConvertToPoll: (request: ClientRequest) => void;
  onConfirmFinalEvent: (
    request: ClientRequest,
    finalSlot: { date: string; startTime: string; endTime: string },
    eventId?: string
  ) => Promise<void> | void;
  onOpenPublicBooking: () => void;
  onOpenEventDetail?: (eventId: string) => void;
}

export const ClientRequestsDashboard: React.FC<ClientRequestsDashboardProps> = ({
  currentUser,
  requests,
  allEvents,
  allUsers,
  onConvertToPoll,
  onConfirmFinalEvent,
  onOpenPublicBooking,
  onOpenEventDetail,
}) => {
  // Solo le 3 sezioni operative: In Attesa, In Sondaggio, Confermate (rimossa la sezione 'Tutte')
  const [filterStatus, setFilterStatus] = useState<
    'pending' | 'converted_to_poll' | 'confirmed'
  >('pending');

  // Modale Anteprima Email inviata / da inviare
  const [previewEmailData, setPreviewEmailData] = useState<EmailTemplateData | null>(null);

  // Modale Rapido Conferma Orario Definitivo
  const [confirmingRequest, setConfirmingRequest] = useState<ClientRequest | null>(null);
  const [chosenSlotIndex, setChosenSlotIndex] = useState<number>(0);
  const [isProcessingFinalConfirm, setIsProcessingFinalConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtro richieste per status selezionato
  const filteredRequests = requests.filter((r) => r.status === filterStatus);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const convertedCount = requests.filter((r) => r.status === 'converted_to_poll').length;
  const confirmedCount = requests.filter((r) => r.status === 'confirmed').length;

  const handleOpenEmailPreview = (request: ClientRequest) => {
    const slot = request.finalizedSlot || request.preferredSlots[0];
    const [y, m, d] = (slot.date || '').split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);

    const emailData: EmailTemplateData = {
      companyName: request.companyName,
      contactEmail: request.contactEmail,
      meetingTitle: `Call con ${request.companyName}`,
      description: request.description,
      dateStr: slot.date,
      formattedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      meetLink: request.meetLink || `https://meet.google.com/jes-${request.id.slice(-4)}-meet`,
      organizerName: `${currentUser.name} ${currentUser.surname}`,
      organizerRole: currentUser.role || 'Admin Clienti JESic',
      organizerEmail: currentUser.email, // Email personale dell'Admin Cliente mittente
    };

    setPreviewEmailData(emailData);
  };

  const handleExecuteFinalConfirm = async () => {
    if (!confirmingRequest) return;
    const selectedSlot = confirmingRequest.preferredSlots[chosenSlotIndex];
    if (!selectedSlot) return;

    setIsProcessingFinalConfirm(true);
    try {
      await onConfirmFinalEvent(
        confirmingRequest,
        {
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        confirmingRequest.pollEventId
      );
      setConfirmingRequest(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingFinalConfirm(false);
    }
  };

  const handleCopyPublicLink = () => {
    const origin = window.location.origin;
    const link = `${origin}/prenota-call`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 sm:px-6 pt-2">
      
      {/* Banner Esclusivo Admin Clienti */}
      <div className="bg-gradient-to-r from-red-950/80 via-neutral-900 to-neutral-900 border border-red-800/60 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#f23e2e] text-white flex items-center justify-center font-black shadow-md shadow-red-500/30">
              <Inbox className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f23e2e]">
                Area Riservata B2B
              </span>
              <h1 className="text-xl font-black text-white tracking-tight">
                Richieste Clienti Esterne
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              title="Copia link pubblico per i clienti (/prenota-call)"
              className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiato!' : 'Copia Link Form'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenPublicBooking}
              className="py-1.5 px-3 rounded-xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apri Form Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra Filtri Status (Sezioni operative: In Attesa, In Sondaggio, Confermate) */}
      <div className="flex p-1 bg-neutral-200/60 dark:bg-neutral-900/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-xs font-bold gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilterStatus('pending')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap text-center relative ${
            filterStatus === 'pending'
              ? 'bg-white dark:bg-neutral-800 text-[#f23e2e] shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-[#f23e2e]'
          }`}
        >
          <span>In Attesa</span>
          {pendingCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#f23e2e] text-white text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('converted_to_poll')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap text-center ${
            filterStatus === 'converted_to_poll'
              ? 'bg-white dark:bg-neutral-800 text-blue-500 shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-blue-500'
          }`}
        >
          In Sondaggio ({convertedCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('confirmed')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap text-center ${
            filterStatus === 'confirmed'
              ? 'bg-white dark:bg-neutral-800 text-green-500 shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-green-500'
          }`}
        >
          Confermate ({confirmedCount})
        </button>
      </div>

      {/* Lista Richieste */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Nessuna richiesta cliente in questa sezione
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              {filterStatus === 'pending'
                ? 'Non ci sono nuove richieste in attesa. I clienti possono inviare la loro richiesta tramite il link pubblico /prenota-call.'
                : filterStatus === 'converted_to_poll'
                ? 'Nessun sondaggio team attivo per le richieste clienti.'
                : 'Nessun appuntamento cliente confermato al momento.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPublicBooking}
            className="py-2.5 px-4 rounded-xl bg-[#f23e2e] text-white text-xs font-black shadow-md shadow-red-500/25 hover:bg-red-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Fai una Prenotazione di Prova (/prenota-call)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const linkedEvent = allEvents.find((e) => e.id === req.pollEventId);

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
              >
                {/* Header Card: Azienda e Badge Stato */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f23e2e] to-red-700 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
                      {req.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-black text-neutral-900 dark:text-white truncate">
                        {req.companyName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                          <a
                            href={`mailto:${req.contactEmail}`}
                            className="hover:underline hover:text-[#f23e2e] truncate"
                          >
                            {req.contactEmail}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badge Stato */}
                  <div>
                    {req.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        In Attesa
                      </span>
                    )}
                    {req.status === 'converted_to_poll' && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        Sondaggio Aperto
                      </span>
                    )}
                    {req.status === 'confirmed' && (
                      <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Call Confermata
                      </span>
                    )}
                  </div>
                </div>

                {/* Descrizione Richiesta */}
                <div className="bg-neutral-50 dark:bg-neutral-950/60 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <span className="font-bold text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase tracking-wider mb-1">
                    Descrizione della richiesta:
                  </span>
                  "{req.description}"
                </div>

                {/* Preferenze Slot Indicate dal Cliente (2 o 3 slot) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <span>Preferenze Orarie Indicate dal Cliente ({req.preferredSlots.length} slot):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {req.preferredSlots.map((slot, sIdx) => {
                      const isFinalChosen =
                        req.finalizedSlot &&
                        req.finalizedSlot.date === slot.date &&
                        req.finalizedSlot.startTime === slot.startTime;

                      return (
                        <div
                          key={sIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            isFinalChosen
                              ? 'bg-green-50 dark:bg-green-950/40 border-green-500 text-green-900 dark:text-green-200 ring-1 ring-green-500'
                              : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{slot.date}</span>
                            <span className="font-mono text-[11px] text-[#f23e2e] font-semibold">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          {isFinalChosen ? (
                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/60 px-1.5 py-0.5 rounded-md">
                              Definitivo ⭐
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-400">
                              Slot {sIdx + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Informazioni Link Google Meet se confermata */}
                {req.status === 'confirmed' && req.meetLink && (
                  <div className="bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="w-4 h-4 text-[#f23e2e] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-[#f23e2e] block">
                          Stanza Google Meet Generata:
                        </span>
                        <a
                          href={req.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono font-bold text-neutral-900 dark:text-white hover:underline truncate block"
                        >
                          {req.meetLink}
                        </a>
                      </div>
                    </div>

                    <a
                      href={req.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-[#f23e2e] text-white text-xs font-bold shrink-0 hover:bg-red-600 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <span>Entra</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Azioni Principali di Gestione & Flusso */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
                  
                  {/* Visualizzazione Anteprima Email */}
                  <button
                    type="button"
                    onClick={() => handleOpenEmailPreview(req)}
                    className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{req.status === 'confirmed' ? 'Anteprima Email Inviata' : 'Bozza Email Cliente'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* CASO 1: Status 'pending' -> TASTO "CONVERTI IN SONDAGGIO TEAM" */}
                    {req.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onConvertToPoll(req)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#f23e2e] to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-black shadow-md shadow-red-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Converti in Sondaggio Team</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* CASO 2: Status 'converted_to_poll' -> Visualizza sondaggio o Conferma Finale */}
                    {req.status === 'converted_to_poll' && (
                      <>
                        {linkedEvent && onOpenEventDetail && (
                          <button
                            type="button"
                            onClick={() => onOpenEventDetail(linkedEvent.id)}
                            className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Vedi Voti Team ({linkedEvent.status})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setConfirmingRequest(req);
                            setChosenSlotIndex(0);
                          }}
                          className="py-2 px-3.5 rounded-xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Conferma Evento Finale</span>
                        </button>
                      </>
                    )}

                    {/* CASO 3: Status 'confirmed' */}
                    {req.status === 'confirmed' && (
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Flusso Completato</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODALE CONFERMA EVENTO FINALE (CHIUSURA FLUSSO) */}
      {confirmingRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#f23e2e]">
                  Chiusura Flusso B2B
                </span>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                  Conferma Evento Finale per {confirmingRequest.companyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingRequest(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Scegli quale dei <strong className="text-neutral-900 dark:text-white">{confirmingRequest.preferredSlots.length} slot</strong> indicati dal cliente è stato decretato vincitore dal team. Cliccando su conferma, il sistema eseguirà simultaneamente:
            </p>

            <ul className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f23e2e]" />
                <strong>A) Inserimento Calendario:</strong> Inserisce l'evento nei calendari con generazione Google Meet.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f23e2e]" />
                <strong>B) Email Automatica al Cliente:</strong> Invia a <em>{confirmingRequest.contactEmail}</em> l'email brandizzata JESic con link Google Meet e RSVP.
              </li>
            </ul>

            {/* Scelta Orario Definitivo tra quelli indicati dal cliente */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                Seleziona l'Orario Definitivo Concordato:
              </label>

              <div className="space-y-2">
                {confirmingRequest.preferredSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setChosenSlotIndex(idx)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      chosenSlotIndex === idx
                        ? 'border-[#f23e2e] bg-red-50/80 dark:bg-red-950/40 text-neutral-900 dark:text-white shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{slot.date}</span>
                      <span className="font-mono text-xs font-bold text-[#f23e2e]">
                        {slot.startTime} - {slot.endTime} (CET)
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                        chosenSlotIndex === idx
                          ? 'bg-[#f23e2e] text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {chosenSlotIndex === idx ? 'Selezionato ✓' : 'Scegli'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingRequest(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="button"
                disabled={isProcessingFinalConfirm}
                onClick={handleExecuteFinalConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingFinalConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Conferma & Invio Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Conferma & Invia Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ANTEPRIMA EMAIL TRANSAZIONALE JESic */}
      {previewEmailData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
              <div>
                <span className="text-[10px] font-black uppercase text-[#f23e2e] tracking-wider">
                  Template HTML Email Istituzionale (Nessuna Emoji)
                </span>
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  Da: {previewEmailData.organizerEmail} &rarr; A: {previewEmailData.contactEmail} ({previewEmailData.companyName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailData(null)}
                className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Anteprima Renderizzata HTML */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-100 dark:bg-neutral-950">
              <iframe
                title="Email Preview"
                srcDoc={generateClientConfirmationEmailHtml(previewEmailData)}
                className="w-full h-[520px] bg-white rounded-2xl border border-neutral-300 dark:border-neutral-800 shadow-sm"
              />
            </div>

            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center text-xs">
              <span className="text-neutral-500 text-[11px]">
                Brand identity: Rosso JESic #f23e2e &bull; Nodemailer / SendGrid compatibile
              </span>
              <button
                type="button"
                onClick={() => setPreviewEmailData(null)}
                className="py-1.5 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
              >
                Chiudi Anteprima
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
