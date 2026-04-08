import { useEffect, useState } from "react";
import { Plus, Trash2, Egg, Calendar, History, TrendingUp, Edit2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { useForm } from "react-hook-form";
import { Chicken } from "../types";

interface EggRecord {
  id: string;
  date: string;
  quantity: number;
  notes: string;
  poultryType?: string;
  poultryBreed?: string;
  updatedAt?: number;
  [key: string]: any;
}

interface EggFormData {
  date: string;
  quantity: string;
  notes: string;
}

export function EggProduction() {
  const { poultryType, poultryBreed, syncTrigger, saveData } = useAuth();
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [totalFemales, setTotalFemales] = useState(0);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EggFormData>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      quantity: "",
      notes: "",
    }
  });

  const formData = watch();
  const isCaille = poultryType === 'caille';
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const btnBg = isCaille ? "bg-babs-emerald hover:bg-emerald-600" : "bg-babs-orange hover:bg-orange-600";

  useEffect(() => {
    const saved = StorageService.getItem<EggRecord[]>("eggs");
    if (saved) {
      setRecords(saved);
    }
  }, [syncTrigger]);
  
  useEffect(() => {
     const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
     const females = chickens
       .filter((c: Chicken) => {
         const typeMatch = !poultryType || c.poultryType === poultryType || (poultryType === 'poulet' && !c.poultryType);
         const breedMatch = !poultryBreed || c.breed?.toLowerCase() === poultryBreed.toLowerCase();
         return typeMatch && breedMatch;
       })
       .reduce((sum: number, c: Chicken) => sum + (typeof c.femaleCount === 'string' ? parseInt(c.femaleCount) : c.femaleCount || 0), 0);
     setTotalFemales(females);
  }, [syncTrigger, poultryType, poultryBreed]);

  const saveRecords = (newRecords: EggRecord[]) => {
    setRecords(newRecords);
    saveData("eggs", newRecords);
  };

  const onFormSubmit = (data: EggFormData) => {
    const now = Date.now();
    const newRecord: EggRecord = {
      id: now.toString(),
      date: data.date,
      quantity: Number(data.quantity),
      notes: data.notes,
      poultryType: poultryType || "poulet",
      poultryBreed: poultryBreed || undefined,
      updatedAt: now
    };
    saveRecords([newRecord, ...records]);
    reset({
      date: new Date().toISOString().split("T")[0],
      quantity: "",
      notes: "",
    });
    setIsAddOpen(false);
  };

  const filteredRecords = records.filter(r => {
    const typeMatch = !poultryType || r.poultryType === poultryType || (poultryType === 'poulet' && !r.poultryType);
    const breedMatch = !poultryBreed || r.poultryBreed?.toLowerCase() === poultryBreed.toLowerCase();
    return typeMatch && breedMatch;
  });

  const totalEggs = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-babs-brown tracking-tight">Production d'Œufs</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Suivi des Récoltes</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className={`${btnBg} text-white px-6 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold`}
        >
          <Plus className="w-5 h-5" /> Enregistrer une récolte
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-premium border border-gray-50 flex items-center gap-8 relative overflow-hidden">
        <div className={`p-6 rounded-[2rem] ${iconBg} shadow-xl shadow-orange-100`}>
          <TrendingUp className="w-10 h-10" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Production Totale</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-babs-brown">{totalEggs}</span>
            <span className="text-xl font-bold text-gray-300 uppercase tracking-widest">unités</span>
          </div>
        </div>
        <div className={`absolute right-0 top-0 h-full w-2 ${isCaille ? "bg-babs-emerald" : "bg-babs-orange"} opacity-20`}></div>
      </div>

      {/* Productivity Alert */}
      {totalFemales > 0 && filteredRecords.length > 0 && (
        <div className="animate-in slide-in-from-left duration-500">
           {(() => {
             const lastRecord = filteredRecords[0];
             const rate = (lastRecord.quantity / totalFemales) * 100;
             let tier: 'good' | 'average' | 'low' = 'good';
             if (rate < 50) tier = 'low';
             else if (rate < 70) tier = 'average';

             return (
               <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 ${
                 tier === 'good' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                 tier === 'average' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                 'bg-red-50 border-red-100 text-red-800'
               }`}>
                  <div className={`p-3 rounded-xl ${
                    tier === 'good' ? 'bg-emerald-500' :
                    tier === 'average' ? 'bg-amber-500' :
                    'bg-red-500'
                  } text-white shadow-lg`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Score de Productivité (Dernière récolte)</p>
                    <p className="text-sm font-black leading-tight">
                       {tier === 'good' ? '🚀 Excellente performance !' : 
                        tier === 'average' ? '⚖️ Production correcte.' : 
                        '⚠️ Attention : Production faible.'}
                       <span className="ml-2 opacity-50 underline decoration-dotted">Taux : {rate.toFixed(1)}%</span>
                    </p>
                    <p className="text-[9px] font-bold opacity-60 mt-1">Basé sur {totalFemales} femelles actives.</p>
                  </div>
               </div>
             )
           })()}
        </div>
      )}

      {/* History List */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
        <div className="flex items-center gap-2 mb-8 px-2">
          <History className="w-5 h-5 text-gray-300" />
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Dernières Récoltes</h3>
        </div>
        
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center ${
                  record.poultryType === 'caille' ? 'bg-emerald-50 text-babs-emerald' : 'bg-orange-50 text-babs-orange'
                }`}>
                  {record.poultryType === 'caille' ? (
                    <span className="text-2xl" title="Œufs de caille">🐚</span>
                  ) : (
                    <Egg className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <p className="font-black text-babs-brown text-lg">
                    {record.quantity} {record.poultryType === 'caille' ? 'œufs de caille' : 'œufs'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                    {new Date(record.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                    {record.poultryBreed && <span className="px-1.5 py-0.5 bg-gray-100 rounded-md text-[8px] text-gray-500">{record.poultryBreed}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {record.notes && <span className="hidden sm:inline text-xs italic text-gray-400 max-w-[150px] truncate">{record.notes}</span>}
                <button 
                  onClick={() => {
                    const newVal = window.prompt(`Modifier la quantité d'œufs pour le ${new Date(record.date).toLocaleDateString()}:`, record.quantity.toString());
                    if (newVal !== null) {
                      const parsed = parseInt(newVal);
                      if (!isNaN(parsed) && parsed >= 0) {
                        const updatedRecords = records.map(r => r.id === record.id ? { ...r, quantity: parsed, updatedAt: Date.now() } : r);
                        saveRecords(updatedRecords);
                      }
                    }
                  }}
                  className="p-3 bg-gray-50 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { if(window.confirm("Supprimer cette récolte ?")) saveRecords(records.filter(r => r.id !== record.id)); }}
                  className="p-3 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div className="py-12 text-center">
              <Egg className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold italic">Aucune donnée de production.</p>
            </div>
          )}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black text-babs-brown mb-8">Nouvelle Récolte</h3>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date de collecte</label>
                <input 
                  type="date"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                  {...register("date", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre d'œufs</label>
                <input 
                  type="number"
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 ${errors.quantity ? 'ring-2 ring-red-500' : ''}`}
                  {...register("quantity", { required: "Quantité requise", min: 1 })}
                />
                {errors.quantity && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes particulières</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                  placeholder="Ex: Quelques œufs fêlés..."
                  {...register("notes")}
                />
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
                  className={`flex-1 ${btnBg} text-white p-4 rounded-2xl font-black shadow-lg`}
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
