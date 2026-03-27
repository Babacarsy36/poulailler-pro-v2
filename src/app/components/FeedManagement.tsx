import { useEffect, useState } from "react";
import { Plus, Minus, ShoppingCart, Calendar, History, Package } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";

interface FeedEntry {
  id: string;
  date: string;
  type: "achat" | "utilisation";
  quantity: number;
  feedType: string;
  notes: string;
}

export function FeedManagement() {
  const { poultryType, syncTrigger } = useAuth();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "achat" as "achat" | "utilisation",
    quantity: "",
    feedType: "",
    notes: "",
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const btnBg = isCaille ? "bg-babs-emerald hover:bg-emerald-600" : "bg-babs-orange hover:bg-orange-600";

  useEffect(() => {
    const saved = localStorage.getItem("feed");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, [syncTrigger]);

  const saveEntries = (newEntries: FeedEntry[]) => {
    setEntries(newEntries);
    SyncService.saveCollection("feed", newEntries);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: FeedEntry = {
      id: Date.now().toString(),
      ...formData,
      quantity: Number(formData.quantity),
    };
    saveEntries([newEntry, ...entries]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "achat",
      quantity: "",
      feedType: "",
      notes: "",
    });
    setIsAddOpen(false);
  };

  const totalFeed = entries.reduce((sum, entry) => {
    return sum + (entry.type === "achat" ? entry.quantity : -entry.quantity);
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-babs-brown tracking-tight">Gestion Aliment</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Stock & Rations</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className={`${btnBg} text-white px-6 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold`}
        >
          <Plus className="w-5 h-5" /> Nouvelle opération
        </button>
      </div>

      {/* Stock Display */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-premium border border-gray-50 flex items-center gap-8 relative overflow-hidden">
        <div className={`p-6 rounded-[2rem] ${iconBg} shadow-xl shadow-orange-100`}>
          <Package className="w-10 h-10" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Stock Actuel</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black ${totalFeed < 10 ? 'text-red-500' : 'text-babs-brown'}`}>
              {totalFeed.toFixed(1)}
            </span>
            <span className="text-xl font-bold text-gray-300 uppercase tracking-widest">Kg</span>
          </div>
          {totalFeed < 10 && (
            <p className="text-[9px] font-bold text-red-500 uppercase mt-2 tracking-wider animate-pulse">Stock critique !</p>
          )}
        </div>
        <div className={`absolute right-0 top-0 h-full w-2 ${isCaille ? "bg-babs-emerald" : "bg-babs-orange"} opacity-20`}></div>
      </div>

      {/* History */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
        <div className="flex items-center gap-2 mb-8 px-2">
          <History className="w-5 h-5 text-gray-300" />
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Mouvements de Stock</h3>
        </div>
        
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center ${
                  entry.type === 'achat' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {entry.type === 'achat' ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-black text-babs-brown text-lg">
                    {entry.type === 'achat' ? '+' : '-'}{entry.quantity} kg • {entry.feedType}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(entry.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                  entry.type === 'achat' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {entry.type.toUpperCase()}
                </span>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold italic">Historique vide.</p>
            </div>
          )}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-babs-brown mb-8">Nouvelle opération</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="achat">Achat / Stock</option>
                    <option value="utilisation">Utilisation / Ration</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantité (kg)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aliment</label>
                  <input 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    value={formData.feedType}
                    onChange={e => setFormData({ ...formData, feedType: e.target.value })}
                    placeholder="Ex: Maïs, Grains..."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
