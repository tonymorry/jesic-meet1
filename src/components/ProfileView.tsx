/**
 * JESic Meet - Profilo Utente Personale
 * Junior Enterprise Sicilia
 * 
 * Funzionalità avanzate:
 * 1. Modale di Regolazione & Ritaglio Foto (Zoom, rotazione, trascinamento per centrare).
 * 2. Selezione da galleria avatar arricchita (include badge ufficiali JESic e figure professionali).
 * 3. Mostra immagine profilo accanto al nome.
 * 4. Controllo permessi di sistema ('admin', 'associate', 'client_admin').
 * 5. Sincronizzazione agenda e logout sicuro.
 */

import React, { useState, useRef } from 'react';
import { AppRole, User, UserSystemRole } from '../types';
import {
  Mail,
  Calendar,
  CheckCircle,
  LogOut,
  Building,
  Shield,
  ShieldCheck,
  Award,
  Camera,
  Trash2,
  Sparkles,
  Upload,
  Check,
  Image as ImageIcon,
  Crop,
  X,
} from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import { UserAvatar } from './UserAvatar';

interface ProfileViewProps {
  currentUser: User;
  allUsers?: User[];
  onLogout: () => void;
  onUpdateUserRole?: (targetUserId: string, newRole: AppRole) => void;
  onUpdateUserProfile?: (updates: Partial<User>) => void;
}

export interface PresetAvatar {
  id: string;
  category: 'jesic' | 'exec' | 'dept' | '3d';
  label: string;
  role: string;
  url: string;
}

