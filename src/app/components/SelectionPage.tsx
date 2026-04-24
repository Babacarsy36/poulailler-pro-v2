import { useState, useEffect } from 'react';
import { useAuth, PoultryType } from '../AuthContext';
import { useNavigate } from 'react-router';
import { ChevronRight, Check, LogOut, X } from 'lucide-react';

export function SelectionPage() {
    const { updatePoultrySelection, user, logout, poultryTypes, selectedBreeds, isPreferencesLoaded, isInitialPullDone } = useAuth();
    const navigate = useNavigate();

    const [selectedTypes, setSelectedTypes] = useState<PoultryType[]>([]);
    const [breeds, setBreeds] = useState<string[]>([]);
    const [autoRedirecting, setAutoRedirecting] = useState(false);

    // Auto-redirect if user already has config loaded from Firebase
    useEffect(() => {
        if (poultryTypes.length > 0 && isInitialPullDone) {
            setSelectedTypes(poultryTypes);
            if (selectedBreeds.length > 0) setBreeds(selectedBreeds);
            // If they were redirected here by mistake (e.g. slow Firebase on new browser),
            // go back to dashboard automatically after a short delay
            const hasLocal = localStorage.getItem('has_selected_species') === 'true';
            if (hasLocal) {
                setAutoRedirecting(true);
                const t = setTimeout(() => navigate('/'), 1500);
                return () => clearTimeout(t);
            }
        }
    }, [poultryTypes, selectedBreeds, isInitialPullDone]);

    const toggleType = (type: PoultryType) => {
        if (!type) return;
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleBreed = (breed: string) => {
        setBreeds(prev =>
            prev.includes(breed) ? prev.filter(b => b !== breed) : [...prev, breed]
        );
    };

    const handleConfirm = async () => {
        if (selectedTypes.length > 0) {
            let allBreeds = [...breeds];
            if (selectedTypes.includes('caille')) allBreeds.push('caille');
            if (selectedTypes.includes('pigeon')) allBreeds.push('pigeon');
            if (selectedTypes.includes('lapin')) allBreeds.push('lapin');
            await updatePoultrySelection(selectedTypes, allBreeds);
            navigate('/');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const hasExistingConfig = poultryTypes.length > 0;

    return (
        <div className="min-h-screen bg-babs-cream flex flex-col">

            {/* Auto-redirect banner */}
            {autoRedirecting && (
                <div className="fixed inset-0 z-50 bg-babs-cream flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-babs-orange border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-babs-brown font-black text-sm">Configuration détectée, redirection...</p>
                </div>
            )}

            {/* ── Top Bar ── */}
            <header className="w-full flex items-center justify-between px-4 sm:px-6 py-4 shrink-0">
                {/* Left: Quitter (only if already configured) */}
                <div className="w-24 flex justify-start">
                    {hasExistingConfig && (
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-500 rounded-xl hover:bg-gray-100 transition-colors shadow-sm active:scale-95 text-xs font-bold border border-gray-100"
                        >
                            <X className="w-4 h-4" />
                            <span>Fermer</span>
                        </button>
                    )}
                </div>

                {/* Center: Session info */}
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Session</p>
                        <p className="text-xs font-bold text-babs-brown truncate max-w-[140px]">{user?.email || 'Utilisateur'}</p>
                    </div>
                </div>

                {/* Right: Logout */}
                <div className="w-24 flex justify-end">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shadow-sm active:scale-95 text-xs font-bold border border-red-100"
                        title="Se déconnecter"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Quitter</span>
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
                <div className="w-full max-w-xl space-y-10 animate-in fade-in zoom-in duration-700">

                    {/* Title */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-babs-brown tracking-tight">
                            Configuration de l'Élevage
                        </h1>
                        <p className="text-babs-brown/60 font-medium text-sm">
                            Choisissez le type d'élevage à gérer
                        </p>
                    </div>

                    {/* Species Cards */}
                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                        {/* Poulet */}
                        <div
                            onClick={() => toggleType('poulet')}
                            className={`group relative bg-white rounded-[2rem] p-5 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                                selectedTypes.includes('poulet')
                                    ? 'border-babs-orange shadow-xl ring-4 ring-orange-50'
                                    : 'border-transparent shadow-sm hover:shadow-lg'
                            }`}
                        >
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 transition-all overflow-hidden border-2 ${
                                selectedTypes.includes('poulet') ? 'border-babs-orange shadow-lg scale-110' : 'border-transparent bg-orange-50/50'
                            }`}>
                                <img src="/assets/icons/poulet.png" alt="Poulet" className={`w-full h-full object-cover scale-110 ${!selectedTypes.includes('poulet') ? 'mix-blend-multiply opacity-80' : ''}`} />
                            </div>
                            <h2 className="text-lg font-black text-babs-brown mb-1">Poulets</h2>
                            <p className="text-[10px] text-gray-400 font-bold">Fermier, Ornement, Pondeuse...</p>
                            {selectedTypes.includes('poulet') && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-babs-orange text-white flex items-center justify-center animate-in zoom-in">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>

                        {/* Caille */}
                        <div
                            onClick={() => toggleType('caille')}
                            className={`group relative bg-white rounded-[2rem] p-5 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                                selectedTypes.includes('caille')
                                    ? 'border-babs-emerald shadow-xl ring-4 ring-emerald-50'
                                    : 'border-transparent shadow-sm hover:shadow-lg'
                            }`}
                        >
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 transition-all overflow-hidden border-2 ${
                                selectedTypes.includes('caille') ? 'border-babs-emerald shadow-lg scale-110' : 'border-transparent bg-emerald-50/50'
                            }`}>
                                <img src="/assets/icons/caille.png" alt="Caille" className={`w-full h-full object-cover scale-110 ${!selectedTypes.includes('caille') ? 'mix-blend-multiply opacity-80' : ''}`} />
                            </div>
                            <h2 className="text-lg font-black text-babs-brown mb-1">Cailles</h2>
                            <p className="text-[10px] text-gray-400 font-bold">Œufs & chair</p>
                            {selectedTypes.includes('caille') && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-babs-emerald text-white flex items-center justify-center animate-in zoom-in">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>

                        {/* Pigeon */}
                        <div
                            onClick={() => toggleType('pigeon')}
                            className={`group relative bg-white rounded-[2rem] p-5 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                                selectedTypes.includes('pigeon')
                                    ? 'border-blue-500 shadow-xl ring-4 ring-blue-50'
                                    : 'border-transparent shadow-sm hover:shadow-lg'
                            }`}
                        >
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 transition-all overflow-hidden border-2 ${
                                selectedTypes.includes('pigeon') ? 'border-blue-500 shadow-lg scale-110' : 'border-transparent bg-blue-50/50'
                            }`}>
                                <iconify-icon icon="game-icons:pigeon" class="text-4xl text-blue-500"></iconify-icon>
                            </div>
                            <h2 className="text-lg font-black text-babs-brown mb-1">Pigeons</h2>
                            <p className="text-[10px] text-gray-400 font-bold">Élevage spécialisé</p>
                            {selectedTypes.includes('pigeon') && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center animate-in zoom-in">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>

                        {/* Lapin */}
                        <div
                            onClick={() => toggleType('lapin')}
                            className={`group relative bg-white rounded-[2rem] p-5 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                                selectedTypes.includes('lapin')
                                    ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-50'
                                    : 'border-transparent shadow-sm hover:shadow-lg'
                            }`}
                        >
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 transition-all overflow-hidden border-2 ${
                                selectedTypes.includes('lapin') ? 'border-indigo-500 shadow-lg scale-110' : 'border-transparent bg-indigo-50/50'
                            }`}>
                                <iconify-icon icon="game-icons:rabbit" class="text-4xl text-indigo-500"></iconify-icon>
                            </div>
                            <h2 className="text-lg font-black text-babs-brown mb-1">Lapins</h2>
                            <p className="text-[10px] text-gray-400 font-bold">Cuniculture</p>
                            {selectedTypes.includes('lapin') && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center animate-in zoom-in">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Breed selection (poulet only) */}
                    {selectedTypes.includes('poulet') && (
                        <div className="bg-white p-6 rounded-[1.5rem] shadow-lg border border-orange-50 space-y-4 animate-in slide-in-from-top-4 duration-500">
                            <label className="block text-xs font-black text-babs-brown uppercase tracking-wider">
                                Race(s) de poulet (choix multiples)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['fermier', 'ornement', 'pondeuse', 'chair'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => toggleBreed(r)}
                                        className={`py-2.5 px-3 rounded-xl font-bold text-sm capitalize transition-all border-2 flex items-center justify-between ${
                                            breeds.includes(r)
                                                ? 'bg-babs-orange text-white border-babs-orange shadow-md'
                                                : 'bg-gray-50 text-gray-500 border-transparent hover:bg-orange-50'
                                        }`}
                                    >
                                        <span>{r === 'chair' ? 'De Chair' : r === 'fermier' ? 'Fermier' : r === 'ornement' ? "Ornement" : r}</span>
                                        {breeds.includes(r) && <Check className="w-4 h-4 ml-1 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirm button */}
                    <button
                        disabled={selectedTypes.length === 0 || (selectedTypes.includes('poulet') && breeds.length === 0)}
                        onClick={handleConfirm}
                        className={`w-full py-5 text-lg font-black rounded-2xl transition-all duration-500 shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale ${
                            selectedTypes.includes('poulet')
                                ? 'bg-babs-orange hover:bg-orange-700 text-white'
                                : 'bg-babs-emerald hover:bg-emerald-700 text-white'
                        }`}
                    >
                        Confirmer
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </main>
        </div>
    );
}
