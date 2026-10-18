/**
 * JESic Meet - GroupMembersModal
 * 
 * Mostra la lista delle persone appartenenti a un gruppo specifico,
 * con ruoli (Admin / Membro), e opzioni rapide per condividere il codice o link d'invito.
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
} from 'lucide-react';

interface GroupMembersModalProps {
  group: Group;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onAddMemberEmail?: (email: string) => Promise<boolean>;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  group,
  currentUser,
  allUsers,
  onClose,
  onAddMemberEmail,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = group.inviteLink || `${window.location.origin}/?join=${group.code}`;
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

        {/* Lista Membri */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Lista Persone nel Gruppo
          </p>

          <div className="space-y-1.5">
            {group.members.map((membership) => {
              const user = allUsers.find((u) => u.id === membership.userId);
              const isMe = membership.userId === currentUser.id;
              const isGroupAdmin = membership.role === 'admin' || group.creatorId === membership.userId;

              return (
                <div
                  key={membership.userId}
                  className="p-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user ? (
                      <UserAvatar user={user} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600">
                        ?
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {user ? `${user.name} ${user.surname}` : 'Utente Membro'}
                        {isMe && ' (Tu)'}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span>{user ? user.email : 'Email'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
                      isGroupAdmin
                        ? 'bg-red-100 dark:bg-red-950/60 text-[#f23e2e] border border-red-200/60 dark:border-red-900/40'
                        : 'bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {isGroupAdmin ? 'Admin Gruppo' : 'Membro'}
                  </span>
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
