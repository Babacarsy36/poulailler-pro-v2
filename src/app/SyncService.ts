import { db, auth } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot, DocumentReference } from "firebase/firestore";
import { StorageService } from "./services/StorageService";

const STORAGE_KEYS = ["chickens", "eggs", "feed", "health", "finances", "incubation", "vaccine_reminders"];

export interface SyncItem {
  id: string;
  updatedAt?: number;
  _deleted?: boolean;
  [key: string]: string | number | boolean | undefined | string[] | number[] | boolean[] | object | null;
}

export const SyncService = {
  // Helper to get correctly scoped doc ref
  getDocRef(key: string, id: string, isFarm = false): DocumentReference {
    if (isFarm) {
      return doc(db, "farms", id, "collections", key);
    }
    return doc(db, "users", id, "collections", key);
  },

  // Merge logic: newest updatedAt wins
  mergeData<T extends SyncItem>(local: T[], cloud: T[]): T[] {
    const merged = new Map<string, T>();
    
    // Process local then cloud to handle merges
    // Note: We MUST keep items with _deleted: true in the final array 
    // so they can be pushed/pulled as tombstones.
    [...local, ...cloud].forEach(item => {
      if (!item.id) return;
      const existing = merged.get(item.id);
      
      // Merge Strategy:
      // 1. If no existing, take it.
      // 2. If item is newer (higher updatedAt), take it.
      // 3. If updatedAt is equal, take the one that is marked as deleted (deletes win tie-breaks)
      const itemTime = Number(item.updatedAt) || 0;
      const existingTime = Number(existing?.updatedAt) || 0;

      if (!existing || itemTime > existingTime || (itemTime === existingTime && item._deleted)) {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  },

  // Pushes local data to the cloud with merging
  async pushLocalToCloud(id?: string, isFarm = false) {
    const targetId = id || auth.currentUser?.uid;
    if (!targetId) return;

    for (const key of STORAGE_KEYS) {
      try {
        const localData = StorageService.getItem<SyncItem[]>(key) || [];
        const docRef = this.getDocRef(key, targetId, isFarm);
        const docSnap = await getDoc(docRef);
        
        let finalData = localData;
        if (docSnap.exists()) {
          const cloudData = docSnap.data().data as SyncItem[];
          finalData = this.mergeData(localData, cloudData);
        }

        await setDoc(docRef, { data: finalData, lastUpdated: Date.now() });
        StorageService.setItem(key, finalData);
      } catch (err) {
        console.error(`Failed to push ${key} to cloud:`, err);
      }
    }
  },

  // Pulls cloud data to local storage with merging
  async pullCloudToLocal(id?: string, isFarm = false, specificKey?: string) {
    const targetId = id || auth.currentUser?.uid;
    if (!targetId) return;

    const keys = specificKey ? [specificKey] : STORAGE_KEYS;
    
    // Pull in parallel for better performance
    await Promise.all(keys.map(async (key) => {
      try {
        const docRef = this.getDocRef(key, targetId, isFarm);
        let docSnap = await getDoc(docRef);
        
        // Fallback for 'finances' -> try 'transactions' legacy document
        if (!docSnap.exists() && key === 'finances') {
          const legacyRef = this.getDocRef('transactions', targetId, isFarm);
          docSnap = await getDoc(legacyRef);
        }

        if (docSnap.exists()) {
          const cloudData = docSnap.data().data as SyncItem[];
          const localData = StorageService.getItem<SyncItem[]>(key) || [];
          const mergedData = this.mergeData(localData, cloudData);
          StorageService.setItem(key, mergedData);
        }
      } catch (err) {
        console.error(`Failed to pull ${key} from cloud:`, err);
      }
    }));
  },

  // Subscribes to cloud changes
  startRealtimeSync(onUpdate: () => void, id?: string, isFarm = false) {
    const targetId = id || auth.currentUser?.uid;
    if (!targetId) return () => {};

    const unsubscribes = STORAGE_KEYS.map(key => {
      const docRef = this.getDocRef(key, targetId, isFarm);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.metadata.hasPendingWrites === false) {
           const cloudData = docSnap.data().data as SyncItem[];
           const localData = StorageService.getItem<SyncItem[]>(key) || [];
           const mergedData = this.mergeData(localData, cloudData);
           StorageService.setItem(key, mergedData);
           onUpdate();
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  },

  // Save utility with updatedAt timestamp
  async saveCollection<T extends SyncItem>(key: string, data: T[], id?: string, isFarm = false) {
    const now = Date.now();
    const dataWithTimestamp = data.map(item => ({
      ...item,
      updatedAt: item.updatedAt || now
    }));

    StorageService.setItem(key, dataWithTimestamp);
    
    const targetId = id || auth.currentUser?.uid;
    if (targetId) {
      try {
        const docRef = this.getDocRef(key, targetId, isFarm);
        const docSnap = await getDoc(docRef);
        let finalData: T[] = dataWithTimestamp as T[];
        
        if (docSnap.exists()) {
          const cloudData = docSnap.data().data as T[];
          finalData = this.mergeData(dataWithTimestamp as T[], cloudData);
        }
        
        await setDoc(docRef, { data: finalData, lastUpdated: now });
      } catch (err) {
        console.error(`Failed to save ${key} to cloud:`, err);
      }
    }
  },

  // Recovers data from legacy keys or cloud if missing
  async recoverLegacyData(id?: string) {
    const targetId = id || auth.currentUser?.uid;
    if (!targetId) return { success: false, message: "Non connecté" };

    let recoveredCount = 0;
    for (const key of STORAGE_KEYS) {
        // 1. Try local legacy key
        const legacyData = localStorage.getItem(key);
        if (legacyData) {
            try {
                const parsed = JSON.parse(legacyData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    StorageService.setItem(key, parsed);
                    recoveredCount += parsed.length;
                }
            } catch (e) {}
        }
        
        // 2. Force pull from cloud
        try {
            const docRef = this.getDocRef(key, targetId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const cloudData = docSnap.data().data as SyncItem[];
                const localData = StorageService.getItem<SyncItem[]>(key) || [];
                const merged = this.mergeData(localData, cloudData);
                StorageService.setItem(key, merged);
                recoveredCount += cloudData.length;
            }
        } catch (e) {}
    }

    return { 
        success: recoveredCount > 0, 
        count: recoveredCount,
        message: recoveredCount > 0 ? `${recoveredCount} éléments récupérés.` : "Aucune donnée trouvée." 
    };
  },

  // Injects realistic test scenarios - PROTECTED
  async injectTestData(id?: string, isFarm = false) {
    const secret = window.prompt("Entrez le code administrateur pour injecter des données de test :");
    if (secret !== "BABS2024") {
      alert("Accès refusé.");
      return false;
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const targetId = id || auth.currentUser?.uid;
    if (!targetId) return false;

    const testChickens: SyncItem[] = [
      { id: "test1", name: "Lot 01", poultryType: "poulet", breed: "Goliath", age: 4, ageUnit: "months", count: 120, femaleCount: 100, maleCount: 20, status: "active", startDate: new Date(now - 120 * day).toISOString().split('T')[0], updatedAt: now },
      { id: "test2", name: "Poussins Janvier", poultryType: "poulet", breed: "Goliath", age: 3, ageUnit: "weeks", count: 250, femaleCount: 125, maleCount: 125, status: "active", startDate: new Date(now - 21 * day).toISOString().split('T')[0], updatedAt: now },
      { id: "test3", name: "Cailles Ponte", poultryType: "caille", breed: "Japonaise", age: 6, ageUnit: "months", count: 300, femaleCount: 250, maleCount: 50, status: "active", startDate: new Date(now - 180 * day).toISOString().split('T')[0], updatedAt: now },
      { id: "test4", name: "Anciennes Pondeuses", poultryType: "poulet", breed: "Pondeuse", age: 18, ageUnit: "months", count: 50, femaleCount: 50, maleCount: 0, status: "retraite", startDate: new Date(now - 500 * day).toISOString().split('T')[0], updatedAt: now }
    ];

    const testEggs: SyncItem[] = Array.from({ length: 14 }).map((_, i) => ({
      id: `egg${i}`,
      date: new Date(now - i * day).toISOString().split('T')[0],
      quantity: Math.floor(70 + Math.random() * 20),
      poultryType: "poulet",
      poultryBreed: "Goliath",
      notes: "Récolte standard",
      updatedAt: now
    }));

    const testFeed: SyncItem[] = [
      { id: "f1", date: new Date(now - 10 * day).toISOString().split('T')[0], type: "achat", quantity: 500, name: "Aliment Démarrage", cost: 150000, updatedAt: now },
      { id: "f2", date: new Date(now - 2 * day).toISOString().split('T')[0], type: "utilisation", quantity: 25, name: "Aliment Finition", updatedAt: now }
    ];

    const testHealth: SyncItem[] = [
      { id: "h1", date: new Date(now - 5 * day).toISOString().split('T')[0], batchName: "Lot 01", diagnosis: "Vaccination Newcastle", treatment: "HB1", cost: 5000, status: "completed", updatedAt: now }
    ];

    const testFinances: SyncItem[] = [
      { id: "fin1", date: new Date(now - 15 * day).toISOString().split('T')[0], category: "vente", description: "Vente 50 Coqs Goliath", amount: 350000, type: "income", updatedAt: now },
      { id: "fin2", date: new Date(now - 5 * day).toISOString().split('T')[0], category: "autre", description: "Achat abreuvoirs", amount: 45000, type: "expense", updatedAt: now }
    ];

    const testIncubation: SyncItem[] = [
      { id: "inc1", name: "Couveuse A", startDate: new Date(now - 10 * day).toISOString().split('T')[0], eggCount: 150, breed: "Goliath", status: "incubating", updatedAt: now }
    ];

    await this.saveCollection("chickens", testChickens, targetId, isFarm);
    await this.saveCollection("eggs", testEggs, targetId, isFarm);
    await this.saveCollection("feed", testFeed, targetId, isFarm);
    await this.saveCollection("health", testHealth, targetId, isFarm);
    await this.saveCollection("finances", testFinances, targetId, isFarm);
    await this.saveCollection("incubation", testIncubation, targetId, isFarm);
    
    return true;
  }
};
