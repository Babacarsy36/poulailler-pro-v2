import { useEffect, useState } from "react";
import { Bird, Egg, ShoppingCart, Heart, Calendar, ChevronRight, Bell, AlertTriangle, Info, Database, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { getDaysElapsed, getDayTip } from "./incubator/types";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UpgradeModal } from "./ui/UpgradeModal";

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { poultryType, poultryBreed, syncTrigger, isPro } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(location.search.includes('upgrade=true'));
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
    breakdown: "",
    feedAutonomy: 0,
    upcoming: [] as { id: string, title: string, type: 'hatchery' | 'health', date: string, tip: string, isUrgent: boolean }[]
  });

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";
  const borderHighlight = isCaille ? "border-l-babs-emerald" : "border-l-babs-orange";

  const getDailyRateForBreed = (breed: string) => {
    if (breed.toLowerCase().includes('caille')) return 0.03;
    if (breed.toLowerCase().includes('goliath')) return 0.125;
    if (breed.toLowerCase().includes('pondeuse')) return 0.115;
    return 0.12;
  };

  useEffect(() => {
    const chickens = JSON.parse(localStorage.getItem("chickens") || "[]");
    const eggs = JSON.parse(localStorage.getItem("eggs") || "[]");
    const feed = JSON.parse(localStorage.getItem("feed") || "[]");
    const health = JSON.parse(localStorage.getItem("health") || "[]");

    const filteredChickens = chickens.filter((c: any) => {
      const typeMatch = !poultryType || c.poultryType?.toLowerCase() === poultryType.toLowerCase() || (poultryType === 'poulet' && !c.poultryType);
      const breedMatch = !poultryBreed || c.breed?.toLowerCase() === poultryBreed.toLowerCase();
      return typeMatch && breedMatch;
    });

    const filteredEggs = eggs.filter((e: any) => {
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

    let total = filteredChickens.reduce((acc: number, c: any) => acc + (parseInt(c.count) || 1), 0);
    const cailleCount = filteredChickens.filter((c: any) => c.poultryType?.toLowerCase() === 'caille').reduce((acc: number, c: any) => acc + (parseInt(c.count) || 1), 0);
    const pouletCount = filteredChickens.filter((c: any) => c.poultryType?.toLowerCase() === 'poulet' || !c.poultryType).reduce((acc: number, c: any) => acc + (parseInt(c.count) || 1), 0);

    const breeds = filteredChickens.map((c: any) => c.breed || poultryBreed).filter(Boolean);
    const breakdown = [...new Set(breeds)].slice(0, 3).join(" • ");

    const eggsOnDate = filteredEggs.filter((e: any) => e.date === selectedDate).reduce((acc: number, e: any) => acc + parseInt(e.quantity || 0), 0);

    const activeLots = filteredChickens.filter((c: any) => c.status === 'active');
    const hasDetailedFemaleCounts = activeLots.some((c: any) => Number(c.femaleCount || 0) > 0);
    const totalActiveLayers = activeLots.reduce((acc: number, c: any) => {
      const femaleCount = Number(c.femaleCount || 0);
      if (femaleCount > 0) return acc + femaleCount;
      return acc + (parseInt(c.count) || 1);
    }, 0);
    const layingRate = totalActiveLayers > 0 ? ((eggsOnDate / totalActiveLayers) * 100).toFixed(1) : "0";

    const healthOnDate = filteredHealth.filter((h: any) => h.date === selectedDate).length;

    setStats({
      totalChickens: total,
      totalPoulet: pouletCount,
      totalCaille: cailleCount,
      eggsToday: eggsOnDate,
      layingRate: parseFloat(layingRate),
      activeLayers: totalActiveLayers,
      layingRateLabel: hasDetailedFemaleCounts ? "Taux de ponte" : "Taux de ponte estimé",
      layingRateHint: hasDetailedFemaleCounts ? `${totalActiveLayers} femelles actives` : `${totalActiveLayers} sujets actifs`,
      feedRemaining: filteredFeed.reduce((acc: number, f: any) => acc + (f.type === 'achat' ? parseFloat(f.quantity || 0) : -parseFloat(f.quantity || 0)), 0),
      feedAutonomy: (() => {
        const totalKg = filteredFeed.reduce((acc: number, f: any) => acc + (f.type === 'achat' ? parseFloat(f.quantity || 0) : -parseFloat(f.quantity || 0)), 0);
        const dailyCons = filteredChickens.filter((c: any) => c.status === 'active').reduce((acc: number, c: any) => {
          const breed = c.breed || (c.poultryType === 'caille' ? 'Caille' : 'Poulet');
          return acc + (getDailyRateForBreed(breed) * (parseInt(c.count) || 1));
        }, 0);
        return dailyCons > 0 ? Math.floor(totalKg / dailyCons) : Infinity;
      })(),
      vaccinations: healthOnDate,
      breakdown: breakdown || (poultryBreed ? poultryBreed.toUpperCase() : "Toutes races"),
      upcoming: (() => {
        const hatchery = JSON.parse(localStorage.getItem("incubation") || "[]");
        const ongoing = hatchery.filter((b: any) => b.status === 'ongoing');
        return ongoing.map((b: any) => {
          const elapsed = getDaysElapsed(b.startDate);
          const day = Math.min(elapsed + 1, b.totalDays);
          const tip = getDayTip(b.species, day, b.totalDays);
          if (!tip.match(/[⚠️🔦🐣🚀]/)) return null;
          const targetDate = new Date(b.startDate);
          targetDate.setDate(targetDate.getDate() + (day - 1));
          return {
             id: b.id,
             title: b.name || b.species.toUpperCase(),
             type: 'hatchery' as const,
             date: targetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
             tip: tip.replace(/[⚠️🔦🐣🚀🪺🔄🤫🌡️]/g, ''),
             isUrgent: tip.includes('⚠️') || tip.includes('🐣')
          };
        }).filter(Boolean).slice(0, 3);
      })() as any[]
    });
  }, [selectedDate, poultryType, poultryBreed, syncTrigger]);

  const [chartData, setChartData] = useState<any[]>([]);
  useEffect(() => {
    const eggs = JSON.parse(localStorage.getItem("eggs") || "[]");
    const last15Days = Array.from({ length: 15 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayEggs = eggs.filter((e: any) => e.date === dateStr && (!poultryType || e.poultryType === poultryType)).reduce((acc: number, e: any) => acc + parseInt(e.quantity || 0), 0);
      return {
        name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        production: dayEggs
      };
    });
    setChartData(last15Days);
  }, [syncTrigger, poultryType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button onClick={() => navigate("/inventory")} className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95">
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg`}><Bird className="w-8 h-8" /></div>
          <div className="mt-12 space-y-2"><p className="text-[11px] font-black text-gray-400">EFFECTIF TOTAL</p><p className="text-5xl font-black text-babs-brown">{stats.totalChickens}</p></div>
        </button>

        <button onClick={() => navigate("/eggs")} className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95">
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg`}><Egg className="w-8 h-8" /></div>
          <div className="mt-12 space-y-2"><p className="text-[11px] font-black text-gray-400">{stats.layingRateLabel}</p><p className="text-5xl font-black text-babs-brown">{stats.layingRate}%</p></div>
        </button>
      </div>

      <div className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-100 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Performance de Ponte</h3>
           {!isPro && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-600"><Crown className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase">PRO</span></div>}
        </div>

        <div className={`h-[300px] w-full ${!isPro ? 'blur-md grayscale opacity-30 select-none' : ''}`}>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="production" stroke={isCaille ? "#10b981" : "#f59e0b"} strokeWidth={4} fill={isCaille ? "#d1fae5" : "#fef3c7"} />
              </AreaChart>
           </ResponsiveContainer>
        </div>

        {!isPro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-[2px]">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white flex flex-col items-center text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center"><Crown className="w-10 h-10 text-white" /></div>
                <h4 className="text-xl font-black text-babs-brown">Mode Analytique Pro</h4>
                <p className="text-xs text-gray-400 font-bold">Visualisez vos rendements et optimisez la rentabilité.</p>
                <button onClick={() => setIsUpgradeModalOpen(true)} className="w-full py-4 bg-babs-orange text-white rounded-2xl font-black shadow-lg">Débloquer maintenant 🚀</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 mb-10">
        <h3 className="text-xl font-black text-babs-brown uppercase mb-8">Guide de Gestion</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => navigate("/eggs")} className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50/50 border border-transparent hover:border-orange-100 transition-all text-left">
            <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center`}><Egg className={`w-7 h-7 ${accentColor}`} /></div>
            <div><p className="text-lg font-black text-babs-brown">Ponte</p><p className="text-[10px] font-bold text-gray-400 uppercase">Saisir les récoltes</p></div>
          </button>
          <button onClick={() => navigate("/feed")} className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50/50 border border-transparent hover:border-blue-100 transition-all text-left">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center"><ShoppingCart className="w-7 h-7 text-blue-500" /></div>
            <div><p className="text-lg font-black text-babs-brown">Aliment</p><p className="text-[10px] font-bold text-gray-400 uppercase">Gérer les rations</p></div>
          </button>
        </div>
      </div>

      <div className="flex justify-center pb-8">
        <button onClick={async () => { if (window.confirm("Générer données ?")) { await SyncService.injectTestData(); window.location.reload(); } }} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100/50 text-gray-400 font-black uppercase text-[10px]">
          <Database className="w-4 h-4" /> GÉNÉRER DONNÉES
        </button>
      </div>

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => { setIsUpgradeModalOpen(false); if (location.search.includes('upgrade=true')) navigate('/', { replace: true }); }} />
    </div>
  );
}
