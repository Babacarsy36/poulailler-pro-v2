import { useEffect, useState } from "react";
import { Plus, Trash2, Egg, Calendar, History, TrendingUp } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";

interface EggRecord {
  id: string;
  date: string;
  quantity: number;
  notes: string;
}

export function EggProduction() {
  const { poultryType, syncTrigger } = useAuth();
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    notes: "",
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const btnBg = isCaille ? "bg-babs-emerald hover:bg-emerald-600" : "bg-babs-orange hover:bg-orange-600";

  useEffect(() => {
    const saved = localStorage.getItem("eggs");
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, [syncTrigger]);

  const saveRecords = (newRecords: EggRecord[]) => {
    setRecords(newRecords);
    SyncService.saveCollection("eggs", newRecords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: EggRecord = {
      id: Date.now().toString(),
      date: formData.date,
      quantity: Number(formData.quantity),
      notes: formData.notes,
    };
    saveRecords([newRecord, ...records]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      quantity: "",
      notes: "",
    });
    setIsAddOpen(false);
  };

  const totalEggs = records.reduce((sum, r) => sum + r.quantity, 0);

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

      {/* History List */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
        <div className="flex items-center gap-2 mb-8 px-2">
          <History className="w-5 h-5 text-gray-300" />
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Dernières Récoltes</h3>
        </div>
        
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <Egg className={`w-6 h-6 ${accentColor}`} />
                </div>
                <div>
                  <p className="font-black text-babs-brown text-lg">{record.quantity} œufs</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(record.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {record.notes && <span className="hidden sm:inline text-xs italic text-gray-400 max-w-[150px] truncate">{record.notes}</span>}
                <button 
                  onClick={() => saveRecords(records.filter(r => r.id !== record.id))}
                  className="p-3 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {records.length === 0 && (
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date de collecte</label>
                <input 
                  type="date"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre d'œufs</label>
                <input 
                  type="number"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes particulières</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Quelques œufs fêlés..."
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
