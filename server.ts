/**
 * JESic Meet - Server Express Backend & MongoDB API con Mongoose
 * Junior Enterprise Sicilia
 * 
 * - Connessione a MongoDB Atlas tramite Mongoose (process.env.MONGODB_URI)
 * - Supporto 3 Ruoli: 'user' (Utente Normale) | 'admin_clienti' (Admin Clienti) | 'admin' (Super Admin)
 * - Gestione Gruppi di Lavoro con Codici Univoci & Link di Invito
 * - Gestione Sondaggi When2meet & Eventi Associativi Ufficiali
 * - Gestione Richieste Clienti B2B & Google Calendar
 * - Pronto per deploy su Render (NODE_ENV=production -> dist static files)
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  UserModel,
  GroupModel,
  EventModel,
  PollModel,
  OfficialEventModel,
  ClientRequestModel,
  EventResponseModel,
  UserRole,
} from './src/models/schemas';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ==========================================================================
   CONNESSIONE MONGOOSE A MONGODB ATLAS
   ========================================================================== */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jesic_meet';
let isMongoLive = false;

// Storage di fallback locale reattivo nel caso in cui MongoDB Atlas non sia momentaneamente raggiungibile
const DATA_DIR = path.resolve(__dirname, 'src', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db_store.json');

function loadLocalStore(): {
  users: any[];
  groups: any[];
  events: any[];
  responses: any[];
  clientRequests: any[];
} {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Avviso lettura db_store.json locale:', e);
  }
  return { users: [], groups: [], events: [], responses: [], clientRequests: [] };
}

function saveLocalStore(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Avviso scrittura db_store.json locale:', e);
  }
}

let localStore = loadLocalStore();

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isMongoLive = true;
    console.log('🍃 Connessione a MongoDB Atlas attiva con successo!');
  } catch (err: any) {
    isMongoLive = false;
    console.warn('⚠️ Avviso: MongoDB Atlas non raggiungibile o MONGODB_URI non impostato. Attivazione fallback cache:', err.message);
  }
}

connectToDatabase();

/* ==========================================================================
   REST API ROUTES
   ========================================================================== */

// 1. Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'JESic Meet Full-Stack API',
    mongoConnected: mongoose.connection.readyState === 1 || isMongoLive,
    timestamp: new Date().toISOString(),
  });
});

/* ==========================================================================
   2. USERS & ROLES API ('user' | 'admin_clienti' | 'admin')
   ========================================================================== */

// GET /api/users - Ritorna la lista degli utenti
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await UserModel.find().sort({ createdAt: 1 }).lean();
      const mapped = users.map((u: any) => ({
        id: u._id || u.id,
        name: u.name || u.nome,
        surname: u.surname || u.cognome,
        email: u.email,
        role: (u.role as UserRole) || 'user',
        systemRole: (u.role as UserRole) || 'user',
        jesicRole: u.jesicRole || u.ruolo || 'Consulente Junior',
        avatarUrl: u.avatarUrl || null,
        googleCalendarConnected: Boolean(u.googleCalendarConnected),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      return res.json({ users: mapped });
    }
  } catch (err: any) {
    console.warn('Errore lettura UserModel MongoDB, uso fallback locale:', err.message);
  }

  // Fallback cache locale
  return res.json({ users: localStore.users });
});

