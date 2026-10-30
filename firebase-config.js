// ================================================================
// HabitFlow — Firebase Configuration & Modular SDK Bridge
// Project: habitflow-haldia
// Auth: Google Sign-in | Database: Cloud Firestore
// Stack: Modular Firebase v10 via Google CDN (Zero-build native ESM)
// ================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Provided Web App Configuration (habitflow-haldia)
export const firebaseConfig = {
  apiKey: "AIzaSyDY9nWl0_9l-J1zjtUWEoPESvOCYst-m68",
  authDomain: "habitflow-haldia.firebaseapp.com",
  projectId: "habitflow-haldia",
  storageBucket: "habitflow-haldia.firebasestorage.app",
  messagingSenderId: "396835034856",
  appId: "1:396835034856:web:fac955c2eca245dca91b5d",
  measurementId: "G-K8QE83SKCG"
};

// Initialize Firebase App
let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let isFirebaseAvailable = false;

try {
  app = initializeApp(firebaseConfig);

  // Initialize Auth
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Initialize Firestore with IndexedDB multi-tab persistent cache
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (firestoreInitErr) {
    console.warn('HabitFlow: Persistent cache init failed, falling back to standard Firestore:', firestoreInitErr);
    db = initializeFirestore(app, {});
  }

  isFirebaseAvailable = true;
  console.log('HabitFlow: Firebase v10 initialized successfully (habitflow-haldia).');
} catch (err) {
  console.warn('HabitFlow: Firebase initialization failed. Falling back to Guest Mode (localStorage):', err);
  isFirebaseAvailable = false;
}

/**
 * Trigger Google Sign-In via Popup (with fallback to Redirect if popup is blocked)
 */
export async function signInWithGoogle(useRedirect = false) {
  if (!isFirebaseAvailable || !auth || !googleProvider) {
    throw new Error('Firebase Authentication is not available. Please check internet connection.');
  }

  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    // If popup was blocked by browser, try redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.warn('HabitFlow: Popup blocked, falling back to signInWithRedirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

/**
 * Sign out current user safely (does NOT wipe localStorage)
 */
export async function signOutUser() {
  if (!isFirebaseAvailable || !auth) return;
  await signOut(auth);
}

/**
 * Check for redirect sign-in result on page load
 */
export async function checkRedirectAuth() {
  if (!isFirebaseAvailable || !auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.warn('HabitFlow: Error processing redirect result:', error);
    throw error;
  }
}

export {
  app,
  auth,
  db,
  googleProvider,
  isFirebaseAvailable,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp
};
