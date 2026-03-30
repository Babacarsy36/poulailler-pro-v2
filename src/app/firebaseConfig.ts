import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REMPLACER PAR VOS PROPRES CLÉS FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCKTs0HDIsrep_8xKvLqHBSiyy79GvaD2k",
  authDomain: "poulaillerpro.firebaseapp.com",
  databaseURL: "https://poulaillerpro-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "poulaillerpro",
  storageBucket: "poulaillerpro.firebasestorage.app",
  messagingSenderId: "1094152963862",
  appId: "1:1094152963862:web:f76e1a89cd28dc66953237",
  measurementId: "G-DFCLHVH5DL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
