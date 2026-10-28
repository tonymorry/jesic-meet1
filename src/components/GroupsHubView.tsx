/**
 * JESic Meet - GroupsHubView (Tab "Gruppi" / Home Principale dei Gruppi)
 * 
 * Regole e Requisiti:
 * 1. Di base nella Home si vedono ESCLUSIVAMENTE i gruppi in cui l'utente è dentro.
 * 2. Barra di ricerca per cercare gruppi per nome:
 *    - Quando si cerca, compaiono TUTTI i gruppi (sia pubblici che privati) che corrispondono al nome.
 *    - Nei gruppi PUBBLICI chiunque conosca il nome può entrare con 1 click ("Unisciti al Gruppo").
 *    - Nei gruppi PRIVATI compare l'indicazione che è privato e il tasto per inserire il codice univoco.
 * 3. Il creatore del gruppo può scegliere in fase di creazione se il gruppo è Pubblico o Privato.
 * 4. La logica del codice univoco e del link di invito rimane al 100% invariata e pienamente funzionante.
 */

import React, { useState, useRef } from 'react';
import { Group, User } from '../types';
import { UserAvatar } from './UserAvatar';
import { GroupAvatar } from './GroupAvatar';
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Shield,
  Sparkles,
  X,
  Search,
  Globe,
  Lock,
  UserCheck,
  ExternalLink,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

