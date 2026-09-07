import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspect() {
  console.log('Inspecting Firestore database:', firebaseConfig.firestoreDatabaseId);

  // Check curtain_installer collection
  const mainDoc = await getDoc(doc(db, 'curtain_installer', 'main_state'));
  if (mainDoc.exists()) {
    const data = mainDoc.data();
    console.log('Found curtain_installer/main_state:');
    console.log('Teams count:', data.teams?.length);
    console.log('Jobs count:', data.jobs?.length);
    if (data.jobs && data.jobs.length > 0) {
      console.log('Sample job order numbers:', data.jobs.map((j: any) => `${j.id}: ${j.orderNo || j.customerName || j.date}`));
    }
    console.log('Updated at:', data.updatedAt);
  } else {
    console.log('curtain_installer/main_state does not exist');
  }

  // Check if any other collections exist
  const collectionsToCheck = ['jobs', 'teams', 'backup', 'backups', 'curtain_installer', 'history', 'snapshots'];
  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection '${colName}': ${snap.size} documents`);
      snap.forEach(d => {
        console.log(`  Doc ID: ${d.id}`);
      });
    } catch (e: any) {
      console.log(`Error reading ${colName}:`, e.message);
    }
  }
}

inspect().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
