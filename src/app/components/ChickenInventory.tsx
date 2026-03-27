import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Bird, Calendar, Hash, Palette } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";

interface Chicken {
  id: string;
  name: string;
  breed: string;
  age: number;
  color: string;
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
    color: "",
    status: "active" as "active" | "malade" | "retraite",
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const btnBg = isCaille ? "bg-babs-emerald hover:bg-emerald-600" : "bg-babs-orange hover:bg-orange-600";

  useEffect(() => {
    const saved = localStorage.getItem("chickens");
    if (saved) {
      setChickens(JSON.parse(saved));
    }
  }, [syncTrigger]);

  const saveChickens = (newChickens: Chicken[]) => {
    setChickens(newChickens);
    SyncService.saveCollection("chickens", newChickens);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChicken) {
      const updated = chickens.map((c) =>
        c.id === editingChicken.id ? { ...c, ...formData, age: Number(formData.age) } : c
      );
      saveChickens(updated);
      setEditingChicken(null);
    } else {
      const newChicken: Chicken = {
        id: Date.now().toString(),
        ...formData,
        age: Number(formData.age),
      };
      saveChickens([...chickens, newChicken]);
    }
    setFormData({ name: "", breed: poultryBreed || "", age: "", color: "", status: "active" });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-babs-brown tracking-tight">
            Inventaire {isCaille ? "Cailles" : "Poulets"}
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Gestion du Cheptel</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className={`${btnBg} text-white px-6 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold`}
        >
          <Plus className="w-5 h-5" />
          Ajouter {isCaille ? "une caille" : "une poule"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {chickens.map((chicken) => (
          <div key={chicken.id} className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 relative overflow-hidden group hover:border-orange-100 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl ${iconBg} shadow-lg shadow-orange-100`}>
                <Bird className="w-6 h-6" />
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
                  <Palette className="w-4 h-4 text-gray-300" />
                  <span className="text-xs font-bold text-gray-500">{chicken.color}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => {
                    setEditingChicken(chicken);
                    setFormData({ ...chicken, age: chicken.age.toString() });
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-babs-brown mb-8">
              {editingChicken ? "Modifier" : "Nouvel enregistrement"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nom / Identifiant</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Âge (mois)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Couleur</label>
                  <input 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Statut de santé</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">En pleine forme</option>
                  <option value="malade">Soins requis</option>
                  <option value="retraite">Retraité</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`flex-1 ${btnBg} text-white p-4 rounded-2xl font-black shadow-lg shadow-orange-100`}
                >
                  {editingChicken ? "Mettre à jour" : "Confirmer"}
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
