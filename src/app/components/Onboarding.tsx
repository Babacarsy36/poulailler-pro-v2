// src/app/components/Onboarding.tsx
import { useState } from 'react';
import { Bird, Egg, Wheat, Heart, Wallet, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: Heart,
    color: 'bg-rose-50 text-rose-500',
    title: 'Bienvenue sur Poulailler Pro !',
    description: "L'assistant intelligent qui veille sur votre élevage comme si c'était le sien. Découvrons ensemble comment il va vous simplifier la vie.",
  },
  {
    icon: Bird,
    color: 'bg-orange-50 text-orange-500',
    title: 'Gérez votre effectif',
    description: "Enregistrez vos lots de volailles en un clin d'œil. Suivez leur croissance, leur âge et leur état de santé au jour le jour.",
  },
  {
    icon: Wheat,
    color: 'bg-amber-50 text-amber-500',
    title: 'Optimisez l\'alimentation',
    description: "Ne soyez plus jamais surpris par une rupture de stock. L'application calcule vos besoins et vous alerte quand il est temps de racheter.",
  },
  {
    icon: Egg,
    color: 'bg-yellow-50 text-yellow-600',
    title: 'Suivez la production',
    description: "Notez vos récoltes d'œufs quotidiennement. Visualisez vos performances de ponte et identifiez vos meilleurs lots.",
  },
  {
    icon: Wallet,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Maîtrisez vos finances',
    description: "Gardez un œil sur vos dépenses et vos revenus. Calculez votre rentabilité réelle pour faire grandir votre exploitation.",
  },
];

export function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Close Button */}
        <button 
          onClick={handleSkip}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Barre de progression (Stepper) */}
        <div className="flex gap-2 px-8 pt-8 pb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-zinc-900' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 px-8 py-10 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-8"
            >
              {/* Icon Container */}
              <div className={`w-24 h-24 ${current.color} rounded-[2rem] flex items-center justify-center shadow-sm`}>
                <Icon className="w-10 h-10" strokeWidth={2.5} />
              </div>

              {/* Text Content */}
              <div className="space-y-4">
                <h2 className="text-[1.75rem] font-black text-[#6B1D2E] leading-tight font-['Syne']">
                  {current.title}
                </h2>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {current.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer & Action */}
        <div className="px-8 pb-10 space-y-8">
          <button
            onClick={handleNext}
            className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all active:scale-[0.98] group"
          >
            <span>{isLast ? 'Commencer maintenant' : 'Continuer'}</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="text-center">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] font-['DM_Sans']">
                POULAILLER PRO • AIDE AU DÉMARRAGE
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
