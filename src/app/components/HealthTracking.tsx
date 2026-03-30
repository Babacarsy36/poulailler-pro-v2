import { useState, useEffect } from "react";
import { Heart, Plus, Shield, Leaf, AlertCircle, ChevronRight, History, Trash2, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { toast } from "sonner";

interface HealthRecord {
  id: string;
  date: string;
  type: "Vaccin" | "Traitement" | "Prévention";
  title: string;
  target: string;
  status: "Complété" | "En attente";
  poultryType?: string;
  poultryBreed?: string;
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
    { day: 7, type: "Vaccin", title: "Newcastle (HB1) + Bronchite", description: "Dans l'eau de boisson ou goutte œil." },
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

  if(breed === 'Pondeuse') {
    return [
      ...commonEarly,
      { day: 28, type: "Vaccin", title: "Rappel Gumboro", description: "2ème dose Gumboro." },
      { day: 35, type: "Vaccin", title: "Variole aviaire", description: "Transfixion alaire (aile)." },
      { day: 42, type: "Vaccin", title: "Coryza", description: "Vaccination sous-cutanée." },
      { day: 60, type: "Prévention", title: "Ail + Papaye (Rappel)", description: "Vermifuge naturel avant l'entrée en ponte." }
    ]
  }

  return [
      ...commonEarly,
      { day: 28, type: "Vaccin", title: "Rappel Gumboro", description: "Pression virale, 2ème dose." },
      { day: 35, type: "Prévention", title: "Déparasitage naturel", description: "Feuilles de papayer ou Aloe Vera dans l'eau." }
  ]
}

export function HealthTracking() {
  const { poultryType, poultryBreed, syncTrigger } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  // Prophylaxis Generator State
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBreed, setSelectedBreed] = useState("Poulet de chair");

  const isCaille = poultryType === 'caille';
  const customColors = {
     bgLight: isCaille ? 'bg-emerald-50' : 'bg-orange-50',
     textDark: isCaille ? 'text-emerald-700' : 'text-orange-700',
     border: isCaille ? 'border-emerald-100' : 'border-orange-100',
     bgBtn: isCaille ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600',
  }

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Vaccin" as const,
    title: "",
    target: "",
    status: "Complété" as const,
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("health") || "[]");
    setRecords(saved.length > 0 ? saved : []);
  }, [syncTrigger]);

  useEffect(() => {
    if (poultryType === "caille") {
      setSelectedBreed("Caille");
      return;
    }

    if (poultryBreed) {
      const breedLabelMap: Record<string, string> = {
        goliath: "Goliath",
        brahma: "Brahma",
        cochin: "Cochin",
        pondeuse: "Pondeuse",
        chair: "Poulet de chair",
      };
      setSelectedBreed(breedLabelMap[poultryBreed] || "Poulet de chair");
      return;
    }

    setSelectedBreed("Poulet de chair");
  }, [poultryType, poultryBreed]);

  const saveRecords = (newRecords: HealthRecord[]) => {
    setRecords(newRecords);
    SyncService.saveCollection("health", newRecords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: HealthRecord = {
      id: Date.now().toString(),
      ...formData,
      poultryType: poultryType || "poulet",
      poultryBreed: poultryBreed || undefined
    };
    saveRecords([newRecord, ...records]);
    setFormData({
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
    const newRecord: HealthRecord = {
      id: Date.now().toString(),
      date: dateStr,
      type: step.type,
      title: step.title,
      target: selectedBreed,
      status: "Complété",
      poultryType: poultryType || "poulet",
      poultryBreed: poultryBreed || undefined
    };
    saveRecords([newRecord, ...records]);
    toast.success(`${step.title} marqué comme réalisé !`);
  };

  const filteredRecords = records.filter(r => {
    const typeMatch = !r.poultryType || r.poultryType === poultryType;
    const breedMatch = !r.poultryBreed || r.poultryBreed === poultryBreed;
    return typeMatch && breedMatch;
  });

  const [expandedRemedy, setExpandedRemedy] = useState<number | null>(null);

  const protocols = [
    { title: "Gombo", desc: "Favorise une excellente digestion et plein de vitamines.", usage: "Hacher 3 fruits de gombo frais dans 1L d'eau. Laisser macérer une demi-journée pour libérer le mucilage." },
    { title: "Poudre de Moringa", desc: "Super-aliment, booster de croissance (Fer, Calcium).", usage: "Saupoudrer 1 cuillère à soupe rase (15g) par kilo d'aliment." },
    { title: "Ail", desc: "Antibiotique et antiviral naturel très puissant.", usage: "Écraser 1 grosse gousse par litre d'eau, laisser macérer 12h. Cure conseillée : 3 jours consécutifs." },
    { title: "Aloe Vera", desc: "Boisson (Immunité/Coryza) & Gel Externe (Soin des plaies).", usage: "Boisson: Mixer 1 c.à.s de gel pur pour 2L d'eau. Externe: Appliquer le gel pur sur les plaies de picage (très amer, éloigne les autres)." },
    { title: "Papayer (Feuilles)", desc: "Vermifuge naturel et puissant anti-coccidiose.", usage: "Piler 2 grandes feuilles, macérer dans 1 Litre d'eau pdt 2h. Filtrer le jus pour le service." }
  ];

  const currentProphylaxis = getProtocolsForBreed(selectedBreed);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-babs-brown tracking-tight">Suivi de Santé</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Vitalité & Prophylaxie Automatisée</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className={`text-white px-5 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2 ${customColors.bgBtn}`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm hidden sm:inline">Nouveau Soin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Prophylaxis Generator Engine */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex flex-col h-[600px]">
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
                  <option value="Goliath">Poulet Goliath</option>
                  <option value="Brahma">Poulet Brahma</option>
                  <option value="Cochin">Poulet Cochin</option>
                  <option value="Rainbow Plus">Rainbow Plus</option>
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
                    // Check if already in records (filtered by current breed for accuracy)
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
                               {!isDone && (
                                  <button onClick={() => markStepAsDone(step, stepDateStr)} className="text-gray-300 hover:text-emerald-500 transition-colors p-1" title="Marquer comme fait">
                                    <CheckCircle className="w-6 h-6" />
                                  </button>
                                )}
                               {isDone && <CheckCircle className="w-6 h-6 text-emerald-500" />}
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
        <div className="space-y-8 flex flex-col h-[600px]">
           {/* History List */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center gap-2 mb-6">
               <History className="w-5 h-5 text-babs-brown/40" />
               <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Historique des Soins</h3>
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
           <div className="bg-emerald-50/30 rounded-[2.5rem] p-8 shadow-premium border border-emerald-50">
             <div className="flex items-center gap-2 mb-4">
               <Leaf className="w-6 h-6 text-emerald-500" />
               <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Bibliothèque Bio</h3>
             </div>
             
             <div className="overflow-x-auto pb-4 custom-scrollbar flex gap-4">
               {protocols.map((p, i) => (
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-babs-brown mb-8">Nouveau Soin Manuel</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type de soin</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
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
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Vitamine A..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lot cible</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={formData.target}
                  onChange={e => setFormData({ ...formData, target: e.target.value })}
                  placeholder="Ex: Goliath de Janvier..."
                  required
                />
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
    </div>
  );
}
