import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Bird, Egg, Leaf, ShieldCheck, Heart } from "lucide-react";

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Bienvenue sur Poulailler Pro !",
    description: "L'assistant intelligent qui veille sur votre élevage comme si c'était le sien. Découvrons ensemble comment il va vous simplifier la vie.",
    icon: <Heart className="w-12 h-12 text-rose-500" />,
    color: "bg-rose-50",
    textColor: "text-rose-900"
  },
  {
    title: "Identifiez vos bêtes",
    description: "Enregistrez vos lots de poulets ou cailles. L'app calculera automatiquement leur âge et l'aliment idéal pour chaque étape de leur croissance.",
    icon: <Bird className="w-12 h-12 text-indigo-500" />,
    color: "bg-indigo-50",
    textColor: "text-indigo-900"
  },
  {
    title: "Suivez votre production",
    description: "Notez vos récoltes d'œufs chaque jour en un clic. Nous analysons votre taux de ponte pour vous alerter en cas de baisse anormale.",
    icon: <Egg className="w-12 h-12 text-emerald-500" />,
    color: "bg-emerald-50",
    textColor: "text-emerald-900"
  },
  {
    title: "Gérez l'alimentation",
    description: "Fini les ruptures de stock ! L'app vous prévient quand votre réserve d'aliment est presque vide et calcule les rations journalières.",
    icon: <Leaf className="w-12 h-12 text-orange-500" />,
    color: "bg-orange-50",
    textColor: "text-orange-900"
  },
  {
    title: "Tout est sauvegardé",
    description: "Même si vous perdez votre téléphone, vos données sont en sécurité dans votre compte. Vous pouvez aussi travailler hors-ligne.",
    icon: <ShieldCheck className="w-12 h-12 text-blue-500" />,
    color: "bg-blue-50",
    textColor: "text-blue-900"
  }
];

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 px-4 py-6">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-gray-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-16 pb-8 px-8 sm:px-12 text-center flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className={`w-24 h-24 rounded-3xl ${steps[currentStep].color} flex items-center justify-center mx-auto mb-6 shadow-sm border border-white/50`}>
                {steps[currentStep].icon}
              </div>

              <h2 className={`font-['Syne'] text-2xl sm:text-3xl font-black ${steps[currentStep].textColor} tracking-tight leading-tight`}>
                {steps[currentStep].title}
              </h2>

              <p className="text-gray-600 font-['DM_Sans'] text-base leading-relaxed">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between w-full mt-10 gap-4">
            <button
              onClick={prev}
              className={`p-4 rounded-2xl border border-gray-100 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>

            <button
              onClick={next}
              className="flex-1 bg-gray-900 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-gray-200 active:scale-95 transition-all hover:bg-gray-800"
            >
              {currentStep === steps.length - 1 ? "C'est parti !" : "Continuer"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center border-t border-gray-100">
           Poulailler Pro • Aide au démarrage
        </div>
      </motion.div>
    </div>
  );
}
