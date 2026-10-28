/**
 * JESic Meet - SubgroupsDrawer (Cartelle e Sottogruppi)
 * 
 * Aperto dal tasto con l'icona a 3 lineette (menu hamburger) quando si è dentro un gruppo:
 * - Mostra la Cartella Generale (Gruppo Principale - accessibile a tutti)
 * - Mostra l'elenco dei Sottogruppi di lavoro (sottocartelle)
 * - Creazione e personalizzazione completa identica a quella del gruppo principale:
 *   - Nome, Descrizione, Icona Preset, Privacy (Privato con codice vs Pubblico)
 * - Solo chi ha il ruolo di "Responsabile" in quel gruppo (o il creatore) può creare/modificare nuovi sottogruppi
 * - I sottogruppi pubblici sono aperti a tutti i membri, quelli privati richiedono il codice
 */

import React, { useState, useRef } from 'react';
import { Group, Subgroup, User } from '../types';
import { GroupAvatar } from './GroupAvatar';
import {
  X,
  Folder,
  FolderPlus,
  FolderOpen,
  Check,
  Plus,
  Trash2,
  Lock,
  KeyRound,
  Copy,
  Edit2,
  Settings,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

export interface SubgroupsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroup: Group;
  activeSubgroupId: string | null;
  onSelectSubgroup: (subgroupId: string | null) => void;
  currentUser: User;
  onCreateSubgroup: (
    name: string,
    description?: string,
    avatar?: string,
    isPublic?: boolean
  ) => Promise<boolean | void>;
  onUpdateSubgroup?: (
    subgroupId: string,
    data: { name: string; description?: string; avatar?: string; isPublic?: boolean }
  ) => Promise<boolean | void>;
  onDeleteSubgroup?: (subgroupId: string) => Promise<boolean | void>;
  onJoinSubgroup?: (subgroupId: string, code: string) => Promise<{ success: boolean; error?: string }>;
}

const PRESET_ICONS = ['📁', '🚀', '💡', '💻', '📊', '🎯', '⚡', '🏢', '🔥', '🎓', '🎨', '💼', '⭐', '🛠️', '👥'];

