import { Crown, Check, X, ShieldCheck, Zap, BarChart3, FlaskConical } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { useState } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [isupgrading, setIsUpgrading] = useState(false);
  const { togglePro } = useAuth();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await togglePro();
      // Short delay to show the success toast before closing
      setTimeout(() => {
        setIsUpgrading(false);
        onClose();
      }, 500);
    } catch (e) {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-babs-brown/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 relative flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="bg-babs-brown md:w-5/12 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-amber-400 rounded-2xl shadow-xl flex items-center justify-center mb-6">
              <Crown className="w-10 h-10 text-babs-brown fill-babs-brown" />
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight">Passez à l'Excellence <span className="text-amber-400">PRO</span></h2>
            <p className="text-xs font-bold text-gray-400 leading-relaxed">Boostez la productivité de votre ferme avec nos outils de pilotage avancés.</p>
          </div>

          <div className="mt-12 space-y-4 relative z-10">
            <div className="flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-amber-400" />
               <p className="text-[10px] font-black uppercase tracking-widest">Paiement sécurisé</p>
            </div>
          </div>
        </div>

        {/* Right Side: Features & Action */}
        <div className="md:w-7/12 p-10 bg-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6">Avantages Exclusifs</p>
              
              <div className="space-y-5">
                <FeatureItem 
                  icon={<FlaskConical className="w-5 h-5 text-babs-orange" />} 
                  title="Couvoir Illimité" 
                  desc="Gérez autant de cycles d'incubation que nécessaire." 
                />
                <FeatureItem 
                  icon={<BarChart3 className="w-5 h-5 text-emerald-500" />} 
                  title="Analyses Avancées" 
                  desc="Graphiques de performance et taux de conversion alimentaire." 
                />
                <FeatureItem 
                  icon={<Zap className="w-5 h-5 text-blue-500" />} 
                  title="Zéro Publicité" 
                  desc="Une interface épurée pour une concentration maximale." 
                />
              </div>
            </div>

            <div className="pt-6">
               <div className="bg-gray-50 rounded-3xl p-6 mb-6 border border-gray-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-babs-brown">5.000</span>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">FCFA / mois</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 italic">Satisfait ou remboursé sous 7 jours.</p>
               </div>

               <button 
                onClick={handleUpgrade}
                disabled={isupgrading}
                className={`w-full bg-babs-orange hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 text-lg ${isupgrading ? 'opacity-70 cursor-not-allowed' : ''}`}
               >
                 {isupgrading && <Zap className="w-5 h-5 animate-pulse" />}
                 {isupgrading ? "Validation..." : "Confirmer l'Abonnement"}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-black text-babs-brown text-sm">{title}</p>
        <p className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
