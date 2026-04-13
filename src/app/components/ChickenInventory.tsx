import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Bird, Calendar, Activity, Users, FileWarning, ShoppingCart, Printer } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { useForm } from "react-hook-form";

interface Chicken {
  id: string;
  name: string;
  poultryType: "caille" | "poulet";
  breed: string;
  age: number;
  ageUnit: "weeks" | "months";
  count: number;
  femaleCount?: number;
  maleCount?: number;
  status: "active" | "malade" | "retraite";
  startDate?: string;
  ringNumber?: string;
  variety?: string[];
  birthYear?: number;
  club?: string;
  updatedAt?: number;
}

interface ChickenFormData {
  name: string;
  breed: string;
  age: string;
  ageUnit: "weeks" | "months";
  count: string;
  femaleCount: string;
  maleCount: string;
  status: "active" | "malade" | "retraite";
  startDate: string;
  ringNumber?: string;
  variety?: string[];
  birthYear?: string;
  club?: string;
}

export function ChickenInventory() {
  const { poultryType, poultryBreed, syncTrigger, saveData } = useAuth();
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingChicken, setEditingChicken] = useState<Chicken | null>(null);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ChickenFormData>({
    defaultValues: {
      name: "",
      breed: poultryBreed || "",
      age: "",
      ageUnit: "months",
      count: "1",
      femaleCount: "0",
      maleCount: "0",
      status: "active",
      startDate: new Date().toISOString().split('T')[0],
      ringNumber: "",
      variety: [],
      birthYear: "",
      club: "",
    }
  });

  const formData = watch();
  const [simFemales, setSimFemales] = useState("10");

  const isCaille = poultryType === 'caille';
  const accentColorClass = isCaille ? 'emerald' : 'orange';
  const accentColor = isCaille ? "text-emerald-500" : "text-orange-500";
  const bgLight = isCaille ? "bg-emerald-50" : "bg-orange-50";
  const iconBg = isCaille ? "bg-emerald-500 text-white" : "bg-orange-500 text-white";
  const btnBg = `bg-${accentColorClass}-500 hover:bg-${accentColorClass}-600`;

  const filteredChickens = chickens.filter((c) => {
    // If poultryType is null, we are in "Vue Globale", so show everything
    const typeMatch = !poultryType || c.poultryType === poultryType || (poultryType === 'poulet' && !c.poultryType);
    const breedMatch = !poultryBreed || c.breed?.toLowerCase() === poultryBreed.toLowerCase();
    return typeMatch && breedMatch;
  });

  // Mating ratio calculation
  const matingRatio = 1/4; // 1 coq pour 4 poules (Goliath et Cailles)
  const recommendedMales = Math.ceil(Number(simFemales) * matingRatio);

  const totalFemales = filteredChickens.reduce((sum, c) => sum + (c.femaleCount || 0), 0);
  const totalMales = filteredChickens.reduce((sum, c) => sum + (c.maleCount || 0), 0);
  const idealMales = Math.ceil(totalFemales * matingRatio);

  let fertilityStatus: 'ideal' | 'deficit' | 'excess' | 'none' = 'none';
  if (totalFemales > 0) {
    if (totalMales === 0 || totalMales < idealMales) fertilityStatus = 'deficit';
    else if (totalMales > idealMales + 1) fertilityStatus = 'excess';
    else fertilityStatus = 'ideal';
  }

  const getRecommendedFeed = (ageValue: string, ageUnit: string, breed: string, type: string) => {
    const val = parseFloat(ageValue) || 0;
    const ageDays = ageUnit === 'weeks' ? val * 7 : val * 30;
    if (ageDays <= 0) return "Âge non défini";

    if (type === 'caille') {
       if (ageDays <= 14) return "Démarrage Cailles (Très riche)";
       if (ageDays <= 42) return "Croissance Cailles";
       return "Ponte / Engraissement Cailles";
    }

    if (breed.toLowerCase().includes('pondeuse')) {
       if (ageDays <= 28) return "Démarrage Pondeuses";
       if (ageDays <= 126) return "Poulette (Croissance)";
       return "Aliment Ponte (Riche en Calcium)";
    }

    if (breed.toLowerCase().includes('goliath') || breed.toLowerCase().includes('brahma') || breed.toLowerCase().includes('cochin')) {
       if (ageDays <= 28) return "Démarrage Chair (Lourdes)";
       if (ageDays <= 60) return "Croissance Chair (Lourdes)";
       return "Finition Chair (Énergie élevée)";
    }

    // Default Chair
    if (ageDays <= 21) return "Démarrage Chair";
    if (ageDays <= 35) return "Croissance Chair";
    return "Finition Chair";
  };

  useEffect(() => {
    const saved = StorageService.getItem<Chicken[]>("chickens");
    if (saved) {
      // Ensure old entries have a count and type
      const migrated = saved.map((c: any) => ({
        ...c,
        poultryType: c.poultryType || (c.breed?.toLowerCase().includes("caille") ? "caille" : (poultryType || "poulet")),
        count: c.count ? parseInt(c.count) : 1,
        ageUnit: c.ageUnit || "months"
      }));
      setChickens(migrated);
    }
  }, [syncTrigger, poultryType]);

  const saveChickens = (newChickens: Chicken[]) => {
    setChickens(newChickens);
    saveData("chickens", newChickens);
  };

  const onFormSubmit = (data: ChickenFormData) => {
    const countVal = Number(data.count);
    const femVal = Number(data.femaleCount);
    const maleVal = Number(data.maleCount);

    const actualCount = (femVal > 0 || maleVal > 0) ? femVal + maleVal : countVal;
    const now = Date.now();

    if (editingChicken) {
      const updated = chickens.map((c) =>
        c.id === editingChicken.id ? { 
          ...c, 
          ...data, 
          poultryType: poultryType || c.poultryType || "poulet",
          breed: data.breed || poultryBreed || "",
          ringNumber: data.ringNumber || undefined,
          variety: data.variety || undefined,
          birthYear: data.birthYear ? Number(data.birthYear) : undefined,
          club: data.club || undefined,
          age: Number(data.age), 
          count: actualCount,
          femaleCount: femVal,
          maleCount: maleVal,
          updatedAt: now
        } : c
      );
      saveChickens(updated);
      setEditingChicken(null);
    } else {
      const newChicken: Chicken = {
        id: now.toString(),
        ...data,
        poultryType: (poultryType || "poulet").toLowerCase() as "poulet" | "caille",
        breed: data.breed || poultryBreed || "",
        ringNumber: data.ringNumber || undefined,
        variety: data.variety || undefined,
        birthYear: data.birthYear ? Number(data.birthYear) : undefined,
        club: data.club || undefined,
        age: Number(data.age),
        count: actualCount,
        femaleCount: femVal,
        maleCount: maleVal,
        updatedAt: now
      };
      saveChickens([...chickens, newChicken]);
    }
    reset({ name: "", breed: poultryBreed || "", age: "", ageUnit: "months", count: "1", femaleCount: "0", maleCount: "0", status: "active", startDate: new Date().toISOString().split('T')[0], ringNumber: "", variety: [], birthYear: "", club: "" });
    setIsAddOpen(false);
  };

  return (
    <section id="screen-inventory" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-['Syne'] text-xl font-semibold text-gray-900 tracking-tight">
            Inventaire {isCaille ? "Cailles" : (poultryBreed ? (poultryBreed === 'chair' ? 'Poulet de Chair' : poultryBreed.toUpperCase()) : "Poulets")}
          </h1>
          <p className="text-xs font-light text-gray-500 mt-1">Gestion par lots & sujets</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="h-10 w-10 bg-white border border-gray-200 text-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors no-print outline-none"
          >
            <iconify-icon icon="solar:printer-linear" class="text-xl"></iconify-icon>
          </button>
          <button 
            onClick={() => {
              reset({ name: "", breed: poultryBreed || "", age: "", ageUnit: "months", count: "1", femaleCount: "0", maleCount: "0", status: "active", startDate: new Date().toISOString().split('T')[0], ringNumber: "", variety: [], birthYear: "", club: "" });
              setIsAddOpen(true);
            }}
            className={`h-10 px-3 rounded-xl ${btnBg} text-white flex items-center justify-center shadow-md transition-colors no-print outline-none`}
          >
            <iconify-icon icon="solar:add-circle-linear" class="text-xl sm:mr-2"></iconify-icon>
            <span className="font-medium text-sm hidden sm:inline">Nouveau Lot</span>
          </button>
        </div>
      </div>

      <div className="print-only mb-6 border-b border-gray-200 pb-4 hidden">
        <h1 className="text-2xl font-bold text-black border-none">POULAILLER PRO - INVENTAIRE DU CHEPTEL</h1>
        <p className="text-xs font-medium text-gray-500 uppercase mt-1">
          Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Simulator Card */}
      <div className={`clean-card rounded-3xl p-5 border-l-4 border-l-gray-900 flex flex-col gap-5 relative`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bgLight} flex items-center justify-center shrink-0`}>
              <iconify-icon icon="solar:users-group-rounded-linear" class={`text-xl ${accentColor}`}></iconify-icon>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-0.5">Calculateur de fertilité</p>
              <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Ratio Reproduction</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-row items-center gap-4 justify-between">
                <div className="space-y-1 w-24 sm:w-auto">
                   <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Femelles</label>
                   <input 
                     type="number" 
                     value={simFemales} 
                     onChange={e => setSimFemales(e.target.value)}
                     className={`w-full bg-white border border-gray-200 rounded-xl p-2 font-['JetBrains_Mono'] text-sm font-medium text-gray-900 text-center outline-none focus:border-gray-400 transition-colors`}
                   />
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-0.5">Ratio Idéal (1:4)</p>
                      <p className="font-['JetBrains_Mono'] text-xl font-medium text-gray-900 leading-tight flex items-center justify-end gap-1"><span className={accentColor}>{recommendedMales}</span> Mâles</p>
                   </div>
                   <div className={`w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0`}>
                      <iconify-icon icon="solar:bird-linear" class="text-xl text-gray-700"></iconify-icon>
                   </div>
                </div>
            </div>

            {totalFemales > 0 && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 border-l-4 ${
                fertilityStatus === 'ideal' ? 'bg-emerald-50 border-l-emerald-500' :
                fertilityStatus === 'deficit' ? 'bg-orange-50 border-l-orange-500' :
                'bg-red-50 border-l-red-500'
              }`}>
                <iconify-icon icon="solar:pulse-linear" class={`text-xl mt-0.5 shrink-0 ${
                  fertilityStatus === 'ideal' ? 'text-emerald-600' :
                  fertilityStatus === 'deficit' ? 'text-orange-600' :
                  'text-red-600'
                }`}></iconify-icon>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-gray-600 mb-0.5">Statut du cheptel</p>
                  <p className="text-xs font-light text-gray-800 leading-relaxed max-w-[250px]">
                    {fertilityStatus === 'ideal' && `Parfait ! Vos ${totalMales} mâles couvrent idéalement vos ${totalFemales} femelles.`}
                    {fertilityStatus === 'deficit' && `Besoin de ${idealMales - totalMales} mâle(s) supplémentaire(s) pour une fertilité optimale.`}
                    {fertilityStatus === 'excess' && `Excès de mâles (${totalMales} pour ${totalFemales} femelles). Attention au stress.`}
                  </p>
                </div>
              </div>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChickens.map((chicken) => (
          <div key={chicken.id} className="clean-card rounded-3xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className={`py-1.5 px-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2`}>
                <iconify-icon icon="solar:bird-linear" class="text-lg text-gray-700"></iconify-icon>
                <span className="font-['JetBrains_Mono'] font-medium text-gray-900 border-l border-gray-200 pl-2">x{chicken.count}</span>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded-lg ${
                chicken.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {chicken.status === 'active' ? 'Actif' : chicken.status === 'malade' ? 'Malade' : 'Retraité'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-['Syne'] text-lg font-medium text-gray-900 truncate leading-tight mb-1">{chicken.name}</h3>
                <p className={`text-[10px] font-medium uppercase tracking-widest text-gray-500`}>
                  RACE: <span className={accentColor}>{chicken.breed === 'chair' ? 'Poulet de chair' : (chicken.breed || poultryBreed || "Non définie")}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <iconify-icon icon="solar:calendar-linear" class="text-gray-400"></iconify-icon>
                  <p className="text-xs font-light text-gray-600 truncate">
                    {chicken.age} {chicken.ageUnit === 'weeks' ? 'semaines' : 'mois'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <iconify-icon icon="solar:history-linear" class="text-gray-400"></iconify-icon>
                  <p className="text-[10px] font-light text-gray-500 truncate">
                     {chicken.startDate ? new Date(chicken.startDate).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: '2-digit'}) : 'Aucune'}
                  </p>
                </div>
              </div>

              {chicken.ringNumber && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <iconify-icon icon="solar:tag-horizontal-linear" class="text-orange-500"></iconify-icon>
                    <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-gray-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      Bague: {chicken.ringNumber}
                    </p>
                  </div>
                  {chicken.variety && chicken.variety.length > 0 && chicken.variety.map(v => (
                    <p key={v} className="text-[10px] font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {v}
                    </p>
                  ))}
                  {chicken.birthYear && (
                    <p className="text-[10px] font-medium text-gray-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                       {chicken.birthYear}
                    </p>
                  )}
                  {chicken.club && (
                    <p className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 truncate max-w-[120px]">
                       {chicken.club}
                    </p>
                  )}
                </div>
              )}

              {(chicken.maleCount! > 0 || chicken.femaleCount! > 0) && (
                <div className="flex items-center gap-3 pt-2 text-[10px] font-medium text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                   <span className="flex items-center gap-1"><iconify-icon icon="solar:virus-linear" class="text-emerald-500"></iconify-icon> {chicken.femaleCount} Femelles</span>
                   <span className="text-gray-300">|</span>
                   <span className="flex items-center gap-1"><iconify-icon icon="solar:star-linear" class="text-orange-500"></iconify-icon> {chicken.maleCount} Mâles</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 no-print">
                <button 
                  onClick={() => {
                    setEditingChicken(chicken);
                    reset({ 
                      ...chicken, 
                      age: chicken.age.toString(), 
                      count: chicken.count.toString(),
                      femaleCount: (chicken.femaleCount || "0").toString(),
                      maleCount: (chicken.maleCount || "0").toString(),
                      startDate: chicken.startDate || new Date().toISOString().split('T')[0],
                      ringNumber: chicken.ringNumber || "",
                      variety: chicken.variety || [],
                      birthYear: chicken.birthYear ? chicken.birthYear.toString() : "",
                      club: chicken.club || ""
                    } as any);
                    setIsAddOpen(true);
                  }}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 py-2 rounded-xl text-gray-600 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 outline-none"
                >
                  <iconify-icon icon="solar:pen-linear"></iconify-icon> Modifier
                </button>
                <button 
                  onClick={() => { if(window.confirm("Supprimer ce lot ?")) saveChickens(chickens.filter(c => c.id !== chicken.id)); }}
                  className="p-2 px-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-400 transition-colors outline-none"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="font-['Syne'] text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">
              {editingChicken ? "Modifier le lot" : "Nouveau lot"}
            </h3>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Nom du Lot / Identifiant</label>
                <input 
                  className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none transition-all ${errors.name ? 'border-red-300 focus:border-red-400' : 'focus:border-gray-400'}`}
                  placeholder="Ex: Arrivage Janvier..."
                  {...register("name", { required: "Nom requis" })}
                />
                {errors.name && <p className="text-red-500 text-[10px] font-medium">{errors.name.message}</p>}
              </div>

              {poultryBreed === 'fermier' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race Exacte</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-all"
                    {...register("breed")}
                  >
                    <option value="fermier">Standard (Local / Métissé)</option>
                    <option value="Goliath">Goliath</option>
                    <option value="Rainbow">Rainbow</option>
                    <option value="Bleu d'Hollande">Bleu d'Hollande</option>
                  </select>
                </div>
              )}

              {poultryBreed === 'ornement' && (
                <>
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race Exacte</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-all"
                      {...register("breed")}
                    >
                      <option value="Ornement">Autre ornement</option>
                      <option value="Brahma">Brahma</option>
                      <option value="Cochin">Cochin</option>
                      <option value="Pékin">Pékin</option>
                      <option value="Poule-Soie">Poule-Soie</option>
                    </select>
                  </div>

                  {(formData.breed === 'Brahma' || formData.breed === 'Cochin') && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Variétés (Multi-sélection possible)</label>
                      
                      {[
                        { group: "Unies", items: ["Noir", "Blanc", "Bleu", "Fauve"] },
                        { group: "Herminées", items: ["Blanc herminé noir", "Fauve herminé noir", "Blanc herminé bleu", "Fauve herminé bleu"] },
                        { group: "Maillées", items: ["Perdrix doré maillé", "Perdrix argenté maillé", "Perdrix bleu doré maillé"] },
                        { group: "Autres", items: ["Coucou", "Splash", "Caillouté"] }
                      ].map(g => (
                        <div key={g.group} className="mt-2 text-left">
                          <p className="text-[9px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{g.group}</p>
                          <div className="flex flex-wrap gap-2">
                            {g.items.map(v => {
                               const isSelected = formData.variety?.includes(v);
                               return (
                                 <label key={v} className={`px-3 py-1.5 rounded-xl border text-[11px] cursor-pointer select-none transition-all duration-200 flex items-center gap-1.5 ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                   <input type="checkbox" className="hidden" value={v} {...register("variety")} />
                                   {isSelected && <iconify-icon icon="solar:check-circle-bold" class="text-orange-500"></iconify-icon>}
                                   {v}
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Année Naissance</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-gray-400 transition-all"
                        placeholder="Ex: 2023"
                        {...register("birthYear")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Club / Association</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400"
                        placeholder="Ex: BCF..."
                        {...register("club")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500 flex items-center gap-1">
                      Numéro de Bague <iconify-icon icon="solar:tag-horizontal-linear" class="text-orange-500"></iconify-icon>
                    </label>
                    <input 
                      className="w-full bg-orange-50/30 border border-orange-100 rounded-xl p-3 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-orange-300 transition-all"
                      placeholder="Ex: FR-2023-XYZ..."
                      {...register("ringNumber")}
                    />
                    <p className="text-[9px] text-gray-400 italic">Identifiant unique pour les sujets de valeur.</p>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Âge</label>
                  <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 items-stretch focus-within:border-gray-400 transition-colors">
                    <input 
                      type="number"
                      step="0.1"
                      className="w-16 bg-transparent border-none p-2 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 text-center outline-none"
                      {...register("age", { required: true, min: 0 })}
                    />
                    <div className="w-[1px] bg-gray-200 my-1.5"></div>
                    <select
                      className="flex-1 bg-transparent border-none px-2 text-xs font-medium text-gray-600 outline-none cursor-pointer"
                      {...register("ageUnit")}
                    >
                      <option value="months">Mois</option>
                      <option value="weeks">Semaines</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Quantité (Total)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors"
                    {...register("count", { required: true, min: 1 })}
                  />
                </div>
              </div>

              {formData.age && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border-l-4 border-l-blue-500 flex items-center gap-3">
                  <iconify-icon icon="solar:leaf-linear" class="text-2xl text-blue-500"></iconify-icon>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-0.5">Aliment Recommandé</p>
                    <p className="text-xs font-medium text-gray-900">{getRecommendedFeed(formData.age, formData.ageUnit, formData.breed || poultryBreed || "", isCaille ? "caille" : "poulet")}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                 <div className="flex items-center gap-2">
                    <iconify-icon icon="solar:checklist-minimalistic-linear" class="text-lg text-gray-500"></iconify-icon>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-gray-600">Reproduction (Optionnel)</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-500">Femelles</label>
                     <input 
                       type="number"
                       className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-gray-400"
                       {...register("femaleCount")}
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-500">Mâles</label>
                     <input 
                       type="number"
                       className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-gray-400"
                       {...register("maleCount")}
                     />
                   </div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-light leading-snug">Remplir ces champs remplacera la quantité totale par la somme des mâles et femelles.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Statut Santé</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400"
                    {...register("status")}
                  >
                    <option value="active">En pleine forme</option>
                    <option value="malade">Soins requis</option>
                    <option value="retraite">Retraité</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Date d'arrivée</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400"
                    {...register("startDate", { required: true })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3 ${btnBg} text-white rounded-xl text-sm font-medium shadow-md transition-colors`}
                >
                  {editingChicken ? "Mettre à jour" : "Confirmer l'ajout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {chickens.length === 0 && (
        <div className="clean-card rounded-3xl py-16 text-center border-dashed border-gray-200">
          <iconify-icon icon="solar:bird-line-duotone" class="text-4xl text-gray-300 mb-2 block"></iconify-icon>
          <p className="text-xs font-light text-gray-500">Votre inventaire est vide.</p>
        </div>
      )}
    </section>
  );

}
