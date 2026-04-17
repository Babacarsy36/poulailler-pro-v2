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
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, hasAccess, alerts } = useAuth();
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

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : isCaille ? 'emerald' : 'orange';
  const accentColor = isMixed ? "text-indigo-500" : isCaille ? "text-emerald-500" : "text-orange-500";
  const iconBg = isMixed ? "bg-indigo-500 text-white" : isCaille ? "bg-emerald-500 text-white" : "bg-orange-500 text-white";

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

    const filteredChickens = chickens.filter((c) => isItemActive(c.poultryType, c.breed));
    const filteredEggs = eggs.filter((e) => isItemActive(e.poultryType, e.poultryBreed));
    const filteredFeed = feed.filter((f) => isItemActive(f.poultryType, f.poultryBreed));

    let total = filteredChickens.reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);
    const cailleCount = filteredChickens.filter((c) => c.poultryType === 'caille').reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);
    const pouletCount = filteredChickens.filter((c) => c.poultryType === 'poulet' || !c.poultryType).reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);

    const breedsList = filteredChickens.map((c) => c.breed).filter(Boolean);
    const breakdown = [...new Set(breedsList)].slice(0, 3).join(" • ");

    const sortedEggs = [...filteredEggs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let eggsOnLastDate = 0;
    if (activeSpeciesFilter === 'all' && (!selectedBreeds || selectedBreeds.length === 0)) {
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
    if (activeSpeciesFilter === 'all') {
      ['poulet', 'caille'].forEach(type => {
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
      breakdown: breakdown || (selectedBreeds.length > 0 ? selectedBreeds.join(" • ").toUpperCase() : "Toutes races"),
      breakdownLabel: "",
      lastEggText,
      lastFeedText,
      globalBreakdown
    });
  }, [selectedDate, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger]);

  const [chartData, setChartData] = useState<{name: string, production: number}[]>([]);
  useEffect(() => {
    const eggs = StorageService.getItem<EggRecord[]>("eggs") || [];
    const last15Days = Array.from({ length: 15 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayEggs = eggs.filter((e) => e.date === dateStr && isItemActive(e.poultryType, e.poultryBreed)).reduce((acc: number, e) => acc + (e.quantity || 0), 0);
      return {
        name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        production: dayEggs
      };
    });
    setChartData(last15Days);
  }, [syncTrigger, activeSpeciesFilter, selectedBreeds]);

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
    <section id="screen-dashboard" className="space-y-6">
      
      {/* Alert Banner (Critical Alerts) */}
      {alerts.filter(a => a.severity === 'critical').map(alert => (
        <div key={alert.id} className="bg-red-50 rounded-2xl p-4 border-l-4 border-l-red-500 flex gap-3 items-start relative group">
          <iconify-icon icon="solar:danger-triangle-linear" stroke-width="1.5" className="text-2xl text-red-500 shrink-0 mt-0.5 z-10"></iconify-icon>
          <div className="z-10 pr-4">
              <p className="font-['Syne'] text-sm text-red-900 font-medium tracking-tight mb-1">{alert.title}</p>
              <p className="font-['DM_Sans'] font-light text-xs text-red-700 leading-relaxed">{alert.message}</p>
          </div>
          <button onClick={() => navigate(alert.link)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-700 z-10">
              <iconify-icon icon="solar:round-alt-arrow-right-linear" stroke-width="1.5"></iconify-icon>
          </button>
        </div>
      ))}

      {/* Recovery Banner (Only if no chickens) */}
      {stats.totalChickens === 0 && (
        <div className="clean-card rounded-2xl p-4 border-l-4 border-l-blue-500 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:refresh-circle-linear" class={`text-xl text-blue-500 ${isRecovering ? 'animate-spin' : ''}`}></iconify-icon>
            <h4 className="font-['Syne'] text-sm font-medium tracking-tight text-blue-900">Données manquantes ?</h4>
          </div>
          <p className="text-xs text-blue-700 font-light">Tentez de récupérer vos données à partir de l'ancienne version.</p>
          <button 
           onClick={handleRecover}
           disabled={isRecovering}
           className="mt-2 py-2 w-full bg-blue-50 text-blue-600 font-medium text-xs rounded-xl hover:bg-blue-100 transition-colors"
          >
             {isRecovering ? "Opération en cours..." : "Lancer la récupération"}
          </button>
        </div>
      )}

      {/* KPIs Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* KPI 1 : Effectif Global */}
          <div className="clean-card rounded-2xl h-[116px] p-3 flex flex-col justify-between border-l-4 border-l-indigo-500 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/inventory')}>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-['DM_Sans']">
                  <iconify-icon icon="solar:users-group-rounded-linear" stroke-width="1.5" className="text-xl text-indigo-500"></iconify-icon>
                  <span className="truncate font-medium">{activeSpeciesFilter !== 'all' ? "Effectif" : "Effectif Total"}</span>
              </div>
              <div>
                  <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{stats.totalChickens}</div>
                  <div className="text-xs text-indigo-700 font-medium tracking-tight bg-indigo-50 inline-block px-1.5 py-0.5 rounded truncate max-w-full">
                    {stats.breakdown}
                  </div>
              </div>
          </div>

          {/* KPI 2 : Ponte / Récolte */}
          {activeSpeciesFilter !== 'lapin' && activeSpeciesFilter !== 'pigeon' && (
            <div className="clean-card rounded-2xl h-[116px] p-3 flex flex-col justify-between border-l-4 border-l-emerald-500 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/eggs')}>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-['DM_Sans']">
                    <iconify-icon icon="solar:record-circle-linear" stroke-width="1.5" className="text-xl text-emerald-500"></iconify-icon>
                    <span className="truncate font-medium">Production</span>
                </div>
                <div>
                    <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{activeSpeciesFilter !== 'all' ? `${stats.layingRate}%` : `${stats.eggsToday}`}</div>
                    <div className="text-xs text-emerald-700 font-medium tracking-tight bg-emerald-50 inline-block px-1.5 py-0.5 rounded truncate max-w-full">
                      {activeSpeciesFilter !== 'all' ? stats.layingRateLabel : "œufs récoltés"}
                    </div>
                </div>
            </div>
          )}

          {/* KPI 3 : Stock Aliment */}
          <div className="clean-card rounded-2xl h-[116px] p-3 flex flex-col justify-between border-l-4 border-l-orange-500 hover:scale-105 transition-transform cursor-pointer col-span-2 md:col-span-1" onClick={() => navigate('/feed')}>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-['DM_Sans']">
                  <iconify-icon icon="solar:leaf-linear" stroke-width="1.5" className="text-xl text-orange-500"></iconify-icon>
                  <span className="truncate font-medium">Stock Aliment</span>
              </div>
              <div>
                  <div className="font-['JetBrains_Mono'] text-xl tracking-tight text-gray-900 mb-1 font-medium">{Math.round(stats.feedRemaining)} <span className="text-xs text-gray-400 font-normal">kg</span></div>
                  <div className={`text-xs font-medium tracking-tight inline-block px-1.5 py-0.5 rounded ${stats.feedAutonomy < 5 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                    {stats.feedAutonomy === Infinity ? 'Non calculé' : `${stats.feedAutonomy}j d'autonomie`}
                  </div>
              </div>
          </div>
      </div>

      {/* Global Breakdown (Only if no specific poultryType selected) */}
      {activeSpeciesFilter === 'all' && stats.globalBreakdown && stats.globalBreakdown.length > 0 && (
        <div className="clean-card rounded-3xl p-5 select-none">
          <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900 mb-4 ml-1">Répartition Globale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.globalBreakdown.map((item) => (
              <div key={item.type} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-50">
                    <img src={`/assets/icons/${item.type}.png`} alt={item.type} className="w-full h-full object-cover scale-110" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm capitalize">{item.type}</h4>
                    <p className="text-xs font-light text-gray-500">{item.count} sujets actifs</p>
                  </div>
                </div>
                {(item.type === 'poulet' || item.type === 'caille') && (
                  <div className="mt-3 sm:mt-0 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100/50">
                    <span className="text-[10px] font-medium text-gray-500 uppercase">Jour :</span>
                    <span className="font-['JetBrains_Mono'] font-medium text-sm text-gray-900">{item.eggs}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {activeSpeciesFilter !== 'lapin' && activeSpeciesFilter !== 'pigeon' && (
        <div className="clean-card rounded-3xl p-5 select-none relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Tendance Ponte</h2>
                {!hasAccess('PRO') && (
                  <button onClick={() => setIsUpgradeModalOpen(true)} className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100 font-medium flex items-center gap-1">
                    <iconify-icon icon="solar:crown-star-linear"></iconify-icon> PRO
                  </button>
                )}
                {hasAccess('PRO') && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">15 jours</span>}
            </div>
            <div className={`h-[140px] w-full ${!hasAccess('PRO') ? 'blur-sm grayscale opacity-30 select-none' : ''}`}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isCaille ? "#10B981" : "#F59E0B"} stopOpacity={0.2}></stop>
                            <stop offset="100%" stopColor={isCaille ? "#10B981" : "#F59E0B"} stopOpacity={0.0}></stop>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" horizontalPoints={[25, 50, 75]} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '500', fontFamily: 'DM Sans' }} />
                    <Area type="monotone" dataKey="production" stroke={isCaille ? "#10B981" : "#F59E0B"} strokeWidth={2} fill="url(#chartGrad)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            
            {!hasAccess('PRO') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px] p-4 text-center">
                  <div className="bg-white/95 border border-gray-100 rounded-2xl p-4 shadow-xl max-w-[200px]">
                    <iconify-icon icon="solar:chart-line-linear" className="text-3xl text-amber-500 mb-2"></iconify-icon>
                    <p className="text-xs text-gray-600 font-medium mb-3">Débloquez les analyses avancées</p>
                    <button onClick={() => setIsUpgradeModalOpen(true)} className="w-full text-[10px] font-medium bg-gray-900 text-white rounded-lg py-2">Mettre à niveau</button>
                  </div>
              </div>
            )}
        </div>
      )}

      {/* Guide de Gestion */}
      <div>
          <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900 mb-4 ml-1">Raccourcis</h2>
          <div className="space-y-3">
              {activeSpeciesFilter !== 'lapin' && activeSpeciesFilter !== 'pigeon' && (
                <button onClick={() => navigate("/eggs")} className="w-full clean-card rounded-2xl p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <iconify-icon icon="solar:egg-bold-duotone" stroke-width="1.5" className="text-xl text-emerald-500"></iconify-icon>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">Ponte & Production</p>
                        <p className="text-xs font-light text-gray-500 truncate">{stats.lastEggText || "Saisir les récoltes du jour"}</p>
                    </div>
                    <iconify-icon icon="solar:alt-arrow-right-linear" className="text-gray-400"></iconify-icon>
                </button>
              )}
              <button onClick={() => navigate("/feed")} className="w-full clean-card rounded-2xl p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                      <iconify-icon icon="solar:leaf-linear" stroke-width="1.5" className="text-xl text-orange-500"></iconify-icon>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">Aliment & Formules</p>
                      <p className="text-xs font-light text-gray-500 truncate">{stats.lastFeedText || "Gérer les rations"}</p>
                  </div>
                  <iconify-icon icon="solar:alt-arrow-right-linear" className="text-gray-400"></iconify-icon>
              </button>
              <button onClick={async () => { if (window.confirm("Générer des données pour le test ?")) { await SyncService.injectTestData(); window.location.reload(); } }} className="w-full clean-card rounded-2xl p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                      <iconify-icon icon="solar:database-line-duotone" stroke-width="1.5" className="text-xl text-gray-500"></iconify-icon>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">Auto-générer</p>
                      <p className="text-xs font-light text-gray-500 truncate">Injecter des données de démo</p>
                  </div>
              </button>
          </div>
      </div>

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => { setIsUpgradeModalOpen(false); if (location.search.includes('upgrade=true')) navigate('/', { replace: true }); }} />
    </section>
  );
}
