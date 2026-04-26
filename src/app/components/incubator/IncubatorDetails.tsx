import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getDaysElapsed, getDaysLeft, getHatchRate } from './types';
import { BottomSheet } from '../ui/BottomSheet';

interface Props {
  batch: IncubationBatch;
  onUpdate: (b: IncubationBatch) => void;
  onClose: () => void;
}

export function IncubatorDetails({ batch, onUpdate, onClose }: Props) {
  const cfg = SPECIES_CONFIG[batch.species as SpeciesKey];
  const elapsed = getDaysElapsed(batch.startDate);
  const left = getDaysLeft(batch.startDate, batch.totalDays);
  const rate = getHatchRate(batch.fertileCount, batch.eggsCount);
  const pct = Math.min(100, (elapsed / batch.totalDays) * 100);

  const [local, setLocal] = useState({ ...batch });

  const updateField = (field: 'incubatorCapacity' | 'eggsCount' | 'fertileCount' | 'deadCount', delta: number) => {
    const val = Math.max(0, (local[field] || 0) + delta);
    const updated = { ...local, [field]: val };
    if (field === 'deadCount' || field === 'fertileCount') {
      // Auto-sync: fertile + dead <= eggsCount
    }
    setLocal(updated);
    onUpdate({ ...updated, lastUpdated: Date.now() });
  };

  // Build egg grid
  const gridSize = Math.max(local.fertileCount + local.deadCount, 1);
  const cols = Math.min(10, gridSize);

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title="Détails Incubateur"
    >
      <div className="space-y-6 py-2">
        {/* Incubator visual */}
        <div className="border-2 border-blue-500 rounded-[2rem] p-5 relative bg-blue-50/30 shadow-inner">
          <div className="text-center mb-4">
            <h3 className="font-black text-blue-700 uppercase tracking-wider">{local.incubatorName || `Incubateur ${cfg.label}`}</h3>
          </div>
          {/* Egg grid */}
          <div className="flex flex-wrap gap-2 justify-center p-4 bg-white/60 backdrop-blur rounded-3xl border border-blue-100 min-h-[80px]">
            {Array.from({ length: local.fertileCount }).map((_, i) => (
              <span key={`f${i}`} className="text-xl leading-none">🐣</span>
            ))}
            {Array.from({ length: local.deadCount }).map((_, i) => (
              <span key={`d${i}`} className="text-xl leading-none">❌</span>
            ))}
            {local.fertileCount === 0 && local.deadCount === 0 && (
               <p className="text-[10px] font-bold text-gray-400 uppercase italic">Aucun œuf miré</p>
            )}
          </div>
          {/* Summary bar */}
          <div className="mt-4 bg-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-10 font-black shadow-lg">
            <span className="flex items-center gap-2 text-lg">
              {local.fertileCount} <span className="text-xl">🐣</span>
            </span>
            <span className="flex items-center gap-2 text-lg">
              <span className="text-xl">❌</span> {local.deadCount}
            </span>
          </div>
        </div>

        {/* Hatch rate & Progress */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-5 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-xs font-black text-orange-800 uppercase tracking-widest">{rate}% Efficacité</span>
             </div>
             <span className="text-[10px] font-black text-orange-600 bg-white px-3 py-1 rounded-full shadow-sm">
                {left} j restants
             </span>
          </div>
          <div className="w-full bg-orange-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-right text-[10px] font-black text-orange-400 mt-2 uppercase tracking-tighter">{Math.round(pct)}% du cycle complété</p>
        </div>

        {/* Adjustments */}
        <div className="space-y-3">
          {[
            { label: 'Capacité', field: 'incubatorCapacity' as const, icon: '📦' },
            { label: 'Œufs Totaux', field: 'eggsCount' as const, icon: '🥚' },
            { label: 'Non Fertiles', field: 'deadCount' as const, icon: '🚫' },
          ].map(ctrl => (
            <div key={ctrl.field} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-transparent hover:border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">{ctrl.icon}</span>
                <span className="text-xs font-black text-gray-700 dark:text-zinc-300 uppercase tracking-wide">{ctrl.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateField(ctrl.field, -1)}
                  className="w-10 h-10 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-lg text-gray-900 dark:text-white">{local[ctrl.field]}</span>
                <button
                  onClick={() => updateField(ctrl.field, 1)}
                  className="w-10 h-10 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="pt-4">
          {local.status === 'hatched' ? (
            <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest text-center">Bilan Final d'Éclosion</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Poussins (🐣)</label>
                   <input
                    type="number"
                    value={local.hatchedCount || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      const updated = { ...local, hatchedCount: v, lastUpdated: Date.now() };
                      setLocal(updated);
                      onUpdate(updated);
                    }}
                    className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-4 font-black text-emerald-600 outline-none"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Échecs (❌)</label>
                   <input
                    type="number"
                    value={local.unhatchedCount || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      const updated = { ...local, unhatchedCount: v, lastUpdated: Date.now() };
                      setLocal(updated);
                      onUpdate(updated);
                    }}
                    className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-4 font-black text-red-500 outline-none"
                   />
                </div>
              </div>
            </div>
          ) : (left <= 3 || pct >= 90) && (
            <button
              onClick={() => {
                const updated = { ...local, status: 'hatched' as const, hatchedCount: local.fertileCount, unhatchedCount: 0, lastUpdated: Date.now() };
                setLocal(updated);
                onUpdate(updated);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-3xl font-black text-sm shadow-xl transition-all active:scale-95"
            >
              🐣 Valider l'éclosion
            </button>
          )}
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-600 transition-colors"
        >
          Fermer les détails
        </button>
      </div>
    </BottomSheet>
  );
}
