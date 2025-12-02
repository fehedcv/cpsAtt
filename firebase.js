// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { 
  getFirestore 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later
const firebaseConfig = {
  apiKey: "AIzaSyB-6UzFVKD4XwQPKDFCcN3tDWdoU9WhlX4",
  authDomain: "cps-attendance.firebaseapp.com",
  projectId: "cps-attendance",
  storageBucket: "cps-attendance.firebasestorage.app",
  messagingSenderId: "358194664623",
  appId: "1:358194664623:web:923c31d88f5602d90bf05a",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Login function
export function adminLogin() {
  return signInWithPopup(auth, provider);
}

// Logout function
export function adminLogout() {
  return signOut(auth);
}

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
