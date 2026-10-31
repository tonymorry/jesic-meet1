/**
 * JESic Meet - GroupChatView (Chat avanzata in stile WhatsApp)
 * 
 * - Chat persistita in tempo reale su MongoDB per Gruppo Generale e Sottogruppi
 * - Invio messaggi di testo
 * - Invio Immagini (con anteprima e lightbox zoom)
 * - Invio Note Vocali / Audio (registratore vocale con microfono + timer live, riproduzione in bolla)
 * - Invio File / Documenti (con icona, nome, peso in KB/MB e download)
 * - Richiamo / Risposta ai messaggi (Quote / Reply stile WhatsApp con scroll al messaggio citato)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Group, Subgroup, User, ChatMessage, ChatAttachment, ChatReplyTo } from '../types';
import { UserAvatar } from './UserAvatar';
import { useRealtimeSubscription } from '../utils/realtime';
import {
  Send,
  MessageSquare,
  FolderOpen,
  Clock,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  X,
  CornerUpLeft,
  Download,
  FileText,
  Play,
  Pause,
  Volume2,
  CheckCheck,
  Maximize2,
  Edit2,
  Check,
  ArrowLeft,
  Copy,
} from 'lucide-react';

export interface GroupChatViewProps {
  activeGroup: Group;
  activeSubgroup: Subgroup | null;
  currentUser: User;
  allUsers?: User[];
  onBackToDashboard?: () => void;
}

export const GroupChatView: React.FC<GroupChatViewProps> = ({
  activeGroup,
  activeSubgroup,
  currentUser,
  allUsers = [],
  onBackToDashboard,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Modifica e Cancellazione Messaggio (Stile WhatsApp - Elimina per tutti)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  // Risposta / Richiamo a un messaggio (WhatsApp Quote)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Selezione Messaggio per Pressione Prolungata (Long Press stile WhatsApp su smartphone)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef(false);

  // Ruolo per moderazione
  const isGroupAdmin =
    activeGroup.creatorId === currentUser.id ||
    activeGroup.members?.some((m) => m.userId === currentUser.id && m.role === 'admin');

  // Allegato in preparazione
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);

  // Registrazione Audio / Nota Vocale
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Riproduzione Audio in-chat
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Anteprima Immagine a schermo intero (Lightbox)
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const subgroupId = activeSubgroup ? activeSubgroup.id : null;
  const contextName = activeSubgroup ? activeSubgroup.name : `${activeGroup.name} (Generale)`;

  // Calcolo percorso gerarchico per la chat (Gruppo ➔ Sottogruppo ➔ Sotto-sottogruppo...)
  const chatBreadcrumbs: string[] = [activeGroup.name];
  if (activeSubgroup) {
    const chain: string[] = [];
    let curr: any = activeSubgroup;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift(curr.name);
      if (curr.parentId) {
        curr = activeGroup.subgroups?.find((s) => s.id === curr!.parentId);
      } else {
        curr = undefined;
      }
    }
    chain.forEach((name) => chatBreadcrumbs.push(name));
  }

  // Caricamento messaggi da MongoDB
  const fetchMessages = async () => {
    try {
      const url = subgroupId
        ? `/api/groups/${activeGroup.id}/chat?subgroupId=${encodeURIComponent(subgroupId)}`
        : `/api/groups/${activeGroup.id}/chat`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn('Errore lettura chat MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset immediato al cambio di gruppo o sottogruppo: MAI mostrare messaggi di un'altra chat
  useEffect(() => {
    setMessages([]);
    setIsLoading(true);
    fetchMessages();
  }, [activeGroup.id, subgroupId]);

  // Ascolto real-time via WebSocket: Nuovi messaggi con isolamento rigoroso
  useRealtimeSubscription('chat:message_created', (payload) => {
    if (!payload || payload.groupId !== activeGroup.id) return;

    const currentSub = subgroupId ? String(subgroupId).trim() : null;
    const msgSub = payload.subgroupId && payload.subgroupId !== 'null' ? String(payload.subgroupId).trim() : null;

    // ISOLAMENTO ASSOLUTO: Se il messaggio non appartiene a questa specifica vista, scartalo!
    if (currentSub !== msgSub) return;

    if (payload.message) {
      setMessages((prev) => {
        // Evita duplicazione se già presente
        const alreadyInList = prev.some((m) => m.id === payload.message.id);
        if (alreadyInList) return prev;

        // Se l'autore ha un messaggio ottimistico temporaneo, rimpiazzalo con quello confermato da MongoDB
        const optIdx = prev.findIndex(
          (m) => m.id.startsWith('msg-opt-') && m.authorId === payload.message.authorId && m.content === payload.message.content
        );
        if (optIdx >= 0) {
          const next = [...prev];
          next[optIdx] = payload.message;
          return next;
        }

        return [...prev, payload.message];
      });
    }
  });

  // Ascolto real-time: Messaggio modificato
  useRealtimeSubscription('chat:message_updated', (payload) => {
    if (!payload || payload.groupId !== activeGroup.id) return;
    const currentSub = subgroupId ? String(subgroupId).trim() : null;
    const msgSub = payload.subgroupId && payload.subgroupId !== 'null' ? String(payload.subgroupId).trim() : null;

    if (currentSub !== msgSub) return;

    if (payload.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.message.id ? { ...m, ...payload.message } : m))
      );
    }
  });

  // Ascolto real-time: Messaggio cancellato per tutti
  useRealtimeSubscription('chat:message_deleted', (payload) => {
    if (!payload || payload.groupId !== activeGroup.id) return;
    if (payload.messageId) {
      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Gestione Selezione Immagine
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('L\'immagine non può superare 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPendingAttachment({
        type: 'image',
        url,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Gestione Selezione File / Documento
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Il file non può superare 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPendingAttachment({
        type: 'file',
        url,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Registrazione Vocale (MediaRecorder)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendAudioMessage(base64Audio, recordingSeconds);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Errore accesso microfono:', err);
      alert('Impossibile accedere al microfono per registrare la nota vocale.');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);
      audioChunksRef.current = [];
    }
  };

  // Invio diretto di una nota vocale
  const sendAudioMessage = async (audioDataUrl: string, durationSec: number) => {
    const attachment: ChatAttachment = {
      type: 'audio',
      url: audioDataUrl,
      duration: durationSec || 1,
      name: `Nota vocale (${durationSec}s)`,
    };

    await sendMessagePayload('', attachment);
  };

  // Invio Messaggio Principale (testo, allegati, replyTo)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if ((!cleanText && !pendingAttachment) || isSending) return;

    const attachmentToSend = pendingAttachment;
    setPendingAttachment(null);
    setInputText('');

    await sendMessagePayload(cleanText, attachmentToSend || undefined);
  };

  const sendMessagePayload = async (content: string, attachment?: ChatAttachment) => {
    setIsSending(true);

    const hasQuotedContent =
      Boolean(replyingTo?.content?.trim()) ||
      Boolean(replyingTo?.attachment?.type);

    const replyPayload: ChatReplyTo | undefined =
      replyingTo && hasQuotedContent
        ? {
            messageId: replyingTo.id,
            authorName: `${replyingTo.authorName} ${replyingTo.authorSurname || ''}`.trim() || 'Membro',
            content: replyingTo.content || (replyingTo.attachment ? `[${replyingTo.attachment.type}]` : ''),
            attachmentType: replyingTo.attachment?.type,
          }
        : undefined;

    setReplyingTo(null);

    const tempId = `msg-opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      groupId: activeGroup.id,
      subgroupId: subgroupId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorSurname: currentUser.surname,
      authorAvatar: currentUser.avatarUrl || null,
      content,
      attachment,
      replyTo: replyPayload,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subgroupId,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorSurname: currentUser.surname,
          authorAvatar: currentUser.avatarUrl || null,
          content,
          attachment,
          replyTo: replyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.message) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
        }
      }
    } catch (err) {
      console.error('Errore invio messaggio chat:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Modifica messaggio (Stile WhatsApp)
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content || '');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setIsSavingEdit(true);
    try {
      // Aggiornamento ottimistico in tempo reale
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: trimmed, isEdited: true, editedAt: new Date().toISOString() }
            : m
        )
      );
      setEditingMessageId(null);

      await fetch(`/api/groups/${activeGroup.id}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: trimmed,
        }),
      });
    } catch (err) {
      console.error('Errore modifica messaggio chat:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Cancellazione messaggio per tutti (Stile WhatsApp)
  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = window.confirm(
      'Vuoi davvero eliminare questo messaggio per tutti? Non sarà più visibile a nessun membro.'
    );
    if (!confirmed) return;

    setDeletingMessageId(messageId);
    try {
      // Rimozione ottimistica immediata per tutti
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      await fetch(`/api/groups/${activeGroup.id}/chat/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });
    } catch (err) {
      console.error('Errore eliminazione messaggio chat:', err);
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Gestione Pressione Prolungata (Long Press) per Smartphone (Stile WhatsApp)
  const handleTouchStart = (msg: ChatMessage, e: React.TouchEvent) => {
    // Se questo messaggio è già selezionato, non riavviare il timer
    if (selectedMessage?.id === msg.id) return;
    isLongPressActiveRef.current = false;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignora
        }
      }
      setSelectedMessage(msg);
    }, 420);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    setSelectedMessage(msg);
  };

  const handleCopyMessage = async (text?: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      }
    } catch {
      // ignora
    }
  };

  // Scroll al messaggio citato quando si clicca sul quote
  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`chat-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#f23e2e]', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#f23e2e]');
      }, 1500);
    }
  };

  // Gestione Riproduzione Audio in-chat
  const handleTogglePlayAudio = (messageId: string, audioUrl: string) => {
    if (playingAudioId === messageId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setPlayingAudioId(messageId);
    setAudioProgress(0);

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setPlayingAudioId(null);
      setAudioProgress(0);
    };

    audio.play().catch((e) => {
      console.warn('Errore riproduzione audio:', e);
      setPlayingAudioId(null);
    });
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-x-0 top-[56px] bottom-0 z-30 flex flex-col bg-[#efeae2] dark:bg-neutral-950 md:static md:inset-auto md:z-auto md:h-[calc(100vh-210px)] md:max-h-[780px] md:min-h-[490px] md:max-w-4xl lg:max-w-6xl xl:max-w-7xl md:mx-auto md:rounded-3xl md:border md:border-neutral-200/90 md:dark:border-neutral-800 md:shadow-sm overflow-hidden animate-in fade-in">
      
      {/* Hidden File Inputs per Immagini e Documenti */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header Chat / Barra Azioni Selezione Messaggio WhatsApp */}
      {selectedMessage ? (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 text-white border-b border-neutral-800 flex items-center justify-between shadow-md z-30 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedMessage(null)}
              className="p-1.5 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Annulla selezione"
            >
              <X className="w-5 h-5 stroke-[2.2px]" />
            </button>
            <span className="text-xs sm:text-sm font-black tracking-wide">
              1 selezionato
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tasto Rispondi */}
            <button
              type="button"
              onClick={() => {
                setReplyingTo(selectedMessage);
                setSelectedMessage(null);
              }}
              title="Rispondi al messaggio"
              className="p-2 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <CornerUpLeft className="w-4 h-4" />
            </button>

            {/* Tasto Copia (se testo presente) */}
            {selectedMessage.content && (
              <button
                type="button"
                onClick={() => {
                  handleCopyMessage(selectedMessage.content);
                  setSelectedMessage(null);
                }}
                title="Copia testo"
                className="p-2 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            {/* Se è un messaggio inviato dall'utente attuale: Modifica ed Elimina */}
            {selectedMessage.authorId === currentUser.id && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(selectedMessage);
                    setSelectedMessage(null);
                  }}
                  title="Modifica messaggio"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-[#00a884] active:bg-[#008f6f] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Modifica</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = selectedMessage.id;
                    setSelectedMessage(null);
                    handleDeleteMessage(idToDelete);
                  }}
                  title="Elimina per tutti"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 active:bg-red-800 text-red-400 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Elimina</span>
                </button>
              </>
            )}

            {/* Se non è mio ma sono admin del gruppo: Elimina */}
            {selectedMessage.authorId !== currentUser.id && isGroupAdmin && (
              <button
                type="button"
                onClick={() => {
                  const idToDelete = selectedMessage.id;
                  setSelectedMessage(null);
                  handleDeleteMessage(idToDelete);
                }}
                title="Elimina messaggio come Admin"
                className="p-2 rounded-xl hover:bg-red-950 text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shadow-2xs z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#f23e2e] md:hidden cursor-pointer shrink-0 transition-colors"
                title="Torna alla Dashboard"
                aria-label="Torna indietro"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
              </button>
            )}
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                activeSubgroup
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#f23e2e] text-white'
              }`}
            >
              {activeSubgroup ? (
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2px]" />
              ) : (
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2px]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                  {activeSubgroup ? activeSubgroup.name : 'Chat Generale'}
                </h2>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full ${
                    activeSubgroup
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'bg-red-100 dark:bg-red-950 text-[#f23e2e]'
                  }`}
                >
                  {activeSubgroup ? (activeSubgroup.parentId ? 'Sotto-sottogruppo' : 'Sottogruppo') : 'Generale'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                {activeSubgroup
                  ? (chatBreadcrumbs.length > 2
                      ? chatBreadcrumbs.join(' ➔ ')
                      : `Chat del sottogruppo ${activeSubgroup.name}`)
                  : `Chat del gruppo ${activeGroup.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSubgroup?.code && (
              <span className="text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                🔑 {activeSubgroup.code}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifica di Copia negli Appunti */}
      {copiedToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-neutral-900/95 text-white text-xs font-bold shadow-xl border border-neutral-700/80 animate-in fade-in zoom-in-95 pointer-events-none">
          Messaggio copiato negli appunti
        </div>
      )}

      {/* Sfondo semitrasparente per chiudere il menu contestuale toccando altrove */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[0.5px] cursor-default transition-opacity"
          onClick={() => setSelectedMessage(null)}
          onTouchEnd={() => setSelectedMessage(null)}
        />
      )}

      {/* Area Messaggi in stile WhatsApp (Sfondo chat con bolle) */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 space-y-3 bg-[#efeae2]/80 dark:bg-neutral-950/80"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 animate-pulse font-medium bg-white/80 dark:bg-neutral-900/80 px-3 py-1.5 rounded-xl shadow-xs">
              Caricamento messaggi da MongoDB...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shadow-sm">
              <MessageSquare className="w-6 h-6 stroke-[1.8px]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Nessun messaggio ancora in questa chat
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs bg-white/70 dark:bg-neutral-900/70 p-2 rounded-xl">
              Invia messaggi di testo, foto, note vocali o documenti. I messaggi sono salvati in modo permanente su MongoDB per tutti i membri di{' '}
              <strong>{contextName}</strong>.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.authorId === currentUser.id;
            const authorUser = allUsers.find((u) => u.id === msg.authorId);
            const isPlayingThisAudio = playingAudioId === msg.id;
            const isSelected = selectedMessage?.id === msg.id;
            const isFirstMessage = idx === 0;

            return (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`group flex items-end gap-1.5 transition-all ${
                  isMe ? 'justify-end' : 'justify-start'
                } ${isSelected ? 'relative z-40' : 'relative z-0'}`}
              >
                {!isMe && (
                  <div className="shrink-0 mb-1">
                    {authorUser ? (
                      <UserAvatar user={authorUser} size="xs" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[10px] font-bold flex items-center justify-center">
                        {msg.authorName.charAt(0)}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[70%] space-y-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-[#f23e2e] dark:text-red-400 px-1">
                      {msg.authorName} {msg.authorSurname}
                    </span>
                  )}

                  {/* Riga con Bolla Messaggio e Pulsanti Azione Affiancati */}
                  <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Bolla Messaggio con supporto Pressione Prolungata (Long Press stile WhatsApp) */}
                    <div
                      onTouchStart={(e) => handleTouchStart(msg, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onContextMenu={(e) => handleContextMenu(e, msg)}
                      className={`relative rounded-2xl p-2.5 sm:p-3 text-xs shadow-xs transition-all break-words select-none sm:select-text cursor-pointer sm:cursor-default ${
                        isMe
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-neutral-900 dark:text-neutral-100 rounded-br-xs'
                          : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-bl-xs border border-neutral-200/80 dark:border-neutral-800'
                      } ${
                        isSelected
                          ? 'ring-2 ring-[#00a884] dark:ring-[#25d366] ring-offset-2 ring-offset-[#efeae2] dark:ring-offset-neutral-950 shadow-md scale-[1.01] z-40'
                          : ''
                      }`}
                    >
                      {/* POPUP AZIONI WHATSAPP RAPIDE: compare sopra la bolla tenuta premuta con i bottoncini Modifica / Elimina */}
                      {isSelected && (
                        <div
                          className={`absolute z-50 ${isFirstMessage ? 'top-full mt-2' : '-top-12 mb-2'} ${
                            isMe ? 'right-0' : 'left-0'
                          } flex items-center gap-1 p-1 bg-neutral-900/95 dark:bg-neutral-800/95 text-white rounded-2xl shadow-2xl border border-neutral-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 select-none touch-manipulation`}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isMe ? (
                            <>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleStartEdit(msg);
                                  setSelectedMessage(null);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleStartEdit(msg);
                                  setSelectedMessage(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 text-emerald-400 text-xs font-bold transition-colors cursor-pointer select-none touch-manipulation"
                              >
                                <Edit2 className="w-3.5 h-3.5 pointer-events-none" />
                                <span className="pointer-events-none">Modifica</span>
                              </button>

                              <span className="w-px h-3.5 bg-neutral-700 pointer-events-none" />

                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedMessage(null);
                                  handleDeleteMessage(msg.id);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedMessage(null);
                                  handleDeleteMessage(msg.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-950 active:bg-red-900 text-red-400 text-xs font-bold transition-colors cursor-pointer select-none touch-manipulation"
                              >
                                <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                                <span className="pointer-events-none">Elimina</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReplyingTo(msg);
                                  setSelectedMessage(null);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReplyingTo(msg);
                                  setSelectedMessage(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 text-sky-400 text-xs font-bold transition-colors cursor-pointer select-none touch-manipulation"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5 pointer-events-none" />
                                <span className="pointer-events-none">Rispondi</span>
                              </button>

                              {isGroupAdmin && (
                                <>
                                  <span className="w-px h-3.5 bg-neutral-700 pointer-events-none" />
                                  <button
                                    type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedMessage(null);
                                      handleDeleteMessage(msg.id);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedMessage(null);
                                      handleDeleteMessage(msg.id);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-950 active:bg-red-900 text-red-400 text-xs font-bold transition-colors cursor-pointer select-none touch-manipulation"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                                    <span className="pointer-events-none">Elimina</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {msg.content && (
                            <>
                              <span className="w-px h-3.5 bg-neutral-700 pointer-events-none" />
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCopyMessage(msg.content);
                                  setSelectedMessage(null);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCopyMessage(msg.content);
                                  setSelectedMessage(null);
                                }}
                                className="p-1.5 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer select-none touch-manipulation"
                                title="Copia testo"
                              >
                                <Copy className="w-3.5 h-3.5 pointer-events-none" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* BOX CITAZIONE / RICHIAMO MESSAGGIO (WhatsApp Style Quote pulito) */}
                      {msg.replyTo && (msg.replyTo.content || msg.replyTo.attachmentType) && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(msg.replyTo!.messageId);
                          }}
                          className={`mb-2 p-2 rounded-xl text-[11px] border-l-4 cursor-pointer transition-all hover:opacity-90 ${
                            isMe
                              ? 'bg-black/10 dark:bg-black/25 border-[#00a884] dark:border-[#25d366]'
                              : 'bg-neutral-100 dark:bg-neutral-800 border-[#f23e2e]'
                          }`}
                        >
                          <div className="flex items-center gap-1 font-bold text-[10px] text-[#00a884] dark:text-[#25d366]">
                            <CornerUpLeft className="w-3 h-3 stroke-[2.5px]" />
                            <span>{msg.replyTo.authorName || 'Membro'}</span>
                          </div>
                          <p className="truncate text-neutral-600 dark:text-neutral-300 text-[10.5px] mt-0.5">
                            {msg.replyTo.attachmentType === 'image' && '📷 Foto'}
                            {msg.replyTo.attachmentType === 'audio' && '🎙️ Nota vocale'}
                            {msg.replyTo.attachmentType === 'file' && '📄 Documento'}
                            {msg.replyTo.content && ` ${msg.replyTo.content}`}
                          </p>
                        </div>
                      )}

                    {/* 1. ALLEGATO IMMAGINE */}
                    {msg.attachment?.type === 'image' && (
                      <div className="mb-2 rounded-xl overflow-hidden relative group/img cursor-pointer">
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name || 'Immagine allegata'}
                          onClick={() =>
                            setPreviewImage({
                              url: msg.attachment!.url,
                              name: msg.attachment!.name,
                            })
                          }
                          className="w-full max-h-72 object-cover rounded-xl hover:scale-101 transition-transform"
                        />
                        <div
                          onClick={() =>
                            setPreviewImage({
                              url: msg.attachment!.url,
                              name: msg.attachment!.name,
                            })
                          }
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                    {/* 2. ALLEGATO NOTA VOCALE / AUDIO */}
                    {msg.attachment?.type === 'audio' && (
                      <div className="mb-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleTogglePlayAudio(msg.id, msg.attachment!.url)
                          }
                          className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-2xs cursor-pointer active:scale-95 transition-transform"
                        >
                          {isPlayingThisAudio ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Barra audio stile WhatsApp */}
                          <div className="h-1.5 w-full bg-neutral-300 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00a884] transition-all duration-150"
                              style={{
                                width: isPlayingThisAudio ? `${audioProgress}%` : '0%',
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Volume2 className="w-3 h-3 text-[#00a884]" />
                              <span>Nota Vocale</span>
                            </span>
                            <span className="font-mono">
                              {msg.attachment.duration
                                ? formatSeconds(msg.attachment.duration)
                                : '0:00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. ALLEGATO FILE / DOCUMENTO */}
                    {msg.attachment?.type === 'file' && (
                      <div className="mb-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3 border border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#f23e2e] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {msg.attachment.name || 'Documento'}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              {formatFileSize(msg.attachment.size)}
                            </p>
                          </div>
                        </div>

                        <a
                          href={msg.attachment.url}
                          download={msg.attachment.name || 'documento'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-[#f23e2e] hover:text-white text-neutral-700 dark:text-neutral-200 transition-colors shrink-0 cursor-pointer"
                          title="Scarica file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {/* Contenuto di testo del messaggio o Editor Inline */}
                    {editingMessageId === msg.id ? (
                      <div className="space-y-1.5 py-1 min-w-[200px]">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          disabled={isSavingEdit}
                          rows={2}
                          className="w-full text-xs p-2 rounded-xl border border-[#00a884] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none resize-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(msg.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 cursor-pointer"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(msg.id)}
                            disabled={isSavingEdit || !editingText.trim()}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Check className="w-3 h-3 stroke-[3px]" />
                            <span>Salva</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      )
                    )}

                    {/* Orario, badge (modificato) e spunta di invio */}
                    <div
                      className={`text-[9px] mt-1 flex items-center gap-1 justify-end select-none ${
                        isMe ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400'
                      }`}
                    >
                      {msg.isEdited && (
                        <span className="italic text-[9px] text-neutral-500 dark:text-neutral-400 mr-0.5">
                          (modificato)
                        </span>
                      )}
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isMe && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      )}
                    </div>
                  </div>

                  {/* Pulsanti Azione Messaggio per Desktop su mouse hover (Nascosti su mobile) */}
                  <div className="hidden md:flex opacity-0 group-hover:opacity-100 items-center gap-0.5 p-1 rounded-xl bg-white/95 dark:bg-neutral-800/95 border border-neutral-200/70 dark:border-neutral-700/70 shadow-xs transition-opacity shrink-0 mb-1">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      title="Rispondi / Richiama questo messaggio"
                      className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                    </button>

                    {isMe && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg)}
                          title="Modifica messaggio"
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingMessageId === msg.id}
                          title="Elimina per tutti"
                          className="p-1 rounded-lg hover:bg-red-500 hover:text-white text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* BANNER RISPOSTA ATTIVA (Quote Stile WhatsApp) */}
      {replyingTo && (
        <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 min-w-0 border-l-4 border-[#00a884] pl-2.5">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#00a884]">
                Rispondi a {replyingTo.authorName} {replyingTo.authorSurname}:
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                {replyingTo.attachment?.type === 'image' && '📷 Foto'}
                {replyingTo.attachment?.type === 'audio' && '🎙️ Nota vocale'}
                {replyingTo.attachment?.type === 'file' && '📄 Documento'}
                {replyingTo.content && ` ${replyingTo.content}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ANTEPRIMA ALLEGATO IN CODA PRIMA DELL'INVIO */}
      {pendingAttachment && (
        <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 min-w-0">
            {pendingAttachment.type === 'image' && (
              <img
                src={pendingAttachment.url}
                alt="Anteprima"
                className="w-10 h-10 object-cover rounded-lg border border-neutral-300 dark:border-neutral-700 shrink-0"
              />
            )}
            {pendingAttachment.type === 'file' && (
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#f23e2e] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {pendingAttachment.name || 'Allegato pronto'}
              </p>
              <p className="text-[10px] text-neutral-500">
                {formatFileSize(pendingAttachment.size)} &bull; Clicca Invia per confermare
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BARRA INSERIMENTO MESSAGGIO & REGISTRAZIONE VOCALE */}
      <div className="p-2 sm:p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200/80 dark:border-neutral-800 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-3 shrink-0">
        {isRecording ? (
          /* Interfaccia Registratore Vocale in Corso */
          <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-2.5 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                {formatSeconds(recordingSeconds)}
              </span>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Registrazione vocale in corso...
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-600 hover:text-red-600 shadow-2xs cursor-pointer"
                title="Annulla registrazione"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="px-3 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Invia nota vocale"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Audio</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normale Barra di Input con Tasti Allegati e Microfono */
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Tasto Invia Immagine */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-2xl text-neutral-500 hover:text-[#f23e2e] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              title="Invia Foto / Immagine"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Tasto Invia File / Documento */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-2xl text-neutral-500 hover:text-[#f23e2e] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              title="Invia Documento o File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Campo Testo */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Scrivi un messaggio in ${contextName}...`}
              className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#f23e2e] transition-all"
            />

            {/* Se c'è testo o allegato pronto: Tasto INVIA. Altrimenti: Tasto MICROFONO */}
            {inputText.trim() || pendingAttachment ? (
              <button
                type="submit"
                disabled={isSending}
                className="p-2.5 sm:p-3 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                aria-label="Invia messaggio"
              >
                <Send className="w-4 h-4 stroke-[2.2px]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 sm:p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-[#00a884] hover:text-white text-neutral-600 dark:text-neutral-300 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                title="Tieni premuto o clicca per registrare una nota vocale"
              >
                <Mic className="w-4 h-4 stroke-[2.2px]" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* MODALE ANTEPRIMA IMMAGINE A SCHERMO INTERO (Lightbox) */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[90vh] flex flex-col items-center gap-3 relative"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name || 'Immagine a schermo intero'}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            {previewImage.name && (
              <p className="text-xs text-white/70 font-medium">
                {previewImage.name}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
