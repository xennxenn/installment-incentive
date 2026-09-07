import { doc, onSnapshot, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Team, Job, LeaveRecord, PayPeriod, IncentiveRules, AppUser, AutoBackupConfig, BackupInterval } from '../types';
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
  autoBackupConfig?: AutoBackupConfig;
  updatedAt?: number;
}

export interface SnapshotSummary {
  id: string;
  label: string;
  timestamp: number;
  dateStr: string;
  jobsCount: number;
  teamsCount: number;
  backupType?: 'manual' | 'auto_hourly' | 'auto_daily' | 'auto_weekly' | 'safety';
}

const MAIN_DOC_REF = doc(db, 'curtain_installer', 'main_state');
const SNAPSHOTS_COL_REF = collection(db, 'curtain_snapshots');

/**
 * Listens to realtime changes from Firestore document.
 * If document doesn't exist, initializes it.
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

export function sanitizeForFirestore(obj: any): any {
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

// Pending payload for debounced coalesced writes
let pendingSyncPayload: Partial<AppFirebaseData> = {};
let syncTimeout: any = null;
let isQuotaExceeded = false;
let quotaExceededCooldownUntil = 0;

/**
 * Save updated fields to Firestore in realtime with debouncing to prevent exceeding write quotas.
 */
export async function saveToRealtimeDb(partialData: Partial<AppFirebaseData>): Promise<void> {
  // Merge incoming partial data into pending buffer
  pendingSyncPayload = {
    ...pendingSyncPayload,
    ...partialData,
    updatedAt: Date.now()
  };

  // If quota limit was reached, don't spam Firestore; check if cooldown period has passed
  if (isQuotaExceeded) {
    if (Date.now() < quotaExceededCooldownUntil) {
      return;
    }
    // Cooldown passed, reset flag and attempt resume
    isQuotaExceeded = false;
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    if (Object.keys(pendingSyncPayload).length === 0) return;

    const dataToSend = sanitizeForFirestore(pendingSyncPayload);
    pendingSyncPayload = {};

    try {
      await setDoc(MAIN_DOC_REF, dataToSend, { merge: true });
    } catch (err: any) {
      const errMsg = String(err?.message || '');
      const errCode = String(err?.code || '');
      if (errCode === 'resource-exhausted' || errMsg.includes('Quota') || errMsg.includes('resource-exhausted')) {
        isQuotaExceeded = true;
        quotaExceededCooldownUntil = Date.now() + 15 * 60 * 1000; // 15-minute cooldown
        console.warn('Firestore write quota reached. Changes are safely preserved in local storage.');
      } else {
        console.error('Error saving to Firestore:', err);
      }
    }
  }, 1000);
}

/**
 * Fetch one-time state from Cloud Firestore
 */
export async function fetchCloudData(): Promise<AppFirebaseData | null> {
  try {
    const snap = await getDoc(MAIN_DOC_REF);
    if (snap.exists()) {
      return snap.data() as AppFirebaseData;
    }
    return null;
  } catch (err) {
    console.error('Error fetching from Firestore:', err);
    throw err;
  }
}

/**
 * Create a timestamped point-in-time snapshot of the complete database in Firestore.
 */
export async function createDatabaseSnapshot(
  label: string,
  fullData: AppFirebaseData,
  backupType: 'manual' | 'auto_hourly' | 'auto_daily' | 'auto_weekly' | 'safety' = 'manual'
): Promise<string> {
  try {
    const now = Date.now();
    const docData = sanitizeForFirestore({
      label: label || 'สำรองข้อมูลอัตโนมัติ',
      backupType,
      timestamp: now,
      dateStr: new Date(now).toLocaleString('th-TH'),
      jobsCount: fullData.jobs?.length || 0,
      teamsCount: fullData.teams?.length || 0,
      data: fullData
    });
    const ref = await addDoc(SNAPSHOTS_COL_REF, docData);
    return ref.id;
  } catch (err) {
    console.error('Error creating database snapshot:', err);
    throw err;
  }
}

/**
 * List all available cloud snapshots (up to 50 most recent).
 */
export async function fetchDatabaseSnapshots(): Promise<SnapshotSummary[]> {
  try {
    const q = query(SNAPSHOTS_COL_REF, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    const results: SnapshotSummary[] = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        label: d.label || 'จุดสำรองข้อมูล',
        timestamp: d.timestamp || 0,
        dateStr: d.dateStr || (d.timestamp ? new Date(d.timestamp).toLocaleString('th-TH') : '-'),
        jobsCount: d.jobsCount || 0,
        teamsCount: d.teamsCount || 0,
        backupType: d.backupType || 'manual'
      });
    });
    return results;
  } catch (err) {
    console.error('Error fetching snapshots list:', err);
    return [];
  }
}

/**
 * Delete a specific snapshot by ID from Firestore.
 */
export async function deleteDatabaseSnapshot(snapshotId: string): Promise<void> {
  try {
    const snapDocRef = doc(db, 'curtain_snapshots', snapshotId);
    await deleteDoc(snapDocRef);
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    throw err;
  }
}

/**
 * Restore complete database state from a specific cloud snapshot ID.
 */
export async function restoreSnapshotById(snapshotId: string): Promise<AppFirebaseData> {
  try {
    const snapDocRef = doc(db, 'curtain_snapshots', snapshotId);
    const snap = await getDoc(snapDocRef);
    if (!snap.exists()) {
      throw new Error('ไม่พบข้อมูลจุดสำรองข้อมูลที่ระบุ');
    }
    const snapPayload = snap.data();
    const restoredData = snapPayload.data as AppFirebaseData;
    if (!restoredData) {
      throw new Error('โครงสร้างข้อมูลในจุดสำรองไม่ถูกต้อง');
    }

    // Save as current active main_state in Firestore
    await setDoc(MAIN_DOC_REF, sanitizeForFirestore({
      ...restoredData,
      updatedAt: Date.now()
    }));

    return restoredData;
  } catch (err) {
    console.error('Error restoring snapshot:', err);
    throw err;
  }
}

/**
 * Download full database state as a .json file directly to the user's computer.
 */
export function exportFullBackupJSON(data: AppFirebaseData): void {
  try {
    const backupObject = {
      app: 'Curtain Installer Incentive System',
      version: '2.0',
      exportDate: new Date().toISOString(),
      exportTimestamp: Date.now(),
      summary: {
        totalJobs: data.jobs?.length || 0,
        totalTeams: data.teams?.length || 0,
        totalLeaves: data.leaves?.length || 0,
        period: data.period?.name || ''
      },
      data
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupObject, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    const nowStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `curtain-backup-${nowStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Error exporting backup JSON:', err);
    throw err;
  }
}

/**
 * Validate and parse uploaded JSON backup file.
 */
export function parseAndValidateBackupJSON(jsonContent: string): AppFirebaseData {
  try {
    const parsed = JSON.parse(jsonContent);
    const payload = parsed.data || parsed;

    if (!payload.jobs || !Array.isArray(payload.jobs)) {
      throw new Error('ไฟล์สำรองไม่ถูกต้อง: ไม่พบรายการงาน (jobs)');
    }
    if (!payload.teams || !Array.isArray(payload.teams)) {
      throw new Error('ไฟล์สำรองไม่ถูกต้อง: ไม่พบข้อมูลทีมช่าง (teams)');
    }

    return payload as AppFirebaseData;
  } catch (err: any) {
    console.error('Error validating backup JSON:', err);
    throw new Error(err?.message || 'ไฟล์ JSON ชำรุดหรือไม่ตรงตามรูปแบบของระบบ');
  }
}
