/**
 * JESic Meet - GroupWorkspaceHeader
 * 
 * Barra superiore visualizzata quando l'utente entra all'interno di un Gruppo:
 * - Tasto per tornare alla lista dei gruppi della piattaforma
 * - Titolo del gruppo, codice univoco con copia rapida
 * - Pulsante per visualizzare e invitare membri
 */

import React, { useState } from 'react';
import { Group, User } from '../types';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Share2,
  Shield,
  Plus,
} from 'lucide-react';

interface GroupWorkspaceHeaderProps {
  activeGroup: Group;
  currentUser: User;
  allUsers: User[];
  onBackToGroups: () => void;
  onOpenMembersModal: () => void;
}

export const GroupWorkspaceHeader: React.FC<GroupWorkspaceHeaderProps> = ({
  activeGroup,
  currentUser,
  allUsers,
  onBackToGroups,
  onOpenMembersModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGroup.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCreator = activeGroup.creatorId === currentUser.id;

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200/90 dark:border-neutral-800 shadow-2xs transition-colors mb-4 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tasto Torna Indietro + Nome Gruppo */}
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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate leading-tight">
                  {activeGroup.name}
                </h2>
                <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-[#f23e2e] px-2 py-0.5 rounded-full shrink-0">
                  {isCreator ? 'Creatore' : 'Gruppo'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                Spazio di lavoro condiviso del gruppo
              </p>
            </div>
          </div>
        </div>

        {/* Azioni Gruppo: Codice Univoco & Membri */}
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
        </div>
      </div>
    </div>
  );
};
