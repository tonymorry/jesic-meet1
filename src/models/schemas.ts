/**
 * JESic Meet - Modelli Database Mongoose (MongoDB)
 * Junior Enterprise Sicilia
 * 
 * 3 Ruoli Reali di Sistema:
 * - 'user' (Utente Normale)
 * - 'admin_clienti' (Admin Clienti B2B)
 * - 'admin' (Super Admin)
 */

import mongoose, { Schema, Model } from 'mongoose';

/* ==========================================================================
   1. RUOLI & TIPI BASE
   ========================================================================== */
export type UserRole = 'user' | 'admin_clienti' | 'admin';
export type AppRole = UserRole;
export type UserSystemRole = UserRole;

/* ==========================================================================
   2. USER SCHEMA & MODEL
   ========================================================================== */
export interface IUserGroupMembership {
  groupId: string;
  role: 'member' | 'admin' | 'admin_clienti' | 'responsabile';
}

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  surname: string;
  nome?: string;
  cognome?: string;
  email: string;
  password?: string;
  groupMemberships: IUserGroupMembership[];
  avatarUrl?: string | null;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  googleCalendarConnected?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserGroupMembershipSchema = new Schema<IUserGroupMembership>(
  {
    groupId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'admin_clienti', 'responsabile'],
      default: 'member',
    },
  },
  { _id: false }
);

