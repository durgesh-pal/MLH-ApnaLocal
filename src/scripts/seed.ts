import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const seed = async () => {
  console.log("Seeding database...");

  const categories = [
    { id: 'cat1', name: 'Plumbing', icon: '🚰', description: 'Leakage, pipes, and tanks' },
    { id: 'cat2', name: 'Electrician', icon: '⚡', description: 'Wiring, switches, and appliances' },
    { id: 'cat3', name: 'Cleaning', icon: '🧹', description: 'Deep house cleaning' },
    { id: 'cat4', name: 'AC Repair', icon: '❄️', description: 'AC servicing and gas filling' },
  ];

  for (const cat of categories) {
    await setDoc(doc(db, 'serviceCategories', cat.id), {
      ...cat,
      createdAt: serverTimestamp(),
    });
  }

  // Seed some dummy providers
  const dummyProviders = [
    {
      uid: 'demo_p1',
      email: 'rajesh@example.com',
      displayName: 'Rajesh Kumar',
      role: 'provider',
      businessName: 'Rajesh Plumbing Works',
      skills: ['Plumbing', 'Leakage Repair'],
      locality: 'Civil Lines, Jaunpur',
      verificationStatus: 'verified',
      rating: 4.8,
      reviewCount: 124,
      photoURL: 'https://images.unsplash.com/photo-1540560339329-02f9f637ef39?auto=format&fit=crop&q=80&w=200'
    },
    {
      uid: 'demo_p2',
      email: 'amit@example.com',
      displayName: 'Amit Singh',
      role: 'provider',
      businessName: 'Singh Electricals',
      skills: ['Electrician', 'Wiring'],
      locality: 'Olandganj, Jaunpur',
      verificationStatus: 'verified',
      rating: 4.6,
      reviewCount: 89,
      photoURL: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200'
    }
  ];

  for (const p of dummyProviders) {
    // Create user doc
    await setDoc(doc(db, 'users', p.uid), {
      uid: p.uid,
      email: p.email,
      displayName: p.displayName,
      role: p.role,
      photoURL: p.photoURL,
      createdAt: serverTimestamp(),
    });

    // Create provider profile
    await setDoc(doc(db, 'providerProfiles', p.uid), {
      userId: p.uid,
      businessName: p.businessName,
      skills: p.skills,
      locality: p.locality,
      verificationStatus: p.verificationStatus,
      rating: p.rating,
      reviewCount: p.reviewCount,
      completedJobs: 10,
      createdAt: serverTimestamp(),
    });
  }

  console.log("Seeding complete!");
  process.exit(0);
};

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
