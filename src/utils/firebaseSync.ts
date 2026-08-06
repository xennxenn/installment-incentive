import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Team, Job, LeaveRecord, PayPeriod, IncentiveRules, AppUser } from '../types';
import { INITIAL_TEAMS, getInitialJobs, getInitialLeaves, getInitialHolidays, DEFAULT_INCENTIVE_RULES, DEFAULT_USERS } from '../data/initialData';
import { getCurrentAutoPeriod, generateAutoPeriodsList } from './periodUtils';

export interface AppFirebaseData {
  teams: Team[];
  jobs: Job[];
  leaves: LeaveRecord[];
  holidays: string[];
  period: PayPeriod;
  savedPeriods: PayPeriod[];
  rules: IncentiveRules;
  appUsers: AppUser[];
  themeColor?: string;
  updatedAt?: number;
}

const MAIN_DOC_REF = doc(db, 'curtain_installer', 'main_state');

/**
 * Listens to realtime changes from Firestore document.
 * If document doesn't exist, initializes it with default seed data.
 */
export function subscribeToRealtimeData(
  onDataReceived: (data: AppFirebaseData) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    MAIN_DOC_REF,
    async (snapshot) => {
      if (!snapshot.exists()) {
        const defaultPeriod = getCurrentAutoPeriod();
        const initialSeed: AppFirebaseData = {
          teams: INITIAL_TEAMS,
          jobs: getInitialJobs(defaultPeriod.start),
          leaves: getInitialLeaves(defaultPeriod.start),
          holidays: getInitialHolidays(defaultPeriod.start),
          period: defaultPeriod,
          savedPeriods: generateAutoPeriodsList(),
          rules: DEFAULT_INCENTIVE_RULES,
          appUsers: DEFAULT_USERS,
          themeColor: '#424242',
          updatedAt: Date.now()
        };
        try {
          await setDoc(MAIN_DOC_REF, sanitizeForFirestore(initialSeed));
        } catch (e) {
          console.error('Failed to seed initial Firestore data:', e);
        }
        onDataReceived(initialSeed);
      } else {
        const data = snapshot.data() as AppFirebaseData;
        onDataReceived(data);
      }
    },
    (err) => {
      console.error('Firestore realtime listener error:', err);
      if (onError) onError(err);
    }
  );
}

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

/**
 * Save updated fields to Firestore in realtime.
 */
export async function saveToRealtimeDb(partialData: Partial<AppFirebaseData>): Promise<void> {
  try {
    const sanitizedData = sanitizeForFirestore({
      ...partialData,
      updatedAt: Date.now()
    });
    await setDoc(MAIN_DOC_REF, sanitizedData, { merge: true });
  } catch (err) {
    console.error('Error saving to Firestore:', err);
  }
}
