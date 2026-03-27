import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Logo } from './Logo';
import { UserPlus, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Les mots de passe ne correspondent pas.');
        }

        setLoading(true);
        setError('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/selection');
        } catch (err: any) {
            setError("Erreur lors de la création du compte. L'email est peut-être déjà utilisé.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-babs-cream flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-transparent to-transparent">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <Logo className="w-20 h-20 mx-auto" />
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-babs-brown tracking-tight">Rejoindre l'Aventure</h1>
                        <p className="text-babs-brown/60 font-medium text-sm italic uppercase tracking-widest">Babs Farmer Premium</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-premium border border-white/20">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-2">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-babs-orange transition-colors" />
                                <input 
                                    type="email"
                                    required
                                    className="w-full bg-gray-50/50 border-2 border-transparent focus:border-babs-orange/20 focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold text-babs-brown outline-none transition-all"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-2">Mot de passe</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-babs-orange transition-colors" />
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-gray-50/50 border-2 border-transparent focus:border-babs-orange/20 focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold text-babs-brown outline-none transition-all"
                                    placeholder="8 caractères min."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-2">Confirmer</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-babs-orange transition-colors" />
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-gray-50/50 border-2 border-transparent focus:border-babs-orange/20 focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold text-babs-brown outline-none transition-all"
                                    placeholder="Répétez le mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-babs-orange hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? "Création..." : "Créer mon compte"}
                            <UserPlus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400">
                            Déjà inscrit ?  
                            <Link to="/login" className="text-babs-orange hover:underline ml-2 uppercase tracking-widest">Se connecter</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
