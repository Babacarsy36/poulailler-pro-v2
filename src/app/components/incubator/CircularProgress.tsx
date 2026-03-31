import { IncubationBatch, getDaysElapsed, getDaysLeft } from './types';

export function CircularProgress({ batch }: { batch: IncubationBatch }) {
  const elapsed = getDaysElapsed(batch.startDate);
  const left = getDaysLeft(batch.startDate, batch.totalDays);
  const pct = Math.min(100, (elapsed / batch.totalDays) * 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={batch.status === 'hatched' ? '#10b981' : '#2563eb'}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-babs-brown">{batch.status === 'hatched' ? '✓' : left}</span>
        {batch.status !== 'hatched' && (
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">jours</span>
        )}
      </div>
    </div>
  );
}
