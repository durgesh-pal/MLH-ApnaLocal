import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';
import { Mail, Lock, LogIn, Sparkles, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole;
  const isVerifyMode = searchParams.get('verify') === 'required' || searchParams.get('source') === 'tech_intro';

  useEffect(() => {
    const checkRedirect = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const role = localStorage.getItem('pending_role') as UserRole || 'customer';
          await handleAuthSuccess(result.user, role);
          localStorage.removeItem('pending_role');
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        setError(err.message || 'Failed to complete redirect login');
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleAuthSuccess = async (user: FirebaseUser, role: UserRole) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const isAdminEmail = user.email === 'durgesh00991@gmail.com' || user.email === 'dharmendradharmendrapal640@gmail.com';
    const effectiveRole = isAdminEmail ? 'admin' : (userSnap.exists() ? (userSnap.data()?.role || role) : role);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        role: effectiveRole,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
      });
      
      if (effectiveRole === 'customer') {
        await setDoc(doc(db, 'customerProfiles', user.uid), {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      } else if (effectiveRole === 'provider') {
        await setDoc(doc(db, 'providerProfiles', user.uid), {
          userId: user.uid,
          verificationStatus: 'unverified',
          createdAt: serverTimestamp(),
        });
      }
    } else if (isAdminEmail && userSnap.data()?.role !== 'admin') {
      await setDoc(userRef, { role: 'admin' }, { merge: true });
    }

    if (effectiveRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (authError: any) {
        // Auto-create account if user is trying to login with admin email or new account
        if (
          authError.code === 'auth/user-not-found' || 
          authError.code === 'auth/invalid-credential' ||
          email.trim() === 'durgesh00991@gmail.com'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            if (userCredential.user) {
              await sendEmailVerification(userCredential.user);
              setInfoMsg('Account created & verification email sent. Please check your inbox.');
            }
          } catch (createErr: any) {
            throw authError; // throw original
          }
        } else {
          throw authError;
        }
      }

      if (userCredential?.user) {
        const role = roleParam || (email.trim() === 'durgesh00991@gmail.com' ? 'admin' : 'customer');
        await handleAuthSuccess(userCredential.user, role);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid password or credentials. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please reset password or try again later.');
      } else {
        setError(err.message || 'Login failed. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const role = roleParam || 'customer';
    localStorage.setItem('pending_role', role);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start Google login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="card max-w-md w-full p-8 bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">ApnaLocal</Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
            {isVerifyMode ? 'User Verification' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isVerifyMode 
              ? 'Complete sign in to verify your identity and save your data'
              : 'Sign in to manage services or district admin portal'}
          </p>
        </div>

        {isVerifyMode && (
          <div className="mb-6 p-4 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-900 dark:text-cyan-300">Identity Verification Gateway</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Your profile data will be securely synced with the Jaunpur database upon login.</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-2">
            <CheckCircle size={18} className="shrink-0 text-blue-500" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. durgesh00991@gmail.com"
                className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium text-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium text-sm transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full h-12 text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Authenticating...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-white/10 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest absolute">OR</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-12 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors font-bold text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Designated Admin Email: <span className="font-bold text-slate-900 dark:text-white">durgesh00991@gmail.com</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account? {' '}
            <Link to="/register" className="text-slate-900 dark:text-cyan-400 font-bold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
