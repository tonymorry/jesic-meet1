/**
 * JESic Meet - SubgroupsDrawer (Cartelle e Sottogruppi)
 * 
 * Aperto dal tasto con l'icona a 3 lineette (menu hamburger) quando si è dentro un gruppo:
 * - Mostra la Cartella Generale (Gruppo Principale - accessibile a tutti)
 * - Mostra l'elenco dei Sottogruppi di lavoro (sottocartelle)
 * - REQUISITO: I sottogruppi spuntano a tutti i membri, ma l'accesso avviene solo tramite codice (come nel gruppo generale)
 * - Solo chi ha il ruolo di "Responsabile" in quel gruppo (o il creatore) può creare nuovi sottogruppi
 */

import React, { useState } from 'react';
import { Group, Subgroup, User } from '../types';
import {
  X,
  Folder,
  FolderPlus,
  FolderOpen,
  Check,
  Plus,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface SubgroupsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroup: Group;
  activeSubgroupId: string | null;
  onSelectSubgroup: (subgroupId: string | null) => void;
  currentUser: User;
  onCreateSubgroup: (name: string, description?: string) => Promise<boolean | void>;
  onDeleteSubgroup?: (subgroupId: string) => Promise<boolean | void>;
  onJoinSubgroup?: (subgroupId: string, code: string) => Promise<{ success: boolean; error?: string }>;
}

export const SubgroupsDrawer: React.FC<SubgroupsDrawerProps> = ({
  isOpen,
  onClose,
  activeGroup,
  activeSubgroupId,
  onSelectSubgroup,
  currentUser,
  onCreateSubgroup,
  onDeleteSubgroup,
  onJoinSubgroup,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [newSubgroupDesc, setNewSubgroupDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      await onCreateSubgroup(newSubgroupName.trim(), newSubgroupDesc.trim());
      setNewSubgroupName('');
      setNewSubgroupDesc('');
      setIsCreating(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Errore durante la creazione del sottogruppo');
    } finally {
      setIsSubmitting(false);
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
          
          {/* Header Drawer */}
          <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl p-1 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shrink-0">
                {activeGroup.avatar || '👥'}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-neutral-900 dark:text-white truncate">
                    {activeGroup.name}
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#f23e2e]" />
                  <span>Cartelle e Sottogruppi di Lavoro</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer transition-colors"
              aria-label="Chiudi menu sottogruppi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge Ruolo Utente */}
          <div className="px-4 sm:px-5 py-2.5 bg-neutral-100/70 dark:bg-neutral-800/50 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              Il tuo ruolo in questo gruppo:
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isResponsabile
                  ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
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

            {/* 2. SEZIONE: SOTTOGRUPPI (SOTTOCARTELLE PROTETTE DA CODICE) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Sottogruppi ({subgroups.length})
                </span>

                {isResponsabile && !isCreating && (
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

              {/* Form Creazione Nuovo Sottogruppo (Visibile SOLO a Responsabile/Creatore) */}
              {isCreating && (
                <form
                  onSubmit={handleCreateSubmit}
                  className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border-2 border-purple-300 dark:border-purple-800/70 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Crea Sottocartella (genera codice di accesso)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

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
                      {isSubmitting ? 'Creazione...' : 'Crea & Genera Codice'}
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
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
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
                    const canDelete = isResponsabile && onDeleteSubgroup;
                    // L'accesso è garantito a chi ha creato il sottogruppo, al creatore del gruppo principale,
                    // oppure a chi ha inserito il codice ed è in subgroup.members
                    const hasAccess =
                      isCreator ||
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
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : hasAccess
                                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400'
                              }`}
                            >
                              {hasAccess ? (
                                <FolderOpen className="w-4 h-4 stroke-[2.2px]" />
                              ) : (
                                <Lock className="w-4 h-4 stroke-[2.2px] text-amber-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                  {subgroup.name}
                                </p>
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

                            {/* Mostra / Copia codice se l'utente ha accesso (per condividerlo) */}
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
                              <button
                                type="button"
                                onClick={() => setUnlockingSubgroupId(null)}
                                className="text-neutral-400 hover:text-neutral-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                autoFocus
                                placeholder="es. SUB-A1B2"
                                value={enteredCode}
                                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                                className="flex-1 px-3 py-1.5 text-xs font-mono font-bold uppercase bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              />
                              <button
                                type="submit"
                                disabled={isUnlocking || !enteredCode.trim()}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {isUnlocking ? 'Verifica...' : 'Conferma'}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {unlockError && (
                              <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">
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

          {/* Footer Informativo */}
          <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#f23e2e] shrink-0" />
              <span>Calendario Unico: tutti gli eventi di gruppo e sottogruppi insieme.</span>
            </p>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>Sondaggi e Chat: isolati e dedicati al sottogruppo selezionato.</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
