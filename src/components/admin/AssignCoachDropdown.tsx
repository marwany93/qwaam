'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { assignCoach } from '@/actions/admin-actions';
import { UserCheck } from 'lucide-react';

interface Props {
  traineeUid: string;
  coaches: { uid: string; name: string }[];
  adminUid: string;
}

export default function AssignCoachDropdown({ traineeUid, coaches, adminUid }: Props) {
  const t = useTranslations('admin');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAssign() {
    if (!selectedCoach) return;
    setIsSubmitting(true);
    
    try {
      const res = await assignCoach(traineeUid, selectedCoach);
      if (res.success) {
        setSuccess(true);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error assigning coach');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 w-fit">
        <UserCheck className="w-4 h-4" />
        {t('assignedSuccessfully')}
      </div>
    );
  }

  const selfCoach = coaches.find(c => c.uid === adminUid);
  const otherCoaches = coaches.filter(c => c.uid !== adminUid);

  return (
    <div className="flex items-center gap-2 max-w-sm">
      <select
        value={selectedCoach}
        onChange={(e) => setSelectedCoach(e.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-border-light rounded-xl outline-none focus:border-qwaam-pink focus:ring-2 focus:ring-qwaam-pink/20 transition-all bg-white text-text-main"
        disabled={isSubmitting}
      >
        <option value="" disabled>{t('assignCoach')}</option>
        {selfCoach && (
          <option value={selfCoach.uid}>
            🌟 {t('selfAssign')} ({selfCoach.name})
          </option>
        )}
        {otherCoaches.map(c => (
          <option key={c.uid} value={c.uid}>{c.name}</option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!selectedCoach || isSubmitting}
        className="px-4 py-2 bg-qwaam-pink text-white text-sm font-bold rounded-xl shadow-md hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
      >
        {isSubmitting ? '...' : t('assignCoach')}
      </button>
    </div>
  );
}
