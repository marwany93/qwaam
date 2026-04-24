'use client';

import { useEffect, useRef, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
  doc,
  type Timestamp,
} from 'firebase/firestore';
import type { ChatMessage } from '@/types';
import { PaperAirplaneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { startLiveSession, endLiveSession } from '@/actions/admin-actions';
import dynamic from 'next/dynamic';

// Dynamically import Jitsi to avoid SSR issues with the iframe API
const JitsiVideoCall = dynamic(() => import('@/components/client/JitsiVideoCall'), { ssr: false });

interface Props {
  coachUid: string;
  traineeUid: string;
  traineeName: string;
}

export default function TraineeChat({ coachUid, traineeUid, traineeName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatId = `${coachUid}_${traineeUid}`;

  // ── Real-time message listener ───────────────────────────
  useEffect(() => {
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
  }, [chatId]);

  // Auto-scroll + clear unread badge while coach is viewing this chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    updateDoc(doc(db, 'users', traineeUid), {
      'traineeData.unreadCount': 0,
    }).catch(err => console.debug('Soft fail resetting unread:', err));
  }, [messages, traineeUid]);

  // ── Send message ─────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');

    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: coachUid,
        receiverId: traineeUid,
        text: trimmed,
        timestamp: serverTimestamp(),
      });

      // Increment unread so trainee's dashboard badge reflects the new message
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

  // ── Live session: start ──────────────────────────────────
  async function handleStartSession() {
    setStartingSession(true);
    const roomName = `qwaam-session-${traineeUid}-${Date.now()}`;

    const res = await startLiveSession(traineeUid, roomName);
    if (res.success) {
      setActiveRoom(roomName);
    } else {
      console.error('Failed to start session:', res.error);
    }
    setStartingSession(false);
  }

  // ── Live session: end (triggered by Jitsi hang-up) ──────
  async function handleSessionEnd() {
    setActiveRoom(null);
    await endLiveSession(traineeUid);
  }

  function formatTime(ts: number | any): string {
    const d = typeof ts === 'number' ? new Date(ts) : new Date();
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      {/* Jitsi modal — mounts only when a room is active */}
      {activeRoom && (
        <JitsiVideoCall
          roomName={activeRoom}
          displayName="المدرب"
          onClose={handleSessionEnd}
        />
      )}

      <div className="flex flex-col bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden h-[70vh]">

        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-border-light bg-gray-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-qwaam-yellow text-text-main flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {traineeName.charAt(0)}
            </div>
            <div>
              <p className="font-extrabold text-text-main text-base leading-tight">{traineeName}</p>
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse" />
                متصل
              </span>
            </div>
          </div>

          {/* Start Live Session button */}
          <button
            onClick={handleStartSession}
            disabled={startingSession || !!activeRoom}
            title="بدء حصة لايف"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-qwaam-pink text-white text-sm font-black shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <VideoCameraIcon className="w-4 h-4" />
            {startingSession ? 'جاري الإعداد...' : 'بدء حصة لايف'}
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3" dir="rtl">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3">
              <span className="text-5xl grayscale opacity-40">💬</span>
              <p className="font-bold text-sm">ابدأ محادثة مع {traineeName}</p>
            </div>
          )}

          {messages.map((msg) => {
            const isCoach = msg.senderId === coachUid;
            return (
              <div
                key={msg.id}
                className={`flex ${isCoach ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
              >
                <div
                  className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                    isCoach
                      ? 'bg-qwaam-pink text-white rounded-tr-sm'
                      : 'bg-gray-100 text-text-main rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm font-bold leading-relaxed break-words">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1.5 font-bold ${isCoach ? 'text-pink-200' : 'text-text-muted'}`}
                    dir="ltr"
                    style={{ textAlign: isCoach ? 'right' : 'left' }}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Message Composer */}
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
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-border-light focus:border-qwaam-pink focus:bg-white outline-none font-bold text-sm transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-12 h-12 rounded-2xl bg-qwaam-pink text-white flex items-center justify-center shadow-md shadow-qwaam-pink/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5 -rotate-90" />
          </button>
        </form>

      </div>
    </>
  );
}