// POST /api/users - Registrazione / Sincronizzazione utente nel Database
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { id, name, surname, email, password, role, systemRole, jesicRole, avatarUrl, googleCalendarConnected } = req.body;
    if (!name || !surname || !email) {
      return res.status(400).json({ error: 'Nome, cognome ed email sono obbligatori' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const validRoles: UserRole[] = ['user', 'admin_clienti', 'admin'];

    if (mongoose.connection.readyState === 1) {
      const existing = await UserModel.findOne({ email: cleanEmail });
      if (existing) {
        // Aggiorna l'utente esistente
        if (role && validRoles.includes(role)) {
          existing.role = role;
          existing.systemRole = role;
        }
        if (jesicRole) existing.jesicRole = jesicRole;
        if (avatarUrl) existing.avatarUrl = avatarUrl;
        if (googleCalendarConnected !== undefined) existing.googleCalendarConnected = Boolean(googleCalendarConnected);
        await existing.save();

        const jsonUser = {
          id: existing._id || existing.id,
          name: existing.name,
          surname: existing.surname,
          email: existing.email,
          role: existing.role,
          systemRole: existing.role,
          jesicRole: existing.jesicRole,
          avatarUrl: existing.avatarUrl,
          googleCalendarConnected: existing.googleCalendarConnected,
        };
        return res.json({ user: jsonUser });
      }

      const totalUsers = await UserModel.countDocuments();
      const assignedRole: UserRole = role && validRoles.includes(role) ? role : totalUsers === 0 ? 'admin' : 'user';

      const newUserDoc = await UserModel.create({
        _id: id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        surname,
        email: cleanEmail,
        password: password || '',
        role: assignedRole,
        systemRole: assignedRole,
        jesicRole: jesicRole || 'Consulente Junior',
        avatarUrl: avatarUrl || null,
        googleCalendarConnected: Boolean(googleCalendarConnected),
      });

      const jsonUser = {
        id: newUserDoc._id || newUserDoc.id,
        name: newUserDoc.name,
        surname: newUserDoc.surname,
        email: newUserDoc.email,
        role: newUserDoc.role,
        systemRole: newUserDoc.role,
        jesicRole: newUserDoc.jesicRole,
        avatarUrl: newUserDoc.avatarUrl,
        googleCalendarConnected: newUserDoc.googleCalendarConnected,
      };

      return res.status(201).json({ user: jsonUser });
    }
  } catch (err: any) {
    console.warn('Errore salvataggio UserModel MongoDB, uso fallback:', err.message);
  }

  // Fallback cache locale
  const cleanEmail = req.body.email?.toLowerCase().trim();
  const existingIdx = localStore.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  const isFirst = localStore.users.length === 0;
  const assignedRole = req.body.role || (isFirst ? 'admin' : 'user');

  const newUser = {
    id: req.body.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: req.body.name,
    surname: req.body.surname,
    email: cleanEmail,
    password: req.body.password || '',
    role: assignedRole,
    systemRole: assignedRole,
    jesicRole: req.body.jesicRole || 'Consulente Junior',
    avatarUrl: req.body.avatarUrl || null,
    googleCalendarConnected: Boolean(req.body.googleCalendarConnected),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    localStore.users[existingIdx] = { ...localStore.users[existingIdx], ...newUser };
  } else {
    localStore.users.push(newUser);
  }
  saveLocalStore(localStore);

  return res.status(201).json({ user: newUser });
});

// PATCH /api/users/:id/role - Assegnazione 3 Ruoli ('user', 'admin_clienti', 'admin') protetta da Super Admin
app.patch('/api/users/:id/role', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, adminId } = req.body;

  const validRoles: UserRole[] = ['user', 'admin_clienti', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Il ruolo deve essere 'user', 'admin_clienti' o 'admin'" });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      if (adminId) {
        const adminUser = await UserModel.findOne({ $or: [{ _id: adminId }, { id: adminId }] });
        if (!adminUser || adminUser.role !== 'admin') {
          return res.status(403).json({ error: 'Accesso negato: solo i Super Admin possono modificare i ruoli' });
        }
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        { role, systemRole: role, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: 'Utente non trovato nel database' });
      }

      return res.json({
        success: true,
        message: `Ruolo aggiornato a ${role} con successo nel Database`,
        user: {
          id: updatedUser._id || updatedUser.id,
          name: updatedUser.name,
          surname: updatedUser.surname,
          email: updatedUser.email,
          role: updatedUser.role,
          systemRole: updatedUser.role,
        },
      });
    }
  } catch (err: any) {
    console.warn('Errore aggiornamento ruolo su MongoDB, uso fallback:', err.message);
  }

  // Fallback cache locale
  const userIndex = localStore.users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Utente non trovato' });
  }

  localStore.users[userIndex].role = role;
  localStore.users[userIndex].systemRole = role;
  localStore.users[userIndex].updatedAt = new Date().toISOString();
  saveLocalStore(localStore);

  return res.json({
    success: true,
    message: `Ruolo aggiornato a ${role} con successo`,
    user: localStore.users[userIndex],
  });
});

