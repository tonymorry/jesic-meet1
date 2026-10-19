/**
 * JESic Meet - Server Express Backend & MongoDB API con Mongoose
 * Junior Enterprise Sicilia
 * 
 * - Connessione esclusiva a MongoDB Atlas tramite Mongoose (process.env.MONGODB_URI)
 * - Persistenza REALE al 100% su MongoDB (nessun file system locale / fs o db_store.json effimero)
 * - Supporto 3 Ruoli: 'user' (Utente Normale) | 'admin_clienti' (Admin Clienti) | 'admin' (Super Admin)
 * - Gestione Gruppi di Lavoro con Codici Univoci & Link di Invito
 * - Gestione Sondaggi When2meet & Eventi Associativi Ufficiali
 * - Gestione Richieste Clienti B2B & Google Calendar
 * - Configurazione pronta per il deploy su Render (NODE_ENV=production -> dist static files)
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { createGoogleCalendarEvent } from './src/utils/googleCalendar';

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

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🍃 Connessione a MongoDB Atlas attiva con successo!');
  } catch (err: any) {
    console.error('❌ Errore critico connessione a MongoDB:', err.message);
  }
}

connectToDatabase();

/* ==========================================================================
   REST API ROUTES - TUTTE COLLEGATE ESCLUSIVAMENTE A MONGOOSE / MONGODB
   ========================================================================== */

// 1. Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'ok' : 'degraded',
    service: 'JESic Meet Full-Stack API',
    database: 'MongoDB Atlas',
    mongoConnected: isConnected,
    connectionState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

/* ==========================================================================
   2. USERS & ROLES API ('user' | 'admin_clienti' | 'admin')
   ========================================================================== */

// GET /api/users - Ritorna la lista degli utenti da MongoDB
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    console.error('Errore lettura UserModel da MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore durante la lettura degli utenti dal database MongoDB' });
  }
});

// Gestione Registrazione / Sincronizzazione utente nel Database MongoDB
const handleUserSync = async (req: Request, res: Response) => {
  try {
    const {
      id,
      name,
      surname,
      email,
      password,
      jesicRole,
      avatarUrl,
      googleCalendarConnected,
      googleAccessToken,
      googleRefreshToken,
    } = req.body;

    if (!name || !surname || !email) {
      return res.status(400).json({ error: 'Nome, cognome ed email sono obbligatori' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      // REGOLA: Se l'utente esiste già nel DB, NON sovrascrivere MAI il 'role'.
      // MongoDB è l'unica fonte di verità!
      if (name && !existing.name) existing.name = name;
      if (surname && !existing.surname) existing.surname = surname;
      if (jesicRole && !existing.jesicRole) existing.jesicRole = jesicRole;
      if (avatarUrl && !existing.avatarUrl) existing.avatarUrl = avatarUrl;
      if (googleCalendarConnected !== undefined) existing.googleCalendarConnected = Boolean(googleCalendarConnected);
      if (googleAccessToken) existing.googleAccessToken = googleAccessToken;
      if (googleRefreshToken) existing.googleRefreshToken = googleRefreshToken;
      await existing.save();

      const jsonUser = {
        id: existing._id || existing.id,
        name: existing.name,
        surname: existing.surname,
        email: existing.email,
        role: existing.role || 'user',
        systemRole: existing.role || 'user',
        jesicRole: existing.jesicRole,
        avatarUrl: existing.avatarUrl,
        googleCalendarConnected: existing.googleCalendarConnected,
        googleAccessToken: existing.googleAccessToken || undefined,
        googleRefreshToken: existing.googleRefreshToken || undefined,
      };
      return res.json({ user: jsonUser });
    }

    // REGOLA: Di base TUTTI i nuovi utenti nascono SEMPRE e solo con 'role: user' (Utente Normale).
    const assignedRole: UserRole = 'user';

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
      googleCalendarConnected: googleCalendarConnected !== undefined ? Boolean(googleCalendarConnected) : true,
      googleAccessToken: googleAccessToken || '',
      googleRefreshToken: googleRefreshToken || '',
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
      googleAccessToken: newUserDoc.googleAccessToken || undefined,
      googleRefreshToken: newUserDoc.googleRefreshToken || undefined,
    };

    return res.status(201).json({ user: jsonUser });
  } catch (err: any) {
    console.error('Errore salvataggio UserModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore durante la registrazione dell\'utente in MongoDB' });
  }
};

