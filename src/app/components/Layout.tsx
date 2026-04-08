import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Logo } from "./Logo";
import { LayoutDashboard, Egg, ShoppingCart, Bird, Heart, Moon, Sun, LogOut, Wallet, ChevronDown, Check, RefreshCw, Crown, Zap, Activity, Calculator, FlaskConical, Users } from "lucide-react";
import { useAuth, PoultryType, PoultryBreed } from "../AuthContext";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from "react";
import { NotificationCenter } from "./ui/NotificationCenter";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { poultryType, poultryBreed, updatePoultrySelection, user, logout, isDarkMode, toggleDarkMode, isSyncing, isPro, togglePro } = useAuth();
  
  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const activeBg = isCaille ? "bg-babs-emerald-light" : "bg-babs-orange-light";

  const navigation = [
    { name: "TABLEAU", short: "Board", href: "/", icon: LayoutDashboard },
    { name: "VOLAILLES", short: "Volailles", href: "/inventory", icon: Bird },
    ...(poultryType !== 'lapin' && poultryType !== 'pigeon' ? [
      { name: "PRODUCTION", short: "Production", href: "/eggs", icon: Egg },
      { name: "COUVOIR", short: "Couvoir", href: "/incubator", icon: Zap }
    ] : []),
    { name: "ALIMENTATION", short: "Aliment", href: "/feed", icon: ShoppingCart },
    { name: "SANTÉ", short: "Santé", href: "/health", icon: Heart },
    { name: "FINANCES", short: "Finances", href: "/finances", icon: Wallet },
    { name: "ÉQUIPE", short: "Équipe", href: "/team", icon: Users },
  ];

  const species = [
    { 
      type: 'poulet' as PoultryType, 
      label: 'Poulets', 
      icon: '🐔',
      breeds: [
        { id: 'goliath', label: 'Goliath' },
        { id: 'brahma', label: 'Brahma' },
        { id: 'cochin', label: 'Cochin' },
        { id: 'pondeuse', label: 'Pondeuse' },
        { id: 'chair', label: 'Poulet de chair' },
      ]
    },
    { 
      type: 'caille' as PoultryType, 
      label: 'Cailles', 
      icon: '🐦',
      breeds: []
    },
    {
      type: 'pigeon' as PoultryType,
      label: 'Pigeons',
      icon: '🕊️',
      breeds: []
    },
    {
      type: 'lapin' as PoultryType,
      label: 'Lapins',
      icon: '🐰',
      breeds: []
    }
  ];

  const handleSpeciesSelect = async (type: PoultryType, breed: PoultryBreed) => {
    await updatePoultrySelection(type, breed);
    navigate("/");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SpeciesSwitcher = ({ mobile = false }: { mobile?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button 
            className={`${mobile ? '' : 'ml-4'} px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-babs-brown transition-all group flex items-center gap-2 border border-transparent hover:border-gray-200 outline-none`}
          >
            <div className={`p-1 rounded-lg ${activeBg} ${accentColor} shadow-sm group-hover:scale-110 transition-transform`}>
              <Bird className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-tighter opacity-50 leading-none">Espèce</p>
              <p className="text-[10px] font-black text-babs-brown uppercase flex items-center gap-0.5 mt-0.5">
                {poultryType === 'caille' ? 'Cailles' : poultryType === 'pigeon' ? 'Pigeons' : poultryType === 'lapin' ? 'Lapins' : poultryType === 'poulet' ? (poultryBreed || 'Poulet') : 'Vue Globale'}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </p>
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="z-[100] min-w-[200px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[1.5rem] p-2 shadow-2xl border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200" 
            sideOffset={8}
            align={mobile ? "center" : "end"}
          >
            <DropdownMenu.Item
              className={`
                flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer outline-none mb-2
                ${poultryType === null ? 'bg-babs-brown text-white' : 'text-babs-brown hover:bg-gray-100 dark:hover:bg-white/5'}
              `}
              onClick={() => {
                handleSpeciesSelect(null, null);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                🏠 Vue Globale
              </div>
              {poultryType === null && <Check className="w-3.5 h-3.5" />}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-white/5 my-1.5 mx-2" />
            {species.map((spec) => (
              <div key={spec.type} className="mb-1 last:mb-0">
                <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span>{spec.icon}</span>
                  {spec.label}
                </div>
                
                {spec.breeds.length > 0 ? (
                  <div className="grid grid-cols-1 gap-0.5">
                    {spec.breeds.map((breed) => {
                      const isSelected = poultryType === spec.type && poultryBreed === breed.id;
                      return (
                        <DropdownMenu.Item
                          key={breed.id}
                          className={`
                            flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer outline-none
                            ${isSelected ? 'bg-babs-orange text-white' : 'text-babs-brown hover:bg-orange-50 dark:hover:bg-orange-900/20'}
                          `}
                          onClick={() => {
                            handleSpeciesSelect(spec.type, breed.id as PoultryBreed);
                            setIsOpen(false);
                          }}
                        >
                          {breed.label}
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </DropdownMenu.Item>
                      );
                    })}
                  </div>
                ) : (
                  <DropdownMenu.Item
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer outline-none
                      ${poultryType === spec.type ? 'bg-babs-emerald text-white' : 'text-babs-brown hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}
                    `}
                    onClick={() => {
                      handleSpeciesSelect(spec.type, null);
                      setIsOpen(false);
                    }}
                  >
                    Sélectionner {spec.label}
                    {poultryType === spec.type && <Check className="w-3.5 h-3.5" />}
                  </DropdownMenu.Item>
                )}
                {spec.type === 'poulet' && <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-white/5 my-1.5 mx-2" />}
              </div>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  };

  return (
    <div className="min-h-screen bg-babs-cream pb-20 sm:pb-0 sm:pt-0">
      {/* Dynamic Background Circle (Glassmorphism effect similar to screenshots) */}
      <div className="fixed top-0 left-0 w-full h-24 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md z-40 sm:hidden flex items-center justify-between px-6 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <SpeciesSwitcher mobile />
          {isSyncing && (
            <div className="flex items-center gap-1.5 ml-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800/30">
               <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
               <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Sync...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          {!isPro && (
            <button onClick={togglePro} className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Crown className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={toggleDarkMode}
            className="p-2 transition-transform active:scale-95"
            title={isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-babs-brown/60" />}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 hover:bg-red-100 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden sm:block bg-white dark:bg-gray-900 shadow-premium border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8 overflow-hidden">
            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
              <Logo className="w-10 h-10 lg:w-12 lg:h-12" />
              <h1 className="text-lg lg:text-xl font-bold text-babs-brown hidden xl:block">Sen Poulailler Pro</h1>
            </div>
            
            {/* Desktop Nav Links */}
            <nav className="flex items-center gap-3 lg:gap-6 overflow-x-auto no-scrollbar">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-[10px] lg:text-xs font-bold tracking-widest transition-colors whitespace-nowrap ${
                      isActive ? accentColor : "text-gray-400 hover:text-babs-brown"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <div className="shrink-0 flex items-center">
                <SpeciesSwitcher />
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 shrink-0 ml-4">
            <NotificationCenter />
            {isPro && (
              <button 
                onClick={togglePro}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-100 hover:scale-105 transition-transform"
                title="Désactiver le mode PRO"
              >
                <Crown className="w-3.5 h-3.5 fill-white" />
                <span className="text-[10px] font-black uppercase tracking-widest">PRO</span>
              </button>
            )}
            {!isPro && (
              <button onClick={togglePro} className="text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500 px-3 py-1.5 rounded-full hover:bg-amber-50">
                Upgrade
              </button>
            )}
            <button 
              onClick={toggleDarkMode}
              className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-babs-brown transition-colors group shrink-0"
              title={isDarkMode ? "Mode clair" : "Mode sombre"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="hidden xl:flex flex-col items-end justify-center min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {isSyncing && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
                  Connecté
                </p>
              </div>
              <p className="text-[11px] font-bold text-babs-brown truncate max-w-[120px]" title={user?.email || ""}>
                {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100 dark:border-white/5 h-8 shrink-0">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 group transition-all"
                title="Se déconnecter"
              >
                <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-red-500">
                  Quitter
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Adjusted padding for top header on mobile */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-28 sm:pt-8 min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 px-4 py-4 z-50 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2rem]">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${
                isActive ? `${accentColor} scale-110` : "text-gray-400 hover:text-babs-brown"
              }`}
            >
              <div className={`p-2.5 rounded-2xl transition-all ${isActive ? `${activeBg} shadow-sm` : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[8px] font-black tracking-widest uppercase ${isActive ? "opacity-100" : "opacity-40"}`}>
                {item.short}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Signature */}
      <footer className="max-w-7xl mx-auto px-6 py-12 text-center">
        <div className="h-px w-20 bg-gray-100 dark:bg-white/10 mx-auto mb-6" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
          Propriété de Babs Farmer
        </p>
        <p className="text-[9px] font-bold text-gray-300 dark:text-gray-600">
          © {new Date().getFullYear()} Poulailler Pro • Système de Pilotage d'Excellence
        </p>
      </footer>
    </div>
  );
}
