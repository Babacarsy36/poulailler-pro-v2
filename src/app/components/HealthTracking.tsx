import { useState, useEffect } from "react";
import { Heart, Plus, Search, Shield, Leaf, AlertCircle, ChevronRight, History, Trash2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";

interface HealthRecord {
  id: string;
  date: string;
  type: "Vaccin" | "Traitement" | "Prévention";
  title: string;
  target: string;
  status: "Complété" | "En attente";
}

export function HealthTracking() {
  const { poultryType } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const btnBg = isCaille ? "bg-babs-emerald hover:bg-emerald-600" : "bg-babs-orange hover:bg-orange-600";

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Vaccin" as const,
    title: "",
    target: "",
    status: "Complété" as const,
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("health") || "[]");
    setRecords(saved.length > 0 ? saved : [
      { id: "1", date: "2026-03-25", type: "Vaccin", title: "Newcastle (HB1)", target: "Poulets Goliath", status: "Complété" },
      { id: "2", date: "2026-03-20", type: "Prévention", title: "Déparasitage naturel", target: "Toutes volailles", status: "Complété" }
    ]);
  }, [syncTrigger]);

  const saveRecords = (newRecords: HealthRecord[]) => {
    setRecords(newRecords);
    SyncService.saveCollection("health", newRecords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: HealthRecord = {
      id: Date.now().toString(),
      ...formData,
    };
    saveRecords([newRecord, ...records]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "Vaccin",
      title: "",
      target: "",
      status: "Complété",
    });
    setShowAdd(false);
  };

  const [expandedRemedy, setExpandedRemedy] = useState<number | null>(null);

  const protocols = [
    { title: "Gombo & Ail", desc: "Antibiotique naturel puissant pour renforcer l'immunité.", usage: "Broyer et mélanger à l'eau de boisson (2j/semaine)." },
    { title: "Aloe Vera", desc: "Idéal pour les problèmes respiratoires et la cicatrisation.", usage: "Gel pur mélangé (10ml par litre d'eau)." },
    { title: "Feuilles de Papaye", desc: "Vermifuge naturel efficace contre les parasites internes.", usage: "Infusion de feuilles séchées." }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-babs-brown tracking-tight">Suivi de Santé</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Vitalité & Protection</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className={`${iconBg} p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm hidden sm:inline">Ajouter un soin</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-50">
          <Shield className={`w-8 h-8 ${accentColor} mb-2`} />
          <p className="text-2xl font-black text-babs-brown">{records.filter(r => r.type === 'Vaccin').length}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vaccins à jour</p>
        </div>
        <div className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-50">
          <AlertCircle className="w-8 h-8 text-blue-500 mb-2" />
          <p className="text-2xl font-black text-babs-brown">{records.filter(r => r.status === 'En attente').length}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Soins en attente</p>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-babs-brown/40" />
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Historique des Soins</h3>
        </div>
        
        <div className="space-y-4">
          {records.map(record => (
            <div key={record.id} className="flex items-center justify-between p-4 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  record.type === 'Vaccin' ? 'bg-orange-100 text-orange-600' : 
                  record.type === 'Traitement' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-babs-brown text-sm">{record.title}</p>
                  <p className="text-[10px] font-bold text-gray-400">{record.target} • {new Date(record.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black px-2 py-1 rounded-full ${record.status === 'Complété' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {record.status}
                </span>
                <button 
                  onClick={() => saveRecords(records.filter(r => r.id !== record.id))}
                  className="p-2 text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Natural Remedies Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-500" />
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Remèdes Naturels</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {protocols.map((p, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="bg-emerald-50/30 rounded-[2rem] p-6 border border-emerald-100/30 group hover:bg-emerald-50 transition-all flex flex-col h-full">
                <p className="font-black text-emerald-700 mb-1">{p.title}</p>
                <p className="text-xs text-gray-600 mb-3 flex-grow">{p.desc}</p>
                <button 
                  onClick={() => setExpandedRemedy(expandedRemedy === i ? null : i)}
                  className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-white p-2 rounded-xl shadow-sm hover:scale-[1.02] transition-transform"
                >
                  <span>{expandedRemedy === i ? "Masquer" : "Usage recommandé"}</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${expandedRemedy === i ? 'rotate-90' : ''}`} />
                </button>
              </div>
              {expandedRemedy === i && (
                <div className="bg-white p-4 rounded-2xl shadow-premium border border-emerald-50 text-[10px] font-medium text-gray-600 animate-in slide-in-from-top-2 duration-300">
                  <p className="leading-relaxed"><strong className="text-emerald-700 uppercase tracking-tighter mr-1">Tuto :</strong>{p.usage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-babs-brown mb-8">Nouveau Soin</h3>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type de soin</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="Vaccin">Vaccination</option>
                    <option value="Traitement">Traitement Curatif</option>
                    <option value="Prévention">Prévention / Naturel</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Libellé du soin</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Vaccin Newcastle..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cible (Sujets concernés)</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={formData.target}
                  onChange={e => setFormData({ ...formData, target: e.target.value })}
                  placeholder="Ex: Tous les poussins..."
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`flex-1 ${btnBg} text-white p-4 rounded-2xl font-black shadow-lg`}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
