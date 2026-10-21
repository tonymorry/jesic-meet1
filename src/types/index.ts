/**
 * JESic Meet - Type Definitions
 * Junior Enterprise Sicilia - Intelligent Meeting Scheduler
 */

export type UserRole = 'user' | 'admin_clienti' | 'admin';
export type AppRole = UserRole;
export type UserSystemRole = UserRole;

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  password?: string;
  role: UserRole; // 'user' (Utente Normale) | 'admin_clienti' (Admin Clienti) | 'admin' (Super Admin)
  systemRole?: UserRole; // compatibilità
  jesicRole?: string; // Ruolo descrittivo (es. 'Presidente', 'Consulente Junior')
  avatarUrl?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleCalendarConnected?: boolean;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string; // Codice univoco per entrare (es. "JES-7A9B")
  inviteLink?: string;
  creatorId: string;
  members: GroupMember[];
  avatar?: string;
  isPublic?: boolean; // Se true il gruppo è pubblico (chiunque conosca il nome può entrare)
  createdAt: string;
  updatedAt?: string;
}

export type EventKind = 'poll' | 'official';

export type EventMeetingType = 'online' | 'in_person';

export type EventStatus = 'voting' | 'ready' | 'confirmed';

export interface FinalizedSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface InviteeConfig {
  userId: string;
  isMandatory: boolean; // "Essenziale" (true) vs "Opzionale" (false)
}

export type ParticipantStatus = 'pending' | 'accepted' | 'declined';

export interface ParticipantResponse {
  userId: string;
  status: ParticipantStatus;
  respondedAt?: string;
  googleCalendarSynced?: boolean;
}

export interface ClientSlotPreference {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (es. '10:00')
  endTime: string; // HH:mm (es. '11:00')
  slotKey: string; // 'YYYY-MM-DDTHH:mm'
}

export type ClientRequestStatus = 'pending' | 'converted_to_poll' | 'confirmed' | 'archived';

export interface ClientRequest {
  id: string;
  companyName: string;
  contactEmail: string;
  description: string;
  preferredSlots: ClientSlotPreference[];
  status: ClientRequestStatus;
  pollEventId?: string;
  finalizedSlot?: FinalizedSlot;
  meetLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingEvent {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  eventType: EventKind; // 'poll' (sondaggio When2meet) | 'official' (evento associativo ufficiale)
  dates: string[]; // ISO Date strings 'YYYY-MM-DD'
  startHour: number; // e.g. 9
  endHour: number; // e.g. 19
  timeSlotBand?: 'morning' | 'afternoon' | 'morning_afternoon'; // Fascia oraria semplificata: Mattina (8-12), Pomeriggio (15-20), o entrambi
  slotIntervalMinutes: 30 | 60; // slot duration in minutes
  type: EventMeetingType;
  location?: string;
  meetLink?: string;
  googleEventId?: string;
  googleCalendarEventId?: string;
  pollDeadline?: string; // ISO datetime
  status: EventStatus;
  finalizedSlot?: FinalizedSlot;
  finalDate?: string | { date: string; startTime: string; endTime: string };
  invitees: InviteeConfig[];
  participants?: ParticipantResponse[]; // Risposte per eventi associativi ('accepted', 'declined', 'pending')
  createdAt: string;
  clientRequestId?: string; // ID della richiesta cliente se originato da conversione
  clientInfo?: {
    companyName: string;
    contactEmail: string;
  };
  allowedSlots?: string[]; // Se vincolato agli slot specificati dal cliente (es. 2 o 3 slot)
  groupId?: string; // Se legato a un gruppo specifico (null se creato a livello generale)
  externalInviteEmails?: string[]; // Destinatari invitati via email fuori da qualsiasi gruppo
}

export type ResponseStatus = 'pending' | 'submitted';

export interface EventResponse {
  id: string;
  eventId: string;
  userId: string;
  isMandatory: boolean;
  availability: string[]; // Array of slot keys: "YYYY-MM-DDTHH:mm"
  status: ResponseStatus;
  submittedAt?: string;
}

export interface SlotAnalysis {
  slotKey: string; // "YYYY-MM-DDTHH:mm"
  date: string;
  startTime: string;
  endTime: string;
  mandatoryPresent: number;
  mandatoryTotal: number;
  optionalPresent: number;
  optionalTotal: number;
  isAllMandatoryPresent: boolean;
  score: number;
  availableUsers: User[];
  missingMandatoryUsers: User[];
  missingOptionalUsers: User[];
}
