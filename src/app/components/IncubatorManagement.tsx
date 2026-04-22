import { useEffect, useState } from 'react';
import { Plus, Egg, BarChart3, Calendar, DollarSign, HelpCircle, Bell, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { SyncService } from '../SyncService';
import { StorageService } from '../services/StorageService';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey } from './incubator/types';
import { BatchCard } from './incubator/BatchCard';
import { BatchWizard } from './incubator/BatchWizard';
import { IncubatorDetails } from './incubator/IncubatorDetails';
import { DailyProgress } from './incubator/DailyProgress';
import { HatchSummary } from './incubator/HatchSummary';
import { FinancialSummary } from './incubator/FinancialSummary';
import { FAQSection } from './incubator/FAQSection';
import { getDaysElapsed, getDayTip } from './incubator/types';
import { ProFeatureOverlay } from './ui/ProFeatureOverlay';

type TabId = 'batches' | 'summary' | 'finances' | 'faq';

export function IncubatorManagement() {
  const { syncTrigger, saveData, poultryTypes, activeSpeciesFilter, isDarkMode, hasAccess } = useAuth();
  const [batches, setBatches] = useState<IncubationBatch[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('batches');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesKey | 'all'>('all');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<IncubationBatch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<IncubationBatch | null>(null);
  const [detailBatch, setDetailBatch] = useState<IncubationBatch | null>(null);

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : isCaille ? 'emerald' : 'orange';
  const accentColor = isMixed ? "text-indigo-500" : isCaille ? "text-emerald-500" : "text-orange-500";
  const accentBg = isMixed ? "bg-indigo-600 hover:bg-indigo-700" : isCaille ? "bg-emerald-500" : "bg-orange-500";
  const accentLight = isMixed ? "bg-indigo-50" : isCaille ? "bg-emerald-50" : "bg-orange-50";
  const accentBorder = isMixed ? "border-indigo-100" : isCaille ? "border-emerald-100" : "border-orange-100";

  const filtered = batches.filter(b => !b._deleted && (speciesFilter === 'all' || b.species === speciesFilter));
  const ongoing = filtered.filter(b => b.status === 'ongoing');
  const hatched = filtered.filter(b => b.status === 'hatched');

  const todayAlerts = ongoing.map(b => {
    const day = Math.min(getDaysElapsed(b.startDate) + 1, b.totalDays);
    const tip = getDayTip(b.species as SpeciesKey, day, b.totalDays);
    const isCritical = tip.includes('⚠️') || tip.includes('🔦') || tip.includes('🚀') || tip.includes('🐣');
    if (!isCritical) return null;
    return { 
      id: b.id, 
      name: b.name || (SPECIES_CONFIG[b.species as SpeciesKey]?.label || b.species), 
      tip, 
      day,
      isDanger: tip.includes('⚠️') || tip.includes('🐣')
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  useEffect(() => {
    const saved = StorageService.getItem<IncubationBatch[]>('incubation');
    if (saved) setBatches(saved);
  }, [syncTrigger]);

  const saveBatches = (updated: IncubationBatch[]) => {
    setBatches(updated);
    saveData('incubation', updated);
  };

  const handleSaveBatch = (b: IncubationBatch) => {
    const exists = batches.find(x => x.id === b.id);
    if (exists) {
      saveBatches(batches.map(x => x.id === b.id ? b : x));
    } else {
      saveBatches([...batches, b]);
    }
    setWizardOpen(false);
    setEditBatch(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce lot ?')) {
      saveBatches(batches.map(b => b.id === id ? { ...b, _deleted: true, updatedAt: Date.now() } : b));
    }
  };

  const handleDetailUpdate = (b: IncubationBatch) => {
    saveBatches(batches.map(x => x.id === b.id ? b : x));
    setDetailBatch(b);
    if (selectedBatch?.id === b.id) setSelectedBatch(b);
  };

  const tabs: { id: TabId; label: string; icon: string; short: string }[] = [
    { id: 'batches', label: 'Mes Lots', icon: 'solar:egg-bold-duotone', short: 'Lots' },
    { id: 'summary', label: 'Bilan', icon: 'solar:chart-square-linear', short: 'Bilan' },
    { id: 'finances', label: 'Finances', icon: 'solar:wallet-linear', short: 'Fin.' },
    { id: 'faq', label: 'Aide', icon: 'solar:question-square-linear', short: 'FAQ' },
  ];

  return (
    <ProFeatureOverlay
      title="Couvaison Intelligente"
      description="Optimisez vos taux d'éclosion avec un suivi jour par jour, des alertes de mirage et une gestion complète des paramètres d'incubation."
      hasAccess={hasAccess('PRO')}
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
              <h1 className="font-['Syne'] font-bold text-3xl tracking-tight text-gray-900">Couvaison</h1>
              <div className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`}></div>
          </div>
          <p className="text-sm font-light text-gray-500">De l'œuf à l'éclosion — Suivi complet</p>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="clean-card p-3 rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-emerald-500">
              <p className="font-['JetBrains_Mono'] text-xl font-bold text-emerald-600">{batches.filter(b => !b._deleted).reduce((a, b) => a + (b.fertileCount || 0), 0)}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fertiles</p>
          </div>
          <div className="clean-card p-3 rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-red-500">
              <p className="font-['JetBrains_Mono'] text-xl font-bold text-red-600">{batches.filter(b => !b._deleted).reduce((a, b) => a + (b.deadCount || 0), 0)}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Morts</p>
          </div>
          <div className="clean-card p-3 rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-blue-500">
              <p className="font-['JetBrains_Mono'] text-xl font-bold text-blue-600">
                {batches.filter(b => !b._deleted).reduce((a, b) => a + (b.eggsCount || 0), 0) > 0
                  ? Math.round((batches.filter(b => !b._deleted).reduce((a, b) => a + (b.fertileCount || 0), 0) / batches.filter(b => !b._deleted).reduce((a, b) => a + (b.eggsCount || 0), 0)) * 100)
                  : 0}%
              </p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Taux</p>
          </div>
      </div>

      {/* Species Filter & Action */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full flex flex-wrap gap-2">
            <button
                onClick={() => setSpeciesFilter('all')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all text-xs font-bold whitespace-nowrap ${
                    speciesFilter === 'all' 
                    ? `bg-gray-900 border-gray-900 text-white shadow-lg` 
                    : isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white border-gray-100 text-gray-500'
                }`}
            >
                Tous
            </button>
            {(Object.keys(SPECIES_CONFIG) as SpeciesKey[]).map(s => (
                <button
                    key={s}
                    onClick={() => setSpeciesFilter(s)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all text-xs font-bold whitespace-nowrap flex-1 sm:flex-none justify-center ${
                        speciesFilter === s 
                        ? `${accentBg} border-transparent text-white shadow-lg` 
                        : isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white border-gray-100 text-gray-500'
                    }`}
                >
                    <span className="text-base">{SPECIES_CONFIG[s].emoji}</span>
                    <span>{SPECIES_CONFIG[s].label}</span>
                </button>
            ))}
        </div>
        <button
            onClick={() => { setEditBatch(null); setWizardOpen(true); }}
            className={`w-full sm:w-auto ${accentBg} text-white px-6 py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap`}
        >
          <iconify-icon icon="solar:add-circle-linear" class="text-xl"></iconify-icon>
          Nouveau Lot
        </button>
      </div>

      {/* Alerts Horizontal Scroll / Grid */}
      {activeTab === 'batches' && todayAlerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {todayAlerts.map(alert => (
            <div 
              key={alert.id}
              onClick={() => {
                const b = batches.find(x => x.id === alert.id);
                if (b) { setSelectedBatch(b); setDetailBatch(b); }
              }}
              className={`w-full p-4 rounded-2xl border flex items-start gap-3 cursor-pointer hover:scale-[1.02] transition-transform ${
                alert.isDanger ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'
              }`}
            >
              <div className={`p-2 rounded-xl h-fit shrink-0 ${alert.isDanger ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <iconify-icon icon={alert.isDanger ? "solar:danger-triangle-linear" : "solar:info-circle-linear"} class="text-xl"></iconify-icon>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${alert.isDanger ? 'text-red-600' : 'text-blue-600'}`}>
                  Jour {alert.day} • {alert.name}
                </p>
                <p className="text-xs font-medium text-gray-700 leading-tight mt-1 line-clamp-2">
                  {alert.tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Tabs */}
      <div className="flex bg-gray-100 dark:bg-zinc-800/50 rounded-2xl p-1 gap-1 sticky top-16 z-30 backdrop-blur-md">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === t.id
                ? isDarkMode ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <iconify-icon icon={t.icon} class="text-lg"></iconify-icon>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.short}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
          {activeTab === 'batches' && (
            <div className="space-y-6">
              {/* Ongoing */}
              {ongoing.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">En cours ({ongoing.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ongoing.map(b => (
                      <BatchCard
                        key={b.id}
                        batch={b}
                        onEdit={(b) => { setEditBatch(b); setWizardOpen(true); }}
                        onDelete={handleDelete}
                        onSelect={(b) => {
                          setSelectedBatch(selectedBatch?.id === b.id ? null : b);
                          setDetailBatch(b);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Hatched */}
              {hatched.length > 0 && (
                <div className="space-y-3">
                   <div className="flex items-center gap-2 mb-2 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Éclos ({hatched.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
                    {hatched.map(b => (
                      <BatchCard
                        key={b.id}
                        batch={b}
                        onEdit={(b) => { setEditBatch(b); setWizardOpen(true); }}
                        onDelete={handleDelete}
                        onSelect={(b) => setDetailBatch(b)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="clean-card rounded-[2.5rem] py-20 text-center flex flex-col items-center border-dashed border-gray-200">
                  <div className={`w-20 h-20 rounded-full ${accentLight} flex items-center justify-center mb-6`}>
                    <iconify-icon icon="solar:egg-bold-duotone" class={`text-4xl ${accentColor}`}></iconify-icon>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">Aucun lot d'incubation</p>
                  <p className="text-gray-400 text-sm font-medium mt-1">Lancez votre premier lot pour démarrer le suivi</p>
                  <button onClick={() => setWizardOpen(true)} className={`mt-6 ${accentColor} font-bold text-sm underline underline-offset-4`}>Démarrer maintenant</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && <HatchSummary batches={filtered} />}
          {activeTab === 'finances' && <FinancialSummary batches={filtered} />}
          {activeTab === 'faq' && <FAQSection />}
      </div>
      </div>

      {/* Modals & Wizards */}
      {wizardOpen && (
        <BatchWizard
          batch={editBatch}
          allBatches={batches}
          onSave={handleSaveBatch}
          onClose={() => { setWizardOpen(false); setEditBatch(null); }}
        />
      )}

      {detailBatch && !wizardOpen && (
        <IncubatorDetails
          batch={detailBatch}
          onUpdate={handleDetailUpdate}
          onClose={() => setDetailBatch(null)}
        />
      )}
    </ProFeatureOverlay>
  );
}
