/**
 * JESic Meet - GroupsHubView (Tab "Gruppi" a sinistra della Home)
 * 
 * Consente di:
 * 1. Visualizzare tutti i gruppi a cui l'utente partecipa
 * 2. Creare un nuovo gruppo con codice univoco e link di invito
 * 3. Entrare in un gruppo esistente inserendo il codice o il link
 * 4. Selezionare un gruppo per entrare nel suo spazio di lavoro completo
 */

import React, { useState } from 'react';
import { Group, User } from '../types';
import { UserAvatar } from './UserAvatar';
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
} from 'lucide-react';

interface GroupsHubViewProps {
  currentUser: User;
  groups: Group[];
  allUsers: User[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: (name: string, description: string, avatar?: string) => void;
  onJoinGroup: (codeOrLink: string) => Promise<{ success: boolean; message: string; group?: Group }>;
}

const PRESET_ICONS = ['👥', '🚀', '💡', '💻', '📊', '🎯', '⚡', '🏢', '🔥', '🎓'];

export const GroupsHubView: React.FC<GroupsHubViewProps> = ({
  currentUser,
  groups,
  allUsers,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Form Creazione
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('👥');

  // Form Entra con Codice
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Copia feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Filtro gruppi dell'utente corrente
  const userGroups = groups.filter((g) =>
    g.members.some((m) => m.userId === currentUser.id)
  );

  const filteredGroups = userGroups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.code);
    setCopiedCodeId(`code-${group.id}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    const link = group.inviteLink || `${window.location.origin}/?join=${group.code}`;
    navigator.clipboard.writeText(link);
    setCopiedCodeId(`link-${group.id}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), newGroupDesc.trim(), selectedIcon);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedIcon('👥');
    setIsCreateModalOpen(false);
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
      setJoinError('Si è verificato un errore durante l\'adesione al gruppo.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in">
      {/* Header Sezione Gruppi */}
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
              Entra in un gruppo per accedere al suo spazio di lavoro, calendario e sondaggi dedicati.
            </p>
          </div>

          {/* Bottoni Azione Rapida */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-[#f23e2e]" />
              <span>Entra con Codice</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/25 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Crea Gruppo</span>
            </button>
          </div>
        </div>

        {/* Barra di ricerca se ci sono gruppi */}
        {userGroups.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca gruppo per nome, descrizione o codice..."
              className="w-full pl-10 pr-3.5 py-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        )}
      </div>

      {/* Lista Gruppi */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-[#f23e2e] mx-auto flex items-center justify-center text-3xl">
            👥
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {searchQuery ? 'Nessun gruppo corrisponde alla ricerca' : 'Non fai ancora parte di nessun gruppo'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Crea subito il tuo team o chiedi a un collega il codice univoco del gruppo per iniziare a collaborare.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#f23e2e] text-white rounded-xl text-xs font-bold hover:bg-red-600 cursor-pointer shadow-sm"
            >
              Crea il Tuo Primo Gruppo
            </button>
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
            >
              Inserisci Codice
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredGroups.map((group) => {
            const isCreator = group.creatorId === currentUser.id;
            const myMembership = group.members.find((m) => m.userId === currentUser.id);
            const isGroupAdmin = isCreator || myMembership?.role === 'admin';

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
                  {/* Riga Superiore: Avatar + Titolo + Badge Ruolo */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                        {group.avatar || '👥'}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white group-hover:text-[#f23e2e] transition-colors leading-tight">
                          {group.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {group.members.length} {group.members.length === 1 ? 'membro' : 'membri'}
                        </p>
                      </div>
                    </div>

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
                    <span>Entra nel gruppo</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE: CREA NUOVO GRUPPO */}
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
              {/* Icona Gruppo */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Icona / Avatar Gruppo
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200/60 dark:border-red-900/40 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
                <p className="font-bold text-[#f23e2e] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Codice d'Invito Univoco Automatico</span>
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Verrà generato un codice esclusivo (es. JES-XXXX) che potrai condividere con chiunque per farlo entrare nel gruppo.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#f23e2e] hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-red-600/25 cursor-pointer"
                >
                  Crea e Genera Codice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE: ENTRA CON CODICE / LINK */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  Entra in un Gruppo
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
              Incolla il <strong>codice univoco</strong> fornito dall'amministratore (es. <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">JES-XXXX</span>) o il link di invito completo.
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
