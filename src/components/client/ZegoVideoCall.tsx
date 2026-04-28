'use client';

import { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  roomID: string;
  userID: string;
  userName: string;
  onClose: () => void;
}

export default function ZegoVideoCall({ roomID, userID, userName, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Strictly literal references so Next.js can inline these at build time
    const appIDStr = process.env.NEXT_PUBLIC_ZEGO_APP_ID;
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || '';
    const appID = appIDStr ? Number(appIDStr) : 0;

    if (!appID || !serverSecret) {
      console.warn('[ZegoVideoCall] NEXT_PUBLIC_ZEGO_APP_ID or NEXT_PUBLIC_ZEGO_SERVER_SECRET is not set — call will not start.');
      return;
    }

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      userID,
      userName,
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      showPreJoinView: false,
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
      showUserList: false,
      maxUsers: 2,
      layout: 'Auto',
      onLeaveRoom: () => onClose(),
    });

    // Cleanup: destroy the ZegoCloud instance when the component unmounts
    return () => {
      try { zp.destroy(); } catch { /* already destroyed */ }
    };
  }, [roomID, userID, userName, onClose]);

  return (
    /* Full-viewport overlay */
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">

      {/* Thin branded header with close button */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 shrink-0" dir="rtl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-black text-sm">حصة مباشرة</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          title="إنهاء الحصة"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* ZegoCloud mounts here — fills all remaining space */}
      <div ref={containerRef} className="flex-1 w-full" />

    </div>
  );
}
