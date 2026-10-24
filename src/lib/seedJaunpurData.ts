import { collection, addDoc, getDocs, query, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { JAUNPUR_LOCALITIES } from './localities';

const CATEGORIES = [
  { name: 'Electrician', icon: '⚡' },
  { name: 'Plumbing', icon: '🚰' },
  { name: 'Mechanic', icon: '🔧' },
  { name: 'AC Repair', icon: '❄️' },
  { name: 'Carpenter', icon: '🪵' },
  { name: 'Cleaning', icon: '✨' },
  { name: 'Tutor', icon: '📚' },
  { name: 'Beauty', icon: '💄' },
];

const FIRST_NAMES = ['Rajesh', 'Amit', 'Suresh', 'Manoj', 'Deepak', 'Sunil', 'Vijay', 'Pooja', 'Anita', 'Rahul', 'Alok', 'Vikram', 'Pankaj', 'Sanjay'];
const LAST_NAMES = ['Kumar', 'Singh', 'Sharma', 'Verma', 'Yadav', 'Mishra', 'Gupta', 'Patel', 'Dubey', 'Tiwari'];

export async function seedJaunpurProviders() {
  try {
    const existingSnap = await getDocs(query(collection(db, 'providerProfiles')));
    if (!existingSnap.empty) {
      console.log('Providers already exist, skipping seed.');
      return;
    }

    console.log('Seeding Jaunpur providers across all localities...');

    for (const loc of JAUNPUR_LOCALITIES) {
      // 4-5 providers per locality
      for (let i = 0; i < 5; i++) {
        const cat = CATEGORIES[(i + loc.name.length) % CATEGORIES.length];
        const firstName = FIRST_NAMES[(i * 3) % FIRST_NAMES.length];
        const lastName = LAST_NAMES[(i + 2) % LAST_NAMES.length];
        const name = `${firstName} ${lastName}`;
        const businessName = `${lastName} ${cat.name} Expert`;
        const phone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
        const rating = Number((4.5 + Math.random() * 0.4).toFixed(1));
        const reviews = Math.floor(40 + Math.random() * 120);
        const price = `₹${150 + i * 50} (Visit)`;

        const providerData = {
          userId: `seed_${loc.name.toLowerCase().replace(/\s+/g, '_')}_${i}`,
          name,
          businessName,
          category: cat.name,
          locality: loc.name,
          phone,
          rating,
          reviews,
          price,
          verificationStatus: 'verified',
          lat: loc.lat + (Math.random() - 0.5) * 0.01,
          lng: loc.lng + (Math.random() - 0.5) * 0.01,
          bio: `Professional ${cat.name.toLowerCase()} services in ${loc.name}, Jaunpur with over ${5 + i} years of trusted experience. Prompt response and guaranteed satisfaction.`,
          skills: [cat.name, 'Emergency Repair', 'Consultation', 'Maintenance'],
          workingHours: '8:00 AM - 8:00 PM (Daily)',
          photo: `https://images.unsplash.com/photo-${1500000000000 + (i * 123456)? '1540560339329-02f9f637ef39' : '1566492031773-4f4e44671857'}?auto=format&fit=crop&q=80&w=400`,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'providerProfiles', `prov_${loc.name.toLowerCase().replace(/\s+/g, '_')}_${i}`), providerData);
      }
    }
    console.log('Successfully seeded Jaunpur providers!');
  } catch (err) {
    console.error('Error seeding Jaunpur providers:', err);
  }
}