export const SubgroupsDrawer: React.FC<SubgroupsDrawerProps> = ({
  isOpen,
  onClose,
  activeGroup,
  activeSubgroupId,
  onSelectSubgroup,
  currentUser,
  onCreateSubgroup,
  onUpdateSubgroup,
  onDeleteSubgroup,
  onJoinSubgroup,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [newSubgroupDesc, setNewSubgroupDesc] = useState('');
  const [newSubgroupAvatar, setNewSubgroupAvatar] = useState('📁');
  const [newSubgroupIsPublic, setNewSubgroupIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const createSubImageRef = useRef<HTMLInputElement>(null);

  const handleCreateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setNewSubgroupAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Stato Modifica Sottogruppo
  const [editingSubgroup, setEditingSubgroup] = useState<Subgroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAvatar, setEditAvatar] = useState('📁');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stato per sblocco sottogruppo con codice
  const [unlockingSubgroupId, setUnlockingSubgroupId] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [copiedCodeSubgroupId, setCopiedCodeSubgroupId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Verifica ruolo "Responsabile" o creatore in questo gruppo specifico
  const userMembership = activeGroup.members?.find((m) => m.userId === currentUser.id);
  const isCreator = activeGroup.creatorId === currentUser.id;
  const isResponsabile = isCreator || userMembership?.role === 'responsabile';

  const subgroups = activeGroup.subgroups || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubgroupName.trim()) {
      setErrorMsg('Inserisci un nome valido per il sottogruppo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onCreateSubgroup(
        newSubgroupName.trim(),
        newSubgroupDesc.trim(),
        newSubgroupAvatar,
        newSubgroupIsPublic
      );
      setNewSubgroupName('');
      setNewSubgroupDesc('');
      setNewSubgroupAvatar('📁');
      setNewSubgroupIsPublic(false);
      setIsCreating(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Errore durante la creazione del sottogruppo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (subgroup: Subgroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubgroup(subgroup);
    setEditName(subgroup.name);
    setEditDesc(subgroup.description || '');
    setEditAvatar(subgroup.avatar || '📁');
    setEditIsPublic(Boolean(subgroup.isPublic));
    setEditError(null);
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubgroup || !onUpdateSubgroup || !editName.trim()) return;

    setIsSavingEdit(true);
    setEditError(null);
    try {
      await onUpdateSubgroup(editingSubgroup.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        avatar: editAvatar,
        isPublic: editIsPublic,
      });
      setEditingSubgroup(null);
    } catch (err: any) {
      setEditError(err?.message || 'Errore durante la personalizzazione');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClick = async (subgroup: Subgroup, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteSubgroup) return;
    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare il sottogruppo "${subgroup.name}"? I sondaggi e i messaggi del sottogruppo verranno rimossi.`
    );
    if (!confirmDelete) return;

    setDeletingId(subgroup.id);
    try {
      await onDeleteSubgroup(subgroup.id);
      if (activeSubgroupId === subgroup.id) {
        onSelectSubgroup(null); // Ritorna al gruppo generale
      }
    } catch (err: any) {
      alert(err?.message || 'Errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUnlockSubmit = async (subgroup: Subgroup, e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode.trim() || !onJoinSubgroup) return;

    setIsUnlocking(true);
    setUnlockError(null);
    try {
      const res = await onJoinSubgroup(subgroup.id, enteredCode.trim());
      if (res.success) {
        setUnlockingSubgroupId(null);
        setEnteredCode('');
        onSelectSubgroup(subgroup.id);
        onClose();
      } else {
        setUnlockError(res.error || 'Codice errato. Riprova.');
      }
    } catch (err: any) {
      setUnlockError(err?.message || 'Errore durante l\'accesso al sottogruppo');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCopyCode = (subgroup: Subgroup, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!subgroup.code) return;
    navigator.clipboard.writeText(subgroup.code);
    setCopiedCodeSubgroupId(subgroup.id);
    setTimeout(() => {
      setCopiedCodeSubgroupId(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-250">
          
          {/* Header del Pannello */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                {activeGroup.avatar || '👥'}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white truncate">
                  {activeGroup.name}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Cartelle & Sottogruppi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title="Chiudi menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge del Ruolo nel Gruppo */}
          <div className="px-4 sm:px-5 py-2.5 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              Tuo ruolo nel gruppo:
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isResponsabile
                  ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                  : userMembership?.role === 'admin'
                  ? 'bg-red-100 dark:bg-red-950/70 text-[#f23e2e]'
                  : userMembership?.role === 'admin_clienti'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {isCreator
                ? '👑 Creatore'
                : isResponsabile
                ? '⭐ Responsabile'
                : userMembership?.role === 'admin'
                ? '⚡ Admin'
                : userMembership?.role === 'admin_clienti'
                ? '🏢 Admin Clienti'
                : '👤 Membro'}
            </span>
          </div>

          {/* Lista Cartella Generale e Sottogruppi */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* 1. SEZIONE: CARTELLA GENERALE (GRUPPO PRINCIPALE - ACCESSIBILE A TUTTI) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                Cartella Principale
              </span>

              <div
                onClick={() => {
                  onSelectSubgroup(null);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  activeSubgroupId === null
                    ? 'bg-red-50/80 dark:bg-red-950/30 border-[#f23e2e] shadow-xs'
                    : 'bg-white dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeSubgroupId === null
                        ? 'bg-[#f23e2e] text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <Folder className="w-5 h-5 stroke-[2.2px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                      {activeGroup.name} (Generale)
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                      Accessibile a tutti &bull; Sondaggi & chat generali
                    </p>
                  </div>
                </div>

                {activeSubgroupId === null && (
                  <span className="w-5 h-5 rounded-full bg-[#f23e2e] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </span>
                )}
              </div>
            </div>

            {/* 2. SEZIONE: SOTTOGRUPPI (SOTTOCARTELLE) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Sottogruppi ({subgroups.length})
                </span>

                {isResponsabile && !isCreating && !editingSubgroup && (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="text-[11px] font-bold text-[#f23e2e] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuovo Sottogruppo</span>
                  </button>
                )}
              </div>

              {/* Form Creazione Nuovo Sottogruppo (Identico e personalizzabile come un gruppo) */}
              {isCreating && (
                <form
                  onSubmit={handleCreateSubmit}
                  className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border-2 border-purple-300 dark:border-purple-800/70 space-y-3.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Crea & Personalizza Sottogruppo</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scelta Icona o Immagine Sottogruppo */}
                  <div>
                    <input
                      ref={createSubImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCreateImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        Icona o Immagine
                      </label>
                      <button
                        type="button"
                        onClick={() => createSubImageRef.current?.click()}
                        className="text-[10px] text-purple-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Carica foto</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(newSubgroupAvatar.startsWith('data:image/') || newSubgroupAvatar.startsWith('http')) && (
                        <div className="relative shrink-0 mr-1">
                          <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-purple-600 shadow-xs">
                            <img src={newSubgroupAvatar} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewSubgroupAvatar('📁')}
                            title="Rimuovi foto"
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[9px] cursor-pointer hover:bg-red-600"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => createSubImageRef.current?.click()}
                        title="Carica foto da file"
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-600 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      </button>

                      {PRESET_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewSubgroupAvatar(icon)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                            newSubgroupAvatar === icon
                              ? 'bg-purple-200 dark:bg-purple-900 border-2 border-purple-600 scale-105'
                              : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Nome Sottogruppo *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="es. Team Marketing, Area Logistica..."
                      value={newSubgroupName}
                      onChange={(e) => setNewSubgroupName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  </div>

                  {/* Descrizione */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Descrizione (Opzionale)
                    </label>
                    <input
                      type="text"
                      placeholder="Breve scopo di questo sottogruppo"
                      value={newSubgroupDesc}
                      onChange={(e) => setNewSubgroupDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Privacy: Pubblico vs Privato */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Visibilità
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewSubgroupIsPublic(false)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          !newSubgroupIsPublic
                            ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-500 shadow-2xs'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span className="text-[11px] font-bold block text-neutral-900 dark:text-white">
                          🔒 Privato
                        </span>
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block">
                          Solo con codice univoco
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSubgroupIsPublic(true)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          newSubgroupIsPublic
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-2xs'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span className="text-[11px] font-bold block text-neutral-900 dark:text-white">
                          🌐 Pubblico
                        </span>
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block">
                          Tutti i membri del gruppo
                        </span>
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newSubgroupName.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creazione...' : 'Crea Sottogruppo'}
                    </button>
                  </div>
                </form>
              )}

              {/* Form Modifica / Personalizzazione Sottogruppo Esistente */}
              {editingSubgroup && (
                <form
                  onSubmit={handleSaveEditSubmit}
                  className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/70 space-y-3.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Personalizza: {editingSubgroup.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingSubgroup(null)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Icona
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setEditAvatar(icon)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                            editAvatar === icon
                              ? 'bg-amber-200 dark:bg-amber-900 border-2 border-amber-600 scale-105'
                              : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Nome Sottogruppo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Descrizione
                    </label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Visibilità
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditIsPublic(false)}
                        className={`p-2 rounded-xl border text-left cursor-pointer ${
                          !editIsPublic
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 shadow-2xs'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span className="text-[11px] font-bold block text-neutral-900 dark:text-white">
                          🔒 Privato
                        </span>
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block">
                          Solo con codice
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditIsPublic(true)}
                        className={`p-2 rounded-xl border text-left cursor-pointer ${
                          editIsPublic
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-2xs'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span className="text-[11px] font-bold block text-neutral-900 dark:text-white">
                          🌐 Pubblico
                        </span>
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block">
                          Tutti i membri
                        </span>
                      </button>
                    </div>
                  </div>

                  {editError && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                      {editError}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingSubgroup(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit || !editName.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingEdit ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista Sottogruppi Esistenti */}
              {subgroups.length === 0 && !isCreating ? (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-700 text-center space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    Nessun sottogruppo creato finora.
                  </p>
                  {isResponsabile ? (
                    <button
                      type="button"
                      onClick={() => setIsCreating(true)}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crea il primo sottogruppo come Responsabile</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-neutral-400">
                      I sottogruppi possono essere creati solo da chi possiede il ruolo di "Responsabile".
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {subgroups.map((subgroup) => {
                    const isSelected = activeSubgroupId === subgroup.id;
                    const canManageSubgroup = (isResponsabile || isCreator) && onUpdateSubgroup;
                    const canDelete = isResponsabile && onDeleteSubgroup;
                    
                    // L'accesso è garantito se:
                    // 1. È pubblico (isPublic)
                    // 2. È creatore del gruppo o del sottogruppo
                    // 3. Ha inserito il codice ed è in subgroup.members
                    const hasAccess =
                      isCreator ||
                      Boolean(subgroup.isPublic) ||
                      subgroup.createdBy === currentUser.id ||
                      (Array.isArray(subgroup.members) && subgroup.members.includes(currentUser.id));
                    const isUnlockingThis = unlockingSubgroupId === subgroup.id;

                    return (
                      <div
                        key={subgroup.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 dark:border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (hasAccess) {
                              onSelectSubgroup(subgroup.id);
                              onClose();
                            } else {
                              setUnlockingSubgroupId(isUnlockingThis ? null : subgroup.id);
                              setEnteredCode('');
                              setUnlockError(null);
                            }
                          }}
                          className="w-full p-3 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <GroupAvatar
                              avatar={subgroup.avatar}
                              name={subgroup.name}
                              size="sm"
                              fallbackEmoji="📁"
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                  {subgroup.name}
                                </p>
                                <span
                                  className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full border ${
                                    subgroup.isPublic
                                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                                  }`}
                                >
                                  {subgroup.isPublic ? '🌐 Pubblico' : '🔒 Privato'}
                                </span>
                                {!hasAccess && (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    🔒 Codice richiesto
                                  </span>
                                )}
                              </div>
                              {subgroup.description ? (
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                  {subgroup.description}
                                </p>
                              ) : (
                                <p className="text-[10px] text-neutral-400">
                                  {hasAccess ? 'Sottogruppo attivo' : 'Clicca per inserire il codice'}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                              </span>
                            )}

                            {/* Mostra / Copia codice se l'utente ha accesso */}
                            {hasAccess && subgroup.code && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyCode(subgroup, e)}
                                title="Copia codice di accesso sottogruppo"
                                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-[#f23e2e] flex items-center gap-1 transition-colors"
                              >
                                {copiedCodeSubgroupId === subgroup.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600">Copiato!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{subgroup.code}</span>
                                  </>
                                )}
                              </button>
                            )}

                            {!hasAccess && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnlockingSubgroupId(isUnlockingThis ? null : subgroup.id);
                                  setEnteredCode('');
                                  setUnlockError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shadow-2xs"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Entra</span>
                              </button>
                            )}

                            {/* Tasto Modifica / Personalizza */}
                            {canManageSubgroup && (
                              <button
                                type="button"
                                onClick={(e) => handleStartEdit(subgroup, e)}
                                title="Personalizza sottogruppo"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tasto Elimina */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(subgroup, e)}
                                disabled={deletingId === subgroup.id}
                                title="Elimina sottogruppo"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Modulo Inline di inserimento Codice Sottogruppo se bloccato */}
                        {!hasAccess && isUnlockingThis && (
                          <form
                            onSubmit={(e) => handleUnlockSubmit(subgroup, e)}
                            className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border-t border-amber-200/80 dark:border-amber-800/60 space-y-2 animate-in fade-in"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                              <span>Inserisci il codice di accesso per {subgroup.name}:</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                autoFocus
                                placeholder="es. SUB-A1B2"
                                value={enteredCode}
                                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                                className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-xl text-neutral-900 dark:text-white uppercase focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isUnlocking || !enteredCode.trim()}
                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                              >
                                {isUnlocking ? 'Verifica...' : 'Sblocca'}
                              </button>
                            </div>

                            {unlockError && (
                              <p className="text-[10px] font-bold text-red-600 dark:text-red-400">
                                {unlockError}
                              </p>
                            )}
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
