import { useState, useEffect } from "react";
import { Heart, Plus, Search, Shield, Leaf, AlertCircle, ChevronRight, History } from "lucide-react";
import { useAuth } from "../AuthContext";

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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("health") || "[]");
    setRecords(saved.length > 0 ? saved : [
      { id: "1", date: "2026-03-25", type: "Vaccin", title: "Newcastle (HB1)", target: "Poulets Goliath", status: "Complété" },
      { id: "2", date: "2026-03-20", type: "Prévention", title: "Déparasitage naturel", target: "Toutes volailles", status: "Complété" }
    ]);
  }, []);

  const protocols = [
    { title: "Gombo & Ail", desc: "Antibiotique naturel puissant pour renforcer l'immunité.", usage: "Broyer et mélanger à l'eau de boisson (2j/semaine)." },
    { title: "Aloe Vera", desc: "Idéal pour les problèmes respiratoires et la cicatrisation.", usage: "Gel pur mélangé (10ml par litre d'eau)." },
    { title: "Feuilles de Papaye", desc: "Vermifuge naturel efficace contre les parasites internes.", usage: "Infusion de feuilles séchées." }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <div className={`p-3 rounded-2xl ${record.type === 'Vaccin' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-babs-brown text-sm">{record.title}</p>
                  <p className="text-[10px] font-bold text-gray-400">{record.target} • {new Date(record.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black px-2 py-1 rounded-full ${record.status === 'Complété' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {record.status}
                </span>
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
            <div key={i} className="bg-emerald-50/30 rounded-[2rem] p-6 border border-emerald-100/30 group hover:bg-emerald-50 transition-all">
              <p className="font-black text-emerald-700 mb-1">{p.title}</p>
              <p className="text-xs text-gray-600 mb-3">{p.desc}</p>
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-white p-2 rounded-xl shadow-sm">
                <span>Usage recommandé</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