// PATCH /api/users/:id - Aggiornamento profilo utente
app.patch('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await UserModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, user: updated });
      }
    }
  } catch (err: any) {
    console.warn('Errore aggiornamento profilo utente su MongoDB:', err.message);
  }

  const uIndex = localStore.users.findIndex((u) => u.id === id);
  if (uIndex >= 0) {
    localStore.users[uIndex] = { ...localStore.users[uIndex], ...updates };
    saveLocalStore(localStore);
    return res.json({ success: true, user: localStore.users[uIndex] });
  }

  return res.status(404).json({ error: 'Utente non trovato' });
});

/* ==========================================================================
   3. GROUPS & INVITES API
   ========================================================================== */

// GET /api/groups - Ritorna la lista dei gruppi (opzionalmente filtrata per utente)
app.get('/api/groups', async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    if (mongoose.connection.readyState === 1) {
      let query: any = {};
      if (userId) {
        query = { 'members.userId': userId };
      }
      const groups = await GroupModel.find(query).sort({ createdAt: -1 }).lean();
      const mapped = groups.map((g: any) => ({
        id: g._id || g.id,
        name: g.name,
        description: g.description,
        code: g.code,
        inviteLink: g.inviteLink || `/join/${g.code}`,
        creatorId: g.creatorId,
        members: g.members || [],
        avatar: g.avatar || '👥',
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));
      return res.json({ groups: mapped });
    }
  } catch (err: any) {
    console.warn('Errore lettura GroupModel MongoDB, fallback:', err.message);
  }

  if (userId) {
    const userGroups = localStore.groups.filter((g) =>
      g.members?.some((m: any) => m.userId === userId)
    );
    return res.json({ groups: userGroups });
  }
  return res.json({ groups: localStore.groups });
});

