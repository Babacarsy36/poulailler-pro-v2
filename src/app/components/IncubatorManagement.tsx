import { useEffect, useState } from 'react';
import { Plus, Egg, BarChart3, Calendar, DollarSign, HelpCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { SyncService } from '../SyncService';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey } from './incubator/types';
import { BatchCard } from './incubator/BatchCard';
import { BatchWizard } from './incubator/BatchWizard';
import { IncubatorDetails } from './incubator/IncubatorDetails';
import { DailyProgress } from './incubator/DailyProgress';
import { HatchSummary } from './incubator/HatchSummary';
import { FinancialSummary } from './incubator/FinancialSummary';
import { FAQSection } from './incubator/FAQSection';

type TabId = 'batches' | 'summary' | 'finances' | 'faq';

export function IncubatorManagement() {
  const { syncTrigger } = useAuth();
  const [batches, setBatches] = useState<IncubationBatch[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('batches');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesKey | 'all'>('all');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<IncubationBatch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<IncubationBatch | null>(null);
  const [detailBatch, setDetailBatch] = useState<IncubationBatch | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('incubation');
    if (saved) setBatches(JSON.parse(saved));
  }, [syncTrigger]);

  const save = (updated: IncubationBatch[]) => {
    setBatches(updated);
    SyncService.saveCollection('incubation', updated);
  };

  const handleSaveBatch = (b: IncubationBatch) => {
    const exists = batches.find(x => x.id === b.id);
    if (exists) {
      save(batches.map(x => x.id === b.id ? b : x));
    } else {
      save([...batches, b]);
    }
    setWizardOpen(false);
    setEditBatch(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce lot ?')) save(batches.filter(b => b.id !== id));
  };

  const handleDetailUpdate = (b: IncubationBatch) => {
    save(batches.map(x => x.id === b.id ? b : x));
    setDetailBatch(b);
    if (selectedBatch?.id === b.id) setSelectedBatch(b);
  };

  const filtered = batches.filter(b => speciesFilter === 'all' || b.species === speciesFilter);
  const ongoing = filtered.filter(b => b.status === 'ongoing');
  const hatched = filtered.filter(b => b.status === 'hatched');

  const tabs: { id: TabId; label: string; icon: any; short: string }[] = [
    { id: 'batches', label: 'Mes Lots', icon: Egg, short: 'Lots' },
    { id: 'summary', label: 'Bilan', icon: BarChart3, short: 'Bilan' },
    { id: 'finances', label: 'Finances', icon: DollarSign, short: 'Finance' },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, short: 'FAQ' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-babs-brown tracking-tight">Couvoir</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            De l'œuf au poussin — Suivi complet
          </p>
        </div>
        <button
          onClick={() => { setEditBatch(null); setWizardOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Nouveau Lot
        </button>
      </div>

      {/* Global Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500 text-white rounded-2xl p-4 text-center shadow-md">
          <p className="text-2xl font-black">{batches.reduce((a, b) => a + b.fertileCount, 0)}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Fertiles</p>
        </div>
        <div className="bg-red-500 text-white rounded-2xl p-4 text-center shadow-md">
          <p className="text-2xl font-black">{batches.reduce((a, b) => a + b.deadCount, 0)}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Morts</p>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl p-4 text-center shadow-md">
          <p className="text-2xl font-black">
            {batches.reduce((a, b) => a + b.eggsCount, 0) > 0
              ? Math.round((batches.reduce((a, b) => a + b.fertileCount, 0) / batches.reduce((a, b) => a + b.eggsCount, 0)) * 1000) / 10
              : 0}%
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Taux</p>
        </div>
      </div>

      {/* Species filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSpeciesFilter('all')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
            speciesFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-blue-50'
          }`}
        >
          Tous
        </button>
        {(Object.keys(SPECIES_CONFIG) as SpeciesKey[]).map(s => (
          <button
            key={s}
            onClick={() => setSpeciesFilter(s)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
              speciesFilter === s ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-blue-50'
            }`}
          >
            <span>{SPECIES_CONFIG[s].emoji}</span>
            {SPECIES_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.short}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Selected batch daily progress */}
          {selectedBatch && selectedBatch.status === 'ongoing' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-black text-babs-brown flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Suivi Quotidien
                </h3>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Fermer ✕
                </button>
              </div>
              <DailyProgress
                batch={selectedBatch}
                onUpdate={(b) => {
                  handleDetailUpdate(b);
                  setSelectedBatch(b);
                }}
              />
            </div>
          )}

          {/* Ongoing */}
          {ongoing.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                🔥 En cours ({ongoing.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                ✅ Éclos ({hatched.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <div className="bg-white rounded-[2.5rem] py-20 text-center shadow-premium border border-dashed border-gray-200">
              <span className="text-6xl block mb-4">🥚</span>
              <p className="text-gray-400 font-bold italic text-lg">Aucun lot d'incubation</p>
              <p className="text-gray-300 text-sm font-bold mt-2">Cliquez sur "Nouveau Lot" pour commencer</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'summary' && <HatchSummary batches={filtered} />}
      {activeTab === 'finances' && <FinancialSummary batches={filtered} />}
      {activeTab === 'faq' && <FAQSection />}

      {/* Modals */}
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
    </div>
  );
}
