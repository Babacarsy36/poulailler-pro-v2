import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { SyncService } from './SyncService';

export type PoultryType = 'caille' | 'poulet' | null;
export type PoultryBreed = 'goliath' | 'brahma' | 'cochin' | 'pondeuse' | 'chair' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    poultryType: PoultryType;
    poultryBreed: PoultryBreed;
    role: 'owner' | 'manager' | 'worker';
    farmId: string | null;
    syncTrigger: number;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    updatePoultrySelection: (type: PoultryType, breed: PoultryBreed) => void;
    clearSelection: () => void;
    isSyncing: boolean;
    isPro: boolean;
    togglePro: () => Promise<void>;
    saveData: (key: string, data: any[]) => Promise<void>;
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
    const [role, setRole] = useState<'owner' | 'manager' | 'worker'>('owner');
    const [farmId, setFarmId] = useState<string | null>(null);
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
                        
                        return { role: invitation.role, farmId: invitation.farmId };
                    }
                    return null;
                };

                // Pull or Initialize Profile & FarmId
                getDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile')).then(async (profDoc) => {
                    let userRole = 'owner';
                    let userFarmId = currentUser.uid;

                    if (profDoc.exists()) {
                        const data = profDoc.data();
                        userRole = data.role || 'owner';
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

                    setRole(userRole as any);
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

    const saveData = async (key: string, data: any[]) => {
        const isFarm = !!farmId && farmId !== user?.uid;
        const targetId = farmId || user?.uid;
        if (targetId) {
            await SyncService.saveCollection(key, data, targetId, isFarm);
            setSyncTrigger(prev => prev + 1);
        }
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
            saveData,
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
