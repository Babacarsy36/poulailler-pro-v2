import { useState, useEffect } from 'react';
import { X, Egg, Thermometer, Bell } from 'lucide-react';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getExpectedHatchDate } from './types';
import { useForm } from 'react-hook-form';

const generateDefaultName = (species: SpeciesKey, date: string, all: IncubationBatch[]) => {
  const speciesLabel = SPECIES_CONFIG[species].label;
  const formattedDate = date ? date.split('-').reverse().join('/') : '';
  const count = all.filter(b => b.species === species).length + 1;
  return `${speciesLabel} - ${formattedDate} - Lot ${count}`;
};

interface Props {
  batch: IncubationBatch | null;
  allBatches: IncubationBatch[];
  onSave: (b: IncubationBatch) => void;
  onClose: () => void;
}

export function BatchWizard({ batch, allBatches, onSave, onClose }: Props) {
  const isEdit = !!batch;
  const [isManualName, setIsManualName] = useState(isEdit);
  const [tab, setTab] = useState<'info' | 'incubator' | 'notes'>('info');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IncubationBatch>({
    defaultValues: batch || {
      id: Date.now().toString(),
      name: generateDefaultName('poulet', new Date().toISOString().split('T')[0], allBatches),
      species: 'poulet',
      startDate: new Date().toISOString().split('T')[0],
      totalDays: 21,
      incubatorName: '',
      incubatorType: 'automatic',
      incubatorCapacity: 50,
      eggsCount: 0,
      fertileCount: 0,
      deadCount: 0,
      investment: 0,
      revenue: 0,
      status: 'ongoing',
      brooder: 'none',
      dailyChecks: Array(21).fill(false),
      notes: '',
      lastUpdated: Date.now(),
    }
  });

  const formValues = watch();

  useEffect(() => {
    if (!isEdit && !isManualName) {
      const newName = generateDefaultName(formValues.species as SpeciesKey, formValues.startDate, allBatches);
      setValue('name', newName);
    }
  }, [formValues.species, formValues.startDate, isManualName, isEdit, allBatches, setValue]);

  const cfg = SPECIES_CONFIG[formValues.species as SpeciesKey];

  const handleSpecies = (s: SpeciesKey) => {
    const days = SPECIES_CONFIG[s].totalDays;
    setValue('species', s);
    setValue('totalDays', days);
    setValue('dailyChecks', Array(days).fill(false));
  };

  const onFormSubmit = (data: IncubationBatch) => {
    onSave({ ...data, lastUpdated: Date.now() });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-white/10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black">{isEdit ? 'Modifier le Lot' : 'Plan d\'Éclosion'}</h2>
          <p className="text-blue-200 text-sm font-bold">Planifier et gérer votre incubation</p>
          
          <div className="mt-4 bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center gap-4">
            <span className="text-4xl">{cfg.emoji}</span>
            <div>
              <p className="font-black text-lg">{cfg.label}</p>
              <p className="text-blue-100 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">
                Durée totale : {cfg.totalDays} jours
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/5 px-4">
          {[
            { id: 'info' as const, label: 'Information', icon: Egg },
            { id: 'incubator' as const, label: 'Incubateur', icon: Thermometer },
            { id: 'notes' as const, label: 'Notes', icon: Bell },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
              }`}
            >
              <t.icon className="w-4 h-4 mx-auto mb-1" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Expected hatch date */}
          {formValues.startDate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Date d'éclosion prévue</p>
                <p className="text-sm font-black text-yellow-800">{getExpectedHatchDate(formValues.startDate, formValues.totalDays)}</p>
              </div>
            </div>
          )}

          {tab === 'info' && (
            <>
              {/* Species selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Espèce</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(SPECIES_CONFIG) as SpeciesKey[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpecies(s)}
                      className={`p-3 rounded-2xl text-center transition-all border-2 ${
                        formValues.species === s
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-100 bg-gray-50 hover:border-blue-200'
                      }`}
                    >
                      <span className="text-2xl block">{SPECIES_CONFIG[s].emoji}</span>
                      <span className="text-[9px] font-black text-gray-600 uppercase mt-1 block">{SPECIES_CONFIG[s].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date de début</label>
                <input
                  type="date"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                  {...register('startDate', { required: true })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nom du lot</label>
                <input
                  type="text"
                  placeholder={`Ex: Lot ${cfg.label} Mars...`}
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-blue-100 transition-all ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                  {...register('name', { 
                    required: "Nom requis",
                    onChange: () => setIsManualName(true)
                  })}
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.name.message}</p>}
                {!isEdit && (
                  <button 
                    type="button"
                    onClick={() => {
                        setIsManualName(false);
                        setValue('name', generateDefaultName(formValues.species as SpeciesKey, formValues.startDate, allBatches));
                    }}
                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                  >
                    Réinitialiser au nom automatique
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre d'œufs</label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                    min="0"
                    {...register('eggsCount', { 
                        setValueAs: v => Number(v),
                        onChange: (e) => setValue('fertileCount', Number(e.target.value))
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coût (FCFA)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                    min="0"
                    {...register('investment', { setValueAs: v => Number(v) })}
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'incubator' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nom incubateur</label>
                <input
                  type="text"
                  placeholder="Ex: Incubateur Rouge"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                  {...register('incubatorName')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capacité (œufs)</label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                  min="1"
                  {...register('incubatorCapacity', { setValueAs: v => Number(v) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type d'incubateur</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'automatic' as const, icon: '🔄', label: 'Automatique', desc: 'Retournement auto' },
                    { id: 'manual' as const, icon: '👆', label: 'Manuel', desc: 'Retournement à la main' },
                    { id: 'diy' as const, icon: '🔧', label: 'DIY / Local', desc: 'Setup personnalisé' },
                  ]).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setValue('incubatorType', t.id)}
                      className={`p-4 rounded-2xl text-center transition-all border-2 ${
                        formValues.incubatorType === t.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-100 bg-gray-50 hover:border-blue-200'
                      }`}
                    >
                      <span className="text-2xl block">{t.icon}</span>
                      <span className="text-[10px] font-black text-gray-700 block mt-1">{t.label}</span>
                      <span className="text-[8px] text-gray-400 block">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'notes' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes & Observations</label>
              <textarea
                placeholder="Notez vos observations..."
                rows={6}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none resize-none"
                {...register('notes')}
              />
            </div>
          )}

          {/* Hidden Submit Button for form validation logic */}
          <button type="submit" id="wizard-submit-btn" className="hidden" />
        </form>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-4">
          <button onClick={onClose} className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors text-sm">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('wizard-submit-btn')?.click()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black shadow-lg text-sm transition-colors"
          >
            {isEdit ? 'Mettre à jour' : 'Créer le lot'}
          </button>
        </div>
      </div>
    </div>
  );
}
