import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey } from './types';

interface Props {
  batches: IncubationBatch[];
}

export function FinancialSummary({ batches }: Props) {
  const tracked = batches.filter(b => b.investment > 0 || b.revenue > 0);
  const totalInvested = tracked.reduce((a, b) => a + b.investment, 0);
  const totalRevenue = tracked.reduce((a, b) => a + b.revenue, 0);
  const totalProfit = totalRevenue - totalInvested;
  const roi = totalInvested > 0 ? Math.round((totalProfit / totalInvested) * 1000) / 10 : 0;

  const chartData = tracked.slice(-8).map(b => {
    const profit = b.revenue - b.investment;
    return {
      name: (b.name || SPECIES_CONFIG[b.species as SpeciesKey].label).slice(0, 10),
      profit,
      positive: profit >= 0,
    };
  });

  const sorted = [...tracked].sort((a, b) => {
    const roiA = a.investment > 0 ? (a.revenue - a.investment) / a.investment : 0;
    const roiB = b.investment > 0 ? (b.revenue - b.investment) / b.investment : 0;
    return roiB - roiA;
  });
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (tracked.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] py-16 text-center shadow-premium border border-dashed border-gray-200">
        <span className="text-5xl block mb-4">💰</span>
        <p className="text-gray-400 font-bold italic">Aucune donnée financière.</p>
        <p className="text-gray-300 text-xs font-bold mt-2">Ajoutez les coûts et revenus dans vos lots pour voir les statistiques.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lifetime summary */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[2rem] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl bg-white/20 p-2 rounded-xl">💰</span>
            <div>
              <p className="font-black text-lg">Résumé Financier</p>
              <p className="text-emerald-200 text-xs font-bold">{tracked.length} lots suivis</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-black ${roi >= 0 ? 'bg-white/20' : 'bg-red-500/40'}`}>
            {roi >= 0 ? '+' : ''}{roi}% ROI
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black">{totalInvested.toLocaleString()}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Investi</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black">{totalRevenue.toLocaleString()}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Revenu</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${totalProfit >= 0 ? '' : 'text-red-300'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Profit</p>
          </div>
        </div>
      </div>

      {/* Best/Worst */}
      {best && worst && tracked.length >= 2 && (
        <div className="bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5">
          <h4 className="font-black text-babs-brown mb-3 flex items-center gap-2">
            <span>🧠</span> Intelligence des Lots
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-500 uppercase">🏆 Meilleur lot</p>
              <p className="text-sm font-black text-emerald-800 truncate">{best.name || SPECIES_CONFIG[best.species as SpeciesKey].label}</p>
              <p className="text-[10px] font-bold text-emerald-600">
                ROI: {best.investment > 0 ? Math.round(((best.revenue - best.investment) / best.investment) * 100) : 0}%
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-[9px] font-black text-red-500 uppercase">⚠️ À améliorer</p>
              <p className="text-sm font-black text-red-800 truncate">{worst.name || SPECIES_CONFIG[worst.species as SpeciesKey].label}</p>
              <p className="text-[10px] font-bold text-red-600">
                ROI: {worst.investment > 0 ? Math.round(((worst.revenue - worst.investment) / worst.investment) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Per-batch table */}
      <div className="bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5">
        <h4 className="font-black text-babs-brown mb-3 flex items-center gap-2">
          <span>📋</span> Par Lot
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="text-left py-2">Lot</th>
                <th className="text-right py-2">Investi</th>
                <th className="text-right py-2">Profit</th>
                <th className="text-right py-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {tracked.map(b => {
                const profit = b.revenue - b.investment;
                const batchRoi = b.investment > 0 ? Math.round((profit / b.investment) * 100) : 0;
                return (
                  <tr key={b.id} className="border-b border-gray-50">
                    <td className="py-3">
                      <p className="font-black text-babs-brown text-xs">{b.name || SPECIES_CONFIG[b.species as SpeciesKey].label}</p>
                      <p className="text-[9px] text-gray-400">{b.status === 'hatched' ? 'Éclos' : 'En cours'}</p>
                    </td>
                    <td className="text-right font-bold text-xs text-gray-600">{b.investment.toLocaleString()}</td>
                    <td className={`text-right font-black text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        batchRoi >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {batchRoi}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit Trend chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5">
          <h4 className="font-black text-babs-brown mb-3 flex items-center gap-2">
            <span>📈</span> Tendance Profit
          </h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} FCFA`} />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.positive ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
