import { useState, useEffect } from "react";
import { Heart, Plus, Leaf, History, Trash2, Calendar, CheckCircle, X } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { StorageService } from "../services/StorageService";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ProphylaxisService, ProphylaxisStep } from "../services/ProphylaxisService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
  poultryType: string;
  breed: string;
}

// Protocols moved to ProphylaxisService.ts

export function HealthTracking() {
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, saveData } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  // const [showRemedies, setShowRemedies] = useState(true);
  
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBreed, setSelectedBreed] = useState("Poulet de chair");
  const [initialAge, setInitialAge] = useState(1);
  const [showTips, setShowTips] = useState(true);
  const [activeReminders, setActiveReminders] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<HealthFormData>({
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
    setActiveReminders(StorageService.getItem<any[]>('vaccine_reminders') || []);
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

  const scheduleReminder = (step: ProphylaxisStep, dateStr: string) => {
    let reminders = StorageService.getItem<any[]>('vaccine_reminders') || [];
    const id = `${selectedBreed}-${step.title.replace(/\s+/g, '-')}`;
    
    if (!reminders.some(r => r.id === id && r.date === dateStr)) {
        reminders.push({
            id,
            date: dateStr,
            title: step.title,
            description: step.description,
            breed: selectedBreed
        });
        StorageService.setItem('vaccine_reminders', reminders);
        setActiveReminders([...reminders]);
        toast.success(`Rappel activé pour le ${new Date(dateStr).toLocaleDateString('fr-FR')} !`);
        
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
             Notification.requestPermission();
        }
    } else {
        reminders = reminders.filter(r => !(r.id === id && r.date === dateStr));
        StorageService.setItem('vaccine_reminders', reminders);
        setActiveReminders([...reminders]);
        toast.info("Rappel désactivé.");
    }
  };

  const unmarkStepAsDone = (step: ProphylaxisStep, dateStr: string) => {
    const updatedRecords = records.map(r => 
        (r.date === dateStr && r.title === step.title && r.target === selectedBreed) 
            ? { ...r, _deleted: true, updatedAt: Date.now() } 
            : r
    );
    saveRecords(updatedRecords);
    toast.info(`${step.title} décoché !`);
  };

  const filteredRecords = records.filter(r => !r._deleted && isItemActive(r.poultryType, r.poultryBreed));

  const remediesProtocols = [
    { title: "Gombo", desc: "Digestion & Vitamines.", usage: "Posologie: 3 gombos hachés dans 1L d'eau. Macérer 6h pour libérer le mucilage." },
    { title: "Poudre de Moringa", desc: "Super-aliment & Booster.", usage: "Posologie: 15g (1 c.à.s) par kg d'aliment. Cure de 7 jours conseillée." },
    { title: "Ail", desc: "Antibiotique Naturel.", usage: "Posologie: 1 grosse gousse écrasée par Litre d'eau. Macérer 12h. Cure de 3j." },
    { title: "Aloe Vera", desc: "Immunité & Coryza.", usage: "Posologie: 1 c.à.s de gel pur pour 2L d'eau. Très efficace contre le rhume." },
    { title: "Papayer (Feuilles)", desc: "Anti-Coccidien & Vermifuge.", usage: "Posologie: Piler 2 feuilles dans 1L d'eau. Filtrer et donner immédiatement." },
    { title: "Khassou Xay", desc: "Antibiotique Puissant.", usage: "Posologie: Décoction d'écorce. Ajouter 2 c.à.s par Litre d'eau de boisson." }
  ];

  const currentProphylaxis = ProphylaxisService.getProtocolsForBreed(selectedBreed);

  const interventionTypes = filteredRecords.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const COLORS: Record<string, string> = {
     'Vaccin': '#F59E0B',
     'Traitement': '#10B981',
     'Prévention': '#3B82F6',
  };

  const chartData = Object.keys(interventionTypes).map(key => ({
      name: key,
      value: interventionTypes[key]
  }));

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
      {showTips && (
        <div className="bg-zinc-900 rounded-3xl p-5 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 relative">
           <button 
             onClick={() => setShowTips(false)}
             className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-colors"
           >
             <X className="w-4 h-4" />
           </button>
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
      )}

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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Souche Elevée</label>
                  <select 
                    className={`w-full ${bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown appearance-none mt-1 outline-none text-sm`}
                    value={selectedBreed}
                    onChange={(e) => setSelectedBreed(e.target.value)}
                  >
                    {selectedBreeds.includes('chair') && <option value="Poulet de chair">Poulet de chair</option>}
                    {selectedBreeds.includes('pondeuse') && <option value="Pondeuse">Pondeuse</option>}
                    {selectedBreeds.includes('fermier') && <option value="Poulet Fermier">Poulet Fermier</option>}
                    {selectedBreeds.includes('ornement') && <option value="Poule d'Ornement">Poule d'Ornement</option>}
                    {selectedBreeds.includes('reproducteur') && <option value="Reproducteur">Reproducteur</option>}
                    {activeSpeciesFilter === 'caille' && <option value="Caille">Caille</option>}
                    {/* Fallback if nothing matches user settings yet */}
                    {selectedBreeds.length === 0 && activeSpeciesFilter !== 'caille' && <option value="Poulet Fermier">Poulet Fermier</option>}
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
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Âge à l'arrivée</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className={`w-full ${bgLight} border-none rounded-2xl p-3 font-bold text-babs-brown mt-1 outline-none text-sm`}
                      value={initialAge}
                      onChange={e => setInitialAge(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">jours</span>
                  </div>
                </div>
            </div>
            
            {/* Current Age Highlight */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Âge estimé du lot</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-2xl font-black text-babs-brown">
                    {(() => {
                      const diffTime = Math.abs(new Date().getTime() - new Date(arrivalDate).getTime());
                      return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + initialAge;
                    })()} jours
                  </p>
                  <span className="text-[9px] font-bold text-gray-400 italic">(Date d'arrivée + âge initial)</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3 shadow-sm">
                   <iconify-icon icon="solar:info-circle-linear" class="text-blue-500 text-lg mt-0.5"></iconify-icon>
                   <div>
                     <p className="font-black text-blue-700 uppercase text-xs tracking-wider">Suivi biologique</p>
                     <p className="text-[10px] text-gray-500 font-bold mt-1 leading-relaxed">
                       Le programme de prophylaxie s'ajuste automatiquement selon l'âge réel de vos sujets.
                     </p>
                   </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar relative border-t border-gray-100 pt-6">
                <div className="absolute left-5 md:left-6 top-6 bottom-0 w-0.5 bg-gray-100"></div>
                <div className="space-y-6 relative z-10">
                  {currentProphylaxis.map((step, idx) => {
                      const stepDateObj = new Date(arrivalDate);
                      const diffTime = Math.abs(new Date().getTime() - stepDateObj.getTime());
                      const currentAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + initialAge;
                      
                      stepDateObj.setDate(stepDateObj.getDate() + (step.day - initialAge));
                      const stepDateStr = stepDateObj.toISOString().split("T")[0];
                      const isPast = currentAgeDays > step.day;
                      const isDone = filteredRecords.some(r => r.date === stepDateStr && r.title === step.title);
                      const isCommonBase = step.day <= 24;
                      const reminderId = `${selectedBreed}-${step.title.replace(/\s+/g, '-')}`;
                      const isReminderActive = activeReminders.some(r => r.id === reminderId && r.date === stepDateStr);

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
                                    <div className="flex gap-2 items-center">
                                      <button 
                                        onClick={() => scheduleReminder(step, stepDateStr)} 
                                        className={`p-1 flex items-center justify-center rounded-lg transition-colors ${isReminderActive ? 'text-blue-500 bg-blue-50 shadow-sm' : 'text-gray-300 hover:text-blue-500 bg-gray-50 hover:bg-blue-50'}`} 
                                        title={isReminderActive ? "Désactiver le rappel push" : "Activer un rappel push"}
                                      >
                                        <iconify-icon icon={isReminderActive ? "solar:bell-bing-bold-duotone" : "solar:bell-bing-linear"} class="text-lg md:text-xl"></iconify-icon>
                                      </button>
                                      <button onClick={() => markStepAsDone(step, stepDateStr)} className="text-gray-300 hover:text-emerald-500 transition-colors p-1" title="Marquer comme fait">
                                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                      </button>
                                    </div>
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

          {/* Graphique de Santé */}
          <div className="clean-card rounded-3xl p-4 md:p-5">
            <h3 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900 mb-4">Répartition des Soins</h3>
            {chartData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9CA3AF'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-xs font-bold uppercase">Aucune donnée</div>
            )}
          </div>

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
                          onClick={() => {
                            if(confirm("Supprimer ce soin ?")) {
                              saveRecords(records.map(r => r.id === record.id ? { ...r, _deleted: true, updatedAt: Date.now() } : r));
                            }
                          }}
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

          {/* Natural Remedies Section - HIDDEN TO SIMPLIFY APPLICATION */}
          {/* 
          {showRemedies && (
            <div className="clean-card rounded-3xl p-4 md:p-5 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
              ...
            </div>
          )}
          */}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="font-['Syne'] text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Nouveau Soin Manuel</h3>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              
              {/* Espèce sélecteur - Toujours visible si plusieurs espèces sont activées */}
              {poultryTypes.length > 1 && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Espèce concernée</label>
                  <select 
                    className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none outline-none ${watch("poultryType" as any) === 'caille' ? 'ring-2 ring-emerald-100' : ''}`}
                    {...register("poultryType" as any)}
                  >
                    {poultryTypes.map(t => (
                      <option key={t} value={t!}>{t === 'poulet' ? '🐓 Poulet' : t === 'caille' ? '🥚 Caille' : t}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Race concernée (Poulet) */}
              {(!watch("poultryType" as any) || watch("poultryType" as any) === 'poulet') && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Race de Poulet</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown appearance-none"
                    {...register("breed", { required: true })}
                  >
                    {selectedBreeds.filter(b => ['chair', 'fermier', 'ornement', 'pondeuse'].includes(b)).map(b => (
                      <option key={b} value={b}>{b === 'chair' ? 'Poulet de Chair' : b === 'fermier' ? 'Poulet Fermier' : b === 'ornement' ? "Poule d'Ornement" : b === 'pondeuse' ? 'Pondeuse' : b}</option>
                    ))}
                    {selectedBreeds.filter(b => ['chair', 'fermier', 'ornement', 'pondeuse'].includes(b)).length === 0 && (
                      <option value="Standard">Standard / Autre</option>
                    )}
                  </select>
                </div>
              )}

              {/* Race concernée (Caille) */}
              {watch("poultryType" as any) === 'caille' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Race de Caille</label>
                  <select 
                    className="w-full bg-emerald-50 border-none rounded-2xl p-4 font-bold text-emerald-900 appearance-none"
                    {...register("breed", { required: true })}
                   >
                    <option value="japon">Caille du Japon</option>
                    <option value="chine">Caille de Chine</option>
                    <option value="commune">Caille Commune</option>
                  </select>
                </div>
              )}

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
