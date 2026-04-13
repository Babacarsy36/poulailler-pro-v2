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
    { day: 1, type: "Prévention", title: "Eau Sucrée + Vinaigre cidre", description: "Diluer 50g de sucre par litre d'eau (énergie) + 1 c.à.s (15ml) de Vinaigre de cidre pour nettoyer l'intestin." },
    { day: 3, type: "Prévention", title: "Vitamines", description: "Complexe vitaminé dans l'eau de boisson (Anti-stress)." },
    { day: 7, type: "Vaccin", title: "Newcastle (HB1) + Bronchite", description: "Dans l'eau de boisson or goutte œil." },
    { day: 10, type: "Prévention", title: "Cure de Moringa", description: "Mélanger 15g de poudre (1 c.à.s) pour 1 kg d'aliment pour doper les vitamines, pdt 3j." },
    { day: 14, type: "Vaccin", title: "Gumboro", description: "Dans l'eau de boisson (soif préalable de 2h)." },
    { day: 15, type: "Prévention", title: "Ail (Démarrage)", description: "Écraser 1 grosse gousse (5g) dans 1L d'eau, laisser macérer 12h. Donner pdt 3j (Antibiotique naturel)." },
    { day: 21, type: "Vaccin", title: "Rappel Newcastle", description: "Rappel vaccin anti-maladie de Newcastle." },
    { day: 24, type: "Prévention", title: "Feuilles de Papayer", description: "Broyer 2 grandes feuilles dans 1L d'eau (Anti-coccidien/Vermifuge naturel) et filtrer." }
  ];

  if(breed === 'Caille') {
    return [
       { day: 1, type: "Prévention", title: "Anti-stress + Vinaigre cidre", description: "Maintien température + 1c/L de vinaigre." },
       { day: 7, type: "Vaccin", title: "Newcastle / Bronchite", description: "Optionnel selon l'élevage, conseillé si mixité." },
       { day: 15, type: "Prévention", title: "Vitamines + Ail", description: "Renforcement immunitaire naturel." }
    ]
  }

  if(breed === 'Lapin') {
    return [
       { day: 15, type: "Prévention", title: "Anti-coccidiose", description: "Dans l'eau de boisson pour éviter les diarrhées (ex: Sulfaquinoxaline)." },
       { day: 35, type: "Vaccin", title: "VHD (Maladie Hémorragique)", description: "Vaccination vétérinaire sous-cutanée." },
       { day: 42, type: "Vaccin", title: "Myxomatose", description: "Vaccin contre la myxomatose (ou vaccin combiné VHD-Myxo à 5 semaines)." },
       { day: 60, type: "Prévention", title: "Vermifuge pur", description: "Déparasitage interne essentiel." }
    ]
  }

  if(breed === 'Pigeon') {
    return [
       { day: 14, type: "Vaccin", title: "Paramyxovirose", description: "Même virus que Newcastle, gouttes ou sous-cutané." },
       { day: 21, type: "Vaccin", title: "Variole colombaire", description: "Transfixion ou arrachage d'une plume (cuisse)." },
       { day: 35, type: "Prévention", title: "Trichomonose (Muguet)", description: "Traitement préventif régulier." },
       { day: 60, type: "Prévention", title: "Vermifuge complet", description: "Dans l'eau ou goutte individuelle avant l'accouplement." }
    ]
  }

  if(breed === 'Pondeuse') {
    return [
      ...commonEarly,
      { day: 28, type: "Vaccin", title: "Rappel Gumboro", description: "2ème dose Gumboro." },
      { day: 35, type: "Vaccin", title: "Variole aviaire", description: "Transfixion alaire (aile)." },
      { day: 42, type: "Vaccin", title: "Coryza", description: "Vaccination sous-cutanée." },
      { day: 60, type: "Prévention", title: "Ail + Papaye (Rappel)", description: "Vermifuge naturel avant l'entrée en ponte." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Injection intramusculaire (Bréchet). Protection contre Coryza, Newcastle, Bronchite et EDS." }
    ]
  }

  if(breed === 'Poule d\'Ornement' || breed === 'Brahma' || breed === 'Cochin') {
    return [
      ...commonEarly,
      { day: 28, type: "Prévention", title: "Anticocc (Amprolium/COCCIDOT)", description: "Prévention contre la coccidiose dans l'eau pendant 3-5 jours." },
      { day: 35, type: "Prévention", title: "Leva 200 WS (Levamisole)", description: "Déparasitage interne (Vermifuge) pour éliminer les vers." },
      { day: 42, type: "Prévention", title: "Soin Plumage & Vitamines", description: "Complément spécifique pour la beauté du plumage (acides aminés)." },
      { day: 60, type: "Prévention", title: "Rappel Vermifuge + Anticocc", description: "Entretien régulier pour maintenir la santé des sujets d'exposition." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Injection intramusculaire pour une protection complète (ND+IB+G+Coryza) indispensable en exposition." }
    ]
  }

  if(breed === 'Poulet Fermier' || breed === 'Reproducteur') {
    return [
      ...commonEarly,
      { day: 28, type: "Prévention", title: "Anticocc (Amprolium/COCCIDOT)", description: "Prévention contre la coccidiose dans l'eau pendant 3-5 jours." },
      { day: 35, type: "Prévention", title: "Leva 200 WS (Levamisole)", description: "Déparasitage interne (Vermifuge) pour éliminer les vers." },
      { day: 42, type: "Prévention", title: "Vitamines Régulières (Leva 200)", description: "Programme régulier de vitamines et minéraux pour optimiser la ponte et la fécondité." },
      { day: 60, type: "Prévention", title: "Rappel Vermifuge + Anticocc", description: "Entretien régulier pour maintenir la santé des reproducteurs." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Injection intramusculaire (Bréchet). Protection complète (ND+IB+G+Coryza)." }
    ]
  }

  return [
      ...commonEarly,
      { day: 28, type: "Vaccin", title: "Rappel Gumboro", description: "Pression virale, 2ème dose." },
      { day: 35, type: "Prévention", title: "Déparasitage naturel", description: "Feuilles de papayer ou Aloe Vera dans l'eau." },
      { day: 112, type: "Vaccin", title: "Corymune 7K (Optionnel)", description: "Uniquement pour les lots gardés pour la ponte." }
  ]
}

export function HealthTracking() {
  const { poultryType, poultryBreed, syncTrigger, saveData } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBreed, setSelectedBreed] = useState("Poulet de chair");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<HealthFormData>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "Vaccin",
      title: "",
      target: "",
      status: "Complété",
    }
  });

  const isCaille = poultryType === 'caille';
  const customColors = {
     bgLight: isCaille ? 'bg-emerald-50' : 'bg-orange-50',
     textDark: isCaille ? 'text-emerald-700' : 'text-orange-700',
     border: isCaille ? 'border-emerald-100' : 'border-orange-100',
     bgBtn: isCaille ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600',
  }

  useEffect(() => {
    const saved = StorageService.getItem<HealthRecord[]>("health");
    if (saved) {
      setRecords(saved);
    }
  }, [syncTrigger]);

  useEffect(() => {
    if (poultryType === "caille") {
      setSelectedBreed("Caille"); return;
    }
    if (poultryType === "pigeon") {
      setSelectedBreed("Pigeon"); return;
    }
    if (poultryType === "lapin") {
      setSelectedBreed("Lapin"); return;
    }

    if (poultryBreed) {
      const breedLabelMap: Record<string, string> = {
        fermier: "Poulet Fermier",
        ornement: "Poule d'Ornement",
        pondeuse: "Pondeuse",
        chair: "Poulet de chair",
        reproducteur: "Reproducteur",
      };
      setSelectedBreed(breedLabelMap[poultryBreed.toLowerCase()] || "Poulet de chair");
      return;
    }

    setSelectedBreed("Poulet de chair");
  }, [poultryType, poultryBreed]);

  const saveRecords = (newRecords: HealthRecord[]) => {
    setRecords(newRecords);
    saveData("health", newRecords);
  };

  const onFormSubmit = (data: HealthFormData) => {
    const now = Date.now();
    const newRecord: HealthRecord = {
      id: now.toString(),
      ...data,
      poultryType: poultryType || "poulet",
      poultryBreed: poultryBreed || undefined,
      updatedAt: now
    };
    saveRecords([newRecord, ...records]);
    reset({
      date: new Date().toISOString().split("T")[0],
      type: "Vaccin",
      title: "",
      target: "",
      status: "Complété",
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
      poultryType: poultryType || "poulet",
      poultryBreed: poultryBreed || undefined,
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

  const filteredRecords = records.filter(r => {
    const typeMatch = !poultryType || r.poultryType === poultryType || (poultryType === 'poulet' && (!r.poultryType || r.poultryType === 'poulet'));
    const breedMatch = !poultryBreed || r.poultryBreed?.toLowerCase() === poultryBreed.toLowerCase();
    return typeMatch && breedMatch;
  });

  const remediesProtocols = [
    { title: "Gombo", desc: "Favorise une excellente digestion et plein de vitamines.", usage: "Hacher 3 fruits de gombo frais dans 1L d'eau. Laisser macérer une demi-journée pour libérer le mucilage." },
    { title: "Poudre de Moringa", desc: "Super-aliment, booster de croissance (Fer, Calcium).", usage: "Saupoudrer 1 cuillère à soupe rase (15g) par kilo d'aliment." },
    { title: "Ail", desc: "Antibiotique et antiviral naturel très puissant.", usage: "Écraser 1 grosse gousse par litre d'eau, laisser macérer 12h. Cure conseillée : 3 jours consécutifs." },
    { title: "Aloe Vera", desc: "Boisson (Immunité/Coryza) & Gel Externe (Soin des plaies).", usage: "Boisson: Mixer 1 c.à.s de gel pur pour 2L d'eau. Externe: Appliquer le gel pur sur les plaies de picage (très amer, éloigne les autres)." },
    { title: "Papayer (Feuilles)", desc: "Vermifuge naturel et puissant anti-coccidiose.", usage: "Piler 2 grandes feuilles, macérer dans 1 Litre d'eau pdt 2h. Filtrer le jus pour le service." },
    { title: "Khassou Xay (Caïlcédrat)", desc: "Écorce amère, puissant antibiotique et anti-parasitaire.", usage: "Faire bouillir un morceau d'écorce dans 1L d'eau (décoction). Ajouter 2 c.à.s de ce liquide par litre d'eau de boisson pdt 3j." }
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
          className={`h-10 px-3 rounded-xl ${customColors.bgBtn} text-white flex items-center justify-center shadow-md transition-colors no-print outline-none`}
        >
          <iconify-icon icon="solar:add-circle-linear" class="text-xl sm:mr-2"></iconify-icon>
          <span className="font-medium text-sm hidden sm:inline">Nouveau Soin</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Prophylaxis Generator Engine */}
        <div className="clean-card rounded-3xl p-5">
           <div className="flex items-center gap-3 mb-6">
             <div className={`p-3 rounded-xl ${customColors.bgLight} ${customColors.textDark}`}>
                <Calendar className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Programme Automatisé</h3>
               <p className="text-[10px] uppercase font-bold text-gray-400">Gérez votre lot étape par étape</p>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Souche Elevée</label>
                <select 
                  className={`w-full ${customColors.bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown appearance-none mt-1 outline-none`}
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
                  className={`w-full ${customColors.bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown mt-1 outline-none`}
                  value={arrivalDate}
                  onChange={e => setArrivalDate(e.target.value)}
                />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative border-t border-gray-100 pt-6">
              <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gray-100"></div>
              <div className="space-y-6 relative z-10">
                 {currentProphylaxis.map((step, idx) => {
                    const stepDateObj = new Date(arrivalDate);
                    stepDateObj.setDate(stepDateObj.getDate() + (step.day - 1));
                    const stepDateStr = stepDateObj.toISOString().split("T")[0];
                    const isPast = new Date() > stepDateObj;
                    const isDone = filteredRecords.some(r => r.date === stepDateStr && r.title === step.title);

                    return (
                      <div key={idx} className="relative flex items-start gap-6 group">
                         <div className={`w-12 h-12 rounded-full border-4 border-white flex items-center justify-center flex-shrink-0 z-10 transition-colors ${isDone ? 'bg-emerald-400 text-white' : (isPast ? 'bg-red-400 text-white shadow-md' : 'bg-gray-200 text-gray-500')}`}>
                            <span className="text-xs font-black">J{step.day}</span>
                         </div>
                         <div className={`flex-1 p-5 rounded-3xl border-2 transition-all ${isDone ? 'bg-emerald-50/30 border-emerald-100 opacity-60' : 'bg-white border-gray-50 hover:border-gray-200 shadow-sm hover:shadow-md'}`}>
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <p className="font-black text-babs-brown leading-tight">{step.title}</p>
                                  <p className="text-[10px] font-black uppercase text-gray-400 mt-1 flex items-center gap-2">
                                     {stepDateObj.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                                     <span className={`px-2 py-0.5 rounded-full ${step.type === 'Vaccin' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{step.type}</span>
                                  </p>
                               </div>
                               {!isDone ? (
                                   <button onClick={() => markStepAsDone(step, stepDateStr)} className="text-gray-300 hover:text-emerald-500 transition-colors p-1" title="Marquer comme fait">
                                     <CheckCircle className="w-6 h-6" />
                                   </button>
                                 ) : (
                                   <button onClick={() => unmarkStepAsDone(step, stepDateStr)} className="text-emerald-500 hover:text-red-500 transition-colors p-1" title="Décocher">
                                     <CheckCircle className="w-6 h-6" />
                                   </button>
                                 )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{step.description}</p>
                         </div>
                      </div>
                    )
                 })}
              </div>
           </div>
        </div>

        {/* History & Remedies */}
        <div className="space-y-6">
           {/* History List */}
           <div className="clean-card rounded-3xl p-5 flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center gap-2 mb-4">
               <iconify-icon icon="solar:history-linear" class="text-xl text-gray-400"></iconify-icon>
               <h3 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Historique des Soins</h3>
             </div>
             
             <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {filteredRecords.length === 0 ? (
                   <p className="text-center text-gray-400 font-bold italic py-8">Aucun soin enregistré.</p>
                ) : (
                  filteredRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-3xl bg-gray-50/50 hover:bg-white transition-colors border border-transparent hover:border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          record.type === 'Vaccin' ? 'bg-orange-100 text-orange-600' : 
                          record.type === 'Traitement' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-babs-brown text-sm">{record.title}</p>
                          <p className="text-[10px] font-bold text-gray-400">{record.target} • {new Date(record.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
           <div className="clean-card rounded-3xl p-5">
             <div className="flex items-center gap-2 mb-3">
               <iconify-icon icon="solar:leaf-linear" stroke-width="1.5" class="text-xl text-emerald-500"></iconify-icon>
               <h3 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Bibliothèque Bio</h3>
             </div>
             
             <div className="overflow-x-auto pb-4 custom-scrollbar flex gap-4">
               {remediesProtocols.map((p, i) => (
                 <div key={i} className="min-w-[200px] bg-white rounded-2xl p-4 shadow-sm border border-emerald-50">
                    <p className="font-black text-emerald-700 text-sm mb-1">{p.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium mb-2">{p.desc}</p>
                    <p className="bg-emerald-50 text-emerald-800 text-[10px] p-2 rounded-xl font-bold">{p.usage}</p>
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
                  className={`flex-1 text-white p-4 rounded-2xl font-black shadow-lg ${customColors.bgBtn}`}
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