const UserSchema: Schema<IUser> = new Schema(
  {
    _id: {
      type: String,
      default: () => `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    name: {
      type: String,
      required: [true, 'Il nome è obbligatorio'],
      trim: true,
      maxlength: [60, 'Nome troppo lungo'],
    },
    surname: {
      type: String,
      required: [true, 'Il cognome è obbligatorio'],
      trim: true,
      maxlength: [60, 'Cognome troppo lungo'],
    },
    nome: { type: String, trim: true },
    cognome: { type: String, trim: true },
    email: {
      type: String,
      required: [true, 'Email obbligatoria'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      default: '',
    },
    groupMemberships: {
      type: [UserGroupMembershipSchema],
      default: [],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    googleAccessToken: {
      type: String,
      default: '',
    },
    googleRefreshToken: {
      type: String,
      default: null,
    },
    googleTokenExpiry: {
      type: Date,
    },
    googleCalendarConnected: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

UserSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

UserSchema.virtual('nomeCompleto').get(function (this: any) {
  return `${this.name || this.nome || ''} ${this.surname || this.cognome || ''}`.trim();
});

UserSchema.pre('save', function (this: any) {
  if (this.name && !this.nome) this.nome = this.name;
  if (this.surname && !this.cognome) this.cognome = this.surname;
  if (this.nome && !this.name) this.name = this.nome;
  if (this.cognome && !this.surname) this.surname = this.cognome;
  if (!this.groupMemberships) this.groupMemberships = [];
});

export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const User: Model<IUser> = UserModel;

/* ==========================================================================
   3. GROUP SCHEMA & MODEL (Gruppi di lavoro)
   ========================================================================== */
export interface IGroupMember {
  userId: string;
  role: 'member' | 'admin' | 'admin_clienti' | 'responsabile';
  joinedAt: string;
}

export interface ISubgroup {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  code?: string;
  members?: string[];
  createdBy: string;
  createdAt?: string;
}

export interface IGroup {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  code: string;
  inviteLink?: string;
  creatorId: string;
  members: IGroupMember[];
  subgroups?: ISubgroup[];
  avatar?: string;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const GroupMemberSubSchema = new Schema<IGroupMember>(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ['member', 'admin', 'admin_clienti', 'responsabile'], default: 'member' },
    joinedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const SubgroupSubSchema = new Schema<ISubgroup>(
  {
    _id: {
      type: String,
      default: () => `subgrp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    },
    name: {
      type: String,
      required: [true, 'Nome sottogruppo obbligatorio'],
      trim: true,
      maxlength: [100, 'Nome sottogruppo troppo lungo'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    code: {
      type: String,
      default: () => 'SUB-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    },
    members: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

SubgroupSubSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

const GroupSchema: Schema<IGroup> = new Schema(
  {
    _id: {
      type: String,
      default: () => `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    },
    name: {
      type: String,
      required: [true, 'Nome gruppo obbligatorio'],
      trim: true,
      maxlength: [100, 'Nome gruppo troppo lungo'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    inviteLink: {
      type: String,
      default: '',
    },
    creatorId: {
      type: String,
      required: true,
      index: true,
    },
    members: {
      type: [GroupMemberSubSchema],
      default: [],
    },
    subgroups: {
      type: [SubgroupSubSchema],
      default: [],
    },
    avatar: {
      type: String,
      default: '👥',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

GroupSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

export const GroupModel: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
export const Group: Model<IGroup> = GroupModel;

/* ==========================================================================
   4. CLIENT REQUEST SCHEMA & MODEL (Richieste Clienti B2B)
   ========================================================================== */
export type ClientRequestStatus = 'pending' | 'converted_to_poll' | 'confirmed' | 'archived';

export interface IClientSlotPreference {
  date: string;
  startTime: string;
  endTime: string;
  slotKey: string;
}

export interface IClientRequest {
  _id?: string;
  id?: string;
  groupId?: string | null;
  companyName: string;
  contactEmail: string;
  description: string;
  preferredSlots: IClientSlotPreference[];
  status: ClientRequestStatus;
  pollEventId?: string | null;
  finalizedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  meetLink?: string | null;
  emailConfirmationSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientSlotPreferenceSchema = new Schema<IClientSlotPreference>(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotKey: { type: String, required: true },
  },
  { _id: false }
);

const ClientRequestSchema: Schema<IClientRequest> = new Schema(
  {
    _id: {
      type: String,
      default: () => `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    },
    groupId: {
      type: String,
      default: null,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Nome azienda obbligatorio'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Email contatto obbligatoria'],
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Descrizione obbligatoria'],
      trim: true,
    },
    preferredSlots: {
      type: [ClientSlotPreferenceSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'converted_to_poll', 'confirmed', 'archived'],
      default: 'pending',
      index: true,
    },
    pollEventId: {
      type: String,
      default: null,
    },
    finalizedSlot: {
      date: { type: String },
      startTime: { type: String },
      endTime: { type: String },
    },
    meetLink: {
      type: String,
      default: null,
    },
    emailConfirmationSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

ClientRequestSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

export const ClientRequestModel: Model<IClientRequest> =
  mongoose.models.ClientRequest || mongoose.model<IClientRequest>('ClientRequest', ClientRequestSchema);
export const ClientRequest: Model<IClientRequest> = ClientRequestModel;

/* ==========================================================================
   5. EVENT SCHEMA & MODEL (Sondaggi When2meet & Eventi Ufficiali)
   ========================================================================== */
export type EventType = 'poll' | 'official';
export type ParticipantStatus = 'pending' | 'accepted' | 'declined';

export interface IParticipant {
  userId: string;
  status: ParticipantStatus;
  respondedAt?: string;
  googleCalendarSynced: boolean;
}

export interface IInvitee {
  userId: string;
  isMandatory: boolean;
}

export interface IFinalizedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface IEvent {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  creatorId: string;
  eventType: EventType;
  dates: string[];
  startHour: number;
  endHour: number;
  timeSlotBand?: 'morning' | 'afternoon' | 'morning_afternoon';
  slotIntervalMinutes: number;
  type: 'online' | 'in_person';
  location?: string;
  meetLink?: string;
  googleCalendarEventId?: string;
  googleEventId?: string;
  pollDeadline?: string;
  status: 'voting' | 'ready' | 'confirmed';
  invitees: IInvitee[];
  participants: IParticipant[];
  finalizedSlot?: IFinalizedSlot;
  finalDate?: string;
  groupId?: string | null;
  subgroupId?: string | null;
  externalInviteEmails?: string[];
  clientRequestId?: string | null;
  clientInfo?: {
    companyName: string;
    contactEmail: string;
  };
  allowedSlots?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ParticipantSubSchema = new Schema<IParticipant>(
  {
    userId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    respondedAt: { type: String },
    googleCalendarSynced: { type: Boolean, default: false },
  },
  { _id: false }
);

const InviteeSubSchema = new Schema<IInvitee>(
  {
    userId: { type: String, required: true },
    isMandatory: { type: Boolean, default: false },
  },
  { _id: false }
);

const EventSchema: Schema<IEvent> = new Schema(
  {
    _id: {
      type: String,
      default: () => `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    },
    title: {
      type: String,
      required: [true, 'Titolo obbligatorio'],
      trim: true,
      maxlength: [150, 'Titolo troppo lungo'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    creatorId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['poll', 'official'],
      required: true,
      default: 'poll',
      index: true,
    },
    dates: {
      type: [String],
      default: [],
    },
    startHour: {
      type: Number,
      default: 9,
    },
    endHour: {
      type: Number,
      default: 19,
    },
    timeSlotBand: {
      type: String,
    },
    slotIntervalMinutes: {
      type: Number,
      enum: [30, 60],
      default: 60,
    },
    type: {
      type: String,
      enum: ['online', 'in_person'],
      default: 'online',
    },
    location: {
      type: String,
      default: '',
    },
    meetLink: {
      type: String,
      default: '',
    },
    googleCalendarEventId: {
      type: String,
      default: null,
    },
    googleEventId: {
      type: String,
      default: null,
    },
    pollDeadline: {
      type: String,
    },
    status: {
      type: String,
      enum: ['voting', 'ready', 'confirmed'],
      default: 'voting',
      index: true,
    },
    invitees: {
      type: [InviteeSubSchema],
      default: [],
    },
    participants: {
      type: [ParticipantSubSchema],
      default: [],
    },
    finalizedSlot: {
      date: { type: String },
      startTime: { type: String },
      endTime: { type: String },
    },
    finalDate: {
      type: Schema.Types.Mixed,
      default: null,
    },
    groupId: {
      type: String,
      default: null,
      index: true,
    },
    subgroupId: {
      type: String,
      default: null,
      index: true,
    },
    externalInviteEmails: {
      type: [String],
      default: [],
    },
    clientRequestId: {
      type: String,
      default: null,
    },
    clientInfo: {
      companyName: { type: String },
      contactEmail: { type: String },
    },
    allowedSlots: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

EventSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

export const EventModel: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
export const Event: Model<IEvent> = EventModel;
export const PollModel: Model<IEvent> = EventModel;
export const OfficialEventModel: Model<IEvent> = EventModel;

/* ==========================================================================
   6. RESPONSE SCHEMA & MODEL (Disponibilità When2meet)
   ========================================================================== */
export interface IResponse {
  _id?: string;
  id?: string;
  eventId: string;
  userId: string;
  isMandatory?: boolean;
  availability: string[];
  status: 'pending' | 'submitted';
  submittedAt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ResponseSchema: Schema<IResponse> = new Schema(
  {
    _id: {
      type: String,
      default: () => `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
    availability: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'submitted'],
      default: 'pending',
    },
    submittedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

ResponseSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

export const EventResponseModel: Model<IResponse> =
  mongoose.models.Response || mongoose.model<IResponse>('Response', ResponseSchema);
export const Response: Model<IResponse> = EventResponseModel;

/* ==========================================================================
   7. CHAT MESSAGE SCHEMA & MODEL (Chat per Gruppo Generale & Sottogruppi)
   ========================================================================== */
export interface IChatAttachment {
  type: 'image' | 'audio' | 'file';
  url: string;
  name?: string;
  size?: number;
  duration?: number;
}

export interface IChatReplyTo {
  messageId: string;
  authorName: string;
  content: string;
  attachmentType?: 'image' | 'audio' | 'file';
}

export interface IChatMessage {
  _id?: string;
  id?: string;
  groupId: string;
  subgroupId?: string | null;
  authorId: string;
  authorName: string;
  authorSurname: string;
  authorAvatar?: string | null;
  content: string;
  attachment?: IChatAttachment;
  replyTo?: IChatReplyTo;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatMessageSchema: Schema<IChatMessage> = new Schema(
  {
    _id: {
      type: String,
      default: () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    subgroupId: {
      type: String,
      default: null,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorSurname: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
    attachment: {
      type: {
        type: String,
        enum: ['image', 'audio', 'file'],
      },
      url: String,
      name: String,
      size: Number,
      duration: Number,
    },
    replyTo: {
      messageId: String,
      authorName: String,
      content: String,
      attachmentType: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

ChatMessageSchema.virtual('id').get(function (this: any) {
  return this._id ? this._id.toString() : undefined;
});

export const ChatMessageModel: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export const ChatMessage: Model<IChatMessage> = ChatMessageModel;

/* ==========================================================================
   7. DOCUMENTAZIONE PER CODE VIEW MODAL
   ========================================================================== */
export const MONGOOSE_SCHEMAS_CODE = `
import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. User Schema con i 3 ruoli reali ('user' | 'admin_clienti' | 'admin')
export type UserRole = 'user' | 'admin_clienti' | 'admin';

// 2. Modelli Mongoose:
export const UserModel = mongoose.model('User', UserSchema);
export const GroupModel = mongoose.model('Group', GroupSchema);
export const EventModel = mongoose.model('Event', EventSchema);
export const PollModel = EventModel;
export const OfficialEventModel = EventModel;
export const ClientRequestModel = mongoose.model('ClientRequest', ClientRequestSchema);
export const EventResponseModel = mongoose.model('Response', ResponseSchema);
`;
