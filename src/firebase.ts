import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const targetDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      },
      targetDatabaseId
    );
  } catch (err1) {
    try {
      return initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
          localCache: memoryLocalCache()
        },
        targetDatabaseId
      );
    } catch (err2) {
      try {
        return initializeFirestore(
          app,
          {
            experimentalForceLongPolling: true
          },
          targetDatabaseId
        );
      } catch (err3) {
        return getFirestore(app, targetDatabaseId);
      }
    }
  }
}

export const db = createFirestoreInstance();
