/**
 * JESic Meet - GroupWorkspaceHeader
 * 
 * Barra superiore visualizzata quando l'utente entra all'interno di un Gruppo o Sottogruppo:
 * - Mostra sotto al nome del gruppo il ruolo dell'utente ("Tuo ruolo: Responsabile", "Admin", ecc.)
 * - Quando si entra in un Sottogruppo:
 *   - Livello visivo identico a un gruppo indipendente
 *   - Mostra sotto al nome: "Gruppo principale: {activeGroup.name}" e "Tuo ruolo: {ruolo}"
 *   - Il tasto con la freccetta indietro torna direttamente al Gruppo Principale
 *   - Personalizzazione del sottogruppo completa (Nome, Icona, Descrizione, Pubblico/Privato)
 *   - Codice univoco d'accesso del sottogruppo, link e membri dedicati
 */

import React, { useState, useRef } from 'react';
import { Group, User, Subgroup } from '../types';
import { GroupAvatar } from './GroupAvatar';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Link2,
  Settings,
  FolderOpen,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

export interface GroupWorkspaceHeaderProps {
  activeGroup: Group;
  activeSubgroup?: Subgroup | null;
  currentUser: User;
  allUsers: User[];
  onBackToGroups: () => void;
  onBackToMainGroup?: () => void;
  onOpenMembersModal: () => void;
  onToggleSubgroupsMenu?: () => void;
  onUpdateGroupName?: (groupId: string, newName: string) => Promise<boolean | void>;
  onDeleteGroup?: (groupId: string) => Promise<boolean | void>;
  onUpdateSubgroup?: (
    subgroupId: string,
    data: { name: string; description?: string; avatar?: string; isPublic?: boolean }
  ) => Promise<boolean | void>;
  onDeleteSubgroup?: (subgroupId: string) => Promise<boolean | void>;
}

const PRESET_ICONS = ['📁', '🚀', '💡', '💻', '📊', '🎯', '⚡', '🏢', '🔥', '🎓', '🎨', '💼', '⭐', '🛠️', '👥'];