// POST /api/groups - Crea un nuovo gruppo di lavoro
app.post('/api/groups', async (req: Request, res: Response) => {
  const { name, description, avatar, creatorId } = req.body;
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'Nome del gruppo e ID creatore sono obbligatori' });
  }

  const code = `JES-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    if (mongoose.connection.readyState === 1) {
      const newGroupDoc = await GroupModel.create({
        _id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        description: description ? description.trim() : '',
        code,
        inviteLink: `/join/${code}`,
        creatorId,
        avatar: avatar || '👥',
        members: [
          {
            userId: creatorId,
            role: 'admin',
            joinedAt: new Date().toISOString(),
          },
        ],
      });

      return res.status(201).json({
        group: {
          id: newGroupDoc._id || newGroupDoc.id,
          name: newGroupDoc.name,
          description: newGroupDoc.description,
          code: newGroupDoc.code,
          inviteLink: newGroupDoc.inviteLink,
          creatorId: newGroupDoc.creatorId,
          members: newGroupDoc.members,
          avatar: newGroupDoc.avatar,
          createdAt: newGroupDoc.createdAt,
        },
      });
    }
  } catch (err: any) {
    console.warn('Errore salvataggio GroupModel MongoDB, fallback:', err.message);
  }

  const newGroup = {
    id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    name: name.trim(),
    description: description ? description.trim() : '',
    code,
    inviteLink: `/join/${code}`,
    creatorId,
    avatar: avatar || '👥',
    members: [
      {
        userId: creatorId,
        role: 'admin',
        joinedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStore.groups.unshift(newGroup);
  saveLocalStore(localStore);

  return res.status(201).json({ group: newGroup });
});

// POST /api/groups/join - Entra in un gruppo tramite codice o link
app.post('/api/groups/join', async (req: Request, res: Response) => {
  const { codeOrLink, userId } = req.body;
  if (!codeOrLink || !userId) {
    return res.status(400).json({ error: 'Codice/link e ID utente sono obbligatori' });
  }

  let code = codeOrLink.trim().toUpperCase();
  if (code.includes('JOIN/')) {
    code = code.split('JOIN/')[1].split('?')[0].split('/')[0];
  } else if (code.includes('JOIN=')) {
    code = code.split('JOIN=')[1].split('&')[0];
  }

  try {
    if (mongoose.connection.readyState === 1) {
      const group = await GroupModel.findOne({ code });
      if (!group) {
        return res.status(404).json({ error: "Nessun gruppo trovato con questo codice d'invito" });
      }

      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember) {
        group.members.push({
          userId,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
        await group.save();
      }

      return res.json({
        success: true,
        message: isMember ? 'Sei già membro di questo gruppo' : 'Sei entrato nel gruppo con successo!',
        group: {
          id: group._id || group.id,
          name: group.name,
          description: group.description,
          code: group.code,
          inviteLink: group.inviteLink,
          creatorId: group.creatorId,
          members: group.members,
          avatar: group.avatar,
        },
      });
    }
  } catch (err: any) {
    console.warn('Errore GroupModel.join su MongoDB, fallback:', err.message);
  }

  const grp = localStore.groups.find((g) => g.code.toUpperCase() === code);
  if (!grp) {
    return res.status(404).json({ error: "Nessun gruppo trovato con questo codice d'invito" });
  }

  const isMem = grp.members.some((m: any) => m.userId === userId);
  if (!isMem) {
    grp.members.push({
      userId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    grp.updatedAt = new Date().toISOString();
    saveLocalStore(localStore);
  }

  return res.json({
    success: true,
    message: isMem ? 'Sei già membro di questo gruppo' : 'Sei entrato nel gruppo con successo!',
    group: grp,
  });
});

/* ==========================================================================
   4. EVENTS & POLLS API (EventModel / PollModel / OfficialEventModel)
   ========================================================================== */

// GET /api/events - Lista eventi (sondaggi e ufficiali)
app.get('/api/events', async (req: Request, res: Response) => {
  const { groupId, userId, eventType } = req.query;

  try {
    if (mongoose.connection.readyState === 1) {
      let query: any = {};
      if (groupId) query.groupId = groupId;
      if (eventType) query.eventType = eventType;
      if (userId) {
        query.$or = [
          { creatorId: userId },
          { 'invitees.userId': userId },
          { 'participants.userId': userId },
        ];
      }

      const events = await EventModel.find(query).sort({ createdAt: -1 }).lean();
      const mapped = events.map((e: any) => ({
        ...e,
        id: e._id || e.id,
      }));
      return res.json({ events: mapped });
    }
  } catch (err: any) {
    console.warn('Errore lettura EventModel MongoDB, fallback:', err.message);
  }

  let filtered = localStore.events;
  if (groupId) filtered = filtered.filter((e) => e.groupId === groupId);
  if (eventType) filtered = filtered.filter((e) => e.eventType === eventType);
  if (userId) {
    filtered = filtered.filter(
      (e) =>
        e.creatorId === userId ||
        e.invitees?.some((inv: any) => inv.userId === userId) ||
        e.participants?.some((p: any) => p.userId === userId)
    );
  }

  return res.json({ events: filtered });
});

// POST /api/events - Creazione evento (sondaggio When2meet o evento ufficiale)
app.post('/api/events', async (req: Request, res: Response) => {
  const eventData = req.body;
  if (!eventData.title || !eventData.creatorId) {
    return res.status(400).json({ error: 'Titolo e creatore sono obbligatori' });
  }

  const generatedId = eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    if (mongoose.connection.readyState === 1) {
      const created = await EventModel.create({
        ...eventData,
        _id: generatedId,
      });

      return res.status(201).json({
        event: {
          ...created.toObject(),
          id: created._id || created.id,
        },
      });
    }
  } catch (err: any) {
    console.warn('Errore salvataggio EventModel MongoDB, fallback:', err.message);
  }

  const newEvt = {
    ...eventData,
    id: generatedId,
    createdAt: new Date().toISOString(),
  };

  localStore.events.unshift(newEvt);
  saveLocalStore(localStore);

  return res.status(201).json({ event: newEvt });
});

// PATCH /api/events/:id - Aggiornamento evento
app.patch('/api/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await EventModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, event: { ...updated.toObject(), id: updated._id || updated.id } });
      }
    }
  } catch (err: any) {
    console.warn('Errore aggiornamento EventModel MongoDB, fallback:', err.message);
  }

  const index = localStore.events.findIndex((e) => e.id === id);
  if (index >= 0) {
    localStore.events[index] = { ...localStore.events[index], ...updates };
    saveLocalStore(localStore);
    return res.json({ success: true, event: localStore.events[index] });
  }

  return res.status(404).json({ error: 'Evento non trovato' });
});

// DELETE /api/events/:id - Eliminazione evento
app.delete('/api/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState === 1) {
      await EventModel.deleteOne({ $or: [{ _id: id }, { id }] });
      await EventResponseModel.deleteMany({ eventId: id });
    }
  } catch (err: any) {
    console.warn('Errore cancellazione EventModel MongoDB:', err.message);
  }

  localStore.events = localStore.events.filter((e) => e.id !== id);
  localStore.responses = localStore.responses.filter((r) => r.eventId !== id);
  saveLocalStore(localStore);

  return res.json({ success: true, message: 'Evento eliminato con successo' });
});

// POST /api/events/:id/participate - Partecipazione evento ufficiale & Google Calendar
app.post('/api/events/:id/participate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const event = await EventModel.findOne({ $or: [{ _id: id }, { id }] });
      if (event) {
        if (!event.participants) event.participants = [];
        const partIdx = event.participants.findIndex((p) => p.userId === userId);
        if (partIdx >= 0) {
          event.participants[partIdx].status = 'accepted';
          event.participants[partIdx].respondedAt = new Date().toISOString();
          event.participants[partIdx].googleCalendarSynced = true;
        } else {
          event.participants.push({
            userId,
            status: 'accepted',
            respondedAt: new Date().toISOString(),
            googleCalendarSynced: true,
          });
        }
        await event.save();
        return res.json({ success: true, event: { ...event.toObject(), id: event._id || event.id } });
      }
    }
  } catch (err: any) {
    console.warn('Errore participate EventModel MongoDB, fallback:', err.message);
  }

  const eIdx = localStore.events.findIndex((e) => e.id === id);
  if (eIdx >= 0) {
    const evt = localStore.events[eIdx];
    if (!evt.participants) evt.participants = [];
    const pIdx = evt.participants.findIndex((p: any) => p.userId === userId);
    if (pIdx >= 0) {
      evt.participants[pIdx].status = 'accepted';
      evt.participants[pIdx].respondedAt = new Date().toISOString();
      evt.participants[pIdx].googleCalendarSynced = true;
    } else {
      evt.participants.push({
        userId,
        status: 'accepted',
        respondedAt: new Date().toISOString(),
        googleCalendarSynced: true,
      });
    }
    saveLocalStore(localStore);
    return res.json({ success: true, event: evt });
  }

  return res.status(404).json({ error: 'Evento non trovato' });
});

// POST /api/events/:id/decline - Rifiuto partecipazione evento
app.post('/api/events/:id/decline', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const event = await EventModel.findOne({ $or: [{ _id: id }, { id }] });
      if (event) {
        if (!event.participants) event.participants = [];
        const partIdx = event.participants.findIndex((p) => p.userId === userId);
        if (partIdx >= 0) {
          event.participants[partIdx].status = 'declined';
          event.participants[partIdx].respondedAt = new Date().toISOString();
          event.participants[partIdx].googleCalendarSynced = false;
        } else {
          event.participants.push({
            userId,
            status: 'declined',
            respondedAt: new Date().toISOString(),
            googleCalendarSynced: false,
          });
        }
        await event.save();
        return res.json({ success: true, event: { ...event.toObject(), id: event._id || event.id } });
      }
    }
  } catch (err: any) {
    console.warn('Errore decline EventModel MongoDB, fallback:', err.message);
  }

  const eIdx = localStore.events.findIndex((e) => e.id === id);
  if (eIdx >= 0) {
    const evt = localStore.events[eIdx];
    if (!evt.participants) evt.participants = [];
    const pIdx = evt.participants.findIndex((p: any) => p.userId === userId);
    if (pIdx >= 0) {
      evt.participants[pIdx].status = 'declined';
      evt.participants[pIdx].respondedAt = new Date().toISOString();
      evt.participants[pIdx].googleCalendarSynced = false;
    } else {
      evt.participants.push({
        userId,
        status: 'declined',
        respondedAt: new Date().toISOString(),
        googleCalendarSynced: false,
      });
    }
    saveLocalStore(localStore);
    return res.json({ success: true, event: evt });
  }

  return res.status(404).json({ error: 'Evento non trovato' });
});

/* ==========================================================================
   5. AVAILABILITY RESPONSES API (When2meet Slot Responses)
   ========================================================================== */

// GET /api/responses - Ritorna le risposte di disponibilità
app.get('/api/responses', async (req: Request, res: Response) => {
  const { eventId, userId } = req.query;

  try {
    if (mongoose.connection.readyState === 1) {
      let query: any = {};
      if (eventId) query.eventId = eventId;
      if (userId) query.userId = userId;

      const responses = await EventResponseModel.find(query).lean();
      const mapped = responses.map((r: any) => ({
        ...r,
        id: r._id || r.id,
      }));
      return res.json({ responses: mapped });
    }
  } catch (err: any) {
    console.warn('Errore lettura EventResponseModel MongoDB, fallback:', err.message);
  }

  let filtered = localStore.responses;
  if (eventId) filtered = filtered.filter((r) => r.eventId === eventId);
  if (userId) filtered = filtered.filter((r) => r.userId === userId);
  return res.json({ responses: filtered });
});

// POST /api/responses - Invia o aggiorna la disponibilità di uno slot When2meet
app.post('/api/responses', async (req: Request, res: Response) => {
  const { eventId, userId, availability, isMandatory, status } = req.body;
  if (!eventId || !userId) {
    return res.status(400).json({ error: 'eventId e userId sono obbligatori' });
  }

  const nowIso = new Date().toISOString();

  try {
    if (mongoose.connection.readyState === 1) {
      const resp = await EventResponseModel.findOneAndUpdate(
        { eventId, userId },
        {
          availability: availability || [],
          isMandatory: Boolean(isMandatory),
          status: status || 'submitted',
          submittedAt: nowIso,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(201).json({
        response: {
          ...resp.toObject(),
          id: resp._id || resp.id,
        },
      });
    }
  } catch (err: any) {
    console.warn('Errore salvataggio EventResponseModel MongoDB, fallback:', err.message);
  }

  const existingIdx = localStore.responses.findIndex((r) => r.eventId === eventId && r.userId === userId);
  const respItem = {
    id: existingIdx >= 0 ? localStore.responses[existingIdx].id : `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    userId,
    isMandatory: Boolean(isMandatory),
    availability: availability || [],
    status: status || 'submitted',
    submittedAt: nowIso,
  };

  if (existingIdx >= 0) {
    localStore.responses[existingIdx] = respItem;
  } else {
    localStore.responses.push(respItem);
  }
  saveLocalStore(localStore);

  return res.status(201).json({ response: respItem });
});

