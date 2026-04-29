// src/app/components/Onboarding.tsx
import { useState } from 'react';
import { Bird, Egg, Wheat, CheckCircle, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: Bird,
    color: 'bg-orange-500',
    title: 'Ajoutez vos animaux',
    description: 'Allez dans "Effectif" et cliquez sur le bouton + pour enregistrer vos poulets ou cailles. Indiquez juste le nombre et la date d\'arrivée.',
    action: 'Aller dans Effectif',
    path: '/inventory',
  },
  {
    icon: Wheat,
    color: 'bg-green-500',
    title: 'Notez votre aliment',
    description: 'Dans "Aliment", enregistrez le stock disponible. L\'application calculera automatiquement combien de jours il vous reste.',
    action: 'Aller dans Aliment',
    path: '/feed',
  },
  {
    icon: Egg,
    color: 'bg-yellow-500',
    title: 'Enregistrez vos œufs',
    description: 'Chaque jour dans "Production", notez le nombre d\'œufs collectés. Vous verrez votre taux de ponte évoluer.',
    action: 'Aller dans Production',
    path: '/eggs',
  },
];

export function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    setCompleted(prev => [...prev, step]);
    if (isLast) {
      localStorage.setItem('onboarding_done', 'true');
      onClose();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_done', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* Barre de progression */}
        <div className="flex gap-1.5 p-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < step ? 'bg-green-400' : i === step ? 'bg-orange-500' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>

        {/* Contenu */}
        <div className="px-6 pb-6 space-y-5">
          <div className={`w-16 h-16 ${current.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Étape {step + 1} sur {STEPS.length}
            </p>
            <h2 className="text-xl font-black text-gray-800">{current.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{current.description}</p>
          </div>

          {/* Étapes complétées */}
          {completed.length > 0 && (
            <div className="space-y-1.5">
              {completed.map(i => (
                <div key={i} className="flex items-center gap-2 text-xs text-green-600 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>{STEPS[i].title} ✓</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-100"
          >
            {isLast ? 'Commencer !' : 'Compris, suivant'}
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-xs text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
          >
            Passer le guide
          </button>
        </div>
      </div>
    </div>
  );
}
