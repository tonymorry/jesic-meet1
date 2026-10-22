/**
 * JESic Meet - GroupMembersModal
 * 
 * Mostra la lista delle persone appartenenti a un gruppo specifico,
 * con ruoli (Admin / Membro), opzioni rapide per condividere il codice o link d'invito,
 * e possibilità per il creatore di espellere i membri tramite icona "X".
 */

import React, { useState } from 'react';
import { Group, User } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Users,
  Copy,
  Check,
  Share2,
  Shield,
  UserPlus,
  Mail,
  UserMinus,
  AlertCircle,
} from 'lucide-react';

export interface GroupMembersModalProps {
  group: Group;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onAddMemberEmail?: (email: string) => Promise<boolean>;
  onRemoveMember?: (memberId: string) => Promise<boolean | void>;
  onUpdateMemberRole?: (memberId: string, newRole: 'member' | 'admin' | 'admin_clienti') => Promise<void> | void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  group,
  currentUser,
  allUsers,
  onClose,
  onAddMemberEmail,
  onRemoveMember,
  onUpdateMemberRole,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?join=${group.code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmailInput.trim() || !onAddMemberEmail) return;
    const ok = await onAddMemberEmail(inviteEmailInput.trim());
    if (ok) {
      setInviteMsg(`Invito registrato per ${inviteEmailInput}!`);
      setInviteEmailInput('');
      setTimeout(() => setInviteMsg(null), 3000);
    }
  };

  const myMembership = group.members.find((m) => m.userId === currentUser.id);
  const isCreator = group.creatorId === currentUser.id || myMembership?.role === 'admin';

  const handleRemoveMemberClick = async (memberId: string, memberName: string) => {
    if (!onRemoveMember) return;
    const confirmed = window.confirm(`Sei sicuro di voler espellere ${memberName} dal gruppo "${group.name}"?`);
    if (!confirmed) return;

    setRemovingId(memberId);
    setErrorMsg(null);
    try {
      await onRemoveMember(memberId);
      setInviteMsg(`${memberName} è stato espulso dal gruppo.`);
      setTimeout(() => setInviteMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Errore durante la rimozione del membro');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{group.avatar || '👥'}</span>
            <div>
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                Membri di {group.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {group.members.length} {group.members.length === 1 ? 'persona' : 'persone'} in questo gruppo
                {isCreator && ' • Tu sei il Creatore'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback / Notifiche */}
        {inviteMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{inviteMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Box Condivisione Codice / Link */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#f23e2e]" />
              <span>Invita colleghi in questo gruppo</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              Codice Gruppo
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <span className="text-xs font-mono font-black text-neutral-900 dark:text-white tracking-wider">
                {group.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copia codice di invito"
                className="text-[11px] font-bold text-[#f23e2e] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="Copia link d'invito diretto"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiato' : 'Copia Link'}</span>
            </button>
          </div>
        </div>

        {/* Guida Gerarchia Ruoli */}
        <div className="p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 rounded-2xl space-y-1.5 text-xs">
          <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-[11px]">
            <span>🛡️</span> Gerarchia Ruoli nel Gruppo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
            <div className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="font-black text-neutral-800 dark:text-neutral-200 block">1. Membro Semplice</span>
              <span className="text-neutral-500 dark:text-neutral-400">Entra nel gruppo, crea SOLO sondaggi</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="font-black text-[#f23e2e] block">2. Admin</span>
              <span className="text-neutral-500 dark:text-neutral-400">Membro + crea eventi ufficiali</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="font-black text-amber-600 dark:text-amber-400 block">3. Admin Clienti</span>
              <span className="text-neutral-500 dark:text-neutral-400">Admin + form B2B & richieste</span>
            </div>
          </div>
        </div>

        {/* Lista Membri */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Lista Persone nel Gruppo
            </p>
            {isCreator && (
              <span className="text-[10px] font-semibold text-neutral-400">
                Puoi modificare ruoli o espellere
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {group.members.map((membership) => {
              const user = allUsers.find((u) => u.id === membership.userId);
              const isMe = membership.userId === currentUser.id;
              const isGroupCreator = group.creatorId === membership.userId;
              const isGroupAdmin = isGroupCreator || membership.role === 'admin';
              const isGroupAdminClienti = membership.role === 'admin_clienti';
              const canExpel = isCreator && !isMe && !isGroupCreator;
              const canChangeRole = isCreator && !isGroupCreator && onUpdateMemberRole;
              const memberName = user ? `${user.name} ${user.surname}` : 'Utente Membro';

              return (
                <div
                  key={membership.userId}
                  className="p-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {user ? (
                      <UserAvatar user={user} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600">
                        ?
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {memberName}
                        {isMe && ' (Tu)'}
                        {isGroupCreator && ' • Creatore'}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span>{user ? user.email : 'Email'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Selezionatore Ruolo interattivo per il creatore, altrimenti badge fisso */}
                    {canChangeRole ? (
                      <select
                        value={membership.role}
                        disabled={updatingRoleId === membership.userId}
                        onChange={async (e) => {
                          const newRole = e.target.value as 'member' | 'admin' | 'admin_clienti';
                          setUpdatingRoleId(membership.userId);
                          try {
                            await onUpdateMemberRole(membership.userId, newRole);
                          } catch (err: any) {
                            setErrorMsg(err?.message || 'Errore aggiornamento ruolo');
                            setTimeout(() => setErrorMsg(null), 3000);
                          } finally {
                            setUpdatingRoleId(null);
                          }
                        }}
                        aria-label={`Ruolo di ${memberName}`}
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-xl cursor-pointer border outline-hidden transition-all ${
                          membership.role === 'admin'
                            ? 'bg-red-50 dark:bg-red-950/60 text-[#f23e2e] border-red-300 dark:border-red-800'
                            : membership.role === 'admin_clienti'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        <option value="member">👤 Membro (Solo Sondaggi)</option>
                        <option value="admin">⚡ Admin (+ Eventi Ufficiali)</option>
                        <option value="admin_clienti">🏢 Admin Clienti (+ Form B2B & Richieste)</option>
                      </select>
                    ) : (
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
                          isGroupCreator
                            ? 'bg-red-100 dark:bg-red-950/60 text-[#f23e2e] border border-red-200/60 dark:border-red-900/40'
                            : isGroupAdmin
                            ? 'bg-red-100 dark:bg-red-950/60 text-[#f23e2e]'
                            : isGroupAdminClienti
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            : 'bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {isGroupCreator ? '👑 Creatore' : isGroupAdmin ? '⚡ Admin' : isGroupAdminClienti ? '🏢 Admin Clienti' : '👤 Membro'}
                      </span>
                    )}

                    {/* Iconcina a forma di "X" per espellere il membro (visibile solo al creatore) */}
                    {canExpel && onRemoveMember && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberClick(membership.userId, memberName)}
                        disabled={removingId === membership.userId}
                        className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs border border-red-200/60 dark:border-red-900/40 disabled:opacity-50"
                        title={`Espelli ${memberName} dal gruppo`}
                        aria-label={`Espelli ${memberName} dal gruppo`}
                      >
                        {removingId === membership.userId ? (
                          <span className="text-[10px] animate-spin">⏳</span>
                        ) : (
                          <X className="w-3.5 h-3.5 stroke-[3px]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
