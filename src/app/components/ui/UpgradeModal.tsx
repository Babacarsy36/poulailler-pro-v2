import { Crown, Check, X, ShieldCheck, Zap, BarChart3, FlaskConical, ChevronRight } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { useState } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [isupgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { setTierAction } = useAuth();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await setTierAction('PRO');
      setIsUpgrading(false);
      setShowSuccess(true);
      
      // Auto-close after animation
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 1500);
    } catch (e) {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative flex flex-col md:flex-row border border-white/10 scroll-smooth">
        
        {/* Left Side: Luxury Branding */}
        <div className="bg-zinc-900 md:w-5/12 p-6 md:p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-300 to-amber-600 rounded-2xl shadow-[0_10px_30px_-5px_rgba(245,158,11,0.4)] flex items-center justify-center mb-6 md:mb-8 rotate-3">
              <Crown className="w-6 h-6 md:w-9 md:h-9 text-zinc-900 fill-zinc-900" />
            </div>
            <h2 className="text-2xl md:text-3xl font-['Syne'] font-extrabold mb-3 md:mb-4 leading-tight tracking-tight">
              Passez à <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">l'Excellence PRO</span>
            </h2>
            <p className="text-[10px] md:text-xs font-medium text-zinc-400 leading-relaxed max-w-[180px]">
              Optimisez chaque aspect de votre exploitation avec nos technologies de pointe.
            </p>
          </div>

          <div className="mt-8 md:mt-12 space-y-4 relative z-10 border-t border-white/5 pt-6 md:pt-8">
            <div className="flex items-center gap-3">
               <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center">
                 <ShieldCheck className="w-4 h-4 text-amber-400" />
               </div>
               <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Paiement 100% Sécurisé</p>
            </div>
          </div>
        </div>

        {/* Right Side: Features & Action */}
        <div className="md:w-7/12 p-6 md:p-12 bg-white dark:bg-zinc-900 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6 md:space-y-10">
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-6 md:mb-8 border-l-2 border-amber-600 pl-3">
                Privilèges de Membre
              </p>
              
              <div className="space-y-4 md:space-y-6">
                <FeatureItem 
                  icon={<FlaskConical className="w-5 h-5" />} 
                  color="text-amber-500"
                  bg="bg-amber-50 dark:bg-amber-500/10"
                  title="Couvoir Illimité" 
                  desc="Gérez des cycles d'incubation complexes sans aucune restriction." 
                />
                <FeatureItem 
                  icon={<BarChart3 className="w-5 h-5" />} 
                  color="text-emerald-500"
                  bg="bg-emerald-50 dark:bg-emerald-500/10"
                  title="Analyses Prédictives" 
                  desc="Anticipez vos besoins en aliment et maximisez votre taux de ponte." 
                />
                <FeatureItem 
                  icon={<Zap className="w-5 h-5" />} 
                  color="text-blue-500"
                  bg="bg-blue-50 dark:bg-blue-500/10"
                  title="Expérience Épurée" 
                  desc="Zéro publicité, zéro distraction. Juste l'essentiel pour votre ferme." 
                />
              </div>
            </div>

            <div className="pt-2 md:pt-4">
               <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-5 md:p-6 mb-6 md:mb-8 border border-zinc-100 dark:border-white/5 relative group transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-['Syne'] font-extrabold text-zinc-900 dark:text-white tracking-tighter">5.000</span>
                    <span className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">FCFA / MOIS</span>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-zinc-400 font-medium mt-2 flex items-center gap-1.5 italic">
                    <Check className="w-3 h-3 text-emerald-500" /> Annulable à tout moment. Satisfait ou remboursé.
                  </p>
                  <div className="absolute top-4 right-6 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest">Best Value</div>
               </div>

               <button 
                onClick={handleUpgrade}
                disabled={isupgrading || showSuccess}
                className={`w-full group ${showSuccess ? 'bg-emerald-500 scale-105' : 'bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-600'} text-white dark:text-zinc-900 font-bold py-4 md:py-5 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 text-base md:text-lg ${isupgrading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 active:scale-95'}`}
               >
                 {isupgrading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : showSuccess ? (
                    <div className="flex items-center gap-2 animate-in zoom-in-95 duration-300">
                      <Check className="w-6 h-6 text-white" />
                      <span>Félicitations !</span>
                    </div>
                 ) : (
                    <>
                      <span>Activer l'Expérience PRO</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, color, bg, title, desc }: { icon: any, color: string, bg: string, title: string, desc: string }) {
  return (
    <div className="flex gap-5 group items-center">
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
        {icon}
      </div>
      <div>
        <p className="font-['Syne'] font-bold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight">{title}</p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-[240px] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
