import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { SyncService, SyncItem } from './SyncService';
import { StorageService } from './services/StorageService';
import { Alert, AlertService } from './services/AlertService';
import { toast } from 'sonner';
import { UserRole, PoultryType, SubscriptionTier } from './types';
export type { PoultryType };

export type PoultryBreed = 'fermier' | 'ornement' | 'pondeuse' | 'chair' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    poultryType: PoultryType | null;
    selectedBreeds: string[];
    role: UserRole;
    farmId: string | null;
    syncTrigger: number;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    updatePoultrySelection: (type: PoultryType | null, breeds: string[]) => void;
    clearSelection: () => void;
    isSyncing: boolean;
    tier: SubscriptionTier;
    hasAccess: (requiredTier: SubscriptionTier) => boolean;
    setTierAction: (newTier: SubscriptionTier) => Promise<void>;
    saveData: <T extends SyncItem>(key: string, data: T[]) => Promise<void>;
    alerts: Alert[];
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [poultryType, setPoultryType] = useState<PoultryType | null>(null);
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
    const [syncTrigger, setSyncTrigger] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [tier, setTier] = useState<SubscriptionTier>('FREE');
    const [role, setRole] = useState<UserRole>('owner');
    const [farmId, setFarmId] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
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
                // RUN MIGRATION ON LOG IN / LOAD
                StorageService.migrateAll();

                // Background cloud pull - pass UID explicitly to avoid race conditions
                setIsSyncing(true);
                SyncService.pullCloudToLocal(currentUser.uid).finally(() => {
                    setIsSyncing(false);
                    setSyncTrigger(prev => prev + 1);
                });

                // Check for pending invitations
                const checkInvitations = async () => {
                    if (!currentUser.email) return;
                    const invQ = query(collection(db, "invitations"), 
                        where("email", "==", currentUser.email.toLowerCase()), 
                        where("status", "==", "pending")
                    );
                    const invSnap = await getDocs(invQ);
                    
                    if (!invSnap.empty) {
                        const invitation = invSnap.docs[0].data();
                        const invId = invSnap.docs[0].id;
                        
                        await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'), {
                            role: invitation.role,
                            farmId: invitation.farmId,
                            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                            updatedAt: Date.now()
                        });
                        
                        await updateDoc(doc(db, "invitations", invId), {
                            status: 'accepted',
                            acceptedAt: Date.now(),
                            acceptedBy: currentUser.uid
                        });
                        
                        toast.success(`Invitation acceptée ! Vous avez rejoint la ferme de ${invitation.senderName}`);
                    }
                };

                checkInvitations();

                // Initial load of profile if exists (onSnapshot will take over for updates)
                getDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile')).then(async (profDoc) => {
                    if (!profDoc.exists()) {
                        // Initialize new user as owner of their own farm if no profile exists
                        await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'), {
                            role: 'owner',
                            farmId: currentUser.uid,
                            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                            updatedAt: Date.now()
                        });
                    }
                });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Realtime sync of user settings/preferences
    useEffect(() => {
        if (!user) return;
        
        const unsubPrefs = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (prefsDoc) => {
            if (prefsDoc.exists()) {
                const data = prefsDoc.data();
                if (data.selectedBreeds) {
                    setSelectedBreeds(data.selectedBreeds);
                    localStorage.setItem('selected_breeds', JSON.stringify(data.selectedBreeds));
                }
                if (data.poultryType) {
                    setPoultryType(data.poultryType as PoultryType);
                    localStorage.setItem('poultry_type', data.poultryType);
                }
            }
        });

        const unsubProfile = onSnapshot(doc(db, 'users', user.uid, 'settings', 'profile'), (profileDoc) => {
            if (profileDoc.exists()) {
                const data = profileDoc.data();
                if (data.role) setRole(data.role as UserRole);
                if (data.farmId) setFarmId(data.farmId);
                if (data.tier) setTier(data.tier as SubscriptionTier);
                else if (data.isPro) setTier('PRO');
            }
        });

        return () => {
            unsubPrefs();
            unsubProfile();
        };
    }, [user]);

    useEffect(() => {
        if (user && farmId) {
            const stopSync = SyncService.startRealtimeSync(() => {
                setSyncTrigger(prev => prev + 1);
            }, farmId, farmId !== user.uid);
            return () => stopSync();
        }
    }, [user, farmId]);

    // Load selection from localStorage on mount
    useEffect(() => {
        const savedType = localStorage.getItem('poultry_type') as PoultryType;
        const savedBreeds = localStorage.getItem('selected_breeds');
        if (savedType) setPoultryType(savedType);
        if (savedBreeds) {
            try {
                setSelectedBreeds(JSON.parse(savedBreeds));
            } catch (e) {
                setSelectedBreeds([]);
            }
        }
    }, []);

    const updatePoultrySelection = async (type: PoultryType | null, breeds: string[]) => {
        setPoultryType(type);
        setSelectedBreeds(breeds);
        
        localStorage.setItem('has_selected_species', 'true');
        
        if (type) localStorage.setItem('poultry_type', type);
        else localStorage.removeItem('poultry_type');
        
        localStorage.setItem('selected_breeds', JSON.stringify(breeds));
        localStorage.removeItem('poultry_breed'); // Clean legacy

        // Fire-and-forget: don't block navigation
        if (user) {
            setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
                poultryType: type,
                selectedBreeds: breeds,
                lastUpdated: Date.now()
            }).catch(() => {});
        }
    };

    const clearSelection = () => {
        setPoultryType(null);
        setSelectedBreeds([]);
    };

    // Recalculate alerts when data Changes
    useEffect(() => {
        if (user) {
            // Updated AlertService to take the first breed or generic if multiple (needs fix in AlertService later)
            const newAlerts = AlertService.getAlerts(poultryType || undefined, selectedBreeds[0] || undefined);
            setAlerts(newAlerts);
        }
    }, [syncTrigger, poultryType, selectedBreeds, user]);

    const saveData = async <T extends SyncItem>(key: string, data: T[]) => {
        const isFarm = !!farmId && farmId !== user?.uid;
        const targetId = farmId || user?.uid;
        if (targetId) {
            await SyncService.saveCollection(key, data, targetId, isFarm);
            setSyncTrigger(prev => prev + 1);
        }
    };

    const setTierAction = async (newTier: SubscriptionTier) => {
        if (!user) return;
        try {
            setTier(newTier);
            // Save to root document for maximum reliability
            await setDoc(doc(db, 'users', user.uid), {
                tier: newTier,
                updatedAt: Date.now()
            }, { merge: true });
            toast.success(`Niveau ${newTier} activé !`);
        } catch (err) {
            console.error("Tier upgrade failed:", err);
            // In test/demo mode, we keep the state even if firestore fails
            setTier(newTier);
            toast.success(`Mode ${newTier} activé (Test)`);
        }
    };

    const hasAccess = (requiredTier: SubscriptionTier): boolean => {
        if (requiredTier === 'FREE') return true;
        if (requiredTier === 'PRO') return tier === 'PRO' || tier === 'BUSINESS';
        if (requiredTier === 'BUSINESS') return tier === 'BUSINESS';
        return false;
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // StorageService.clear(); // Disabled to prevent losing offline data!
            clearSelection();
            setSyncTrigger(prev => prev + 1);
            toast.success("Déconnexion réussie.");
        } catch (err) {
            toast.error("Erreur lors de la déconnexion.");
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user,
            loading,
            poultryType, 
            selectedBreeds, 
            syncTrigger,
            isDarkMode,
            toggleDarkMode,
            updatePoultrySelection,
            clearSelection,
            isSyncing,
            tier,
            hasAccess,
            setTierAction,
            saveData,
            alerts,
            role,
            farmId,
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