app.post('/api/users', handleUserSync);
app.post('/api/users/sync', handleUserSync);

// PATCH /api/users/:id/role - Assegnazione 3 Ruoli ('user', 'admin', 'admin_clienti')
app.patch('/api/users/:id/role', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, adminId } = req.body;

  const validRoles: UserRole[] = ['user', 'admin_clienti', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Il ruolo deve essere 'user', 'admin' o 'admin_clienti'" });
  }

  try {
    if (adminId) {
      const adminUser = await UserModel.findOne({ $or: [{ _id: adminId }, { id: adminId }] });
      if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'admin_clienti')) {
        return res.status(403).json({ error: 'Accesso negato: solo Admin o Admin Clienti possono modificare i ruoli' });
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
  } catch (err: any) {
    console.error('Errore aggiornamento ruolo UserModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento ruolo su MongoDB' });
  }
});

// PATCH /api/users/:id - Modifica profilo utente
app.patch('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, surname, jesicRole, avatarUrl, googleCalendarConnected, googleAccessToken, googleRefreshToken } = req.body;

  try {
    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (surname) updateData.surname = surname;
    if (jesicRole) updateData.jesicRole = jesicRole;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (googleCalendarConnected !== undefined) updateData.googleCalendarConnected = Boolean(googleCalendarConnected);
    if (googleAccessToken !== undefined) updateData.googleAccessToken = googleAccessToken;
    if (googleRefreshToken !== undefined) updateData.googleRefreshToken = googleRefreshToken;

    const updatedUser = await UserModel.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Utente non trovato nel database' });
    }

    return res.json({
      success: true,
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        surname: updatedUser.surname,
        email: updatedUser.email,
        role: updatedUser.role,
        systemRole: updatedUser.role,
        jesicRole: updatedUser.jesicRole,
        avatarUrl: updatedUser.avatarUrl,
        googleCalendarConnected: updatedUser.googleCalendarConnected,
        googleAccessToken: updatedUser.googleAccessToken || undefined,
        googleRefreshToken: updatedUser.googleRefreshToken || undefined,
      },
    });
  } catch (err: any) {
    console.error('Errore aggiornamento profilo UserModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento profilo su MongoDB' });
  }
});

/* ==========================================================================
   3. GROUPS & MEMBERS API (GroupModel)
   ========================================================================== */

// GET /api/groups - Ritorna la lista dei gruppi da MongoDB
app.get('/api/groups', async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    let filter: any = {};
    if (userId) {
      filter = { 'members.userId': userId };
    }
    const groups = await GroupModel.find(filter).sort({ createdAt: -1 }).lean();
    const mapped = groups.map((g: any) => ({
      id: g._id || g.id,
      name: g.name,
      description: g.description,
      code: g.code,
      inviteLink: g.inviteLink,
      creatorId: g.creatorId,
      members: g.members,
      avatar: g.avatar,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
    return res.json({ groups: mapped });
  } catch (err: any) {
    console.error('Errore lettura GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore durante la lettura dei gruppi da MongoDB' });
  }
});

