/**
 * JESic Meet - Servizio Notifiche Push Reali (Web Push Protocol)
 * 
 * - Gestione VAPID Keys persistite su MongoDB (garantite contro restart di Render)
 * - Inoltro notifiche push reali in background (anche a sito chiuso o su smartphone)
 * - Pulizia automatica dei dispositivi scaduti o rimossi (404 / 410 Gone)
 * - Gestione delle 3 situazioni richieste:
 *   1. Nuovo messaggio in chat di gruppo/sottogruppo (stile WhatsApp)
 *   2. Nuovo sondaggio di disponibilità creato
 *   3. Evento confermato o creato nel calendario a cui si partecipa
 *   + Notifica di test immediata
 */

import webpush from 'web-push';
import {
  PushSubscriptionModel,
  VapidKeyModel,
  GroupModel,
  UserModel,
} from '../models/schemas';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url: string;
    [key: string]: any;
  };
  tag?: string;
}

let isVapidInitialized = false;
let currentVapidPublicKey = '';

/**
 * Inizializza le chiavi VAPID da process.env o da MongoDB Atlas.
 * Se non esistono, le genera e le memorizza in MongoDB così da non perderle mai.
 */
export async function initializeVapid(): Promise<string> {
  if (isVapidInitialized && currentVapidPublicKey) {
    return currentVapidPublicKey;
  }

  const subject = process.env.VAPID_SUBJECT || 'mailto:notifiche@jesic.it';
  let publicKey = process.env.VAPID_PUBLIC_KEY || '';
  let privateKey = process.env.VAPID_PRIVATE_KEY || '';

  // Se non presenti in process.env, cerca in MongoDB
  if (!publicKey || !privateKey) {
    try {
      const existingKey = await VapidKeyModel.findOne();
      if (existingKey && existingKey.publicKey && existingKey.privateKey) {
        publicKey = existingKey.publicKey;
        privateKey = existingKey.privateKey;
      } else {
        // Genera nuova coppia VAPID e salvala in MongoDB
        const generated = webpush.generateVAPIDKeys();
        publicKey = generated.publicKey;
        privateKey = generated.privateKey;

        await VapidKeyModel.create({
          _id: 'vapid-primary-keys',
          publicKey,
          privateKey,
          subject,
        });
        console.log('[Push] Nuove chiavi VAPID generate e salvate in MongoDB');
      }
    } catch (dbErr: any) {
      console.warn('[Push] Impossibile accedere a VapidKeyModel in MongoDB, genero chiavi effimere:', dbErr.message);
      const generated = webpush.generateVAPIDKeys();
      publicKey = generated.publicKey;
      privateKey = generated.privateKey;
    }
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  isVapidInitialized = true;
  currentVapidPublicKey = publicKey;

  return currentVapidPublicKey;
}

/**
 * Restituisce la chiave pubblica VAPID per il client frontend
 */
export async function getVapidPublicKey(): Promise<string> {
  return await initializeVapid();
}

/**
 * Invia una notifica push a uno o più utenti, gestendo la pulizia automatica
 * delle sottoscrizioni non più valide (es. 410 Gone / 404 Not Found).
 */
export async function sendPushNotification(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; cleaned: number }> {
  await initializeVapid();

  if (!userIds || userIds.length === 0) {
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const subscriptions = await PushSubscriptionModel.find({
    userId: { $in: userIds },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    data: payload.data || { url: '/' },
    tag: payload.tag || `jesic-${Date.now()}`,
  });

  let sent = 0;
  let failed = 0;
  let cleaned = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payloadString);
        sent++;
      } catch (err: any) {
        failed++;
        // Se il browser segnala 410 Gone o 404 Not Found, la sottoscrizione è scaduta o revocata
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await PushSubscriptionModel.deleteOne({ endpoint: sub.endpoint });
            cleaned++;
            console.log(`[Push] Rimossa sottoscrizione non più valida (${err.statusCode}):`, sub.endpoint);
          } catch (delErr: any) {
            console.warn('[Push] Errore pulizia sottoscrizione:', delErr.message);
          }
        } else {
          console.warn('[Push] Errore invio notifica a endpoint:', err.statusCode, err.message);
        }
      }
    })
  );

  return { sent, failed, cleaned };
}

/**
 * SITUAZIONE 1: Notifica per nuovo messaggio in Chat (Gruppo o Sottogruppo)
 * In stile WhatsApp:
 * - Titolo: [Nome Gruppo] Nome Autore
 * - Testo: Messaggio o anteprima tipo allegato
 * - Cliccando: apre direttamente la chat corretta
 */
