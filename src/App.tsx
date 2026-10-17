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
} from './types';
import { INITIAL_USERS, INITIAL_EVENTS, INITIAL_RESPONSES } from './data/mockData';
import { isEventPassed } from './utils/dateUtils';
import { AuthScreen } from './components/AuthScreen';
import { TopHeader } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { EventsFeedView } from './components/EventsFeedView';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { CreateEventModal, PreFillClientData } from './components/CreateEventModal';
import { CreateOfficialEventModal } from './components/CreateOfficialEventModal';
import { CreateActionChoiceModal } from './components/CreateActionChoiceModal';
import { EventDetailModal } from './components/EventDetailModal';
import { OfficialEventDetailModal } from './components/OfficialEventDetailModal';
import { PublicBookingForm } from './components/PublicBookingForm';
import { ClientRequestsDashboard } from './components/ClientRequestsDashboard';
import { SplashScreen } from './components/SplashScreen';
import { autoSyncMeetingEventToCalendar } from './utils/googleWorkspaceAuth';

// Chiavi LocalStorage versione pulita V3
const STORAGE_USERS_KEY = 'jesic_meet_v3_users';
const STORAGE_CURRENT_USER_KEY = 'jesic_meet_v3_current_user';
const STORAGE_EVENTS_KEY = 'jesic_meet_v3_events';
const STORAGE_RESPONSES_KEY = 'jesic_meet_v3_responses';
const STORAGE_CLIENT_REQUESTS_KEY = 'jesic_meet_v3_client_requests';

// Richieste iniziali demo per testare subito il flusso B2B
const getTomorrowDateStr = (daysAhead: number = 1) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
};

