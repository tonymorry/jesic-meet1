/**
 * JESic Meet - Schermata Iniziale di Accesso e Registrazione
 * Junior Enterprise Sicilia
 * 
 * Ottimizzata per Mobile, Tablet e Desktop / PC:
 * - Su schermi grandi: layout a due colonne con presentazione brand e form ad alta usabilità.
 * - Su smartphone: scheda compatta ottimizzata per il tocco rapido.
 * - Brand identity rigorosa: Bianco #ffffff, Nero #1e1e1e, Rosso #f23e2e, Font Ubuntu.
 */

import React, { useState } from 'react';
import { User } from '../types';
import { googleSignIn } from '../utils/googleWorkspaceAuth';
import {
  UserPlus,
  LogIn,
  Mail,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AuthScreenProps {
  registeredUsers: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: Omit<User, 'id'>) => void;
  onGoogleAuth?: (googleData: {
    name: string;
    surname: string;
    email: string;
    avatarUrl?: string;
    accessToken: string;
  }) => Promise<void>;
  onOpenPublicBooking?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  registeredUsers,
  onLogin,
  onRegister,
  onGoogleAuth,
  onOpenPublicBooking,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(
    registeredUsers.length === 0 ? 'register' : 'login'
  );

  // Form Registrazione (Nome, Cognome, Email, Password, Conferma Password)
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(true);

  // Form Accesso (Email e Password)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignInClick = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res && res.user && res.accessToken) {
        const displayName = res.user.displayName || '';
        const nameParts = displayName.trim().split(' ');
        const extractedName = nameParts[0] || 'Utente';
        const extractedSurname = nameParts.slice(1).join(' ') || 'JESic';
        const extractedEmail = res.user.email || '';
        const avatarUrl = res.user.photoURL || undefined;

        if (onGoogleAuth) {
          await onGoogleAuth({
            name: extractedName,
            surname: extractedSurname,
            email: extractedEmail,
            avatarUrl,
            accessToken: res.accessToken,
          });
        }
      }
    } catch (err: any) {
      console.warn('Google Sign-In error:', err);
      setErrorMsg('Accesso con Google non completato: ' + (err.message || 'riprova.'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !cognome.trim() || !email.trim() || !password) {
      setErrorMsg('Compila tutti i campi obbligatori contrassegnati con *.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La password deve contenere almeno 6 caratteri.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Le password inserite non coincidono. Verifica e riprova.');
      return;
    }

    const emailClean = email.trim().toLowerCase();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      setErrorMsg('Questa email è già registrata. Effettua l\'accesso inserendo la tua password.');
      setLoginEmail(emailClean);
      setMode('login');
      return;
    }

    onRegister({
      name: nome.trim(),
      surname: cognome.trim(),
      email: emailClean,
      password: password,
      role: registeredUsers.length === 0 ? 'admin' : 'user',
      googleCalendarConnected,
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Inserisci la tua email istituzionale.');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Inserisci la tua password di accesso.');
      return;
    }

    const match = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!match) {
      setErrorMsg('Nessun profilo trovato con questa email. Crea un nuovo account.');
      return;
    }

    // Verifica password (se l'utente ha impostato una password, deve coincidere)
    if (match.password && match.password !== loginPassword) {
      setErrorMsg('Password non corretta. Riprova o verifica le maiuscole/minuscole.');
      return;
    }

    // Accesso solo e unicamente al proprio profilo
    onLogin(match);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8">
      {/* Contenitore Responsive: max-w-md su Mobile, max-w-4xl / 5xl con 2 colonne su Desktop */}
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 grid grid-cols-1 md:grid-cols-12 transition-all">
        
        {/* PANNELLO SINISTRO (Visibile su Tablet e PC >= md): Brand Identity, Mission & Valori */}
        <div className="hidden md:flex md:col-span-5 lg:col-span-5 flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-[#1e1e1e] via-[#242424] to-[#191919] text-white border-r border-neutral-800 relative overflow-hidden">
          {/* Bagliore d'accento rosso */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#f23e2e]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#f23e2e]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Testata Brand Desktop */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-black/40 shrink-0">
                <img src="/logo.png" alt="JESic Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-tight">
                  JESic<span className="text-[#f23e2e]">Meet</span>
                </h1>
                <p className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase">
                  Junior Enterprise Sicilia
                </p>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-lg lg:text-xl font-extrabold text-white tracking-tight leading-snug">
                Pianificazione riunioni ed eventi per la nostra associazione.
              </h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Raccogli le disponibilità del team in modo rapido e intuitivo, valorizza i partecipanti chiave e programma ogni incontro con facilità.
              </p>
            </div>
          </div>

          {/* Feature Pillars Desktop */}
          <div className="relative z-10 space-y-3.5 my-6">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
              <div className="w-7 h-7 rounded-xl bg-red-950/80 text-[#f23e2e] flex items-center justify-center shrink-0 mt-0.5 border border-red-900/60">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <h3 className="font-bold text-neutral-200">Rilevamento Disponibilità Intelligente</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Individua automaticamente lo slot orario ideale incrociando le disponibilità di tutti i partecipanti.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
              <div className="w-7 h-7 rounded-xl bg-red-950/80 text-[#f23e2e] flex items-center justify-center shrink-0 mt-0.5 border border-red-900/60">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <h3 className="font-bold text-neutral-200">Priorità Membri Essenziali</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Garantisce che ogni riunione confermata rispetti tassativamente la presenza dei membri chiave obbligatori.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
              <div className="w-7 h-7 rounded-xl bg-red-950/80 text-[#f23e2e] flex items-center justify-center shrink-0 mt-0.5 border border-red-900/60">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <h3 className="font-bold text-neutral-200">Calendario & Notifiche Personali</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Ogni membro accede alla propria agenda riservata protetta da password con promemoria automatici.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Sicurezza Desktop */}
          <div className="relative z-10 pt-4 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
            <Lock className="w-3.5 h-3.5 text-[#f23e2e] shrink-0" />
            <span>Junior Enterprise Sicilia • Portale Interno</span>
          </div>
        </div>

        {/* PANNELLO DESTRO (Mobile + Desktop): Header Mobile & Modulo di Login/Registrazione */}
        <div className="col-span-1 md:col-span-7 lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white dark:bg-[#1e1e1e]">
          
          {/* Header Mobile (Visibile SOLO su Mobile < md) */}
          <div className="md:hidden bg-gradient-to-br from-[#f23e2e] via-[#f23e2e] to-red-700 text-white -m-6 mb-6 p-6 text-center relative rounded-b-3xl shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto shadow-xl shadow-black/20 mb-2.5">
              <img src="/logo.png" alt="JESic Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black tracking-tight">
              JESic<span className="text-white/90">Meet</span>
            </h1>
            <p className="text-[11px] text-white/90 mt-0.5 font-medium">
              Junior Enterprise Sicilia · Accesso Personale
            </p>

            {/* Toggle Accedi/Registrati su Mobile */}
            <div className="flex bg-red-800/60 p-1 rounded-xl mt-4 max-w-xs mx-auto border border-white/20">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#f23e2e] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Accedi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-[#f23e2e] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crea Profilo</span>
              </button>
            </div>
          </div>

          <div>
            {/* Toggle Accedi/Registrati su Desktop (Visibile SOLO su PC >= md) */}
            <div className="hidden md:flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl mb-6 max-w-xs border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Accedi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crea Profilo</span>
              </button>
            </div>

            {/* Messaggio Errore */}
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs px-4 py-3 rounded-2xl font-medium mb-4 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Pulsante Ufficiale "Continua con Google" (Sincronizzazione Automatica Calendar) */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-2xs hover:border-[#f23e2e] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 border-2 border-[#f23e2e] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading
                    ? 'Connessione a Google...'
                    : 'Continua con Google (Sincronizza Calendar)'}
                </span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-white dark:bg-[#1e1e1e] px-2 text-neutral-400">
                    oppure con email e password
                  </span>
                </div>
              </div>
            </div>

            {/* 1. CORPO: ACCESSO AL PROPRIO PROFILO CON PASSWORD */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="pb-1">
                  <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    Bentornato in JESic
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Inserisci email e password per accedere alla tua area riservata.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Email Personale / Istituzionale *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="es. mario.rossi@jesic.it"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Password di Accesso *
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Inserisci la tua password"
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-100 dark:border-neutral-700/80 flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <KeyRound className="w-4 h-4 text-[#f23e2e] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Accesso riservato: ogni membro visualizza e gestisce le proprie riunioni e disponibilità.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#f23e2e] hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <span>Accedi al mio account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-[#f23e2e] hover:underline cursor-pointer"
                  >
                    Non hai ancora un profilo? Crealo ora
                  </button>
                </div>
              </form>
            )}

            {/* 2. CORPO: REGISTRAZIONE NUOVO PROFILO CON PASSWORD */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="pb-1">
                  <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    Crea il tuo profilo
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Registra il tuo account protetto Junior Enterprise Sicilia.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Es. Mario"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      required
                      value={cognome}
                      onChange={(e) => setCognome(e.target.value)}
                      placeholder="Es. Rossi"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Email Istituzionale JESic *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome.cognome@jesic.it"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Password * (min. 6)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimo 6 caratteri"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Conferma Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ripeti la password"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Permesso Google Calendar in piccolino con quadratino da spuntare */}
                <div className="flex items-start gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
                  <input
                    type="checkbox"
                    id="googleCalPermission"
                    checked={googleCalendarConnected}
                    onChange={(e) => setGoogleCalendarConnected(e.target.checked)}
                    className="w-4 h-4 text-[#f23e2e] accent-[#f23e2e] rounded cursor-pointer mt-0.5 shrink-0"
                  />
                  <label htmlFor="googleCalPermission" className="text-[11px] cursor-pointer text-neutral-700 dark:text-neutral-300 leading-tight">
                    <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#f23e2e] shrink-0" />
                      Sincronizza automaticamente con Google Calendar
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                      Inserisci automaticamente ogni evento confermato nell'app nel Google Calendar dell'email inserita.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#f23e2e] hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <span>Registra il mio profilo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-[#f23e2e] hover:underline cursor-pointer"
                  >
                    Hai già un account? Accedi qui
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Accesso Esterno B2B Clienti (mostrato solo se esplicitamente passato) */}
          {onOpenPublicBooking && (
            <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <button
                type="button"
                onClick={onOpenPublicBooking}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-[#f23e2e] dark:hover:text-[#f23e2e] transition-colors inline-flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <span>Sei un'azienda o un cliente esterno?</span>
                <span className="text-[#f23e2e] font-black underline">Fissa una Call (/prenota-call) &rarr;</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
