import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config fallbacks included below to support environments without .env variables

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKTs0HDIsrep_8xKvLqHBSiyy79GvaD2k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "poulaillerpro.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://poulaillerpro-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "poulaillerpro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "poulaillerpro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1094152963862",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1094152963862:web:f76e1a89cd28dc66953237",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DFCLHVH5DL",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