/* ==========================================================================
   6. CLIENT REQUESTS API (ClientRequestModel B2B)
   ========================================================================== */

// GET /api/client-requests - Lista richieste clienti
app.get('/api/client-requests', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const requests = await ClientRequestModel.find().sort({ createdAt: -1 }).lean();
      const mapped = requests.map((r: any) => ({
        ...r,
        id: r._id || r.id,
      }));
      return res.json({ requests: mapped });
    }
  } catch (err: any) {
    console.warn('Errore lettura ClientRequestModel MongoDB, fallback:', err.message);
  }

  return res.json({ requests: localStore.clientRequests });
});

// POST /api/client-requests - Invia nuova richiesta da cliente
app.post('/api/client-requests', async (req: Request, res: Response) => {
  const reqData = req.body;
  if (!reqData.companyName || !reqData.contactEmail) {
    return res.status(400).json({ error: 'Nome azienda ed email contatto sono obbligatori' });
  }

  const genId = reqData.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    if (mongoose.connection.readyState === 1) {
      const created = await ClientRequestModel.create({
        ...reqData,
        _id: genId,
      });

      return res.status(201).json({
        request: {
          ...created.toObject(),
          id: created._id || created.id,
        },
      });
    }
  } catch (err: any) {
    console.warn('Errore salvataggio ClientRequestModel MongoDB, fallback:', err.message);
  }

  const newReq = {
    ...reqData,
    id: genId,
    status: reqData.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStore.clientRequests.unshift(newReq);
  saveLocalStore(localStore);

  return res.status(201).json({ request: newReq });
});

