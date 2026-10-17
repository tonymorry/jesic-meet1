/**
 * JESic Meet - Modelli Database Mongoose (MongoDB)
 * Junior Enterprise Sicilia
 * 
 * Aggiornamento Flusso B2B & Client Admin:
 * - User con systemRole ('admin' | 'associate' | 'client_admin')
 * - Event con eventType ('poll' | 'official'), partecipanti ufficiali (status: pending/accepted/declined),
 *   date definitive e integrazione Google Calendar OAuth2
 * - ClientRequest con status ('pending' | 'converted_to_poll' | 'confirmed' | 'archived'),
 *   referente azienda, email, descrizione, e slot orari preferiti (min 2, max 3)
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/* ==========================================================================
   1. USER SCHEMA & MODEL
   ========================================================================== */
export type UserSystemRole = 'admin' | 'associate' | 'client_admin';

export interface IUser extends Document {
  nome: string;
  cognome: string;
  email: string;
  systemRole: UserSystemRole; // 'admin' | 'associate' | 'client_admin'
  ruolo?: string; // Es. Presidente, Vicepresidente, Project Manager, Consulente Junior
  avatarUrl?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  googleCalendarConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    nome: {
      type: String,
      required: [true, 'Il nome è obbligatorio'],
      trim: true,
      maxlength: [50, 'Nome troppo lungo'],
    },
    cognome: {
      type: String,
      required: [true, 'Il cognome è obbligatorio'],
      trim: true,
      maxlength: [50, 'Cognome troppo lungo'],
    },
    email: {
      type: String,
      required: [true, "L'email istituzionale JESic è obbligatoria"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Formato email non valido'],
      index: true,
    },
    systemRole: {
      type: String,
      enum: ['admin', 'associate', 'client_admin'],
      default: 'associate',
      index: true,
    },
    ruolo: {
      type: String,
      default: 'Consulente Junior',
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    googleAccessToken: {
      type: String,
      select: false,
    },
    googleRefreshToken: {
      type: String,
      select: false,
    },
    googleTokenExpiry: {
      type: Date,
    },
    googleCalendarConnected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual('nomeCompleto').get(function (this: IUser) {
  return `${this.nome} ${this.cognome}`;
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

/* ==========================================================================
   2. CLIENT REQUEST SCHEMA & MODEL (Flusso B2B Acquisizione & Richieste)
   ========================================================================== */
export type ClientRequestStatus = 'pending' | 'converted_to_poll' | 'confirmed' | 'archived';

export interface IClientSlotPreference {
  date: string;       // Formato 'YYYY-MM-DD'
  startTime: string;  // Formato 'HH:mm'
  endTime: string;    // Formato 'HH:mm'
  slotKey: string;    // 'YYYY-MM-DDTHH:mm'
}

export interface IClientRequest extends Document {
  companyName: string;
  contactEmail: string;
  description: string;
  preferredSlots: IClientSlotPreference[];
  status: ClientRequestStatus;
  pollEventId?: mongoose.Types.ObjectId;
  finalizedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  meetLink?: string;
  emailConfirmationSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
    companyName: {
      type: String,
      required: [true, "Il nome dell'azienda o del referente è obbligatorio"],
      trim: true,
      maxlength: [100, 'Nome azienda massimo 100 caratteri'],
    },
    contactEmail: {
      type: String,
      required: [true, "L'email del referente aziendale è obbligatoria"],
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Formato email non valido'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'La descrizione della richiesta è obbligatoria'],
      trim: true,
      maxlength: [1500, 'Descrizione massima 1500 caratteri'],
    },
    preferredSlots: {
      type: [ClientSlotPreferenceSchema],
      required: true,
      validate: {
        validator: (slots: IClientSlotPreference[]) => slots.length >= 2 && slots.length <= 3,
        message: 'Devi indicare obbligatoriamente tra i 2 e i 3 slot orari di preferenza',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'converted_to_poll', 'confirmed', 'archived'],
      default: 'pending',
      index: true,
    },
    pollEventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    finalizedSlot: {
      date: { type: String },
      startTime: { type: String },
      endTime: { type: String },
    },
    meetLink: {
      type: String,
      trim: true,
      default: null,
    },
    emailConfirmationSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ClientRequestSchema.index({ status: 1, createdAt: -1 });

export const ClientRequest: Model<IClientRequest> =
  mongoose.models.ClientRequest || mongoose.model<IClientRequest>('ClientRequest', ClientRequestSchema);

/* ==========================================================================
   3. EVENT SCHEMA & MODEL (Sondaggi 'poll' & Eventi Associativi 'official')
   ========================================================================== */
export type EventType = 'poll' | 'official';
export type ParticipantStatus = 'pending' | 'accepted' | 'declined';

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  status: ParticipantStatus;
  respondedAt?: Date;
  googleCalendarSynced: boolean;
}

export interface IInvitee {
  userId: mongoose.Types.ObjectId;
  isMandatory: boolean; // TRUE: Essenziale (priorità nel matching sondaggio) | FALSE: Opzionale
}

export interface IFinalizedSlot {
  date: string;       // Formato 'YYYY-MM-DD'
  startTime: string;  // Formato 'HH:mm' (es. '10:00')
  endTime: string;    // Formato 'HH:mm' (es. '11:00')
}

export interface IEvent extends Document {
  titolo: string;
  descrizione?: string;
  creatore: mongoose.Types.ObjectId;
  eventType: EventType;
  dateProposte: string[];
  oraInizio: number;
  oraFine: number;
  slotIntervalMinutes: number;
  tipo: 'online' | 'in_person';
  luogo?: string;
  linkMeet?: string;
  googleCalendarEventId?: string;
  pollDeadline?: Date;
  stato: 'voting' | 'ready' | 'confirmed';
  invitati: IInvitee[];
  participants: IParticipant[];
  dataOraDefinitiva?: IFinalizedSlot;
  clientRequestId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSubSchema = new Schema<IParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    respondedAt: {
      type: Date,
    },
    googleCalendarSynced: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const EventSchema: Schema<IEvent> = new Schema(
  {
    titolo: {
      type: String,
      required: [true, 'Il titolo del meeting è obbligatorio'],
      trim: true,
      maxlength: [120, 'Titolo massimo 120 caratteri'],
    },
    descrizione: {
      type: String,
      trim: true,
      maxlength: [1000, 'Descrizione massima 1000 caratteri'],
      default: '',
    },
    creatore: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'organizzatore è obbligatorio"],
      index: true,
    },
    eventType: {
      type: String,
      enum: ['poll', 'official'],
      required: true,
      default: 'poll',
      index: true,
    },
    dateProposte: {
      type: [String],
      required: [true, 'Almeno una data è richiesta'],
      validate: {
        validator: (dates: string[]) => dates.length > 0,
        message: 'Devi specificare almeno una data',
      },
    },
    oraInizio: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
      default: 9,
    },
    oraFine: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
      default: 19,
    },
    slotIntervalMinutes: {
      type: Number,
      enum: [30, 60],
      default: 60,
    },
    tipo: {
      type: String,
      enum: ['online', 'in_person'],
      default: 'online',
    },
    luogo: {
      type: String,
      trim: true,
      default: '',
    },
    linkMeet: {
      type: String,
      trim: true,
      default: '',
    },
    googleCalendarEventId: {
      type: String,
      default: null,
    },
    pollDeadline: {
      type: Date,
      index: true,
    },
    stato: {
      type: String,
      enum: ['voting', 'ready', 'confirmed'],
      default: 'voting',
      index: true,
    },
    invitati: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        isMandatory: {
          type: Boolean,
          default: false,
        },
      },
    ],
    participants: {
      type: [ParticipantSubSchema],
      default: [],
    },
    dataOraDefinitiva: {
      date: { type: String },
      startTime: { type: String },
      endTime: { type: String },
    },
    clientRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientRequest',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ eventType: 1, creatore: 1, stato: 1 });
EventSchema.index({ eventType: 1, 'participants.userId': 1, 'participants.status': 1 });
EventSchema.index({ 'invitati.userId': 1, stato: 1 });

export const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

/* ==========================================================================
   4. RESPONSE SCHEMA & MODEL (Per i sondaggi When2meet)
   ========================================================================== */
export interface IResponse extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isMandatory: boolean;
  disponibilita: string[];
  status: 'pending' | 'submitted';
  submittedAt?: Date;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema: Schema<IResponse> = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isMandatory: {
      type: Boolean,
      default: false,
      index: true,
    },
    disponibilita: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'submitted'],
      default: 'pending',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ResponseSchema.index({ eventId: 1, userId: 1 }, { unique: true });
ResponseSchema.index({ eventId: 1, status: 1, reminderSent: 1 });

export const Response: Model<IResponse> = mongoose.models.Response || mongoose.model<IResponse>('Response', ResponseSchema);

export const MONGOOSE_SCHEMAS_CODE = `
import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. User Schema con ruolo 'client_admin'
export type UserSystemRole = 'admin' | 'associate' | 'client_admin';

// 2. ClientRequest Schema (Flusso B2B Richieste Clienti)
export interface IClientRequest extends Document {
  companyName: string;
  contactEmail: string;
  description: string;
  preferredSlots: { date: string; startTime: string; endTime: string; slotKey: string }[];
  status: 'pending' | 'converted_to_poll' | 'confirmed' | 'archived';
  pollEventId?: mongoose.Types.ObjectId;
  finalizedSlot?: { date: string; startTime: string; endTime: string };
  meetLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ClientRequest = mongoose.models.ClientRequest || mongoose.model('ClientRequest', ClientRequestSchema);
`;