export async function sendChatPushNotification(params: {
  groupId: string;
  subgroupId?: string | null;
  authorId: string;
  authorName: string;
  authorSurname?: string;
  content?: string;
  attachment?: {
    type: 'image' | 'audio' | 'file';
    name?: string;
  };
}) {
  try {
    const group = await GroupModel.findOne({
      $or: [{ _id: params.groupId }, { id: params.groupId }],
    });
    if (!group) return;

    // Recupera i membri del gruppo, escludendo l'autore del messaggio
    const memberIds = (group.members || [])
      .map((m: any) => m.userId)
      .filter((uid: string) => uid && uid !== params.authorId);

    if (memberIds.length === 0) return;

    // Se è un sottogruppo, recupera il nome del sottogruppo
    let contextTitle = group.name;
    if (params.subgroupId) {
      const sub = (group.subgroups || []).find(
        (s: any) => s.id === params.subgroupId || s._id === params.subgroupId
      );
      if (sub) {
        contextTitle = `${group.name} • ${sub.name}`;
      }
    }

    const senderFullName = [params.authorName, params.authorSurname].filter(Boolean).join(' ');
    const title = `${contextTitle} - ${senderFullName}`;

    let bodyText = params.content || '';
    if (params.attachment) {
      if (params.attachment.type === 'image') {
        bodyText = params.content ? `📷 ${params.content}` : '📷 Ha inviato una foto';
      } else if (params.attachment.type === 'audio') {
        bodyText = '🎤 Ha inviato una nota vocale';
      } else {
        bodyText = `📎 ${params.attachment.name || 'Ha inviato un allegato'}`;
      }
    }

    const subParam = params.subgroupId ? `&subgroupId=${encodeURIComponent(params.subgroupId)}` : '';
    const targetUrl = `/?tab=chat&groupId=${encodeURIComponent(params.groupId)}${subParam}`;

    await sendPushNotification(memberIds, {
      title,
      body: bodyText,
      icon: group.avatar ? '/logo.png' : '/logo.png',
      badge: '/logo.png',
      tag: `chat-${params.groupId}-${params.subgroupId || 'general'}`,
      data: {
        url: targetUrl,
        groupId: params.groupId,
        subgroupId: params.subgroupId,
        type: 'chat',
      },
    });
  } catch (err: any) {
    console.error('[Push] Errore invio notifica chat:', err.message);
  }
}

/**
 * SITUAZIONE 2: Notifica per nuovo Sondaggio di disponibilità creato
 */
export async function sendPollPushNotification(params: {
  pollId: string;
  title: string;
  creatorId: string;
  creatorName?: string;
  groupId?: string | null;
  subgroupId?: string | null;
  inviteeUserIds?: string[];
}) {
  try {
    let recipientIds: string[] = [];

    if (params.groupId) {
      const group = await GroupModel.findOne({
        $or: [{ _id: params.groupId }, { id: params.groupId }],
      });
      if (group) {
        recipientIds = (group.members || [])
          .map((m: any) => m.userId)
          .filter((uid: string) => uid && uid !== params.creatorId);
      }
    } else if (params.inviteeUserIds && params.inviteeUserIds.length > 0) {
      recipientIds = params.inviteeUserIds.filter((uid) => uid !== params.creatorId);
    }

    if (recipientIds.length === 0) return;

    const creatorLabel = params.creatorName || 'Un membro del team';
    const title = `📊 Nuovo Sondaggio: ${params.title}`;
    const body = `${creatorLabel} ha aperto un nuovo sondaggio When2meet. Entra e vota subito le tue disponibilità!`;
    const targetUrl = `/?tab=polls&eventId=${encodeURIComponent(params.pollId)}${params.groupId ? `&groupId=${encodeURIComponent(params.groupId)}` : ''}`;

    await sendPushNotification(recipientIds, {
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `poll-${params.pollId}`,
      data: {
        url: targetUrl,
        eventId: params.pollId,
        type: 'poll',
      },
    });
  } catch (err: any) {
    console.error('[Push] Errore invio notifica sondaggio:', err.message);
  }
}

/**
 * SITUAZIONE 3: Notifica per Evento Confermato o Creato nel Calendario
 */
export async function sendEventConfirmedPushNotification(params: {
  eventId: string;
  title: string;
  creatorId?: string;
  date: string;
  startTime: string;
  endTime: string;
  type?: 'online' | 'in_person';
  location?: string;
  groupId?: string | null;
  participantUserIds?: string[];
  isOfficial?: boolean;
}) {
  try {
    let recipientIds: string[] = params.participantUserIds || [];

    if (params.groupId && recipientIds.length === 0) {
      const group = await GroupModel.findOne({
        $or: [{ _id: params.groupId }, { id: params.groupId }],
      });
      if (group) {
        recipientIds = (group.members || [])
          .map((m: any) => m.userId)
          .filter(Boolean);
      }
    }

    // Rimuovi duplicati
    recipientIds = Array.from(new Set(recipientIds));
    if (recipientIds.length === 0) return;

    const title = params.isOfficial
      ? `🏛️ Nuovo Evento Ufficiale: ${params.title}`
      : `✅ Meeting Confermato: ${params.title}`;

    const locationInfo = params.type === 'in_person' ? (params.location ? ` • ${params.location}` : ' • In presenza') : ' • Google Meet';
    const body = `Data: ${params.date} ore ${params.startTime} - ${params.endTime}${locationInfo}. Aggiunto al tuo calendario!`;
    const targetUrl = `/?tab=calendar&eventId=${encodeURIComponent(params.eventId)}${params.groupId ? `&groupId=${encodeURIComponent(params.groupId)}` : ''}`;

    await sendPushNotification(recipientIds, {
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `event-${params.eventId}`,
      data: {
        url: targetUrl,
        eventId: params.eventId,
        type: 'event',
      },
    });
  } catch (err: any) {
    console.error('[Push] Errore invio notifica evento confermato:', err.message);
  }
}

/**
 * Notifica di prova per verificare istantaneamente il funzionamento sul dispositivo dell'utente
 */
export async function sendTestPushNotification(userId: string) {
  const title = '🔔 JESic Meet - Notifica di Prova';
  const body = 'Fantastico! Il sistema di notifiche push reali in stile WhatsApp è attivo e perfettamente configurato su questo dispositivo.';

  return await sendPushNotification([userId], {
    title,
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `test-${Date.now()}`,
    data: {
      url: '/?tab=profile',
      type: 'test',
    },
  });
}