const INITIAL_CLIENT_REQUESTS: ClientRequest[] = [
  {
    id: 'req-sample-01',
    companyName: 'MedTech Solutions Sicilia',
    contactEmail: 'direzione@medtech-sicilia.it',
    description:
      'Vorremmo organizzare una videocall conoscitiva per valutare una collaborazione per lo sviluppo di una piattaforma software e piano di marketing.',
    preferredSlots: [
      {
        date: getTomorrowDateStr(1),
        startTime: '11:00',
        endTime: '12:00',
        slotKey: `${getTomorrowDateStr(1)}T11:00`,
      },
      {
        date: getTomorrowDateStr(2),
        startTime: '14:30',
        endTime: '15:30',
        slotKey: `${getTomorrowDateStr(2)}T14:30`,
      },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function App() {
  // Riconoscimento rotta /prenota-call
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/prenota-call' || window.location.hash === '#/prenota-call') {
        return '/prenota-call';
      }
    }
    return '/';
  });

  // Ascolto popstate per tasto indietro/avanti browser
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/prenota-call' || window.location.hash === '#/prenota-call') {
        setCurrentRoute('/prenota-call');
      } else {
        setCurrentRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Lista utenti registrati
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_USERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_USERS;
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

  // Eventi creati
  const [events, setEvents] = useState<MeetingEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EVENTS;
  });

  // Risposte alle disponibilità (When2meet)
  const [responses, setResponses] = useState<EventResponse[]>(() => {
    const saved = localStorage.getItem(STORAGE_RESPONSES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_RESPONSES;
  });

  // Richieste Clienti B2B (Mongoose ClientRequest replica su frontend)
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_CLIENT_REQUESTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CLIENT_REQUESTS;
  });

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

  // Stato Splash Screen iniziale a tendina
  const [splashFinished, setSplashFinished] = useState(false);

  // Stato UI Navigazione
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

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

  // Gestione Tema Scuro / Chiaro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('jesic_meet_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jesic_meet_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jesic_meet_dark_mode', 'false');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Permessi Ruolo
  const isClientAdmin = currentUser?.systemRole === 'client_admin';
  const isAdmin = currentUser?.systemRole === 'admin' || isClientAdmin;

  // Navigazione alla pagina pubblica /prenota-call
  const navigateToPublicBooking = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/prenota-call');
    }
    setCurrentRoute('/prenota-call');
  };

  // Ritorno dalla pagina pubblica /prenota-call all'app interna
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

    // Chiamata backend proxy se attiva
    try {
      fetch('/api/client-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      }).catch((e) => console.log('[Client Request API local sync]', e));
    } catch (e) {
      // Ignora errori di rete locali
    }

    return true;
  };

  // Handler: Conversione Richiesta Cliente in Sondaggio Team (PRE-COMPILAZIONE AUTOMATICA)
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

  // Handler: Chiusura Flusso B2B - Conferma Evento Finale, Generazione Meet & Invio Email
  const handleConfirmFinalClientEvent = async (
    request: ClientRequest,
    finalSlot: { date: string; startTime: string; endTime: string },
    eventId?: string
  ) => {
    const generatedMeet = `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-meet`;

    // 1. Aggiorna stato ClientRequest a 'confirmed'
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

    // 2. Se c'è un evento sondaggio collegato, confermalo
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
    }

    // Sincronizzazione automatica Google Calendar per la call cliente confermata
    if (eventId) {
      const targetEvt = events.find((e) => e.id === eventId);
      if (targetEvt) {
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

    // 3. Chiamata API backend per invio email Nodemailer + Google Calendar
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
    } catch (e) {
      console.warn('Avviso backend confirmation sync:', e);
    }
  };

  // GESTIONE REGISTRAZIONE / LOGIN (Attiva l'animazione d'accesso con la mascotte)
  const handleRegisterUser = (newUserData: Omit<User, 'id'>) => {
    const newId = `user-${Date.now()}`;
    const systemRole: UserSystemRole = 'client_admin';
    const newUser: User = {
      ...newUserData,
      id: newId,
      systemRole,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setSplashFinished(false);
  };

  const handleLoginUser = (user: User) => {
    const withRole = { ...user, systemRole: user.systemRole || 'client_admin' };
    setCurrentUser(withRole);
    setSplashFinished(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Aggiornamento Ruolo Sistema (client_admin vs admin vs associate)
  const handleUpdateUserRole = (newSystemRole: UserSystemRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, systemRole: newSystemRole };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // Aggiornamento Profilo Utente (foto avatar, dati personali)
  const handleUpdateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // 1. LOGICA DEL BOTTONE "+" (Controllo Ruolo Admin / Admin Clienti)
  const handlePlusButtonClick = () => {
    if (!currentUser) return;
    if (isAdmin) {
      setIsChoiceModalOpen(true);
    } else {
      setPollPrefillData(undefined);
      setIsCreatePollModalOpen(true);
    }
  };

  // SE SIAMO SULLA ROTTA PUBBLICA /prenota-call: RENDERIZZA FORM PUBBLICO DIRETTO SENZA LOGIN!
  if (currentRoute === '/prenota-call') {
    return (
      <>
        {!splashFinished && <SplashScreen onFinish={() => setSplashFinished(true)} />}
        <PublicBookingForm
          onSubmitRequest={handleClientRequestSubmit}
          onBackToApp={navigateBackToApp}
        />
      </>
    );
  }

  // Se nessun utente è autenticato, mostriamo la pagina di registrazione o accesso con link B2B
  if (!currentUser) {
    return (
      <>
        {!splashFinished && <SplashScreen onFinish={() => setSplashFinished(true)} />}
        <AuthScreen
          registeredUsers={users}
          onLogin={handleLoginUser}
          onRegister={handleRegisterUser}
        />
      </>
    );
  }

  // Conteggio sondaggi pendenti per badge Dashboard
  const pendingInvitesCount = events.filter((e) => {
    if (e.eventType === 'official') return false;
    if (isEventPassed(e)) return false;
    if (e.creatorId === currentUser.id || e.status === 'confirmed') return false;
    const isInvited = e.invitees.some((i) => i.userId === currentUser.id);
    if (!isInvited) return false;
    const resp = responses.find((r) => r.eventId === e.id && r.userId === currentUser.id);
    return !resp || resp.status === 'pending';
  }).length;

  // Conteggio eventi associativi ufficiali pendenti per badge Eventi
  const pendingOfficialEventsCount = events.filter((e) => {
    if (e.eventType !== 'official') return false;
    if (isEventPassed(e)) return false;
    const isInvited = e.invitees.some((i) => i.userId === currentUser.id);
    if (!isInvited) return false;
    const participant = e.participants?.find((p) => p.userId === currentUser.id);
    return !participant || participant.status === 'pending';
  }).length;

  // Conteggio richieste clienti in attesa per badge Tab "Richieste"
  const pendingClientRequestsCount = clientRequests.filter((r) => r.status === 'pending').length;

  // AZIONE "PARTECIPA" a Evento Associativo (Bacheca Inviti)
  const handleParticipateOfficialEvent = async (event: MeetingEvent) => {
    const updatedParticipants = [...(event.participants || [])];
    const existingIndex = updatedParticipants.findIndex((p) => p.userId === currentUser.id);

    const newParticipantRecord = {
      userId: currentUser.id,
      status: 'accepted' as const,
      respondedAt: new Date().toISOString(),
      googleCalendarSynced: true,
    };

    if (existingIndex >= 0) {
      updatedParticipants[existingIndex] = newParticipantRecord;
    } else {
      updatedParticipants.push(newParticipantRecord);
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, participants: updatedParticipants } : e))
    );
  };

  // AZIONE "NON PARTECIPO"
  const handleDeclineOfficialEvent = (event: MeetingEvent) => {
    const updatedParticipants = [...(event.participants || [])];
    const existingIndex = updatedParticipants.findIndex((p) => p.userId === currentUser.id);

    const newParticipantRecord = {
      userId: currentUser.id,
      status: 'declined' as const,
      respondedAt: new Date().toISOString(),
      googleCalendarSynced: false,
    };

    if (existingIndex >= 0) {
      updatedParticipants[existingIndex] = newParticipantRecord;
    } else {
      updatedParticipants.push(newParticipantRecord);
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, participants: updatedParticipants } : e))
    );
  };

  // Handler: Salvataggio disponibilità When2meet
  const handleSaveAvailability = (eventId: string, slots: string[]) => {
    setResponses((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.eventId === eventId && r.userId === currentUser.id
      );
      const isMandatory =
        events
          .find((e) => e.id === eventId)
          ?.invitees.find((i) => i.userId === currentUser.id)?.isMandatory ?? false;

      const newResponse: EventResponse = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `resp-${Date.now()}`,
        eventId,
        userId: currentUser.id,
        isMandatory,
        availability: slots,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      } else {
        return [...prev, newResponse];
      }
    });

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId || evt.status === 'confirmed') return evt;
        const mandatoryInvitees = evt.invitees.filter((i) => i.isMandatory);
        const mandatoryIds = new Set(mandatoryInvitees.map((i) => i.userId));

        const allEventResponses = responses.filter((r) => r.eventId === eventId);
        const submittedMandatoryCount = mandatoryInvitees.filter((i) => {
          if (i.userId === currentUser.id) return true;
          const r = allEventResponses.find((res) => res.userId === i.userId);
          return r && r.status === 'submitted';
        }).length;

        if (submittedMandatoryCount >= mandatoryIds.size) {
          return { ...evt, status: 'ready' };
        }
        return evt;
      })
    );
  };

  // Handler: Conferma orario finale sondaggio When2meet
  const handleConfirmMeetingSlot = (
    eventId: string,
    slot: { date: string; startTime: string; endTime: string }
  ) => {
    const meetLink = `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-meet`;

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          status: 'confirmed',
          finalizedSlot: slot,
          meetLink: evt.type === 'online' ? evt.meetLink || meetLink : undefined,
        };
      })
    );

    // Sincronizzazione automatica con Google Calendar
    const targetEvt = events.find((e) => e.id === eventId);
    if (targetEvt) {
      const updatedEvt: MeetingEvent = {
        ...targetEvt,
        status: 'confirmed',
        finalizedSlot: slot,
        meetLink: targetEvt.type === 'online' ? targetEvt.meetLink || meetLink : undefined,
      };
      const attendeeUsers = users.filter((u) => targetEvt.invitees.some((inv) => inv.userId === u.id));
      autoSyncMeetingEventToCalendar(updatedEvt, slot, currentUser, attendeeUsers).catch((err) =>
        console.log('[Auto Google Calendar Sync error]', err)
      );

      // Se l'evento era collegato a una richiesta cliente, chiudi anche la richiesta
      if (targetEvt.clientRequestId) {
        setClientRequests((prev) =>
          prev.map((r) =>
            r.id === targetEvt.clientRequestId
              ? {
                  ...r,
                  status: 'confirmed',
                  finalizedSlot: slot,
                  meetLink: targetEvt.meetLink || meetLink,
                  updatedAt: new Date().toISOString(),
                }
              : r
          )
        );
      }
    }
  };

  // Handler: Invia solleciti
  const handleTriggerReminders = (eventId: string) => {
    setResponses((prev) =>
      prev.map((r) =>
        r.eventId === eventId && r.status === 'pending' ? { ...r, reminderSent: true } : r
      )
    );
  };

  // Handler: Modifica lista invitati
  const handleUpdateEventInvitees = (
    eventId: string,
    updatedInvitees: InviteeConfig[],
    newUsersToRegister: User[] = []
  ) => {
    if (newUsersToRegister.length > 0) {
      setUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const filteredNew = newUsersToRegister.filter((nu) => !existingIds.has(nu.id));
        return [...prev, ...filteredNew];
      });
    }

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          invitees: updatedInvitees,
        };
      })
    );
  };

  // Handler: Creazione Sondaggio Disponibilità (When2meet)
  const handleCreatePollEvent = (
    newEventData: Omit<MeetingEvent, 'id' | 'createdAt'>,
    creatorAvailability: string[],
    newUsersToRegister: User[] = []
  ) => {
    const newId = `poll-${Date.now()}`;
    const newEvent: MeetingEvent = {
      ...newEventData,
      id: newId,
      eventType: 'poll',
      createdAt: new Date().toISOString(),
    };

    if (newUsersToRegister.length > 0) {
      setUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const filteredNew = newUsersToRegister.filter((nu) => !existingIds.has(nu.id));
        return [...prev, ...filteredNew];
      });
    }

    const creatorResponse: EventResponse = {
      id: `resp-${newId}-${currentUser.id}`,
      eventId: newId,
      userId: currentUser.id,
      isMandatory: true,
      availability: [],
      status: 'pending',
    };

    const otherResponses: EventResponse[] = newEvent.invitees
      .filter((inv) => inv.userId !== currentUser.id)
      .map((inv) => ({
        id: `resp-${newId}-${inv.userId}`,
        eventId: newId,
        userId: inv.userId,
        isMandatory: inv.isMandatory,
        availability: [],
        status: 'pending',
      }));

    setEvents((prev) => [newEvent, ...prev]);
    setResponses((prev) => [...prev, creatorResponse, ...otherResponses]);

    // Se originato da richiesta cliente, aggiorna lo status della richiesta a 'converted_to_poll'
    if (newEventData.clientRequestId) {
      setClientRequests((prev) =>
        prev.map((r) =>
          r.id === newEventData.clientRequestId
            ? { ...r, status: 'converted_to_poll', pollEventId: newId, updatedAt: new Date().toISOString() }
            : r
        )
      );
    }

    setPollPrefillData(undefined);
    setIsCreatePollModalOpen(false);
    setSelectedEventId(newId);
  };

  // Handler: Creazione Evento Associativo Ufficiale (Admin)
  const handleCreateOfficialEvent = (
    newEventData: Omit<MeetingEvent, 'id' | 'createdAt'>
  ) => {
    const newId = `official-${Date.now()}`;
    const newEvent: MeetingEvent = {
      ...newEventData,
      id: newId,
      eventType: 'official',
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);

    // Sincronizzazione automatica Google Calendar per evento ufficiale inserito nel calendario
    if (newEvent.finalizedSlot) {
      const attendeeUsers = users.filter((u) => newEvent.invitees.some((inv) => inv.userId === u.id));
      autoSyncMeetingEventToCalendar(
        newEvent,
        newEvent.finalizedSlot,
        currentUser,
        attendeeUsers
      ).catch((err) => console.log('[Auto Google Calendar Sync official event]', err));
    }

    setIsCreateOfficialModalOpen(false);
    setCurrentTab('events');
  };

  // Handler: Modifica Sondaggio di Disponibilità esistente (organizzatore)
  const handleUpdatePollEvent = (updatedEvent: MeetingEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));

    // Assicura che ogni invitato abbia un record di risposta
    setResponses((prev) => {
      const existingUserIds = new Set(
        prev.filter((r) => r.eventId === updatedEvent.id).map((r) => r.userId)
      );
      const newResponses: EventResponse[] = updatedEvent.invitees
        .filter((inv) => !existingUserIds.has(inv.userId))
        .map((inv) => ({
          id: `resp-${updatedEvent.id}-${inv.userId}`,
          eventId: updatedEvent.id,
          userId: inv.userId,
          isMandatory: inv.isMandatory,
          availability: [],
          status: 'pending',
        }));
      return [...prev, ...newResponses];
    });

    setEventToEdit(undefined);
    setIsCreatePollModalOpen(false);
    setSelectedEventId(updatedEvent.id);
  };

  // Handler: Modifica Evento Associativo Ufficiale esistente (organizzatore)
  const handleUpdateOfficialEvent = (updatedEvent: MeetingEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    setEventToEdit(undefined);
    setIsCreateOfficialModalOpen(false);
    setSelectedEventId(updatedEvent.id);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <>
      {!splashFinished && <SplashScreen onFinish={() => setSplashFinished(true)} />}
      <div className="min-h-screen bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 flex justify-center selection:bg-[#f23e2e] selection:text-white transition-colors">
      {/* Mobile & PC responsive centered app shell container */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-white dark:bg-[#1e1e1e] min-h-screen flex flex-col shadow-2xl relative transition-colors">
        
        {/* Header Superiore (Con navigazione PC integrata e menu responsive) */}
        <TopHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateToProfile={() => setCurrentTab('profile')}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCreateMenu={handlePlusButtonClick}
          pendingInvitesCount={pendingInvitesCount}
          pendingOfficialEventsCount={pendingOfficialEventsCount}
          isClientAdmin={isClientAdmin}
          pendingClientRequestsCount={pendingClientRequestsCount}
        />

        {/* Banner scorrevole rapido per aprire o testare la rotta esterna /prenota-call - ESCLUSIVO PER ADMIN CLIENTI */}
        {isClientAdmin && (
          <div className="bg-neutral-900 text-neutral-300 px-4 sm:px-6 py-2 text-[11px] border-b border-neutral-800 flex items-center justify-between">
            <span className="truncate">
              🔗 Link pubblico clienti: <code className="text-[#f23e2e] font-mono font-bold">/prenota-call</code>
            </span>
            <button
              type="button"
              onClick={navigateToPublicBooking}
              className="text-[#f23e2e] hover:underline font-black shrink-0 ml-2 cursor-pointer"
            >
              Apri Form Esterno &rarr;
            </button>
          </div>
        )}

        {/* Contenuto Principale Switch tra le sezioni */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {currentTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              allEvents={events}
              allResponses={responses}
              allUsers={users}
              onOpenEvent={(evt) => setSelectedEventId(evt.id)}
              onOpenCreateModal={handlePlusButtonClick}
              onNavigateToRequests={() => setCurrentTab('requests')}
              pendingClientRequestsCount={clientRequests.filter((r) => r.status === 'pending').length}
            />
          )}

          {currentTab === 'events' && (
            <EventsFeedView
              currentUser={currentUser}
              allEvents={events}
              allUsers={users}
              onParticipate={handleParticipateOfficialEvent}
              onDecline={handleDeclineOfficialEvent}
              onOpenCalendarTab={() => setCurrentTab('calendar')}
              onOpenOfficialEventDetail={(evt) => setSelectedEventId(evt.id)}
              onEditOfficialEvent={(evt) => {
                setEventToEdit(evt);
                setIsCreateOfficialModalOpen(true);
              }}
            />
          )}

          {/* TAB ESCLUSIVA RUOLO "ADMIN CLIENTI": RICHIESTE CLIENTI B2B */}
          {currentTab === 'requests' && isClientAdmin && (
            <ClientRequestsDashboard
              currentUser={currentUser}
              requests={clientRequests}
              allEvents={events}
              allUsers={users}
              onConvertToPoll={handleConvertToPoll}
              onConfirmFinalEvent={handleConfirmFinalClientEvent}
              onOpenPublicBooking={navigateToPublicBooking}
              onOpenEventDetail={(evtId) => setSelectedEventId(evtId)}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              currentUser={currentUser}
              allEvents={events}
              allUsers={users}
              onOpenEventDetail={(evt) => setSelectedEventId(evt.id)}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onLogout={handleLogout}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          )}
        </main>

        {/* Bottom Navigation Bar con supporto Tab esclusiva Richieste Clienti */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCreateMenu={handlePlusButtonClick}
          pendingInvitesCount={pendingInvitesCount}
          pendingOfficialEventsCount={pendingOfficialEventsCount}
          isClientAdmin={isClientAdmin}
          pendingClientRequestsCount={pendingClientRequestsCount}
        />

        {/* Menu Scelta Azione "+" per Admin / Admin Clienti */}
        {isChoiceModalOpen && (
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

        {/* Form Creazione/Modifica Sondaggio di Disponibilità (When2meet style + Pre-compilazione da Richiesta Cliente) */}
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
          />
        )}

        {/* Form Creazione/Modifica Evento Associativo Ufficiale (Admin) */}
        {isCreateOfficialModalOpen && (
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
          />
        )}

        {/* Modale Dettaglio Sondaggio Disponibilità When2meet */}
        {selectedEvent && selectedEvent.eventType === 'poll' && (
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
          />
        )}

        {/* Modale Dettaglio Pagina Evento Associativo Ufficiale */}
        {selectedEvent && selectedEvent.eventType === 'official' && (
          <OfficialEventDetailModal
            event={selectedEvent}
            currentUser={currentUser}
            allUsers={users}
            onClose={() => setSelectedEventId(null)}
            onParticipate={handleParticipateOfficialEvent}
            onDecline={handleDeclineOfficialEvent}
            onEditEvent={(evt) => {
              setSelectedEventId(null);
              setEventToEdit(evt);
              setIsCreateOfficialModalOpen(true);
            }}
          />
        )}

      </div>
    </div>
    </>
  );
}
