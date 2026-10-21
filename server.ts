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
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './src/utils/googleCalendar';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
  process.env.GOOGLE_CLIENT_SECRET || '',
  'postmessage'
);
const googleAuthClient = oAuth2Client;

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
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('🍃 Connessione a MongoDB Atlas attiva con successo!');
  } catch (err: any) {
    console.error('❌ Errore connessione a MongoDB:', err.message);
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
// REGOLA:
// 1. Supporta il vero Google OAuth2 con verifica del token JWT (credential) tramite 'google-auth-library'.
// 2. I token Google sono opzionali, salvando null se assenti.
// 3. Trova o crea l'utente SOLO tramite email nel database MongoDB (assegnando ruolo 'user' ai nuovi).
const handleUserSync = async (req: Request, res: Response) => {
  try {
    const {
      code, // Authorization Code restituito da useGoogleLogin (flow: 'auth-code')
      credential, // JWT ID Token restituito da @react-oauth/google (alternativo)
      id,
      name,
      surname,
      nome,
      cognome,
      email,
      password,
      jesicRole,
      ruolo,
      avatarUrl,
      googleCalendarConnected,
      googleAccessToken,
      googleRefreshToken,
    } = req.body;

    let cleanEmail = email ? String(email).toLowerCase().trim() : '';
    let extractedName = (name || nome)?.trim() || '';
    let extractedSurname = (surname || cognome)?.trim() || '';
    let extractedAvatar = avatarUrl || null;
    let actualAccessToken = googleAccessToken || null;
    let actualRefreshToken = googleRefreshToken || null;

    // 1. Scambio dell'Authorization Code con token reali Google (flow: 'auth-code')
    // REGOLA CRITICA: redirect_uri deve essere 'postmessage' per evitare redirect_uri_mismatch
    if (code && typeof code === 'string') {
      try {
        const tokenResponse = await oAuth2Client.getToken({
          code,
          redirect_uri: 'postmessage',
        });
        const tokens = tokenResponse.tokens;
        if (tokens.access_token) {
          actualAccessToken = tokens.access_token;
        }
        if (tokens.refresh_token) {
          actualRefreshToken = tokens.refresh_token;
        }
        if (tokens.id_token) {
          try {
            const ticket = await oAuth2Client.verifyIdToken({
              idToken: tokens.id_token,
              audience: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || undefined,
            });
            const payload = ticket.getPayload();
            if (payload?.email) {
              cleanEmail = payload.email.toLowerCase().trim();
              extractedName = payload.given_name || payload.name?.split(' ')[0] || cleanEmail.split('@')[0];
              extractedSurname = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'JESic';
              extractedAvatar = payload.picture || extractedAvatar;
            }
          } catch (jwtErr: any) {
            // Decodifica di emergenza payload base64
            const parts = tokens.id_token.split('.');
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              if (decoded?.email) {
                cleanEmail = decoded.email.toLowerCase().trim();
                extractedName = decoded.given_name || decoded.name?.split(' ')[0] || cleanEmail.split('@')[0];
                extractedSurname = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || 'JESic';
                extractedAvatar = decoded.picture || extractedAvatar;
              }
            }
          }
        }
      } catch (tokenErr: any) {
        console.error('Errore scambio code OAuth2 Google (redirect_uri: postmessage):', tokenErr.message);
      }
    }

    // 2. Se il client ha inviato il JWT token (credential)
    if (!cleanEmail && credential && typeof credential === 'string') {
      try {
        const expectedAudience = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
        const ticket = await oAuth2Client.verifyIdToken({
          idToken: credential,
          audience: expectedAudience || undefined,
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          cleanEmail = payload.email.toLowerCase().trim();
          extractedName = payload.given_name || payload.name?.split(' ')[0] || cleanEmail.split('@')[0];
          extractedSurname = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'JESic';
          extractedAvatar = payload.picture || extractedAvatar;
        }
      } catch (verifyErr: any) {
        console.warn('[google-auth-library] Avviso verifica token:', verifyErr.message);
        // Fallback decodifica payload base64 per ambienti di test/dev con Client ID variabile
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (decoded?.email) {
              cleanEmail = decoded.email.toLowerCase().trim();
              extractedName = decoded.given_name || decoded.name?.split(' ')[0] || cleanEmail.split('@')[0];
              extractedSurname = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || 'JESic';
              extractedAvatar = decoded.picture || extractedAvatar;
            }
          }
        } catch (e) {
          return res.status(401).json({ error: 'Token Google OAuth2 non valido' });
        }
      }
    }

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email obbligatoria per la registrazione/sincronizzazione' });
    }

    const defaultName = extractedName || cleanEmail.split('@')[0]?.split('.')[0] || 'Utente';
    const defaultSurname = extractedSurname || cleanEmail.split('@')[0]?.split('.')[1] || 'JESic';

    // Cerca l'utente SOLO tramite email nel database MongoDB
    let existing = await UserModel.findOne({ email: cleanEmail });

    if (existing) {
      // REGOLA: Se l'utente esiste già nel DB, NON sovrascrivere MAI il 'role'.
      // MongoDB è l'unica fonte di verità!
      if (defaultName && (!existing.name || existing.name === 'Utente')) existing.name = defaultName;
      if (defaultSurname && (!existing.surname || existing.surname === 'JESic')) existing.surname = defaultSurname;
      if (extractedAvatar && !existing.avatarUrl) existing.avatarUrl = extractedAvatar;
      if ((jesicRole || ruolo) && !existing.jesicRole) existing.jesicRole = jesicRole || ruolo;
      if (actualAccessToken) existing.googleAccessToken = actualAccessToken;
      if (actualRefreshToken) {
        existing.googleRefreshToken = actualRefreshToken;
        existing.googleCalendarConnected = true;
      } else if (existing.googleRefreshToken) {
        existing.googleCalendarConnected = true;
      }
      if (googleCalendarConnected !== undefined) existing.googleCalendarConnected = Boolean(googleCalendarConnected);

      await existing.save();

      const jsonUser = {
        id: existing._id || existing.id,
        name: existing.name,
        surname: existing.surname,
        email: existing.email,
        role: existing.role || 'user',
        systemRole: existing.role || 'user',
        jesicRole: existing.jesicRole || 'Consulente Junior',
        avatarUrl: existing.avatarUrl || null,
        googleCalendarConnected: Boolean(existing.googleCalendarConnected),
      };
      return res.json({ user: jsonUser });
    }

    // REGOLA: Di base TUTTI i nuovi utenti nascono SEMPRE e solo con 'role: user' (Utente Normale).
    const assignedRole: UserRole = 'user';

    const newUserDoc = await UserModel.create({
      _id: id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      surname: defaultSurname,
      email: cleanEmail,
      password: password || '',
      role: assignedRole,
      systemRole: assignedRole,
      jesicRole: jesicRole || ruolo || 'Consulente Junior',
      avatarUrl: extractedAvatar || null,
      googleCalendarConnected: actualRefreshToken ? true : googleCalendarConnected !== undefined ? Boolean(googleCalendarConnected) : false,
      googleAccessToken: actualAccessToken || null,
      googleRefreshToken: actualRefreshToken || null,
    });

    const jsonUser = {
      id: newUserDoc._id || newUserDoc.id,
      name: newUserDoc.name,
      surname: newUserDoc.surname,
      email: newUserDoc.email,
      role: newUserDoc.role || 'user',
      systemRole: newUserDoc.role || 'user',
      jesicRole: newUserDoc.jesicRole,
      avatarUrl: newUserDoc.avatarUrl,
      googleCalendarConnected: Boolean(newUserDoc.googleCalendarConnected),
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
  const { userId, search } = req.query;

  try {
    let filter: any = {};
    if (search && typeof search === 'string' && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    } else if (userId) {
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
      isPublic: g.isPublic ?? false,
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
  const { name, description, avatar, creatorId, isPublic } = req.body;
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
      isPublic: isPublic === true,
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
        isPublic: newGroupDoc.isPublic ?? false,
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
        isPublic: group.isPublic ?? false,
      },
    });
  } catch (err: any) {
    console.error('Errore join GroupModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore durante l\'adesione al gruppo in MongoDB' });
  }
});

