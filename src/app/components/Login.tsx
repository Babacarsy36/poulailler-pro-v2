import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Logo } from './Logo';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            navigate('/selection');
        } catch (err: any) {
            console.error("Login Error Code:", err.code);
            switch (err.code) {
                case 'auth/user-not-found':
                    setError("Aucun compte n'existe avec cet e-mail.");
                    break;
                case 'auth/wrong-password':
                    setError("Le mot de passe que vous avez entré est incorrect.");
                    break;
                case 'auth/too-many-requests':
                    setError("Trop de tentatives de connexion échouées. Compte temporairement bloqué par mesure de sécurité. Réessayez dans quelques minutes.");
                    break;
                case 'auth/invalid-credential':
                    setError("Les informations de connexion sont incorrectes. Vérifiez votre e-mail ou votre mot de passe.");
                    break;
                case 'auth/network-request-failed':
                    setError("Erreur réseau. Vérifiez votre connexion internet.");
                    break;
                default:
                    setError("Erreur lors de la connexion. Vérifiez vos identifiants ou réinitialisez votre mot de passe.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Veuillez entrer votre adresse e-mail ci-dessus pour réinitialiser le mot de passe.');
            setResetMessage('');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setResetMessage('Un lien de réinitialisation a été envoyé à votre e-mail.');
            setError('');
        } catch (err: any) {
            setError("Erreur lors de la réinitialisation. L'e-mail est-il correct ?");
            setResetMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-babs-cream flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-transparent to-transparent">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <Logo className="w-20 h-20 mx-auto" />
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-babs-brown tracking-tight">Espace Éleveur</h1>
                        <p className="text-babs-brown/60 font-medium text-sm italic uppercase tracking-widest">Babs Farmer Premium</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-premium border border-white/20">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {resetMessage && (
                            <div className="bg-green-50 text-green-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                {resetMessage}
                            </div>
                        )}
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
                                    placeholder="eleveur@exemple.com"
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
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-gray-50/50 border-2 border-transparent focus:border-babs-orange/20 focus:bg-white rounded-2xl py-4 pl-12 pr-12 font-bold text-babs-brown outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-babs-orange transition-colors focus:outline-none p-1"
                                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button 
                                    type="button" 
                                    onClick={handleResetPassword} 
                                    className="text-[10px] text-babs-orange font-bold uppercase tracking-widest hover:underline"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-babs-orange hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? "Connexion..." : "Se connecter"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400">
                            Nouveau ici ?  
                            <Link to="/signup" className="text-babs-orange hover:underline ml-2 uppercase tracking-widest">Créer un compte</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
