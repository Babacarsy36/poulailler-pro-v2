import { useEffect, useState } from "react";
import { useAuth, PoultryType } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { BottomSheet } from "./ui/BottomSheet";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface Chicken {
  id: string;
  name: string;
  poultryType: PoultryType;
  breed: string;
  age: number;
  ageUnit: "weeks" | "months" | "days";
  birthDate?: string;
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
  _deleted?: boolean;
}

interface ChickenFormData {
  name: string;
  breed: string;
  poultryType: PoultryType;
  age: string;
  ageUnit: "weeks" | "months" | "days";
  birthDate?: string;
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
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, hasAccess, saveData } = useAuth();
  const poultryBreed = selectedBreeds[0] || "";
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingChicken, setEditingChicken] = useState<Chicken | null>(null);

  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ChickenFormData>({
    defaultValues: {
      name: "",
      breed: selectedBreeds[0] || "",
      poultryType: activeSpeciesFilter === 'all' ? 'poulet' : activeSpeciesFilter,
      age: "",
      ageUnit: "months",
      birthDate: "",
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
  const watchedBirthDate = watch('birthDate');

  // Auto-compute age from birth date
  useEffect(() => {
    if (!watchedBirthDate) return;
    const days = Math.floor((Date.now() - new Date(watchedBirthDate).getTime()) / 86400000);
    if (days < 0) return;
    if (days >= 60) {
      setValue('age', Math.floor(days / 30).toString());
      setValue('ageUnit', 'months');
    } else if (days >= 14) {
      setValue('age', Math.floor(days / 7).toString());
      setValue('ageUnit', 'weeks');
    } else {
      setValue('age', days.toString());
      setValue('ageUnit', 'days');
    }
  }, [watchedBirthDate]);
  const [simFemales, setSimFemales] = useState("10");

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : isCaille ? 'emerald' : 'orange';
  const accentColor = isMixed ? "text-indigo-500" : isCaille ? "text-emerald-500" : "text-orange-500";
  const bgLight = isMixed ? "bg-indigo-50" : isCaille ? "bg-emerald-50" : "bg-orange-50";
  const iconBg = isMixed ? "bg-indigo-500 text-white" : isCaille ? "bg-emerald-500 text-white" : "bg-orange-500 text-white";
  const btnBg = isMixed ? "bg-indigo-500 hover:bg-indigo-600" : isCaille ? "bg-emerald-500 hover:bg-emerald-600" : "bg-orange-500 hover:bg-orange-600";

  const filteredChickens = chickens.filter((c) => !c._deleted && isItemActive(c.poultryType, c.breed));

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
    const ageDays = ageUnit === 'weeks' ? val * 7 : ageUnit === 'days' ? val : val * 30;
    if (ageDays <= 0) return "Âge non défini";

    if (type === 'pigeon') return "Mélange spécial Pigeon / Graines";
    if (type === 'lapin') return "Granulés Lapin / Foin";

    if (type === 'caille') {
      if (ageDays <= 14) return "🥚 Démarrage Cailles (24-28% protéines, miettes)";
      if (ageDays <= 42) return "🥚 Croissance Cailles (20% protéines)";
      return "🥚 Ponte / Engraissement Cailles (riche en minéraux)";
    }

    const b = breed.toLowerCase();

    if (b === 'pondeuse' || b.includes('pondeuse')) {
      if (ageDays <= 28) return "🐔 Démarrage Pondeuses (20-22%, miettes)";
      if (ageDays <= 126) return "🐔 Poulette Croissance (16% protéines)";
      return "🐔 Aliment Ponte enrichi Calcium (3-4%)";
    }

    if (b === 'fermier') {
      if (ageDays <= 28) return "🌿 Démarrage Fermier (19-20% protéines)";
      if (ageDays <= 70) return "🌿 Croissance Fermier semi-liberté (17%)";
      return "🌿 Finition Fermier (énergie modérée, qualité)";
    }

    if (b === 'ornement') {
      if (ageDays <= 28) return "🦚 Démarrage Ornement (18-20% protéines)";
      if (ageDays <= 90) return "🦚 Croissance Ornement (16-18%)";
      return "🦚 Entretien / Ponte Ornement (Calcium + Minéraux)";
    }

    if (b.includes('goliath') || b.includes('brahma') || b.includes('cochin')) {
      if (ageDays <= 28) return "🐓 Démarrage Chair Lourde (20-22%)";
      if (ageDays <= 60) return "🐓 Croissance Chair Lourde (18%)";
      return "🐓 Finition Chair Lourde (énergie élevée)";
    }

    // Default: Chair
    if (ageDays <= 21) return "🐓 Démarrage Chair (22%)";
    if (ageDays <= 35) return "🐓 Croissance Chair (18%)";
    return "🐓 Finition Chair (énergie max)";
  };

  useEffect(() => {
    const saved = StorageService.getItem<Chicken[]>("chickens");
    if (saved) {
      // Ensure old entries have a count and type
      const migrated = saved.map((c: any) => ({
        ...c,
        poultryType: c.poultryType || (c.breed?.toLowerCase().includes("caille") ? "caille" : (activeSpeciesFilter !== 'all' ? activeSpeciesFilter : "poulet")),
        count: c.count ? parseInt(c.count) : 1,
        ageUnit: c.ageUnit || "months"
      }));
      setChickens(migrated);
    }
  }, [syncTrigger, activeSpeciesFilter]);

  const saveChickens = (newChickens: Chicken[]) => {
    setChickens(newChickens);
    saveData("chickens", newChickens);
  };

  const handleShareOrnement = async (chicken: Chicken) => {
    const birthDateStr = chicken.birthDate
      ? new Date(chicken.birthDate).toLocaleDateString('fr-FR')
      : '';
    const ageDays = chicken.birthDate
      ? Math.floor((Date.now() - new Date(chicken.birthDate).getTime()) / 86400000)
      : null;
    const ageStr = ageDays !== null
      ? ageDays >= 60 ? `${Math.floor(ageDays/30)} mois` : ageDays >= 14 ? `${Math.floor(ageDays/7)} semaines` : `${ageDays} jours`
      : chicken.age ? `${chicken.age} ${chicken.ageUnit === 'weeks' ? 'semaines' : chicken.ageUnit === 'days' ? 'jours' : 'mois'}` : '';

    const lines = [
      `🦚 FICHE SUJET — ${chicken.name}`,
      `═══════════════════════════════`,
      `Race : Poule d'Ornement`,
      chicken.variety?.length ? `Variété : ${chicken.variety.join(', ')}` : '',
      chicken.ringNumber ? `Bague(s) : ${chicken.ringNumber}` : '',
      birthDateStr ? `Naissance : ${birthDateStr}` : '',
      ageStr ? `Âge : ${ageStr}` : '',
      chicken.birthYear ? `Année : ${chicken.birthYear}` : '',
      chicken.club ? `Club : ${chicken.club}` : '',
      ``,
      `Effectif : ${chicken.count} sujet(s)`,
      `Statut : ${chicken.status === 'active' ? '✅ Actif' : chicken.status === 'malade' ? '⚠️ Soins requis' : '📦 Retraité'}`,
      (chicken.femaleCount || chicken.maleCount) ? `♀ ${chicken.femaleCount || 0} Femelles | ♂ ${chicken.maleCount || 0} Mâles` : '',
      chicken.startDate ? `Arrivée : ${new Date(chicken.startDate).toLocaleDateString('fr-FR')}` : '',
      ``,
      `📱 Fiche générée par Poulailler Pro`,
    ].filter(Boolean).join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: `Fiche ${chicken.name}`, text: lines });
      } else {
        await navigator.clipboard.writeText(lines);
        toast.success('Fiche copiée dans le presse-papier !');
      }
    } catch {
      await navigator.clipboard.writeText(lines);
      toast.success('Fiche copiée !');
    }
  };

  const onFormSubmit = (data: any) => {
    const now = Date.now();
    const actualCount = Number(data.count) || 1;
    const femVal = Number(data.femaleCount) || 0;
    const maleVal = Number(data.maleCount) || 0;

    // Determine poultryType for the record
    let recordType = data.poultryType;
    if (!recordType) {
        recordType = activeSpeciesFilter !== 'all' ? activeSpeciesFilter : 'poulet';
    }

    if (editingChicken) {
      const updated = chickens.map((c) =>
        c.id === editingChicken.id ? { 
          ...c, 
          ...data, 
          poultryType: recordType,
          breed: data.breed || selectedBreeds[0] || "",
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
        poultryType: recordType,
        breed: data.breed || selectedBreeds[0] || "",
        ringNumber: data.ringNumber || undefined,
        variety: data.variety || undefined,
        birthYear: data.birthYear ? Number(data.birthYear) : undefined,
        club: data.club || undefined,
        birthDate: data.birthDate || undefined,
        age: Number(data.age),
        count: actualCount,
        femaleCount: femVal,
        maleCount: maleVal,
        updatedAt: now
      };
      saveChickens([...chickens, newChicken]);
    }
    reset({ name: "", poultryType: activeSpeciesFilter !== 'all' ? activeSpeciesFilter : 'poulet', breed: selectedBreeds[0] || "", age: "", ageUnit: "months", count: "1", femaleCount: "0", maleCount: "0", status: "active", startDate: new Date().toISOString().split('T')[0], ringNumber: "", variety: [], birthYear: "", club: "" });
    setIsAddOpen(false);
  };

  return (
    <section id="screen-inventory" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-['Syne'] text-xl font-semibold text-gray-900 tracking-tight">
            Inventaire {isMixed ? "Global" : activeSpeciesFilter === 'caille' ? 'Cailles' : activeSpeciesFilter === 'pigeon' ? 'Pigeons' : activeSpeciesFilter === 'lapin' ? 'Lapins' : (selectedBreeds.length > 0 ? selectedBreeds.join(' & ').toUpperCase() : "Poulets")}
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
              reset({
                name: "",
                breed: isCaille ? 'caille' : (selectedBreeds.filter(b => b !== 'caille')[0] || ""),
                poultryType: isCaille ? 'caille' : (isMixed ? '' : 'poulet'),
                age: "", ageUnit: "months", count: "1", femaleCount: "0", maleCount: "0",
                status: "active", startDate: new Date().toISOString().split('T')[0],
                ringNumber: "", variety: [], birthYear: "", club: ""
              });
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
                  {chicken.poultryType === 'caille' ? (
                    <span className={accentColor}>🥚 CAILLE</span>
                  ) : (
                    <>
                      RACE: <span className={accentColor}>
                        {chicken.breed === 'chair' ? 'Poulet de chair' :
                         chicken.breed === 'fermier' ? 'Poulet Fermier' :
                         chicken.breed === 'ornement' ? (
                           // Extraire le nom de la race exacte depuis le nom du lot (ex: "Brahma 2026" → "Brahma")
                           chicken.name?.split(' ')[0] !== chicken.name ? `${chicken.name?.split(' ')[0]} (Ornement)` : "Poule d'Ornement"
                         ) :
                         chicken.breed === 'pondeuse' ? 'Pondeuse' :
                         (chicken.breed || "Non définie")}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <iconify-icon icon="solar:calendar-linear" class="text-gray-400"></iconify-icon>
                  <p className="text-xs font-light text-gray-600 truncate">
                    {chicken.birthDate
                      ? (() => {
                          const d = Math.floor((Date.now() - new Date(chicken.birthDate).getTime()) / 86400000);
                          return d >= 60 ? `${Math.floor(d/30)} mois` : d >= 14 ? `${Math.floor(d/7)} sem.` : `${d} j`;
                        })()
                      : `${chicken.age} ${chicken.ageUnit === 'weeks' ? 'semaines' : chicken.ageUnit === 'days' ? 'jours' : 'mois'}`}
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
                {chicken.breed === 'ornement' && (
                  <button
                    onClick={() => handleShareOrnement(chicken)}
                    className="flex-none px-3 bg-purple-50 hover:bg-purple-100 py-2 rounded-xl text-purple-600 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 outline-none border border-purple-100"
                    title="Partager la fiche de ce sujet"
                  >
                    <iconify-icon icon="solar:share-linear"></iconify-icon>
                    <span className="hidden sm:inline">Partager</span>
                  </button>
                )}
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
                  onClick={() => { 
                    if(window.confirm("Supprimer ce lot ?")) {
                      saveChickens(chickens.map(c => c.id === chicken.id ? { ...c, _deleted: true, updatedAt: Date.now() } : c));
                    }
                  }}
                  className="p-2 px-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-400 transition-colors outline-none"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

       <BottomSheet 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)}
        title={editingChicken ? "Modifier le lot" : "Nouveau lot"}
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left py-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Nom du Lot / Identifiant</label>
            <input 
              className={`w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none transition-all ${errors.name ? 'border-red-300 focus:border-red-400' : 'focus:border-gray-400'}`}
              placeholder="Ex: Arrivage Janvier..."
              {...register("name", { required: "Nom requis" })}
            />
            {errors.name && <p className="text-red-500 text-[10px] font-medium">{errors.name.message}</p>}
          </div>

          {poultryTypes.length > 1 && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Espèce</label>
                <select 
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 transition-all`}
                  {...register("poultryType")}
                >
                  {poultryTypes.map(t => (
                      <option key={t} value={t!}>{t === 'poulet' ? '🐓 Poulet' : t === 'caille' ? '🥚 Caille' : t === 'pigeon' ? '🕊️ Pigeon' : '🐇 Lapin'}</option>
                  ))}
                </select>
            </div>
          )}

          {formData.poultryType === 'caille' && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <span className="text-3xl">🥚</span>
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Lot de Cailles</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Sélectionnez la race ci-dessous.</p>
              </div>
            </div>
          )}

          {formData.poultryType === 'poulet' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Catégorie de race</label>
                <select 
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 transition-all"
                {...register("breed")}
                >
                {selectedBreeds.filter(b => ['chair', 'fermier', 'ornement', 'pondeuse'].includes(b)).map(b => (
                    <option key={b} value={b}>{b === 'chair' ? 'Poulet de Chair' : b === 'fermier' ? 'Poulet Fermier' : b === 'ornement' ? "Poule d'Ornement" : b === 'pondeuse' ? 'Pondeuse' : b}</option>
                ))}
                </select>
            </div>
          )}

          {formData.poultryType === 'caille' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race de Caille</label>
                <select 
                  className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-400 transition-all"
                  {...register("breed")}
                >
                  <option value="japon">Caille du Japon</option>
                  <option value="chine">Caille de Chine</option>
                  <option value="commune">Caille Commune</option>
                </select>
            </div>
          )}

          {formData.poultryType === 'caille' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-medium uppercase tracking-widest text-emerald-600">Souche / Mutation (Cailles)</label>
              <select 
                className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 text-sm font-medium text-emerald-900 dark:text-emerald-300 outline-none focus:border-emerald-400 transition-all"
                defaultValue="Pharaon"
                onChange={(e) => setValue('name', `Caille ${e.target.value} ${new Date().getFullYear()}`)}
              >
                <option value="Pharaon">Pharaon (Classique / Sauvage)</option>
                <option value="Jumbo">Jumbo (Chair lourde)</option>
                <option value="Isabelle">Isabelle</option>
                <option value="Tuxedo">Tuxedo (Bicolore)</option>
                <option value="Blanc">Blanc Anglais</option>
                <option value="Manchourie">Manchourie (Dorée)</option>
                <option value="Rosetta">Rosetta</option>
                <option value="Autre">Autre mutation</option>
              </select>
            </div>
          )}

          {formData.poultryType === 'poulet' && formData.breed === 'ornement' && (
            <>
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race Exacte</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-400 transition-all"
                  onChange={(e) => setValue('name', `${e.target.value} ${new Date().getFullYear()}`)}
                >
                  <option value="Ornement">Autre ornement</option>
                  <option value="Brahma">Brahma</option>
                  <option value="Cochin">Cochin</option>
                  <option value="Cochin Nain (Pékin)">Cochin Nain (Pékin)</option>
                  <option value="Orpington">Orpington</option>
                  <option value="Poule-Soie">Poule-Soie</option>
                </select>
              </div>

              {['Brahma', 'Cochin', 'Cochin Nain (Pékin)', 'Orpington'].some(r => formData.name?.includes(r)) && (
                <div className="space-y-2 animate-in slide-in-from-top-2 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
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
                             <label key={v} className={`px-3 py-1.5 rounded-xl border text-[11px] cursor-pointer select-none transition-all duration-200 flex items-center gap-1.5 ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold shadow-sm' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50'}`}>
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

              {(formData.breed === 'ornement' || formData.breed === 'pondeuse') && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500 flex items-center gap-1">
                    Numéro de Bague <iconify-icon icon="solar:tag-horizontal-linear" class="text-orange-500"></iconify-icon>
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-['JetBrains_Mono'] text-gray-900 dark:text-white outline-none focus:border-gray-400 min-h-[60px]"
                    placeholder="Ex: 23-AA123, 23-AA124..."
                    {...register("ringNumber")}
                  />
                </div>
              )}
            </>
          )}

              {/* Birth date picker → auto-compute age */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Date de Naissance / Éclosion</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors"
                  {...register("birthDate")}
                />
                {watchedBirthDate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                    <iconify-icon icon="solar:calendar-check-linear" class="text-blue-500"></iconify-icon>
                    <p className="text-xs font-medium text-blue-700">
                      Âge calculé : <span className="font-black">{formData.age} {formData.ageUnit === 'weeks' ? 'semaines' : formData.ageUnit === 'days' ? 'jours' : 'mois'}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                    {watchedBirthDate ? "Âge (calculé auto)" : "Âge"}
                  </label>
                  <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 items-stretch focus-within:border-gray-400 transition-colors">
                    <input 
                      type="number"
                      step="0.1"
                      readOnly={!!watchedBirthDate}
                      className={`w-16 bg-transparent border-none p-2 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 text-center outline-none ${watchedBirthDate ? 'opacity-60 cursor-not-allowed' : ''}`}
                      {...register("age", { required: !watchedBirthDate, min: 0 })}
                    />
                    <div className="w-[1px] bg-gray-200 my-1.5"></div>
                    <select
                      className="flex-1 bg-transparent border-none px-2 text-xs font-medium text-gray-600 outline-none cursor-pointer"
                      disabled={!!watchedBirthDate}
                      {...register("ageUnit")}
                    >
                      <option value="months">Mois</option>
                      <option value="weeks">Semaines</option>
                      <option value="days">Jours</option>
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

              {!(formData.breed === 'chair' || formData.breed === 'pondeuse') && (
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
              )}

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
      </BottomSheet>

      {chickens.length === 0 && (
        <div className="clean-card rounded-3xl py-16 text-center border-dashed border-gray-200">
          <iconify-icon icon="solar:bird-line-duotone" class="text-4xl text-gray-300 mb-2 block"></iconify-icon>
          <p className="text-xs font-light text-gray-500">Votre inventaire est vide.</p>
        </div>
      )}
    </section>
  );

}
