/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  MeetingEvent,
  EventResponse,
  InviteeConfig,
  UserSystemRole,
  ClientRequest,
  Group,
  AppRole,
  GroupMemberRole,
  Subgroup,
} from './types';
import { isEventPassed } from './utils/dateUtils';
import { AuthScreen } from './components/AuthScreen';
import { TopHeader, AppTheme } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { EventsFeedView } from './components/EventsFeedView';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { GroupsHubView } from './components/GroupsHubView';
import { PollsHubView } from './components/PollsHubView';
import { GroupWorkspaceHeader } from './components/GroupWorkspaceHeader';
import { GroupMembersModal } from './components/GroupMembersModal';
import { SubgroupsDrawer } from './components/SubgroupsDrawer';
import { GroupChatView } from './components/GroupChatView';
import { CreateEventModal, PreFillClientData } from './components/CreateEventModal';
import { CreateOfficialEventModal } from './components/CreateOfficialEventModal';
import { CreateActionChoiceModal } from './components/CreateActionChoiceModal';
import { EventDetailModal } from './components/EventDetailModal';
import { OfficialEventDetailModal } from './components/OfficialEventDetailModal';
import { PublicBookingForm } from './components/PublicBookingForm';
import { ClientRequestsDashboard } from './components/ClientRequestsDashboard';
import { SplashScreen } from './components/SplashScreen';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
import { autoSyncMeetingEventToCalendar } from './utils/googleWorkspaceAuth';

// Chiavi LocalStorage versione pulita V3
const STORAGE_USERS_KEY = 'jesic_meet_v3_users';
const STORAGE_CURRENT_USER_KEY = 'jesic_meet_v3_current_user';
const STORAGE_EVENTS_KEY = 'jesic_meet_v3_events';
const STORAGE_RESPONSES_KEY = 'jesic_meet_v3_responses';
const STORAGE_CLIENT_REQUESTS_KEY = 'jesic_meet_v3_client_requests';
const STORAGE_GROUPS_KEY = 'jesic_meet_v3_groups';
const STORAGE_ACTIVE_GROUP_KEY = 'jesic_meet_v3_active_group_id';

