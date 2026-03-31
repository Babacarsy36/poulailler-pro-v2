import { Trash2, Edit, Egg } from 'lucide-react';
import { IncubationBatch, SPECIES_CONFIG, getDaysElapsed, SpeciesKey } from './types';
import { CircularProgress } from './CircularProgress';

interface Props {
  batch: IncubationBatch;
  onEdit: (b: IncubationBatch) => void;
  onDelete: (id: string) => void;
  onSelect: (b: IncubationBatch) => void;
}

export function BatchCard({ batch, onEdit, onDelete, onSelect }: Props) {
  const cfg = SPECIES_CONFIG[batch.species as SpeciesKey];
  const elapsed = getDaysElapsed(batch.startDate);
  const startLabel = new Date(batch.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div
      onClick={() => onSelect(batch)}
      className="bg-card rounded-[2rem] p-6 shadow-premium border border-gray-50 dark:border-white/5 hover:border-blue-200 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        {/* Left: egg counts */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <span className="flex items-center gap-1">🐣 {batch.fertileCount}</span>
          <span className="flex items-center gap-1">❌ {batch.deadCount}</span>
          <span className="text-gray-300">›</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{cfg.emoji}</span>
            <h3 className="text-lg font-black text-babs-brown truncate">{batch.name || cfg.label}</h3>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-1 rounded-lg">
              Total : {batch.totalDays} jours
            </span>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
              batch.status === 'hatched' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
            }`}>
              {batch.status === 'hatched' ? '✅ Éclos !' : `Jour ${Math.min(elapsed, batch.totalDays)}/${batch.totalDays}`}
            </span>
          </div>
        </div>

        <CircularProgress batch={batch} />

        <div className="flex flex-col items-center gap-1">
          <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-2 rounded-xl text-center leading-tight">
            <Egg className="w-3.5 h-3.5 mx-auto mb-0.5" />
            {startLabel}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-white/5">
        {batch.status === 'hatched' && batch.brooder === 'none' && (
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
            🏠 Configurer Éleveuse →
          </span>
        )}
        {batch.status !== 'hatched' && <span />}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(batch); }}
            className="p-2 bg-gray-50 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(batch.id); }}
            className="p-2 bg-gray-50 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
