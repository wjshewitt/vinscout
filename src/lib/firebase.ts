// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "vigilante-garage",
  appId: "1:109449796594:web:9cdb5b50aed0dfa46ce96b",
  storageBucket: "vigilante-garage.firebasestorage.app",
  apiKey: "AIzaSyBdqrM1jTSCT3Iv4alBwpt1I48f4v4qZOg",
  authDomain: "vigilante-garage.firebaseapp.com",
  messagingSenderId: "109449796594",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return null;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
}

export { auth, signInWithGoogle, logout };
