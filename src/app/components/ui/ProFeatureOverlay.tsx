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
    <div className="relative min-h-[400px] w-full rounded-[2.5rem] overflow-hidden bg-gray-50/50 border border-gray-100">
      {/* Blurred Content Placeholder */}
      <div className="absolute inset-0 blur-xl opacity-30 pointer-events-none grayscale">
        {children}
      </div>

      {/* Decorative center element */}
      <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>

      {/* Actual CTA Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-600 rounded-3xl shadow-2xl flex items-center justify-center rotate-6 border border-white/20">
              <Crown className="w-10 h-10 text-white fill-white/20" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-['Syne'] font-extrabold text-zinc-900 mb-3 tracking-tight">
          Module <span className="text-amber-600">{title}</span>
        </h2>
        
        <p className="max-w-sm text-sm text-gray-500 font-medium leading-relaxed mb-10 text-balance">
          {description}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="group w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl shadow-xl transition-all hover:bg-zinc-800 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Débloquer l'Accès PRO</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                À partir de 5.000 FCFA / mois
            </p>
        </div>

        {/* Benefits Quick List */}
        <div className="mt-12 pt-8 border-t border-gray-200/60 w-full max-w-sm grid grid-cols-2 gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                Historique Illimité
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                Analyses Graphiques
             </div>
        </div>
      </div>

      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
