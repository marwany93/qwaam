'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyClientAccess, verifyAdminAccess } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

// Type definitions to keep the schema strict
export interface ProgressLog {
  traineeUid: string;
  itemId: string; // The ID of the workout or meal
  type: 'workout' | 'meal';
  date: string; // Format: YYYY-MM-DD
  status: 'completed';
  timestamp: number;
}

export async function toggleProgress(itemId: string, type: 'workout' | 'meal', date: string) {
  const decodedToken = await verifyClientAccess();
  const db = getAdminDb();
  const traineeUid = decodedToken.uid;
  
  // High-performance deterministic ID for instant toggles
  const logId = `${traineeUid}_${itemId}_${date}`;
  const docRef = db.collection('progressLogs').doc(logId);
  
  // Transactional logic: if it exists we delete it (undo), else create it
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    await docRef.delete();
  } else {
    const payload: ProgressLog = {
      traineeUid,
      itemId,
      type,
      date,
      status: 'completed',
      timestamp: Date.now()
    };
    await docRef.set(payload);
  }
  
  // Optimistically revalidate the layout
  revalidatePath('/[locale]/client', 'page');
  return { success: true };
}

// Client Side fetcher 
export async function getMyProgressLogsByDate(date: string) {
  try {
    const decodedToken = await verifyClientAccess();
    const db = getAdminDb();
    
    const snapshot = await db.collection('progressLogs')
      .where('traineeUid', '==', decodedToken.uid)
      .where('date', '==', date)
      .where('status', '==', 'completed')
      .get();
      
    return snapshot.docs.map(d => d.data() as ProgressLog);
  } catch (error) {
    return [];
  }
}

// Admin Side fetcher
export async function getTraineeProgressLogsByDate(traineeUid: string, date: string) {
  try {
    await verifyAdminAccess();
    const db = getAdminDb();
    
    const snapshot = await db.collection('progressLogs')
      .where('traineeUid', '==', traineeUid)
      .where('date', '==', date)
      .where('status', '==', 'completed')
      .get();
      
    return snapshot.docs.map(d => d.data() as ProgressLog);
  } catch (error) {
    return [];
  }
}
