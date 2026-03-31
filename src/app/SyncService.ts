import { db, auth } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";

const STORAGE_KEYS = ["chickens", "eggs", "feed", "health", "finances", "incubation"];

export const SyncService = {
  // Pushes local data to the cloud
  async pushLocalToCloud() {
    const user = auth.currentUser;
    if (!user) return;

    for (const key of STORAGE_KEYS) {
      const localData = JSON.parse(localStorage.getItem(key) || "[]");
      const userDocRef = doc(db, "users", user.uid, "collections", key);
      await setDoc(userDocRef, { data: localData, lastUpdated: Date.now() });
    }
  },

  // Pulls cloud data to local storage
  async pullCloudToLocal() {
    const user = auth.currentUser;
    if (!user) return;

    for (const key of STORAGE_KEYS) {
      const userDocRef = doc(db, "users", user.uid, "collections", key);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        localStorage.setItem(key, JSON.stringify(docSnap.data().data));
      }
    }
  },

  // Subscribes to cloud changes
  startRealtimeSync(onUpdate: () => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const unsubscribes = STORAGE_KEYS.map(key => {
      return onSnapshot(doc(db, "users", user.uid, "collections", key), (docSnap) => {
        if (docSnap.exists() && docSnap.metadata.hasPendingWrites === false) {
           // Update local only if change comes from server
           localStorage.setItem(key, JSON.stringify(docSnap.data().data));
           onUpdate();
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  },

  // Save utility to be used by components
  async saveCollection(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid, "collections", key);
      await setDoc(userDocRef, { data, lastUpdated: Date.now() });
    }
  }
};
