/**
 * JESic Meet - Real-time WebSocket Client & Hooks
 * Gestione WebSocket bidirezionale in tempo reale (Chat, Nuovi Membri, Presenza, Eventi, Ruoli)
 */

import { useEffect, useState, useRef } from 'react';

type EventCallback = (payload: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private isConnecting = false;
  public isConnected = false;
  public onlineUserIds: string[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect() {
    if (this.isConnecting || (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING))) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.isConnected = true;
        this.emitLocal('connection_status', { connected: true });

        // Identifica l'utente se già loggato
        if (this.currentUserId) {
          this.identify(this.currentUserId, this.currentUserName || undefined);
        }

        // Avvia heartbeat periodico
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'pong') return;

          if (data.event === 'presence:sync' && Array.isArray(data.payload?.onlineUserIds)) {
            this.onlineUserIds = data.payload.onlineUserIds;
            this.emitLocal('presence:sync', data.payload);
          }

          if (data.event) {
            this.emitLocal(data.event, data.payload);
          }
        } catch (err) {
          console.warn('[RealtimeClient] Errore parsing messaggio WS:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.isConnected = false;
        this.emitLocal('connection_status', { connected: false });
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        if (this.ws) {
          try {
            this.ws.close();
          } catch {}
        }
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2500);
  }

  public identify(userId: string, userName?: string) {
    this.currentUserId = userId;
    this.currentUserName = userName || null;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: 'identify',
          payload: { userId, userName },
        })
      );
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emitLocal(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[RealtimeClient] Errore nel listener per ${event}:`, err);
        }
      });
    }
  }

  public send(event: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    }
  }
}

export const realtimeClient = new RealtimeClient();

/**
 * Hook React per sottoscriversi a eventi WebSocket con cleanup automatico
 */
export function useRealtimeSubscription(event: string, callback: EventCallback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const handler = (payload: any) => {
      cbRef.current(payload);
    };
    const unsubscribe = realtimeClient.on(event, handler);
    return () => {
      unsubscribe();
    };
  }, [event]);
}

/**
 * Hook React per monitorare la lista degli utenti attualmente online in tempo reale
 */
export function useRealtimePresence() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>(realtimeClient.onlineUserIds);

  useEffect(() => {
    const handleSync = (payload: { onlineUserIds: string[] }) => {
      if (Array.isArray(payload?.onlineUserIds)) {
        setOnlineUsers(payload.onlineUserIds);
      }
    };
    const unsubscribe = realtimeClient.on('presence:sync', handleSync);
    return () => {
      unsubscribe();
    };
  }, []);

  return onlineUsers;
}
