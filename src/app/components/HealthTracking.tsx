import { useState, useEffect } from "react";
import { Heart, Plus, Leaf, History, Trash2, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface HealthRecord {
  [key: string]: any;
  id: string;
  date: string;
  type: "Vaccin" | "Traitement" | "Prévention";
  title: string;
  target: string;
  status: "Complété" | "En attente";
  poultryType?: string;
  poultryBreed?: string;
  updatedAt?: number;
}

interface HealthFormData {
  date: string;
  type: "Vaccin" | "Traitement" | "Prévention";
  title: string;
  target: string;
  status: "Complété" | "En attente";
}

type ProphylaxisStep = {
  day: number;
  type: "Vaccin" | "Prévention" | "Traitement";
  title: string;
  description: string;
}

const getProtocolsForBreed = (breed: string): ProphylaxisStep[] => {
  const commonEarly: ProphylaxisStep[] = [
    { day: 1, type: "Prévention", title: "Eau Sucrée + Vinaigre cidre", description: "Posologie: 50g de sucre/Litre (énergie) + 15ml (1 c.à.s) de Vinaigre de cidre pour nettoyer l'intestin." },
    { day: 3, type: "Prévention", title: "Complexe Vitaminé", description: "Posologie: 1g ou 1ml par Litre d'eau de boisson (Anti-stress) pendant 3 jours." },
    { day: 6, type: "Vaccin", title: "Newcastle (HB1)", description: "Posologie: 1 dose/sujet dans l'eau non chlorée. Soif préalable de 2h requise." },
    { day: 10, type: "Prévention", title: "Cure de Moringa", description: "Posologie: 15g de poudre (1 c.à.s) pour 1 kg d'aliment pour doper les vitamines, pdt 3j." },
    { day: 12, type: "Vaccin", title: "Gumboro (1ère dose)", description: "Posologie: 1 dose/sujet dans l'eau de boisson (soif préalable de 2h)." },
    { day: 15, type: "Prévention", title: "Ail (Démarrage)", description: "Posologie: 1 grosse gousse (5g) écrasée dans 1L d'eau, macérer 12h. Donner pdt 3j (Antibiotique naturel)." },
    { day: 22, type: "Vaccin", title: "Gumboro (Rappel)", description: "Posologie: 1 dose/sujet. Rappel essentiel pour la protection immunitaire." },
    { day: 26, type: "Vaccin", title: "Newcastle (LaSota)", description: "Posologie: 1 dose/sujet. Rappel vaccin anti-maladie de Newcastle dans l'eau." },
  ];

  if(breed === 'Caille') {
    return [
       { day: 1, type: "Prévention", title: "Anti-stress + Vinaigre cidre", description: "Posologie: 1c/L de vinaigre + vitamines énergisantes." },
       { day: 7, type: "Vaccin", title: "Newcastle / Bronchite", description: "Posologie: 1 dose/sujet. Optionnel si environnement sécurisé." },
       { day: 15, type: "Prévention", title: "Vitamines + Ail", description: "Posologie: 1 gousse/L pdt 3 jours pour booster l'immunité." }
    ]
  }

  if(breed === 'Lapin') {
    return [
       { day: 15, type: "Prévention", title: "Anti-coccidiose (Amprolium)", description: "Posologie: 1g/L pdt 5j pour éviter les diarrhées." },
       { day: 35, type: "Vaccin", title: "VHD (Maladie Hémorragique)", description: "Posologie: 0.5ml en sous-cutanée (Sujet de > 500g)." },
       { day: 42, type: "Vaccin", title: "Myxomatose", description: "Posologie: 1 dose par sujet (ou combiné VHD-Myxo)." },
       { day: 60, type: "Prévention", title: "Vermifuge (Leva 200)", description: "Posologie: 1g pour 2 litres d'eau pendant 24h." }
    ]
  }

  if(breed === 'Pigeon') {
    return [
       { day: 14, type: "Vaccin", title: "Paramyxovirose", description: "Posologie: 0.2ml par sujet en sous-cutané (nuque)." },
       { day: 21, type: "Vaccin", title: "Variole colombaire", description: "Posologie: Méthode par transfixion alaire (aile)." },
       { day: 35, type: "Prévention", title: "Trichomonose (Muguet)", description: "Posologie: 1g/L d'eau de boisson (Dimétridazole/Ronidazole)." },
       { day: 60, type: "Prévention", title: "Vermifuge complet", description: "Posologie: 1 goutte individuelle sur le bec ou dans l'eau." }
    ]
  }

  if(breed === 'Poulet de chair') {
    return [
      ...commonEarly,
      { day: 35, type: "Prévention", title: "Vitamines de Finition", description: "Posologie: 1g/L d'eau. Booster pour optimiser le poids." },
      { day: 42, type: "Prévention", title: "Anti-stress pré-vente", description: "Posologie: Vitamine C (1g/L) 2j avant le transport." }
    ]
  }

  if(breed === 'Pondeuse') {
    return [
      ...commonEarly,
      { day: 35, type: "Vaccin", title: "Variole aviaire", description: "Posologie: Application par transfixion alaire (transpercer l'aile)." },
      { day: 42, type: "Vaccin", title: "Coryza Aviaire", description: "Posologie: 0.5ml en injection sous-cutanée (1ère dose)." },
      { day: 49, type: "Vaccin", title: "Typhose Aviaire", description: "Posologie: Injection sous-cutanée selon dosage labo." },
      { day: 60, type: "Prévention", title: "Vermifuge (Leva 200)", description: "Posologie: 1.5g/L d'eau pendant un jour complet." },
      { day: 70, type: "Vaccin", title: "Rappel Newcastle (Lasota)", description: "Posologie: 1 dose/sujet dans l'eau de boisson." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Posologie: Injection intramusculaire (0.5ml). Protection ponte longue." }
    ]
  }

  if(breed === 'Poulet Fermier' || breed === 'Reproducteur' || breed === 'Goliath') {
    return [
      ...commonEarly,
      { day: 30, type: "Prévention", title: "Anti-Coccidien", description: "Posologie: 1g Amprolium/Litre pendant 5 jours consécutifs." },
      { day: 45, type: "Prévention", title: "Vermifuge (Decaris/Leva)", description: "Posologie: 1g pour 2 Litres d'eau (A jeun le matin)." },
      { day: 60, type: "Prévention", title: "Vitamines de Croissance", description: "Posologie: Booster minéraux/calcium dans l'aliment." },
      { day: 90, type: "Vaccin", title: "Rappel Newcastle", description: "Posologie: 1 dose/sujet pour sujets à cycle long." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Posologie: Injection 0.5ml pour protection géniteurs." }
    ]
  }

  if(breed === 'Poule d\'Ornement' || breed === 'Brahma' || breed === 'Cochin') {
    return [
      ...commonEarly,
      { day: 30, type: "Prévention", title: "Anti-Coccidien", description: "Posologie: 1g par Litre d'eau pdt 5j (Sujets fragiles)." },
      { day: 45, type: "Prévention", title: "Leva 200 WS (Vermifuge)", description: "Posologie: 1g pour 2L d'eau. Vital pour la beauté." },
      { day: 60, type: "Prévention", title: "Soin Plumage (Acides Aminés)", description: "Posologie: 2ml/Litre d'eau pendant 5 jours." },
      { day: 90, type: "Vaccin", title: "Rappel Newcastle", description: "Posologie: Rappel obligatoire pour sujets d'exposition." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Posologie: Injection intramusculaire (0.5ml). Indispensable." }
    ]
  }


  return [
    ...commonEarly,
    { day: 35, type: "Prévention", title: "Déparasitage naturel", description: "Posologie: Macération de 2 feuilles de papayer/Litre." },
    { day: 112, type: "Vaccin", title: "Corymune 7K (Optionnel)", description: "Posologie: 0.5ml en injection unique." }
  ]
}

export function HealthTracking() {
  const { isItemActive, poultryTypes, activeSpeciesFilter, selectedBreeds, syncTrigger, saveData } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBreed, setSelectedBreed] = useState("Poulet de chair");

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<HealthFormData & { breed: string }>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "Vaccin",
      title: "",
      target: "",
      status: "Complété",
      breed: selectedBreeds[0] || "",
      poultryType: activeSpeciesFilter !== 'all' ? activeSpeciesFilter : 'poulet',
    }
  });

  const formData = watch();

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : isCaille ? 'emerald' : 'orange';
  const accentColor = isMixed ? "text-indigo-600" : isCaille ? "text-emerald-600" : "text-orange-600";
  const bgLight = isMixed ? "bg-indigo-50" : isCaille ? "bg-emerald-50" : "bg-orange-50";
  const btnBg = isMixed ? "bg-indigo-600 hover:bg-indigo-700" : isCaille ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700";
  const accentBorderLeft = isMixed ? "border-l-indigo-500" : isCaille ? "border-l-emerald-500" : "border-l-orange-500";

  useEffect(() => {
    const saved = StorageService.getItem<HealthRecord[]>("health");
    if (saved) {
      setRecords(saved);
    }
  }, [syncTrigger]);

  useEffect(() => {
    if (activeSpeciesFilter === "caille") {
      setSelectedBreed("Caille"); return;
    }
    if (activeSpeciesFilter === "pigeon") {
      setSelectedBreed("Pigeon"); return;
    }
    if (activeSpeciesFilter === "lapin") {
      setSelectedBreed("Lapin"); return;
    }

    if (selectedBreeds.length > 0) {
      const breedLabelMap: Record<string, string> = {
        fermier: "Poulet Fermier",
        ornement: "Poule d'Ornement",
        pondeuse: "Pondeuse",
        chair: "Poulet de chair",
        reproducteur: "Reproducteur",
      };
      setSelectedBreed(breedLabelMap[selectedBreeds[0].toLowerCase()] || "Poulet de chair");
      return;
    }

    setSelectedBreed("Poulet de chair");
  }, [activeSpeciesFilter, selectedBreeds]);

  const saveRecords = (newRecords: HealthRecord[]) => {
    setRecords(newRecords);
    saveData("health", newRecords);
  };

  const onFormSubmit = (data: HealthFormData & { breed: string }) => {
    const now = Date.now();
    const newRecord: HealthRecord = {
      id: now.toString(),
      ...data,
      poultryType: data.poultryType || (activeSpeciesFilter !== 'all' ? activeSpeciesFilter : 'poulet'),
      poultryBreed: data.breed || selectedBreeds[0] || undefined,
      updatedAt: now
    };
    saveRecords([newRecord, ...records]);
    reset({
      date: new Date().toISOString().split("T")[0],
      type: "Vaccin",
      title: "",
      target: "",
      status: "Complété",
      breed: selectedBreeds[0] || "",
    });
    setShowAdd(false);
    toast.success("Soin enregistré avec succès !");
  };

  const markStepAsDone = (step: ProphylaxisStep, dateStr: string) => {
    const now = Date.now();
    const newRecord: HealthRecord = {
      id: now.toString(),
      date: dateStr,
      type: step.type,
      title: step.title,
      target: selectedBreed,
      status: "Complété",
      poultryType: activeSpeciesFilter !== 'all' ? activeSpeciesFilter : (selectedBreed === 'Caille' ? 'caille' : 'poulet'),
      poultryBreed: selectedBreeds.find(sb => {
          const breedLabelMap: Record<string, string> = {
            fermier: "Poulet Fermier",
            ornement: "Poule d'Ornement",
            pondeuse: "Pondeuse",
            chair: "Poulet de chair",
            reproducteur: "Reproducteur",
          };
          return breedLabelMap[sb?.toLowerCase()] === selectedBreed;
      }) || selectedBreeds[0] || undefined,
      updatedAt: now
    };
    saveRecords([newRecord, ...records]);
    toast.success(`${step.title} marqué comme réalisé !`);
  };

  const unmarkStepAsDone = (step: ProphylaxisStep, dateStr: string) => {
    const updatedRecords = records.filter(r => !(r.date === dateStr && r.title === step.title && r.target === selectedBreed));
    saveRecords(updatedRecords);
    toast.info(`${step.title} décoché !`);
  };

  const filteredRecords = records.filter(r => isItemActive(r.poultryType, r.poultryBreed));

  const remediesProtocols = [
    { title: "Gombo", desc: "Digestion & Vitamines.", usage: "Posologie: 3 gombos hachés dans 1L d'eau. Macérer 6h pour libérer le mucilage." },
    { title: "Poudre de Moringa", desc: "Super-aliment & Booster.", usage: "Posologie: 15g (1 c.à.s) par kg d'aliment. Cure de 7 jours conseillée." },
    { title: "Ail", desc: "Antibiotique Naturel.", usage: "Posologie: 1 grosse gousse écrasée par Litre d'eau. Macérer 12h. Cure de 3j." },
    { title: "Aloe Vera", desc: "Immunité & Coryza.", usage: "Posologie: 1 c.à.s de gel pur pour 2L d'eau. Très efficace contre le rhume." },
    { title: "Papayer (Feuilles)", desc: "Anti-Coccidien & Vermifuge.", usage: "Posologie: Piler 2 feuilles dans 1L d'eau. Filtrer et donner immédiatement." },
    { title: "Khassou Xay", desc: "Antibiotique Puissant.", usage: "Posologie: Décoction d'écorce. Ajouter 2 c.à.s par Litre d'eau de boisson." }
  ];

  const currentProphylaxis = getProtocolsForBreed(selectedBreed);

  return (
    <section id="screen-health" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-semibold text-gray-900 tracking-tight">Suivi de Santé</h1>
          <p className="text-xs font-light text-gray-500 mt-1">Vitalité & prophylaxie automatisée</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className={`h-10 px-3 rounded-xl ${btnBg} text-white flex items-center justify-center shadow-md transition-colors no-print outline-none`}
        >
          <iconify-icon icon="solar:add-circle-linear" class="text-xl sm:mr-2"></iconify-icon>
          <span className="font-medium text-sm hidden sm:inline">Nouveau Soin</span>
        </button>
      </div>

      {/* Important Alerts */}
      <div className="bg-zinc-900 rounded-3xl p-5 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="flex items-center gap-2 mb-3">
            <iconify-icon icon="solar:danger-bold" class="text-xl text-amber-400"></iconify-icon>
            <h4 className="text-sm font-black uppercase tracking-widest text-amber-400">Conseils de Vaccination</h4>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
               <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
                  <iconify-icon icon="solar:heart-break-bold"></iconify-icon>
               </div>
               <p className="text-[11px] font-medium leading-relaxed">Ne jamais vacciner un sujet malade ou affaibli.</p>
            </div>
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
               <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <iconify-icon icon="solar:water-drop-bold"></iconify-icon>
               </div>
               <p className="text-[11px] font-medium leading-relaxed">Arrêter l'eau 2-3h avant pour garantir la soif.</p>
            </div>
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
               <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                  <iconify-icon icon="solar:filter-bold"></iconify-icon>
               </div>
               <p className="text-[11px] font-medium leading-relaxed">Utiliser uniquement de l'eau propre, non chlorée (eau de puits/source).</p>
            </div>
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
               <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <iconify-icon icon="solar:leaf-bold"></iconify-icon>
               </div>
               <p className="text-[11px] font-medium leading-relaxed">Donner des vitamines (Anti-stress) 2-3 jours après le vaccin.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prophylaxis Generator Engine */}
        <div className="lg:col-span-7 space-y-6">
          <div className="clean-card rounded-3xl p-4 md:p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${bgLight} ${accentColor}`}>
                  <Calendar className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-babs-brown uppercase tracking-wider">Programme Automatisé</h3>
                <p className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400">Gérez votre lot étape par étape</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Souche Elevée</label>
                  <select 
                    className={`w-full ${bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown appearance-none mt-1 outline-none text-sm`}
                    value={selectedBreed}
                    onChange={(e) => setSelectedBreed(e.target.value)}
                  >
                    <option value="Poulet de chair">Poulet de chair</option>
                    <option value="Pondeuse">Pondeuse</option>
                    <option value="Poulet Fermier">Poulet Fermier</option>
                    <option value="Poule d'Ornement">Poule d'Ornement</option>
                    <option value="Reproducteur">Reproducteur</option>
                    <option value="Caille">Caille</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Date d'arrivée</label>
                  <input 
                    type="date"
                    className={`w-full ${bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown mt-1 outline-none text-sm`}
                    value={arrivalDate}
                    onChange={e => setArrivalDate(e.target.value)}
                  />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar relative border-t border-gray-100 pt-6">
                <div className="absolute left-5 md:left-6 top-6 bottom-0 w-0.5 bg-gray-100"></div>
                <div className="space-y-6 relative z-10">
                  {currentProphylaxis.map((step, idx) => {
                      const stepDateObj = new Date(arrivalDate);
                      stepDateObj.setDate(stepDateObj.getDate() + (step.day - 1));
                      const stepDateStr = stepDateObj.toISOString().split("T")[0];
                      const isPast = new Date() > stepDateObj;
                      const isDone = filteredRecords.some(r => r.date === stepDateStr && r.title === step.title);
                      const isCommonBase = step.day <= 24;

                      return (
                        <div key={idx} className="relative flex items-start gap-4 md:gap-6 group">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white flex items-center justify-center flex-shrink-0 z-10 transition-colors ${isDone ? 'bg-emerald-400 text-white' : (isPast ? 'bg-red-400 text-white shadow-md' : 'bg-gray-200 text-gray-500')}`}>
                              <span className="text-[10px] md:text-xs font-black">J{step.day}</span>
                          </div>
                          <div className={`flex-1 p-4 md:p-5 rounded-3xl border-2 transition-all ${isDone ? 'bg-emerald-50/30 border-emerald-100 opacity-60' : 'bg-white border-gray-50 hover:border-gray-200 shadow-sm hover:shadow-md'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-black text-babs-brown text-sm md:text-base leading-tight flex flex-wrap items-center gap-2">
                                      {step.title}
                                      {isCommonBase ? (
                                        <span className="text-[7px] md:text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Socle Commun</span>
                                      ) : (
                                        <span className={`text-[7px] md:text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${bgLight} ${accentColor}`}>{selectedBreed}</span>
                                      )}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 mt-1 flex items-center gap-2">
                                      {stepDateObj.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                                      <span className={`px-2 py-0.5 rounded-full ${step.type === 'Vaccin' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{step.type}</span>
                                    </p>
                                </div>
                                {!isDone ? (
                                    <button onClick={() => markStepAsDone(step, stepDateStr)} className="text-gray-300 hover:text-emerald-500 transition-colors p-1" title="Marquer comme fait">
                                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                  ) : (
                                    <button onClick={() => unmarkStepAsDone(step, stepDateStr)} className="text-emerald-500 hover:text-red-500 transition-colors p-1" title="Décocher">
                                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                  )}
                              </div>
                              <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      )
                  })}
                </div>
            </div>
          </div>
        </div>

        {/* History & Remedies */}
        <div className="lg:col-span-5 space-y-6">
          {/* History List */}
          <div className="clean-card rounded-3xl p-4 md:p-5 flex flex-col h-[400px] md:h-[500px]">
            <div className="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:history-linear" class="text-xl text-gray-400"></iconify-icon>
              <h3 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Historique des Soins</h3>
            </div>
            
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {filteredRecords.length === 0 ? (
                  <p className="text-center text-gray-400 font-bold italic py-8">Aucun soin enregistré.</p>
                ) : (
                  filteredRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 md:p-4 rounded-3xl bg-gray-50/50 hover:bg-white transition-colors border border-transparent hover:border-gray-100 group">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-3 rounded-xl ${
                          record.type === 'Vaccin' ? 'bg-orange-100 text-orange-600' : 
                          record.type === 'Traitement' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Heart className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-babs-brown text-xs md:text-sm truncate">{record.title}</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 truncate">{record.target} • {new Date(record.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => saveRecords(records.filter(r => r.id !== record.id))}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </div>

          {/* Natural Remedies Section */}
          <div className="clean-card rounded-3xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <iconify-icon icon="solar:leaf-linear" stroke-width="1.5" class="text-xl text-emerald-500"></iconify-icon>
              <h3 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Bibliothèque Bio</h3>
            </div>
            
            <div className="overflow-x-auto pb-4 custom-scrollbar flex gap-4">
              {remediesProtocols.map((p, i) => (
                <div key={i} className="min-w-[180px] md:min-w-[200px] bg-white rounded-2xl p-4 shadow-sm border border-emerald-50">
                  <p className="font-black text-emerald-700 text-xs md:text-sm mb-1">{p.title}</p>
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-medium mb-2">{p.desc}</p>
                  <p className="bg-emerald-50 text-emerald-800 text-[9px] md:text-[10px] p-2 rounded-xl font-bold">{p.usage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="font-['Syne'] text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Nouveau Soin Manuel</h3>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    {...register("date", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type de soin</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                    {...register("type")}
                  >
                    <option value="Vaccin">Vaccination</option>
                    <option value="Traitement">Traitement Curatif</option>
                    <option value="Prévention">Prévention / Naturel</option>
                  </select>
                </div>
              </div>
              
              {isMixed && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Espèce concernée</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none outline-none"
                    {...register("poultryType" as any)}
                  >
                    {poultryTypes.map(t => (
                      <option key={t} value={t!}>{t === 'poulet' ? '🐓 Poulet' : t === 'caille' ? '🥚 Caille' : t}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Race concernée</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                  {...register("breed", { required: true })}
                >
                  {selectedBreeds.length > 0 ? selectedBreeds.map(b => (
                    <option key={b} value={b}>{b === 'chair' ? 'Poulet de Chair' : b === 'fermier' ? 'Poulet Fermier' : b === 'ornement' ? "Poule d'Ornement" : b === 'pondeuse' ? 'Pondeuse' : b === 'caille' ? 'Caille' : b}</option>
                  )) : (
                    <option value="">Toutes espèces</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Libellé du soin</label>
                <input 
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 outline-none ${errors.title ? 'ring-2 ring-red-500' : ''}`}
                  placeholder="Ex: Vitamine A..."
                  {...register("title", { required: "Libellé requis" })}
                />
                {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lot cible</label>
                <input 
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 outline-none ${errors.target ? 'ring-2 ring-red-500' : ''}`}
                  placeholder="Ex: Goliath de Janvier..."
                  {...register("target", { required: "Lot cible requis" })}
                />
                {errors.target && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.target.message}</p>}
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className={`flex-1 text-white p-4 rounded-2xl font-black shadow-lg ${btnBg}`}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
