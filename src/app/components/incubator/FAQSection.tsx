import { useState } from 'react';
import { ChevronDown, Globe, FileText, HelpCircle } from 'lucide-react';
import { FAQ_ITEMS } from './types';

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-babs-brown">FAQ</h2>
        <p className="text-gray-400 text-sm font-bold">Réponses à vos questions d'incubation</p>
      </div>

      {/* External links */}
      <div className="space-y-3">
        <a
          href="https://poultryhatching.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5 hover:border-blue-200 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-babs-brown">Poultry Hatch</p>
              <p className="text-[10px] text-gray-400 font-bold">Informations quotidiennes sur l'élevage et l'éclosion</p>
            </div>
          </div>
          <div className="p-2 bg-blue-500 rounded-xl text-white group-hover:bg-blue-600 transition-colors">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </div>
        </a>

        <div className="flex items-center justify-between bg-card rounded-2xl p-5 shadow-premium border border-gray-50 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-babs-brown">Guide PDF Incubation</p>
              <p className="text-[10px] text-gray-400 font-bold">Questions & Réponses pour les aviculteurs</p>
              <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx} className="rounded-2xl overflow-hidden border border-gray-50 dark:border-white/5">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className={`w-full flex items-center justify-between p-4 text-left transition-all ${
                openIdx === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-card hover:bg-blue-50 text-babs-brown'
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className={`w-5 h-5 flex-shrink-0 ${openIdx === idx ? 'text-blue-200' : 'text-blue-500'}`} />
                <span className="text-sm font-black">{item.q}</span>
              </div>
              <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === idx && (
              <div className="p-5 bg-card animate-in slide-in-from-top-2 duration-200">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
