import { useState } from 'react';
import { useAuth, PoultryType, PoultryBreed } from '../AuthContext';
import { useNavigate } from 'react-router';
import { Bird, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-orange-600">Bienvenue sur PoulaillerPro</h1>
                    <p className="text-gray-600">Veuillez sélectionner votre domaine de gestion</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                        className={`cursor-pointer transition-all hover:scale-105 ${type === 'poulet' ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}
                        onClick={() => setType('poulet')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">Poulets</CardTitle>
                            <Bird className={`h-8 w-8 ${type === 'poulet' ? 'text-orange-500' : 'text-gray-400'}`} />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Goliath, Herminé, pondeuses...</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`cursor-pointer transition-all hover:scale-105 ${type === 'caille' ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''}`}
                        onClick={() => { setType('caille'); setBreed(null); }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">Cailles</CardTitle>
                            <Bird className={`h-8 w-8 ${type === 'caille' ? 'text-emerald-500' : 'text-gray-400'}`} />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Production d'œufs et chair</p>
                        </CardContent>
                    </Card>
                </div>

                {type === 'poulet' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <label className="block text-sm font-medium text-gray-700">Race de poulet</label>
                        <select 
                            value={breed || ''} 
                            onChange={(e) => setBreed(e.target.value as PoultryBreed)}
                            className="w-full p-3 border-2 border-orange-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        >
                            <option value="">Sélectionner une race (optionnel)</option>
                            <option value="goliath">Goliath</option>
                            <option value="herminé">Herminé</option>
                            <option value="pondeuse">Pondeuse</option>
                        </select>
                    </div>
                )}

                <Button 
                    disabled={!type}
                    onClick={handleConfirm}
                    className={`w-full py-6 text-xl font-bold rounded-2xl transition-all shadow-lg ${
                        type === 'caille' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                >
                    Continuer
                    <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
