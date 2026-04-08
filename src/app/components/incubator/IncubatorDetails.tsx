import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getDaysElapsed, getDaysLeft, getHatchRate } from './types';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-white/10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-babs-brown">Détails Incubateur</h2>
            <p className="text-gray-400 text-xs font-bold">Suivi des œufs et fertilité</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Incubator visual */}
          <div className="border-2 border-blue-500 rounded-[2rem] p-4 relative bg-blue-50/30">
            <div className="text-center mb-3">
              <h3 className="font-black text-blue-700">{local.incubatorName || `Incubateur ${cfg.label}`}</h3>
            </div>
            {/* Egg grid */}
            <div className="flex flex-wrap gap-1 justify-center px-2 py-3 bg-white rounded-2xl border border-blue-100 min-h-[60px]">
              {Array.from({ length: local.fertileCount }).map((_, i) => (
                <span key={`f${i}`} className="text-lg leading-none">🐣</span>
              ))}
              {Array.from({ length: local.deadCount }).map((_, i) => (
                <span key={`d${i}`} className="text-lg leading-none">❌</span>
              ))}
            </div>
            {/* Summary bar */}
            <div className="mt-3 bg-blue-600 text-white rounded-2xl p-3 flex items-center justify-center gap-8 font-black">
              <span className="flex items-center gap-2 text-lg">
                {local.fertileCount} <span className="text-xl">🐣</span>
              </span>
              <span className="flex items-center gap-2 text-lg">
                <span className="text-xl">❌</span> {local.deadCount}
              </span>
            </div>
          </div>

          {/* Hatch rate */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 flex items-center gap-4 border border-orange-100">
            <span className="text-3xl">☀️</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-orange-700">{rate}% Taux d'éclosion</span>
                <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {pct < 50 ? 'Début' : pct < 80 ? 'Mi-parcours' : 'Bientôt !'} · {left} jours restants
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-right text-[10px] font-bold text-gray-400 mt-1">{Math.round(pct)}%</p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {[
              { label: 'Capacité Incubateur', field: 'incubatorCapacity' as const, icon: '📦' },
              { label: 'Œufs dans l\'incubateur', field: 'eggsCount' as const, icon: '🥚', sub: `Max ${local.incubatorCapacity}` },
              { label: 'Non Fertiles / Morts', field: 'deadCount' as const, icon: '🚫', sub: `Max ${local.eggsCount}` },
            ].map(ctrl => (
              <div key={ctrl.field} className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ctrl.icon}</span>
                  <div>
                    <p className="text-xs font-black text-babs-brown">{ctrl.label}</p>
                    {ctrl.sub && <p className="text-[9px] text-gray-400 font-bold">{ctrl.sub}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateField(ctrl.field, -1)}
                    className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-red-500" />
                  </button>
                  <span className="w-12 text-center font-black text-lg text-babs-brown">{local[ctrl.field]}</span>
                  <button
                    onClick={() => updateField(ctrl.field, 1)}
                    className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mark as hatched or Stats if already hatched */}
          {local.status === 'hatched' ? (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mt-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎉</span>
                <h4 className="text-sm font-black text-emerald-800">Bilan d'Éclosion</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nombre d'Éclos (🐣)</label>
                  <input
                    type="number"
                    value={local.hatchedCount || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      const updated = { ...local, hatchedCount: v, lastUpdated: Date.now() };
                      setLocal(updated);
                      onUpdate(updated);
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Ex: 85"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reste / Morts (❌)</label>
                  <input
                    type="number"
                    value={local.unhatchedCount || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      const updated = { ...local, unhatchedCount: v, lastUpdated: Date.now() };
                      setLocal(updated);
                      onUpdate(updated);
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 font-black text-orange-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Ex: 5"
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
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl font-black text-sm shadow-lg transition-colors"
            >
              🐣 Marquer comme Éclos !
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
