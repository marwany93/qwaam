'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  type Timestamp,
} from 'firebase/firestore';
import type { ChatMessage } from '@/types';
import { PaperAirplaneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';

const JitsiVideoCall = dynamic(() => import('@/components/client/JitsiVideoCall'), { ssr: false });

interface Props {
  coachUid: string;
  traineeUid: string;
  traineeName: string;
}

export default function ClientChat({ coachUid, traineeUid, traineeName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatId = `${coachUid}_${traineeUid}`;

  // ── Messages listener ────────────────────────────────────
  useEffect(() => {
    if (!coachUid) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          timestamp: (data.timestamp as Timestamp)?.toMillis?.() ?? Date.now(),
        };
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, coachUid]);

  // ── activeRoomUrl listener — shows join button when coach starts a session ──
  useEffect(() => {
    if (!traineeUid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', traineeUid), (snap) => {
      const room = snap.data()?.activeRoomUrl ?? null;
      setActiveRoom(room);
      // Auto-close modal if coach ended the session
      if (!room) setCallOpen(false);
    });

    return () => unsubscribe();
  }, [traineeUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !coachUid) return;

    setSending(true);
    setText('');

    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: traineeUid,
        receiverId: coachUid,
        text: trimmed,
        timestamp: serverTimestamp(),
      });

      updateDoc(doc(db, 'users', traineeUid), {
        'traineeData.unreadCount': increment(1),
      }).catch(err => console.error('Failed to increment unread count:', err));

    } catch (err) {
      console.error('Message send failure:', err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: number | any): string {
    const d = typeof ts === 'number' ? new Date(ts) : new Date();
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  }

  if (!coachUid) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-border-light text-center h-full flex flex-col justify-center shadow-sm">
        <p className="text-text-muted font-bold">لم يتم تعيين مدرب لحسابك بعد لفتح المحادثة.</p>
      </div>
    );
  }

  return (
    <>
      {/* Jitsi modal — opens when trainee clicks join */}
      {callOpen && activeRoom && (
        <JitsiVideoCall
          roomName={activeRoom}
          displayName={traineeName}
          onClose={() => setCallOpen(false)}
        />
      )}

      <div className="flex flex-col bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden h-[500px]">

        {/* ── Chat Header ── */}
        <div className="px-6 py-4 border-b border-border-light bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center font-black text-lg shadow-sm border border-qwaam-pink/20">
              م
            </div>
            <div>
              <p className="font-extrabold text-text-main text-base leading-tight">المدرب الخاص بك</p>
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse" />
                جاهز للمساعدة
              </span>
            </div>
          </div>

          {/* Join Live Session button — visible only when coach has started a session */}
          {activeRoom && (
            <button
              onClick={() => setCallOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-black shadow-md shadow-green-500/20 hover:bg-green-600 transition-all animate-pulse shrink-0"
            >
              <VideoCameraIcon className="w-4 h-4" />
              انضمام للحصة المباشرة
            </button>
          )}
        </div>

        {/* ── Message Loop ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3" dir="rtl">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3">
              <span className="text-5xl grayscale opacity-40">💬</span>
              <p className="font-bold text-sm">استفسر عن تمارينك ووجباتك هنا</p>
            </div>
          )}

          {messages.map((msg) => {
            const isTrainee = msg.senderId === traineeUid;
            return (
              <div key={msg.id} className={`flex ${isTrainee ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                    isTrainee
                      ? 'bg-qwaam-pink text-white rounded-tr-sm'
                      : 'bg-gray-100 text-text-main rounded-tl-sm border border-border-light/50'
                  }`}
                >
                  <p className="text-sm font-bold leading-relaxed break-words">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1.5 font-bold ${isTrainee ? 'text-pink-200' : 'text-text-muted'}`}
                    dir="ltr"
                    style={{ textAlign: isTrainee ? 'right' : 'left' }}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Engine ── */}
        <form
          onSubmit={handleSend}
          className="border-t border-border-light p-4 bg-white flex items-center gap-3"
          dir="rtl"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            placeholder="كيف يمكنني أداء هذا التمرين..."
            className="flex-1 px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-border-light focus:border-qwaam-pink focus:bg-white outline-none font-bold text-sm transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-12 h-12 rounded-2xl bg-qwaam-pink text-white flex items-center justify-center shadow-md shadow-qwaam-pink/20 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
          >
            <PaperAirplaneIcon className="w-5 h-5 -rotate-90" />
          </button>
        </form>

      </div>
    </>
  );
}
