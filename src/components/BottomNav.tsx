/**
 * JESic Meet - Bottom Navigation Bar Mobile-First
 * 
 * Requisiti di Visibilità e Ruoli:
 * 1. Schermata Principale (Piattaforma):
 *    - "Gruppi": Lista dei gruppi a cui l'utente partecipa
 *    - "Sondaggi": Hub dedicato ai sondaggi (Creati da te / A cui sei invitato)
 *    - "Richieste Clienti": visibile e accessibile SOLO ad 'admin' e 'admin_clienti'. Nascosta per 'user'.
 *    - "Profilo": Pagina del profilo utente
 * 2. Quando l'utente entra in un Gruppo:
 *    - Dashboard When2meet, Eventi, [ + ], Richieste (solo per admin/admin_clienti), Calendario, Profilo.
 */

import React from 'react';
import {
  Users,
  Inbox,
  User as UserIcon,
  Home,
  ClipboardList,
  Calendar,
  Plus,
  Briefcase,
} from 'lucide-react';

export type NavTab = 'groups' | 'polls' | 'profile' | 'dashboard' | 'events' | 'requests' | 'calendar';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateMenu?: () => void;
  pendingInvitesCount?: number;
  pendingOfficialEventsCount?: number;
  isClientAdmin?: boolean; // True SOLO per 'admin' e 'admin_clienti'
  pendingClientRequestsCount?: number;
  isInsideGroup?: boolean; // Se l'utente è dentro un gruppo specifico
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateMenu,
  pendingInvitesCount = 0,
  pendingOfficialEventsCount = 0,
  isClientAdmin = false,
  pendingClientRequestsCount = 0,
  isInsideGroup = false,
}) => {
  return (
    <nav
      aria-label="Navigazione principale mobile"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto sm:max-w-xl md:hidden"
    >
      {/* Background glass bar */}
      <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/90 dark:border-neutral-800 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
        
        {/* ====================================================================
            CASO 1: LIVELLO PIATTAFORMA (FUORI DA UN GRUPPO)
           ==================================================================== */}
        {!isInsideGroup ? (
          <div className="flex items-center justify-around h-14">
            {/* 1. "Gruppi" */}
            <button
              type="button"
              onClick={() => onSelectTab('groups')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'groups'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Gruppi"
            >
              <Users
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'groups' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
                }`}
              />
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

            {/* 2. "Sondaggi" */}
            <button
              type="button"
              onClick={() => onSelectTab('polls')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 relative cursor-pointer ${
                currentTab === 'polls'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Sondaggi di disponibilità"
            >
              <div className="relative">
                <Inbox
                  className={`w-5 h-5 transition-transform ${
                    currentTab === 'polls' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
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
                  currentTab === 'polls'
                    ? 'font-black text-[#f23e2e]'
                    : 'font-semibold text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Sondaggi
              </span>
            </button>

            {/* 3. "Calendario" (Fuori dai gruppi) */}
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'calendar'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Calendario eventi fuori dai gruppi"
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

            {/* 4. "Richieste Clienti" (VISIBILE SOLO PER 'admin' e 'admin_clienti', NASCOSTA PER 'user') */}
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
                  <Briefcase
                    className={`w-5 h-5 transition-transform ${
                      currentTab === 'requests' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
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

            {/* 5. "Profilo" */}
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'profile'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Profilo personale"
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
        ) : (
          /* ====================================================================
             CASO 2: DENTRO UN GRUPPO
             ==================================================================== */
          <div className="flex items-center justify-between h-14">
            {/* 1. Sondaggi Gruppo (ex Dashboard) */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 relative cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Sondaggi del gruppo"
            >
              <Inbox
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'dashboard' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
                }`}
              />
              <span
                className={`text-[10px] mt-1 tracking-tight leading-none ${
                  currentTab === 'dashboard'
                    ? 'font-black text-[#f23e2e]'
                    : 'font-semibold text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Sondaggi
              </span>
            </button>

            {/* 2. Eventi Ufficiali Gruppo */}
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

            {/* 3. Tasto Centrale "+" Creazione */}
            {onOpenCreateMenu && (
              <div className="flex-1 flex items-center justify-center -mt-5">
                <button
                  type="button"
                  onClick={onOpenCreateMenu}
                  aria-label="Crea nuovo sondaggio o evento"
                  className="w-12 h-12 rounded-full bg-[#f23e2e] hover:bg-red-600 text-white shadow-lg shadow-red-600/35 hover:shadow-red-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white dark:ring-neutral-900"
                >
                  <Plus className="w-6 h-6 stroke-[3px]" />
                </button>
              </div>
            )}

            {/* 4. Richieste Clienti (SOLO per admin e admin_clienti) */}
            {isClientAdmin && (
              <button
                type="button"
                onClick={() => onSelectTab('requests')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 relative cursor-pointer ${
                  currentTab === 'requests'
                    ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                aria-label="Richieste Clienti"
              >
                <div className="relative">
                  <Briefcase
                    className={`w-5 h-5 transition-transform ${
                      currentTab === 'requests' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
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

            {/* 5. Calendario Gruppo */}
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'calendar'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Calendario impegni"
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

            {/* 6. Profilo */}
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'profile'
                  ? 'text-[#f23e2e] dark:text-[#f23e2e]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              aria-label="Profilo personale"
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
        )}
      </div>
    </nav>
  );
};
