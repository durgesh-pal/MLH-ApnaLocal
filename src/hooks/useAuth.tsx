import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isProvider: boolean;
  isCustomer: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  isAdmin: false,
  isProvider: false,
  isCustomer: false,
  isEmailVerified: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const isAdminEmail = fUser.email === 'durgesh00991@gmail.com' || fUser.email === 'dharmendradharmendrapal640@gmail.com';
        
        try {
          const userRef = doc(db, 'users', fUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            if (isAdminEmail && data.role !== 'admin') {
              await setDoc(userRef, { role: 'admin' }, { merge: true });
              data.role = 'admin';
            }
            setUser(data);
          } else {
            const newUserData: User = {
              uid: fUser.uid,
              email: fUser.email || '',
              displayName: fUser.displayName || fUser.email?.split('@')[0] || 'User',
              role: isAdminEmail ? 'admin' : 'customer',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, {
              ...newUserData,
              createdAt: serverTimestamp()
            });
            setUser(newUserData);
          }
        } catch (error) {
          console.warn("Firestore user doc fetch warning, fallback to memory user object:", error);
          setUser({
            uid: fUser.uid,
            email: fUser.email || '',
            displayName: fUser.displayName || fUser.email?.split('@')[0] || 'User',
            role: isAdminEmail ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = user?.role === 'admin' || firebaseUser?.email === 'durgesh00991@gmail.com' || firebaseUser?.email === 'dharmendradharmendrapal640@gmail.com';

  const value = {
    user,
    firebaseUser,
    loading,
    isAdmin,
    isProvider: user?.role === 'provider',
    isCustomer: user?.role === 'customer',
    isEmailVerified: firebaseUser?.emailVerified === true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
