import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail, // Added for Forgot Password
} from 'firebase/auth';
import {
  initializeFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// ── Auth ──────────────────────────────────────────
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ── Firestore (Deep Fix for Hotspots) ─────────────
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// ── Auth helpers ──────────────────────────────────
export const loginWithGoogle   = () => signInWithPopup(auth, googleProvider);
export const loginWithEmail    = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const registerWithEmail = (email, pw) => createUserWithEmailAndPassword(auth, email, pw);
export const logout            = () => signOut(auth);
export const onAuthChange      = (cb) => onAuthStateChanged(auth, cb);

/** 🛠️ NEW: Reset Password Helper */
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email.toLowerCase().trim());
};

// ── Capsule helpers ───────────────────────────────

/** Create a new capsule */
export async function createCapsule(userId, data) {
  const toTimestamp = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
  };

  return addDoc(collection(db, 'capsules'), {
    userId,
    title: data.title || 'Untitled',
    content: data.content || '',
    createdAt: serverTimestamp(),
    unlockAt: toTimestamp(data.unlockAt),
    autoExpireAt: toTimestamp(data.autoExpireAt),
    recipientEmail: data.recipientEmail ? data.recipientEmail.toLowerCase().trim() : null,
    senderEmail: auth.currentUser?.email || null,
    destroyAfterView: data.destroyAfterView ?? false,
    viewed: false,     // Critical for dashboard logic
    destroyed: false,  // Critical for dashboard logic
    isGhost: data.isGhost ?? false,
  });
}

/** Fetch all capsules (Sent & Received) */
export const fetchCapsules = async (userId, userEmail) => {
  if (!userId || !userEmail) return [];

  const normalizedEmail = userEmail.toLowerCase().trim();

  try {
    const qOwned = query(collection(db, "capsules"), where("userId", "==", userId));
    const qReceived = query(collection(db, "capsules"), where("recipientEmail", "==", normalizedEmail));

    const [snapOwned, snapReceived] = await Promise.all([getDocs(qOwned), getDocs(qReceived)]);

    const allDocs = [...snapOwned.docs, ...snapReceived.docs];
    const uniqueCapsules = [];
    const seenIds = new Set();

    allDocs.forEach(d => {
      if (!seenIds.has(d.id)) {
        uniqueCapsules.push({ id: d.id, ...d.data() });
        seenIds.add(d.id);
      }
    });

    uniqueCapsules.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    return uniqueCapsules;
  } catch (error) {
    console.error("❌ Sync Error:", error);
    return [];
  }
};

/** Mark a capsule as viewed; optionally destroy it */
export async function openCapsule(capsuleId, destroyAfterView) {
  const ref = doc(db, 'capsules', capsuleId);
  try {
    if (destroyAfterView) {
      await updateDoc(ref, { 
        viewed: true, 
        destroyed: true, 
        content: '[MEMORY DESTROYED]' 
      });
    } else {
      await updateDoc(ref, { viewed: true });
    }
  } catch (error) {
    console.error("❌ Open Error:", error);
  }
}

export async function deleteCapsule(capsuleId) {
  return deleteDoc(doc(db, 'capsules', capsuleId));
}

// ── Ghost Wall helpers ────────────────────────────
export async function postGhostMessage(userId, handle, message) {
  return addDoc(collection(db, 'ghosts'), {
    userId,
    handle: handle || 'Anonymous',
    message,
    createdAt: serverTimestamp(),
  });
}

export async function fetchGhostMessages() {
  try {
    const q = query(collection(db, 'ghosts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    return [];
  }
}

export default app;