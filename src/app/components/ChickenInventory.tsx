import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Bird, Calendar, Activity, Users, FileWarning, ShoppingCart } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";

interface Chicken {
  id: string;
  name: string;
  poultryType: "caille" | "poulet";
  breed: string;
  age: number;
  count: number;
  femaleCount?: number;
  maleCount?: number;
  status: "active" | "malade" | "retraite";
}

export function ChickenInventory() {
  const { poultryType, poultryBreed, syncTrigger } = useAuth();
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingChicken, setEditingChicken] = useState<Chicken | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    breed: poultryBreed || "",
    age: "",
    count: "1",
    femaleCount: "0",
    maleCount: "0",
    status: "active" as "active" | "malade" | "retraite",
  });

  const [simFemales, setSimFemales] = useState("10");

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const bgLight = isCaille ? "bg-emerald-50" : "bg-orange-50";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const btnBg = isCaille ? "bg-babs-emerald hover:bg-emerald-600" : "bg-babs-orange hover:bg-orange-600";

  // Mating ratio calculation
  const matingRatio = 1/4; // Universal 1:4 for maximum fertility as requested
  const recommendedMales = Math.ceil(Number(simFemales) * matingRatio);

  const getRecommendedFeed = (ageMonths: string, breed: string, type: string) => {
    const ageDays = (parseFloat(ageMonths) || 0) * 30;
    if (ageDays <= 0) return "Âge non défini";

    if (type === 'caille') {
       if (ageDays <= 14) return "Démarrage Cailles (Très riche)";
       if (ageDays <= 42) return "Croissance Cailles";
       return "Ponte / Engraissement Cailles";
    }

    if (breed.toLowerCase().includes('pondeuse')) {
       if (ageDays <= 28) return "Démarrage Pondeuses";
       if (ageDays <= 126) return "Poulette (Croissance)";
       return "Aliment Ponte (Riche en Calcium)";
    }

    if (breed.toLowerCase().includes('goliath') || breed.toLowerCase().includes('brahma') || breed.toLowerCase().includes('cochin')) {
       if (ageDays <= 28) return "Démarrage Chair (Lourdes)";
       if (ageDays <= 60) return "Croissance Chair (Lourdes)";
       return "Finition Chair (Énergie élevée)";
    }

    // Default Chair
    if (ageDays <= 21) return "Démarrage Chair";
    if (ageDays <= 35) return "Croissance Chair";
    return "Finition Chair";
  };

  useEffect(() => {
    const saved = localStorage.getItem("chickens");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure old entries have a count
      const migrated = parsed.map((c: any) => ({
        ...c,
        poultryType: c.poultryType || (c.breed?.toLowerCase().includes("caille") ? "caille" : (poultryType || "poulet")),
        count: c.count ? parseInt(c.count) : 1
      }));
      setChickens(migrated);
    }
  }, [syncTrigger, poultryType]);

  const saveChickens = (newChickens: Chicken[]) => {
    setChickens(newChickens);
    SyncService.saveCollection("chickens", newChickens);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const countVal = Number(formData.count);
    const femVal = Number(formData.femaleCount);
    const maleVal = Number(formData.maleCount);

    const actualCount = (femVal > 0 || maleVal > 0) ? femVal + maleVal : countVal;

    if (editingChicken) {
      const updated = chickens.map((c) =>
        c.id === editingChicken.id ? { 
          ...c, 
          ...formData, 
          poultryType: poultryType || c.poultryType || "poulet",
          age: Number(formData.age), 
          count: actualCount,
          femaleCount: femVal,
          maleCount: maleVal
        } : c
      );
      saveChickens(updated);
      setEditingChicken(null);
    } else {
      const newChicken: Chicken = {
        id: Date.now().toString(),
        ...formData,
        poultryType: (poultryType || "poulet").toLowerCase() as "poulet" | "caille",
        age: Number(formData.age),
        count: actualCount,
        femaleCount: femVal,
        maleCount: maleVal
      };
      saveChickens([...chickens, newChicken]);
    }
    setFormData({ name: "", breed: poultryBreed || "", age: "", count: "1", femaleCount: "0", maleCount: "0", status: "active" });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-babs-brown tracking-tight">
            Inventaire {isCaille ? "Cailles" : "Poulets"}
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Gestion par Lots & Sujets</p>
        </div>
        <button 
          onClick={() => {
            setEditingChicken(null);
            setFormData({ name: "", breed: poultryBreed || "", age: "", count: "1", femaleCount: "0", maleCount: "0", status: "active" });
            setIsAddOpen(true);
          }}
          className={`${btnBg} text-white px-6 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold`}
        >
          <Plus className="w-5 h-5" />
          Ajouter un Lot
        </button>
      </div>

      {/* Simulator Card */}
      <div className={`rounded-[2.5rem] p-8 shadow-premium border ${bgLight} border-transparent flex flex-col md:flex-row items-center gap-8 relative overflow-hidden`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${iconBg} shadow-lg shadow-orange-100`}>
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-babs-brown/70">Calculateur de Fertilité</p>
              <h3 className="text-2xl font-black text-babs-brown">Ratio de Reproduction</h3>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-card rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between border border-white/10 dark:border-white/5">
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre de femelles :</label>
                 <input 
                   type="number" 
                   value={simFemales} 
                   onChange={e => setSimFemales(e.target.value)}
                   className={`w-24 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl p-3 font-black ${accentColor} text-center focus:ring-2 focus:ring-orange-200 outline-none`}
                 />
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Idéalement, il vous faut</p>
                    <p className={`text-3xl font-black ${accentColor}`}>{recommendedMales} Mâles</p>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Bird className="w-6 h-6" />
                 </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {chickens.map((chicken) => (
          <div key={chicken.id} className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 dark:border-white/5 relative overflow-hidden group hover:border-orange-100 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${iconBg} shadow-lg shadow-orange-100 flex items-center gap-2`}>
                <Bird className="w-6 h-6" />
                <span className="font-black text-lg">x{chicken.count}</span>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                chicken.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {chicken.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-babs-brown tracking-tight">{chicken.name}</h3>
                <p className={`text-xs font-bold ${accentColor} uppercase tracking-wider`}>{chicken.breed || poultryBreed}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  <span className="text-xs font-bold text-gray-500">{chicken.age} mois</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-300" />
                  <span className="text-xs font-bold text-gray-500">Lot actif</span>
                </div>
              </div>

              {(chicken.maleCount! > 0 || chicken.femaleCount! > 0) && (
                <div className="flex items-center gap-2 pt-2 text-xs font-bold text-gray-400 bg-gray-50 p-2 rounded-xl">
                   <span>♀️ {chicken.femaleCount} Poules</span>
                   <span className="text-gray-300">|</span>
                   <span>♂️ {chicken.maleCount} Coqs</span>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => {
                    setEditingChicken(chicken);
                    setFormData({ 
                      ...chicken, 
                      age: chicken.age.toString(), 
                      count: chicken.count.toString(),
                      femaleCount: (chicken.femaleCount || "0").toString(),
                      maleCount: (chicken.maleCount || "0").toString(),
                    });
                    setIsAddOpen(true);
                  }}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 p-3 rounded-xl text-babs-brown font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button 
                  onClick={() => saveChickens(chickens.filter(c => c.id !== chicken.id))}
                  className="p-3 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] border border-white/10">
            <h3 className="text-3xl font-black text-babs-brown mb-8">
              {editingChicken ? "Modifier le lot" : "Nouvel enregistrement en Lot"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nom du Lot / Identifiant</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Arrivage Goliath Janvier..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Âge (mois)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantité Totale (Têtes)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                    value={formData.count}
                    onChange={e => setFormData({ ...formData, count: e.target.value })}
                    required
                    min="1"
                  />
                </div>
              </div>

              {formData.age && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 animate-in slide-in-from-left-2">
                  <ShoppingCart className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Aliment Recommandé</p>
                    <p className="text-sm font-black text-blue-700">{getRecommendedFeed(formData.age, formData.breed || poultryBreed || "", isCaille ? "caille" : "poulet")}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-5 rounded-[2rem] space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <FileWarning className="w-4 h-4 text-orange-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-babs-brown/70">Reproduction (Optionnel)</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Femelles (Poules)</label>
                     <input 
                       type="number"
                       className="w-full bg-white border-none rounded-xl p-3 font-bold text-babs-brown outline-none"
                       value={formData.femaleCount}
                       onChange={e => setFormData({ ...formData, femaleCount: e.target.value })}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mâles (Coqs)</label>
                     <input 
                       type="number"
                       className="w-full bg-white border-none rounded-xl p-3 font-bold text-babs-brown outline-none"
                       value={formData.maleCount}
                       onChange={e => setFormData({ ...formData, maleCount: e.target.value })}
                     />
                   </div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-bold leading-relaxed italic">Si vous remplissez ces champs, la quantité totale sera ignorée et remplacée par la somme des mâles et femelles.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Statut de santé du lot</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none focus:ring-2 focus:ring-orange-200 outline-none"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">En pleine forme</option>
                  <option value="malade">Soins requis / Isolement</option>
                  <option value="retraite">Retraité / Abattu</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`flex-1 ${btnBg} text-white p-4 rounded-2xl font-black shadow-lg shadow-orange-100 text-sm`}
                >
                  {editingChicken ? "Mettre à jour le lot" : "Confirmer l'ajout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {chickens.length === 0 && (
        <div className="bg-white rounded-[2.5rem] py-20 text-center shadow-premium border border-dashed border-gray-200">
          <Bird className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold italic">Votre inventaire est vide.</p>
        </div>
      )}
    </div>
  );
}