export const GroupWorkspaceHeader: React.FC<GroupWorkspaceHeaderProps> = ({
  activeGroup,
  activeSubgroup,
  currentUser,
  allUsers,
  onBackToGroups,
  onBackToMainGroup,
  onOpenMembersModal,
  onToggleSubgroupsMenu,
  onUpdateGroupName,
  onDeleteGroup,
  onUpdateSubgroup,
  onDeleteSubgroup,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedB2b, setCopiedB2b] = useState(false);

  // Modifica nome inline
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(activeSubgroup ? activeSubgroup.name : activeGroup.name);
  const [isSavingName, setIsSavingName] = useState(false);

  // Modale Eliminazione
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modale Personalizzazione Sottogruppo
  const [isCustomizeSubgroupOpen, setIsCustomizeSubgroupOpen] = useState(false);
  const [editSubName, setEditSubName] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [editSubAvatar, setEditSubAvatar] = useState('📁');
  const [editSubIsPublic, setEditSubIsPublic] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const subImageInputRef = useRef<HTMLInputElement>(null);

  const handleSubgroupImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setEditSubAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const userMembership = activeGroup.members?.find((m) => m.userId === currentUser.id);
  const isGroupCreator = activeGroup.creatorId === currentUser.id;
  const currentGroupRole = userMembership?.role || (isGroupCreator ? 'admin' : 'member');
  const isGroupAdmin = isGroupCreator || currentGroupRole === 'admin';
  const isGroupAdminClienti = currentGroupRole === 'admin_clienti';
  const isGroupResponsabile = isGroupCreator || currentGroupRole === 'responsabile';

  // Autorizzazioni
  const canManageCurrent = activeSubgroup
    ? isGroupResponsabile || isGroupAdmin || isGroupCreator || activeSubgroup.createdBy === currentUser.id
    : isGroupAdmin || isGroupCreator;

  // Ruolo formattato con badge colorato
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'responsabile':
        return {
          label: 'Responsabile',
          badgeClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: '⭐',
        };
      case 'admin':
        return {
          label: 'Admin',
          badgeClass: 'bg-red-100 dark:bg-red-950/70 text-[#f23e2e] border-red-200 dark:border-red-800',
          icon: '⚡',
        };
      case 'admin_clienti':
        return {
          label: 'Admin Clienti',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: '🏢',
        };
      case 'member':
      default:
        return {
          label: 'Membro',
          badgeClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
          icon: '👤',
        };
    }
  };

  const roleMeta = getRoleBadge(currentGroupRole);

  // Codice e Link (del sottogruppo o del gruppo principale)
  const currentCode = activeSubgroup?.code || activeGroup.code;
  const isCurrentPublic = activeSubgroup ? Boolean(activeSubgroup.isPublic) : Boolean(activeGroup.isPublic);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?join=${currentCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Salva nuovo nome rapido
  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newName.trim();
    if (!clean) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      if (activeSubgroup && onUpdateSubgroup) {
        await onUpdateSubgroup(activeSubgroup.id, {
          name: clean,
          description: activeSubgroup.description,
          avatar: activeSubgroup.avatar,
          isPublic: activeSubgroup.isPublic,
        });
      } else if (onUpdateGroupName) {
        await onUpdateGroupName(activeGroup.id, clean);
      }
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  // Apertura modale personalizzazione sottogruppo
  const handleOpenCustomizeSubgroup = () => {
    if (!activeSubgroup) return;
    setEditSubName(activeSubgroup.name);
    setEditSubDesc(activeSubgroup.description || '');
    setEditSubAvatar(activeSubgroup.avatar || '📁');
    setEditSubIsPublic(Boolean(activeSubgroup.isPublic));
    setIsCustomizeSubgroupOpen(true);
  };

  const handleSaveSubgroupCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubgroup || !onUpdateSubgroup || !editSubName.trim()) return;

    setIsSavingCustomization(true);
    try {
      await onUpdateSubgroup(activeSubgroup.id, {
        name: editSubName.trim(),
        description: editSubDesc.trim(),
        avatar: editSubAvatar,
        isPublic: editSubIsPublic,
      });
      setIsCustomizeSubgroupOpen(false);
    } finally {
      setIsSavingCustomization(false);
    }
  };

  // Conferma eliminazione
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (activeSubgroup && onDeleteSubgroup) {
        await onDeleteSubgroup(activeSubgroup.id);
        setShowDeleteConfirm(false);
        if (onBackToMainGroup) {
          onBackToMainGroup();
        }
      } else if (onDeleteGroup) {
        await onDeleteGroup(activeGroup.id);
        setShowDeleteConfirm(false);
        onBackToGroups();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200/90 dark:border-neutral-800 shadow-2xs transition-colors mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          {/* Tasto Torna Indietro + Avatar + (Nome Gruppo + Ruolo sotto) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Tasto Freccetta: se dentro un sottogruppo torna al gruppo principale, se nel gruppo principale torna a I Tuoi Gruppi (senza testo, solo freccia) */}
            <button
              type="button"
              onClick={activeSubgroup ? (onBackToMainGroup || onBackToGroups) : onBackToGroups}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#f23e2e] transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              title={
                activeSubgroup
                  ? `Torna al gruppo principale "${activeGroup.name}"`
                  : 'Torna alla lista dei tuoi gruppi'
              }
              aria-label="Torna indietro"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5px]" />
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              {/* Avatar Icona o Immagine: del Sottogruppo se attivo, altrimenti del Gruppo Principale */}
              <div className="shrink-0">
                <GroupAvatar
                  avatar={activeSubgroup ? (activeSubgroup.avatar || '📁') : (activeGroup.avatar || '👥')}
                  name={activeSubgroup ? activeSubgroup.name : activeGroup.name}
                  size="sm"
                  className="sm:w-10 sm:h-10 sm:text-xl"
                  fallbackEmoji={activeSubgroup ? '📁' : '👥'}
                />
              </div>

              <div className="min-w-0 flex-1">
                {/* Nome & Azioni Modifica Inline */}
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1.5 py-0.5">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={isSavingName}
                      autoFocus
                      className="text-xs sm:text-base font-black px-2 py-0.5 rounded-lg border-2 border-[#f23e2e] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none min-w-0 w-full"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName || !newName.trim()}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                      title="Salva nuovo nome"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setNewName(activeSubgroup ? activeSubgroup.name : activeGroup.name);
                      }}
                      className="p-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer shrink-0"
                      title="Annulla modifica"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2
                      title={activeSubgroup ? activeSubgroup.name : activeGroup.name}
                      className="text-xs sm:text-base font-black text-neutral-900 dark:text-white truncate leading-tight min-w-0"
                    >
                      {activeSubgroup ? activeSubgroup.name : activeGroup.name}
                    </h2>

                    {/* Modifica nome per chi è autorizzato */}
                    {canManageCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(activeSubgroup ? activeSubgroup.name : activeGroup.name);
                          setIsEditingName(true);
                        }}
                        className="p-0.5 sm:p-1 rounded-md text-neutral-400 hover:text-[#f23e2e] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                        title={activeSubgroup ? 'Rinomina sottogruppo' : 'Modifica nome gruppo'}
                      >
                        <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    {/* Personalizzazione avanzata sottogruppo (Icona, Descrizione, Privacy) */}
                    {activeSubgroup && canManageCurrent && onUpdateSubgroup && (
                      <button
                        type="button"
                        onClick={handleOpenCustomizeSubgroup}
                        className="p-0.5 sm:p-1 rounded-md text-neutral-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer shrink-0"
                        title="Personalizza sottogruppo (Icona, Descrizione, Privacy)"
                      >
                        <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    {/* Badge Privacy: solo icona lucchetto o globo */}
                    <span
                      title={isCurrentPublic ? 'Pubblico' : 'Privato'}
                      className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full shrink-0 flex items-center justify-center border ${
                        isCurrentPublic
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300/80 dark:border-emerald-800/60'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {isCurrentPublic ? '🌐' : '🔒'}
                    </span>
                  </div>
                )}

                {/* SOTTO IL NOME: Solo il badge ruolo e, se in sottogruppo, il link al gruppo principale (senza etichette di testo) */}
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 min-w-0 truncate">
                  {activeSubgroup && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0">
                      <button
                        type="button"
                        onClick={onBackToMainGroup}
                        className="font-bold text-[#f23e2e] hover:underline cursor-pointer truncate max-w-[80px] sm:max-w-none"
                        title={`Vai a ${activeGroup.name}`}
                      >
                        {activeGroup.name}
                      </button>
                      <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                    </div>
                  )}

                  <span
                    className={`inline-flex items-center gap-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border shrink-0 ${roleMeta.badgeClass}`}
                  >
                    <span>{roleMeta.icon}</span>
                    <span>{roleMeta.label}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Azioni: Semplificato in UN UNICO PULSANTE Membri (piccola icona con numero a fianco) + eventuale cestino */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Tasto Membri: solo piccola icona con il numero nei membri di fianco */}
            <button
              type="button"
              onClick={onOpenMembersModal}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Visualizza Membri, Codice e Link"
              aria-label={`Membri: ${activeSubgroup ? (activeSubgroup.members?.length || 1) : activeGroup.members.length}`}
            >
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f23e2e]" />
              <span className="font-mono font-bold text-[11px] sm:text-xs">
                {activeSubgroup ? (activeSubgroup.members?.length || 1) : activeGroup.members.length}
              </span>
            </button>

            {/* Tasto Elimina (visibile solo a chi è autorizzato) */}
            {canManageCurrent && (activeSubgroup ? Boolean(onDeleteSubgroup) : Boolean(onDeleteGroup)) && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 border border-red-200/50 dark:border-red-900/40 shrink-0"
                title={activeSubgroup ? 'Elimina questo sottogruppo' : 'Elimina questo gruppo'}
                aria-label="Elimina"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modale Conferma Eliminazione Gruppo o Sottogruppo */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5px]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                {activeSubgroup ? 'Eliminare il sottogruppo?' : 'Eliminare il gruppo?'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Sei sicuro di voler eliminare definitivamente{' '}
                <strong>"{activeSubgroup ? activeSubgroup.name : activeGroup.name}"</strong>? L'operazione non può essere annullata.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Eliminazione...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{activeSubgroup ? 'Elimina Sottogruppo' : 'Elimina Gruppo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Personalizzazione Completa Sottogruppo (Nome, Icona, Descrizione, Privacy) */}
      {isCustomizeSubgroupOpen && activeSubgroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <GroupAvatar
                  avatar={editSubAvatar}
                  name={editSubName || 'Sottogruppo'}
                  size="sm"
                  fallbackEmoji="📁"
                />
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    Personalizza Sottogruppo
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Sottocartella di {activeGroup.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeSubgroupOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubgroupCustomization} className="space-y-4">
              {/* Selezione Icona o Immagine Sottogruppo */}
              <div>
                <input
                  ref={subImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSubgroupImageChange}
                  className="hidden"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Icona o Immagine
                  </label>
                  <button
                    type="button"
                    onClick={() => subImageInputRef.current?.click()}
                    className="text-[11px] text-purple-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Carica foto</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(editSubAvatar.startsWith('data:image/') || editSubAvatar.startsWith('http')) && (
                    <div className="relative shrink-0 mr-1">
                      <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-purple-600 shadow-xs">
                        <img src={editSubAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditSubAvatar('📁')}
                        title="Rimuovi foto"
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[10px] cursor-pointer hover:bg-red-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => subImageInputRef.current?.click()}
                    title="Carica foto da file"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-dashed border-neutral-300 dark:border-neutral-600 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                  </button>

                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditSubAvatar(icon)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                        editSubAvatar === icon
                          ? 'bg-purple-100 dark:bg-purple-950/70 border-2 border-purple-600 scale-110 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:scale-105'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nome Sottogruppo *
                </label>
                <input
                  type="text"
                  required
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Descrizione (Opzionale)
                </label>
                <textarea
                  rows={2}
                  value={editSubDesc}
                  onChange={(e) => setEditSubDesc(e.target.value)}
                  placeholder="Scopo e mansioni di questa sottocartella"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                />
              </div>

              {/* Privacy: Pubblico vs Privato */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Visibilità e Accesso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSubIsPublic(false)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      !editSubIsPublic
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-black text-neutral-900 dark:text-white block">
                      🔒 Privato
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                      Richiede codice d'accesso univoco
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditSubIsPublic(true)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      editSubIsPublic
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-black text-neutral-900 dark:text-white block">
                      🌐 Pubblico
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                      Aperto a tutti i membri del gruppo
                    </span>
                  </button>
                </div>
              </div>

              {/* Tasti Azione */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCustomizeSubgroupOpen(false)}
                  disabled={isSavingCustomization}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomization || !editSubName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingCustomization ? 'Salvataggio...' : 'Salva Personalizzazione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
