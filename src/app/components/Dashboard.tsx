import { useEffect, useState } from "react";
import { Bird, Egg, ShoppingCart, Heart, Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { poultryType, poultryBreed, syncTrigger } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalChickens: 0,
    totalPoulet: 0,
    totalCaille: 0,
    eggsToday: 0,
    layingRate: 0,
    activeLayers: 0,
    layingRateLabel: "Taux de ponte",
    layingRateHint: "",
    feedRemaining: 0,
    vaccinations: 0,
    breakdown: ""
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const borderHighlight = isCaille ? "border-l-babs-emerald" : "border-l-babs-orange";

  useEffect(() => {
    const chickens = JSON.parse(localStorage.getItem("chickens") || "[]");
    const eggs = JSON.parse(localStorage.getItem("eggs") || "[]");
    const feed = JSON.parse(localStorage.getItem("feed") || "[]");
    const health = JSON.parse(localStorage.getItem("health") || "[]");

    // Apply strict filtering based on selection
    const filteredChickens = chickens.filter((c: any) => {
      const typeMatch = !poultryType || c.poultryType?.toLowerCase() === poultryType.toLowerCase() || (poultryType === 'poulet' && !c.poultryType);
      const breedMatch = !poultryBreed || c.breed?.toLowerCase() === poultryBreed.toLowerCase();
      return typeMatch && breedMatch;
    });

    const filteredEggs = eggs.filter((e: any) => {
      // Default existing records to current selection if missing fields to avoid data loss
      const typeMatch = !e.poultryType || e.poultryType === poultryType;
      const breedMatch = !e.poultryBreed || e.poultryBreed === poultryBreed;
      return typeMatch && breedMatch;
    });

    const filteredFeed = feed.filter((f: any) => {
      const typeMatch = !f.poultryType || f.poultryType === poultryType;
      const breedMatch = !f.poultryBreed || f.poultryBreed === poultryBreed;
      return typeMatch && breedMatch;
    });

    const filteredHealth = health.filter((h: any) => {
      const typeMatch = !h.poultryType || h.poultryType === poultryType;
      const breedMatch = !h.poultryBreed || h.poultryBreed === poultryBreed;
      return typeMatch && breedMatch;
    });

    // Stats based on filtered data
    let total = filteredChickens.reduce((acc: number, c: any) => acc + (parseInt(c.count) || 1), 0);
    
    // Breaking down the filtered set (if 'Poulets' is selected but no breed, show counts of breeds)
    const cailleCount = filteredChickens.filter((c: any) => c.poultryType?.toLowerCase() === 'caille').reduce((acc: number, c: any) => acc + (parseInt(c.count) || 1), 0);
    const pouletCount = filteredChickens.filter((c: any) => c.poultryType?.toLowerCase() === 'poulet' || !c.poultryType).reduce((acc: number, c: any) => acc + (parseInt(c.count) || 1), 0);

    const breeds = filteredChickens.map((c: any) => c.breed || poultryBreed).filter(Boolean);
    const breakdown = [...new Set(breeds)]
      .slice(0, 3)
      .join(" • ");

    // Daily production on filtered eggs
    const eggsOnDate = filteredEggs
      .filter((e: any) => e.date === selectedDate)
      .reduce((acc: number, e: any) => acc + parseInt(e.quantity || 0), 0);

    const activeLots = filteredChickens.filter((c: any) => c.status === 'active');
    const hasDetailedFemaleCounts = activeLots.some((c: any) => Number(c.femaleCount || 0) > 0);
    const totalActiveLayers = activeLots.reduce((acc: number, c: any) => {
      const femaleCount = Number(c.femaleCount || 0);
      if (femaleCount > 0) return acc + femaleCount;
      return acc + (parseInt(c.count) || 1);
    }, 0);
    const layingRate = totalActiveLayers > 0 ? ((eggsOnDate / totalActiveLayers) * 100).toFixed(1) : "0";

    // Health on date (filtered)
    const healthOnDate = filteredHealth.filter((h: any) => h.date === selectedDate).length;

    setStats({
      totalChickens: total,
      totalPoulet: pouletCount,
      totalCaille: cailleCount,
      eggsToday: eggsOnDate,
      layingRate: parseFloat(layingRate),
      activeLayers: totalActiveLayers,
      layingRateLabel: hasDetailedFemaleCounts ? "Taux de ponte" : "Taux de ponte estimé",
      layingRateHint: hasDetailedFemaleCounts
        ? `${totalActiveLayers} femelles actives prises en compte`
        : `${totalActiveLayers} sujets actifs pris en compte`,
      feedRemaining: filteredFeed.reduce((acc: number, f: any) => acc + (f.type === 'achat' ? parseFloat(f.quantity || 0) : -parseFloat(f.quantity || 0)), 0),
      vaccinations: healthOnDate,
      breakdown: breakdown || (poultryBreed ? poultryBreed.toUpperCase() : "Toutes races")
    });
  }, [selectedDate, poultryType, poultryBreed, syncTrigger]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">


      {/* Date Widget (Clickable) */}
      <div className="relative group max-w-xs transition-transform active:scale-95">
        <label htmlFor="dashboard-date" className="cursor-pointer block">
        <div className="bg-card rounded-[2rem] p-6 shadow-premium flex items-center gap-4 border border-gray-50 dark:border-white/10 group-hover:border-orange-200 transition-colors">
          <div className={`p-3 ${iconBg} rounded-2xl shadow-lg`}>
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Date d'activité (cliquer)</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-babs-brown">
                {selectedDate === new Date().toISOString().split('T')[0] ? "Aujourd'hui" : 
                  new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </span>
              <div className={`w-2 h-2 rounded-full ${isCaille ? 'bg-emerald-400' : 'bg-orange-400'} animate-pulse`}></div>
            </div>
          </div>
        </div>
        </label>
        <input 
          id="dashboard-date"
          type="date"
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 1, height: 1 }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {/* Trigger click on the label works, but to be sure for all browsers: */}
        <button 
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          onClick={() => (document.getElementById('dashboard-date') as HTMLInputElement)?.showPicker?.()}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button 
          onClick={() => navigate("/inventory")}
          className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 dark:border-white/10 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg opacity-80 group-hover:opacity-100`}>
            <Bird className="w-8 h-8" />
          </div>
          <div className="mt-12 space-y-2 pb-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Effectif Total</p>
            <p className="text-5xl font-black text-babs-brown">{stats.totalChickens}</p>
            
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="bg-orange-50 text-orange-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-orange-100/50 shadow-sm">
                🐔 {stats.totalPoulet}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-emerald-100/50 shadow-sm">
                🐦 {stats.totalCaille}
              </span>
            </div>
          </div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${borderHighlight} border-l-4`}></div>
        </button>

        <button 
          onClick={() => navigate("/eggs")}
          className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 dark:border-white/10 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg`}>
            <Egg className="w-8 h-8" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">{stats.layingRateLabel}</p>
            <p className="text-5xl font-black text-babs-brown">{stats.layingRate}%</p>
            <p className="bg-blue-50/50 text-blue-800 text-[10px] font-black px-2 py-1 mt-2 rounded-lg border border-blue-100/50 mx-auto w-fit shadow-sm">
              🥚 {stats.eggsToday} récoltés auj.
            </p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              {stats.layingRateHint}
            </p>
          </div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${borderHighlight} border-l-4 opacity-40`}></div>
        </button>

        <button 
          onClick={() => navigate("/feed")}
          className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-100 dark:border-white/10 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className="absolute top-6 right-6 p-3 bg-blue-500 rounded-2xl shadow-lg text-white">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Stock Aliment</p>
            <p className="text-5xl font-black text-babs-brown">{stats.feedRemaining.toFixed(1)}<span className="text-xl ml-1">kg</span></p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2 text-red-500">
              {stats.feedRemaining < 10 ? "⚠️ Réapprovisionner bientôt" : "Stock suffisant"}
            </p>
          </div>
        </button>

        <button 
          onClick={() => navigate("/health")}
          className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-100 dark:border-white/10 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className="absolute top-6 right-6 p-3 bg-emerald-500 rounded-2xl shadow-lg text-white">
            <Heart className="w-8 h-8" />
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Soins du Jour</p>
            <p className="text-5xl font-black text-babs-brown">{stats.vaccinations}</p>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
              {stats.vaccinations > 0 ? "Actions enregistrées" : "Aucun soin aujourd'hui"}
            </p>
          </div>
        </button>
      </div>

      <div className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 dark:border-white/10 mb-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Guide de Gestion</h3>
          <ChevronRight className={`w-6 h-6 ${isCaille ? 'text-emerald-400' : 'text-orange-400'}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate("/eggs")}
            className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-orange-100 hover:bg-card transition-all text-left group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-card shadow-sm flex items-center justify-center group-hover:${iconBg} transition-colors`}>
              <Egg className={`w-7 h-7 ${accentColor} group-hover:text-white`} />
            </div>
            <div>
              <p className="text-lg font-black text-babs-brown">Ponte</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saisir les récoltes</p>
            </div>
          </button>
          <button 
            onClick={() => navigate("/feed")}
            className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-blue-100 hover:bg-card transition-all text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-card shadow-sm flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <ShoppingCart className="w-7 h-7 text-blue-500 group-hover:text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-babs-brown">Aliment</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gérer les rations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
