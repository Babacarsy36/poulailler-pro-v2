import { useState, useEffect } from 'react';
import { X, Egg, Thermometer, Bell } from 'lucide-react';
import { IncubationBatch, SPECIES_CONFIG, SpeciesKey, getExpectedHatchDate } from './types';
import { useForm } from 'react-hook-form';
import { BottomSheet } from '../ui/BottomSheet';

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
    <BottomSheet 
      isOpen={true} 
      onClose={onClose}
      title={isEdit ? 'Modifier le Lot' : 'Plan d\'Éclosion'}
    >
      <div className="space-y-5 py-2">
        {/* Header Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-3xl p-5 flex items-center gap-4 shadow-lg">
          <span className="text-4xl">{cfg.emoji}</span>
          <div>
            <p className="font-black text-lg">{cfg.label}</p>
            <p className="text-blue-100 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">
              Durée : {cfg.totalDays} jours
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
          {[
            { id: 'info' as const, label: 'Info', icon: Egg },
            { id: 'incubator' as const, label: 'Matériel', icon: Thermometer },
            { id: 'notes' as const, label: 'Notes', icon: Bell },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${
                tab === t.id ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              <t.icon className="w-4 h-4 mx-auto mb-1" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
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
                          : 'border-gray-100 bg-gray-50'
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
                  className={`w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-blue-100 ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                  {...register('name', { 
                    required: "Nom requis",
                    onChange: () => setIsManualName(true)
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre d'œufs</label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
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
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                  {...register('incubatorName')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capacité</label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none"
                  {...register('incubatorCapacity', { setValueAs: v => Number(v) })}
                />
              </div>
            </>
          )}

          {tab === 'notes' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</label>
              <textarea
                rows={4}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-babs-brown outline-none resize-none"
                {...register('notes')}
              />
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg"
            >
              {isEdit ? 'Mettre à jour' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}
