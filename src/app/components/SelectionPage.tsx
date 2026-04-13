import { useState } from 'react';
import { useAuth, PoultryType, PoultryBreed } from '../AuthContext';
import { useNavigate } from 'react-router';
import { ChevronRight, Check, LogOut, Info, Star } from 'lucide-react';
import { Logo } from './Logo';

export function SelectionPage() {
    const { updatePoultrySelection, user, logout } = useAuth();
    const navigate = useNavigate();
    const [type, setType] = useState<PoultryType>(null);
    const [breed, setBreed] = useState<PoultryBreed>(null);

    const handleConfirm = async () => {
        if (type) {
            await updatePoultrySelection(type, breed);
            navigate('/');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-babs-cream flex items-center justify-center p-6 sm:p-8 relative">
            {/* Auth Top Bar */}
            {user && (
                <div className="absolute top-6 right-6 flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/50 shadow-sm">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Session active</p>
                        <p className="text-xs font-bold text-babs-brown">{user.email || 'Utilisateur'}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shadow-sm active:scale-95"
                        title="Se déconnecter"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="w-full max-w-xl space-y-12 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <Logo className="w-24 h-24 mx-auto" />
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-babs-brown tracking-tight">Configuration de l'Élevage</h1>
                        <p className="text-babs-brown/60 font-medium">Choisissez le type d'élevage à gérer aujourd'hui</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                    {/* Poulet Card */}
                    <div 
                        onClick={() => setType('poulet')}
                        className={`group relative bg-white rounded-[2.5rem] p-6 lg:p-8 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                            type === 'poulet' ? 'border-babs-orange shadow-premium ring-4 ring-orange-50' : 'border-transparent shadow-sm hover:shadow-premium'
                        }`}
                    >
                        <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 transition-all overflow-hidden border-2 ${
                            type === 'poulet' ? 'border-babs-orange shadow-lg scale-110' : 'border-transparent bg-orange-50/50'
                        }`}>
                            <img src="/assets/icons/poulet.png" alt="Poulet" className={`w-full h-full object-cover scale-110 ${type !== 'poulet' ? 'mix-blend-multiply opacity-80' : ''}`} />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-babs-brown mb-2">Poulets</h2>
                        <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Poulet Fermier, Ornement, Pondeuse...</p>
                        
                        {type === 'poulet' && (
                            <div className="absolute top-6 right-6 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-babs-orange text-white flex items-center justify-center animate-in zoom-in">
                                <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                            </div>
                        )}
                    </div>

                    {/* Caille Card */}
                    <div 
                        onClick={() => { setType('caille'); setBreed(null); }}
                        className={`group relative bg-white rounded-[2.5rem] p-6 lg:p-8 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                            type === 'caille' ? 'border-babs-emerald shadow-premium ring-4 ring-emerald-50' : 'border-transparent shadow-sm hover:shadow-premium'
                        }`}
                    >
                        <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 transition-all overflow-hidden border-2 ${
                            type === 'caille' ? 'border-babs-emerald shadow-lg scale-110' : 'border-transparent bg-emerald-50/50'
                        }`}>
                            <img src="/assets/icons/caille.png" alt="Caille" className={`w-full h-full object-cover scale-110 ${type !== 'caille' ? 'mix-blend-multiply opacity-80' : ''}`} />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-babs-brown mb-2">Cailles</h2>
                        <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Production d'œufs et chair</p>
                        
                        {type === 'caille' && (
                            <div className="absolute top-6 right-6 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-babs-emerald text-white flex items-center justify-center animate-in zoom-in">
                                <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                            </div>
                        )}
                    </div>

                    {/* Pigeon Card */}
                    {/* Pigeon Card - Hidden for now
                    <div 
                        onClick={() => { setType('pigeon'); setBreed(null); }}
                        className={`group relative bg-white rounded-[2.5rem] p-6 lg:p-8 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                            type === 'pigeon' ? 'border-purple-500 shadow-premium ring-4 ring-purple-50' : 'border-transparent shadow-sm hover:shadow-premium'
                        }`}
                    >
                        <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 transition-all overflow-hidden border-2 ${
                            type === 'pigeon' ? 'border-purple-500 shadow-lg scale-110' : 'border-transparent bg-purple-50/50'
                        }`}>
                            <img src="/assets/icons/pigeon.png" alt="Pigeon" className={`w-full h-full object-cover scale-110 ${type !== 'pigeon' ? 'mix-blend-multiply opacity-80' : ''}`} />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-babs-brown mb-2">Pigeons</h2>
                        <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Élevage de chair & ornement</p>
                        
                        {type === 'pigeon' && (
                            <div className="absolute top-6 right-6 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-purple-500 text-white flex items-center justify-center animate-in zoom-in">
                                <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                            </div>
                        )}
                    </div>
                    */}

                    {/* Lapin Card - Hidden for now
                    <div 
                        onClick={() => { setType('lapin'); setBreed(null); }}
                        className={`group relative bg-white rounded-[2.5rem] p-6 lg:p-8 cursor-pointer transition-all duration-500 border-2 flex flex-col items-center text-center ${
                            type === 'lapin' ? 'border-amber-500 shadow-premium ring-4 ring-amber-50' : 'border-transparent shadow-sm hover:shadow-premium'
                        }`}
                    >
                        <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 transition-all overflow-hidden border-2 ${
                            type === 'lapin' ? 'border-amber-500 shadow-lg scale-110' : 'border-transparent bg-amber-50/50'
                        }`}>
                            <img src="/assets/icons/lapin.png" alt="Lapin" className={`w-full h-full object-cover scale-110 ${type !== 'lapin' ? 'mix-blend-multiply opacity-80' : ''}`} />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-babs-brown mb-2">Lapins</h2>
                        <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Cuniculture (Chair, Poils)</p>
                        
                        {type === 'lapin' && (
                            <div className="absolute top-6 right-6 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-amber-500 text-white flex items-center justify-center animate-in zoom-in">
                                <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                            </div>
                        )}
                    </div>
                    */}
                </div>

                {type === 'poulet' && (
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-orange-50 space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <label className="block text-sm font-black text-babs-brown uppercase tracking-wider italic">Quelle race de poulet ?</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['fermier', 'ornement', 'pondeuse', 'chair'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setBreed(r as PoultryBreed)}
                                        className={`py-3 px-4 rounded-xl font-bold capitalize transition-all border-2 ${
                                            breed === r ? 'bg-babs-orange text-white border-babs-orange shadow-lg' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-orange-50'
                                        }`}
                                    >
                                        {r === 'chair' ? 'Poulet de Chair' : r === 'fermier' ? 'Poulet Fermier' : r === 'ornement' ? "Poule d'Ornement" : r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    disabled={!type || (type === 'poulet' && !breed)}
                    onClick={handleConfirm}
                    className={`w-full py-6 text-xl font-black rounded-3xl transition-all duration-500 shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale ${
                        type === 'caille' 
                            ? 'bg-babs-emerald hover:bg-emerald-700 text-white shadow-emerald-200'
                            : type === 'pigeon' ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200'
                            : type === 'lapin' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                            : 'bg-babs-orange hover:bg-orange-700 text-white shadow-orange-200'
                    }`}
                >
                    Continuer
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
}
