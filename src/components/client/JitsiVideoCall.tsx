'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

export default function JitsiVideoCall({ roomName, displayName, onClose }: Props) {
  return (
    <Transition show as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">

        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Panel — nearly full-screen on mobile, capped on desktop */}
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-5xl bg-gray-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col">

              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-900 shrink-0" dir="rtl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <Dialog.Title className="text-white font-black text-sm">حصة مباشرة</Dialog.Title>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  title="إغلاق"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* 16:9 Jitsi iframe wrapper */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%', minHeight: 320 }}>
                <div className="absolute inset-0">
                  <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={roomName}
                    configOverwrite={{
                      startWithAudioMuted: false,
                      startWithVideoMuted: false,
                      disableModeratorIndicator: true,
                      enableEmailInStats: false,
                      toolbarButtons: [
                        'microphone', 'camera', 'closedcaptions', 'desktop',
                        'fullscreen', 'fodeviceselection', 'hangup', 'chat',
                        'raisehand', 'videoquality', 'tileview',
                      ],
                    }}
                    interfaceConfigOverwrite={{
                      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                      SHOW_JITSI_WATERMARK: false,
                      SHOW_WATERMARK_FOR_GUESTS: false,
                    }}
                    userInfo={{ displayName, email: '' }}
                    onReadyToClose={onClose}
                    getIFrameRef={(node) => {
                      if (node) {
                        node.style.width = '100%';
                        node.style.height = '100%';
                        node.style.border = 'none';
                        node.style.position = 'absolute';
                        node.style.inset = '0';
                      }
                    }}
                  />
                </div>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>

      </Dialog>
    </Transition>
  );
}
