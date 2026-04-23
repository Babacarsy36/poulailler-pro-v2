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
import { breedList } from './constants';
import { NotificationService } from './services/NotificationService';

export type PoultryBreed = 'fermier' | 'ornement' | 'pondeuse' | 'chair' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    poultryTypes: PoultryType[];
    selectedBreeds: string[];
    activeSpeciesFilter: PoultryType | 'all';
    activeBreedFilter: string | null;
    role: UserRole;
    farmId: string | null;
    syncTrigger: number;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    updatePoultrySelection: (types: PoultryType[], breeds: string[]) => void;
    setActiveSpeciesFilter: (type: PoultryType | 'all') => void;
    setActiveBreedFilter: (breed: string | null) => void;
    clearSelection: () => void;
    isItemActive: (itemType?: PoultryType | string | null, itemBreed?: string) => boolean;
    isSyncing: boolean;
    tier: SubscriptionTier;
    hasAccess: (requiredTier: SubscriptionTier) => boolean;
    setTierAction: (newTier: SubscriptionTier) => Promise<void>;
    alerts: Alert[];
    logout: () => Promise<void>;
    isPreferencesLoaded: boolean;
    isInitialPullDone: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPreferencesLoaded, setIsPreferencesLoaded] = useState(false);
    const [isInitialPullDone, setIsInitialPullDone] = useState(false);
    const [poultryTypes, setPoultryTypes] = useState<PoultryType[]>(() => {
        try {
            const saved = localStorage.getItem('poultry_types');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('selected_breeds');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [activeSpeciesFilter, setActiveSpeciesFilterState] = useState<PoultryType | 'all'>(
        () => (localStorage.getItem('active_species_filter') as PoultryType | 'all') || 'all'
    );

    const setActiveSpeciesFilter = (type: PoultryType | 'all') => {
        setActiveSpeciesFilterState(type);
        localStorage.setItem('active_species_filter', type);
    };
    const [activeBreedFilter, setActiveBreedFilter] = useState<string | null>(null);
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

                // Deep cloud pull: consolidate legacy and farm data
                setIsSyncing(true);
                const pullId = currentUser.uid;
                // 1. Pull everything from cloud to local
                await SyncService.pullCloudToLocal(pullId, false); // Legacy user store
                await SyncService.pullCloudToLocal(pullId, true);  // Shared farm store
                
                // 2. IMPORTANT: If current user is owner, push local back to farm store to unify
                // This ensures that if Web had 'A' and Mobile had 'B', after both pull/push, both have 'A+B'
                await SyncService.pushLocalToCloud(pullId, true);
                
                setIsSyncing(false);
                setIsInitialPullDone(true);
                setSyncTrigger(prev => prev + 1);

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
        
        // Initialize Notifications
        NotificationService.requestPermission(user.uid);
        NotificationService.initForegroundListener();
        
        const unsubPrefs = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (prefsDoc) => {
            if (prefsDoc.exists()) {
                const data = prefsDoc.data();
                if (data.selectedBreeds) {
                    const validBreeds = Array.isArray(data.selectedBreeds) ? data.selectedBreeds.filter(Boolean) : [];
                    setSelectedBreeds(validBreeds);
                    localStorage.setItem('selected_breeds', JSON.stringify(validBreeds));
                }
                if (data.poultryType) {
                    const types = Array.isArray(data.poultryType) ? (data.poultryType as PoultryType[]) : [data.poultryType as PoultryType];
                    setPoultryTypes(prev => {
                        // MERGE LOGIC: Never remove a species that we currently have
                        // unless it's an explicit clear. This prevents sync-back wipes.
                        const combined = [...new Set([...prev.map(t => t?.toLowerCase()), ...types.map(t => t?.toLowerCase())])];
                        return combined.filter(Boolean) as PoultryType[];
                    });
                    if (types.length > 0) {
                        localStorage.setItem('has_selected_species', 'true');
                        localStorage.setItem('poultry_types', JSON.stringify(types));
                    }
                }
            }
            setIsPreferencesLoaded(true);
        }, (err) => {
            setIsPreferencesLoaded(true); // Still set to true on error to avoid infinite loading
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

    // Alert auto-notifications
    useEffect(() => {
        // Notifie pour les Critical (Aujourd'hui) ET les Warning (Demain)
        const priorityAlerts = alerts.filter(a => a.severity === 'critical' || (a.severity === 'warning' && a.type === 'health-reminder'));
        if (priorityAlerts.length > 0) {
            const lastAlert = priorityAlerts[0];
            const notifiedKey = `notified_${lastAlert.id}`;
            if (!localStorage.getItem(notifiedKey)) {
                NotificationService.showLocalNotification(lastAlert.title, lastAlert.message);
                localStorage.setItem(notifiedKey, 'true');
            }
        }
    }, [alerts]);

    useEffect(() => {
        if (user && farmId) {
            const stopSync = SyncService.startRealtimeSync(() => {
                setSyncTrigger(prev => prev + 1);
            }, farmId, true); // Everyone uses farm store if farmId exists
            return () => stopSync();
        }
    }, [user, farmId]);

    // Load selection from localStorage on mount
    useEffect(() => {
        const savedTypes = localStorage.getItem('poultry_types');
        const savedBreeds = localStorage.getItem('selected_breeds');
        if (savedTypes) {
            try {
                setPoultryTypes(JSON.parse(savedTypes));
            } catch (e) { setPoultryTypes([]); }
        }
        if (savedBreeds) {
            try {
                const parsed = JSON.parse(savedBreeds);
                setSelectedBreeds(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
            } catch (e) {
                setSelectedBreeds([]);
            }
        }
    }, []);

    const updatePoultrySelection = async (types: PoultryType[], breeds: string[]) => {
        // Ensure lowercase consistency
        const cleanTypes = types.map(t => t?.toLowerCase() as PoultryType).filter(Boolean);
        const cleanBreeds = breeds.map(b => b?.toLowerCase()).filter(Boolean);

        setPoultryTypes(cleanTypes);
        setSelectedBreeds(cleanBreeds);
        
        // CRITICAL: Always save to localStorage FIRST, before Firebase.
        // This ensures the SelectionGuard never redirects to /selection
        // even if the user reconnects before Firebase responds.
        localStorage.setItem('has_selected_species', 'true');
        localStorage.setItem('poultry_types', JSON.stringify(cleanTypes));
        localStorage.setItem('selected_breeds', JSON.stringify(cleanBreeds));
        localStorage.removeItem('poultry_breed'); // Clean legacy

        if (user) {
            setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
                poultryType: cleanTypes,
                selectedBreeds: cleanBreeds,
                lastUpdated: Date.now()
            }).catch(() => {});
        }
    };

    const clearSelection = () => {
        // NOTE: We intentionally do NOT remove 'has_selected_species' here.
        // This flag must survive logout/login cycles to prevent the re-onboarding loop.
        // It is only removed if the user explicitly goes to /selection and saves new empty settings.
        setPoultryTypes([]);
        setSelectedBreeds([]);
        setActiveSpeciesFilterState('all');
        setActiveBreedFilter(null);
        localStorage.removeItem('active_species_filter');
        // DO NOT: localStorage.removeItem('has_selected_species'); 
        // DO NOT: localStorage.removeItem('poultry_types');
    };
    const isItemActive = (itemType?: string, itemBreed?: string, ignoreSpecies = false) => {
        const effectiveType = itemType?.toLowerCase() || 'poulet';

        // 1. Global Species Filter (Top Switcher)
        // If an item has NO explicit species (null/undefined) or is 'global', it's visible in all species views.
        const isEntryGlobal = !itemType || itemType === 'global' || itemType === 'Global';
        
        // If item is global, it passes the species check automatically
        if (isEntryGlobal) {
            // If we have a breed filter active, global items should STILL be visible 
            // unless they explicitly have a DIFFERENT breed (usually they have none)
            if (activeBreedFilter && itemBreed && itemBreed !== 'global' && itemBreed.toLowerCase() !== activeBreedFilter.toLowerCase()) {
                return false;
            }
            return true;
        }

        if (!ignoreSpecies && activeSpeciesFilter !== 'all' && effectiveType !== activeSpeciesFilter.toLowerCase()) return false;
 
        // 2. Breed/Sub-type Filter (Contextual Switcher)
        if (activeBreedFilter) {
            const filterLower = activeBreedFilter.toLowerCase();
            const itemBreedLower = itemBreed?.toLowerCase();
            
            // Check if the breed matches
            const breedMatch = itemBreedLower === filterLower;
            if (!breedMatch) return false;
 
            // IMPORTANT: Check species-breed compatibility
            // If activeSpeciesFilter is 'all', ensure item's species has this breed
            const belongsToPoulet = breedList.poulet.some(b => b.id.toLowerCase() === filterLower);
            if (belongsToPoulet && effectiveType !== 'poulet') return false;
            
            const belongsToCaille = breedList.caille.some(b => b.id.toLowerCase() === filterLower);
            if (belongsToCaille && effectiveType !== 'caille') return false;
 
            return true;
        }

        // 3. User Preferences Filter (Onboarding Selection)
        // If we are in "Global View", we show everything to maintain full farm transparency.
        if (activeSpeciesFilter === 'all') return true;

        const isSpeciesSelected = poultryTypes.includes(effectiveType);
        if (!isSpeciesSelected) return false;

        // If the species has breeds defined in selectedBreeds, only show those breeds
        const speciesBreeds = breedList[effectiveType]?.map(b => b.id) || [];
        const hasSelectedBreedsForThisSpecies = selectedBreeds.some(sb => speciesBreeds.includes(sb));

        if (hasSelectedBreedsForThisSpecies && itemBreed) {
            return selectedBreeds.some(sb => sb.toLowerCase() === itemBreed.toLowerCase());
        }

        return true;
    };

    // SELF-HEALING: Detect missing poultry types from existing data
    useEffect(() => {
        // Wait until we have a user, preferences have been checked, and initial cloud data is pulled
        if (!user || !isPreferencesLoaded || !isInitialPullDone) return;

        const heal = async () => {
            const chickens = StorageService.getItem<any[]>("chickens") || [];
            if (chickens.length === 0) return;

            const detectedTypes: PoultryType[] = [];
            const hasCaille = chickens.some(c => c.poultryType?.toLowerCase() === 'caille');
            const hasPoulet = chickens.some(c => !c.poultryType || c.poultryType.toLowerCase() === 'poulet');
            const hasLapin = chickens.some(c => c.poultryType?.toLowerCase() === 'lapin');
            const hasPigeon = chickens.some(c => c.poultryType?.toLowerCase() === 'pigeon');
 
            if (hasCaille) detectedTypes.push('caille');
            if (hasPoulet) detectedTypes.push('poulet');
            if (hasLapin) detectedTypes.push('lapin');
            if (hasPigeon) detectedTypes.push('pigeon');

            const missingTypes = detectedTypes.filter(t => !poultryTypes.includes(t));
            
            if (missingTypes.length > 0) {
                console.log("Self-healing: Adding missing species to preferences:", missingTypes);
                const newTypes = [...new Set([...poultryTypes, ...detectedTypes])];
                
                // Also check for missing breeds
                const foundBreeds = [...new Set(chickens.filter(c => c.breed).map(c => c.breed.toLowerCase()))];
                const newBreeds = [...new Set([...selectedBreeds.map(b => b.toLowerCase()), ...foundBreeds])];
                
                await updatePoultrySelection(newTypes, newBreeds);
                
                // If more than one species detected, reset filter to 'all' to show everything
                if (newTypes.length > 1) {
                    setActiveSpeciesFilter('all');
                }
            }
        };

        heal();
    }, [isInitialPullDone, isPreferencesLoaded, user]);

    // Recalculate alerts when data Changes
    useEffect(() => {
        if (user) {
            const newAlerts = AlertService.getAlerts(activeSpeciesFilter, selectedBreeds);
            setAlerts(newAlerts);
        }
    }, [syncTrigger, poultryTypes, selectedBreeds, user, activeSpeciesFilter]);

    const saveData = async <T extends SyncItem>(key: string, data: T[]) => {
        const targetId = farmId || user?.uid;
        const isFarm = !!farmId; // Owner or worker, if there's a farmId, use farm store
        if (targetId) {
            await SyncService.saveCollection(key, data, targetId, isFarm);
            setSyncTrigger(prev => prev + 1);
        }
    };

    const setTierAction = async (newTier: SubscriptionTier) => {
        if (!user) return;
        try {
            setTier(newTier);
            // Save to profile document instead of root to avoid PERMISSION_DENIED
            await setDoc(doc(db, 'users', user.uid, 'settings', 'profile'), {
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
            // CRITICAL: Do NOT clearSelection() or remove any localStorage preferences.
            // The user's poultry_types and has_selected_species must survive logout.
            // Without this, the user will be forced to reconfigure on every login.
            toast.success("Déconnexion réussie.");
        } catch (err) {
            toast.error("Erreur lors de la déconnexion.");
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user,
            loading,
            poultryTypes, 
            selectedBreeds, 
            activeSpeciesFilter,
            activeBreedFilter,
            syncTrigger,
            isDarkMode,
            toggleDarkMode,
            updatePoultrySelection,
            setActiveSpeciesFilter,
            setActiveBreedFilter,
            clearSelection,
            isItemActive,
            isSyncing,
            tier,
            hasAccess,
            setTierAction,
            saveData,
            alerts,
            role,
            farmId,
            logout,
            isPreferencesLoaded,
            isInitialPullDone
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
