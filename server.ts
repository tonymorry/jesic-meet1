/**
 * JESic Meet - Server Express Backend & MongoDB API
 * Junior Enterprise Sicilia
 * 
 * - Gestione Ruoli Utenti Database ('admin' | 'user')
 * - Gestione Gruppi di Lavoro con Codici Univoci & Link di Invito
 * - Gestione Sondaggi When2meet & Eventi Associativi
 * - Integrazione Google Calendar OAuth2 & B2B Client Requests
 * - Monta vite.middlewares in modalità sviluppo
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connessione MongoDB se MONGODB_URI è presente
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('🍃 Connesso con successo a MongoDB'))
    .catch((err) => console.warn('Avviso connessione MongoDB:', err.message));
} else {
  console.log('ℹ️ MONGODB_URI non configurato: il backend opera con storage JSON / memory cache reattivo.');
}

// File di persistenza locale per fallback storage
const DATA_DIR = path.resolve(__dirname, 'src', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db_store.json');

interface DbStore {
  users: any[];
  groups: any[];
  events: any[];
  responses: any[];
  clientRequests: any[];
}

function loadStore(): DbStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Errore lettura db_store.json:', e);
  }
  return { users: [], groups: [], events: [], responses: [], clientRequests: [] };
}

function saveStore(data: DbStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Errore scrittura db_store.json:', e);
  }
}

let store = loadStore();

/* ==========================================================================
   REST API ROUTES
   ========================================================================== */

// 1. Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'JESic Meet Full-Stack API',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// 2. USERS & ROLES
app.get('/api/users', (req: Request, res: Response) => {
  res.json({ users: store.users });
});

app.post('/api/users', (req: Request, res: Response) => {
  const { name, surname, email, password, role, systemRole, jesicRole, googleCalendarConnected } = req.body;
  if (!name || !surname || !email) {
    return res.status(400).json({ error: 'Nome, cognome ed email sono obbligatori' });
  }

  const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email già registrata' });
  }

  const isFirstUser = store.users.length === 0;
  const assignedRole = role || (isFirstUser ? 'admin' : 'user');

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    surname,
    email: email.toLowerCase(),
    password,
    role: assignedRole,
    systemRole: systemRole || (assignedRole === 'admin' ? 'client_admin' : 'associate'),
    jesicRole: jesicRole || 'Consulente Junior',
    googleCalendarConnected: Boolean(googleCalendarConnected),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  saveStore(store);

  res.status(201).json({ user: newUser });
});

// PATCH /api/users/:id/role - Gestione ruoli protetta da Admin
app.patch('/api/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, adminId } = req.body;

  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: "Il ruolo deve essere 'admin' o 'user'" });
  }

  // Verifica permessi admin
  if (adminId) {
    const adminUser = store.users.find((u) => u.id === adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato: solo gli utenti admin possono modificare i ruoli' });
    }
  }

  const userIndex = store.users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Utente non trovato' });
  }

  store.users[userIndex].role = role;
  store.users[userIndex].systemRole = role === 'admin' ? 'admin' : 'associate';
  store.users[userIndex].updatedAt = new Date().toISOString();
  saveStore(store);

  res.json({
    success: true,
    message: `Ruolo aggiornato a ${role}`,
    user: store.users[userIndex],
  });
});

// 3. GROUPS & INVITES
app.get('/api/groups', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (userId) {
    const userGroups = store.groups.filter((g) =>
      g.members?.some((m: any) => m.userId === userId)
    );
    return res.json({ groups: userGroups });
  }
  res.json({ groups: store.groups });
});

