import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { StorageService } from "../services/StorageService";
import { useForm } from "react-hook-form";
import { BottomSheet } from "./ui/BottomSheet";
import { toast } from "sonner";
import { Chicken } from "../types";

interface EggRecord {
  id: string;
  date: string;
  quantity: number;
  notes: string;
  poultryType?: string;
  poultryBreed?: string;
  updatedAt?: number;
  [key: string]: any;
}

interface EggFormData {
  date: string;
  quantity: string;
  notes: string;
}

export function EggProduction() {
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, saveData, isInitialPullDone } = useAuth();
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [totalFemales, setTotalFemales] = useState(0);
  const [editingRecord, setEditingRecord] = useState<EggRecord | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EggFormData & { breed: string; poultryType?: string }>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      quantity: "",
      notes: "",
      breed: selectedBreeds[0] || "",
    }
  });

  const formData = watch();

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : isCaille ? 'emerald' : 'orange';
  const accentIcon = isCaille ? "solar:egg-bold-duotone" : activeSpeciesFilter === 'pigeon' ? 'game-icons:pigeon' : "solar:record-circle-bold-duotone";
  const accentColor = isMixed ? "text-indigo-500" : isCaille ? "text-emerald-500" : "text-orange-500";
  const accentBg = isMixed ? "bg-indigo-600 hover:bg-indigo-700" : isCaille ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700";
  const accentBgLight = isMixed ? "bg-indigo-50" : isCaille ? "bg-emerald-50" : "bg-orange-50";
  const accentBorderLeft = isMixed ? "border-l-indigo-500" : isCaille ? "border-l-emerald-500" : "border-l-orange-500";

  useEffect(() => {
    if (!isInitialPullDone) return;
    const saved = StorageService.getItem<EggRecord[]>("eggs");
    if (saved) setRecords(saved);
  }, [syncTrigger, isInitialPullDone]);

  useEffect(() => {
    const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
    const now = new Date().getTime();
    
    const females = chickens
      .filter((c: Chicken) => {
        if (!c || c._deleted || !isItemActive(c.poultryType, c.breed) || c.status !== 'active') return false;
        
        // Calculate age
        const arrival = c.arrivalDate ? new Date(c.arrivalDate).getTime() : now;
        const ageDays = Math.ceil(Math.abs(now - arrival) / (1000 * 60 * 60 * 24));
        
        // Minimum laying age
        let minAge = 140; // Default Pondeuse (20 weeks)
        if (c.poultryType === 'caille') minAge = 42; // 6 weeks
        else if (c.poultryType === 'pigeon') minAge = 180; // 6 months
        else if (c.breed?.toLowerCase().includes('fermier')) minAge = 150;
        else if (c.breed?.toLowerCase().includes('ornement')) minAge = 160;

        return ageDays >= minAge;
      })
      .reduce((sum: number, c: Chicken) => sum + (typeof c.femaleCount === 'string' ? parseInt(c.femaleCount) : c.femaleCount || 0), 0);
      
    setTotalFemales(females);
  }, [syncTrigger, activeSpeciesFilter, selectedBreeds]);

  const saveRecords = (newRecords: EggRecord[]) => {
    setRecords(newRecords);
    saveData("eggs", newRecords);
  };

  const onFormSubmit = (data: EggFormData & { breed: string; poultryType?: string }) => {
    const now = Date.now();
    if (editingRecord) {
      const updated: EggRecord = {
        ...editingRecord,
        date: data.date,
        quantity: Number(data.quantity),
        notes: data.notes,
        poultryType: data.poultryType || editingRecord.poultryType,
        poultryBreed: data.breed || editingRecord.poultryBreed,
        updatedAt: now
      };
      saveRecords(records.map(r => r.id === editingRecord.id ? updated : r));
      setEditingRecord(null);
      toast.success("Récolte mise à jour !");
    } else {
      const newRecord: EggRecord = {
        id: now.toString(),
        date: data.date,
        quantity: Number(data.quantity),
        notes: data.notes,
        poultryType: data.poultryType || (activeSpeciesFilter !== 'all' ? activeSpeciesFilter : 'poulet'),
        poultryBreed: data.breed || selectedBreeds[0] || "",
        updatedAt: now
      };
      saveRecords([newRecord, ...records]);
      toast.success("Récolte enregistrée !");
    }
    setIsAddOpen(false);
    reset({ date: new Date().toISOString().split("T")[0], quantity: "", notes: "", breed: selectedBreeds[0] || "" });
  };

  const handleEdit = (r: EggRecord) => {
    setEditingRecord(r);
    reset({
      date: r.date,
      quantity: r.quantity.toString(),
      notes: r.notes || "",
      breed: r.poultryBreed || selectedBreeds[0] || "",
      poultryType: r.poultryType
    });
    setIsAddOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette récolte ?")) {
      saveRecords(records.filter(r => r.id !== id));
      toast.info("Récolte supprimée.");
    }
  };

  const filteredRecords = records
    .filter(r => r && !r._deleted && isItemActive(r.poultryType, r.poultryBreed))
    .sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

  const totalEggs = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);

  const now = new Date();
  
  // Lundi début de semaine
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let eggsThisWeek = 0;
  let eggsThisMonth = 0;
  let eggsThisYear = 0;

  filteredRecords.forEach(r => {
    if (!r.date || isNaN(r.quantity)) return;
    const recordDate = new Date(r.date);
    if (isNaN(recordDate.getTime())) return;
    
    if (recordDate >= startOfWeek) eggsThisWeek += Number(r.quantity);
    if (recordDate >= startOfMonth) eggsThisMonth += Number(r.quantity);
    if (recordDate >= startOfYear) eggsThisYear += Number(r.quantity);
  });

  const lastRecord = filteredRecords[0];
  const layingRate = lastRecord && totalFemales > 0 ? ((lastRecord.quantity / totalFemales) * 100) : null;

  return (
    <section id="screen-eggs" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-['Syne'] text-xl font-semibold text-gray-900 tracking-tight">
            Production d'Œufs
          </h1>
          <p className="text-xs font-light text-gray-500 mt-1">Suivi des récoltes journalières</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className={`h-10 px-3 rounded-xl ${accentBg} text-white flex items-center justify-center shadow-md transition-colors no-print outline-none`}
        >
          <iconify-icon icon="solar:add-circle-linear" class="text-xl sm:mr-2"></iconify-icon>
          <span className="font-medium text-sm hidden sm:inline">Nouvelle Récolte</span>
        </button>
      </div>

      {/* KPI Row (Production Totals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 select-none mb-6">
        <div className={`clean-card rounded-2xl w-full p-3 flex flex-col justify-between border-l-4 border-l-blue-500 hover:scale-105 transition-transform`}>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-['DM_Sans'] uppercase tracking-wider">
            <iconify-icon icon="solar:calendar-date-linear" stroke-width="1.5" class="text-xl text-blue-500"></iconify-icon>
            <span className="truncate font-bold">Cette Semaine</span>
          </div>
          <div className="mt-2">
            <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{eggsThisWeek}</div>
            <div className="text-[9px] font-bold tracking-tight inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
              œufs
            </div>
          </div>
        </div>

        <div className={`clean-card rounded-2xl w-full p-3 flex flex-col justify-between border-l-4 border-l-cyan-500 hover:scale-105 transition-transform`}>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-['DM_Sans'] uppercase tracking-wider">
            <iconify-icon icon="solar:calendar-minimalistic-linear" stroke-width="1.5" class="text-xl text-cyan-500"></iconify-icon>
            <span className="truncate font-bold">Ce Mois</span>
          </div>
          <div className="mt-2">
            <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{eggsThisMonth}</div>
            <div className="text-[9px] font-bold tracking-tight inline-block px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 uppercase">
              œufs
            </div>
          </div>
        </div>

        <div className={`clean-card rounded-2xl w-full p-3 flex flex-col justify-between border-l-4 border-l-purple-500 hover:scale-105 transition-transform`}>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-['DM_Sans'] uppercase tracking-wider">
            <iconify-icon icon="solar:calendar-search-linear" stroke-width="1.5" class="text-xl text-purple-500"></iconify-icon>
            <span className="truncate font-bold">Cette Année</span>
          </div>
          <div className="mt-2">
            <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{eggsThisYear}</div>
            <div className="text-[9px] font-bold tracking-tight inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 uppercase">
              œufs
            </div>
          </div>
        </div>

        <div className={`clean-card rounded-2xl w-full p-3 flex flex-col justify-between border-l-4 ${accentBorderLeft} hover:scale-105 transition-transform`}>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-['DM_Sans'] uppercase tracking-wider">
            <iconify-icon icon={accentIcon} stroke-width="1.5" class={`text-xl ${accentColor}`}></iconify-icon>
            <span className="truncate font-bold">Global</span>
          </div>
          <div className="mt-2">
            <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{totalEggs}</div>
            <div className={`text-[9px] font-bold tracking-tight inline-block px-1.5 py-0.5 rounded ${accentBgLight} ${accentColor} uppercase`}>
              unités récoltées
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 select-none mb-6">

        <div className="clean-card rounded-2xl w-full h-[116px] p-3 flex flex-col justify-between border-l-4 border-l-indigo-500 hover:scale-105 transition-transform">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-['DM_Sans']">
            <iconify-icon icon="solar:calendar-linear" stroke-width="1.5" class="text-xl text-indigo-500"></iconify-icon>
            <span className="truncate font-medium">Dernière</span>
          </div>
          <div>
            <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{lastRecord ? lastRecord.quantity : '—'}</div>
            <div className="text-xs font-medium tracking-tight bg-indigo-50 text-indigo-700 inline-block px-1.5 py-0.5 rounded truncate max-w-full">
              œufs récoltés
            </div>
          </div>
        </div>

        {totalFemales > 0 && layingRate !== null && (
          <div className={`clean-card rounded-2xl w-full h-[116px] p-3 flex flex-col justify-between border-l-4 col-span-2 lg:col-span-1 ${layingRate >= 70 ? 'border-l-emerald-500' : layingRate >= 50 ? 'border-l-amber-500' : 'border-l-red-500'} hover:scale-105 transition-transform`}>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-['DM_Sans']">
              <iconify-icon icon="solar:chart-line-linear" stroke-width="1.5" class={`text-xl ${layingRate >= 70 ? 'text-emerald-500' : layingRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}></iconify-icon>
              <span className="truncate font-medium">Productivité</span>
            </div>
            <div>
              <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{layingRate.toFixed(1)}%</div>
              <div className={`text-xs font-medium tracking-tight inline-block px-1.5 py-0.5 rounded ${layingRate >= 70 ? 'bg-emerald-50 text-emerald-700' : layingRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                {layingRate >= 70 ? '🚀 Excellent' : layingRate >= 50 ? '⚖️ Correct' : '⚠️ Faible'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Productivity Alert */}
      {totalFemales > 0 && layingRate !== null && (
        <div className={`clean-card rounded-2xl p-4 border-l-4 flex items-start gap-3 ${layingRate >= 70 ? 'border-l-emerald-500 bg-emerald-50/40' :
            layingRate >= 50 ? 'border-l-amber-500 bg-amber-50/40' :
              'border-l-red-500 bg-red-50/40'
          }`}>
          <iconify-icon
            icon={layingRate >= 70 ? "solar:check-circle-linear" : layingRate >= 50 ? "solar:danger-circle-linear" : "solar:danger-triangle-linear"}
            stroke-width="1.5"
            class={`text-2xl mt-0.5 shrink-0 ${layingRate >= 70 ? 'text-emerald-500' : layingRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}
          ></iconify-icon>
          <div>
            <p className="font-['Syne'] text-sm font-medium text-gray-900 leading-tight">
              {layingRate >= 70 ? 'Excellente performance ! 🚀' : layingRate >= 50 ? 'Production correcte.' : 'Attention : production faible.'}
            </p>
            <p className="text-xs font-light text-gray-500 mt-0.5">Taux actuel : {layingRate.toFixed(1)}% — basé sur {totalFemales} femelles actives.</p>
          </div>
        </div>
      )}

      {/* History List */}
      <div>
        <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900 mb-4 ml-1">Dernières Récoltes</h2>
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <div key={record.id} className="clean-card rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${accentBgLight} ${record.poultryType === 'caille' ? 'border-emerald-100' : 'border-orange-100'}`}>
                <iconify-icon icon={record.poultryType === 'caille' ? "solar:egg-bold-duotone" : "solar:record-circle-bold-duotone"} stroke-width="1.5" class={`text-xl ${accentColor}`}></iconify-icon>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {record.quantity} {record.poultryType === 'caille' ? 'œufs de caille' : 'œufs'}
                </p>
                <p className="text-xs font-light text-gray-500 truncate">
                  {new Date(record.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                  {record.notes && <span className="ml-2 italic">{record.notes}</span>}
                  {record.poultryBreed && <span className="ml-4 px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600 uppercase tracking-wider">{record.poultryBreed}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(record)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                  >
                    <iconify-icon icon="solar:pen-new-square-linear"></iconify-icon>
                  </button>
                  <button 
                    onClick={() => handleDelete(record.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-500 transition-colors"
                  >
                    <iconify-icon icon="solar:trash-bin-minimalistic-linear"></iconify-icon>
                  </button>
              </div>
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div className="clean-card rounded-3xl py-16 text-center border-dashed border-gray-200">
              <iconify-icon icon="solar:egg-line-duotone" class="text-4xl text-gray-300 mb-2 block"></iconify-icon>
              <p className="text-xs font-light text-gray-500">Aucune récolte enregistrée.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <BottomSheet 
        isOpen={isAddOpen} 
        onClose={() => { setIsAddOpen(false); setEditingRecord(null); }}
        title={editingRecord ? "Modifier la Récolte" : "Nouvelle Récolte"}
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Date</label>
              <input type="date" className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 dark:focus:border-zinc-500" {...register("date", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Quantité</label>
              <input type="number" step="1" className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 dark:focus:border-zinc-500" placeholder="0" {...register("quantity", { required: true })} />
            </div>
          </div>

          {isMixed && (
            <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Espèce</label>
                <select 
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
                {...register("poultryType")}
                >
                {poultryTypes.map(t => (
                    <option key={t} value={t!}>{t === 'poulet' ? '🐓 Poulet' : t === 'caille' ? '🥚 Caille' : t === 'pigeon' ? '🕊️ Pigeon' : '🐇 Lapin'}</option>
                ))}
                </select>
            </div>
          )}

          {(formData.poultryType === 'caille' || (activeSpeciesFilter === 'caille' && !formData.poultryType)) ? (
            <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race associée</label>
                <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <iconify-icon icon="solar:egg-bold-duotone"></iconify-icon>
                    Caille
                </div>
                <input type="hidden" value="caille" {...register("breed")} />
            </div>
          ) : (
            <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race associée</label>
                <select className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 dark:focus:border-zinc-500" {...register("breed")}>
                    {selectedBreeds.filter(b => b === 'fermier' || b === 'ornement').map(b => (
                        <option key={b} value={b}>{b === 'fermier' ? 'Poulet Fermier' : "Poule d'Ornement"}</option>
                    ))}
                </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Notes particulières</label>
            <input
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-colors"
              placeholder="Ex: Quelques œufs fêlés..."
              {...register("notes")}
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-zinc-800 mt-4">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 ${accentBg} text-white rounded-xl text-sm font-medium shadow-md transition-colors`}
            >
              Confirmer
            </button>
          </div>
        </form>
      </BottomSheet>
    </section>
  );
}
