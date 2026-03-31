import { useEffect, useState } from "react";
import { Plus, Minus, ShoppingCart, Calendar, History, Package, Info, ArrowRight, CheckCircle, ThermometerSun, ThermometerSnowflake, Thermometer } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";

interface FeedEntry {
  id: string;
  date: string;
  type: "achat" | "utilisation";
  quantity: number;
  feedType: string;
  notes: string;
  poultryType?: string;
  poultryBreed?: string;
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
  if (breed === 'Goliath' || breed === 'Brahma' || breed === 'Cochin') {
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
  const { poultryType, poultryBreed, syncTrigger } = useAuth();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [allChickens, setAllChickens] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "achat" as "achat" | "utilisation",
    quantity: "",
    feedType: "",
    notes: "",
  });

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

  useEffect(() => {
    if (poultryType === 'caille') {
      setSelectedBreed('Caille');
    } else if (poultryBreed) {
      const breedMap: Record<string, string> = {
        goliath: 'Goliath',
        brahma: 'Brahma',
        cochin: 'Cochin',
        pondeuse: 'Pondeuse',
        chair: 'Poulet de chair'
      };
      setSelectedBreed(breedMap[poultryBreed] || 'Poulet de chair');
    }
  }, [poultryType, poultryBreed]);

  const adjustConsumption = (text: string, currentWeather: "normal" | "hot" | "cold") => {
    if (currentWeather === "normal") return text;
    const factor = currentWeather === "hot" ? 0.85 : 1.15; // -15% hot, +15% cold
    return text.replace(/\d+/g, (match) => {
       return Math.round(parseInt(match) * factor).toString();
    });
  };

  const isCaille = poultryType === 'caille';
  const customColors = {
     bgLight: isCaille ? 'bg-emerald-50' : 'bg-orange-50',
     textDark: isCaille ? 'text-emerald-700' : 'text-orange-700',
     border: isCaille ? 'border-emerald-100' : 'border-orange-100',
     bgBtn: isCaille ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600',
  }

  useEffect(() => {
    const saved = localStorage.getItem("feed");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    const savedChickens = localStorage.getItem("chickens");
    if (savedChickens) {
      setAllChickens(JSON.parse(savedChickens));
    }
    const savedRecipes = localStorage.getItem("feed_recipes");
    if (savedRecipes) setSavedRecipes(JSON.parse(savedRecipes));
  }, [syncTrigger]);

  const saveEntries = (newEntries: FeedEntry[]) => {
    setEntries(newEntries);
    SyncService.saveCollection("feed", newEntries);
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
    localStorage.setItem("feed_recipes", JSON.stringify(updated));
    setRecipeName("");
    toast.success("Recette enregistrée !");
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: FeedEntry = {
      id: Date.now().toString(),
      ...formData,
      quantity: Number(formData.quantity),
      poultryType: poultryType || "poulet",
      poultryBreed: poultryBreed || undefined
    };
    saveEntries([newEntry, ...entries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "achat",
      quantity: "",
      feedType: "",
      notes: "",
    });
    setIsAddOpen(false);
  };

  const filteredEntries = entries.filter(e => {
    const typeMatch = !e.poultryType || e.poultryType === poultryType;
    const breedMatch = !e.poultryBreed || e.poultryBreed === poultryBreed;
    return typeMatch && breedMatch;
  });

  const totalFeed = filteredEntries.reduce((sum, entry) => {
    return sum + (entry.type === "achat" ? entry.quantity : -entry.quantity);
  }, 0);

  // Consumption Calculation Engine
  const calculateDailyConsumption = () => {
    let dailyTotalKg = 0;
    
    // Filter chickens by current breed/type selection for specific autonomy, or all?
    // Let's do ALL to reflect the REAL stock depletion
    allChickens.filter(c => c.status === 'active').forEach(c => {
      const breed = c.breed || (c.poultryType === 'caille' ? 'Caille' : 'Poulet de chair');
      const phases = getPhasesForBreed(breed);
      
      const arrDate = new Date(c.arrivalDate || c.date || Date.now());
      const ageDays = Math.ceil(Math.abs(Date.now() - arrDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let phase = phases.find(p => ageDays >= p.duration[0] && ageDays <= p.duration[1]);
      if(!phase) phase = phases[phases.length - 1];

      // Extract numeric values from "Xg à Yg"
      const matches = phase.consumption.match(/\d+/g);
      if (matches) {
        const avgGrams = matches.length === 2 
          ? (parseInt(matches[0]) + parseInt(matches[1])) / 2 
          : parseInt(matches[0]);
        
        // Multiplier for weather
        const weatherFactor = weather === 'hot' ? 0.85 : weather === 'cold' ? 1.15 : 1.0;
        
        const count = parseInt(c.count) || 1;
        dailyTotalKg += (avgGrams * count * weatherFactor) / 1000;
      }
    });

    return dailyTotalKg;
  };

  const dailyConsumption = calculateDailyConsumption();
  const autonomyDays = dailyConsumption > 0 ? Math.floor(totalFeed / dailyConsumption) : Infinity;
  const autonomyColor = autonomyDays > 7 ? 'text-emerald-500' : autonomyDays > 3 ? 'text-orange-500' : 'text-red-500';

  // Calculate current phase
  const phases = getPhasesForBreed(selectedBreed);
  const currentDate = new Date();
  const arrDate = new Date(arrivalDate);
  const diffTime = Math.abs(currentDate.getTime() - arrDate.getTime());
  const currentAgeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day 1 is arrival day

  let currentPhaseIndex = phases.findIndex(p => currentAgeDays >= p.duration[0] && currentAgeDays <= p.duration[1]);
  if(currentPhaseIndex === -1 && currentAgeDays > 0) currentPhaseIndex = phases.length - 1; // Default to last if very old

  const activePhaseToExpand = expandedPhase !== null ? expandedPhase : currentPhaseIndex;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-babs-brown tracking-tight">Gestion Aliment</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Stock & Programme Nutritionnel</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className={`${customColors.bgBtn} text-white px-6 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold`}
        >
          <Plus className="w-5 h-5" /> Nouvelle opération
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-8">
           {/* Stock Display */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col relative overflow-hidden group">
             <div className="absolute top-6 right-6 p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
               <Package className={`w-6 h-6 ${customColors.textDark}`} />
             </div>
             <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">Stock Actuel</p>
             <p className={`text-5xl mt-2 font-black ${totalFeed < 10 ? 'text-red-500' : 'text-babs-brown'}`}>
                {totalFeed.toFixed(1)} <span className="text-2xl text-gray-300">kg</span>
             </p>
             
             <div className="mt-4 flex flex-col gap-1">
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                 <span>Conso. estimée</span>
                 <span className="text-gray-600">{dailyConsumption.toFixed(2)} kg / jour</span>
               </div>
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                 <span>Autonomie</span>
                 <span className={`${autonomyColor} flex items-center gap-1`}>
                   {autonomyDays === Infinity ? "Lot à définir" : `${autonomyDays} jours`}
                 </span>
               </div>
             </div>

             {autonomyDays <= 3 && dailyConsumption > 0 && (
               <p className="text-[10px] font-black text-red-500 uppercase mt-4 tracking-widest animate-pulse flex items-center gap-1 bg-red-50 p-2 rounded-xl border border-red-100 italic">
                 ⚠️ Rupture imminente (Date estimée : {new Date(Date.now() + autonomyDays * 86400000).toLocaleDateString()})
               </p>
             )}
             <div className={`absolute bottom-0 left-0 w-full h-2 ${customColors.bgLight}`}></div>
           </div>

           {/* Nutritional Phase Generator */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
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
                    <option value="Goliath">Poulet Goliath</option>
                    <option value="Brahma">Poulet Brahma</option>
                    <option value="Cochin">Poulet Cochin</option>
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

           {/* Feed Optimizer (Mixer) */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 mt-8">
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
                        <div className="mt-6 flex gap-2">
                           <input 
                             placeholder="Nom de la recette..."
                             className="flex-1 bg-white border border-purple-100 rounded-xl px-4 py-2 text-xs font-bold text-babs-brown outline-none"
                             value={recipeName}
                             onChange={(e) => setRecipeName(e.target.value)}
                           />
                           <button 
                             onClick={handleSaveRecipe}
                             className="bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-purple-100 hover:scale-105 transition-all"
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
                                 localStorage.setItem("feed_recipes", JSON.stringify(updated));
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

         {/* History */}
         <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-8 px-2">
                <History className="w-5 h-5 text-gray-300" />
                <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Historique de Mouvements</h3>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[700px]">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-5 rounded-3xl bg-gray-50/50 hover:bg-white transition-colors border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md group">
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {new Date(entry.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                          {entry.notes && <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full normal-case tracking-normal">{entry.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xl font-black ${entry.type === 'achat' ? 'text-emerald-500' : 'text-orange-500'}`}>
                         {entry.type === 'achat' ? '+' : '-'}{entry.quantity} <span className="text-sm">kg</span>
                      </span>
                      <button 
                        onClick={() => saveEntries(entries.filter(e => e.id !== entry.id))}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer l'opération"
                      >
                         <Minus className="w-4 h-4 transform rotate-45" /> {/* Use X essentially or trash, minus rotated serves as X */}
                      </button>
                    </div>
                  </div>
                ))}

                {filteredEntries.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                       <Package className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold italic mb-2">Aucun mouvement enregistré.</p>
                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Gérez vos entrées et sorties de stock ici.</p>
                  </div>
                )}
              </div>
            </div>
         </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-babs-brown mb-8">Nouvelle opération</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none outline-none focus:ring-2 focus:ring-orange-100"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="achat">Achat / Stock</option>
                    <option value="utilisation">Utilisation / Ration</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantité (kg)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aliment</label>
                  <input 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100"
                    value={formData.feedType}
                    onChange={e => setFormData({ ...formData, feedType: e.target.value })}
                    placeholder="Ex: Miettes Croissance..."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes & Informations</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Facultatif"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`flex-1 ${customColors.bgBtn} text-white p-4 rounded-2xl font-black shadow-lg`}
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
