import { useEffect, useState } from "react";
import { Bird, Egg, ShoppingCart, Heart, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "../AuthContext";

export function Dashboard() {
  const { poultryType, poultryBreed } = useAuth();
  const [stats, setStats] = useState({
    totalChickens: 123, // Mocking values to match screenshots or as defaults
    eggsToday: 16,
    layingRate: 18.3,
    feedRemaining: 59.1,
    vaccinations: 3
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const borderHighlight = isCaille ? "border-l-babs-emerald" : "border-l-babs-orange";

  useEffect(() => {
    // In a real app, these would come from localStorage as before
    // Keeping the calculation logic but focusing on UI for now
    const chickens = JSON.parse(localStorage.getItem("chickens") || "[]");
    if (chickens.length > 0) {
      // update stats...
    }
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Titling */}
      <div className="space-y-1">
        <h2 className="text-4xl font-extrabold text-babs-brown tracking-tight">
          Sen Poulailler Pro
        </h2>
        <p className="text-babs-brown/60 font-medium text-lg uppercase tracking-widest text-sm">
          Pilotage d'Excellence
        </p>
      </div>

      {/* Date Widget */}
      <div className="bg-white rounded-[2rem] p-6 shadow-premium flex items-center gap-4 border border-gray-50 max-w-sm">
        <div className="p-3 bg-orange-50 rounded-2xl">
          <Calendar className="w-8 h-8 text-babs-orange" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-babs-orange">Date d'activité</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-babs-brown">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </span>
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Total Count */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-6 right-6 p-3 bg-gray-500/10 rounded-2xl">
            <Bird className="w-8 h-8 text-gray-600" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Effectif Total</p>
            <p className="text-5xl font-black text-babs-brown">{stats.totalChickens}</p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              3 Pondeuses • 74 Cailles • 16 Jeunes • 7 Goliath • 21 Poussins
            </p>
          </div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${borderHighlight} border-l-4`}></div>
        </div>

        {/* Laying Rate */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group">
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg shadow-orange-200`}>
            <Egg className="w-8 h-8" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Taux de Ponte (Moy. 7J)</p>
            <p className="text-5xl font-black text-babs-brown">{stats.layingRate}%</p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              Toutes volailles confondues
            </p>
          </div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${borderHighlight} border-l-4 opacity-40`}></div>
        </div>

        {/* Consumption */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-6 right-6 p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-100">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Conso. Moyenne</p>
            <p className="text-5xl font-black text-babs-brown">{stats.feedRemaining}<span className="text-xl ml-1">kg</span></p>
          </div>
        </div>

        {/* Health */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-6 right-6 p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-100">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Traitements (7J)</p>
            <p className="text-5xl font-black text-babs-brown">{stats.vaccinations}</p>
          </div>
        </div>
      </div>

      {/* Daily Guide Section (Similar to bottom of screenshot 1) */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Guide Journalier</h3>
          <ChevronRight className="w-6 h-6 text-orange-400" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-orange-50/50 border border-orange-100/50">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Egg className="w-6 h-6 text-babs-orange" />
            </div>
            <div>
              <p className="text-sm font-black text-babs-brown">Ramassage matinal</p>
              <p className="text-[10px] font-bold text-gray-400 italic">Effectué à 7h30</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-blue-50/50 border border-blue-100/50">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-black text-babs-brown">Distribution Granulés</p>
              <p className="text-[10px] font-bold text-gray-400 italic">Prochaine : 16h00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
