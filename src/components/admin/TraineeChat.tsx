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
  doc,
  type Timestamp,
} from 'firebase/firestore';
import type { ChatMessage } from '@/types';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface Props {
  coachUid: string;
  traineeUid: string;
  traineeName: string;
}

export default function TraineeChat({ coachUid, traineeUid, traineeName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Stable chat ID — always coach first for consistent querying
  const chatId = `${coachUid}_${traineeUid}`;

  // ── Real-time onSnapshot listener ───────────────────────
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          timestamp: (data.timestamp as Timestamp)?.toMillis?.() ?? Date.now(),
        };
      });
      setMessages(msgs);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [chatId]);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Clear the Unread Badge actively while the Coach is looking at this chat
    updateDoc(doc(db, 'users', traineeUid), {
      'traineeData.unreadCount': 0
    }).catch(err => console.debug('Soft fail resetting unread:', err));

  }, [messages, traineeUid]);

  // ── Send message via Firebase Client SDK directly ───────
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
    } catch (err) {
      console.error('Message send failure:', err);
      setText(trimmed); // Restore on failure
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: number | any): string {
    const d = typeof ts === 'number' ? new Date(ts) : new Date();
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden h-[70vh]">

      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border-light bg-gray-50/80 flex items-center gap-3">
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
                className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${isCoach
                    ? 'bg-qwaam-pink text-white rounded-tr-sm'
                    : 'bg-gray-100 text-text-main rounded-tl-sm'
                  }`}
              >
                <p className="text-sm font-bold leading-relaxed break-words">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1.5 font-bold ${isCoach ? 'text-pink-200' : 'text-text-muted'
                    }`}
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
          {/* Mirror icon for RTL send direction */}
          <PaperAirplaneIcon className="w-5 h-5 -rotate-90" />
        </button>
      </form>
    </div>
  );
}
