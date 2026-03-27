import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { SyncService } from './SyncService';

export type PoultryType = 'caille' | 'poulet' | null;
export type PoultryBreed = 'goliath' | 'herminé' | 'pondeuse' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    poultryType: PoultryType;
    poultryBreed: PoultryBreed;
    syncTrigger: number; // Used to tell components to re-read from localStorage
    updatePoultrySelection: (type: PoultryType, breed: PoultryBreed) => void;
    clearSelection: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [poultryType, setPoultryType] = useState<PoultryType>(null);
    const [poultryBreed, setPoultryBreed] = useState<PoultryBreed>(null);
    const [syncTrigger, setSyncTrigger] = useState(0);

    // Listen for Firebase Auth changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Pull data from cloud on login
                await SyncService.pullCloudToLocal();
                setSyncTrigger(prev => prev + 1);
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

    const updatePoultrySelection = (type: PoultryType, breed: PoultryBreed) => {
        setPoultryType(type);
        setPoultryBreed(breed);
        if (type) localStorage.setItem('poultry_type', type);
        else localStorage.removeItem('poultry_type');
        
        if (breed) localStorage.setItem('poultry_breed', breed);
        else localStorage.removeItem('poultry_breed');
    };

    const clearSelection = () => {
        setPoultryType(null);
        setPoultryBreed(null);
        localStorage.removeItem('poultry_type');
        localStorage.removeItem('poultry_breed');
    };

    const logout = async () => {
        await signOut(auth);
        clearSelection();
    };

    return (
        <AuthContext.Provider value={{ 
            user,
            loading,
            poultryType, 
            poultryBreed, 
            syncTrigger,
            updatePoultrySelection,
            clearSelection,
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
