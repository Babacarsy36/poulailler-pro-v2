import { db, auth } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";

const STORAGE_KEYS = ["chickens", "eggs", "feed", "health", "finances", "incubation"];

export const SyncService = {
  // Pushes local data to the cloud
  async pushLocalToCloud() {
    const user = auth.currentUser;
    if (!user) return;

    for (const key of STORAGE_KEYS) {
      try {
        const localData = JSON.parse(localStorage.getItem(key) || "[]");
        const userDocRef = doc(db, "users", user.uid, "collections", key);
        await setDoc(userDocRef, { data: localData, lastUpdated: Date.now() });
      } catch (err) {
        console.error(`Failed to push ${key} to cloud:`, err);
      }
    }
  },

  // Pulls cloud data to local storage
  async pullCloudToLocal() {
    const user = auth.currentUser;
    if (!user) return;

    for (const key of STORAGE_KEYS) {
      try {
        const userDocRef = doc(db, "users", user.uid, "collections", key);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          localStorage.setItem(key, JSON.stringify(docSnap.data().data));
        }
      } catch (err) {
        console.error(`Failed to pull ${key} from cloud:`, err);
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
  },

  // Injects realistic test scenarios
  async injectTestData() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const testChickens = [
      { id: "test1", name: "Lot 01", poultryType: "poulet", breed: "Goliath", age: 4, ageUnit: "months", count: 120, femaleCount: 100, maleCount: 20, status: "active", startDate: new Date(now - 120 * day).toISOString().split('T')[0] },
      { id: "test2", name: "Poussins Janvier", poultryType: "poulet", breed: "Goliath", age: 3, ageUnit: "weeks", count: 250, femaleCount: 125, maleCount: 125, status: "active", startDate: new Date(now - 21 * day).toISOString().split('T')[0] },
      { id: "test3", name: "Cailles Ponte", poultryType: "caille", breed: "Japonaise", age: 6, ageUnit: "months", count: 300, femaleCount: 250, maleCount: 50, status: "active", startDate: new Date(now - 180 * day).toISOString().split('T')[0] },
      { id: "test4", name: "Anciennes Pondeuses", poultryType: "poulet", breed: "Pondeuse", age: 18, ageUnit: "months", count: 50, femaleCount: 50, maleCount: 0, status: "retraite", startDate: new Date(now - 500 * day).toISOString().split('T')[0] }
    ];

    const testEggs = Array.from({ length: 14 }).map((_, i) => ({
      id: `egg${i}`,
      date: new Date(now - i * day).toISOString().split('T')[0],
      quantity: Math.floor(70 + Math.random() * 20),
      poultryType: "poulet",
      poultryBreed: "Goliath",
      notes: "Récolte standard"
    }));

    const testFeed = [
      { id: "f1", date: new Date(now - 10 * day).toISOString().split('T')[0], type: "achat", quantity: "500", name: "Aliment Démarrage", cost: 150000 },
      { id: "f2", date: new Date(now - 2 * day).toISOString().split('T')[0], type: "utilisation", quantity: "25", name: "Aliment Finition" }
    ];

    const testHealth = [
      { id: "h1", date: new Date(now - 5 * day).toISOString().split('T')[0], batchName: "Lot 01", diagnosis: "Vaccination Newcastle", treatment: "HB1", cost: 5000, status: "completed" }
    ];

    const testFinances = [
      { id: "fin1", date: new Date(now - 15 * day).toISOString().split('T')[0], category: "vente", description: "Vente 50 Coqs Goliath", amount: 350000, type: "income" },
      { id: "fin2", date: new Date(now - 5 * day).toISOString().split('T')[0], category: "autre", description: "Achat abreuvoirs", amount: 45000, type: "expense" }
    ];

    const testIncubation = [
      { id: "inc1", name: "Couveuse A", startDate: new Date(now - 10 * day).toISOString().split('T')[0], eggCount: 150, breed: "Goliath", status: "incubating" }
    ];

    // Bulk save
    await this.saveCollection("chickens", testChickens);
    await this.saveCollection("eggs", testEggs);
    await this.saveCollection("feed", testFeed);
    await this.saveCollection("health", testHealth);
    await this.saveCollection("finances", testFinances);
    await this.saveCollection("incubation", testIncubation);
    
    return true;
  }
};
