/**
 * JESic Meet - Pagina Pubblica Privacy Policy
 * Junior Enterprise Sicilia
 * 
 * Conforme ai requisiti di verifica Google OAuth (Google Cloud Console)
 * e al Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679).
 */

import React from 'react';
import {
  Shield,
  ArrowLeft,
  Calendar,
  Lock,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  Mail,
  FileText,
  AlertCircle,
  Database,
  Trash2,
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBackToApp: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBackToApp }) => {
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
                Informativa sulla Privacy & Protezione Dati
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
              <Shield className="w-3.5 h-3.5 text-[#f23e2e]" />
              <span>Conforme GDPR UE 2016/679 & Google API User Data Policy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Informativa sulla Privacy (Privacy Policy)
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              La presente informativa descrive con la massima trasparenza come <strong>JESic Meet</strong> raccoglie, protegge e utilizza le informazioni personali e i dati di <strong>Google Calendar</strong> a tutela della privacy dei membri e degli interlocutori di Junior Enterprise Sicilia.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
              <span>Data di entrata in vigore: <strong>27 Ottobre 2026</strong></span>
              <span>•</span>
              <span>Ultimo aggiornamento: <strong>Ottobre 2026</strong></span>
              <span>•</span>
              <span>Versione: <strong>2.4 (Google OAuth Verified)</strong></span>
            </div>
          </div>
        </div>

        {/* BOX DI CONFORMITÀ OBBLIGATORIA GOOGLE - LIMITED USE DISCLOSURE */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border-2 border-[#f23e2e] shadow-lg space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-[#f23e2e] flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                Clausola Obbligatoria Google API Services (Limited Use Disclosure)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Dichiarazione ufficiale per la verifica Google Cloud Console e la conformità alle norme per i dati utente.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 space-y-3">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-1">
                Dichiarazione in Lingua Italiana:
              </p>
              <blockquote className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 italic leading-relaxed pl-3 border-l-2 border-[#f23e2e]">
                &ldquo;L&apos;utilizzo e il trasferimento da parte di JESic Meet a qualsiasi altra app delle informazioni ricevute dalle API di Google rispetteranno la{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f23e2e] underline hover:text-red-700 font-bold inline-flex items-center gap-0.5"
                >
                  Google API Services User Data Policy
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                , inclusi i requisiti di Limited Use (Uso Limitato).&rdquo;
              </blockquote>
            </div>

            <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40">
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-1">
                Official English Disclosure (for Google Verification Reviewers):
              </p>
              <blockquote className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 italic leading-relaxed pl-3 border-l-2 border-[#f23e2e]">
                &ldquo;JESic Meet&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f23e2e] underline hover:text-red-700 font-bold inline-flex items-center gap-0.5"
                >
                  Google API Services User Data Policy
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                , including the Limited Use requirements.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>

        {/* Corpo della Privacy Policy */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed">

          {/* Sezione 1: Titolare del Trattamento */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">1</span>
              Titolare del Trattamento dei Dati
            </h2>
            <p>
              Il Titolare del trattamento dei dati è:
            </p>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1">
              <p className="font-bold text-neutral-900 dark:text-white">Junior Enterprise Sicilia (JESic)</p>
              <p>Associazione studentesca no-profit e Junior Enterprise dell&apos;Università degli Studi di Palermo</p>
              <p>Sede: Palermo (PA), Sicilia, Italia</p>
              <p className="flex items-center gap-1.5 pt-1">
                <Mail className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>Referente / Email di contatto: </span>
                <a href="mailto:antonio.morreale@jesic.it" className="font-semibold text-[#f23e2e] hover:underline">
                  Antonio Morreale (antonio.morreale@jesic.it)
                </a>
              </p>
            </div>
          </section>

          {/* Sezione 2: Scopo dell'Applicazione */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">2</span>
              Finalità dell&apos;Applicazione JESic Meet
            </h2>
            <p>
              <strong>JESic Meet</strong> è una piattaforma interna creata per facilitare il coordinamento delle riunioni associative, la gestione dei gruppi di lavoro (board direttivo, aree operative, team di progetto) e l&apos;individuazione rapida degli orari di incontro ottimali sia tra membri interni sia per le call di incontro con aziende e clienti esterni (form pubblico B2B).
            </p>
          </section>

          {/* Sezione 3: Uso Esclusivo di Google Calendar */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">3</span>
              Integrazione con Google Calendar & Modalità di Utilizzo dei Dati
            </h2>
            <p>
              JESic Meet richiede l&apos;autorizzazione esplicita dell&apos;utente tramite protocollo standard Google OAuth 2.0 per accedere allo scope:
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs border border-neutral-800 overflow-x-auto">
              https://www.googleapis.com/auth/calendar.events
            </div>
            <p className="font-semibold text-neutral-900 dark:text-white">
              I dati di Google Calendar sono utilizzati ESCLUSIVAMENTE per le seguenti e sole finalità:
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm">
              <li>
                <strong>Verifica delle disponibilità orarie:</strong> visualizzazione degli intervalli occupati/liberi dell&apos;utente per consentire al sistema di calcolare in automatico gli orari in cui tutti i partecipanti indispensabili sono disponibili.
              </li>
              <li>
                <strong>Creazione automatica degli eventi concordati:</strong> inserimento dell&apos;evento confermato direttamente nel calendario Google personale dell&apos;utente con orario di inizio, fine, titolo, descrizione della riunione e relativo link alla videochiamata Google Meet.
              </li>
              <li>
                <strong>Aggiornamento e rimozione degli eventi:</strong> modifica automatica degli orari o cancellazione dell&apos;evento qualora il sondaggio o la riunione vengano riprogrammati o annullati dai responsabili del gruppo.
              </li>
            </ul>

            {/* Garanzie di non cessione a terzi */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
              <p className="font-black flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Garanzie di Protezione Assoluta dei Dati Google Calendar:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-[11px] sm:text-xs">
                <li><strong>MAI venduti, ceduti o noleggiati:</strong> Nessun dato proveniente da Google Calendar viene venduto, ceduto o condiviso con soggetti terzi, agenzie pubblicitarie o broker di dati.</li>
                <li><strong>NESSUN tracciamento pubblicitario:</strong> I dati non sono mai usati per finalità di profilazione commerciale, remarketing o pubblicità mirata.</li>
                <li><strong>NESSUN addestramento AI generalista:</strong> Le informazioni delle riunioni non vengono mai impiegate per addestrare modelli linguistici o algoritmi di terze parti.</li>
                <li><strong>Accesso limitato al minimo indispensabile:</strong> L&apos;applicazione legge esclusivamente ciò che serve per calcolare l&apos;incastro delle disponibilità e creare gli eventi approvati dall&apos;utente.</li>
              </ul>
            </div>
          </section>

          {/* Sezione 4: Tipologia di Dati Trattati */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">4</span>
              Tipologie di Dati Raccolti
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#f23e2e]" />
                  Dati di Profilo Utente
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                  Nome, cognome, indirizzo email aziendale o istituzionale, password crittografata (o token Google OAuth), eventuale foto profilo.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#f23e2e]" />
                  Dati Organizzativi
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                  Gruppi di appartenenza, ruolo all&apos;interno del gruppo (admin / membro / admin clienti), disponibilità espresse nei sondaggi interni.
                </p>
              </div>
            </div>
          </section>

          {/* Sezione 5: Sicurezza e Archiviazione */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">5</span>
              Sicurezza, Conservazione e Archiviazione dei Dati
            </h2>
            <p>
              I dati sono salvati in un cluster cloud sicuro con crittografia end-to-end su MongoDB Atlas. Tutte le comunicazioni tra il browser dell&apos;utente e il server avvengono su canale protetto HTTPS con certificato SSL/TLS. I token di accesso e di aggiornamento (Refresh Token) di Google sono memorizzati in modo protetto nel server e non sono accessibili ad altri utenti.
            </p>
          </section>

          {/* Sezione 6: Revoca del Consenso e Cancellazione */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">6</span>
              Revoca dei Permessi e Cancellazione dei Dati
            </h2>
            <p>
              L&apos;utente ha il pieno controllo sui propri dati in ogni momento:
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm">
              <li>
                <strong>Disconnessione dall&apos;app:</strong> È possibile disconnettere Google Calendar direttamente dalla sezione Profilo dell&apos;applicazione con un click.
              </li>
              <li>
                <strong>Revoca dei permessi da Google:</strong> È possibile revocare l&apos;accesso di JESic Meet in qualsiasi momento dalla dashboard di sicurezza del proprio account Google alla pagina:{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f23e2e] underline hover:text-red-700 font-semibold inline-flex items-center gap-0.5"
                >
                  myaccount.google.com/permissions
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>.
              </li>
              <li>
                <strong>Cancellazione totale dell&apos;account:</strong> L&apos;utente può richiedere la cancellazione definitiva di tutti i dati registrati su JESic Meet inviando un&apos;email a{' '}
                <a href="mailto:antonio.morreale@jesic.it" className="text-[#f23e2e] underline font-semibold">
                  antonio.morreale@jesic.it
                </a>. La cancellazione viene evasa entro 48 ore lavorative.
              </li>
            </ul>
          </section>

          {/* Sezione 7: Diritti dell'Interessato (GDPR) */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">7</span>
              Diritti dell&apos;Interessato (Artt. 15-22 GDPR)
            </h2>
            <p>
              In conformità al Regolamento UE 2016/679, ogni utente ha il diritto di richiedere l&apos;accesso ai propri dati, la rettifica, la cancellazione (diritto all&apos;oblio), la limitazione del trattamento, la portabilità dei dati e di opporsi al trattamento per motivi legittimi.
            </p>
          </section>

          {/* Sezione 8: Contatti Ufficiali */}
          <section className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#f23e2e]">8</span>
              Domande e Contatti
            </h2>
            <p>
              Per qualsiasi chiarimento in merito alla presente Privacy Policy o per esercitare i propri diritti in materia di dati personali, è possibile contattare il titolare al recapito dedicato:
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
