/**
 * JESic Meet - GroupWorkspaceHeader
 * 
 * Barra superiore visualizzata quando l'utente entra all'interno di un Gruppo:
 * - Tasto per tornare alla lista dei gruppi della piattaforma
 * - Titolo del gruppo con possibilità per il creatore di modificarne il nome
 * - Tasto per eliminare l'intero gruppo (esclusivo per il creatore)
 * - Codice univoco con copia rapida
 * - Pulsante per visualizzare, invitare ed espellere membri
 */

import React, { useState } from 'react';
import { Group, User } from '../types';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

export interface GroupWorkspaceHeaderProps {
  activeGroup: Group;
  currentUser: User;
  allUsers: User[];
  onBackToGroups: () => void;
  onOpenMembersModal: () => void;
  onUpdateGroupName?: (groupId: string, newName: string) => Promise<boolean | void>;
  onDeleteGroup?: (groupId: string) => Promise<boolean | void>;
}

export const GroupWorkspaceHeader: React.FC<GroupWorkspaceHeaderProps> = ({
  activeGroup,
  currentUser,
  allUsers,
  onBackToGroups,
  onOpenMembersModal,
  onUpdateGroupName,
  onDeleteGroup,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(activeGroup.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGroup.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCreator = activeGroup.creatorId === currentUser.id || currentUser.role === 'admin';

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || newName.trim() === activeGroup.name) {
      setIsEditingName(false);
      return;
    }
    if (!onUpdateGroupName) return;

    setIsSavingName(true);
    try {
      await onUpdateGroupName(activeGroup.id, newName.trim());
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteGroup) return;
    setIsDeleting(true);
    try {
      await onDeleteGroup(activeGroup.id);
      setShowDeleteConfirm(false);
      onBackToGroups();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200/90 dark:border-neutral-800 shadow-2xs transition-colors mb-4 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tasto Torna Indietro + Nome Gruppo con Modifica */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToGroups}
              className="p-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="Torna alla lista dei tuoi gruppi"
            >
              <ArrowLeft className="w-4 h-4 text-[#f23e2e]" />
              <span className="hidden sm:inline">I Tuoi Gruppi</span>
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0 p-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                {activeGroup.avatar || '👥'}
              </span>
              <div className="min-w-0">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1.5 py-0.5">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={isSavingName}
                      autoFocus
                      className="text-sm sm:text-base font-black px-2.5 py-1 rounded-xl border-2 border-[#f23e2e] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName || !newName.trim()}
                      className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
                      title="Salva nuovo nome"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setNewName(activeGroup.name);
                      }}
                      className="p-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer"
                      title="Annulla modifica"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate leading-tight">
                      {activeGroup.name}
                    </h2>
                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(activeGroup.name);
                          setIsEditingName(true);
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-[#f23e2e] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Modifica nome gruppo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-[#f23e2e] px-2 py-0.5 rounded-full shrink-0">
                      {isCreator ? 'Creatore' : 'Gruppo'}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border ${
                        activeGroup.isPublic
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300/80 dark:border-emerald-800/60'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {activeGroup.isPublic ? '🌐 Pubblico' : '🔒 Privato'}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  Spazio di lavoro condiviso del gruppo
                </p>
              </div>
            </div>
          </div>

          {/* Azioni Gruppo: Codice Univoco & Membri & Elimina Gruppo */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {/* Codice Gruppo con Copia */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-400 font-semibold">Codice:</span>
              <span className="text-xs font-mono font-black text-neutral-900 dark:text-white">
                {activeGroup.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copia codice di invito"
                className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Tasto Membri Gruppo */}
            <button
              type="button"
              onClick={onOpenMembersModal}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-[#f23e2e]" />
              <span>Membri ({activeGroup.members.length})</span>
            </button>

            {/* Tasto Elimina Gruppo (visibile SOLO al creatore) */}
            {isCreator && onDeleteGroup && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 border border-red-200/50 dark:border-red-900/40"
                title="Elimina questo gruppo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modale Conferma Eliminazione Gruppo */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5px]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                Eliminare il gruppo?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Sei sicuro di voler eliminare definitivamente <strong>"{activeGroup.name}"</strong>? L'operazione non può essere annullata.
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
                    <span>Elimina Gruppo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