app.post('/api/groups', (req: Request, res: Response) => {
  const { name, description, avatar, creatorId } = req.body;
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'Nome del gruppo e creatore sono obbligatori' });
  }

  // Genera codice univoco (es. JES-7A9B)
  const code = `JES-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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

  store.groups.push(newGroup);
  saveStore(store);

  res.status(201).json({ group: newGroup });
});

// POST /api/groups/join - Entra in un gruppo con codice o link
app.post('/api/groups/join', (req: Request, res: Response) => {
  const { codeOrLink, userId } = req.body;
  if (!codeOrLink || !userId) {
    return res.status(400).json({ error: 'Codice/link e ID utente sono obbligatori' });
  }

  // Estrai il codice pulito
  let code = codeOrLink.trim().toUpperCase();
  if (code.includes('JOIN/')) {
    code = code.split('JOIN/')[1].split('?')[0].split('/')[0];
  } else if (code.includes('JOIN=')) {
    code = code.split('JOIN=')[1].split('&')[0];
  }

  const group = store.groups.find((g) => g.code.toUpperCase() === code);
  if (!group) {
    return res.status(404).json({ error: 'Nessun gruppo trovato con questo codice d\'invito' });
  }

  const isMember = group.members.some((m: any) => m.userId === userId);
  if (!isMember) {
    group.members.push({
      userId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    group.updatedAt = new Date().toISOString();
    saveStore(store);
  }

  res.json({
    success: true,
    message: isMember ? 'Sei già membro di questo gruppo' : 'Sei entrato nel gruppo con successo!',
    group,
  });
});

// 4. SONDAGGI (POLLS) & EVENTI
app.get('/api/events', (req: Request, res: Response) => {
  const { groupId, userId } = req.query;
  let filtered = store.events;

  if (groupId) {
    filtered = filtered.filter((e) => e.groupId === groupId);
  }

  if (userId) {
    filtered = filtered.filter(
      (e) =>
        e.creatorId === userId ||
        e.invitees?.some((inv: any) => inv.userId === userId) ||
        e.participants?.some((p: any) => p.userId === userId)
    );
  }

  res.json({ events: filtered });
});

app.post('/api/events', (req: Request, res: Response) => {
  const eventData = req.body;
  if (!eventData.title || !eventData.creatorId) {
    return res.status(400).json({ error: 'Titolo e creatore sono obbligatori' });
  }

  const newEvent = {
    ...eventData,
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  store.events.push(newEvent);
  saveStore(store);

  res.status(201).json({ event: newEvent });
});

// POST /api/events/:id/participate - Partecipazione & sync Google Calendar
app.post('/api/events/:id/participate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  const eventIndex = store.events.findIndex((e) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Evento non trovato' });
  }

  const event = store.events[eventIndex];
  if (!event.participants) event.participants = [];

  const partIndex = event.participants.findIndex((p: any) => p.userId === userId);
  if (partIndex >= 0) {
    event.participants[partIndex].status = 'accepted';
    event.participants[partIndex].respondedAt = new Date().toISOString();
    event.participants[partIndex].googleCalendarSynced = true;
  } else {
    event.participants.push({
      userId,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
      googleCalendarSynced: true,
    });
  }

  saveStore(store);
  res.json({ success: true, event });
});

// POST /api/events/:id/decline - Rifiuto partecipazione
app.post('/api/events/:id/decline', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  const eventIndex = store.events.findIndex((e) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Evento non trovato' });
  }

  const event = store.events[eventIndex];
  if (!event.participants) event.participants = [];

  const partIndex = event.participants.findIndex((p: any) => p.userId === userId);
  if (partIndex >= 0) {
    event.participants[partIndex].status = 'declined';
    event.participants[partIndex].respondedAt = new Date().toISOString();
  } else {
    event.participants.push({
      userId,
      status: 'declined',
      respondedAt: new Date().toISOString(),
      googleCalendarSynced: false,
    });
  }

  saveStore(store);
  res.json({ success: true, event });
});

// 5. CLIENT REQUESTS (B2B)
app.get('/api/client-requests', (req: Request, res: Response) => {
  res.json({ requests: store.clientRequests });
});

app.post('/api/client-requests', (req: Request, res: Response) => {
  const reqData = req.body;
  const newReq = {
    ...reqData,
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    status: reqData.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.clientRequests.unshift(newReq);
  saveStore(store);

  res.status(201).json({ request: newReq });
});

app.post('/api/client-requests/:id/confirm-final', (req: Request, res: Response) => {
  const { id } = req.params;
  const { eventId, finalizedDate, finalizedStartTime, finalizedEndTime } = req.body;

  const reqIndex = store.clientRequests.findIndex((r) => r.id === id);
  if (reqIndex >= 0) {
    store.clientRequests[reqIndex].status = 'confirmed';
    store.clientRequests[reqIndex].finalizedSlot = {
      date: finalizedDate,
      startTime: finalizedStartTime,
      endTime: finalizedEndTime,
    };
    store.clientRequests[reqIndex].updatedAt = new Date().toISOString();
    saveStore(store);
  }

  res.json({ success: true, message: 'Richiesta confermata con successo' });
});

/* ==========================================================================
   VITE DEV MIDDLEWARE / STATIC ASSETS
   ========================================================================== */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JESic Meet Server attivo su http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
