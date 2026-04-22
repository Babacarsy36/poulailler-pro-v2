import { useEffect, useState } from "react";
import { Plus, Minus, ShoppingCart, Calendar, History, Package, Info, ArrowRight, CheckCircle, ThermometerSun, ThermometerSnowflake, Thermometer, Edit2, FlaskConical, Calculator } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Chicken } from "../types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface FeedEntry {
  id: string;
  date: string;
  type: "achat" | "utilisation";
  quantity: number;
  feedType: string;
  temperature?: number;
  notes: string;
  poultryType?: string;
  poultryBreed?: string;
  updatedAt?: number;
  [key: string]: string | number | undefined;
}

interface FeedFormData {
  date: string;
  type: "achat" | "utilisation";
  quantity: string;
  feedType: string;
  temperature: string;
  notes: string;
  poultryType: string;
  breed: string;
  totalPrice?: string;
}

interface Ingredient {
  id: string;
  name: string;
  protein: number;
  percentage: number;
}

interface FeedRecipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  totalProtein: number;
}

type FeedPhase = {
  name: string;
  duration: [number, number]; // [startDay, endDay]
  description: string;
  consumption: string;
};

const getPhasesForBreed = (breed: string): FeedPhase[] => {
  if (breed === 'Pondeuse') {
    return [
      { name: "Démarrage", duration: [1, 28], description: "Aliment riche en protéines (20-22%) en miettes.", consumption: "15g à 30g par oiseau/jour" },
      { name: "Poulette (Croissance)", duration: [29, 126], description: "Baisse progressive des protéines (16%).", consumption: "40g à 80g par oiseau/jour" },
      { name: "Ponte", duration: [127, 999], description: "Aliment enrichi en Calcium (3-4%) pour la coquille.", consumption: "110g à 120g par oiseau/jour" }
    ];
  }
  if (breed === 'Caille') {
    return [
      { name: "Démarrage", duration: [1, 14], description: "Aliment très riche en protéines (24-28%).", consumption: "5g à 10g par caille/jour" },
      { name: "Croissance", duration: [15, 42], description: "Transition vers aliment adulte (20%).", consumption: "15g à 20g par caille/jour" },
      { name: "Ponte / Engraissement", duration: [43, 999], description: "Aliment ponte riche en minéraux.", consumption: "25g à 30g par caille/jour" }
    ];
  }
  if (breed === 'Poulet Fermier' || breed === 'Poule d\'Ornement' || breed === 'Goliath' || breed === 'Brahma' || breed === 'Cochin') {
    return [
      { name: "Démarrage", duration: [1, 28], description: "Aliment Démarrage Chair (20-22%).", consumption: "20g à 40g par oiseau/jour" },
      { name: "Croissance", duration: [29, 60], description: "Aliment Croissance Chair (18%).", consumption: "50g à 100g par oiseau/jour" },
      { name: "Finition", duration: [61, 999], description: "Aliment Finition (Énergie élevée).", consumption: "120g à 160g par oiseau/jour" }
    ];
  }
  // Default: Chair / Rainbow
  return [
    { name: "Démarrage", duration: [1, 21], description: "Aliment Démarrage (très riche).", consumption: "30g à 60g par oiseau/jour" },
    { name: "Croissance", duration: [22, 35], description: "Aliment Croissance.", consumption: "80g à 120g par oiseau/jour" },
    { name: "Finition", duration: [36, 999], description: "Aliment Finition (Énergie max).", consumption: "150g à 180g par oiseau/jour" }
  ];
};

