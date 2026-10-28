/**
 * JESic Meet - Type Definitions
 * Junior Enterprise Sicilia - Intelligent Meeting Scheduler
 */

export type UserRole = 'user' | 'admin_clienti' | 'admin';
export type AppRole = UserRole;
export type UserSystemRole = UserRole;

export interface UserGroupMembership {
  groupId: string;
  role: GroupMemberRole;
}

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  password?: string;
  groupMemberships?: UserGroupMembership[];
  role?: UserRole; // compatibilità opzionale
  systemRole?: UserRole;
  jesicRole?: string;
  avatarUrl?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleCalendarConnected?: boolean;
}

export type GroupMemberRole = 'member' | 'admin' | 'admin_clienti' | 'responsabile';

export interface GroupMember {
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
}

export interface Subgroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string; // Emoji o icona personalizzata (es. '📁', '🚀')
  isPublic?: boolean; // Se true, accessibile a tutti i membri del gruppo; se false, richiede codice univoco
  code?: string; // Codice univoco per accedere al sottogruppo
  members?: string[]; // IDs degli utenti che hanno inserito il codice e possono accedere
  createdBy: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string; // Codice univoco per entrare (es. "JES-7A9B")
  inviteLink?: string;
  creatorId: string;
  members: GroupMember[];
  subgroups?: Subgroup[];
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
  groupId?: string | null;
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
  subgroupId?: string | null; // Se legato a un sottogruppo specifico (null se gruppo generale)
  externalInviteEmails?: string[]; // Destinatari invitati via email fuori da qualsiasi gruppo
}

export interface ChatAttachment {
  type: 'image' | 'audio' | 'file';
  url: string; // Data URL Base64 o URL file
  name?: string;
  size?: number; // Dimensione in byte
  duration?: number; // Durata audio in secondi
}

export interface ChatReplyTo {
  messageId: string;
  authorName: string;
  content: string;
  attachmentType?: 'image' | 'audio' | 'file';
}

export interface ChatMessage {
  id: string;
  groupId: string;
  subgroupId?: string | null; // null se è la chat generale del gruppo
  authorId: string;
  authorName: string;
  authorSurname: string;
  authorAvatar?: string | null;
  content: string;
  attachment?: ChatAttachment;
  replyTo?: ChatReplyTo;
  createdAt: string;
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