// POST /api/groups - Crea un nuovo gruppo di lavoro in MongoDB
app.post('/api/groups', async (req: Request, res: Response) => {
  const { name, description, avatar, creatorId } = req.body;
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'Nome del gruppo e ID creatore sono obbligatori' });
  }

  const code = `JES-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
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
  } catch (err: any) {
    console.error('Errore creazione GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore creazione gruppo su MongoDB' });
  }
});

// POST /api/groups/join - Entra in un gruppo tramite codice o link in MongoDB
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
  } catch (err: any) {
    console.error('Errore join GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore durante l\'adesione al gruppo in MongoDB' });
  }
});

// PATCH /api/groups/:id - Modifica nome o dettagli del gruppo (Creatore o Admin)
app.patch('/api/groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, avatar, userId } = req.body;

  try {
    const group = await GroupModel.findOne({ $or: [{ _id: id }, { id }] });
    if (!group) {
      return res.status(404).json({ error: 'Gruppo non trovato nel database' });
    }

    if (userId && group.creatorId !== userId) {
      const user = await UserModel.findOne({ $or: [{ _id: userId }, { id: userId }] });
      if (!user || (user.role !== 'admin' && user.role !== 'admin_clienti')) {
        return res.status(403).json({ error: 'Solo il creatore del gruppo o un admin può modificare il gruppo' });
      }
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description ? description.trim() : '';
    if (avatar) group.avatar = avatar;
    await group.save();

    const mappedGroup = {
      id: group._id || group.id,
      name: group.name,
      description: group.description,
      code: group.code,
      inviteLink: group.inviteLink,
      creatorId: group.creatorId,
      members: group.members,
      avatar: group.avatar,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    return res.json({ success: true, message: 'Gruppo aggiornato con successo in MongoDB', group: mappedGroup });
  } catch (err: any) {
    console.error('Errore aggiornamento GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento gruppo su database MongoDB' });
  }
});

// DELETE /api/groups/:id - Elimina l'intero gruppo (Creatore o Admin)
app.delete('/api/groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.body?.userId || req.query?.userId) as string | undefined;

  try {
    const group = await GroupModel.findOne({ $or: [{ _id: id }, { id }] });
    if (!group) {
      return res.status(404).json({ error: 'Gruppo non trovato nel database' });
    }

    if (userId && group.creatorId !== userId) {
      const user = await UserModel.findOne({ $or: [{ _id: userId }, { id: userId }] });
      if (!user || (user.role !== 'admin' && user.role !== 'admin_clienti')) {
        return res.status(403).json({ error: 'Solo il creatore del gruppo o un admin può eliminare il gruppo' });
      }
    }

    await GroupModel.deleteOne({ $or: [{ _id: id }, { id }] });
    return res.json({ success: true, message: 'Gruppo eliminato definitivamente con successo da MongoDB' });
  } catch (err: any) {
    console.error('Errore eliminazione GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore eliminazione gruppo in MongoDB' });
  }
});

// DELETE /api/groups/:id/members/:memberId - Espelli membro dal gruppo (Creatore o Admin)
const handleRemoveMemberFromGroup = async (req: Request, res: Response) => {
  const { id, memberId } = req.params;
  const requesterId = (req.body?.requesterId || req.query?.requesterId) as string | undefined;

  try {
    const group = await GroupModel.findOne({ $or: [{ _id: id }, { id }] });
    if (!group) {
      return res.status(404).json({ error: 'Gruppo non trovato nel database' });
    }

    if (memberId === group.creatorId) {
      return res.status(400).json({ error: 'Non puoi espellere il creatore del gruppo' });
    }

    if (requesterId && group.creatorId !== requesterId) {
      const user = await UserModel.findOne({ $or: [{ _id: requesterId }, { id: requesterId }] });
      if (!user || (user.role !== 'admin' && user.role !== 'admin_clienti')) {
        return res.status(403).json({ error: 'Solo il creatore del gruppo o un admin può espellere membri' });
      }
    }

    group.members = group.members.filter((m: any) => m.userId !== memberId);
    await group.save();

    const mappedGroup = {
      id: group._id || group.id,
      name: group.name,
      description: group.description,
      code: group.code,
      inviteLink: group.inviteLink,
      creatorId: group.creatorId,
      members: group.members,
      avatar: group.avatar,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    return res.json({ success: true, message: 'Membro rimosso con successo dal gruppo in MongoDB', group: mappedGroup });
  } catch (err: any) {
    console.error('Errore rimozione membro GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore rimozione membro in MongoDB' });
  }
};

app.delete('/api/groups/:id/members/:memberId', handleRemoveMemberFromGroup);
app.post('/api/groups/:id/members/:memberId/remove', handleRemoveMemberFromGroup);

/* ==========================================================================
   4. EVENTS & POLLS API (EventModel / PollModel / OfficialEventModel)
   ========================================================================== */

// GET /api/events - Lista eventi (sondaggi e ufficiali) da MongoDB
app.get('/api/events', async (req: Request, res: Response) => {
  const { groupId, userId, eventType } = req.query;

  try {
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
  } catch (err: any) {
    console.error('Errore lettura EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore lettura eventi dal database MongoDB' });
  }
});

// POST /api/events - Creazione evento (sondaggio When2meet o evento ufficiale)
app.post('/api/events', async (req: Request, res: Response) => {
  const eventData = req.body;
  if (!eventData.title || !eventData.creatorId) {
    return res.status(400).json({ error: 'Titolo e creatore sono obbligatori' });
  }

  const generatedId = eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    // AUTOMAZIONE SILENTE GOOGLE CALENDAR & MEET LATO BACKEND
    // Nel momento esatto in cui un utente crea un Evento Ufficiale o un evento già confermato
    if (eventData.eventType === 'official' || eventData.status === 'confirmed' || eventData.finalizedSlot) {
      try {
        const creator = await UserModel.findOne({ $or: [{ _id: eventData.creatorId }, { id: eventData.creatorId }] });
        const userToken =
          req.headers.authorization?.replace('Bearer ', '') ||
          eventData.googleAccessToken ||
          creator?.googleAccessToken;
        const refreshToken = creator?.googleRefreshToken || eventData.googleRefreshToken;

        // Raccogli email degli invitati
        const inviteeIds = (eventData.invitees || []).map((i: any) => i.userId);
        const inviteeUsers = await UserModel.find({
          $or: [{ _id: { $in: inviteeIds } }, { id: { $in: inviteeIds } }],
        });
        const attendeeEmails = [
          ...inviteeUsers.map((u) => u.email),
          ...(eventData.externalInviteEmails || []),
        ].filter(Boolean);

        const targetDate =
          eventData.finalizedSlot?.date ||
          (eventData.dates && eventData.dates[0]) ||
          new Date().toISOString().split('T')[0];
        const targetStartTime =
          eventData.finalizedSlot?.startTime || `${String(eventData.startHour || 9).padStart(2, '0')}:00`;
        const targetEndTime =
          eventData.finalizedSlot?.endTime || `${String(eventData.endHour || 10).padStart(2, '0')}:00`;

        const calRes = await createGoogleCalendarEvent({
          accessToken: userToken,
          refreshToken,
          title: eventData.title,
          description: eventData.description,
          date: targetDate,
          startTime: targetStartTime,
          endTime: targetEndTime,
          isOnline: eventData.type !== 'in_person',
          location: eventData.location,
          attendeeEmails,
        });

        if (calRes.meetLink) {
          eventData.meetLink = calRes.meetLink;
        }
        if (calRes.eventId) {
          eventData.googleCalendarEventId = calRes.eventId;
        }
      } catch (gcalErr: any) {
        console.warn('[Backend Google Calendar] Avviso creazione evento ufficiale:', gcalErr.message || gcalErr);
      }
    }

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
  } catch (err: any) {
    console.error('Errore salvataggio EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore salvataggio evento in MongoDB' });
  }
});

// GET /api/events/:id - Recupero singolo evento
app.get('/api/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const event = await EventModel.findOne({ $or: [{ _id: id }, { id }] }).lean();
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato nel database' });
    }
    return res.json({ event: { ...event, id: (event as any)._id || (event as any).id } });
  } catch (err: any) {
    console.error('Errore recupero evento MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore lettura evento in MongoDB' });
  }
});

// PATCH /api/events/:id - Aggiornamento evento in MongoDB
app.patch('/api/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // AUTOMAZIONE SILENTE GOOGLE CALENDAR & MEET LATO BACKEND
    // Nel momento esatto in cui un sondaggio viene finalizzato/confermato
    if (updates.status === 'confirmed' && updates.finalizedSlot) {
      try {
        const existingEvent = await EventModel.findOne({ $or: [{ _id: id }, { id }] });
        if (existingEvent) {
          const creator = await UserModel.findOne({
            $or: [{ _id: existingEvent.creatorId }, { id: existingEvent.creatorId }],
          });
          const userToken =
            req.headers.authorization?.replace('Bearer ', '') ||
            updates.googleAccessToken ||
            creator?.googleAccessToken;
          const refreshToken = creator?.googleRefreshToken || updates.googleRefreshToken;

          const inviteeIds = (existingEvent.invitees || []).map((i: any) => i.userId);
          const inviteeUsers = await UserModel.find({
            $or: [{ _id: { $in: inviteeIds } }, { id: { $in: inviteeIds } }],
          });
          const attendeeEmails = [
            ...inviteeUsers.map((u) => u.email),
            ...(existingEvent.externalInviteEmails || []),
          ].filter(Boolean);

          const calRes = await createGoogleCalendarEvent({
            accessToken: userToken,
            refreshToken,
            title: updates.title || existingEvent.title,
            description: updates.description || existingEvent.description,
            date: updates.finalizedSlot.date,
            startTime: updates.finalizedSlot.startTime,
            endTime: updates.finalizedSlot.endTime,
            isOnline: existingEvent.type !== 'in_person',
            location: existingEvent.location,
            attendeeEmails,
          });

          if (calRes.meetLink) {
            updates.meetLink = calRes.meetLink;
          }
          if (calRes.eventId) {
            updates.googleCalendarEventId = calRes.eventId;
          }
        }
      } catch (gcalErr: any) {
        console.warn('[Backend Google Calendar] Avviso conferma finale sondaggio:', gcalErr.message || gcalErr);
      }
    }

    const updated = await EventModel.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      { $set: updates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Evento non trovato nel database' });
    }
    return res.json({ success: true, event: { ...updated.toObject(), id: updated._id || updated.id } });
  } catch (err: any) {
    console.error('Errore aggiornamento EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento evento in MongoDB' });
  }
});

// DELETE /api/events/:id - Eliminazione evento da MongoDB
app.delete('/api/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await EventModel.deleteOne({ $or: [{ _id: id }, { id }] });
    await EventResponseModel.deleteMany({ eventId: id });
    return res.json({ success: true, message: 'Evento eliminato con successo da MongoDB' });
  } catch (err: any) {
    console.error('Errore cancellazione EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore eliminazione evento in MongoDB' });
  }
});

// POST /api/events/:id/participate - Partecipazione evento ufficiale & Google Calendar
app.post('/api/events/:id/participate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const event = await EventModel.findOne({ $or: [{ _id: id }, { id }] });
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }

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
  } catch (err: any) {
    console.error('Errore participate EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore salvataggio partecipazione in MongoDB' });
  }
});

// POST /api/events/:id/decline - Rifiuto partecipazione evento
app.post('/api/events/:id/decline', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const event = await EventModel.findOne({ $or: [{ _id: id }, { id }] });
    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }

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
  } catch (err: any) {
    console.error('Errore decline EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore salvataggio rifiuto in MongoDB' });
  }
});

/* ==========================================================================
   5. AVAILABILITY RESPONSES API (When2meet Slot Responses)
   ========================================================================== */

// GET /api/responses - Ritorna le risposte di disponibilità da MongoDB
app.get('/api/responses', async (req: Request, res: Response) => {
  const { eventId, userId } = req.query;

  try {
    let query: any = {};
    if (eventId) query.eventId = eventId;
    if (userId) query.userId = userId;

    const responses = await EventResponseModel.find(query).lean();
    const mapped = responses.map((r: any) => ({
      ...r,
      id: r._id || r.id,
    }));
    return res.json({ responses: mapped });
  } catch (err: any) {
    console.error('Errore lettura EventResponseModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore lettura risposte da MongoDB' });
  }
});

// POST /api/responses - Invia o aggiorna la disponibilità di uno slot When2meet in MongoDB
app.post('/api/responses', async (req: Request, res: Response) => {
  const { eventId, userId, availability, isMandatory, status } = req.body;
  if (!eventId || !userId) {
    return res.status(400).json({ error: 'eventId e userId sono obbligatori' });
  }

  const nowIso = new Date().toISOString();

  try {
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
  } catch (err: any) {
    console.error('Errore salvataggio EventResponseModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore salvataggio disponibilità in MongoDB' });
  }
});

/* ==========================================================================
   6. CLIENT REQUESTS API (ClientRequestModel B2B)
   ========================================================================== */

// GET /api/client-requests - Lista richieste clienti da MongoDB
app.get('/api/client-requests', async (_req: Request, res: Response) => {
  try {
    const requests = await ClientRequestModel.find().sort({ createdAt: -1 }).lean();
    const mapped = requests.map((r: any) => ({
      ...r,
      id: r._id || r.id,
    }));
    return res.json({ requests: mapped });
  } catch (err: any) {
    console.error('Errore lettura ClientRequestModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore lettura richieste da MongoDB' });
  }
});

// POST /api/client-requests - Invia nuova richiesta da cliente in MongoDB
app.post('/api/client-requests', async (req: Request, res: Response) => {
  const reqData = req.body;
  if (!reqData.companyName || !reqData.contactEmail) {
    return res.status(400).json({ error: 'Nome azienda ed email contatto sono obbligatori' });
  }

  const genId = reqData.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    const created = await ClientRequestModel.create({
      ...reqData,
      _id: genId,
      status: reqData.status || 'pending',
    });

    return res.status(201).json({
      request: {
        ...created.toObject(),
        id: created._id || created.id,
      },
    });
  } catch (err: any) {
    console.error('Errore salvataggio ClientRequestModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore salvataggio richiesta cliente in MongoDB' });
  }
});

// PATCH /api/client-requests/:id - Aggiorna richiesta cliente in MongoDB
app.patch('/api/client-requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updated = await ClientRequestModel.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      { $set: updates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Richiesta non trovata nel database' });
    }
    return res.json({ success: true, request: { ...updated.toObject(), id: updated._id || updated.id } });
  } catch (err: any) {
    console.error('Errore aggiornamento ClientRequestModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento richiesta cliente in MongoDB' });
  }
});

// POST /api/client-requests/:id/confirm-final - Chiusura e conferma call con cliente in MongoDB
app.post('/api/client-requests/:id/confirm-final', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { finalizedDate, finalizedStartTime, finalizedEndTime, meetLink } = req.body;

  const generatedMeet = meetLink || `https://meet.google.com/jes-${Math.random().toString(36).substring(2, 6)}-call`;

  try {
    const updated = await ClientRequestModel.findOneAndUpdate(
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
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Richiesta non trovata nel database' });
    }

    return res.json({ success: true, message: 'Richiesta confermata con successo in MongoDB', meetLink: generatedMeet });
  } catch (err: any) {
    console.error('Errore confirm-final ClientRequestModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore conferma call cliente in MongoDB' });
  }
});

/* ==========================================================================
   CONFIGURAZIONE PRONTA PER IL DEPLOY SU RENDER
   ========================================================================== */
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // In produzione (Render) Express serve i file statici compilati da Vite nella cartella dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In sviluppo monta vite.middlewares per HMR
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
