import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { SyncService } from './SyncService';

export type PoultryType = 'caille' | 'poulet' | null;
export type PoultryBreed = 'goliath' | 'brahma' | 'cochin' | 'pondeuse' | 'chair' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    poultryType: PoultryType;
    poultryBreed: PoultryBreed;
    syncTrigger: number; // Used to tell components to re-read from localStorage
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    updatePoultrySelection: (type: PoultryType, breed: PoultryBreed) => void;
    clearSelection: () => void;
    isSyncing: boolean;
    isPro: boolean;
    togglePro: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [poultryType, setPoultryType] = useState<PoultryType>(null);
    const [poultryBreed, setPoultryBreed] = useState<PoultryBreed>(null);
    const [syncTrigger, setSyncTrigger] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

    // Persist and apply theme
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    // Listen for Firebase Auth changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Background cloud pull - don't block the UI
                setIsSyncing(true);
                SyncService.pullCloudToLocal().finally(() => {
                    setIsSyncing(false);
                    setSyncTrigger(prev => prev + 1);
                });

                // Pull user preferences (critical but fast)
                getDoc(doc(db, 'users', currentUser.uid, 'settings', 'preferences')).then(prefsDoc => {
                    if (prefsDoc.exists()) {
                        const data = prefsDoc.data();
                        if (data.poultryType) {
                            setPoultryType(data.poultryType);
                            localStorage.setItem('poultry_type', data.poultryType);
                        }
                        if (data.poultryBreed) {
                            setPoultryBreed(data.poultryBreed);
                            localStorage.setItem('poultry_breed', data.poultryBreed);
                        }
                    }
                }).catch(err => console.error("Pref fetch failed:", err));

                // Pull subscription status
                getDoc(doc(db, 'users', currentUser.uid, 'settings', 'subscription')).then(subDoc => {
                    if (subDoc.exists()) {
                        setIsPro(subDoc.data().active === true);
                    }
                }).catch(() => {});
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Start real-time sync when user is logged in
    useEffect(() => {
        if (user) {
            const stopSync = SyncService.startRealtimeSync(() => {
                setSyncTrigger(prev => prev + 1);
            });
            return () => stopSync();
        }
    }, [user]);

    // Load selection from localStorage on mount
    useEffect(() => {
        const savedType = localStorage.getItem('poultry_type') as PoultryType;
        const savedBreed = localStorage.getItem('poultry_breed') as PoultryBreed;
        if (savedType) setPoultryType(savedType);
        if (savedBreed) setPoultryBreed(savedBreed);
    }, []);

    const updatePoultrySelection = async (type: PoultryType, breed: PoultryBreed) => {
        setPoultryType(type);
        setPoultryBreed(breed);
        if (type) localStorage.setItem('poultry_type', type);
        else localStorage.removeItem('poultry_type');
        
        if (breed) localStorage.setItem('poultry_breed', breed);
        else localStorage.removeItem('poultry_breed');

        // Fire-and-forget: don't block navigation
        if (user) {
            setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
                poultryType: type,
                poultryBreed: breed,
                lastUpdated: Date.now()
            }).catch(() => {});
        }
    };

    const clearSelection = () => {
        setPoultryType(null);
        setPoultryBreed(null);
    };

    const togglePro = async () => {
        if (!user) return;
        const newStatus = !isPro;
        setIsPro(newStatus);
        await setDoc(doc(db, 'users', user.uid, 'settings', 'subscription'), {
            active: newStatus,
            updatedAt: Date.now()
        }, { merge: true });
    };

    const logout = async () => {
        await signOut(auth);
        // CRITICAL: Prevent data leak between accounts by wiping all local data
        localStorage.clear();
        clearSelection();
        setSyncTrigger(prev => prev + 1);
    };

    return (
        <AuthContext.Provider value={{ 
            user,
            loading,
            poultryType, 
            poultryBreed, 
            syncTrigger,
            isDarkMode,
            toggleDarkMode,
            updatePoultrySelection,
            clearSelection,
            isSyncing,
            isPro,
            togglePro,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
