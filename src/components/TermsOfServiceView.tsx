/**
 * JESic Meet - Pagina Pubblica Termini e Condizioni di Servizio
 * Junior Enterprise Sicilia
 * 
 * Conforme ai requisiti di trasparenza Google OAuth e regolamentazione associativa.
 */

import React from 'react';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Shield,
  CheckCircle2,
  Users,
  AlertTriangle,
  Mail,
  Scale,
} from 'lucide-react';

interface TermsOfServiceViewProps {
  onBackToApp: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBackToApp }) => {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black font-['Ubuntu',sans-serif] text-neutral-900 dark:text-neutral-100 antialiased py-8 px-4 sm:px-6 lg:px-8 selection:bg-[#f23e2e] selection:text-white transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Barra di Navigazione Superiore */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md border border-neutral-200/80 shrink-0">
              <img src="/logo.png" alt="JESic Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
                  JESic<span className="text-[#f23e2e]">Meet</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e] border border-red-200 dark:border-red-900">
                  Ufficiale
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Termini e Condizioni di Utilizzo della Piattaforma
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToApp}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla Home</span>
          </button>
        </div>

        {/* Intestazione del Documento */}
        <div className="bg-gradient-to-br from-[#1e1e1e] via-[#242424] to-[#151515] text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#f23e2e]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs border border-white/15">
              <Scale className="w-3.5 h-3.5 text-[#f23e2e]" />
              <span>Contratto di Servizio & Regolamento Piattaforma</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Termini e Condizioni di Servizio
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              I presenti Termini disciplinano l&apos;accesso e l&apos;uso della piattaforma <strong>JESic Meet</strong> da parte dei membri, collaboratori, partner e clienti di <strong>Junior Enterprise Sicilia</strong>.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
              <span>Data di efficacia: <strong>27 Ottobre 2026</strong></span>
              <span>•</span>
              <span>Ultima revisione: <strong>Ottobre 2026</strong></span>
              <span>•</span>
              <span>Ambito: <strong>Uso Associativo e Organizzativo</strong></span>
            </div>
          </div>
        </div>

        {/* Corpo dei Termini e Condizioni */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed">

          {/* Articolo 1: Accettazione dei Termini */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">1</span>
              Accettazione dei Termini
            </h2>
            <p>
              Effettuando la registrazione, l&apos;accesso con credenziali o l&apos;autenticazione tramite Google OAuth, l&apos;utente dichiara di aver letto, compreso e accettato integralmente i presenti Termini e Condizioni e la collegata{' '}
              <a href="/privacy" className="text-[#f23e2e] underline font-semibold hover:text-red-700">
                Informativa sulla Privacy
              </a>. Se l&apos;utente non concorda con una qualsiasi parte dei presenti termini, è invitato a non utilizzare la piattaforma.
            </p>
          </section>

          {/* Articolo 2: Descrizione del Servizio */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">2</span>
              Natura e Scopo della Piattaforma
            </h2>
            <p>
              <strong>JESic Meet</strong> è uno strumento software ideato per supportare le attività operative, gestionali e progettuali di Junior Enterprise Sicilia. Le sue funzionalità principali includono:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm">
              <li>Creazione e gestione di gruppi di lavoro tematici con codici di invito e link dedicati.</li>
              <li>Pubblicazione di sondaggi di disponibilità oraria (When2meet intelligente) con indicazione di partecipanti obbligatori e opzionali.</li>
              <li>Integrazione opzionale ma consigliata con Google Calendar per la sincronizzazione istantanea degli incontri confermati e la generazione dei link Google Meet.</li>
              <li>Ricezione e gestione delle richieste di incontro da parte di aziende e clienti esterni attraverso la sezione B2B (/prenota-call).</li>
            </ul>
          </section>

          {/* Articolo 3: Account e Credenziali */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">3</span>
              Account Personale e Responsabilità
            </h2>
            <p>
              Ogni utente è responsabile della custodia e della riservatezza delle credenziali del proprio profilo. L&apos;utente si impegna a fornire informazioni veritiere, accurate e aggiornate in sede di registrazione. È vietato creare account falsi, impersonare altri membri o cedere a terzi le credenziali del proprio account.
            </p>
          </section>

          {/* Articolo 4: Integrazione con le API di Google */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">4</span>
              Integrazione con Google Calendar e Servizi Google
            </h2>
            <p>
              Qualora l&apos;utente scelga di connettere il proprio account Google Calendar, riconosce e accetta che JESic Meet accederà unicamente alle informazioni strettamente necessarie per verificare gli slot di tempo occupati e creare/aggiornare gli eventi confermati.
            </p>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1.5">
              <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#f23e2e]" />
                Conformità Google Limited Use
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                L&apos;applicazione opera in stretta conformità alla Google API Services User Data Policy. I dati derivanti da Google non saranno mai ceduti a terze parti né utilizzati per finalità diverse da quelle organizzative approvate dall&apos;utente.
              </p>
            </div>
          </section>

          {/* Articolo 5: Condotta dell'Utente */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">5</span>
              Regole di Condotta e Utilizzo Accettabile
            </h2>
            <p>
              L&apos;utente si impegna a non utilizzare la piattaforma per:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm">
              <li>Violare leggi vigenti, regolamenti associativi o diritti di terzi.</li>
              <li>Inviare comunicazioni promozionali indesiderate (spam) o effettuare tentativi di phishing.</li>
              <li>Tentare di compromettere l&apos;integrità del sistema, aggirare misure di sicurezza o accedere non autorizzatamente a dati altrui.</li>
              <li>Interferire con il corretto funzionamento dei server o dei database dell&apos;applicazione.</li>
            </ul>
          </section>

          {/* Articolo 6: Proprietà Intellettuale */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">6</span>
              Proprietà Intellettuale
            </h2>
            <p>
              Tutti i marchi, loghi, grafiche, codice sorgente e contenuti presenti su JESic Meet sono di proprietà esclusiva di <strong>Junior Enterprise Sicilia</strong> o concessi in licenza d&apos;uso. È vietata la riproduzione o la distribuzione senza autorizzazione preventiva scritta.
            </p>
          </section>

          {/* Articolo 7: Limitazione di Responsabilità */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">7</span>
              Limitazione di Responsabilità
            </h2>
            <p>
              La piattaforma viene fornita &ldquo;così com&apos;è&rdquo; per le finalità istituzionali dell&apos;associazione. Pur adottando i più elevati standard tecnici per garantire la continuità e la sicurezza del servizio, Junior Enterprise Sicilia non risponde di eventuali disservizi temporanei imputabili a fornitori di terze parti (es. indisponibilità temporanea delle API Google o dei provider cloud di hosting).
            </p>
          </section>

          {/* Articolo 8: Modifiche ai Termini */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">8</span>
              Modifiche ai Termini di Servizio
            </h2>
            <p>
              JESic si riserva il diritto di aggiornare o modificare i presenti Termini a seguito di sviluppi tecnici, nuove funzionalità o variazioni normative. Le modifiche sostanziali saranno comunicate agli utenti registrati o pubblicate tempestivamente in questa pagina con l&apos;indicazione della data di revisione.
            </p>
          </section>

          {/* Articolo 9: Legge Applicabile e Contatti */}
          <section className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">9</span>
              Legge Applicabile e Recapiti
            </h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi segnalazione, richiesta di supporto o informazione legale è possibile contattare l&apos;amministrazione e il referente all&apos;indirizzo:
            </p>
            <p className="font-bold text-[#f23e2e] text-sm">
              <a href="mailto:antonio.morreale@jesic.it" className="hover:underline">
                Antonio Morreale &lt;antonio.morreale@jesic.it&gt;
              </a>
            </p>
          </section>

        </div>

        {/* Footer Pagina con Pulsante Home */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <p>© 2026 Junior Enterprise Sicilia (JESic) • Tutti i diritti riservati</p>
          <button
            type="button"
            onClick={onBackToApp}
            className="px-5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#f23e2e]" />
            <span>Torna alla Schermata di Accesso</span>
          </button>
        </div>

      </div>
    </div>
  );
};
