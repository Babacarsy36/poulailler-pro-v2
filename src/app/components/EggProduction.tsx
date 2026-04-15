import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { StorageService } from "../services/StorageService";
import { useForm } from "react-hook-form";
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
  const { poultryType, selectedBreeds, syncTrigger, saveData } = useAuth();
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [totalFemales, setTotalFemales] = useState(0);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EggFormData & { breed: string }>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      quantity: "",
      notes: "",
      breed: selectedBreeds[0] || "",
    }
  });

  const formData = watch();

  const isCaille = poultryType === 'caille';
  const accentColorClass = isCaille ? 'emerald' : 'orange';
  const accentIcon = isCaille ? "solar:egg-bold-duotone" : "solar:record-circle-bold-duotone";
  const accentColor = isCaille ? "text-emerald-500" : "text-orange-500";
  const accentBg = `bg-${accentColorClass}-500 hover:bg-${accentColorClass}-600`;
  const accentBgLight = isCaille ? "bg-emerald-50" : "bg-orange-50";
  const accentBorderLeft = isCaille ? "border-l-emerald-500" : "border-l-orange-500";

  useEffect(() => {
    const saved = StorageService.getItem<EggRecord[]>("eggs");
    if (saved) setRecords(saved);
  }, [syncTrigger]);

  useEffect(() => {
    const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
    const females = chickens
      .filter((c: Chicken) => {
        const typeMatch = !poultryType || c.poultryType === poultryType || (poultryType === 'poulet' && !c.poultryType);
        const breedMatch = !selectedBreeds || selectedBreeds.length === 0 || selectedBreeds.some(sb => c.breed?.toLowerCase() === sb?.toLowerCase());
        return typeMatch && breedMatch;
      })
      .reduce((sum: number, c: Chicken) => sum + (typeof c.femaleCount === 'string' ? parseInt(c.femaleCount) : c.femaleCount || 0), 0);
    setTotalFemales(females);
  }, [syncTrigger, poultryType, selectedBreeds]);

  const saveRecords = (newRecords: EggRecord[]) => {
    setRecords(newRecords);
    saveData("eggs", newRecords);
  };

  const onFormSubmit = (data: EggFormData & { breed: string }) => {
    const now = Date.now();
    const newRecord: EggRecord = {
      id: now.toString(),
      date: data.date,
      quantity: Number(data.quantity),
      notes: data.notes,
      poultryType: poultryType || "poulet",
      poultryBreed: data.breed || selectedBreeds[0] || undefined,
      updatedAt: now
    };
    saveRecords([newRecord, ...records]);
    reset({ date: new Date().toISOString().split("T")[0], quantity: "", notes: "", breed: selectedBreeds[0] || "" });
    setIsAddOpen(false);
  };

  const filteredRecords = records.filter(r => {
    const typeMatch = !poultryType || r.poultryType === poultryType || (poultryType === 'poulet' && !r.poultryType);
    const breedMatch = !selectedBreeds || selectedBreeds.length === 0 || selectedBreeds.some(sb => r.poultryBreed?.toLowerCase() === sb?.toLowerCase());
    return typeMatch && breedMatch;
  });

  const totalEggs = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
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

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 select-none">
        {/* Total */}
        <div className={`clean-card rounded-2xl w-full h-[116px] p-3 flex flex-col justify-between border-l-4 ${accentBorderLeft} hover:scale-105 transition-transform`}>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-['DM_Sans']">
            <iconify-icon icon={accentIcon} stroke-width="1.5" class={`text-xl ${accentColor}`}></iconify-icon>
            <span className="truncate font-medium">Total</span>
          </div>
          <div>
            <div className="font-['JetBrains_Mono'] text-2xl tracking-tight text-gray-900 mb-1 font-medium">{totalEggs}</div>
            <div className={`text-xs font-medium tracking-tight inline-block px-1.5 py-0.5 rounded ${accentBgLight} ${accentColor}`}>
              unités récoltées
            </div>
          </div>
        </div>

        {/* Dernière Récolte */}
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

        {/* Taux de Ponte */}
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
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    const newVal = window.prompt(`Modifier la quantité d'œufs pour le ${new Date(record.date).toLocaleDateString()}:`, record.quantity.toString());
                    if (newVal !== null) {
                      const parsed = parseInt(newVal);
                      if (!isNaN(parsed) && parsed >= 0) {
                        saveRecords(records.map(r => r.id === record.id ? { ...r, quantity: parsed, updatedAt: Date.now() } : r));
                      }
                    }
                  }}
                  className="p-2 bg-gray-50 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <iconify-icon icon="solar:pen-linear" class="text-base"></iconify-icon>
                </button>
                <button
                  onClick={() => { if (window.confirm("Supprimer cette récolte ?")) saveRecords(records.filter(r => r.id !== record.id)); }}
                  className="p-2 bg-gray-50 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-base"></iconify-icon>
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
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="font-['Syne'] text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">
              Nouvelle Récolte
            </h3>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race de la récolte</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors"
                  {...register("breed", { required: true })}
                >
                  {selectedBreeds.map(b => (
                    <option key={b} value={b}>{b === 'chair' ? 'Poulet de Chair' : b === 'fermier' ? 'Poulet Fermier' : b === 'ornement' ? "Poule d'Ornement" : b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Date de collecte</label>
                <input
                  type="date"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors"
                  {...register("date", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Nombre d'œufs</label>
                <input
                  type="number"
                  className={`w-full bg-gray-50 border rounded-xl p-3 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors ${errors.quantity ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="Ex: 48"
                  {...register("quantity", { required: "Quantité requise", min: 1 })}
                />
                {errors.quantity && <p className="text-red-500 text-[10px] font-medium">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Notes particulières</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors"
                  placeholder="Ex: Quelques œufs fêlés..."
                  {...register("notes")}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Annuler </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 ${accentBg} text-white rounded-xl text-sm font-medium shadow-md transition-colors`}
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
