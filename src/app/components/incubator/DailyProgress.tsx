import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getDaysElapsed, getDayTip } from './types';

interface Props {
  batch: IncubationBatch;
  onUpdate: (b: IncubationBatch) => void;
}

export function DailyProgress({ batch, onUpdate }: Props) {
  const cfg = SPECIES_CONFIG[batch.species as SpeciesKey];
  const elapsed = getDaysElapsed(batch.startDate);
  const currentDay = Math.min(elapsed + 1, batch.totalDays);
  const tip = getDayTip(batch.species as SpeciesKey, currentDay, batch.totalDays);

  const toggleDay = (idx: number) => {
    const checks = [...batch.dailyChecks];
    checks[idx] = !checks[idx];
    onUpdate({ ...batch, dailyChecks: checks, lastUpdated: Date.now() });
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[2rem] p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{cfg.emoji}</span>
          <div>
            <p className="font-black text-lg">{batch.name || cfg.label}</p>
            <p className="text-blue-200 text-xs font-bold">Jour {currentDay} (En cours)</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-black">{currentDay}</p>
            <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">Jour</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 bg-white/10 rounded-2xl p-4">
          <div>
            <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">Température</p>
            <p className="font-black">{cfg.tempC}°C ({cfg.tempF}°F)</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">Humidité</p>
            <p className="font-black">{currentDay >= batch.totalDays - 2 ? cfg.humidityHatch : cfg.humidity}</p>
          </div>
        </div>
      </div>

      {/* Day tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
              Jour {currentDay} — Statut Incubateur
            </p>
            <p className="text-sm font-bold text-amber-900 leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>

      {/* Daily checklist */}
      <div>
        <h3 className="text-lg font-black text-babs-brown mb-4">Progression de l'Incubation</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
          {batch.dailyChecks.map((checked, idx) => {
            const dayNum = idx + 1;
            const isPast = dayNum <= elapsed;
            const isCurrent = dayNum === currentDay;
            return (
              <button
                key={idx}
                onClick={() => toggleDay(idx)}
                className={`
                  p-3 rounded-xl text-center transition-all border-2 relative
                  ${checked
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : isCurrent
                      ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-200'
                      : isPast
                        ? 'bg-red-50 border-red-200 text-red-400'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                  }
                `}
              >
                {checked && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
                )}
                <span className="text-xs font-black block">Jour</span>
                <span className="text-lg font-black">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
