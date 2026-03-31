import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getDaysElapsed, getDayTip } from './types';
import { AlertTriangle, Info } from 'lucide-react';

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

      {/* Day tip / Alert */}
      <div className={`p-6 rounded-[2rem] border-2 animate-in zoom-in-95 duration-500 ${
        tip.includes('⚠️') ? 'bg-red-50 border-red-200 text-red-900' : 
        tip.includes('🔦') ? 'bg-blue-50 border-blue-200 text-blue-900' :
        'bg-amber-50 border-amber-100 text-amber-900'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            tip.includes('⚠️') ? 'bg-red-500 text-white animate-pulse' : 
            tip.includes('🔦') ? 'bg-blue-500 text-white' :
            'bg-amber-500 text-white'
          }`}>
            {tip.includes('⚠️') ? <AlertTriangle className="w-6 h-6" /> : 
             tip.includes('🔦') ? <Info className="w-6 h-6" /> : 
             <Info className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70`}>
              Conseil du Jour {currentDay}
            </p>
            <p className="text-sm font-black leading-relaxed whitespace-pre-line">
              {tip}
            </p>
            {(tip.includes('⚠️') || tip.includes('ARRÊT')) && (
               <div className="mt-3 flex items-center gap-2 text-[10px] font-black bg-white/50 px-3 py-1.5 rounded-full inline-block border border-red-100 italic">
                 ✨ Action requise aujourd'hui !
               </div>
            )}
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
