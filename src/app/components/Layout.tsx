import { Outlet, useLocation, useNavigate } from "react-router";
/** Version: 1.0.2 */
import { useAuth, PoultryType } from "../AuthContext";
import { NotificationCenter } from "./ui/NotificationCenter";
import { useEffect, useState } from "react";
import { breedList } from "../constants";
import { Logo } from "./Logo";
import { motion, AnimatePresence } from "framer-motion";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    poultryTypes, 
    selectedBreeds, 
    activeSpeciesFilter, 
    setActiveSpeciesFilter,
    activeBreedFilter, 
    setActiveBreedFilter, 
    isDarkMode, 
    toggleDarkMode 
  } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const speciesList = [
    { id: 'poulet' as PoultryType, abbr: 'PL', label: 'Poulet' },
    { id: 'caille' as PoultryType, abbr: 'CL', label: 'Caille' },
  ].filter(s => poultryTypes.some(pt => pt?.toLowerCase() === s.id));

  const showAllOption = poultryTypes.length > 1;

  // Auto-ajustement du filtre UNIQUEMENT si aucune préférence n'a été sauvegardée
  useEffect(() => {
    if (poultryTypes.length === 0) return;
    
    const savedFilter = localStorage.getItem('active_species_filter');
    
    // Si une préférence existe et est valide pour les espèces actuelles, on la respecte
    if (savedFilter && savedFilter !== 'all') {
      // Vérifier que la préférence sauvegardée correspond à une espèce disponible
      if (poultryTypes.includes(savedFilter as PoultryType)) {
        return; // On garde le filtre sauvegardé tel quel
      }
    }
    
    // Pas de préférence ou préférence invalide : logique par défaut
    if (poultryTypes.length === 1) {
      // Un seul type : on le sélectionne directement
      setActiveSpeciesFilter(poultryTypes[0]);
    }
    // Si plusieurs types et pas de préférence : on reste sur 'all'
  }, [poultryTypes]);

  const handleSpeciesSelect = (type: PoultryType | 'all') => {
    setActiveSpeciesFilter(type);
    if (type !== 'poulet') setActiveBreedFilter(null);
  };

  const handleBreedSelect = (breed: string | null) => {
    setActiveBreedFilter(breed);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'solar:widget-linear', path: '/' },
    { id: 'inventory', label: 'Effectif', icon: 'solar:users-group-rounded-linear', path: '/inventory' },
    { id: 'eggs', label: 'Production', icon: 'ph:egg-bold', path: '/eggs' },
    { id: 'feed', label: 'Aliment', icon: 'solar:leaf-linear', path: '/feed' },
    { id: 'incubator', label: 'Couvaison', icon: 'solar:fire-linear', path: '/incubator' },
    { id: 'finance', label: 'Finances', icon: 'solar:wallet-linear', path: '/finances' },
    { id: 'health', label: 'Santé', icon: 'solar:heart-bold-duotone', path: '/health' },
    { id: 'selection', label: 'Configuration', icon: 'solar:settings-bold-duotone', path: '/selection' },
    { id: 'settings', label: 'Équipe', icon: 'solar:users-group-two-rounded-linear', path: '/team' },
  ];

  const safePoultryTypes = poultryTypes && poultryTypes.length > 0 ? poultryTypes : ['poulet'];
  const primaryType = activeSpeciesFilter === 'all' ? safePoultryTypes[0] : activeSpeciesFilter;
  const isMixed = activeSpeciesFilter === 'all';
  const accentColorClass = isMixed ? 'indigo' : primaryType === 'caille' ? 'emerald' : 'orange';
  const accentHex = isMixed ? '#6366F1' : primaryType === 'caille' ? '#10B981' : '#F59E0B';

  const activeSpeciesInfo = speciesList.find(s => s.id === activeSpeciesFilter);
  const breedInfo = activeBreedFilter ? [...breedList.poulet, ...breedList.caille].find(b => b.id === activeBreedFilter) : null;

  const dynamicTitle = activeSpeciesFilter === 'all' 
    ? 'P-Pro'
    : breedInfo 
        ? `${activeSpeciesInfo?.label}s : ${breedInfo.label}`
        : `Mes ${activeSpeciesInfo?.label}s`;

  const { logout } = useAuth();

  return (
    <div className={`flex min-h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#E5E7EB] text-gray-900'}`}>
      
      {/* Sidebar - Desktop Only */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-screen border-r transition-colors duration-300 z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
        <div className="p-6 flex items-center gap-3">
            <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-all duration-500 ${
                    isMixed
                        ? 'bg-gray-800 text-white shadow-gray-500/20'
                        : `bg-${accentColorClass}-500 text-white shadow-${accentColorClass}-500/20`
                }`}>
                    <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[10px] font-bold">
                        {isMixed ? '🌍' : activeSpeciesFilter === 'caille' ? '🥚' : '🐓'}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {isMixed ? 'Élevage' : activeSpeciesFilter === 'caille' ? 'Caille' : 'Poulet'}
                    </span>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                            isActive 
                                ? isDarkMode ? `bg-zinc-800 text-${accentColorClass}-400 shadow-sm` : `bg-${accentColorClass}-50 text-${accentColorClass}-600 shadow-sm`
                                : isDarkMode ? 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <iconify-icon 
                            icon={item.icon} 
                            className={`text-xl transition-colors ${isActive ? `text-${accentColorClass}-500` : 'text-current opacity-70 group-hover:opacity-100'}`}
                        ></iconify-icon>
                        <span className={`text-sm font-medium ${isActive ? 'translate-x-1' : ''} transition-transform`}>{item.label}</span>
                    </button>
                )
            })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
            <button onClick={toggleDarkMode} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${isDarkMode ? 'bg-zinc-800 text-amber-400' : 'bg-gray-100 text-gray-600'}`}>
                <iconify-icon icon={isDarkMode ? "solar:sun-bold-duotone" : "solar:moon-linear"} class="text-xl"></iconify-icon>
                <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={logout} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}>
                <iconify-icon icon="solar:logout-3-linear" class="text-xl"></iconify-icon>
                <span className="text-sm font-medium">Déconnexion</span>
            </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`flex-1 relative flex flex-col min-h-screen md:pl-64 font-['DM_Sans'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-[#F9FAFB]'}`}>
          
        {/* Top Header - Fixed & Dynamic */}
        <header className={`fixed top-0 inset-x-0 md:left-64 z-40 backdrop-blur-md border-b pt-safe transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-100'}`}>
            <div className="max-w-5xl mx-auto w-full flex flex-col px-4">
                <div className="flex items-center justify-between h-16">
                     {/* Mobile Burger & Title only (no logo) */}
                     <div className="flex items-center gap-2 md:hidden shrink-0">
                         <button 
                            onClick={() => setIsDrawerOpen(true)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'}`}
                         >
                            <iconify-icon icon="solar:hamburger-menu-linear" class="text-xl"></iconify-icon>
                         </button>
                         <span
                            onClick={() => navigate('/')}
                            className={`font-['Syne'] font-bold text-sm cursor-pointer ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}
                         >
                            {dynamicTitle}
                         </span>
                     </div>

                     {/* Species Switcher - Hidden on global screens or if single species */}
                     {poultryTypes.length > 1 && !['/finances', '/feed', '/incubator', '/health', '/selection'].includes(location.pathname) && (
                         <div className="flex-1 overflow-x-auto no-scrollbar mx-0 select-none">
                             <div className="flex gap-1.5 w-max">
                                {showAllOption && (
                                    <button 
                                        onClick={() => handleSpeciesSelect('all')} 
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition-all duration-300 text-xs sm:text-sm ${
                                            activeSpeciesFilter === 'all'
                                                ? `bg-zinc-800 border-zinc-700 text-white shadow-lg scale-105 font-bold`
                                                : isDarkMode 
                                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        🌍 Tous
                                    </button>
                                )}
                                {speciesList.map((s) => {
                                    const isActive = s.id === activeSpeciesFilter;
                                    const sAccent = s.id === 'caille' ? 'emerald' : 'orange';
                                    return (
                                        <button 
                                            key={s.id}
                                            onClick={() => handleSpeciesSelect(s.id)} 
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs sm:text-sm ${
                                                isActive 
                                                    ? `bg-${sAccent}-500 border-${sAccent}-500 text-white shadow-lg shadow-${sAccent}-500/20 scale-105`
                                                    : isDarkMode 
                                                        ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={`hidden sm:flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-['Syne'] font-bold ${
                                                isActive ? 'bg-white/20 text-white' : isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {s.abbr}
                                            </span>
                                            <span className={isActive ? 'font-bold' : 'font-medium'}>{s.label}</span>
                                        </button>
                                    );
                                })}
                             </div>
                         </div>
                     )}

                     {/* Actions */}
                     <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <NotificationCenter />
                    </div>
                </div>

                {/* Dynamic Breed Sub-switcher - Hidden on global screens */}
                {activeSpeciesFilter !== 'all' && 
                 breedList[activeSpeciesFilter]?.length > 0 && 
                 !['/finances', '/feed', '/incubator', '/health'].includes(location.pathname) && (
                    <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2 duration-300 border-t border-gray-50 dark:border-zinc-800/50">
                        <button
                            onClick={() => handleBreedSelect(null)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                                !activeBreedFilter 
                                    ? `bg-${accentColorClass}-600 border-${accentColorClass}-600 text-white shadow-md` 
                                    : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-400 hover:border-gray-300'
                            }`}
                        >
                            Tous
                        </button>
                        {selectedBreeds.filter(b => activeSpeciesFilter !== 'all' && breedList[activeSpeciesFilter]?.some(bl => bl.id === b)).map((b) => {
                            const bInfo = activeSpeciesFilter !== 'all' ? breedList[activeSpeciesFilter].find(bl => bl.id === b) : null;
                            const label = bInfo ? bInfo.label : b;
                            const isCurrentBreed = activeBreedFilter === b;
                            return (
                                <button
                                    key={b}
                                    onClick={() => handleBreedSelect(b)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                                        isCurrentBreed 
                                            ? `bg-${accentColorClass}-100 dark:bg-${accentColorClass}-900/30 border-${accentColorClass}-200 dark:border-${accentColorClass}-700 text-${accentColorClass}-700 dark:text-${accentColorClass}-400` 
                                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-400 hover:border-gray-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
                
                {activeSpeciesFilter === 'all' && !['/finances', '/feed', '/incubator', '/health'].includes(location.pathname) && (
                   <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2 duration-300 border-t border-gray-100 dark:border-zinc-800/50">
                        <p className="text-[10px] font-black text-gray-900 dark:text-zinc-300 flex items-center px-2 uppercase tracking-[0.1em]">Filtres :</p>
                        {['fermier', 'ornement', 'japon', 'chine'].filter(b => selectedBreeds.includes(b)).map((b) => {
                            const bInfo = [...breedList.poulet, ...breedList.caille].find(bl => bl.id === b);
                            const isCurrent = activeBreedFilter === b;
                            const bAccent = breedList.poulet.some(bl => bl.id === b) ? 'orange' : 'emerald';
                            return (
                                <button
                                    key={b}
                                    onClick={() => handleBreedSelect(b)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                                        isCurrent 
                                            ? `bg-${bAccent}-100 dark:bg-${bAccent}-900/30 border-${bAccent}-200 dark:border-${bAccent}-700 text-${bAccent}-700 dark:text-${bAccent}-400` 
                                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-400 hover:border-gray-300'
                                    }`}
                                >
                                    {bInfo?.label || b}
                                </button>
                            );
                        })}
                     </div>
                )}
            </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 w-full max-w-5xl mx-auto ${ 
            ['/finances', '/feed', '/incubator', '/health'].includes(location.pathname) 
            ? 'pt-24' 
            : (activeSpeciesFilter === 'poulet' || (activeSpeciesFilter === 'all' && poultryTypes.includes('poulet'))) ? 'pt-[8.5rem]' : 'pt-24'
        } pb-28 md:pb-8 px-4 scroll-smooth min-h-screen`}>
            <Outlet />
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <nav className={`md:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-md border-t pb-safe transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]' : 'bg-white/90 border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]'}`}>
            <div className="flex justify-around items-center h-24 px-4 pb-4">
                {[
                  { id: 'dashboard', label: 'Home', icon: 'solar:widget-linear', path: '/' },
                  { id: 'inventory', label: 'Effectif', icon: 'solar:users-group-rounded-linear', path: '/inventory' },
                  { id: 'eggs', label: 'Ponte', icon: 'ph:egg-bold', path: '/eggs' },
                  { id: 'health', label: 'Santé', icon: 'solar:heart-bold-duotone', path: '/health' },
                  { id: 'feed', label: 'Aliment', icon: 'solar:leaf-linear', path: '/feed' },
                ].map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button 
                            key={item.id}
                            onClick={() => navigate(item.path)} 
                            className="flex flex-col items-center gap-1.5 w-16 p-1 rounded-2xl transition-all relative"
                        >
                            <div className={`p-2.5 rounded-2xl transition-all ${isActive ? isDarkMode ? 'bg-zinc-800' : `bg-${accentColorClass}-500 text-white shadow-sm` : ''}`}>
                                <iconify-icon 
                                icon={item.icon} 
                                className={`text-2xl ${isActive ? 'text-white' : isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}
                                ></iconify-icon>
                            </div>
                            <span className={`text-[10px] font-bold tracking-tight ${isActive ? `text-${accentColorClass}-500` : isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                              {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>

        {/* Mobile Sidebar Overlay (Drawer) */}
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsDrawerOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                    />
                    <motion.aside 
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`fixed top-0 left-0 bottom-0 w-[280px] z-[101] md:hidden shadow-2xl flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
                    >
                        <div className="p-6 flex items-center justify-between border-b dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <Logo className="w-10 h-10" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-orange-500 uppercase tracking-tighter">Poulailler Pro</span>
                                    <span className="text-[10px] text-gray-500 font-medium">Gestion d'Élevage</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDrawerOpen(false)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}
                            >
                                <iconify-icon icon="solar:close-circle-linear" class="text-xl"></iconify-icon>
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                            {navItems.filter(item => !['dashboard', 'inventory', 'eggs', 'health', 'feed'].includes(item.id)).map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            navigate(item.path);
                                            setIsDrawerOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                                            isActive 
                                                ? isDarkMode ? `bg-zinc-800 text-${accentColorClass}-400` : `bg-${accentColorClass}-50 text-${accentColorClass}-600`
                                                : isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                                        }`}
                                    >
                                        <iconify-icon 
                                            icon={item.icon} 
                                            className={`text-2xl ${isActive ? `text-${accentColorClass}-500` : 'opacity-70'}`}
                                        ></iconify-icon>
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t dark:border-zinc-800 space-y-2">
                             <button onClick={() => { toggleDarkMode(); setIsDrawerOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isDarkMode ? 'bg-zinc-800 text-amber-400' : 'bg-gray-100 text-gray-600'}`}>
                                <iconify-icon icon={isDarkMode ? "solar:sun-bold-duotone" : "solar:moon-linear"} class="text-xl"></iconify-icon>
                                <span className="text-sm font-bold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                            <button onClick={logout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}>
                                <iconify-icon icon="solar:logout-3-linear" class="text-xl"></iconify-icon>
                                <span className="text-sm font-bold">Déconnexion</span>
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
