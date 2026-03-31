'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import AddClientModal from './AddClientModal';

export default function AddClientButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-qwaam-pink text-white hover:bg-pink-600 transition-all shadow-md shadow-qwaam-pink/20 hover:-translate-y-0.5 active:translate-y-0"
      >
        <PlusIcon className="w-5 h-5 shadow-sm" />
        <span>إضافة متدرب</span>
      </button>

      {/* Controlled Client-Side Modal Portal */}
      <AddClientModal isOpen={isOpen} closeModal={() => setIsOpen(false)} />
    </>
  );
}
