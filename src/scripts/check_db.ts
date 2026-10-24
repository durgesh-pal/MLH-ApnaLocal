import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const check = async () => {
  const snapshot = await getDocs(collection(db, 'providerProfiles'));
  console.log("Total providers in Firestore:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
  process.exit(0);
};

check().catch(err => {
  console.error(err);
  process.exit(1);
});
