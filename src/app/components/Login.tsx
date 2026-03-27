import { useState } from 'react';
import { useAuth, PoultryType, PoultryBreed } from '../AuthContext';
import { useNavigate } from 'react-router';
import { Bird, ChevronRight, Check } from 'lucide-react';

export function Login() {
    const { updatePoultrySelection } = useAuth();
    const navigate = useNavigate();
    const [type, setType] = useState<PoultryType>(null);
    const [breed, setBreed] = useState<PoultryBreed>(null);

    const handleConfirm = () => {
        if (type) {
            updatePoultrySelection(type, breed);
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-babs-cream flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-xl space-y-12 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-premium" />
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-babs-brown tracking-tight">Bienvenue sur PoulaillerPro</h1>
                        <p className="text-babs-brown/60 font-medium">Choisissez le type d'élevage à gérer aujourd'hui</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Poulet Card */}
                    <div 
                        onClick={() => setType('poulet')}
                        className={`group relative bg-white rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 border-2 ${
                            type === 'poulet' ? 'border-babs-orange shadow-premium ring-4 ring-orange-50' : 'border-transparent shadow-sm hover:shadow-premium'
                        }`}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                            type === 'poulet' ? 'bg-babs-orange text-white' : 'bg-orange-50 text-babs-orange'
                        }`}>
                            <Bird className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-babs-brown mb-2">Poulets</h2>
                        <p className="text-xs text-gray-400 font-bold">Goliath, Herminé, pondeuses...</p>
                        
                        {type === 'poulet' && (
                            <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-babs-orange text-white flex items-center justify-center animate-in zoom-in">
                                <Check className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    {/* Caille Card */}
                    <div 
                        onClick={() => { setType('caille'); setBreed(null); }}
                        className={`group relative bg-white rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 border-2 ${
                            type === 'caille' ? 'border-babs-emerald shadow-premium ring-4 ring-emerald-50' : 'border-transparent shadow-sm hover:shadow-premium'
                        }`}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                            type === 'caille' ? 'bg-babs-emerald text-white' : 'bg-emerald-50 text-babs-emerald'
                        }`}>
                            <Bird className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-babs-brown mb-2">Cailles</h2>
                        <p className="text-xs text-gray-400 font-bold">Production d'œufs et chair</p>
                        
                        {type === 'caille' && (
                            <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-babs-emerald text-white flex items-center justify-center animate-in zoom-in">
                                <Check className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>

                {type === 'poulet' && (
                    <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-orange-50 space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <label className="block text-sm font-black text-babs-brown uppercase tracking-wider italic">Quelle race de poulet ?</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['goliath', 'herminé', 'pondeuse'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setBreed(r as PoultryBreed)}
                                    className={`py-3 px-4 rounded-xl font-bold capitalize transition-all border-2 ${
                                        breed === r ? 'bg-babs-orange text-white border-babs-orange shadow-lg' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-orange-50'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button 
                    disabled={!type}
                    onClick={handleConfirm}
                    className={`w-full py-6 text-xl font-black rounded-3xl transition-all duration-500 shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale ${
                        type === 'caille' 
                            ? 'bg-babs-emerald hover:bg-emerald-700 text-white shadow-emerald-200' 
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