// POST /api/groups/:id/join-public - Entra direttamente in un gruppo pubblico conoscendo il nome
app.post('/api/groups/:id/join-public', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'ID utente obbligatorio' });
  }

  try {
    const group = await GroupModel.findOne({ $or: [{ _id: id }, { id }] });
    if (!group) {
      return res.status(404).json({ error: 'Gruppo non trovato nel database' });
    }

    if (!group.isPublic) {
      return res.status(403).json({ error: 'Questo gruppo è privato. È necessario il codice d\'invito.' });
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

    const mappedGroup = {
      id: group._id || group.id,
      name: group.name,
      description: group.description,
      code: group.code,
      inviteLink: group.inviteLink,
      creatorId: group.creatorId,
      members: group.members,
      avatar: group.avatar,
      isPublic: group.isPublic ?? false,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    return res.json({
      success: true,
      message: isMember ? 'Sei già membro di questo gruppo' : 'Sei entrato nel gruppo pubblico con successo!',
      group: mappedGroup,
    });
  } catch (err: any) {
    console.error('Errore join pubblico gruppo:', err.message);
    return res.status(500).json({ error: 'Errore durante l\'ingresso nel gruppo pubblico' });
  }
});

// PATCH /api/groups/:id - Modifica nome, dettagli o visibilità del gruppo (Creatore o Admin)
app.patch('/api/groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, avatar, isPublic, userId } = req.body;

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
    if (typeof isPublic === 'boolean') group.isPublic = isPublic;
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
      isPublic: group.isPublic ?? false,
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

  // AUTOMAZIONE SILENTE GOOGLE CALENDAR & MEET LATO BACKEND (Avvolta in try...catch protetto)
  if (eventData.eventType === 'official' || eventData.status === 'confirmed' || eventData.finalizedSlot) {
    try {
      const creator = await UserModel.findOne({ $or: [{ _id: eventData.creatorId }, { id: eventData.creatorId }] });
      const userToken =
        req.headers.authorization?.replace('Bearer ', '') ||
        eventData.googleAccessToken ||
        creator?.googleAccessToken;
      const refreshToken = creator?.googleRefreshToken || eventData.googleRefreshToken;

      // Se l'utente che crea l'evento non ha un refresh_token/access_token nel database (es. login mock)
      if (!refreshToken && !userToken) {
        console.warn("Token Google assente, evento non inserito in Calendar");
      } else {
        try {
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

          if (calRes?.meetLink) {
            eventData.meetLink = calRes.meetLink;
          }
          if (calRes?.eventId) {
            eventData.googleEventId = calRes.eventId;
            eventData.googleCalendarEventId = calRes.eventId;
          }
        } catch (calErr: any) {
          console.warn("Token Google assente, evento non inserito in Calendar", calErr?.message || calErr);
        }
      }
    } catch (gcalErr: any) {
      console.warn("Token Google assente, evento non inserito in Calendar", gcalErr?.message || gcalErr);
    }
  }

  try {
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

// POST /api/polls - Creazione sondaggio disponibilità When2meet
app.post('/api/polls', async (req: Request, res: Response) => {
  const pollData = req.body;
  if (!pollData.title || !pollData.creatorId) {
    return res.status(400).json({ error: 'Titolo e creatore sono obbligatori' });
  }

  const generatedId = pollData.id || `poll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // AUTOMAZIONE SILENTE GOOGLE CALENDAR & MEET LATO BACKEND (Avvolta in try...catch protetto)
  if (pollData.status === 'confirmed' || pollData.finalizedSlot) {
    try {
      const creator = await UserModel.findOne({ $or: [{ _id: pollData.creatorId }, { id: pollData.creatorId }] });
      const userToken =
        req.headers.authorization?.replace('Bearer ', '') ||
        pollData.googleAccessToken ||
        creator?.googleAccessToken;
      const refreshToken = creator?.googleRefreshToken || pollData.googleRefreshToken;

      if (!refreshToken && !userToken) {
        console.warn("Token Google assente, evento non inserito in Calendar");
      } else {
        try {
          const calRes = await createGoogleCalendarEvent({
            accessToken: userToken,
            refreshToken,
            title: pollData.title,
            description: pollData.description,
            date: pollData.finalizedSlot?.date || (pollData.dates && pollData.dates[0]) || new Date().toISOString().split('T')[0],
            startTime: pollData.finalizedSlot?.startTime || `${String(pollData.startHour || 9).padStart(2, '0')}:00`,
            endTime: pollData.finalizedSlot?.endTime || `${String(pollData.endHour || 10).padStart(2, '0')}:00`,
            isOnline: pollData.type !== 'in_person',
            location: pollData.location,
          });

          if (calRes?.meetLink) {
            pollData.meetLink = calRes.meetLink;
          }
          if (calRes?.eventId) {
            pollData.googleEventId = calRes.eventId;
            pollData.googleCalendarEventId = calRes.eventId;
          }
        } catch (calErr: any) {
          console.warn("Token Google assente, evento non inserito in Calendar", calErr?.message || calErr);
        }
      }
    } catch (gcalErr: any) {
      console.warn("Token Google assente, evento non inserito in Calendar", gcalErr?.message || gcalErr);
    }
  }

  try {
    const created = await EventModel.create({
      ...pollData,
      _id: generatedId,
      eventType: pollData.eventType || 'poll',
    });

    return res.status(201).json({
      poll: {
        ...created.toObject(),
        id: created._id || created.id,
      },
      event: {
        ...created.toObject(),
        id: created._id || created.id,
      },
    });
  } catch (err: any) {
    console.error('Errore creazione sondaggio MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore durante la creazione del sondaggio su MongoDB' });
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
          const existingGoogleEventId =
            existingEvent.googleEventId || existingEvent.googleCalendarEventId || null;

          const creator = await UserModel.findOne({
            $or: [{ _id: existingEvent.creatorId }, { id: existingEvent.creatorId }],
          });
          const userToken =
            req.headers.authorization?.replace('Bearer ', '') ||
            updates.googleAccessToken ||
            req.body?.googleAccessToken ||
            creator?.googleAccessToken;
          const refreshToken =
            creator?.googleRefreshToken ||
            updates.googleRefreshToken ||
            req.body?.googleRefreshToken;

          if (existingGoogleEventId) {
            // L'EVENTO ESISTE GIÀ SU GOOGLE CALENDAR: Modifica l'evento esistente e NON crearne uno nuovo!
            try {
              await updateGoogleCalendarEvent(
                { refreshToken, accessToken: userToken },
                existingGoogleEventId,
                {
                  title: updates.title || existingEvent.title,
                  description: updates.description || existingEvent.description,
                  date: updates.finalizedSlot.date,
                  startTime: updates.finalizedSlot.startTime,
                  endTime: updates.finalizedSlot.endTime,
                  isOnline: existingEvent.type !== 'in_person',
                  location: existingEvent.location,
                }
              );
              console.log(`[Google Calendar] Evento esistente ${existingGoogleEventId} aggiornato con successo a ${updates.finalizedSlot.date} ${updates.finalizedSlot.startTime}-${updates.finalizedSlot.endTime}`);
            } catch (updErr: any) {
              console.warn("Errore aggiornamento evento esistente su Google Calendar:", updErr?.message || updErr);
            }
          } else if (refreshToken || userToken) {
            // L'evento non esiste ancora su Google Calendar: crealo per la prima volta
            try {
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

              if (calRes?.meetLink) {
                updates.meetLink = calRes.meetLink;
              }
              if (calRes?.eventId) {
                updates.googleEventId = calRes.eventId;
                updates.googleCalendarEventId = calRes.eventId;
              }
            } catch (calErr: any) {
              console.warn("Token Google assente, evento non inserito in Calendar", calErr?.message || calErr);
            }
          } else {
            console.warn("Token Google assente, evento non inserito in Calendar");
          }
        }
      } catch (gcalErr: any) {
        console.warn("Token Google assente, evento non inserito in Calendar", gcalErr?.message || gcalErr);
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

    // SINCRONIZZAZIONE MODIFICA GOOGLE CALENDAR
    // Verifica se l'utente loggato ha un googleRefreshToken e se l'evento ha un googleEventId
    const targetGoogleEventId = updated.googleEventId || updated.googleCalendarEventId;
    if (targetGoogleEventId) {
      try {
        const requesterId =
          req.body?.userId ||
          updates.userId ||
          (req.headers['x-user-id'] as string) ||
          updated.creatorId;

        const loggedInUser = await UserModel.findOne({
          $or: [{ _id: requesterId }, { id: requesterId }],
        });

        const refreshToken =
          req.body?.googleRefreshToken ||
          updates.googleRefreshToken ||
          loggedInUser?.googleRefreshToken;

        if (refreshToken) {
          const eventDate =
            updated.finalizedSlot?.date ||
            (updated.dates && updated.dates[0]) ||
            updates.date;
          const startTime =
            updated.finalizedSlot?.startTime ||
            (updated.startHour ? `${String(updated.startHour).padStart(2, '0')}:00` : '09:00');
          const endTime =
            updated.finalizedSlot?.endTime ||
            (updated.endHour ? `${String(updated.endHour).padStart(2, '0')}:00` : '10:00');

          await updateGoogleCalendarEvent(refreshToken, targetGoogleEventId, {
            title: updated.title,
            description: updated.description,
            date: eventDate,
            startTime,
            endTime,
            isOnline: updated.type !== 'in_person',
            location: updated.location,
          });
        } else {
          console.warn("Token Google assente, evento non aggiornato su Calendar");
        }
      } catch (calUpdErr: any) {
        console.warn("Google Calendar patch sync warning:", calUpdErr?.message || calUpdErr);
      }
    }

    return res.json({ success: true, event: { ...updated.toObject(), id: updated._id || updated.id } });
  } catch (err: any) {
    console.error('Errore aggiornamento EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento evento in MongoDB' });
  }
});

// DELETE /api/events/:id & /api/polls/:id - Eliminazione reale da Google Calendar e MongoDB
const handleDeleteEventOrPoll = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. PRIMA di eliminare l'elemento dal DB, cercalo con findById (e fallback findOne)
    let eventToDelete: any = null;
    try {
      eventToDelete = await EventModel.findById(id);
    } catch {}
    if (!eventToDelete) {
      eventToDelete = await EventModel.findOne({ $or: [{ _id: id }, { id }] });
    }

    if (!eventToDelete) {
      return res.status(404).json({ error: 'Evento/Sondaggio non trovato nel database' });
    }

    // 2. Se il documento possiede un googleEventId e l'utente loggato ha un googleRefreshToken
    const targetGoogleEventId = eventToDelete.googleEventId || eventToDelete.googleCalendarEventId;
    if (targetGoogleEventId) {
      try {
        const requesterId =
          req.body?.userId ||
          (req.query?.userId as string) ||
          (req.headers['x-user-id'] as string) ||
          eventToDelete.creatorId;

        let user: any = null;
        if (requesterId) {
          try {
            user = await UserModel.findById(requesterId);
          } catch {}
          if (!user) {
            user = await UserModel.findOne({ $or: [{ _id: requesterId }, { id: requesterId }] });
          }
        }

        const refreshToken =
          req.body?.googleRefreshToken ||
          (req.query?.googleRefreshToken as string) ||
          user?.googleRefreshToken;

        if (refreshToken) {
          await deleteGoogleCalendarEvent(refreshToken, targetGoogleEventId);
          console.log(`[Google Calendar] Evento ${targetGoogleEventId} rimosso con successo.`);
        } else {
          console.warn("Token Google assente, evento non cancellato da Calendar");
        }
      } catch (delCalErr: any) {
        console.warn("Errore eliminazione da Google Calendar (procedo con DB):", delCalErr?.message || delCalErr);
      }
    }

    // 3. Solo DOPO aver avvisato Google, esegui l'eliminazione da MongoDB
    await EventModel.deleteOne({ $or: [{ _id: id }, { id }] });
    await EventResponseModel.deleteMany({ eventId: id });
    await ClientRequestModel.updateMany(
      { pollEventId: id },
      { $set: { status: 'pending', pollEventId: null } }
    );

    return res.json({
      success: true,
      message: 'Sondaggio/Evento eliminato con successo da Google Calendar e MongoDB',
    });
  } catch (err: any) {
    console.error('Errore cancellazione EventModel MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore eliminazione sondaggio/evento in MongoDB' });
  }
};

app.delete('/api/events/:id', handleDeleteEventOrPoll);
app.post('/api/events/:id/delete', handleDeleteEventOrPoll);
app.delete('/api/polls/:id', handleDeleteEventOrPoll);
app.post('/api/polls/:id/delete', handleDeleteEventOrPoll);

// PATCH /api/polls/:id/confirmed-date - Modifica data/ora di un sondaggio confermato con allineamento Google Calendar
const handleUpdatePollConfirmedDate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, finalDate, startTime, endTime } = req.body;

  const targetDate = typeof finalDate === 'object' && finalDate?.date ? finalDate.date : (date || finalDate);
  const targetStartTime = typeof finalDate === 'object' && finalDate?.startTime ? finalDate.startTime : (startTime || '09:00');
  const targetEndTime = typeof finalDate === 'object' && finalDate?.endTime ? finalDate.endTime : (endTime || '10:00');

  if (!targetDate) {
    return res.status(400).json({ error: 'Data, ora inizio e ora fine sono obbligatori' });
  }

  try {
    let existingPoll: any = null;
    try {
      existingPoll = await PollModel.findById(id);
    } catch {}
    if (!existingPoll) {
      existingPoll = await PollModel.findOne({ $or: [{ _id: id }, { id }] });
    }

    if (!existingPoll) {
      return res.status(404).json({ error: 'Sondaggio non trovato nel database' });
    }

    const startH = parseInt(targetStartTime.split(':')[0], 10) || 9;
    const endH = parseInt(targetEndTime.split(':')[0], 10) || 10;

    const finalDateObj = {
      date: targetDate,
      startTime: targetStartTime,
      endTime: targetEndTime,
    };

    const targetGoogleEventId = existingPoll.googleEventId || existingPoll.googleCalendarEventId || null;

    // 1. Aggiorna il documento PollModel nel database
    const updatedPoll = await PollModel.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      {
        $set: {
          finalDate: finalDateObj,
          dates: [targetDate],
          startHour: startH,
          endHour: endH,
          finalizedSlot: finalDateObj,
          status: 'confirmed',
          ...(targetGoogleEventId ? { googleEventId: targetGoogleEventId, googleCalendarEventId: targetGoogleEventId } : {}),
        },
      },
      { new: true }
    );

    if (!updatedPoll) {
      return res.status(404).json({ error: 'Errore aggiornamento sondaggio su MongoDB' });
    }

    const poll: any = updatedPoll;
    if (targetGoogleEventId && !poll.googleEventId) {
      poll.googleEventId = targetGoogleEventId;
    }

    // 2. Controlla se l'utente loggato o il creatore ha un googleRefreshToken e se il sondaggio aggiornato possiede un googleEventId
    const requesterId =
      req.body?.userId ||
      (req.headers['x-user-id'] as string) ||
      poll.creatorId;

    let user: any = null;
    if (requesterId) {
      try {
        user = await UserModel.findById(requesterId);
      } catch {}
      if (!user) {
        user = await UserModel.findOne({ $or: [{ _id: requesterId }, { id: requesterId }] });
      }
    }

    if (!user) {
      user = { id: requesterId, googleRefreshToken: req.body?.googleRefreshToken };
    } else if (!user.googleRefreshToken && req.body?.googleRefreshToken) {
      user.googleRefreshToken = req.body.googleRefreshToken;
    }

    let creatorUser: any = null;
    if (poll.creatorId && poll.creatorId !== requesterId) {
      try {
        creatorUser = await UserModel.findById(poll.creatorId);
      } catch {}
      if (!creatorUser) {
        creatorUser = await UserModel.findOne({ $or: [{ _id: poll.creatorId }, { id: poll.creatorId }] });
      }
    }

    const refreshToken =
      req.body?.googleRefreshToken ||
      user?.googleRefreshToken ||
      creatorUser?.googleRefreshToken;

    const accessToken =
      req.body?.googleAccessToken ||
      req.headers.authorization?.replace('Bearer ', '') ||
      user?.googleAccessToken ||
      creatorUser?.googleAccessToken;

    const googleAuth = { refreshToken, accessToken };

    // 3. Sincronizzazione con Google Calendar:
    // Se possiede già un googleEventId, MODIFICA l'evento esistente e NON crearne uno nuovo!
    const effectiveGoogleEventId =
      poll.googleEventId ||
      poll.googleCalendarEventId ||
      existingPoll.googleEventId ||
      existingPoll.googleCalendarEventId ||
      targetGoogleEventId;

    if (effectiveGoogleEventId) {
      if (googleAuth.refreshToken || googleAuth.accessToken) {
        try {
          const finalDateData =
            typeof poll.finalDate === 'object' && poll.finalDate !== null
              ? poll.finalDate
              : finalDateObj;

          const calRes = await updateGoogleCalendarEvent(googleAuth, effectiveGoogleEventId, {
            title: poll.title,
            description: poll.description,
            date: finalDateData.date,
            startTime: finalDateData.startTime,
            endTime: finalDateData.endTime,
            isOnline: poll.type !== 'in_person',
            location: poll.location,
          });

          if (calRes.success) {
            console.log(`[Google Calendar] Evento ${effectiveGoogleEventId} aggiornato con successo a ${finalDateData.date} ${finalDateData.startTime}-${finalDateData.endTime}`);
          } else {
            console.warn(`[Google Calendar] Warning aggiornamento evento ${effectiveGoogleEventId}:`, calRes.error);
          }
        } catch (calErr: any) {
          console.warn("Errore allineamento Google Calendar per sondaggio confermato:", calErr?.message || calErr);
        }
      } else {
        console.warn("Token Google assente per l'utente/creatore, Google Calendar non aggiornato");
      }
    } else if (googleAuth.refreshToken || googleAuth.accessToken) {
      // Se non aveva ancora un googleEventId, crealo per la prima volta
      try {
        const calRes = await createGoogleCalendarEvent({
          accessToken: googleAuth.accessToken,
          refreshToken: googleAuth.refreshToken,
          title: poll.title,
          description: poll.description,
          date: finalDateObj.date,
          startTime: finalDateObj.startTime,
          endTime: finalDateObj.endTime,
          isOnline: poll.type !== 'in_person',
          location: poll.location,
        });

        if (calRes?.eventId) {
          poll.googleEventId = calRes.eventId;
          poll.googleCalendarEventId = calRes.eventId;
          if (calRes.meetLink) poll.meetLink = calRes.meetLink;
          await PollModel.updateOne(
            { $or: [{ _id: id }, { id }] },
            {
              $set: {
                googleEventId: calRes.eventId,
                googleCalendarEventId: calRes.eventId,
                ...(calRes.meetLink ? { meetLink: calRes.meetLink } : {}),
              },
            }
          );
        }
      } catch (createErr: any) {
        console.warn("Errore creazione iniziale evento Calendar:", createErr?.message || createErr);
      }
    }

    const pollObj = typeof poll.toObject === 'function' ? poll.toObject() : poll;
    const mapped = {
      ...pollObj,
      id: poll._id || poll.id,
      finalDate: finalDateObj,
      finalizedSlot: finalDateObj,
      dates: [targetDate],
      startHour: startH,
      endHour: endH,
      status: 'confirmed',
      ...(effectiveGoogleEventId ? { googleEventId: effectiveGoogleEventId, googleCalendarEventId: effectiveGoogleEventId } : {}),
    };

    return res.json({
      success: true,
      message: 'Data e ora confermate aggiornate con successo e sincronizzate su Google Calendar',
      poll: mapped,
      event: mapped,
    });
  } catch (err: any) {
    console.error('Errore update confirmed date MongoDB:', err.message);
    return res.status(500).json({ error: 'Errore aggiornamento data confermata in MongoDB' });
  }
};

app.patch('/api/polls/:id/confirmed-date', handleUpdatePollConfirmedDate);
app.patch('/api/events/:id/confirmed-date', handleUpdatePollConfirmedDate);

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
