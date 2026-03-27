import { useEffect, useState } from "react";
import { Bird, Egg, ShoppingCart, Heart, Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { poultryType, poultryBreed } = useAuth();
  const [stats, setStats] = useState({
    totalChickens: 0,
    eggsToday: 0,
    layingRate: 0,
    feedRemaining: 0,
    vaccinations: 0,
    breakdown: ""
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const borderHighlight = isCaille ? "border-l-babs-emerald" : "border-l-babs-orange";

  useEffect(() => {
    // Read from localStorage
    const chickens = JSON.parse(localStorage.getItem("chickens") || "[]");
    const eggs = JSON.parse(localStorage.getItem("eggs") || "[]");
    const feed = JSON.parse(localStorage.getItem("feed") || "[]");
    const health = JSON.parse(localStorage.getItem("health") || "[]");

    // Filter by type if needed (currently global as per previous sessions)
    const total = chickens.reduce((acc: number, c: any) => acc + parseInt(c.count || 0), 0);
    
    // Breakdown string
    const breakdown = chickens
      .map((c: any) => `${c.count} ${c.type}`)
      .slice(0, 5)
      .join(" • ");

    // Eggs today
    const today = new Date().toISOString().split('T')[0];
    const eggsToday = eggs
      .filter((e: any) => e.date === today)
      .reduce((acc: number, e: any) => acc + parseInt(e.count || 0), 0);

    // Laying rate (simplified)
    const activeLayers = chickens.filter((c: any) => c.isAdult).reduce((acc: number, c: any) => acc + parseInt(c.count || 0), 0);
    const layingRate = activeLayers > 0 ? ((eggsToday / activeLayers) * 100).toFixed(1) : "0";

    setStats({
      totalChickens: total,
      eggsToday: eggsToday,
      layingRate: parseFloat(layingRate),
      feedRemaining: feed.length > 0 ? parseFloat(feed[feed.length-1].remaining || 0) : 0,
      vaccinations: health.length, // Simulating last 7 days count
      breakdown: breakdown || "Aucune donnée enregistrée"
    });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Total Count */}
        <button 
          onClick={() => navigate("/inventory")}
          className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className="absolute top-6 right-6 p-3 bg-gray-500/10 rounded-2xl group-hover:bg-gray-500/20 transition-colors">
            <Bird className="w-8 h-8 text-gray-600" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Effectif Total</p>
            <p className="text-5xl font-black text-babs-brown">{stats.totalChickens}</p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              {stats.breakdown}
            </p>
          </div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${borderHighlight} border-l-4`}></div>
        </button>

        {/* Laying Rate */}
        <button 
          onClick={() => navigate("/eggs")}
          className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg shadow-orange-200 group-hover:shadow-orange-300 transition-all`}>
            <Egg className="w-8 h-8" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Taux de Ponte (Jour)</p>
            <p className="text-5xl font-black text-babs-brown">{stats.layingRate}%</p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              {stats.eggsToday} œufs ramassés aujourd'hui
            </p>
          </div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${borderHighlight} border-l-4 opacity-40`}></div>
        </button>

        {/* Consumption */}
        <button 
          onClick={() => navigate("/feed")}
          className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className="absolute top-6 right-6 p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-100 group-hover:bg-blue-600 transition-colors">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Stock Aliment</p>
            <p className="text-5xl font-black text-babs-brown">{stats.feedRemaining}<span className="text-xl ml-1">kg</span></p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              Dernier relevé d'inventaire
            </p>
          </div>
        </button>

        {/* Health */}
        <button 
          onClick={() => navigate("/health")}
          className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className="absolute top-6 right-6 p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-100 group-hover:bg-emerald-600 transition-colors">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Traitements</p>
            <p className="text-5xl font-black text-babs-brown">{stats.vaccinations}</p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              Enregistrements au carnet
            </p>
          </div>
        </button>
      </div>

      {/* Daily Guide Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Guide Journalier</h3>
          <ChevronRight className="w-6 h-6 text-orange-400" />
        </div>
        <div className="space-y-4">
          <button 
            onClick={() => navigate("/eggs")}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-orange-50/50 border border-orange-100/50 hover:bg-orange-50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Egg className="w-6 h-6 text-babs-orange" />
            </div>
            <div>
              <p className="text-sm font-black text-babs-brown">Ramassage matinal</p>
              <p className="text-[10px] font-bold text-gray-400 italic">Cliquer pour enregistrer la ponte</p>
            </div>
          </button>
          <button 
            onClick={() => navigate("/feed")}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-blue-50/50 border border-blue-100/50 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-black text-babs-brown">Distribution Granulés</p>
              <p className="text-[10px] font-bold text-gray-400 italic">Cliquer pour gérer le stock</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