// Collezione arricchita e categorizzata di avatar professionali, istituzionali e 3D JESic
const PRESET_AVATARS: PresetAvatar[] = [
  // 1. Ufficiali JESic
  {
    id: 'av-jesic-logo',
    category: 'jesic',
    label: 'Logo Ufficiale JESic',
    role: 'Brand Identity',
    url: '/logo.png',
  },
  {
    id: 'av-jesic-symbol',
    category: 'jesic',
    label: 'Fiamma Rossa JESic',
    role: 'Simbolo Brand',
    url: '/jesic_symbol_red.png',
  },
  // 2. Executive & Leadership
  {
    id: 'av-exec-1',
    category: 'exec',
    label: 'Presidente',
    role: 'Direzione Generale',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=360&h=360&fit=crop&crop=face',
  },
  {
    id: 'av-exec-2',
    category: 'exec',
    label: 'Vicepresidente',
    role: 'Direzione Esecutiva',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=360&h=360&fit=crop&crop=face',
  },
  {
    id: 'av-exec-3',
    category: 'exec',
    label: 'Project Manager Lead',
    role: 'Area Consulenza',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=360&h=360&fit=crop&crop=face',
  },
  {
    id: 'av-exec-4',
    category: 'exec',
    label: 'Senior Consultant',
    role: 'Consulenza Strategica',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=360&h=360&fit=crop&crop=face',
  },
  // 3. Aree & Dipartimenti
  {
    id: 'av-dept-it',
    category: 'dept',
    label: 'Responsabile IT & Tech',
    role: 'Sviluppo Web & AI',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=360&h=360&fit=crop&crop=face',
  },
  {
    id: 'av-dept-hr',
    category: 'dept',
    label: 'Responsabile HR',
    role: 'Risorse Umane & Talenti',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=360&h=360&fit=crop&crop=face',
  },
  {
    id: 'av-dept-mkt',
    category: 'dept',
    label: 'Marketing & Brand',
    role: 'Comunicazione & Social',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=360&h=360&fit=crop&crop=face',
  },
  {
    id: 'av-dept-fin',
    category: 'dept',
    label: 'Responsabile Finanza',
    role: 'Accounting & Budget',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=360&h=360&fit=crop&crop=face',
  },
  // 4. 3D & Illustrati Moderni
  {
    id: 'av-3d-innovator',
    category: '3d',
    label: 'Avatar 3D Innovator',
    role: 'Tech & Digital',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=360&h=360&fit=crop',
  },
  {
    id: 'av-3d-creative',
    category: '3d',
    label: 'Avatar 3D Creative',
    role: 'Design & Media',
    url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=360&h=360&fit=crop&crop=face',
  },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  allUsers = [],
  onLogout,
  onUpdateUserRole,
  onUpdateUserProfile,
}) => {
  const [calendarConnected, setCalendarConnected] = useState(
    currentUser.googleCalendarConnected ?? true
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedAvatarCategory, setSelectedAvatarCategory] = useState<'all' | 'jesic' | 'exec' | 'dept' | '3d'>('all');
  const [cropImageSource, setCropImageSource] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveRole: AppRole =
    currentUser.role ||
    ((currentUser.systemRole as unknown as string) === 'client_admin' ? 'admin_clienti' : (currentUser.systemRole as AppRole)) ||
    'user';
  const currentSystemRole = currentUser.systemRole || 'user';

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Lettura file immagine da dispositivo -> Apertura Editor di Ritaglio
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Seleziona un file immagine valido (JPG, PNG o WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setCropImageSource(uploadEvent.target?.result as string);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showNotification('Errore nella lettura del file immagine.');
    };
    reader.readAsDataURL(file);
  };

  // Salvataggio foto ritagliata
  const handleCropComplete = (croppedDataUrl: string) => {
    onUpdateUserProfile?.({ avatarUrl: croppedDataUrl });
    setCropImageSource(null);
    showNotification('Foto profilo ritagliata e salvata con successo!');
  };

  const handleSelectPreset = (url: string) => {
    onUpdateUserProfile?.({ avatarUrl: url });
    showNotification('Foto profilo aggiornata dalla galleria avatar!');
    setShowPresets(false);
  };

  const handleRemovePhoto = () => {
    onUpdateUserProfile?.({ avatarUrl: undefined });
    showNotification('Foto profilo rimossa. Utilizzate le tue iniziali.');
  };

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-md mx-auto sm:max-w-xl md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 pt-2">
      
      {/* Toast Notifica Aggiornamento */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[3px]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Scheda Identità Personale JESic & Foto Profilo */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200/90 dark:border-neutral-800 shadow-xs relative overflow-hidden transition-colors space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Circolare Principale Direttamente Cliccabile */}
          <div className="relative group self-center sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAvatarMenuOpen(true)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-lg shadow-black/10 border-2 border-white dark:border-neutral-800 ring-2 ring-neutral-200 dark:ring-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center relative cursor-pointer group hover:ring-[#f23e2e] transition-all hover:scale-105 active:scale-95"
              title="Clicca per cambiare foto o scegliere un avatar"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={`${currentUser.name} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#f23e2e] via-red-600 to-red-800 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-inner">
                  {currentUser.name[0]}
                </div>
              )}

              {/* Overlay hover per indicare il click */}
              <div className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded-full">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] font-black uppercase tracking-wider">Modifica</span>
              </div>
            </button>

            {/* Badge galleggiante fotocamera */}
            <button
              type="button"
              onClick={() => setIsAvatarMenuOpen(true)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#f23e2e] hover:bg-red-600 text-white shadow-md shadow-red-500/30 flex items-center justify-center border-2 border-white dark:border-neutral-900 transition-all cursor-pointer hover:scale-110 active:scale-95"
              title="Modifica foto profilo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* File input nascosto per upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Dati Anagrafici e Ruoli */}
          <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                effectiveRole === 'admin'
                  ? 'bg-red-100 dark:bg-red-950/60 text-[#f23e2e] border border-red-200 dark:border-red-900/40 shadow-xs'
                  : effectiveRole === 'admin_clienti'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shadow-xs'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              }`}>
                {effectiveRole === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#f23e2e]" />
                    <span>⚡ Admin</span>
                  </>
                ) : effectiveRole === 'admin_clienti' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>🏢 Admin Clienti</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3 h-3" />
                    <span>👤 Utente Normale</span>
                  </>
                )}
              </span>
            </div>

            {/* Nome Utente con anteprima immagine profilo accanto */}
            <div className="flex items-center justify-center sm:justify-start gap-2.5 truncate">
              <UserAvatar user={currentUser} size="sm" />
              <h2 className="text-xl font-black text-neutral-900 dark:text-white truncate">
                {currentUser.name} {currentUser.surname}
              </h2>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{currentUser.email}</span>
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Tocca la foto profilo per caricarne una nuova o scegliere un avatar.
            </p>
          </div>
        </div>

        {/* Modal Scelta Azioni Avatar (Aperto cliccando sull'Avatar circolare) */}
        {isAvatarMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f23e2e] flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                    Foto Profilo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarMenuOpen(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 hover:bg-red-50 dark:hover:bg-red-950/30 border border-neutral-200 dark:border-neutral-700 hover:border-[#f23e2e] flex items-center gap-3 transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#f23e2e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#f23e2e]">
                      Carica e Ritaglia Foto
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Seleziona una foto dal tuo dispositivo ed effettua il crop
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    setShowPresets(true);
                  }}
                  className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 hover:bg-red-50 dark:hover:bg-red-950/30 border border-neutral-200 dark:border-neutral-700 hover:border-[#f23e2e] flex items-center gap-3 transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#f23e2e]">
                      Galleria Avatar JESic
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Scegli tra gli avatar ufficiali e 3D preimpostati
                    </p>
                  </div>
                </button>

                {currentUser.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      handleRemovePhoto();
                    }}
                    className="w-full p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/60 dark:border-red-900/40 flex items-center gap-3 transition-all cursor-pointer text-left text-red-600 dark:text-red-400"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Rimuovi Foto Profilo</p>
                      <p className="text-[10px] text-red-500/80">Torna all'avatar con la tua iniziale</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cassetto Galleria Avatar Preimpostati & Professionale */}
        {showPresets && (
          <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl border border-neutral-200 dark:border-neutral-700 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f23e2e]" />
                  <span>Galleria Avatar Ufficiali & Ritratti JESic</span>
                </span>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Scegli un avatar o clicca "Ritaglia" per personalizzarlo a piacimento
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer font-bold px-2 py-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Chiudi
              </button>
            </div>

            {/* Categorie di Filtro Rapido */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'Tutti' },
                  { id: 'jesic', label: 'Ufficiali JESic' },
                  { id: 'exec', label: 'Executive & PM' },
                  { id: 'dept', label: 'Dipartimenti' },
                  { id: '3d', label: '3D & Creativi' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedAvatarCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    selectedAvatarCategory === cat.id
                      ? 'bg-[#f23e2e] text-white shadow-xs shadow-red-500/25'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Griglia Avatar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {(selectedAvatarCategory === 'all'
                ? PRESET_AVATARS
                : PRESET_AVATARS.filter((p) => p.category === selectedAvatarCategory)
              ).map((av) => {
                const isSelected = currentUser.avatarUrl === av.url;

                return (
                  <div
                    key={av.id}
                    className={`p-2.5 rounded-2xl border-2 transition-all group text-center flex flex-col items-center justify-between gap-2 bg-white dark:bg-neutral-800/80 shadow-2xs relative ${
                      isSelected
                        ? 'border-[#f23e2e] bg-red-50/80 dark:bg-red-950/40 ring-2 ring-[#f23e2e]/30'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectPreset(av.url)}
                      className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-700 shadow-xs flex items-center justify-center p-0.5 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#f23e2e] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3px]" />
                        </div>
                      )}
                    </div>

                    <div className="leading-tight w-full">
                      <p className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 truncate w-full">
                        {av.label}
                      </p>
                      <span className="text-[9px] text-[#f23e2e] font-semibold block truncate">
                        {av.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 w-full pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(av.url)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#f23e2e] text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {isSelected ? 'In uso' : 'Usa'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCropImageSource(av.url)}
                        className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:text-[#f23e2e] cursor-pointer transition-colors"
                        title="Regola e ritaglia questo avatar"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1 font-medium">
            <Building className="w-3.5 h-3.5 text-neutral-400" />
            Junior Enterprise Sicilia
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            Area Personale Riservata
          </span>
        </div>
      </div>



      {/* Sincronizzazione Google Calendar (Sempre Collegato) */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#f23e2e] flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Google Calendar Sincronizzato
                </h3>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  calendarConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}>
                  {calendarConnected ? 'Sempre Collegato' : 'Disattivato'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextState = !calendarConnected;
              setCalendarConnected(nextState);
              onUpdateUserProfile?.({ googleCalendarConnected: nextState });
              setFeedbackMsg(
                nextState
                  ? 'Sincronizzazione automatica con Google Calendar attivata!'
                  : 'Sincronizzazione Google Calendar disattivata.'
              );
              setTimeout(() => setFeedbackMsg(null), 3000);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              calendarConnected ? 'bg-[#f23e2e]' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
            title="Attiva/disattiva sincronizzazione automatica Google Calendar"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                calendarConnected ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 leading-relaxed">
            Ogni evento viene inserito automaticamente nel Google Calendar di {currentUser.email}.
          </p>
        </div>
      </div>

      {/* Disconnessione */}
      <div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full p-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-900/60 shadow-2xs cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4 text-[#f23e2e]" />
          <span>Disconnetti il mio profilo (Logout)</span>
        </button>
      </div>

      {/* Modale Regolazione & Ritaglio Foto */}
      {cropImageSource && (
        <ImageCropModal
          imageSrc={cropImageSource}
          onClose={() => setCropImageSource(null)}
          onCropComplete={handleCropComplete}
        />
      )}

    </div>
  );
};