interface GroupsHubViewProps {
  currentUser: User;
  groups: Group[];
  allUsers: User[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: (name: string, description: string, avatar?: string, isPublic?: boolean) => Promise<any> | void;
  onJoinGroup: (codeOrLink: string) => Promise<{ success: boolean; message: string; group?: Group }>;
  onJoinPublicGroup?: (group: Group) => Promise<{ success: boolean; message: string; group?: Group }>;
}

const PRESET_ICONS = ['👥', '🚀', '💡', '💻', '📊', '🎯', '⚡', '🏢', '🔥', '🎓'];

export const GroupsHubView: React.FC<GroupsHubViewProps> = ({
  currentUser,
  groups,
  allUsers,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  onJoinPublicGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Form Creazione
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('👥');
  const [isPublicGroup, setIsPublicGroup] = useState(false); // Default: Privato
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const groupImageInputRef = useRef<HTMLInputElement>(null);

  const handleGroupImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("L'immagine non può superare 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedIcon(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Form Entra con Codice
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Stato per adesione a gruppo pubblico
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Feedback copia
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // 1. Gruppi in cui l'utente corrente è membro (mostrati DI BASE quando la ricerca è vuota)
  const myJoinedGroups = groups.filter((g) =>
    (g.members && g.members.some((m) => m.userId === currentUser.id)) ||
    (currentUser.groupMemberships && currentUser.groupMemberships.some((gm) => gm.groupId === g.id))
  );

  // 2. Risultati della ricerca per nome (spuntano sia pubblici che privati)
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const handleCopyCode = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.code);
    setCopiedCodeId(`code-${group.id}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    const link = `${window.location.origin}/?join=${group.code}`;
    navigator.clipboard.writeText(link);
    setCopiedCodeId(`link-${group.id}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || isCreating) return;
    setCreateError(null);
    setIsCreating(true);

    try {
      await onCreateGroup(newGroupName.trim(), newGroupDesc.trim(), selectedIcon, isPublicGroup);
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedIcon('👥');
      setIsPublicGroup(false);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || 'Errore durante la creazione del gruppo su MongoDB');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinError(null);
    setIsJoining(true);

    try {
      const res = await onJoinGroup(joinCodeInput.trim());
      if (res.success) {
        setJoinCodeInput('');
        setIsJoinModalOpen(false);
      } else {
        setJoinError(res.message);
      }
    } catch {
      setJoinError("Si è verificato un errore durante l'adesione al gruppo.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPublic = async (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setJoiningGroupId(group.id);
    try {
      if (onJoinPublicGroup) {
        await onJoinPublicGroup(group);
      } else {
        // Fallback tramite onJoinGroup con codice
        await onJoinGroup(group.code);
      }
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in">
      {/* Header Sezione Gruppi con Azioni Rapide */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                I Tuoi Gruppi di Lavoro
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Accedi allo spazio dedicato dei tuoi team, o cerca altri gruppi pubblici e privati per nome.
            </p>
          </div>

          {/* Bottoni Azione Rapida */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setJoinCodeInput('');
                setJoinError(null);
                setIsJoinModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-[#f23e2e]" />
              <span>Entra con Codice</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewGroupName('');
                setNewGroupDesc('');
                setIsPublicGroup(false);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/25 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Crea Gruppo</span>
            </button>
          </div>
        </div>

        {/* BARRA DI RICERCA SEMPRE VISIBILE IN HOME (Cerca gruppi per nome) */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 absolute left-3.5 top-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca gruppi per nome (sia pubblici che privati)..."
            className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
              title="Cancella ricerca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CASO 1: MODALITÀ RICERCA ATTIVA */}
      {isSearching ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-900 dark:text-white">
                Risultati per &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {searchResults.length} {searchResults.length === 1 ? 'gruppo trovato' : 'gruppi trovati'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#f23e2e] hover:underline font-bold cursor-pointer"
            >
              Torna ai tuoi gruppi
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center text-2xl">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Nessun gruppo corrisponde a &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Assicurati di aver digitato il nome corretto oppure crea subito un nuovo gruppo con questo nome.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewGroupName(searchQuery);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#f23e2e] text-white rounded-xl text-xs font-bold hover:bg-red-600 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea Gruppo &ldquo;{searchQuery}&rdquo;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancella ricerca
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {searchResults.map((group) => {
                const isMember = group.members.some((m) => m.userId === currentUser.id);
                const isCreator = group.creatorId === currentUser.id;
                const isPublic = group.isPublic === true;
                const memberUsers = allUsers.filter((u) =>
                  group.members.some((m) => m.userId === u.id)
                );

                return (
                  <div
                    key={group.id}
                    onClick={() => {
                      if (isMember) {
                        onSelectGroup(group);
                      }
                    }}
                    className={`bg-white dark:bg-neutral-900 rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                      isMember
                        ? 'border-neutral-200/90 dark:border-neutral-800 hover:border-red-500/50 hover:shadow-md cursor-pointer group'
                        : isPublic
                        ? 'border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-500/60'
                        : 'border-neutral-200/90 dark:border-neutral-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header Card con Avatar, Nome e Badge Visibilità */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <GroupAvatar avatar={group.avatar} name={group.name} size="lg" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-neutral-900 dark:text-white truncate">
                              {group.name}
                            </h3>
                          </div>
                        </div>

                        {/* Badge Pubblico / Privato */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                              isPublic
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300/80 dark:border-emerald-800/60'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            {isPublic ? (
                              <>
                                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Pubblico</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-neutral-400" />
                                <span>Privato</span>
                              </>
                            )}
                          </span>

                          {isMember && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-[#f23e2e] px-1.5 py-0.2 rounded-md">
                              {isCreator ? 'Creatore' : 'Membro'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Descrizione */}
                      {group.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                      )}

                      {/* Membri Avatars preview */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {memberUsers.slice(0, 4).map((u) => (
                            <div key={u.id} className="ring-2 ring-white dark:ring-neutral-900 rounded-full">
                              <UserAvatar user={u} size="sm" />
                            </div>
                          ))}
                        </div>
                        {memberUsers.length > 4 && (
                          <span className="text-[10px] font-bold text-neutral-400">
                            +{memberUsers.length - 4} altri
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Azioni del risultato di ricerca */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      {isMember ? (
                        <>
                          {/* Se sei già membro */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                              {group.code}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(e, group)}
                              title="Copia codice univoco"
                              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                            >
                              {copiedCodeId === `code-${group.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectGroup(group)}
                            className="flex items-center gap-1 text-xs font-bold text-[#f23e2e] hover:text-red-700 cursor-pointer"
                          >
                            <span>Entra nello spazio</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                          </button>
                        </>
                      ) : isPublic ? (
                        <>
                          {/* Non membro ma gruppo PUBBLICO: Entra direttamente! */}
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 truncate">
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Accesso libero</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleJoinPublic(e, group)}
                            disabled={joiningGroupId === group.id}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {joiningGroupId === group.id ? (
                              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <span>Unisciti al Gruppo</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Non membro e gruppo PRIVATO: Richiede codice */}
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 truncate">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Serve codice d&apos;invito</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setJoinCodeInput('');
                              setJoinError(null);
                              setIsJoinModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#f23e2e]" />
                            <span>Inserisci Codice</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CASO 2: MODALITÀ DEFAULT (VISIBILI SOLO I GRUPPI IN CUI L'UTENTE È DENTRO) */
        <div className="space-y-3">
          {myJoinedGroups.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-[#f23e2e] mx-auto flex items-center justify-center text-3xl shadow-xs">
                👥
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Non fai ancora parte di nessun gruppo
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Cerca un gruppo per nome usando la barra di ricerca in alto, oppure creane uno nuovo per iniziare a collaborare.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-[#f23e2e] text-white rounded-xl text-xs font-bold hover:bg-red-600 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea il Tuo Primo Gruppo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-[#f23e2e]" />
                  <span>Inserisci Codice</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {myJoinedGroups.map((group) => {
                const isCreator = group.creatorId === currentUser.id;
                const myMembership = group.members.find((m) => m.userId === currentUser.id);
                const isGroupAdmin = isCreator || myMembership?.role === 'admin';
                const isPublic = group.isPublic === true;

                // Membri popolati
                const memberUsers = allUsers.filter((u) =>
                  group.members.some((m) => m.userId === u.id)
                );

                return (
                  <div
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500/50 dark:hover:border-red-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Riga Superiore: Avatar + Titolo + Badge Visibilità & Ruolo */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="group-hover:scale-105 transition-transform shrink-0">
                            <GroupAvatar avatar={group.avatar} name={group.name} size="lg" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-neutral-900 dark:text-white group-hover:text-[#f23e2e] transition-colors leading-tight truncate">
                              {group.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {/* Badge Pubblico/Privato */}
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                              isPublic
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300/80 dark:border-emerald-800/60'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            {isPublic ? (
                              <>
                                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Pubblico</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-neutral-400" />
                                <span>Privato</span>
                              </>
                            )}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isGroupAdmin
                                ? 'bg-red-100 dark:bg-red-950/60 text-[#f23e2e] border border-red-200/60 dark:border-red-900/40'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {isCreator ? 'Creatore' : isGroupAdmin ? 'Admin' : 'Membro'}
                          </span>
                        </div>
                      </div>

                      {/* Descrizione */}
                      {group.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                      )}

                      {/* Membri Avatars preview */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {memberUsers.slice(0, 5).map((u) => (
                            <div key={u.id} className="ring-2 ring-white dark:ring-neutral-900 rounded-full">
                              <UserAvatar user={u} size="sm" />
                            </div>
                          ))}
                        </div>
                        {memberUsers.length > 5 && (
                          <span className="text-[10px] font-bold text-neutral-400">
                            +{memberUsers.length - 5} altri
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Card: Codice Univoco & Tasto Entra */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      {/* Codice Gruppo */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          {group.code}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(e, group)}
                          title="Copia codice univoco"
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer transition-colors"
                        >
                          {copiedCodeId === `code-${group.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(e, group)}
                          title="Copia link d'invito"
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer transition-colors"
                        >
                          {copiedCodeId === `link-${group.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Pulsante Entra nel Gruppo */}
                      <div className="flex items-center gap-1 text-xs font-bold text-[#f23e2e] group-hover:translate-x-0.5 transition-transform">
                        <span>Entra nello spazio</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALE: CREA NUOVO GRUPPO (Con scelta Pubblico o Privato per il creatore) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  Crea Nuovo Gruppo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {/* Icona o Immagine Gruppo */}
              <div>
                <input
                  ref={groupImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGroupImageChange}
                  className="hidden"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Icona o Immagine Gruppo
                  </label>
                  <button
                    type="button"
                    onClick={() => groupImageInputRef.current?.click()}
                    className="text-[11px] text-[#f23e2e] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Carica foto</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {/* Se è stata caricata un'immagine personalizzata */}
                  {(selectedIcon.startsWith('data:image/') || selectedIcon.startsWith('http')) && (
                    <div className="relative shrink-0 mr-1">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[#f23e2e] ring-2 ring-red-500/20 shadow-xs">
                        <img src={selectedIcon} alt="Avatar gruppo" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedIcon('👥')}
                        title="Rimuovi foto e usa icona"
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[10px] cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Tasto rapido apri file picker */}
                  <button
                    type="button"
                    onClick={() => groupImageInputRef.current?.click()}
                    title="Carica foto/immagine da file"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-dashed border-neutral-300 dark:border-neutral-600 transition-all shrink-0 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#f23e2e]" />
                  </button>

                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 cursor-pointer ${
                        selectedIcon === icon
                          ? 'bg-red-50 dark:bg-red-950/60 border-2 border-[#f23e2e] scale-110 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 border border-transparent hover:scale-105'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome Gruppo */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Nome del Gruppo *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Es. Team IT, Area Marketing, CDA..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e]"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Descrizione (Opzionale)
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Spiega l'obiettivo o le attività di questo gruppo..."
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e]"
                />
              </div>

              {/* SELEZIONE VISIBILITÀ: PUBBLICO O PRIVATO */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Tipo di Gruppo e Accesso *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPublicGroup(false)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      !isPublicGroup
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-[#f23e2e] ring-2 ring-[#f23e2e]/20'
                        : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">🔒</span>
                      {!isPublicGroup && <Check className="w-3.5 h-3.5 text-[#f23e2e] stroke-[3px]" />}
                    </div>
                    <p className="text-xs font-black text-neutral-900 dark:text-white">
                      Privato
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      Accessibile solo con codice o link d&apos;invito.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublicGroup(true)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isPublicGroup
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">🌐</span>
                      {isPublicGroup && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />}
                    </div>
                    <p className="text-xs font-black text-neutral-900 dark:text-white">
                      Pubblico
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      Chiunque cerchi il gruppo per nome può entrare liberamente.
                    </p>
                  </button>
                </div>
              </div>

              {/* Box Informativo Codice Univoco */}
              <div className="p-3 bg-red-50/60 dark:bg-red-950/30 rounded-2xl border border-red-200/60 dark:border-red-900/40 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
                <p className="font-bold text-[#f23e2e] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Codice d&apos;Invito Univoco Automatico</span>
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Verrà generato un codice esclusivo (es. <span className="font-mono font-bold">JES-XXXX</span>) che potrai condividere in qualsiasi momento.
                </p>
              </div>

              {createError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-400">
                  {createError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-[#f23e2e] hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-red-600/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isCreating ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <span>Crea Gruppo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE: ENTRA CON CODICE / LINK (Logica invariata al 100%) */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  Entra in un Gruppo con Codice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setJoinError(null);
                }}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Incolla il <strong>codice univoco</strong> fornito dall&apos;amministratore (es. <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">JES-XXXX</span>) o il link di invito completo.
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={joinCodeInput}
                  onChange={(e) => {
                    setJoinCodeInput(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  placeholder="Es. JES-9K4B o incolla link..."
                  className="w-full px-3.5 py-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e]"
                />
              </div>

              {joinError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-400">
                  {joinError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setJoinError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim() || isJoining}
                  className="flex-1 py-2.5 rounded-xl bg-[#f23e2e] hover:bg-red-600 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-red-600/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isJoining ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <span>Entra nel Gruppo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
