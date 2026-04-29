import { useEffect, useState } from "react";
import { Bird, Egg, ShoppingCart, ChevronRight, Database, Crown, AlertOctagon, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UpgradeModal } from "./ui/UpgradeModal";
import { Chicken, EggRecord, FeedEntry, HealthRecord, Transaction, PoultryType } from "../types";
import { toast } from "sonner";
import { OnboardingGuide } from "./OnboardingGuide";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, hasAccess, alerts, user, isInitialPullDone } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(location.search.includes('upgrade=true'));
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonthState] = useState(() => {
      const saved = localStorage.getItem('dashboard_selected_month');
      if (saved) return saved;
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const setSelectedMonth = (m: string) => {
    setSelectedMonthState(m);
    localStorage.setItem('dashboard_selected_month', m);
  };

  const isCaille = activeSpeciesFilter === 'caille';
  const isPigeon = activeSpeciesFilter === 'pigeon';
  const isLapin = activeSpeciesFilter === 'lapin';
  const isMixed = activeSpeciesFilter === 'all';
  
  const accentColor = isMixed ? "text-indigo-500" : isCaille ? "text-emerald-500" : isPigeon ? "text-sky-500" : isLapin ? "text-purple-500" : "text-orange-500";
  const iconBg = isMixed ? "bg-indigo-500 text-white" : isCaille ? "bg-emerald-500 text-white" : isPigeon ? "bg-sky-500 text-white" : isLapin ? "bg-purple-500 text-white" : "bg-orange-500 text-white";

  const getDailyRateForLot = (c: Chicken) => {
    const breed = c.breed || (c.poultryType === 'caille' ? 'Caille' : 'Poulet de chair');
    
    // Exact same phases as FeedManagement.tsx
    const getPhases = (b: string) => {
        if (b === 'Pondeuse') return [{d: [1, 28], c: [15, 30]}, {d: [29, 126], c: [40, 80]}, {d: [127, 999], c: [110, 120]}];
        if (b === 'Caille') return [{d: [1, 14], c: [5, 10]}, {d: [15, 42], c: [15, 20]}, {d: [43, 999], c: [25, 30]}];
        if (['Poulet Fermier', 'Poule d\'Ornement', 'Goliath', 'Brahma', 'Cochin'].includes(b)) return [{d: [1, 28], c: [20, 40]}, {d: [29, 60], c: [50, 100]}, {d: [61, 999], c: [120, 160]}];
        return [{d: [1, 21], c: [30, 60]}, {d: [22, 35], c: [80, 120]}, {d: [36, 999], c: [150, 180]}];
    };

    const phases = getPhases(breed);
    const arrDate = new Date(c.arrivalDate || c.startDate || c.date || Date.now());
    const ageDays = Math.ceil(Math.abs(Date.now() - arrDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    let phase = phases.find(p => ageDays >= p.d[0] && ageDays <= p.d[1]);
    if (!phase) phase = phases[phases.length - 1];
    
    const avgGrams = (phase.c[0] + phase.c[1]) / 2;
    return avgGrams / 1000; // in Kg
  };

  const handleDeepSync = async () => {
    setIsRecovering(true);
    toast.promise(
        async () => {
            const uid = user!.uid;
            await SyncService.recoverLegacyData(uid);
            await SyncService.pullCloudToLocal(uid, true);
            await SyncService.pushLocalToCloud(uid, true);
            setTimeout(() => window.location.reload(), 1000);
        },
        {
          loading: 'Synchronisation profonde en cours...',
          success: 'Données synchronisées et unifiées !',
          error: 'Échec de la synchronisation.',
        }
    );
  };

  useEffect(() => {
    const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
    const eggs = StorageService.getItem<EggRecord[]>("eggs") || [];
    const feed = StorageService.getItem<FeedEntry[]>("feed") || [];
    const transactions = StorageService.getItem<Transaction[]>("finances") || [];

    // Finances are GLOBAL on dashboard too
    const filteredTransactions = transactions.filter(t => {
      if (t._deleted) return false;
      const transMonth = t.date.substring(0, 7);
      return transMonth === selectedMonth;
    });

    const filteredChickens = chickens.filter((c) => !c._deleted && isItemActive(c.poultryType, c.breed));
    const filteredEggs = eggs.filter((e) => !e._deleted && isItemActive(e.poultryType, e.poultryBreed));
    const filteredFeed = feed.filter((f) => !f._deleted && isItemActive(f.poultryType, f.poultryBreed));

    let total = filteredChickens.reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);
    const cailleCount = filteredChickens.filter((c) => c.poultryType?.toLowerCase() === 'caille').reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);
    const pouletCount = filteredChickens.filter((c) => !c.poultryType || c.poultryType.toLowerCase() === 'poulet').reduce((acc: number, c) => acc + (Number(c.count) || 1), 0);

    const breedsList = filteredChickens.map((c) => c.breed).filter(Boolean);
    const breakdown = [...new Set(breedsList)].slice(0, 3).join(" • ");

    const sortedEggs = [...filteredEggs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let eggsOnLastDate = 0;
    if (activeSpeciesFilter === 'all' && (!selectedBreeds || selectedBreeds.length === 0)) {
       const groups = [...new Set(filteredEggs.map(e => `${(e.poultryType || 'poulet').toLowerCase()}-${(e.poultryBreed || '').toLowerCase()}`))];
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
    const nowTime = new Date().getTime();
    const activeLayersLots = activeLots.filter((c) => {
        // If no arrivalDate recorded, assume the animal is mature enough to lay
        if (!c.arrivalDate) return true;
        const arrival = new Date(c.arrivalDate).getTime();
        const ageDays = Math.ceil(Math.abs(nowTime - arrival) / (1000 * 60 * 60 * 24));
        let minAge = 140;
        if (c.poultryType === 'caille') minAge = 42;
        else if (c.breed?.toLowerCase().includes('fermier')) minAge = 150;
        else if (c.breed?.toLowerCase().includes('ornement')) minAge = 160;
        return ageDays >= minAge;
    });

    const hasDetailedFemaleCounts = activeLayersLots.some((c) => Number(c.femaleCount || 0) > 0);
    const totalActiveLayers = activeLayersLots.reduce((acc: number, c) => {
      const femaleCount = Number(c.femaleCount || 0);
      if (femaleCount > 0) return acc + femaleCount;
      return acc + (Number(c.count) || 1);
    }, 0);
    const layingRate = totalActiveLayers > 0 ? ((eggsOnLastDate / totalActiveLayers) * 100).toFixed(1) : "0";

    const globalBreakdown: { type: string, count: number, eggs: number }[] = [];
    if (activeSpeciesFilter === 'all') {
      ['poulet', 'caille'].forEach(type => {
        const tCount = filteredChickens.filter(c => (c.poultryType?.toLowerCase() || 'poulet') === type && c.status === 'active').reduce((acc, c) => acc + (Number(c.count) || 1), 0);
        let tEggs = 0;
        if (type !== 'lapin' && type !== 'pigeon') {
            const tEggsList = filteredEggs.filter(e => (e.poultryType?.toLowerCase() || 'poulet') === type);
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

    // Feed Stock is always GLOBAL to avoid negative values when filtering
    const totalFeedKg = feed.filter(f => !f._deleted).reduce((acc: number, f) => acc + (f.type === 'achat' ? (f.quantity || 0) : -(f.quantity || 0)), 0);
    
    // Autonomy calculation matching FeedManagement's logic
    const dailyFeedCons = activeLots.reduce((acc: number, c) => {
      return acc + (getDailyRateForLot(c) * (Number(c.count) || 1));
    }, 0);

    const sortedFeed = [...feed.filter(f => !f._deleted)].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  }, [selectedDate, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, activeFilter, selectedMonth, isInitialPullDone]);

  useEffect(() => {
    if (isInitialPullDone) {
      const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
      if (!hasSeenOnboarding) {
        setIsOnboardingOpen(true);
        localStorage.setItem('has_seen_onboarding', 'true');
      }
    }
  }, [isInitialPullDone]);

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
  }, [syncTrigger, activeSpeciesFilter, selectedBreeds, isInitialPullDone]);

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      const result = await SyncService.recoverLegacyData(user!.uid);
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
 
  const handleTestNotification = async () => {
    try {
      const { NotificationService } = await import("../services/NotificationService");
      if (Notification.permission === 'granted') {
          NotificationService.showLocalNotification("Test Réussi ! 🔔", "Vos notifications sont bien configurées sur cet appareil.");
          toast.success("Notification de test envoyée !");
      } else {
          toast.warning("Les notifications ne sont pas autorisées. Vérifiez vos paramètres.");
          await NotificationService.requestPermission(user!.uid);
      }
    } catch (e) {
      toast.error("Échec du test.");
    }
  };

  return (
    <section id="screen-dashboard" className="space-y-6">
      
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
 
      <div className="hidden md:grid grid-cols-2 gap-3">
          <button 
            onClick={handleTestNotification}
            className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-all group"
          >
            <iconify-icon icon="solar:bell-bing-linear" class="text-lg text-amber-500 group-hover:animate-ring"></iconify-icon>
            <span className="text-xs font-medium text-gray-700">Tester Notifications</span>
          </button>
          <button 
            onClick={handleDeepSync}
            disabled={isRecovering}
            className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-all group disabled:opacity-50"
          >
            <iconify-icon icon="solar:refresh-linear" class={`text-lg text-indigo-500 group-hover:rotate-180 transition-transform duration-500 ${isRecovering ? 'animate-spin' : ''}`}></iconify-icon>
            <span className="text-xs font-medium text-gray-700">Forcer Synchro</span>
          </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      {activeSpeciesFilter === 'all' && stats.globalBreakdown && stats.globalBreakdown.length > 0 && (
        <div className="clean-card rounded-3xl p-5 select-none">
          <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900 mb-4 ml-1">Répartition Globale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.globalBreakdown.map((item) => (
              <div key={item.type} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-50">
                    <img 
                      src={`/assets/icons/${item.type}.png`} 
                      alt={item.type} 
                      className="w-full h-full object-cover scale-110" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const icon = document.createElement('iconify-icon');
                          let iconName = 'fluent-emoji:chicken';
                          if (item.type === 'caille') iconName = 'fluent-emoji:egg';
                          else if (item.type === 'pigeon') iconName = 'fluent-emoji:pigeon';
                          else if (item.type === 'lapin') iconName = 'fluent-emoji:rabbit';
                          icon.setAttribute('icon', iconName);
                          icon.className = 'text-3xl';
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm capitalize">{item.type}</h4>
                    <p className="text-xs font-light text-gray-500">{item.count} sujets actifs</p>
                  </div>
                </div>
                {(item.type === 'poulet' || item.type === 'caille') && (
                  <div className="mt-3 sm:mt-0 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100/50" title="Production de ce jour">
                    <span className="text-[10px] font-medium text-gray-500 uppercase">Ponte :</span>
                    <span className="font-['JetBrains_Mono'] font-medium text-sm text-gray-900">{item.eggs}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                            <stop offset="0%" stopColor={isCaille ? "#10B981" : isPigeon ? "#0EA5E9" : isLapin ? "#8B5CF6" : "#F59E0B"} stopOpacity={0.2}></stop>
                            <stop offset="100%" stopColor={isCaille ? "#10B981" : isPigeon ? "#0EA5E9" : isLapin ? "#8B5CF6" : "#F59E0B"} stopOpacity={0.0}></stop>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" horizontalPoints={[25, 50, 75]} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '500', fontFamily: 'DM Sans' }} />
                    <Area type="monotone" dataKey="production" stroke={isCaille ? "#10B981" : isPigeon ? "#0EA5E9" : isLapin ? "#8B5CF6" : "#F59E0B"} strokeWidth={2} fill="url(#chartGrad)" />
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
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-light text-gray-500">Rentabilité & suivi détaillé</p>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold animate-pulse">
                        <iconify-icon icon="solar:check-read-linear"></iconify-icon>
                        <span>Synchronisé</span>
                    </div>
                </div>
                <div className="flex items-center bg-white border border-gray-100 rounded-xl px-2 py-1 shadow-sm">
                    <button 
                      onClick={() => {
                        const [y, m] = selectedMonth.split('-').map(Number);
                        const d = new Date(y, m - 2, 1);
                        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                      }}
                      className="p-1 hover:bg-gray-50 rounded text-gray-400"
                    >
                      <iconify-icon icon="solar:alt-arrow-left-linear"></iconify-icon>
                    </button>
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 min-w-[100px] text-center">
                      {new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => {
                        const [y, m] = selectedMonth.split('-').map(Number);
                        const d = new Date(y, m, 1);
                        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                      }}
                      className="p-1 hover:bg-gray-50 rounded text-gray-400"
                    >
                      <iconify-icon icon="solar:alt-arrow-right-linear"></iconify-icon>
                    </button>
                </div>
              </div>
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
              <button onClick={() => navigate("/selection")} className="w-full clean-card rounded-2xl p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors border-2 border-dashed border-orange-100 bg-orange-50/30">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                      <iconify-icon icon="solar:settings-bold-duotone" stroke-width="1.5" className="text-xl text-orange-600"></iconify-icon>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-orange-900 truncate">Configurer l'Élevage</p>
                      <p className="text-xs font-medium text-orange-600/70 truncate">Modifier vos races & espèces</p>
                  </div>
                  <iconify-icon icon="solar:alt-arrow-right-linear" className="text-orange-400"></iconify-icon>
              </button>
          </div>
      </div>

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => { setIsUpgradeModalOpen(false); if (location.search.includes('upgrade=true')) navigate('/', { replace: true }); }} />
      <OnboardingGuide isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      {/* Floating Action Button (FAB) for Quick Entry */}
      <div className="fixed bottom-24 right-6 z-40 sm:bottom-6">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-16 right-0 space-y-3"
            >
              <button 
                onClick={() => { navigate('/eggs'); setIsFabOpen(false); }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-xl hover:bg-emerald-50 transition-colors w-44"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <iconify-icon icon="solar:egg-bold-duotone" class="text-xl"></iconify-icon>
                </div>
                <span className="text-xs font-bold text-gray-700">Récolte Œufs</span>
              </button>
              <button 
                onClick={() => { navigate('/feed'); setIsFabOpen(false); }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-xl hover:bg-orange-50 transition-colors w-44"
              >
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <iconify-icon icon="solar:leaf-bold-duotone" class="text-xl"></iconify-icon>
                </div>
                <span className="text-xs font-bold text-gray-700">Alimentation</span>
              </button>
              <button 
                onClick={() => { navigate('/inventory'); setIsFabOpen(false); }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-xl hover:bg-indigo-50 transition-colors w-44"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <iconify-icon icon="solar:add-circle-bold-duotone" class="text-xl"></iconify-icon>
                </div>
                <span className="text-xs font-bold text-gray-700">Nouveau Lot</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 ${isFabOpen ? 'bg-gray-900 text-white rotate-45' : 'bg-babs-orange text-white'}`}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      <button 
        onClick={() => setIsOnboardingOpen(true)}
        className="fixed bottom-6 left-6 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all sm:hidden"
        title="Aide au démarrage"
      >
        <iconify-icon icon="solar:question-square-linear" class="text-xl"></iconify-icon>
      </button>
    </section>
  );
}
