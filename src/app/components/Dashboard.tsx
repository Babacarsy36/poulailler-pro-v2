import { useEffect, useState } from "react";
import { Bird, Egg, ShoppingCart, ChevronRight, Database, Crown, AlertOctagon, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UpgradeModal } from "./ui/UpgradeModal";
import { Chicken, EggRecord, FeedEntry, HealthRecord } from "../types";
import { toast } from "sonner";

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { poultryType, poultryBreed, syncTrigger, isPro, alerts } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(location.search.includes('upgrade=true'));
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
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
    feedAutonomy: 0,
    breakdown: "",
    breakdownLabel: "",
    lastEggText: "",
    lastFeedText: "",
    globalBreakdown: [] as { type: string, count: number, eggs: number }[]
  });
  const [isRecovering, setIsRecovering] = useState(false);

  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const iconBg = isCaille ? "bg-babs-emerald text-white" : "bg-babs-orange text-white";

  const getDailyRateForBreed = (breed: string) => {
    if (breed.toLowerCase().includes('caille')) return 0.03;
    if (breed.toLowerCase().includes('goliath')) return 0.125;
    if (breed.toLowerCase().includes('pondeuse')) return 0.115;
    return 0.12;
  };

  useEffect(() => {
    const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
    const eggs = StorageService.getItem<EggRecord[]>("eggs") || [];
    const feed = StorageService.getItem<FeedEntry[]>("feed") || [];
    // const health = StorageService.getItem<HealthRecord[]>("health") || [];

    const filteredChickens = chickens.filter((c) => {
      const typeMatch = !poultryType || c.poultryType === poultryType || (poultryType === 'poulet' && !c.poultryType);
      const breedMatch = !poultryBreed || c.breed?.toLowerCase() === poultryBreed.toLowerCase();
      return typeMatch && breedMatch;
    });

    const filteredEggs = eggs.filter((e) => {
      const typeMatch = !poultryType || e.poultryType === poultryType || (poultryType === 'poulet' && !e.poultryType);
      const breedMatch = !poultryBreed || e.poultryBreed?.toLowerCase() === poultryBreed.toLowerCase();
      return typeMatch && breedMatch;
    });

    const filteredFeed = feed.filter((f) => {
      const typeMatch = !poultryType || f.poultryType === poultryType || (poultryType === 'poulet' && !f.poultryType);
      const breedMatch = !poultryBreed || f.poultryBreed?.toLowerCase() === poultryBreed.toLowerCase();
      return typeMatch && breedMatch;
    });

    let total = filteredChickens.reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);
    const cailleCount = filteredChickens.filter((c) => c.poultryType === 'caille').reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);
    const pouletCount = filteredChickens.filter((c) => c.poultryType === 'poulet' || !c.poultryType).reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);

    const breeds = filteredChickens.map((c) => c.breed || poultryBreed).filter(Boolean);
    const breakdown = [...new Set(breeds)].slice(0, 3).join(" • ");

    const sortedEggs = [...filteredEggs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let eggsOnLastDate = 0;
    if (!poultryType && !poultryBreed) {
      const groups = [...new Set(filteredEggs.map(e => `${e.poultryType || 'poulet'}-${e.poultryBreed || ''}`))];
      groups.forEach(g => {
        const t = g.split('-')[0];
        const b = g.slice(t.length + 1);
        const groupEggs = filteredEggs.filter(e => (e.poultryType || 'poulet') === t && (e.poultryBreed || '') === b);
        const sorted = groupEggs.sort((a,z) => new Date(z.date).getTime() - new Date(a.date).getTime());
        if (sorted.length > 0) eggsOnLastDate += sorted[0].quantity;
      });
    } else {
      const lastEggDate = sortedEggs.length > 0 ? sortedEggs[0].date : selectedDate;
      eggsOnLastDate = filteredEggs.filter((e) => e.date === lastEggDate).reduce((acc: number, e) => acc + (e.quantity || 0), 0);
    }

    const activeLots = filteredChickens.filter((c) => c.status === 'active');
    const hasDetailedFemaleCounts = activeLots.some((c) => Number(c.femaleCount || 0) > 0);
    const totalActiveLayers = activeLots.reduce((acc: number, c) => {
      const femaleCount = Number(c.femaleCount || 0);
      if (femaleCount > 0) return acc + femaleCount;
      return acc + (Number(c.count) || 1);
    }, 0);
    const layingRate = totalActiveLayers > 0 ? ((eggsOnLastDate / totalActiveLayers) * 100).toFixed(1) : "0";

    const globalBreakdown: { type: string, count: number, eggs: number }[] = [];
    if (!poultryType) {
      ['poulet', 'caille', 'pigeon', 'lapin'].forEach(type => {
        const tCount = filteredChickens.filter(c => (c.poultryType || 'poulet') === type && c.status === 'active').reduce((acc, c) => acc + (Number(c.count) || 1), 0);
        let tEggs = 0;
        if (type !== 'lapin' && type !== 'pigeon') {
            const tEggsList = filteredEggs.filter(e => (e.poultryType || 'poulet') === type);
            const groups = [...new Set(tEggsList.map(e => e.poultryBreed || ''))];
            groups.forEach(b => {
              const groupEggs = tEggsList.filter(e => (e.poultryBreed || '') === b);
              const sorted = groupEggs.sort((a,z) => new Date(z.date).getTime() - new Date(a.date).getTime());
              if (sorted.length > 0) tEggs += sorted[0].quantity;
            });
        }
        if (tCount > 0) {
            globalBreakdown.push({ type, count: tCount, eggs: tEggs });
        }
      });
    }

    const totalFeedKg = filteredFeed.reduce((acc: number, f) => acc + (f.type === 'achat' ? (f.quantity || 0) : -(f.quantity || 0)), 0);
    const dailyFeedCons = activeLots.reduce((acc: number, c) => {
      const breed = c.breed || (c.poultryType === 'caille' ? 'Caille' : 'Poulet');
      return acc + (getDailyRateForBreed(breed) * (Number(c.count) || 1));
    }, 0);

    const sortedFeed = [...filteredFeed].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastFeedText = sortedFeed.length > 0 ? `${sortedFeed[0].type === 'achat' ? 'Achat: ' : 'Consommé: '} ${sortedFeed[0].quantity}kg` : '';
    const lastEggText = sortedEggs.length > 0 ? `Dernier: ${sortedEggs[0].quantity} œufs` : '';

    setStats({
      totalChickens: total,
      totalPoulet: pouletCount,
      totalCaille: cailleCount,
      eggsToday: eggsOnLastDate,
      layingRate: parseFloat(layingRate),
      activeLayers: totalActiveLayers,
      layingRateLabel: hasDetailedFemaleCounts ? "Taux de ponte" : "Taux de ponte est. ",
      layingRateHint: hasDetailedFemaleCounts ? `${totalActiveLayers} femelles actives` : `${totalActiveLayers} sujets actifs`,
      feedRemaining: totalFeedKg,
      feedAutonomy: dailyFeedCons > 0 ? Math.floor(totalFeedKg / dailyFeedCons) : Infinity,
      breakdown: breakdown || (poultryBreed ? poultryBreed.toUpperCase() : "Toutes races"),
      breakdownLabel: "",
      lastEggText,
      lastFeedText,
      globalBreakdown
    });
  }, [selectedDate, poultryType, poultryBreed, syncTrigger]);

  const [chartData, setChartData] = useState<{name: string, production: number}[]>([]);
  useEffect(() => {
    const eggs = StorageService.getItem<EggRecord[]>("eggs") || [];
    const last15Days = Array.from({ length: 15 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayEggs = eggs.filter((e) => e.date === dateStr && (!poultryType || e.poultryType === poultryType)).reduce((acc: number, e) => acc + (e.quantity || 0), 0);
      return {
        name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        production: dayEggs
      };
    });
    setChartData(last15Days);
  }, [syncTrigger, poultryType, poultryBreed]); // Ensure breed also triggers reload if relevant

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      const result = await SyncService.recoverLegacyData();
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.info(result.message);
      }
    } catch (e) {
      toast.error("Échec de la récupération.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Recovery Banner (Only if no chickens) */}
      {stats.totalChickens === 0 && (
        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-400/30 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner"><RefreshCw className={`w-7 h-7 text-white ${isRecovering ? 'animate-spin' : ''}`} /></div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1">Restauration Système</p>
                 <h4 className="text-xl font-black leading-tight">Données manquantes ?</h4>
                 <p className="text-xs font-bold opacity-80 mt-1 max-w-sm">Si vos lots de volailles ne s'affichent pas, nous pouvons tenter de les récupérer de votre ancienne version.</p>
              </div>
           </div>
           <button 
            onClick={handleRecover}
            disabled={isRecovering}
            className="relative z-10 whitespace-nowrap px-10 py-5 bg-white text-blue-600 font-black rounded-2xl shadow-2xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-[11px]"
           >
              {isRecovering && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isRecovering ? "Opération en cours..." : "Reprendre mes données"}
           </button>
        </div>
      )}
      {/* Critical Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-3">
           {alerts.filter(a => a.severity === 'critical').map(alert => (
             <button 
                key={alert.id}
                onClick={() => navigate(alert.link)}
                className="w-full flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-[2rem] text-left hover:scale-[1.01] transition-transform shadow-sm group"
             >
                <div className="p-3 bg-white rounded-2xl text-red-500 shadow-sm group-hover:rotate-12 transition-transform">
                   <AlertOctagon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Attention Immédiate</p>
                   <p className="font-black text-babs-brown text-sm">{alert.title}</p>
                   <p className="text-[11px] font-bold text-gray-500 leading-tight">{alert.message}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300" />
             </button>
           ))}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${poultryType === 'lapin' || poultryType === 'pigeon' ? '' : 'sm:grid-cols-2'}`}>
        <button onClick={() => navigate("/inventory")} className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95">
          <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg`}><Bird className="w-8 h-8" /></div>
          <div className="mt-12 space-y-2">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              {poultryType ? "EFFECTIF ESPÈCE" : "EFFECTIF TOTAL FERME"}
            </p>
            <p className="text-5xl font-black text-babs-brown">{stats.totalChickens}</p>
          </div>
        </button>

        {poultryType !== 'lapin' && poultryType !== 'pigeon' && (
          <button onClick={() => navigate("/eggs")} className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95">
            <div className={`absolute top-6 right-6 p-3 ${iconBg} rounded-2xl shadow-lg`}><Egg className="w-8 h-8" /></div>
            <div className="mt-12 space-y-2">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {poultryType ? stats.layingRateLabel : "RÉCOLTE GLOBALE"}
              </p>
              <p className="text-5xl font-black text-babs-brown">
                {poultryType ? `${stats.layingRate}%` : `${stats.eggsToday} œufs`}
              </p>
            </div>
          </button>
        )}
      </div>

      {!poultryType && stats.globalBreakdown && stats.globalBreakdown.length > 0 && (
        <div className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 mb-6">
          <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider mb-6">Répartition par Espèce</h3>
          <div className="space-y-4">
            {stats.globalBreakdown.map((item) => (
              <div key={item.type} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-50">
                    <img src={`/assets/icons/${item.type}.png`} alt={item.type} className="w-full h-full object-cover scale-110" />
                  </div>
                  <div>
                    <h4 className="font-black text-babs-brown text-lg capitalize">{item.type}</h4>
                    <p className="text-xs font-bold text-gray-500">{item.count} sujets actifs</p>
                  </div>
                </div>
                {(item.type === 'poulet' || item.type === 'caille') && (
                  <div className="mt-4 sm:mt-0 px-5 py-2 bg-white rounded-xl shadow-sm text-center border border-gray-100/50">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Production Jour</p>
                    <p className="font-black text-babs-brown">{item.eggs} œufs</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {poultryType !== 'lapin' && poultryType !== 'pigeon' && (
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
      )}

      <div className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-gray-50 mb-10">
        <h3 className="text-xl font-black text-babs-brown uppercase mb-8">Guide de Gestion</h3>
        <div className={`grid grid-cols-1 ${poultryType !== 'lapin' && poultryType !== 'pigeon' ? 'sm:grid-cols-2' : ''} gap-4`}>
          {poultryType !== 'lapin' && poultryType !== 'pigeon' && (
            <button onClick={() => navigate("/eggs")} className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50/50 border border-transparent hover:border-orange-100 transition-all text-left">
              <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center`}><Egg className={`w-7 h-7 ${accentColor}`} /></div>
              <div><p className="text-lg font-black text-babs-brown">Ponte</p><p className="text-[10px] font-bold text-gray-400 uppercase">{stats.lastEggText || "Saisir les récoltes"}</p></div>
            </button>
          )}
          <button onClick={() => navigate("/feed")} className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50/50 border border-transparent hover:border-blue-100 transition-all text-left">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center"><ShoppingCart className="w-7 h-7 text-blue-500" /></div>
            <div><p className="text-lg font-black text-babs-brown">Aliment</p><p className="text-[10px] font-bold text-gray-400 uppercase">{stats.lastFeedText || "Gérer les rations"}</p></div>
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
