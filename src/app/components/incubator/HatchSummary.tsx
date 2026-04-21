import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, CartesianGrid, Legend } from 'recharts';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getHatchRate } from './types';

interface Props {
  batches: IncubationBatch[];
}

export function HatchSummary({ batches }: Props) {
  const hatched = batches.filter(b => b.status === 'hatched');
  const totalSuccess = hatched.reduce((a, b) => a + b.fertileCount, 0);
  const totalDead = hatched.reduce((a, b) => a + b.deadCount, 0);
  const totalEggs = hatched.reduce((a, b) => a + b.eggsCount, 0);
  const overallRate = getHatchRate(totalSuccess, totalEggs);

  // Per-batch chart data
  const chartData = hatched.slice(-8).map(b => ({
    name: (b.name || SPECIES_CONFIG[b.species as SpeciesKey].label).slice(0, 10),
    rate: getHatchRate(b.fertileCount, b.eggsCount),
    placed: b.eggsCount,
    hatched: b.fertileCount,
  }));

  // Average rate
  const avgRate = hatched.length > 0
    ? Math.round(hatched.reduce((a, b) => a + getHatchRate(b.fertileCount, b.eggsCount), 0) / hatched.length * 10) / 10
    : 0;

  // Best / worst batch
  const sorted = [...hatched].sort((a, b) => getHatchRate(b.fertileCount, b.eggsCount) - getHatchRate(a.fertileCount, a.eggsCount));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Latest batch for detail
  const latest = hatched[hatched.length - 1];

  if (hatched.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] py-16 text-center shadow-premium border border-dashed border-gray-200">
        <span className="text-5xl block mb-4">🥚</span>
        <p className="text-gray-400 font-bold italic">Aucun lot terminé pour le moment.</p>
        <p className="text-gray-300 text-xs font-bold mt-2">Les statistiques apparaîtront après votre première éclosion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500 text-white rounded-2xl p-5 text-center shadow-lg">
          <span className="text-3xl block mb-1">🐣</span>
          <p className="text-3xl font-black">{totalSuccess}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Succès</p>
        </div>
        <div className="bg-red-500 text-white rounded-2xl p-5 text-center shadow-lg">
          <span className="text-3xl block mb-1">✕</span>
          <p className="text-3xl font-black">{totalDead}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Morts</p>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl p-5 text-center shadow-lg">
          <span className="text-3xl block mb-1">📊</span>
          <p className="text-3xl font-black">{overallRate}%</p>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Taux</p>
        </div>
      </div>

      {/* Latest batch detail */}
      {latest && (
        <div className="bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-babs-brown">{latest.name || SPECIES_CONFIG[latest.species as SpeciesKey].label}</p>
              <p className="text-[10px] text-gray-400 font-bold">
                Début : {new Date(latest.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs font-bold">
                <span className="text-emerald-600">✅ {latest.fertileCount}</span>
                <span className="text-red-500">❌ {latest.deadCount}</span>
                <span className="text-gray-400">{getHatchRate(latest.fertileCount, latest.eggsCount)}% en {latest.totalDays}j</span>
              </div>
            </div>
          </div>
          {/* Quality badge */}
          <div className={`mt-3 rounded-xl p-3 flex items-center justify-between ${
            getHatchRate(latest.fertileCount, latest.eggsCount) >= 75 ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getHatchRate(latest.fertileCount, latest.eggsCount) >= 75 ? '👍' : '👎'}</span>
              <p className={`text-sm font-black ${getHatchRate(latest.fertileCount, latest.eggsCount) >= 75 ? 'text-emerald-700' : 'text-red-700'}`}>
                {getHatchRate(latest.fertileCount, latest.eggsCount) >= 75 ? 'Bonne Éclosion !' : 'À améliorer'}
              </p>
            </div>
            <span className={`font-black text-lg ${getHatchRate(latest.fertileCount, latest.eggsCount) >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
              {getHatchRate(latest.fertileCount, latest.eggsCount)}%
            </span>
          </div>
        </div>
      )}

      {/* Breed Intelligence */}
      <div className="bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-babs-brown flex items-center gap-2">
            <span>🧬</span> Intelligence de Race
          </h4>
          {avgRate > 0 && (
            <span className="text-emerald-600 text-sm font-black bg-emerald-50 px-2 py-1 rounded-lg">
              ↗ {avgRate}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Taux moyen</p>
            <p className="text-xl font-black text-babs-brown">{avgRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Dernier lot</p>
            <p className="text-xl font-black text-blue-600">{latest ? getHatchRate(latest.fertileCount, latest.eggsCount) : 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Total lots</p>
            <p className="text-xl font-black text-babs-brown">{hatched.length}</p>
          </div>
        </div>

        {best && worst && hatched.length >= 2 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-500 uppercase">🏆 Meilleur lot</p>
              <p className="text-sm font-black text-emerald-800 truncate">{best.name || SPECIES_CONFIG[best.species as SpeciesKey].label}</p>
              <p className="text-[10px] font-bold text-emerald-600">ROI: {getHatchRate(best.fertileCount, best.eggsCount)}%</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-[9px] font-black text-red-500 uppercase">⚠️ À améliorer</p>
              <p className="text-sm font-black text-red-800 truncate">{worst.name || SPECIES_CONFIG[worst.species as SpeciesKey].label}</p>
              <p className="text-[10px] font-bold text-red-600">ROI: {getHatchRate(worst.fertileCount, worst.eggsCount)}%</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Volume vs Taux de réussite</p>
            <div className="h-48 w-full bg-white/50 p-2 rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#10B981' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6B7280', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar yAxisId="left" dataKey="placed" name="Placés" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="hatched" name="Couvés" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="rate" name="Taux (%)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
