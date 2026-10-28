/**
 * JESic Meet - Header Superiore Reattivo (Mobile & Desktop / PC)
 * Brand identity JESic (Rosso #f23e2e e Nero/Grigio)
 * Su Mobile: Compatto con logo, toggle tema e profilo.
 * Su PC/Desktop: Barra di navigazione completa con tab attive, badge, pulsante "+ Nuovo" e profilo.
 */

import React from 'react';
import { User } from '../types';
import { NavTab } from './BottomNav';
import { UserAvatar } from './UserAvatar';
import {
  Sun,
  Moon,
  Home,
  ClipboardList,
  Calendar,
  Inbox,
  Plus,
  Users,
  User as UserIcon,
  Menu,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

export type AppTheme = 'light' | 'dark';

export interface TopHeaderProps {
  currentUser: User;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  theme?: AppTheme;
  onCycleTheme?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onOpenCreateMenu?: () => void;
  onToggleSubgroupsMenu?: () => void;
  activeSubgroupName?: string;
  pendingInvitesCount?: number;
  pendingOfficialEventsCount?: number;
  isClientAdmin?: boolean;
  pendingClientRequestsCount?: number;
  isInsideGroup?: boolean;
  onBackToGroups?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  onLogout,
  onNavigateToProfile,
  theme,
  onCycleTheme,
  isDarkMode = false,
  onToggleDarkMode,
  currentTab = 'groups',
  onSelectTab,
  onOpenCreateMenu,
  onToggleSubgroupsMenu,
  activeSubgroupName,
  pendingInvitesCount = 0,
  pendingOfficialEventsCount = 0,
  isClientAdmin = false,
  pendingClientRequestsCount = 0,
  isInsideGroup = false,
  onBackToGroups,
}) => {
  const currentTheme: AppTheme = theme || (isDarkMode ? 'dark' : 'light');

  const handleThemeClick = () => {
    if (onCycleTheme) {
      onCycleTheme();
    } else if (onToggleDarkMode) {
      onToggleDarkMode();
    }
  };

  const getThemeMeta = () => {
    switch (currentTheme) {
      case 'light':
        return {
          currentLabel: 'Tema Chiaro (Sole)',
          nextLabel: 'Tema Scuro (Luna)',
        };
      case 'dark':
      default:
        return {
          currentLabel: 'Tema Scuro (Luna)',
          nextLabel: 'Tema Chiaro (Sole)',
        };
    }
  };

  const { currentLabel, nextLabel } = getThemeMeta();

  const handleLogoClick = () => {
    if (onBackToGroups) {
      onBackToGroups();
    }
    if (onSelectTab) {
      onSelectTab('groups');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="flex items-center justify-between max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
        
        {/* Logo Brand JESic Meet - Cliccato riporta sempre alla Home */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0 active:scale-95 transition-transform select-none"
          title="Torna alla Home"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogoClick();
            }
          }}
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="JESic Logo" className="w-full h-full object-contain drop-shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-1 leading-none">
              <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white">
                JESic<span className="text-[#f23e2e] font-bold ml-0.5">Meet</span>
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
              Junior Enterprise Sicilia
            </p>
          </div>
        </div>

        {/* NAVIGAZIONE DESKTOP / PC (Visibile su schermi medi e grandi >= md) */}
        {onSelectTab && (
          <nav className="hidden md:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 shadow-2xs">
            {!isInsideGroup ? (
              /* Piattaforma Level: Gruppi - Sondaggi - Calendario - [Richieste] - Profilo */
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('groups')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'groups'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs font-black'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gruppi</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('polls')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    currentTab === 'polls'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs font-black'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Sondaggi</span>
                  {pendingInvitesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#f23e2e] text-white text-[9px] font-black">
                      {pendingInvitesCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('calendar')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'calendar'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs font-black'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendario</span>
                </button>



                <button
                  type="button"
                  onClick={() => onSelectTab('profile')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'profile'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs font-black'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profilo</span>
                </button>
              </>
            ) : (
              /* Group Workspace Level */
              <>
                {onBackToGroups && (
                  <button
                    type="button"
                    onClick={onBackToGroups}
                    className="p-1.5 rounded-xl text-neutral-500 hover:text-[#f23e2e] hover:bg-white dark:hover:bg-neutral-900 transition-all flex items-center justify-center cursor-pointer mr-0.5"
                    title="Torna indietro"
                    aria-label="Torna indietro"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#f23e2e] stroke-[2.5px]" />
                  </button>
                )}

                {/* 0. Tasto 3 Lineette (Menu Hamburger Cartelle & Sottogruppi - solo icona) */}
                {onToggleSubgroupsMenu && (
                  <button
                    type="button"
                    onClick={onToggleSubgroupsMenu}
                    className="p-1.5 rounded-xl text-xs font-bold bg-neutral-200/70 hover:bg-neutral-300/80 dark:bg-neutral-700/60 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 transition-all flex items-center justify-center cursor-pointer mr-1 active:scale-95"
                    title={activeSubgroupName ? `Cartella attiva: ${activeSubgroupName}` : 'Sottogruppi e Cartelle'}
                    aria-label="Menu Sottogruppi"
                  >
                    <Menu className="w-4 h-4 stroke-[2.5px] text-[#f23e2e]" />
                  </button>
                )}

                {/* 1. Sondaggi (filtrati per sottogruppo attivo o gruppo generale) */}
                <button
                  type="button"
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs font-black'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Sondaggi</span>
                </button>

                {/* 2. Eventi */}
                <button
                  type="button"
                  onClick={() => onSelectTab('events')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    currentTab === 'events'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Eventi</span>
                  {pendingOfficialEventsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#f23e2e] text-white text-[9px] font-black">
                      {pendingOfficialEventsCount}
                    </span>
                  )}
                </button>

                {/* 3. Richieste Clienti (Esclusivo Admin Clienti) */}
                {isClientAdmin && (
                  <button
                    type="button"
                    onClick={() => onSelectTab('requests')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentTab === 'requests'
                        ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Richieste Clienti</span>
                    {pendingClientRequestsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#f23e2e] text-white text-[9px] font-black animate-pulse">
                        {pendingClientRequestsCount}
                      </span>
                    )}
                  </button>
                )}

                {/* 4. Calendario (Unico e Condiviso per tutto il gruppo) */}
                <button
                  type="button"
                  onClick={() => onSelectTab('calendar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'calendar'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendario</span>
                </button>

                {/* 5. Chat (sostituisce Profilo dentro il gruppo) */}
                <button
                  type="button"
                  onClick={() => onSelectTab('chat')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'chat'
                      ? 'bg-white dark:bg-neutral-900 text-[#f23e2e] shadow-xs font-black'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* Azioni Desktop & Mobile: "+ Nuovo", Tema Scuro/Chiaro, Profilo Utente */}
        <div className="flex items-center gap-2">
          {/* Bottone Desktop "+ Nuovo" */}
          {onOpenCreateMenu && (
            <button
              type="button"
              onClick={onOpenCreateMenu}
              className="hidden md:flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#f23e2e] hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer"
              title="Crea nuovo sondaggio o evento"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Nuovo</span>
            </button>
          )}

          {/* Bottoncino di cambio modalità: Chiaro (Sole) o Scuro (Luna) */}
          <button
            type="button"
            onClick={handleThemeClick}
            aria-label={`Tema attuale: ${currentLabel}. Clicca per passare a ${nextLabel}`}
            title={`Tema attuale: ${currentLabel} (Clicca per passare a ${nextLabel})`}
            className={`w-8 h-8 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
              currentTheme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600 text-neutral-200'
                : 'bg-amber-50/90 border-amber-300/80 hover:border-amber-400 text-amber-600'
            }`}
          >
            {currentTheme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-300 fill-neutral-300/20 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Profilo Utente Connesso (Visibile su desktop in TopHeader; su mobile è in basso a destra nella barra di navigazione) */}
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="hidden md:flex p-0.5 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            title={`Visualizza profilo di ${currentUser.name} ${currentUser.surname}`}
            aria-label="Profilo Utente"
          >
            <UserAvatar user={currentUser} size="sm" />
          </button>
        </div>

      </div>
    </header>
  );
};