export default function App() {
  // Riconoscimento rotte pubbliche (/prenota-call, /privacy, /terms)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/prenota-call' || hash === '#/prenota-call') {
        return '/prenota-call';
      }
      if (path === '/privacy' || hash === '#/privacy') {
        return '/privacy';
      }
      if (path === '/terms' || hash === '#/terms') {
        return '/terms';
      }
    }
    return '/';
  });

  // Ascolto popstate per tasto indietro/avanti browser
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/prenota-call' || hash === '#/prenota-call') {
        setCurrentRoute('/prenota-call');
      } else if (path === '/privacy' || hash === '#/privacy') {
        setCurrentRoute('/privacy');
      } else if (path === '/terms' || hash === '#/terms') {
        setCurrentRoute('/terms');
      } else {
        setCurrentRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Lista utenti registrati (Nessun dato fittizio / mock data)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_USERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Utente autenticato
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Eventi creati (Inizialmente vuoto)
  const [events, setEvents] = useState<MeetingEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Risposte alle disponibilità (When2meet)
  const [responses, setResponses] = useState<EventResponse[]>(() => {
    const saved = localStorage.getItem(STORAGE_RESPONSES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Richieste Clienti B2B (Inizialmente vuoto)
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_CLIENT_REQUESTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((r: any) => !r.id?.startsWith('req-sample'))
          : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Gruppi di lavoro (Inizialmente vuoto)
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem(STORAGE_GROUPS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((g: any) => g.creatorId !== 'seed-admin')
          : [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Gruppo Attivo (null se siamo al livello piattaforma / home generale)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_ACTIVE_GROUP_KEY) || null;
  });

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;
  const isInsideGroup = Boolean(activeGroup);

  // Sottogruppo Attivo (null = Gruppo Principale / Generale)
  const [activeSubgroupId, setActiveSubgroupId] = useState<string | null>(null);
  const [isSubgroupsDrawerOpen, setIsSubgroupsDrawerOpen] = useState(false);

  // Sottogruppo selezionato corrente
  const activeSubgroup: Subgroup | null =
    activeGroup?.subgroups?.find((s) => s.id === activeSubgroupId) || null;

  // Modale Membri del Gruppo
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);

  // Salvataggio localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_RESPONSES_KEY, JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CLIENT_REQUESTS_KEY, JSON.stringify(clientRequests));
  }, [clientRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    if (activeGroupId) {
      localStorage.setItem(STORAGE_ACTIVE_GROUP_KEY, activeGroupId);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_GROUP_KEY);
    }
  }, [activeGroupId]);

  // Sincronizzazione Dati da MongoDB Atlas tramite Express API
  useEffect(() => {
    // 1. Carica e sincronizza Utenti e Ruolo dal Database
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            const dbMatch = data.users.find(
              (u: User) => u.id === prevUser.id || u.email.toLowerCase() === prevUser.email.toLowerCase()
            );
            if (dbMatch) {
              return {
                ...prevUser,
                ...dbMatch,
                role: dbMatch.role || 'user',
                systemRole: dbMatch.role || 'user',
              };
            }
            return prevUser;
          });
        }
      })
      .catch((e) => console.log('[Sync /api/users]', e))
      .finally(() => {
        setIsAuthDetermined(true);
      });

    // 2. Carica Gruppi dal Database
    fetch('/api/groups')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.groups) && data.groups.length > 0) {
          setGroups(data.groups);
        }
      })
      .catch((e) => console.log('[Sync /api/groups]', e));

    // 3. Carica Eventi (Sondaggi e Ufficiali) dal Database
    fetch('/api/events')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch((e) => console.log('[Sync /api/events]', e));

    // 4. Carica Risposte Disponibilità (When2meet) dal Database
    fetch('/api/responses')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.responses) && data.responses.length > 0) {
          setResponses(data.responses);
        }
      })
      .catch((e) => console.log('[Sync /api/responses]', e));

    // 5. Carica Richieste Clienti B2B dal Database
    fetch('/api/client-requests')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.requests) && data.requests.length > 0) {
          setClientRequests(data.requests);
        }
      })
      .catch((e) => console.log('[Sync /api/client-requests]', e));
  }, []);


  // Stato Splash Screen iniziale:
  // - showSplash: controlla la visibilità dello splash screen
  // - isAuthDetermined: true non appena sappiamo se mostrare AuthScreen o Dashboard
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthDetermined, setIsAuthDetermined] = useState(() => {
    return !!localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  });

  // Stato UI Navigazione:
  // - Fuori dal gruppo: 'groups' | 'polls' | 'profile'
  // - Dentro un gruppo: 'dashboard' | 'events' | 'calendar' | 'requests' | 'profile'
  const [currentTab, setCurrentTab] = useState<NavTab>('groups');

  // Modali Creazione
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);
  const [isCreateOfficialModalOpen, setIsCreateOfficialModalOpen] = useState(false);

  // Pre-compilazione da Richiesta Cliente
  const [pollPrefillData, setPollPrefillData] = useState<PreFillClientData | undefined>(undefined);

  // Modale Dettaglio Evento When2meet o Evento Ufficiale
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Stato Evento in Modifica (Sondaggio o Evento Ufficiale)
  const [eventToEdit, setEventToEdit] = useState<MeetingEvent | undefined>(undefined);

  // Gestione Temi: 'light' (Sole / Bianco) e 'dark' (Luna / Nero)
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('jesic_meet_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved as AppTheme;
    }
    const oldDark = localStorage.getItem('jesic_meet_dark_mode');
    if (oldDark !== null) {
      return oldDark === 'true' ? 'dark' : 'light';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-brand');

    if (theme === 'dark') {
      root.classList.add('dark');
    }

    localStorage.setItem('jesic_meet_theme', theme);
    localStorage.setItem('jesic_meet_dark_mode', theme === 'dark' ? 'true' : 'false');
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Ruolo dell'utente all'interno del gruppo specifico (RBAC per Gruppo)
  // 1. Fuori dai gruppi (Home generale): tutti quanti sono semplicemente utenti normali.
  // 2. I ruoli speciali (admin e admin_clienti) sono assegnati SPECIFICAMENTE all'interno di ogni singolo gruppo.
  // 3. I poteri speciali si attivano solo quando l'utente entra nel gruppo in cui possiede quel ruolo.
  // 4. Di conseguenza, il modulo B2B è separato: gestibile solo da chi è admin o admin_clienti di quel gruppo.
  const activeGroupMembership = activeGroup?.members?.find((m) => m.userId === currentUser?.id);
  const isGroupCreator = Boolean(activeGroup && activeGroup.creatorId === currentUser?.id);
  const currentGroupRole = activeGroup
    ? (activeGroupMembership?.role || (isGroupCreator ? 'admin' : 'member'))
    : 'member';

  const isGroupAdmin = isInsideGroup && (isGroupCreator || currentGroupRole === 'admin');
  const isGroupAdminClienti = isInsideGroup && currentGroupRole === 'admin_clienti';

  // Gerarchia Ruoli nel Gruppo:
  // 1. Membro Semplice: entra nel gruppo e può creare solo i "sondaggi"
  // 2. Admin: membro + può creare gli eventi (sondaggi ed eventi ufficiali associativi)
  // 3. Admin Clienti: admin + form per il b2b e richieste clienti (riservato esclusivamente a questo ruolo)
  const canCreateOfficialEvents = isInsideGroup && (isGroupAdmin || isGroupAdminClienti);
  const canAccessGroupClientRequests = isInsideGroup && isGroupAdminClienti;
  const isClientAdmin = canAccessGroupClientRequests;

  // Protezione Rotta Richieste: accessibile SOLO all'interno del gruppo e per admin_clienti del gruppo
  useEffect(() => {
    if (currentTab === 'requests' && !canAccessGroupClientRequests) {
      setCurrentTab(isInsideGroup ? 'dashboard' : 'groups');
    }
  }, [currentTab, canAccessGroupClientRequests, isInsideGroup]);

  // Supporto invito automatico tramite URL parametro (?join=CODE) o path (/join/CODE) o hash
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const qJoin = searchParams.get('join');
      if (qJoin) return qJoin.trim().toUpperCase();
      if (window.location.pathname.startsWith('/join/')) {
        const parts = window.location.pathname.split('/join/')[1];
        if (parts) return parts.split('/')[0].split('?')[0].trim().toUpperCase();
      }
      return sessionStorage.getItem('pending_group_invite');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let detectedJoinCode: string | null = null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      detectedJoinCode = searchParams.get('join');

      if (!detectedJoinCode && window.location.pathname.startsWith('/join/')) {
        const parts = window.location.pathname.split('/join/')[1];
        if (parts) detectedJoinCode = parts.split('/')[0].split('?')[0];
      }

      if (!detectedJoinCode && window.location.hash) {
        const hashStr = window.location.hash.replace(/^#\/?/, '');
        if (hashStr.startsWith('join/')) {
          detectedJoinCode = hashStr.split('join/')[1].split('?')[0];
        } else if (hashStr.includes('join=')) {
          detectedJoinCode = new URLSearchParams(hashStr).get('join');
        }
      }
    } catch {}

    if (detectedJoinCode) {
      const clean = detectedJoinCode.trim().toUpperCase();
      sessionStorage.setItem('pending_group_invite', clean);
      setPendingInviteCode(clean);
    }
  }, []);

  // Quando l'utente è autenticato ed è presente un codice invito in sospeso, esegui l'ingresso automatico
  useEffect(() => {
    if (!currentUser) return;
    const codeToJoin = pendingInviteCode || (typeof window !== 'undefined' ? sessionStorage.getItem('pending_group_invite') : null);
    if (!codeToJoin) return;

    handleJoinGroup(codeToJoin).then((res) => {
      if (res.success) {
        sessionStorage.removeItem('pending_group_invite');
        setPendingInviteCode(null);
        try {
          if (window.location.search.includes('join=') || window.location.pathname.startsWith('/join/')) {
            window.history.replaceState({}, '', '/');
          }
        } catch {}
      }
    });
  }, [currentUser, pendingInviteCode]);

  // Navigazione alla pagina pubblica /prenota-call
  const navigateToPublicBooking = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/prenota-call');
    }
    setCurrentRoute('/prenota-call');
  };

  // Navigazione alla pagina pubblica /privacy
  const navigateToPrivacy = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/privacy');
    }
    setCurrentRoute('/privacy');
  };

  // Navigazione alla pagina pubblica /terms
  const navigateToTerms = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/terms');
    }
    setCurrentRoute('/terms');
  };

  // Ritorno dalle pagine pubbliche all'app interna
  const navigateBackToApp = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setCurrentRoute('/');
  };

  // Handler sottomissione form pubblico /prenota-call
  const handleClientRequestSubmit = (
    requestData: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newReqId = `req-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newClientRequest: ClientRequest = {
      ...requestData,
      id: newReqId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setClientRequests((prev) => [newClientRequest, ...prev]);

    try {
      fetch('/api/client-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      }).catch((e) => console.log('[Client Request API local sync]', e));
    } catch {}

    return true;
  };

  // Conversione Richiesta Cliente in Sondaggio Team
  const handleConvertToPoll = (request: ClientRequest) => {
    const prefill: PreFillClientData = {
      title: `Call con ${request.companyName}`,
      description: `Richiesta del cliente: "${request.description}"\nReferente: ${request.companyName} (${request.contactEmail})`,
      clientRequestId: request.id,
      clientInfo: {
        companyName: request.companyName,
        contactEmail: request.contactEmail,
      },
      fixedSlots: request.preferredSlots,
    };

    setPollPrefillData(prefill);
    setIsCreatePollModalOpen(true);
  };

  // Conferma Evento Finale B2B
  const handleConfirmFinalClientEvent = async (
    request: ClientRequest,
    finalSlot: { date: string; startTime: string; endTime: string },
    eventId?: string
  ) => {
    const generatedMeet = `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-meet`;

    setClientRequests((prev) =>
      prev.map((r) =>
        r.id === request.id
          ? {
              ...r,
              status: 'confirmed',
              finalizedSlot: finalSlot,
              meetLink: generatedMeet,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    if (eventId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                status: 'confirmed',
                finalizedSlot: finalSlot,
                meetLink: generatedMeet,
              }
            : e
        )
      );

      const targetEvt = events.find((e) => e.id === eventId);
      if (targetEvt && currentUser) {
        const updatedEvt: MeetingEvent = {
          ...targetEvt,
          status: 'confirmed',
          finalizedSlot: finalSlot,
          meetLink: generatedMeet,
        };
        const attendeeUsers = users.filter((u) => targetEvt.invitees.some((inv) => inv.userId === u.id));
        autoSyncMeetingEventToCalendar(updatedEvt, finalSlot, currentUser, attendeeUsers).catch((e) =>
          console.log('[Auto Google Calendar Sync client call]', e)
        );
      }
    }

    try {
      await fetch(`/api/client-requests/${request.id}/confirm-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          finalizedDate: finalSlot.date,
          finalizedStartTime: finalSlot.startTime,
          finalizedEndTime: finalSlot.endTime,
          organizerName: currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Team JESic',
          organizerRole: currentUser?.role || 'Admin Clienti JESic',
          adminEmail: currentUser?.email,
        }),
      }).catch((e) => console.log('[API confirmation sync]', e));
    } catch {}
  };

  // GESTIONE REGISTRAZIONE / LOGIN SINCRONIZZATA CON MONGODB (Default sempre 'user')
  const handleRegisterUser = async (newUserData: Omit<User, 'id'>) => {
    // REGOLA: Di base tutti i nuovi utenti nascono sempre e solo con role 'user'
    const assignedRole: AppRole = 'user';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserData,
          role: assignedRole,
          systemRole: assignedRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const createdUser: User = {
            ...data.user,
            role: data.user.role || assignedRole,
            systemRole: data.user.role || assignedRole,
          };
          setUsers((prev) => [...prev.filter((u) => u.id !== createdUser.id), createdUser]);
          setCurrentUser(createdUser);
          setCurrentTab('groups');
          return;
        }
      }
    } catch (e) {
      console.log('[API register user sync error]', e);
    }

    const fallbackUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      role: assignedRole,
      systemRole: assignedRole,
    };
    setUsers((prev) => [...prev, fallbackUser]);
    setCurrentUser(fallbackUser);
    setCurrentTab('groups');
  };

  const handleLoginUser = async (user: User) => {
    // Sincronizza immediatamente il profilo con MongoDB via /api/users/sync (senza dipendere dai token Google)
    try {
      const syncRes = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          surname: user.surname,
        }),
      });
      if (syncRes.ok) {
        const data = await syncRes.json();
        if (data.user) {
          const freshUser: User = {
            ...user,
            ...data.user,
            role: (data.user.role as AppRole) || 'user',
            systemRole: (data.user.role as AppRole) || 'user',
          };
          setUsers((prev) => [...prev.filter((u) => u.id !== freshUser.id && u.email.toLowerCase() !== freshUser.email.toLowerCase()), freshUser]);
          setCurrentUser(freshUser);
          setCurrentTab('groups');
          return;
        }
      }
    } catch (e) {
      console.log('[API login user sync error]', e);
    }

    const fallbackRole: AppRole = user.role || 'user';
    const fallbackUser: User = {
      ...user,
      role: fallbackRole,
      systemRole: fallbackRole,
    };
    setCurrentUser(fallbackUser);
    setCurrentTab('groups');
  };

  // Accesso e Sincronizzazione con il vero Google OAuth2 (Authorization Code con permessi Google Calendar)
  const handleGoogleAuthCode = async (code: string) => {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const authUser: User = {
            ...data.user,
            googleCalendarConnected: true,
          };
          setUsers((prev) => [
            ...prev.filter(
              (u) => u.id !== authUser.id && u.email.toLowerCase() !== authUser.email.toLowerCase()
            ),
            authUser,
          ]);
          setCurrentUser(authUser);
          setCurrentTab('groups');
          return;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Errore durante la sincronizzazione con MongoDB');
      }
    } catch (e: any) {
      console.warn('[handleGoogleAuthCode error]', e);
      throw e;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveGroupId(null);
    setActiveSubgroupId(null);
    setCurrentTab('groups');
  };

  // Aggiornamento Ruolo Utente nel DATABASE (Protetto per soli Super Admin)
  const handleUpdateUserRole = (targetUserId: string, newRole: AppRole) => {
    if (currentUser?.role !== 'admin') return;

    const updatedUsers = users.map((u) =>
      u.id === targetUserId
        ? {
            ...u,
            role: newRole,
            systemRole: newRole,
          }
        : u
    );
    setUsers(updatedUsers);

    if (currentUser.id === targetUserId) {
      setCurrentUser({
        ...currentUser,
        role: newRole,
        systemRole: newRole,
      });
    }

    fetch(`/api/users/${targetUserId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole, adminId: currentUser.id }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUserId ? { ...u, ...data.user, role: data.user.role } : u))
          );
        }
      })
      .catch((e) => console.log('[API user role update]', e));
  };

  // Aggiornamento Profilo Utente (foto avatar, Google Calendar)
  const handleUpdateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // GESTIONE GRUPPI
  const handleSelectGroup = (group: Group) => {
    setActiveGroupId(group.id);
    setActiveSubgroupId(null);
    setCurrentTab('dashboard');
  };

  const handleBackToGroups = () => {
    setActiveGroupId(null);
    setActiveSubgroupId(null);
    setCurrentTab('groups');
  };

  const handleCreateGroup = async (
    name: string,
    description: string,
    avatar?: string,
    isPublic: boolean = false
  ): Promise<{ success: boolean; group?: Group; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Devi aver effettuato l\'accesso.' };

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description ? description.trim() : '',
          avatar: avatar || '👥',
          creatorId: currentUser.id,
          isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.group) {
        throw new Error(data?.error || 'Errore durante la creazione del gruppo su MongoDB');
      }

      const realGroup: Group = data.group;

      // Aggiorna lo stato dei gruppi con il gruppo salvato realmente su MongoDB
      setGroups((prev) => [realGroup, ...prev.filter((g) => g.id !== realGroup.id)]);
      setActiveGroupId(realGroup.id);
      setCurrentTab('dashboard');

      // Sincronizza lo stato utente locale (groupMemberships con ruolo admin)
      setCurrentUser((prevUser) => {
        if (!prevUser) return prevUser;
        const currentMemberships = prevUser.groupMemberships || [];
        const hasMembership = currentMemberships.some((m) => m.groupId === realGroup.id);
        const updatedMemberships = hasMembership
          ? currentMemberships
          : [...currentMemberships, { groupId: realGroup.id, role: 'admin' as const }];
        const updatedUser: User = {
          ...prevUser,
          groupMemberships: updatedMemberships,
        };
        try {
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
        } catch {}
        return updatedUser;
      });

      return { success: true, group: realGroup };
    } catch (err: any) {
      console.error('[handleCreateGroup error]', err);
      throw err;
    }
  };

  const handleJoinPublicGroup = async (
    targetGroup: Group
  ): Promise<{ success: boolean; message: string; group?: Group }> => {
    if (!currentUser) return { success: false, message: 'Devi aver effettuato l\'accesso.' };

    const alreadyMember = targetGroup.members.some((m) => m.userId === currentUser.id);
    if (alreadyMember) {
      setActiveGroupId(targetGroup.id);
      setCurrentTab('dashboard');
      return { success: true, message: 'Sei già membro di questo gruppo!', group: targetGroup };
    }

    if (!targetGroup.isPublic) {
      return { success: false, message: 'Questo gruppo è privato. Inserisci il codice d\'invito.' };
    }

    try {
      const res = await fetch(`/api/groups/${targetGroup.id}/join-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await res.json();
      const updatedGroup: Group = data?.group || {
        ...targetGroup,
        members: [
          ...targetGroup.members,
          {
            userId: currentUser.id,
            role: 'member',
            joinedAt: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      setGroups((prev) => prev.map((g) => (g.id === targetGroup.id ? updatedGroup : g)));
      setActiveGroupId(updatedGroup.id);
      setCurrentTab('dashboard');

      // Sincronizza l'appartenenza nel profilo utente locale
      setCurrentUser((prevUser) => {
        if (!prevUser) return prevUser;
        const memberships = prevUser.groupMemberships || [];
        if (!memberships.some((m) => m.groupId === updatedGroup.id)) {
          const updatedUser = {
            ...prevUser,
            groupMemberships: [...memberships, { groupId: updatedGroup.id, role: 'member' as const }],
          };
          try {
            localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
          } catch {}
          return updatedUser;
        }
        return prevUser;
      });

      return {
        success: true,
        message: data?.message || 'Sei entrato nel gruppo pubblico con successo!',
        group: updatedGroup,
      };
    } catch (e) {
      console.warn('[API join public group error]', e);
      return { success: false, message: 'Errore durante l\'adesione al gruppo pubblico' };
    }
  };

  const handleJoinGroup = async (
    codeOrLink: string
  ): Promise<{ success: boolean; message: string; group?: Group }> => {
    if (!currentUser) return { success: false, message: 'Devi aver effettuato l\'accesso per entrare in un gruppo.' };

    const rawInput = codeOrLink.trim();
    if (!rawInput) return { success: false, message: 'Inserisci un codice o link d\'invito valido.' };

    try {
      // 1. Chiamata al server backend: interroga MongoDB e sincronizza l'utente in modo affidabile
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeOrLink: rawInput,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.group) {
        const returnedGroup: Group = data.group;

        // Aggiorna lo stato React dei gruppi con i dati freschi da MongoDB
        setGroups((prev) => {
          const exists = prev.some((g) => g.id === returnedGroup.id);
          return exists
            ? prev.map((g) => (g.id === returnedGroup.id ? returnedGroup : g))
            : [returnedGroup, ...prev];
        });

        // Entra direttamente nella Dashboard del gruppo
        setActiveGroupId(returnedGroup.id);
        setCurrentTab('dashboard');

        // Sincronizza lo stato utente locale (groupMemberships con ruolo member)
        setCurrentUser((prevUser) => {
          if (!prevUser) return prevUser;
          const memberships = prevUser.groupMemberships || [];
          if (!memberships.some((m) => m.groupId === returnedGroup.id)) {
            const updatedUser = {
              ...prevUser,
              groupMemberships: [...memberships, { groupId: returnedGroup.id, role: 'member' as const }],
            };
            try {
              localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
            } catch {}
            return updatedUser;
          }
          return prevUser;
        });

        return {
          success: true,
          message: data.message || 'Sei entrato nel gruppo con successo!',
          group: returnedGroup,
        };
      }

      return {
        success: false,
        message: data?.error || 'Nessun gruppo trovato con questo codice d\'invito. Verifica il codice o chiedi al collega di ricondividerlo.',
      };
    } catch (err) {
      console.error('[handleJoinGroup error]', err);
      return {
        success: false,
        message: 'Errore di connessione durante l\'adesione al gruppo. Riprova tra qualche istante.',
      };
    }
  };

  // GESTIONE E MODIFICA DEI GRUPPI (Creatore o Admin)
  const handleUpdateGroupName = async (groupId: string, newName: string) => {
    if (!currentUser) return;
    const cleanName = newName.trim();
    if (!cleanName) return;

    // Aggiornamento locale immediato
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: cleanName } : g))
    );

    try {
      await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, userId: currentUser.id }),
      });
    } catch (e) {
      console.warn('[API update group name error]', e);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentUser) return;

    // Aggiornamento locale immediato
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setActiveGroupId(null);
    localStorage.removeItem(STORAGE_ACTIVE_GROUP_KEY);

    try {
      await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (e) {
      console.warn('[API delete group error]', e);
    }
  };

  const handleRemoveMemberFromGroup = async (memberId: string) => {
    if (!currentUser || !activeGroup) return;

    const updatedMembers = activeGroup.members.filter((m) => m.userId !== memberId);
    const updatedGroup: Group = { ...activeGroup, members: updatedMembers };

    setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));

    try {
      await fetch(`/api/groups/${activeGroup.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser.id }),
      });
    } catch (e) {
      console.warn('[API remove member error]', e);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: GroupMemberRole
  ) => {
    if (!currentUser || !activeGroup) return;

    const updatedMembers = activeGroup.members.map((m) =>
      m.userId === memberId ? { ...m, role: newRole } : m
    );
    const updatedGroup: Group = { ...activeGroup, members: updatedMembers };
    setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));

    if (currentUser.id === memberId) {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const currentMemberships = prev.groupMemberships || [];
        const updated = currentMemberships.map((m) =>
          m.groupId === activeGroup.id ? { ...m, role: newRole } : m
        );
        return { ...prev, groupMemberships: updated };
      });
    }

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, requesterId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.group) {
          setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? data.group : g)));
        }
      }
    } catch (e) {
      console.warn('[API update member role error]', e);
    }
  };

  // GESTIONE SOTTOGRUPPI (CARTELLE)
  const handleCreateSubgroup = async (
    name: string,
    description?: string,
    avatar?: string,
    isPublic?: boolean
  ) => {
    if (!activeGroup || !currentUser) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/subgroups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description?.trim() || '',
          avatar: avatar || '📁',
          isPublic: Boolean(isPublic),
          requesterId: currentUser.id,
          creatorId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.group) {
        throw new Error(data?.error || 'Errore nella creazione del sottogruppo');
      }
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? data.group : g)));
      if (data.subgroup) {
        setActiveSubgroupId(data.subgroup.id);
      }
    } catch (err: any) {
      console.error('[handleCreateSubgroup error]', err);
      throw err;
    }
  };

  const handleUpdateSubgroup = async (
    subgroupId: string,
    data: { name: string; description?: string; avatar?: string; isPublic?: boolean }
  ) => {
    if (!activeGroup || !currentUser) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/subgroups/${subgroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          requesterId: currentUser.id,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.group) {
        throw new Error(resData?.error || 'Errore nella modifica del sottogruppo');
      }
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? resData.group : g)));
    } catch (err: any) {
      console.error('[handleUpdateSubgroup error]', err);
      throw err;
    }
  };

  const handleJoinSubgroup = async (
    subgroupId: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeGroup || !currentUser) return { success: false, error: 'Non autorizzato' };
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/subgroups/${subgroupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.group) {
        return { success: false, error: data?.error || 'Codice errato. Riprova.' };
      }
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? data.group : g)));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Errore durante l\'accesso al sottogruppo' };
    }
  };

  const handleDeleteSubgroup = async (subgroupId: string) => {
    if (!activeGroup || !currentUser) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/subgroups/${subgroupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.group) {
        throw new Error(data?.error || 'Errore nella cancellazione del sottogruppo');
      }
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? data.group : g)));
      if (activeSubgroupId === subgroupId) {
        setActiveSubgroupId(null);
      }
    } catch (err: any) {
      console.error('[handleDeleteSubgroup error]', err);
      throw err;
    }
  };

  // LOGICA DEL BOTTONE "+"
  // REQUISITO 1: Nella Home iniziale (quando l'utente è fuori dai gruppi),
  // si possono creare ESCLUSIVAMENTE Sondaggi. La creazione Eventi è riservata allo spazio di un Gruppo.
  const handlePlusButtonClick = () => {
    if (!currentUser) return;
    if (!isInsideGroup) {
      // Fuori dai gruppi: creazione ESCLUSIVA di sondaggi orari
      setPollPrefillData(undefined);
      setEventToEdit(undefined);
      setIsCreatePollModalOpen(true);
      return;
    }

    // All'interno del Gruppo: solo admin e admin_clienti possono creare eventi ufficiali
    if (canCreateOfficialEvents) {
      setIsChoiceModalOpen(true);
    } else {
      setPollPrefillData(undefined);
      setEventToEdit(undefined);
      setIsCreatePollModalOpen(true);
    }
  };

  // CREAZIONE SONDAGGIO (POLL)
  const handleCreatePollEvent = (
    newEventData: Omit<MeetingEvent, 'id' | 'createdAt'>,
    creatorAvailability: string[],
    newUsersToRegister?: User[]
  ) => {
    if (!currentUser) return;
    const newId = `evt-${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (newUsersToRegister && newUsersToRegister.length > 0) {
      setUsers((prev) => [...prev, ...newUsersToRegister]);
    }

    const newMeetingEvent: MeetingEvent = {
      ...newEventData,
      id: newId,
      creatorId: currentUser.id,
      eventType: 'poll',
      groupId: activeGroup?.id,
      createdAt: nowIso,
    };

    setEvents((prev) => [newMeetingEvent, ...prev]);

    if (creatorAvailability.length > 0) {
      const orgResponse: EventResponse = {
        id: `resp-${Date.now()}-creator`,
        eventId: newId,
        userId: currentUser.id,
        isMandatory: true,
        availability: creatorAvailability,
        status: 'submitted',
        submittedAt: nowIso,
      };
      setResponses((prev) => [...prev, orgResponse]);

      fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgResponse),
      }).catch((e) => console.log('[API save response sync]', e));
    }

    setIsCreatePollModalOpen(false);
    setPollPrefillData(undefined);
    setEventToEdit(undefined);

    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMeetingEvent),
    }).catch((e) => console.log('[API create poll sync]', e));
  };

  const handleUpdatePollEvent = (updatedEvent: MeetingEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    setIsCreatePollModalOpen(false);
    setEventToEdit(undefined);

    fetch(`/api/events/${updatedEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEvent),
    }).catch((e) => console.log('[API update poll sync]', e));
  };

  // CREAZIONE EVENTO UFFICIALE (ADMIN)
  const handleCreateOfficialEvent = (
    newEventData: Omit<MeetingEvent, 'id' | 'createdAt'>
  ) => {
    if (!currentUser) return;
    const newId = `evt-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newMeetingEvent: MeetingEvent = {
      ...newEventData,
      id: newId,
      creatorId: currentUser.id,
      eventType: 'official',
      groupId: activeGroup?.id,
      createdAt: nowIso,
    };

    setEvents((prev) => [newMeetingEvent, ...prev]);
    setIsCreateOfficialModalOpen(false);
    setEventToEdit(undefined);

    fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser.googleAccessToken ? { Authorization: `Bearer ${currentUser.googleAccessToken}` } : {}),
      },
      body: JSON.stringify({
        ...newMeetingEvent,
        googleAccessToken: currentUser.googleAccessToken,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.event) {
          setEvents((prev) =>
            prev.map((e) => (e.id === newId ? { ...e, ...data.event } : e))
          );
        }
      })
      .catch((e) => console.log('[API create official event sync]', e));
  };

  const handleUpdateOfficialEvent = (updatedEvent: MeetingEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    setIsCreateOfficialModalOpen(false);
    setEventToEdit(undefined);

    fetch(`/api/events/${updatedEvent.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser?.googleAccessToken ? { Authorization: `Bearer ${currentUser.googleAccessToken}` } : {}),
      },
      body: JSON.stringify({
        ...updatedEvent,
        userId: currentUser?.id,
        googleRefreshToken: currentUser?.googleRefreshToken,
        googleAccessToken: currentUser?.googleAccessToken,
      }),
    }).catch((e) => console.log('[API update official event sync]', e));
  };

  // SALVATAGGIO DISPONIBILITÀ (When2meet)
  const handleSaveAvailability = (
    eventId: string,
    availability: string[],
    newUsersToRegister?: User[]
  ) => {
    if (!currentUser) return;

    if (newUsersToRegister && newUsersToRegister.length > 0) {
      setUsers((prev) => [...prev, ...newUsersToRegister]);
    }

    const existingIndex = responses.findIndex(
      (r) => r.eventId === eventId && r.userId === currentUser.id
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated = [...responses];
      updated[existingIndex] = {
        ...updated[existingIndex],
        availability,
        status: 'submitted',
        submittedAt: nowIso,
      };
      setResponses(updated);
    } else {
      const newResponse: EventResponse = {
        id: `resp-${Date.now()}`,
        eventId,
        userId: currentUser.id,
        isMandatory: true,
        availability,
        status: 'submitted',
        submittedAt: nowIso,
      };
      setResponses((prev) => [...prev, newResponse]);
    }

    fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        userId: currentUser.id,
        availability,
        isMandatory: true,
        status: 'submitted',
      }),
    }).catch((e) => console.log('[API save availability response sync]', e));

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const isInvited = e.invitees.some((inv) => inv.userId === currentUser.id);
          if (!isInvited) {
            return {
              ...e,
              invitees: [...e.invitees, { userId: currentUser.id, isMandatory: false }],
            };
          }
        }
        return e;
      })
    );
  };

  // RIFIUTO SONDAGGIO DA PARTE DELL'INVITATO
  const handleDeclinePoll = (eventId: string) => {
    if (!currentUser) return;
    const existingIndex = responses.findIndex(
      (r) => r.eventId === eventId && r.userId === currentUser.id
    );
    if (existingIndex >= 0) {
      const updated = [...responses];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: 'pending',
        availability: [],
      };
      setResponses(updated);
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              invitees: e.invitees.filter((inv) => inv.userId !== currentUser.id),
              externalInviteEmails: e.externalInviteEmails?.filter(
                (email) => email.toLowerCase() !== currentUser.email.toLowerCase()
              ),
            }
          : e
      )
    );

    fetch(`/api/events/${eventId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    }).catch((e) => console.log('[API decline poll]', e));
  };

  // ELIMINAZIONE SONDAGGIO / EVENTO DEFINITIVA DA MONGODB
  // REGOLA: Se eliminato, non compare più a NESSUN invitato (cancellato da EventModel e EventResponseModel)
  const handleDeletePoll = async (eventId: string) => {
    // 1. Rimuovi immediatamente dallo stato locale del frontend
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setResponses((prev) => prev.filter((r) => r.eventId !== eventId));
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    }

    // 2. Chiamata DELETE al backend per eliminazione reale da Google Calendar e MongoDB
    try {
      const deleteHeaders = {
        'Content-Type': 'application/json',
        ...(currentUser?.id ? { 'x-user-id': currentUser.id } : {}),
        ...(currentUser?.googleAccessToken ? { Authorization: `Bearer ${currentUser.googleAccessToken}` } : {}),
      };
      const deletePayload = JSON.stringify({
        userId: currentUser?.id,
        googleRefreshToken: currentUser?.googleRefreshToken,
      });

      const queryParams = `?userId=${currentUser?.id || ''}&googleRefreshToken=${encodeURIComponent(currentUser?.googleRefreshToken || '')}`;

      const res = await fetch(`/api/events/${eventId}${queryParams}`, {
        method: 'DELETE',
        headers: deleteHeaders,
        body: deletePayload,
      });
      if (!res.ok) {
        await fetch(`/api/polls/${eventId}${queryParams}`, {
          method: 'DELETE',
          headers: deleteHeaders,
          body: deletePayload,
        });
      }
    } catch (e) {
      console.warn('[API delete poll error]', e);
    }
  };

  // CONFERMA SLOT FINALE SONDAGGIO
  const handleConfirmMeetingSlot = async (
    eventId: string,
    finalSlot: { date: string; startTime: string; endTime: string }
  ) => {
    const targetEvt = events.find((e) => e.id === eventId);
    const generatedMeet = `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'confirmed',
              finalizedSlot: finalSlot,
              meetLink: e.type === 'online' ? (e.meetLink || generatedMeet) : undefined,
            }
          : e
      )
    );

    if (targetEvt && currentUser) {
      fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser.googleAccessToken ? { Authorization: `Bearer ${currentUser.googleAccessToken}` } : {}),
        },
        body: JSON.stringify({
          status: 'confirmed',
          finalizedSlot: finalSlot,
          googleAccessToken: currentUser.googleAccessToken,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.event) {
            setEvents((prev) =>
              prev.map((e) => (e.id === eventId ? { ...e, ...data.event } : e))
            );
          }
        })
        .catch((err) => console.log('[API confirm meeting slot sync]', err));
    }
  };

  // PARTECIPA AD EVENTO ASSOCIATIVO UFFICIALE
  const handleParticipateOfficialEvent = async (eventId: string) => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const currentParts = e.participants || [];
          const partIndex = currentParts.findIndex((p) => p.userId === currentUser.id);
          let newParticipants;
          if (partIndex >= 0) {
            newParticipants = [...currentParts];
            newParticipants[partIndex] = {
              ...newParticipants[partIndex],
              status: 'accepted',
              respondedAt: nowIso,
              googleCalendarSynced: true,
            };
          } else {
            newParticipants = [
              ...currentParts,
              {
                userId: currentUser.id,
                status: 'accepted' as const,
                respondedAt: nowIso,
                googleCalendarSynced: true,
              },
            ];
          }
          return { ...e, participants: newParticipants };
        }
        return e;
      })
    );

    const targetEvt = events.find((e) => e.id === eventId);
    if (targetEvt && targetEvt.finalizedSlot) {
      autoSyncMeetingEventToCalendar(targetEvt, targetEvt.finalizedSlot, currentUser, [currentUser]).catch((err) =>
        console.log('[Google Calendar auto-sync participate]', err)
      );
    }

    try {
      await fetch(`/api/events/${eventId}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).catch((e) => console.log('[API participate sync]', e));
    } catch {}
  };

  // RIFIUTA EVENTO ASSOCIATIVO UFFICIALE
  const handleDeclineOfficialEvent = async (eventId: string) => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const currentParts = e.participants || [];
          const partIndex = currentParts.findIndex((p) => p.userId === currentUser.id);
          let newParticipants;
          if (partIndex >= 0) {
            newParticipants = [...currentParts];
            newParticipants[partIndex] = {
              ...newParticipants[partIndex],
              status: 'declined',
              respondedAt: nowIso,
              googleCalendarSynced: false,
            };
          } else {
            newParticipants = [
              ...currentParts,
              {
                userId: currentUser.id,
                status: 'declined' as const,
                respondedAt: nowIso,
                googleCalendarSynced: false,
              },
            ];
          }
          return { ...e, participants: newParticipants };
        }
        return e;
      })
    );

    try {
      await fetch(`/api/events/${eventId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).catch((e) => console.log('[API decline sync]', e));
    } catch {}
  };

  // SOLLECITI RISPOSTE
  const handleTriggerReminders = (eventId: string) => {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;
    alert(`Solleciti email inviati con successo agli invitati che non hanno ancora votato per "${targetEvent.title}".`);
  };

  // AGGIORNAMENTO INVITATI
  const handleUpdateEventInvitees = (
    eventId: string,
    newInvitees: InviteeConfig[],
    newUsersToRegister?: User[]
  ) => {
    if (newUsersToRegister && newUsersToRegister.length > 0) {
      setUsers((prev) => [...prev, ...newUsersToRegister]);
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, invitees: newInvitees } : e))
    );
  };

  // Badge conteggio notifiche
  const pendingInvitesCount = events.filter((e) => {
    if (e.eventType === 'official') return false;
    if (isEventPassed(e)) return false;
    if (!currentUser) return false;
    if (e.creatorId === currentUser.id) return false;
    const isInvited =
      e.invitees.some((i) => i.userId === currentUser.id) ||
      e.externalInviteEmails?.some((email) => email.toLowerCase() === currentUser.email.toLowerCase());
    if (!isInvited) return false;
    const resp = responses.find((r) => r.eventId === e.id && r.userId === currentUser.id);
    return !resp || resp.status === 'pending';
  }).length;

  const pendingOfficialEventsCount = events.filter((e) => {
    if (e.eventType !== 'official') return false;
    if (isEventPassed(e)) return false;
    if (!currentUser) return false;
    const isInvited =
      e.invitees.some((i) => i.userId === currentUser.id) ||
      e.externalInviteEmails?.some((email) => email.toLowerCase() === currentUser.email.toLowerCase());
    if (!isInvited) return false;
    const myPart = e.participants?.find((p) => p.userId === currentUser.id);
    return !myPart || myPart.status === 'pending';
  }).length;

  const pendingClientRequestsCount = isInsideGroup && activeGroup
    ? clientRequests.filter((r) => r.groupId === activeGroup.id && r.status === 'pending').length
    : 0;

  // Evento selezionato nel modale
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <>
      {/* 1. ANIMAZIONE SPLASH SCREEN (Primissima cosa renderizzata sopra il sito in background) */}
      {showSplash && (
        <SplashScreen
          isReady={isAuthDetermined}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* 2. ROTTE PUBBLICHE ESTERNE (/prenota-call, /privacy, /terms) */}
      {currentRoute === '/prenota-call' ? (
        <PublicBookingForm
          groups={groups}
          initialGroupId={activeGroup?.id || null}
          onSubmitRequest={handleClientRequestSubmit}
          onBackToApp={navigateBackToApp}
        />
      ) : currentRoute === '/privacy' ? (
        <PrivacyPolicyView onBackToApp={navigateBackToApp} />
      ) : currentRoute === '/terms' ? (
        <TermsOfServiceView onBackToApp={navigateBackToApp} />
      ) : !currentUser ? (
        /* 3. SCHERMATA LOGIN / REGISTRAZIONE (Intravista subito dallo sfondo semi-trasparente) */
        <AuthScreen
          registeredUsers={users}
          onLogin={handleLoginUser}
          onRegister={handleRegisterUser}
          onGoogleAuthCode={handleGoogleAuthCode}
          onOpenPublicBooking={navigateToPublicBooking}
          pendingInviteCode={pendingInviteCode}
          onOpenPrivacy={navigateToPrivacy}
          onOpenTerms={navigateToTerms}
        />
      ) : (
        /* 4. DASHBOARD APPLICATIVA (Intravista subito dallo sfondo se utente autenticato) */
        <div className="min-h-screen bg-neutral-100 dark:bg-black font-['Ubuntu',sans-serif] text-neutral-900 dark:text-neutral-100 antialiased flex flex-col transition-colors selection:bg-[#f23e2e] selection:text-white">
          <div className="w-full max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto flex-1 flex flex-col bg-white dark:bg-neutral-900 shadow-2xl min-h-screen border-x border-neutral-200/80 dark:border-neutral-800">
          
          {/* Header Superiore */}
          <TopHeader
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToProfile={() => setCurrentTab('profile')}
            theme={theme}
            onCycleTheme={cycleTheme}
            isDarkMode={isDarkMode}
            onToggleDarkMode={cycleTheme}
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onOpenCreateMenu={handlePlusButtonClick}
            pendingInvitesCount={pendingInvitesCount}
            pendingOfficialEventsCount={pendingOfficialEventsCount}
            isClientAdmin={isClientAdmin}
            pendingClientRequestsCount={pendingClientRequestsCount}
            isInsideGroup={isInsideGroup}
            onBackToGroups={handleBackToGroups}
            activeSubgroupName={activeSubgroup ? activeSubgroup.name : undefined}
            onToggleSubgroupsMenu={() => setIsSubgroupsDrawerOpen(true)}
          />

          {/* Banner scorrevole rapido per aprire o testare la rotta esterna /prenota-call (Visibile SOLO all'interno del gruppo per Admin e Admin Clienti di questo gruppo) */}
          {isInsideGroup && isClientAdmin && activeGroup && (
            <div className="bg-neutral-900 text-neutral-300 px-4 sm:px-6 py-2 text-[11px] border-b border-neutral-800 flex items-center justify-between">
              <span className="truncate">
                🔗 Link B2B {activeGroup.name}: <code className="text-[#f23e2e] font-mono font-bold">/prenota-call?groupId={activeGroup.id}</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', `/prenota-call?groupId=${activeGroup.id}`);
                  setCurrentRoute('/prenota-call');
                }}
                className="text-[#f23e2e] hover:underline font-black shrink-0 ml-2 cursor-pointer"
              >
                Apri Form Gruppo &rarr;
              </button>
            </div>
          )}

          {/* CONTENUTO PRINCIPALE */}
          <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-3 sm:p-5">
            
            {/* ====================================================================
                CASO 1: LIVELLO PIATTAFORMA (NON IN UN GRUPPO)
                Barra navigazione: Gruppi - Sondaggi - [Richieste se admin/admin_clienti] - Profilo
               ==================================================================== */}
            {!isInsideGroup ? (
              <>
                {/* 1. SINISTRA: "Gruppi" (Home principale dei gruppi) */}
                {currentTab === 'groups' && (
                  <GroupsHubView
                    currentUser={currentUser}
                    groups={groups}
                    allUsers={users}
                    onSelectGroup={handleSelectGroup}
                    onCreateGroup={handleCreateGroup}
                    onJoinGroup={handleJoinGroup}
                    onJoinPublicGroup={handleJoinPublicGroup}
                  />
                )}

                {/* 2. CENTRO: "Sondaggi" (Creati da te / A cui sei invitato fuori dai gruppi) */}
                {currentTab === 'polls' && (
                  <PollsHubView
                    currentUser={currentUser}
                    events={events.filter((e) => !e.groupId)}
                    allUsers={users}
                    responses={responses}
                    onOpenCreatePoll={handlePlusButtonClick}
                    onOpenPollDetail={(evtId) => setSelectedEventId(evtId)}
                    onDeclinePoll={handleDeclinePoll}
                    onDeletePoll={handleDeletePoll}
                    onEventUpdated={(updatedEvt) => {
                      setEvents((prev) =>
                        prev.map((e) => (e.id === updatedEvt.id ? { ...e, ...updatedEvt } : e))
                      );
                    }}
                    onEditPoll={(evt) => {
                      setEventToEdit(evt);
                      setIsCreatePollModalOpen(true);
                    }}
                  />
                )}

                {/* 3. CALENDARIO (Eventi e Sondaggi fuori dai gruppi) */}
                {currentTab === 'calendar' && (
                  <CalendarView
                    currentUser={currentUser}
                    allEvents={events.filter((e) => !e.groupId)}
                    allUsers={users}
                    onOpenEventDetail={(evt) => setSelectedEventId(evt.id)}
                    onEventUpdated={(updatedEvt) => {
                      setEvents((prev) =>
                        prev.map((e) => (e.id === updatedEvt.id ? { ...e, ...updatedEvt } : e))
                      );
                    }}
                  />
                )}

                {/* 4. DESTRA: "Profilo" (Home Generale) */}
                {currentTab === 'profile' && (
                  <ProfileView
                    currentUser={currentUser}
                    allUsers={users}
                    groups={groups}
                    activeGroup={null}
                    onLogout={handleLogout}
                    onUpdateUserRole={handleUpdateUserRole}
                    onUpdateUserProfile={handleUpdateUserProfile}
                    onNavigateToPrivacy={navigateToPrivacy}
                    onNavigateToTerms={navigateToTerms}
                  />
                )}
              </>
            ) : activeGroup ? (
              /* ====================================================================
                  CASO 2: DENTRO UN GRUPPO (SPAZIO DI LAVORO COMPLETO)
                  Identico a tutte le funzionalità complete esistenti
                 ==================================================================== */
              <>
                {/* Header dello Spazio di Lavoro Gruppo */}
                <GroupWorkspaceHeader
                  activeGroup={activeGroup}
                  activeSubgroup={activeSubgroup}
                  currentUser={currentUser}
                  allUsers={users}
                  onBackToGroups={handleBackToGroups}
                  onBackToMainGroup={() => setActiveSubgroupId(null)}
                  onOpenMembersModal={() => setIsGroupMembersModalOpen(true)}
                  onUpdateGroupName={handleUpdateGroupName}
                  onDeleteGroup={handleDeleteGroup}
                  onUpdateSubgroup={handleUpdateSubgroup}
                  onDeleteSubgroup={handleDeleteSubgroup}
                  onToggleSubgroupsMenu={() => setIsSubgroupsDrawerOpen(true)}
                />

                {/* 1. Sondaggi del Gruppo (filtrati per Sottogruppo / Cartella) */}
                {currentTab === 'dashboard' && (
                  <Dashboard
                    currentUser={currentUser}
                    allEvents={events.filter((e) =>
                      e.groupId === activeGroup.id &&
                      (activeSubgroupId
                        ? e.subgroupId === activeSubgroupId
                        : !e.subgroupId || e.subgroupId === null)
                    )}
                    allResponses={responses}
                    allUsers={users}
                    onOpenEvent={(evt) => setSelectedEventId(evt.id)}
                    onOpenCreateModal={handlePlusButtonClick}
                    onNavigateToRequests={() => setCurrentTab('requests')}
                    isGroupClientAdmin={isClientAdmin}
                    pendingClientRequestsCount={clientRequests.filter((r) => r.groupId === activeGroup.id && r.status === 'pending').length}
                  />
                )}

                {/* 2. Eventi del Gruppo */}
                {currentTab === 'events' && (
                  <EventsFeedView
                    currentUser={currentUser}
                    allEvents={events.filter((e) => e.groupId === activeGroup.id)}
                    allUsers={users}
                    onParticipate={(evt) => handleParticipateOfficialEvent(evt.id)}
                    onDecline={(evt) => handleDeclineOfficialEvent(evt.id)}
                    onOpenCalendarTab={() => setCurrentTab('calendar')}
                    onOpenOfficialEventDetail={(evt) => setSelectedEventId(evt.id)}
                    onEditOfficialEvent={(evt) => {
                      setEventToEdit(evt);
                      setIsCreateOfficialModalOpen(true);
                    }}
                  />
                )}

                {/* 3. Richieste Clienti (Esclusivo per Admin o Admin Clienti di questo gruppo specifico) */}
                {currentTab === 'requests' && isClientAdmin && (
                  <ClientRequestsDashboard
                    currentUser={currentUser}
                    requests={clientRequests.filter((r) => r.groupId === activeGroup.id)}
                    allEvents={events}
                    allUsers={users}
                    activeGroup={activeGroup}
                    onConvertToPoll={handleConvertToPoll}
                    onConfirmFinalEvent={handleConfirmFinalClientEvent}
                    onOpenPublicBooking={navigateToPublicBooking}
                    onOpenEventDetail={(evtId) => setSelectedEventId(evtId)}
                  />
                )}

                {/* 4. Calendario associato esclusivo del Gruppo (CALENDARIO UNICO: include tutti gli eventi del gruppo e di tutti i suoi sottogruppi) */}
                {currentTab === 'calendar' && (
                  <CalendarView
                    currentUser={currentUser}
                    allEvents={events.filter((e) => e.groupId === activeGroup.id)}
                    clientRequests={clientRequests.filter((r) => r.groupId === activeGroup.id)}
                    allUsers={users}
                    onOpenEventDetail={(evt) => setSelectedEventId(evt.id)}
                    onEventUpdated={(updatedEvt) => {
                      setEvents((prev) =>
                        prev.map((e) => (e.id === updatedEvt.id ? { ...e, ...updatedEvt } : e))
                      );
                    }}
                  />
                )}

                {/* 5. Chat del Gruppo (dedicata per Sottogruppo selezionato o Generale) */}
                {currentTab === 'chat' && (
                  <GroupChatView
                    activeGroup={activeGroup}
                    activeSubgroup={activeSubgroup}
                    currentUser={currentUser}
                    allUsers={users}
                  />
                )}

                {/* 6. Profilo (Dentro il Gruppo se aperto da TopHeader) */}
                {currentTab === 'profile' && (
                  <ProfileView
                    currentUser={currentUser}
                    allUsers={users}
                    groups={groups}
                    activeGroup={activeGroup}
                    onLogout={handleLogout}
                    onUpdateUserRole={handleUpdateUserRole}
                    onUpdateUserProfile={handleUpdateUserProfile}
                    onNavigateToPrivacy={navigateToPrivacy}
                    onNavigateToTerms={navigateToTerms}
                  />
                )}
              </>
            ) : null}
          </main>

          {/* Bottom Navigation Bar */}
          <BottomNav
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            currentUser={currentUser}
            onOpenCreateMenu={handlePlusButtonClick}
            pendingInvitesCount={pendingInvitesCount}
            pendingOfficialEventsCount={pendingOfficialEventsCount}
            isClientAdmin={isClientAdmin}
            pendingClientRequestsCount={pendingClientRequestsCount}
            isInsideGroup={isInsideGroup}
            onToggleSubgroupsMenu={() => setIsSubgroupsDrawerOpen(true)}
          />

          {/* Modale Membri del Gruppo Attivo */}
          {isGroupMembersModalOpen && activeGroup && (
            <GroupMembersModal
              group={activeGroup}
              activeSubgroup={activeSubgroup}
              isClientAdmin={isClientAdmin}
              currentUser={currentUser}
              allUsers={users}
              onClose={() => setIsGroupMembersModalOpen(false)}
              onAddMemberEmail={async (email) => {
                const cleanEmail = email.trim().toLowerCase();
                const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
                if (matchedUser) {
                  if (!activeGroup.members.some((m) => m.userId === matchedUser.id)) {
                    const updatedGroup: Group = {
                      ...activeGroup,
                      members: [
                        ...activeGroup.members,
                        {
                          userId: matchedUser.id,
                          role: 'member',
                          joinedAt: new Date().toISOString(),
                        },
                      ],
                    };
                    setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
                  }
                  return true;
                }
                return true;
              }}
              onRemoveMember={handleRemoveMemberFromGroup}
              onUpdateMemberRole={handleUpdateMemberRole}
            />
          )}

          {/* Menu Scelta Azione "+" per Admin (VISIBILE SOLO ALL'INTERNO DI UN GRUPPO) */}
          {isChoiceModalOpen && isInsideGroup && (
            <CreateActionChoiceModal
              currentUser={currentUser}
              onClose={() => setIsChoiceModalOpen(false)}
              onSelectCreatePoll={() => {
                setPollPrefillData(undefined);
                setEventToEdit(undefined);
                setIsCreatePollModalOpen(true);
              }}
              onSelectCreateOfficialEvent={() => {
                setEventToEdit(undefined);
                setIsCreateOfficialModalOpen(true);
              }}
            />
          )}

          {/* Form Creazione/Modifica Sondaggio di Disponibilità */}
          {isCreatePollModalOpen && (
            <CreateEventModal
              currentUser={currentUser}
              allUsers={users}
              onClose={() => {
                setIsCreatePollModalOpen(false);
                setPollPrefillData(undefined);
                setEventToEdit(undefined);
              }}
              onCreateEvent={handleCreatePollEvent}
              prefillData={pollPrefillData}
              eventToEdit={eventToEdit}
              onUpdateEvent={handleUpdatePollEvent}
              activeGroup={activeGroup || undefined}
              activeSubgroup={activeSubgroup}
            />
          )}

          {/* Form Creazione/Modifica Evento Associativo Ufficiale (VISIBILE SOLO ALL'INTERNO DI UN GRUPPO) */}
          {isCreateOfficialModalOpen && isInsideGroup && (
            <CreateOfficialEventModal
              currentUser={currentUser}
              allUsers={users}
              onClose={() => {
                setIsCreateOfficialModalOpen(false);
                setEventToEdit(undefined);
              }}
              onCreateOfficialEvent={handleCreateOfficialEvent}
              eventToEdit={eventToEdit}
              onUpdateOfficialEvent={handleUpdateOfficialEvent}
              activeGroup={activeGroup || undefined}
            />
          )}

          {/* Menu Drawer Sottogruppi / Cartelle (Accessibile da tasto 3 lineette a sinistra) */}
          {isInsideGroup && activeGroup && (
            <SubgroupsDrawer
              isOpen={isSubgroupsDrawerOpen}
              onClose={() => setIsSubgroupsDrawerOpen(false)}
              activeGroup={activeGroup}
              activeSubgroupId={activeSubgroupId}
              onSelectSubgroup={(subgroupId) => {
                setActiveSubgroupId(subgroupId);
              }}
              currentUser={currentUser}
              onCreateSubgroup={handleCreateSubgroup}
              onUpdateSubgroup={handleUpdateSubgroup}
              onDeleteSubgroup={handleDeleteSubgroup}
              onJoinSubgroup={handleJoinSubgroup}
            />
          )}

          {/* Modale Dettaglio Sondaggio Disponibilità When2meet */}
          {selectedEvent && selectedEvent.eventType !== 'official' && (
            <EventDetailModal
              event={selectedEvent}
              currentUser={currentUser}
              allUsers={users}
              allResponses={responses}
              onClose={() => setSelectedEventId(null)}
              onSaveAvailability={handleSaveAvailability}
              onConfirmMeetingSlot={handleConfirmMeetingSlot}
              onTriggerReminders={handleTriggerReminders}
              onUpdateEventInvitees={handleUpdateEventInvitees}
              onEditPoll={(evt) => {
                setSelectedEventId(null);
                setEventToEdit(evt);
                setIsCreatePollModalOpen(true);
              }}
              onDeletePoll={handleDeletePoll}
              onEventUpdated={(updatedEvt) => {
                setEvents((prev) =>
                  prev.map((e) => (e.id === updatedEvt.id ? { ...e, ...updatedEvt } : e))
                );
              }}
            />
          )}

          {/* Modale Dettaglio Pagina Evento Associativo Ufficiale */}
          {selectedEvent && selectedEvent.eventType === 'official' && (
            <OfficialEventDetailModal
              event={selectedEvent}
              currentUser={currentUser}
              allUsers={users}
              onClose={() => setSelectedEventId(null)}
              onParticipate={(evt) => handleParticipateOfficialEvent(evt.id)}
              onDecline={(evt) => handleDeclineOfficialEvent(evt.id)}
              onEditEvent={(evt) => {
                setEvents((prev) =>
                  prev.map((e) => (e.id === evt.id ? { ...e, ...evt } : e))
                );
              }}
              onEventUpdated={(updatedEvt) => {
                setEvents((prev) =>
                  prev.map((e) => (e.id === updatedEvt.id ? { ...e, ...updatedEvt } : e))
                );
              }}
              onDeleteEvent={handleDeletePoll}
            />
          )}

        </div>
      </div>
      )}
    </>
  );
}
