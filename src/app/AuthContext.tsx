import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { SyncService, SyncItem } from './SyncService';
import { StorageService } from './services/StorageService';
import { Alert, AlertService } from './services/AlertService';
import { toast } from 'sonner';
import { UserRole, PoultryType } from './types';
export type { PoultryType };

export type PoultryBreed = 'fermier' | 'ornement' | 'pondeuse' | 'chair' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    poultryType: PoultryType | null;
    poultryBreed: PoultryBreed;
    role: UserRole;
    farmId: string | null;
    syncTrigger: number;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    updatePoultrySelection: (type: PoultryType | null, breed: PoultryBreed) => void;
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
    const [poultryBreed, setPoultryBreed] = useState<PoultryBreed>(null);
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

                // Pull user preferences (critical but fast)
                getDoc(doc(db, 'users', currentUser.uid, 'settings', 'preferences')).then(prefsDoc => {
                    if (prefsDoc.exists()) {
                        const data = prefsDoc.data();
                        if (data.poultryType) {
                            setPoultryType(data.poultryType as PoultryType);
                            localStorage.setItem('poultry_type', data.poultryType);
                        }
                        if (data.poultryBreed) {
                            setPoultryBreed(data.poultryBreed as PoultryBreed);
                            localStorage.setItem('poultry_breed', data.poultryBreed);
                        }
                    }
                }).catch(err => console.error("Pref fetch failed:", err));

                // Pull subscription tier from multiple possible locations for reliability
                const checkTier = async (): Promise<SubscriptionTier> => {
                    if (currentUser.email === 'test@poulailler.pro') {
                        return 'PRO';
                    }
                    const rootDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (rootDoc.exists() && rootDoc.data()?.tier) {
                        return rootDoc.data()?.tier as SubscriptionTier;
                    }
                    // Legacy isPro migration
                    if (rootDoc.exists() && rootDoc.data()?.isPro === true) {
                        return 'PRO';
                    }
                    const profileDoc = await getDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'));
                    if (profileDoc.exists() && profileDoc.data()?.tier) {
                        return profileDoc.data()?.tier as SubscriptionTier;
                    }
                    if (profileDoc.exists() && profileDoc.data()?.isPro === true) {
                        return 'PRO';
                    }
                    return 'FREE';
                };
                checkTier().then(t => setTier(t)).catch(() => {});

                // Check for pending invitations before finalizing profile
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
                        
                        // Accept invitation: link user to farm
                        await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'), {
                            role: invitation.role,
                            farmId: invitation.farmId,
                            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                            updatedAt: Date.now()
                        });
                        
                        // Mark invitation as accepted
                        await updateDoc(doc(db, "invitations", invId), {
                            status: 'accepted',
                            acceptedAt: Date.now(),
                            acceptedBy: currentUser.uid
                        });
                        
                        return { role: invitation.role as UserRole, farmId: invitation.farmId as string };
                    }
                    return null;
                };

                // Pull or Initialize Profile & FarmId
                getDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile')).then(async (profDoc) => {
                    let userRole: UserRole = 'owner';
                    let userFarmId = currentUser.uid;

                    if (profDoc.exists()) {
                        const data = profDoc.data();
                        userRole = (data.role as UserRole) || 'owner';
                        userFarmId = data.farmId || currentUser.uid;
                    } else {
                        // Potential new invited user?
                        const acceptedInvite = await checkInvitations();
                        if (acceptedInvite) {
                            userRole = acceptedInvite.role;
                            userFarmId = acceptedInvite.farmId;
                        } else {
                            // Initialize new user as owner of their own farm
                            await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'), {
                                role: 'owner',
                                farmId: currentUser.uid,
                                displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                                updatedAt: Date.now()
                            });
                        }
                    }

                    setRole(userRole);
                    setFarmId(userFarmId);
                    
                    setIsSyncing(true);
                    SyncService.pullCloudToLocal(userFarmId, userFarmId !== currentUser.uid).finally(() => {
                        setIsSyncing(false);
                        setSyncTrigger(prev => prev + 1);
                    });
                }).catch(() => {});
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
        const savedBreed = localStorage.getItem('poultry_breed') as PoultryBreed;
        if (savedType) setPoultryType(savedType);
        if (savedBreed) setPoultryBreed(savedBreed);
    }, []);

    const updatePoultrySelection = async (type: PoultryType | null, breed: PoultryBreed) => {
        setPoultryType(type);
        setPoultryBreed(breed);
        
        localStorage.setItem('has_selected_species', 'true');
        
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

    // Recalculate alerts when data Changes
    useEffect(() => {
        if (user) {
            const newAlerts = AlertService.getAlerts(poultryType || undefined, poultryBreed || undefined);
            setAlerts(newAlerts);
        }
    }, [syncTrigger, poultryType, poultryBreed, user]);

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
            poultryBreed, 
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
