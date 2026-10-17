/**
 * JESic Meet - Bottom Navigation Bar Mobile-First
 * Brand JESic: Rosso #f23e2e, Bianco, Nero
 * 
 * 5 Sezioni Principali:
 * 1. 🏠 DASHBOARD (Sondaggi disponibilità stile When2meet)
 * 2. 📋 EVENTI (Bacheca inviti ufficiali in sospeso con Partecipa/Non Partecipo)
 * 3. ➕ NUOVO (Bottone centrale rialzato rosso con controllo ruolo Admin vs Associate)
 * 4. 🗓️ CALENDARIO (Vista grafica mensile/settimanale impegni associativi)
 * 5. 👤 PROFILO
 */

import React from 'react';
import { Home, ClipboardList, Plus, Calendar, User as UserIcon, Inbox } from 'lucide-react';

export type NavTab = 'dashboard' | 'events' | 'requests' | 'calendar' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateMenu: () => void;
  pendingInvitesCount?: number;
  pendingOfficialEventsCount?: number;
  isClientAdmin?: boolean;
  pendingClientRequestsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateMenu,
  pendingInvitesCount = 0,
  pendingOfficialEventsCount = 0,
  isClientAdmin = false,
  pendingClientRequestsCount = 0,
}) => {
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto sm:max-w-xl md:hidden"
    >
      {/* Background glass bar */}
      <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/90 dark:border-neutral-800 px-3 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between h-14">
          
          {/* 1. 🏠 DASHBOARD */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 relative cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Dashboard sondaggi"
          >
            <div className="relative">
              <Home
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'dashboard' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
                }`}
              />
              {pendingInvitesCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f23e2e] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-xs">
                  {pendingInvitesCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight leading-none ${
                currentTab === 'dashboard'
                  ? 'font-black text-[#f23e2e]'
                  : 'font-semibold text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Dashboard
            </span>
          </button>

          {/* 2. 📋 EVENTI (Bacheca Inviti) */}
          <button
            type="button"
            onClick={() => onSelectTab('events')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 relative cursor-pointer ${
              currentTab === 'events'
                ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Bacheca Eventi"
          >
            <div className="relative">
              <ClipboardList
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'events' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
                }`}
              />
              {pendingOfficialEventsCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f23e2e] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-xs">
                  {pendingOfficialEventsCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight leading-none ${
                currentTab === 'events'
                  ? 'font-black text-[#f23e2e]'
                  : 'font-semibold text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Eventi
            </span>
          </button>

          {/* TAB ESCLUSIVA RUOLO "ADMIN CLIENTI": 📥 RICHIESTE CLIENTI */}
          {isClientAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('requests')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 relative cursor-pointer ${
                currentTab === 'requests'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Richieste Clienti B2B"
            >
              <div className="relative">
                <Inbox
                  className={`w-5 h-5 transition-transform ${
                    currentTab === 'requests' ? 'stroke-[2.5px] scale-110 text-[#f23e2e]' : 'stroke-[1.8px]'
                  }`}
                />
                {pendingClientRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f23e2e] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-xs animate-pulse">
                    {pendingClientRequestsCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight leading-none ${
                  currentTab === 'requests'
                    ? 'font-black text-[#f23e2e]'
                    : 'font-semibold text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Richieste
              </span>
            </button>
          )}

          {/* 3. ➕ NUOVO (Bottone centrale rialzato rosso #f23e2e) */}
          <div className="relative -top-5 flex items-center justify-center px-1">
            <button
              type="button"
              onClick={onOpenCreateMenu}
              className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#f23e2e] to-red-500 text-white shadow-[0_8px_20px_rgba(229,57,53,0.45)] hover:shadow-[0_12px_24px_rgba(229,57,53,0.55)] active:scale-90 transition-all duration-200 ring-4 ring-white dark:ring-neutral-900 cursor-pointer"
              aria-label="Crea nuovo"
            >
              <Plus className="w-7 h-7 stroke-[2.8px] transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* 4. 🗓️ CALENDARIO */}
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
              currentTab === 'calendar'
                ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Calendario"
          >
            <Calendar
              className={`w-5 h-5 transition-transform ${
                currentTab === 'calendar' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
              }`}
            />
            <span
              className={`text-[10px] mt-1 tracking-tight leading-none ${
                currentTab === 'calendar'
                  ? 'font-black text-[#f23e2e]'
                  : 'font-semibold text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Calendario
            </span>
          </button>

          {/* 5. 👤 PROFILO */}
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Profilo"
          >
            <UserIcon
              className={`w-5 h-5 transition-transform ${
                currentTab === 'profile' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
              }`}
            />
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
