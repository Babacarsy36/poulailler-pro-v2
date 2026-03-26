import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type PoultryType = 'caille' | 'poulet' | null;
export type PoultryBreed = 'goliath' | 'herminé' | 'pondeuse' | null;

interface AuthContextType {
    poultryType: PoultryType;
    poultryBreed: PoultryBreed;
    updatePoultrySelection: (type: PoultryType, breed: PoultryBreed) => void;
    clearSelection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [poultryType, setPoultryType] = useState<PoultryType>(null);
    const [poultryBreed, setPoultryBreed] = useState<PoultryBreed>(null);

    // Load from localStorage on mount
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

    return (
        <AuthContext.Provider value={{ 
            poultryType, 
            poultryBreed, 
            updatePoultrySelection,
            clearSelection 
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