export function FeedManagement() {
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, saveData } = useAuth();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [allChickens, setAllChickens] = useState<Chicken[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FeedFormData>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "achat",
      quantity: "",
      feedType: "",
      temperature: "28",
      notes: "",
      breed: selectedBreeds[0] || "",
      poultryType: activeSpeciesFilter === 'all' ? 'poulet' : activeSpeciesFilter,
    }
  });

  const entryFormData = watch();

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Maïs', protein: 9, percentage: 60 },
    { id: '2', name: 'Tourteau de Soja', protein: 44, percentage: 30 },
    { id: '3', name: 'Concentré/CMV', protein: 40, percentage: 10 }
  ]);
  const [savedRecipes, setSavedRecipes] = useState<FeedRecipe[]>([]);
  const [recipeName, setRecipeName] = useState("");

  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBreed, setSelectedBreed] = useState("Poulet de chair");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [weather, setWeather] = useState<"normal" | "hot" | "cold">("normal");

  const [calcGoal, setCalcGoal] = useState<string>("Poulet de chair Démarrage (Concentré 10%)");
  const [calcAmount, setCalcAmount] = useState<number>(50);
  const [chickCount, setChickCount] = useState<number>(100);

  const STANDARD_RECIPES: Record<string, { type: string, ingredients: {name: string, pct: number, isProt?: boolean}[] }> = {
    "Poulet de chair Démarrage (Concentré 10%)": {
       type: "Chair",
       ingredients: [
         { name: "Maïs", pct: 56 },
         { name: "Soja", pct: 29, isProt: true },
         { name: "Son de Blé", pct: 5 },
         { name: "Concentré 10%", pct: 10 }
       ]
    },
    "Poulet de chair Croissance (Concentré 10%)": {
       type: "Chair",
       ingredients: [
         { name: "Maïs", pct: 61 },
         { name: "Soja", pct: 26, isProt: true },
         { name: "Son de Blé", pct: 3 },
         { name: "Concentré 10%", pct: 10 }
       ]
    },
    "Poulet de chair Finition (Concentré 10%)": {
       type: "Chair",
       ingredients: [
         { name: "Maïs", pct: 62 },
         { name: "Soja", pct: 25, isProt: true },
         { name: "Son de Blé", pct: 3 },
         { name: "Concentré 10%", pct: 10 }
       ]
    },
    "Pondeuse Démarrage (Ponte 5%)": {
       type: "Ponte",
       ingredients: [
         { name: "Maïs", pct: 56 },
         { name: "Soja", pct: 22, isProt: true },
         { name: "Tourteau arachide", pct: 7, isProt: true },
         { name: "Son de blé", pct: 5 },
         { name: "Farine de poisson", pct: 4, isProt: true },
         { name: "CMAV 5%", pct: 5 },
         { name: "Carbonate Ca", pct: 1 }
       ]
    },
    "Pondeuse Phase Poulette (Ponte 5%)": {
       type: "Ponte",
       ingredients: [
         { name: "Maïs", pct: 59 },
         { name: "Soja", pct: 16, isProt: true },
         { name: "Tourteau arachide", pct: 7, isProt: true },
         { name: "Son de blé", pct: 8 },
         { name: "Farine de poisson", pct: 2, isProt: true },
         { name: "CMAV 5%", pct: 5 },
         { name: "Carbonate Ca", pct: 3 }
       ]
    },
    "Pondeuse Pré-Ponte (Ponte 5%)": {
       type: "Ponte",
       ingredients: [
         { name: "Maïs", pct: 57 },
         { name: "Soja", pct: 15, isProt: true },
         { name: "Tourteau arachide", pct: 7, isProt: true },
         { name: "Son de blé", pct: 6 },
         { name: "Farine de poisson", pct: 2, isProt: true },
         { name: "CMAV 5%", pct: 5 },
         { name: "Carbonate Ca", pct: 8 }
       ]
    },
    "Pondeuse Ponte (Ponte 5%)": {
       type: "Ponte",
       ingredients: [
         { name: "Maïs", pct: 59 },
         { name: "Soja", pct: 14, isProt: true },
         { name: "Tourteau arachide", pct: 7, isProt: true },
         { name: "Son de blé", pct: 4 },
         { name: "Farine de poisson", pct: 2, isProt: true },
         { name: "CMAV 5%", pct: 5 },
         { name: "Carbonate Ca", pct: 9 }
       ]
    },
    "Poulet Brahma herminé en ponte": {
       type: "Ponte",
       ingredients: [
         { name: "Maïs concassé", pct: 50 },
         { name: "Tourteau (Soja/Arachide)", pct: 25, isProt: true },
         { name: "Son de blé (Fibre)", pct: 15 },
         { name: "Coquillage (Calcium)", pct: 8 },
         { name: "CMV / Minéraux purs", pct: 2 }
       ]
    },
    "Poulet Goliath adulte en ponte": {
       type: "Ponte",
       ingredients: [
         { name: "Maïs concassé", pct: 55 },
         { name: "Tourteau (Soja/Arachide)", pct: 25, isProt: true },
         { name: "Son de blé / Mil", pct: 10 },
         { name: "Coquillage (Calcium)", pct: 8 },
         { name: "CMV / Minéraux purs", pct: 2 }
       ]
    }
  };

  useEffect(() => {
    if (activeSpeciesFilter === 'caille') {
      setSelectedBreed('Caille');
    } else if (selectedBreeds.length > 0) {
      const breedMap: Record<string, string> = {
        fermier: 'Poulet Fermier',
        ornement: 'Poule d\'Ornement',
        pondeuse: 'Pondeuse',
        chair: 'Poulet de chair'
      };
      setSelectedBreed(breedMap[selectedBreeds[0]] || 'Poulet de chair');
    }
  }, [activeSpeciesFilter, selectedBreeds]);

  const adjustConsumption = (text: string, currentWeather: "normal" | "hot" | "cold") => {
    if (currentWeather === "normal") return text;
    const factor = currentWeather === "hot" ? 0.85 : 1.15; // -15% hot, +15% cold
    return text.replace(/\d+/g, (match) => {
       return Math.round(parseInt(match) * factor).toString();
    });
  };

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : isCaille ? 'emerald' : 'orange';
  const customColors = {
     bgLight: isCaille ? 'bg-emerald-50' : 'bg-orange-50',
     textDark: isCaille ? 'text-emerald-700' : 'text-orange-700',
     border: isCaille ? 'border-emerald-100' : 'border-orange-100',
     bgBtn: `bg-${accentColorClass}-500 hover:bg-${accentColorClass}-600`,
  }

  useEffect(() => {
    const saved = StorageService.getItem<FeedEntry[]>("feed");
    if (saved) {
      setEntries(saved);
    }
    const savedChickens = StorageService.getItem<Chicken[]>("chickens");
    if (savedChickens) {
      setAllChickens(savedChickens);
    }
    const savedRecipes = StorageService.getItem<FeedRecipe[]>("feed_recipes");
    if (savedRecipes) setSavedRecipes(savedRecipes);
  }, [syncTrigger]);

  const saveEntries = (newEntries: FeedEntry[]) => {
    setEntries(newEntries);
    saveData("feed", newEntries);
  };

  const handleSaveRecipe = () => {
    if (!recipeName) return;
    const totalProt = ingredients.reduce((acc, ing) => acc + (ing.protein * ing.percentage) / 100, 0);
    const newRecipe: FeedRecipe = {
      id: Date.now().toString(),
      name: recipeName,
      ingredients: [...ingredients],
      totalProtein: totalProt
    };
    const updated = [newRecipe, ...savedRecipes];
    setSavedRecipes(updated);
    StorageService.setItem("feed_recipes", updated);
    setRecipeName("");
    toast.success("Recette enregistrée !");
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const onEntrySubmit = (data: FeedFormData & { breed: string }) => {
    const now = Date.now();
    const newEntry: FeedEntry = {
      id: now.toString(),
      ...data,
      quantity: Number(data.quantity),
      temperature: data.temperature ? Number(data.temperature) : undefined,
      poultryType: 'global',
      poultryBreed: 'global',
      updatedAt: now
    };
    saveEntries([newEntry, ...entries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // AUTOMATIC FINANCE INTEGRATION
    if (data.type === 'achat' && data.totalPrice && Number(data.totalPrice) > 0) {
      const finances = StorageService.getItem<any[]>("finances") || [];
      const newTransaction = {
        id: `feed_${now}`,
        type: 'expense',
        amount: Number(data.totalPrice),
        category: "Alimentation",
        description: `Achat ${data.quantity}kg ${data.feedType}`,
        date: data.date,
        poultryType: newEntry.poultryType,
        poultryBreed: newEntry.poultryBreed,
        updatedAt: now
      };
      saveData("finances", [newTransaction, ...finances]);
    }

    reset({
      date: new Date().toISOString().split("T")[0],
      type: "achat",
      quantity: "",
      feedType: "",
      temperature: "28",
      notes: "",
      breed: selectedBreeds[0] || "",
      totalPrice: "",
    });
    setIsAddOpen(false);
  };

  // Alimentation globale (toutes races confondues)
  const filteredEntries = entries.filter(e => !e._deleted);

  const totalFeed = filteredEntries.reduce((sum, entry) => {
    return sum + (entry.type === "achat" ? entry.quantity : -entry.quantity);
  }, 0);

  // Consumption Calculation Engine (GLOBAL)
  const calculateDailyConsumption = () => {
    let dailyTotalKg = 0;
    allChickens.filter(c => !c._deleted && c.status === 'active').forEach(c => {
          const breed = c.breed || (c.poultryType === 'caille' ? 'Caille' : 'Poulet de chair');
          const phases = getPhasesForBreed(breed);
          
          const arrDate = new Date(c.arrivalDate || c.startDate || c.date || Date.now());
          const ageDays = Math.ceil(Math.abs(Date.now() - arrDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          let phase = phases.find(p => ageDays >= p.duration[0] && ageDays <= p.duration[1]);
          if(!phase) phase = phases[phases.length - 1];

          const matches = phase.consumption.match(/\d+/g);
          if (matches) {
            const avgGrams = matches.length === 2 
              ? (parseInt(matches[0]) + parseInt(matches[1])) / 2 
              : parseInt(matches[0]);
            const weatherFactor = weather === 'hot' ? 0.85 : weather === 'cold' ? 1.15 : 1.0;
            const count = Number(c.count) || 1;
            dailyTotalKg += (avgGrams * count * weatherFactor) / 1000;
          }
    });

    return dailyTotalKg;
  };

  const dailyConsumption = calculateDailyConsumption();
  const autonomyDays = dailyConsumption > 0 ? Math.floor(totalFeed / dailyConsumption) : Infinity;
  const autonomyColor = autonomyDays > 7 ? 'text-emerald-500' : autonomyDays > 3 ? 'text-orange-500' : 'text-red-500';

  const chartData = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dStr = d.toISOString().split('T')[0];
    const consumed = filteredEntries
      .filter(e => e.date === dStr && e.type === "utilisation")
      .reduce((sum, e) => sum + e.quantity, 0);
    return {
      name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      consommation: consumed
    };
  });

  const phases = getPhasesForBreed(selectedBreed);
  const currentDate = new Date();
  const arrDate = new Date(arrivalDate);
  const diffTime = Math.abs(currentDate.getTime() - arrDate.getTime());
  const currentAgeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let currentPhaseIndex = phases.findIndex(p => currentAgeDays >= p.duration[0] && currentAgeDays <= p.duration[1]);
  if(currentPhaseIndex === -1 && currentAgeDays > 0) currentPhaseIndex = phases.length - 1;

  const activePhaseToExpand = expandedPhase !== null ? expandedPhase : currentPhaseIndex;

  return (
    <section id="screen-feed" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-['Syne'] text-xl font-semibold text-gray-900 tracking-tight">Alimentation</h1>
          <p className="text-xs font-light text-gray-500 mt-1">Stock & programme nutritionnel</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className={`h-10 px-3 rounded-xl ${customColors.bgBtn} text-white flex items-center justify-center shadow-md transition-colors no-print outline-none`}
        >
          <iconify-icon icon="solar:add-circle-linear" class="text-xl sm:mr-2"></iconify-icon>
          <span className="font-medium text-sm hidden sm:inline">Opération</span>
        </button>
      </div>

      {/* Stock KPI */}
      <div className={`clean-card rounded-2xl p-4 border-l-4 ${totalFeed < 10 ? 'border-l-red-500' : autonomyDays <= 3 ? 'border-l-orange-500' : 'border-l-emerald-500'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-1">Stock Actuel</p>
            <p className={`font-['JetBrains_Mono'] text-3xl font-medium ${totalFeed < 10 ? 'text-red-500' : 'text-gray-900'}`}>
              {totalFeed.toFixed(1)} <span className="text-base text-gray-400 font-normal">kg</span>
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${customColors.bgLight}`}>
            <iconify-icon icon="solar:box-linear" stroke-width="1.5" class={`text-2xl ${customColors.textDark}`}></iconify-icon>
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase mb-0.5">Conso. / jour</p>
            <p className="font-['JetBrains_Mono'] text-sm font-medium text-gray-900">{dailyConsumption.toFixed(2)} kg</p>
          </div>
          <div className="w-px bg-gray-100"></div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase mb-0.5">Autonomie</p>
            <p className={`font-['JetBrains_Mono'] text-sm font-medium ${autonomyColor}`}>
              {autonomyDays === Infinity ? 'Non calculé' : `${autonomyDays} jours`}
            </p>
          </div>
        </div>
        {autonomyDays <= 3 && dailyConsumption > 0 && (
          <div className="mt-3 p-2 bg-red-50 rounded-xl border-l-2 border-l-red-500 flex items-center gap-2">
            <iconify-icon icon="solar:danger-triangle-linear" class="text-red-500 text-base"></iconify-icon>
            <p className="text-[10px] font-medium text-red-700">Rupture imminente — {new Date(Date.now() + autonomyDays * 86400000).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
         <div className="space-y-6">
           {/* placeholder div for visual consistency */}

           {/* Nutritional Phase Generator */}
           <div className="clean-card rounded-3xl p-5">
             <div className="flex items-center gap-3 mb-6">
                 <div className={`p-3 rounded-xl ${customColors.bgLight} ${customColors.textDark}`}>
                    <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-babs-brown uppercase tracking-wider">Phase du Lot</h3>
                   <p className="text-[10px] uppercase font-bold text-gray-400">Programme Alimentaire</p>
                 </div>
             </div>

             <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Souche Elevée</label>
                  <select 
                    className={`w-full ${customColors.bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown appearance-none mt-1 outline-none`}
                    value={selectedBreed}
                    onChange={(e) => setSelectedBreed(e.target.value)}
                  >
                    <option value="Poulet de chair">Poulet de chair / Rainbow</option>
                    <option value="Pondeuse">Pondeuse</option>
                    <option value="Poulet Fermier">Poulet Fermier</option>
                    <option value="Poule d'Ornement">Poule d'Ornement</option>
                    <option value="Caille">Caille</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Date d'arrivée</label>
                  <input 
                    type="date"
                    className={`w-full ${customColors.bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown mt-1 outline-none`}
                    value={arrivalDate}
                    onChange={e => setArrivalDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                    <Thermometer className="w-3 h-3"/> Météo
                  </label>
                  <select 
                    className={`w-full ${customColors.bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown mt-1 outline-none appearance-none cursor-pointer`}
                    value={weather}
                    onChange={e => setWeather(e.target.value as "normal" | "hot" | "cold")}
                  >
                    <option value="normal">Tempérée (Normale)</option>
                    <option value="hot">Forte Chaleur (Canicule) ☀️</option>
                    <option value="cold">Fraîcheur (Froid/Pluie) ❄️</option>
                  </select>
                </div>
             </div>

             {/* Current Phase Highlight */}
             <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Âge estimé du lot</p>
                <p className="text-2xl font-black text-babs-brown mb-2">{currentAgeDays} jours</p>
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3 shadow-sm">
                   <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                   <div>
                     <p className="font-black text-blue-700 uppercase text-xs tracking-wider">{phases[currentPhaseIndex]?.name}</p>
                     <p className="text-[10px] text-gray-500 font-bold mt-1 leading-relaxed">{phases[currentPhaseIndex]?.description}</p>
                   </div>
                </div>
             </div>

             {/* Timeline Mini */}
             <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-2">Cycle complet (Cliquez pour détails)</p>
                {phases.map((p, i) => {
                   const isExpanded = activePhaseToExpand === i;
                   return (
                     <div key={i} className={`flex flex-col p-4 rounded-3xl transition-all cursor-pointer border ${isExpanded ? 'bg-orange-50 border-orange-100 shadow-md scale-[1.02]' : 'bg-transparent border-transparent hover:bg-gray-50'}`} onClick={() => setExpandedPhase(isExpanded ? null : i)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${i === currentPhaseIndex ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : (i < currentPhaseIndex ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400')}`}>
                                {i < currentPhaseIndex ? <CheckCircle className="w-4 h-4"/> : i + 1}
                             </div>
                             <span className={`font-black text-sm ${i === currentPhaseIndex ? 'text-orange-700' : 'text-babs-brown'}`}>{p.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100">J{p.duration[0]}-J{p.duration[1]===999?'∞':p.duration[1]}</span>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-orange-100/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-start gap-2">
                               <Info className="w-4 h-4 text-orange-400 mt-0.5" />
                               <p className="text-xs text-orange-800 font-bold leading-relaxed">{p.description}</p>
                             </div>
                             <div className="flex items-start gap-2 bg-white/60 p-3 rounded-xl border border-orange-50">
                               {weather === "hot" ? <ThermometerSun className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> : 
                                weather === "cold" ? <ThermometerSnowflake className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> :
                                <Package className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />}
                               <div>
                                 <p className="text-xs text-orange-800 font-black">Consommation : <span className="font-bold">{adjustConsumption(p.consumption, weather)}</span></p>
                                 {weather === "hot" && <p className="text-[10px] text-red-600 font-bold mt-1.5 leading-tight">☀️ Stress Thermique: Baisse d'appétit de ~15%. Nourrissez à la fraîche (très tôt ou tard). Vitamine C d'urgence dans l'eau.</p>}
                                 {weather === "cold" && <p className="text-[10px] text-blue-600 font-bold mt-1.5 leading-tight">❄️ Climat Frais: Appétit en hausse de ~15% pour se réchauffer. Gardez la litière bien sèche et évitez les courants d'air.</p>}
                               </div>
                             </div>
                          </div>
                        )}
                     </div>
                   );
                })}
             </div>
           </div>

           {/* Feed Calculator (Standard) */}
           <div className="clean-card rounded-3xl p-5 border-l-4 border-l-orange-500">
             <div className="absolute top-0 right-0 p-4 opacity-5 bg-babs-orange rounded-bl-[4rem]">
                 <Calculator className="w-24 h-24 text-babs-orange" />
             </div>
             <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                    <FlaskConical className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-babs-brown uppercase tracking-wider">Formulation Maison</h3>
                   <p className="text-[10px] uppercase font-bold text-gray-400">Calculez vos propres mélanges</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 block mb-1">Objectif Elevage</label>
                  <select 
                    className="w-full bg-gray-50 border border-transparent focus:border-orange-200 rounded-2xl p-4 font-bold text-babs-brown appearance-none outline-none transition-colors"
                    value={calcGoal}
                    onChange={(e) => setCalcGoal(e.target.value)}
                  >
                    {Object.keys(STANDARD_RECIPES)
                      .filter(k => k !== "Lapin" && k !== "Pigeon")
                      .map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 block mb-1">Quantité (kg)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-transparent focus:border-orange-200 rounded-2xl p-4 font-bold text-babs-brown outline-none transition-colors"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value)))}
                  />
                </div>
             </div>

             <div className="bg-orange-50 rounded-2xl p-6 relative z-10">
                <p className="text-xs font-black text-orange-800 uppercase tracking-widest mb-4 flex justify-between">
                   Recette pour {calcAmount} kilos
                   <span>🎯 {STANDARD_RECIPES[calcGoal].type}</span>
                </p>
                <div className="space-y-2">
                   {STANDARD_RECIPES[calcGoal].ingredients.map((ing, i) => {
                      const kg = (ing.pct * calcAmount) / 100;
                      return (
                         <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                            <span className="text-sm font-bold text-babs-brown flex items-center gap-2">
                               {ing.isProt && <span className="w-2 h-2 rounded-full bg-purple-500 line-block" title="Source Protéique principale"/>}
                               {!ing.isProt && <span className="w-2 h-2 rounded-full bg-orange-400 line-block" title="Énergie / Apport standard"/>}
                               {ing.name}
                            </span>
                            <div className="text-right">
                               <p className="text-sm font-black text-orange-600">{kg.toFixed(1)} <span className="text-[10px]">kg</span></p>
                               <p className="text-[9px] font-bold text-gray-400">{ing.pct}%</p>
                            </div>
                         </div>
                      )
                   })}
                </div>

                {/* NEW: Chick Feeding Guide & Calculator */}
                <div className={`clean-card rounded-3xl p-6 border-l-4 overflow-hidden relative mt-6 ${isCaille ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <iconify-icon icon={isCaille ? 'ph:egg-bold' : 'solar:bird-bold'} className={`text-8xl ${isCaille ? 'text-emerald-500' : 'text-amber-500'}`}></iconify-icon>
                   </div>
                   
                   <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl ${isCaille ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                         <iconify-icon icon="solar:star-fall-2-bold-duotone" className="text-xl"></iconify-icon>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-babs-brown uppercase tracking-wider">
                          Guide de Ration {isCaille ? 'Cailleteau' : 'Poussin'}
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Progression Semaine 1 à 8</p>
                      </div>
                   </div>

                   <div className="mb-8">
                      <div className={`flex items-center gap-4 p-4 rounded-2xl border mb-6 ${isCaille ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-amber-50/50 border-amber-100/50'}`}>
                         <div className="flex-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isCaille ? 'text-emerald-800' : 'text-amber-800'}`}>
                              Nombre de {isCaille ? 'Cailles' : 'Poussins'}
                            </label>
                            <div className="relative">
                               <input 
                                  type="number"
                                  className={`w-full bg-white border rounded-xl p-3 font-black outline-none transition-all ${isCaille ? 'border-emerald-200 text-emerald-900 focus:ring-emerald-500/20' : 'border-amber-200 text-amber-900 focus:ring-amber-500/20'}`}
                                  value={chickCount}
                                  onChange={(e) => setChickCount(Math.max(0, Number(e.target.value)))}
                               />
                               <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase ${isCaille ? 'text-emerald-500' : 'text-amber-500'}`}>unités</span>
                            </div>
                         </div>
                         <div className={`w-px h-10 hidden sm:block ${isCaille ? 'bg-emerald-200/50' : 'bg-amber-200/50'}`}></div>
                         <div className="flex-1 hidden sm:block">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCaille ? 'text-emerald-800' : 'text-amber-800'}`}>Impact</p>
                            <p className={`text-xs font-medium leading-tight ${isCaille ? 'text-emerald-600' : 'text-amber-600'}`}>Calculez précisément les besoins de votre lot en croissance.</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                         {(isCaille 
                           ? [
                               { w: 1, age: "0-7j", r: 4 },
                               { w: 2, age: "8-14j", r: 7 },
                               { w: 3, age: "15-21j", r: 11 },
                               { w: 4, age: "22-28j", r: 15 },
                               { w: 5, age: "29-35j", r: 19 },
                               { w: 6, age: "36-42j", r: 23 },
                               { w: 7, age: "43-49j", r: 27 },
                               { w: 8, age: "50-56j", r: 30 },
                             ]
                           : [
                               { w: 1, age: "0-7j", r: 16 },
                               { w: 2, age: "8-14j", r: 21 },
                               { w: 3, age: "15-21j", r: 26 },
                               { w: 4, age: "22-28j", r: 31 },
                               { w: 5, age: "29-35j", r: 36 },
                               { w: 6, age: "36-42j", r: 41 },
                               { w: 7, age: "43-49j", r: 46 },
                               { w: 8, age: "50-56j", r: 51 },
                             ]
                         ).map((item) => {
                            const dailyTotal = (item.r * chickCount) / 1000;
                            const weeklyTotal = dailyTotal * 7;
                            return (
                               <div key={item.w} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                  <div className="flex justify-between items-start mb-3">
                                     <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Semaine {item.w}</p>
                                        <p className="text-xs font-bold text-babs-brown">{item.age}</p>
                                     </div>
                                     <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${isCaille ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.r} g/j
                                     </div>
                                  </div>
                                  
                                  <div className="space-y-1.5 border-t border-gray-50 pt-3">
                                     <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 font-medium italic">Besoin/Jour :</span>
                                        <span className={`font-black ${isCaille ? 'text-emerald-600' : 'text-amber-600'}`}>{dailyTotal.toFixed(2)} kg</span>
                                     </div>
                                     <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 font-medium italic">Besoin/Semaine :</span>
                                        <span className={`font-black ${isCaille ? 'text-emerald-800' : 'text-amber-800'}`}>{weeklyTotal.toFixed(1)} kg</span>
                                     </div>
                                  </div>

                                  <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-tl-full flex items-center justify-center translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform ${isCaille ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}>
                                     <iconify-icon icon="solar:check-circle-bold" className={`text-xs ${isCaille ? 'text-emerald-500' : 'text-amber-500'}`}></iconify-icon>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>

                   <div className={`p-4 rounded-2xl flex items-start gap-4 border ${isCaille ? 'bg-emerald-600/5 border-emerald-600/10' : 'bg-amber-600/5 border-amber-600/10'}`}>
                      <iconify-icon icon="solar:info-circle-bold-duotone" className={`text-2xl mt-1 ${isCaille ? 'text-emerald-600' : 'text-amber-600'}`}></iconify-icon>
                      <div>
                         <p className={`text-sm font-black leading-tight mb-1 ${isCaille ? 'text-emerald-900' : 'text-amber-900'}`}>Pourquoi ces ratios ?</p>
                         <p className={`text-xs font-medium leading-relaxed ${isCaille ? 'text-emerald-700/80' : 'text-amber-700/80'}`}>
                            Ce tableau suit la courbe de croissance optimale pour une conversion alimentaire efficace. 
                            Veillez à ajuster de +10% en cas de froid intense ou de -10% en cas de forte chaleur persistante.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="mt-4 pt-4 border-t border-orange-200 flex justify-between items-center px-2">
                   <span className="text-xs font-black text-orange-800 uppercase">Total Mélange</span>
                   <span className="text-xl font-black text-orange-600">{calcAmount} <span className="text-xs">kg</span></span>
                </div>
                </div>
           </div>

           {/* Feed Optimizer (Mixer) */}
           <div className="clean-card rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                     <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-babs-brown uppercase tracking-wider">Optimiseur de Ration</h3>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Équilibrez vos propres mélanges</p>
                  </div>
              </div>

              <div className="space-y-4 mb-8">
                 {ingredients.map((ing, idx) => (
                    <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                       <div className="col-span-5">
                          <input 
                            className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs font-bold text-babs-brown outline-none"
                            value={ing.name}
                            onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                          />
                       </div>
                       <div className="col-span-3 flex items-center gap-1">
                          <input 
                            type="number"
                            className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs font-black text-babs-brown outline-none text-center"
                            value={ing.percentage}
                            onChange={(e) => updateIngredient(ing.id, 'percentage', Number(e.target.value))}
                          />
                          <span className="text-[10px] font-black text-gray-400">%</span>
                       </div>
                       <div className="col-span-3 flex items-center gap-1">
                          <input 
                            type="number"
                            className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs font-black text-babs-brown outline-none text-center"
                            value={ing.protein}
                            onChange={(e) => updateIngredient(ing.id, 'protein', Number(e.target.value))}
                          />
                          <span className="text-[10px] font-black text-gray-400">P</span>
                       </div>
                       <div className="col-span-1 flex justify-end">
                          <button 
                            onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                            className="text-red-300 hover:text-red-500 transition-colors"
                          >
                             <Minus className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 ))}
                 
                 <button 
                   onClick={() => setIngredients([...ingredients, { id: Date.now().toString(), name: "Nouvel ingrédient", protein: 10, percentage: 0 }])}
                   className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:border-purple-200 hover:text-purple-400 transition-all"
                 >
                   + Ajouter un ingrédient
                 </button>
              </div>

              {/* Mix Analysis */}
              {(() => {
                const totalPercent = ingredients.reduce((acc, ing) => acc + ing.percentage, 0);
                const totalProt = ingredients.reduce((acc, ing) => acc + (ing.protein * ing.percentage) / 100, 0);
                const targetMatch = currentPhaseIndex !== -1 ? (
                   phases[currentPhaseIndex].name === 'Démarrage' ? 21 :
                   phases[currentPhaseIndex].name === 'Ponte' ? 17.5 : 18
                ) : 18;
                const isAcceptable = Math.abs(totalProt - targetMatch) <= 1.5;

                return (
                   <div className="p-6 rounded-[2rem] bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center justify-between mb-4">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Taux de Protéines Final</p>
                            <p className={`text-4xl font-black ${isAcceptable ? 'text-emerald-600' : 'text-purple-700'}`}>
                               {totalProt.toFixed(1)}%
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total Mélange</p>
                            <p className={`text-xl font-black ${totalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                               {totalPercent}%
                            </p>
                         </div>
                      </div>

                      {totalPercent === 100 ? (
                         <div className={`p-4 rounded-2xl flex items-start gap-3 border ${isAcceptable ? 'bg-emerald-100/50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                            <Info className="w-5 h-5 mt-0.5" />
                            <div>
                               <p className="text-xs font-black uppercase tracking-tight">
                                  {isAcceptable ? "Équilibre Optimal ✅" : "Déséquilibre Nutritionnel ❌"}
                                </p>
                               <p className="text-[10px] font-bold mt-1 opacity-70">
                                  Cible : {targetMatch}% pour la phase {phases[currentPhaseIndex]?.name}. {isAcceptable ? "Parfait pour la croissance !" : "Ajustez vos pourcentages."}
                               </p>
                            </div>
                         </div>
                      ) : (
                         <p className="text-[10px] font-bold text-red-500 italic text-center">La somme des pourcentages doit être égale à 100%.</p>
                      )}

                      {totalPercent === 100 && (
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                           <input 
                             placeholder="Nom de la recette..."
                             className="w-full sm:flex-1 bg-white border border-purple-100 rounded-xl px-4 py-2 text-xs font-bold text-babs-brown outline-none"
                             value={recipeName}
                             onChange={(e) => setRecipeName(e.target.value)}
                           />
                           <button 
                             onClick={handleSaveRecipe}
                             className="w-full sm:w-auto bg-purple-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-purple-100 hover:scale-105 transition-all whitespace-nowrap"
                           >
                              Enregistrer
                           </button>
                        </div>
                      )}
                   </div>
                );
              })()}

              {/* Saved Recipes */}
              {savedRecipes.length > 0 && (
                <div className="mt-8 space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Recettes Enregistrées</p>
                   {savedRecipes.map(recipe => (
                      <div key={recipe.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group">
                         <div>
                            <p className="text-xs font-black text-babs-brown">{recipe.name}</p>
                            <p className="text-[10px] font-bold text-purple-500 uppercase">{recipe.totalProtein.toFixed(1)}% Protéines</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                               onClick={() => setIngredients(recipe.ingredients)}
                               className="bg-white p-2 rounded-lg shadow-sm text-purple-600 hover:bg-purple-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                               <ArrowRight className="w-4 h-4" />
                            </button>
                            <button 
                               onClick={() => {
                                 const updated = savedRecipes.filter(r => r.id !== recipe.id);
                                 setSavedRecipes(updated);
                                 StorageService.setItem("feed_recipes", updated);
                               }}
                               className="bg-white p-2 rounded-lg shadow-sm text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-black text-xs"
                            >
                               Suppr
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>
         </div>

         {/* Graphique de Consommation */}
         <div className="clean-card rounded-3xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <iconify-icon icon="solar:chart-square-linear" class="text-xl text-gray-400"></iconify-icon>
                <h3 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Consommation (14 jrs)</h3>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isCaille ? "#10B981" : "#F59E0B"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isCaille ? "#10B981" : "#F59E0B"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6B7280', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="consommation" stroke={isCaille ? "#10B981" : "#F59E0B"} strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* History */}
         <div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <iconify-icon icon="solar:history-linear" class="text-xl text-gray-400"></iconify-icon>
                <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Historique de Mouvements</h2>
              </div>
              
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                   <div key={entry.id} className="clean-card rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center transition-transform ${
                        entry.type === 'achat' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600 group-hover:-rotate-6'
                      }`}>
                        {entry.type === 'achat' ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-black text-babs-brown text-sm">
                          {entry.type === 'achat' ? 'Achat/Entrée' : 'Ration/Sortie'} • <span className="text-gray-500">{entry.feedType}</span>
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mr-2 inline">
                          {new Date(entry.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {entry.temperature && (
                          <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-lg font-bold mr-2">
                             <iconify-icon icon="solar:thermometer-linear" class="text-[10px] inline-block mr-0.5"></iconify-icon>
                             {entry.temperature}°C
                          </span>
                        )}
                        {entry.notes && <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-medium">{entry.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xl font-black ${entry.type === 'achat' ? 'text-emerald-500' : 'text-orange-500'}`}>
                         {entry.type === 'achat' ? '+' : '-'}{entry.quantity} <span className="text-sm">kg</span>
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            const val = window.prompt(`Nouvelle quantité (kg) pour ${entry.feedType} :`, entry.quantity.toString());
                            if (val && !isNaN(parseFloat(val))) {
                              const newEntries = entries.map(e => e.id === entry.id ? { ...e, quantity: parseFloat(val), updatedAt: Date.now() } : e);
                              saveEntries(newEntries);
                              toast.success("Quantité modifiée");
                            }
                          }}
                          className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Modifier la quantité"
                        >
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Supprimer cette opération ?")) {
                              saveEntries(entries.map(e => e.id === entry.id ? { ...e, _deleted: true, updatedAt: Date.now() } : e));
                              toast.success("Opération supprimée");
                            }
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Supprimer l'opération"
                        >
                           <Minus className="w-4 h-4 transform rotate-45" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEntries.length === 0 && (
                   <div className="clean-card rounded-3xl py-16 text-center border-dashed border-gray-200">
                     <iconify-icon icon="solar:box-line-duotone" class="text-4xl text-gray-300 mb-2 block"></iconify-icon>
                     <p className="text-xs font-light text-gray-500">Aucun mouvement enregistré.</p>
                   </div>
                 )}
              </div>
            </div>
         </div>
         </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="font-['Syne'] text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Nouvelle Opération</h3>
            <form onSubmit={handleSubmit(onEntrySubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Date</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400" {...register("date", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Action</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400" {...register("type")}>
                    <option value="achat">📦 Achat de stock</option>
                    <option value="utilisation">🍴 Utilisation / Service</option>
                  </select>
                </div>
              </div>



              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantité (kg)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 ${errors.quantity ? 'ring-2 ring-red-500' : ''}`}
                    {...register("quantity", { required: "Quantité requise", min: 0.1 })}
                  />
                  {errors.quantity && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.quantity.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aliment</label>
                  <input 
                    className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 ${errors.feedType ? 'ring-2 ring-red-500' : ''}`}
                    placeholder="Ex: Démarrage, Pondeuse..."
                    list="feed-types-list"
                    {...register("feedType", { required: "Type d'aliment requis" })}
                  />
                  <datalist id="feed-types-list">
                    <option value="Démarrage" />
                    <option value="Croissance" />
                    <option value="Pondeuse" />
                    <option value="Mélange Maison" />
                  </datalist>
                  {errors.feedType && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.feedType.message}</p>}
                </div>
              </div>

              {watch("type") === 'achat' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Prix Total de l'achat (FCFA)</label>
                    <div className="relative">
                        <input 
                            type="number"
                            className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                            placeholder="Ex: 15000 (Saisie auto en Finance)"
                            {...register("totalPrice")}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">FCFA</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium px-2 italic">Si renseigné, cette dépense sera ajoutée automatiquement à vos finances.</p>
                </div>
              )}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Température Ambiante (°C)</label>
                 <div className="flex bg-gray-50 border-none rounded-2xl p-1 items-stretch focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                    <input 
                      type="number"
                      className="flex-1 bg-transparent border-none p-4 font-bold text-babs-brown outline-none text-center"
                      placeholder="Ex: 28"
                      {...register("temperature")}
                    />
                    <div className="w-12 flex items-center justify-center bg-orange-100 text-orange-600 rounded-xl mr-1 my-1">
                       <Thermometer className="w-5 h-5" />
                    </div>
                 </div>
              </div>


              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes & Informations</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Facultatif"
                  {...register("notes")}
                />
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
                   className={`flex-1 py-3 ${customColors.bgBtn} text-white rounded-xl text-sm font-medium shadow-md transition-colors`}
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
