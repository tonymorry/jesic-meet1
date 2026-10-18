/**
 * JESic Meet - Platform Bottom Navigation Bar (3 Tab)
 * Junior Enterprise Sicilia
 * 
 * 1. SINISTRA: "Gruppi" (Lista dei gruppi dell'utente, crea nuovo gruppo, unisciti con codice/link)
 * 2. CENTRO: "Sondaggi" (Creati da te / A cui sei invitato + Tasto per creare nuovo sondaggio)
 * 3. DESTRA: "Profilo" (Profilo utente, Google Calendar, e pannello Super Admin protetto)
 */

import React from 'react';
import { Users, BarChart3, User as UserIcon } from 'lucide-react';
import { User } from '../types';

export type PlatformTab = 'groups' | 'polls' | 'profile';

interface PlatformBottomNavProps {
  currentTab: PlatformTab;
  onSelectTab: (tab: PlatformTab) => void;
  groupsCount?: number;
  pendingInvitesCount?: number;
  currentUser?: User | null;
}

export const PlatformBottomNav: React.FC<PlatformBottomNavProps> = ({
  currentTab,
  onSelectTab,
  groupsCount = 0,
  pendingInvitesCount = 0,
  currentUser,
}) => {
  return (
    <nav
      aria-label="Navigazione principale piattaforma"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto sm:max-w-xl md:max-w-2xl"
    >
      <div className="relative bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md border-t border-neutral-200/90 dark:border-neutral-800 px-4 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-3 items-center h-14">
          
          {/* 1. SINISTRA: GRUPPI */}
          <button
            type="button"
            onClick={() => onSelectTab('groups')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer relative ${
              currentTab === 'groups'
                ? 'text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="I tuoi Gruppi"
          >
            <div className="relative">
              <Users
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'groups' ? 'stroke-[2.5px] scale-110 text-[#f23e2e]' : 'stroke-[1.8px]'
                }`}
              />
              {groupsCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-xs">
                  {groupsCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight leading-none ${
                currentTab === 'groups'
                  ? 'font-black text-[#f23e2e]'
                  : 'font-semibold text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Gruppi
            </span>
          </button>

          {/* 2. CENTRO: SONDAGGI */}
          <button
            type="button"
            onClick={() => onSelectTab('polls')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer relative ${
              currentTab === 'polls'
                ? 'text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Sondaggi di disponibilità"
          >
            <div className="relative">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  currentTab === 'polls'
                    ? 'bg-[#f23e2e] text-white shadow-md shadow-red-500/30 -translate-y-1'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <BarChart3
                  className={`w-5 h-5 transition-transform ${
                    currentTab === 'polls' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                  }`}
                />
              </div>
              {pendingInvitesCount > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-[17px] h-4 px-1 rounded-full bg-[#f23e2e] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-xs animate-pulse">
                  {pendingInvitesCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                currentTab === 'polls'
                  ? 'font-black text-[#f23e2e]'
                  : 'font-semibold text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Sondaggi
            </span>
          </button>

          {/* 3. DESTRA: PROFILO */}
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer relative ${
              currentTab === 'profile'
                ? 'text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Profilo personale"
          >
            <div className="relative">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className={`w-5 h-5 rounded-full object-cover transition-all ${
                    currentTab === 'profile'
                      ? 'ring-2 ring-[#f23e2e] scale-110'
                      : 'border border-neutral-300 dark:border-neutral-700'
                  }`}
                />
              ) : (
                <UserIcon
                  className={`w-5 h-5 transition-transform ${
                    currentTab === 'profile' ? 'stroke-[2.5px] scale-110 text-[#f23e2e]' : 'stroke-[1.8px]'
                  }`}
                />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight leading-none ${
                currentTab === 'profile'
                  ? 'font-black text-[#f23e2e]'
                  : 'font-semibold text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Profilo
            </span>
          </button>

        </div>
      </div>
    </nav>
  );
};