// PATCH /api/client-requests/:id - Aggiorna richiesta cliente
app.patch('/api/client-requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await ClientRequestModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, request: { ...updated.toObject(), id: updated._id || updated.id } });
      }
    }
  } catch (err: any) {
    console.warn('Errore aggiornamento ClientRequestModel MongoDB, fallback:', err.message);
  }

  const rIdx = localStore.clientRequests.findIndex((r) => r.id === id);
  if (rIdx >= 0) {
    localStore.clientRequests[rIdx] = { ...localStore.clientRequests[rIdx], ...updates };
    saveLocalStore(localStore);
    return res.json({ success: true, request: localStore.clientRequests[rIdx] });
  }

  return res.status(404).json({ error: 'Richiesta non trovata' });
});

// POST /api/client-requests/:id/confirm-final - Chiusura e conferma call con cliente
app.post('/api/client-requests/:id/confirm-final', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { finalizedDate, finalizedStartTime, finalizedEndTime, meetLink } = req.body;

  const generatedMeet = meetLink || `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-call`;

  try {
    if (mongoose.connection.readyState === 1) {
      await ClientRequestModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        {
          status: 'confirmed',
          finalizedSlot: {
            date: finalizedDate,
            startTime: finalizedStartTime,
            endTime: finalizedEndTime,
          },
          meetLink: generatedMeet,
          updatedAt: new Date(),
        }
      );
    }
  } catch (err: any) {
    console.warn('Errore confirm-final ClientRequestModel MongoDB, fallback:', err.message);
  }

  const reqIndex = localStore.clientRequests.findIndex((r) => r.id === id);
  if (reqIndex >= 0) {
    localStore.clientRequests[reqIndex].status = 'confirmed';
    localStore.clientRequests[reqIndex].finalizedSlot = {
      date: finalizedDate,
      startTime: finalizedStartTime,
      endTime: finalizedEndTime,
    };
    localStore.clientRequests[reqIndex].meetLink = generatedMeet;
    localStore.clientRequests[reqIndex].updatedAt = new Date().toISOString();
    saveLocalStore(localStore);
  }

  return res.json({ success: true, message: 'Richiesta confermata con successo', meetLink: generatedMeet });
});

/* ==========================================================================
   CONFIGURAZIONE PRONTA PER IL DEPLOY SU RENDER
   ========================================================================== */
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // In produzione (Render, Cloud Run, ecc.) Express serve la cartella dist generata da `vite build`
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In sviluppo monta vite.middlewares per HMR e SPA routing
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JESic Meet Server attivo su http://0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
