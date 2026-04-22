import React, { useState } from 'react';
import { Crown, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal';

interface ProFeatureOverlayProps {
  title: string;
  description: string;
  children: React.ReactNode;
  hasAccess: boolean;
}

export function ProFeatureOverlay({ title, description, children, hasAccess }: ProFeatureOverlayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative min-h-[380px] md:min-h-[450px] w-full rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xl">
      {/* Blurred Content Placeholder */}
      <div className="absolute inset-0 blur-2xl opacity-20 pointer-events-none grayscale dark:opacity-10">
        {children}
      </div>

      {/* Decorative center element with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white dark:via-zinc-900/40 dark:to-zinc-900 pointer-events-none"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Actual CTA Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative mb-6 md:mb-8 scale-75 md:scale-90">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-125 animate-pulse"></div>
            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-[2rem] shadow-[0_20px_50px_rgba(245,158,11,0.25)] flex items-center justify-center border border-white/40 backdrop-blur-md">
              <Crown className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-md" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 md:w-10 md:h-10 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 ring-4 ring-white dark:ring-zinc-900">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
            </div>
        </div>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-['Syne'] font-black text-gray-900 dark:text-white mb-3 md:mb-4 tracking-tighter uppercase italic px-2">
          Module <span className="text-amber-500">{title}</span>
        </h2>
        
        <p className="max-w-md text-xs md:text-base text-gray-600 dark:text-zinc-400 font-bold leading-relaxed mb-6 md:mb-10 text-balance px-4">
          {description}
        </p>

        <div className="flex flex-col gap-3 md:gap-4 w-full max-w-[280px] md:max-w-[320px]">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="group relative w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 md:gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                <span className="tracking-tight uppercase text-sm md:text-base">Débloquer l'Accès PRO</span>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em]">
                À partir de 5.000 FCFA / mois
            </p>
        </div>

        {/* Benefits Quick List - Hidden on small mobile to avoid overflow */}
        <div className="hidden sm:flex mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-100 dark:border-zinc-800 w-full max-w-sm items-center justify-center gap-8">
             <div className="flex items-center gap-2.5 text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                Historique PRO
             </div>
             <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-zinc-700"></div>
             <div className="flex items-center gap-2.5 text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                Analyses ROI
             </div>
        </div>
      </div>

      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
