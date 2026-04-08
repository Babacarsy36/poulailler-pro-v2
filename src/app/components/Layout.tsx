import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth, PoultryType, PoultryBreed } from "../AuthContext";
import { NotificationCenter } from "./ui/NotificationCenter";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { poultryType, updatePoultrySelection, isDarkMode, toggleDarkMode } = useAuth();
  
  const speciesList = [
    { id: 'poulet' as PoultryType, abbr: 'PL', label: 'Poulet' },
    { id: 'caille' as PoultryType, abbr: 'CL', label: 'Caille' },
    { id: 'pigeon' as PoultryType, abbr: 'PG', label: 'Pigeon' },
    { id: 'lapin' as PoultryType, abbr: 'LP', label: 'Lapin' }
  ];

  const handleSpeciesSelect = async (type: PoultryType) => {
    await updatePoultrySelection(type, null as PoultryBreed);
    navigate("/");
  };

  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: 'solar:widget-linear', path: '/' },
    { id: 'inventory', label: 'Stock', icon: 'solar:box-linear', path: '/inventory' },
    { id: 'feed', label: 'Aliment', icon: 'solar:leaf-linear', path: '/feed' },
    { id: 'finance', label: 'Finance', icon: 'solar:wallet-linear', path: '/finances' },
    { id: 'settings', label: 'Menu', icon: 'solar:settings-linear', path: '/team' },
  ];

  return (
    <div className={`flex justify-center min-h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-[#E5E7EB]'}`}>
      {/* Mobile App Wrapper */}
      <div className={`w-full max-w-md relative shadow-2xl flex flex-col h-screen overflow-hidden font-['DM_Sans'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-[#F9FAFB] text-gray-900'}`}>
          
        {/* Top Header */}
        <header className={`absolute top-0 inset-x-0 z-40 backdrop-blur-md border-b pt-safe transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-100'}`}>
            <div className="flex items-center justify-between px-4 h-16">
                {/* Logo & Indicator */}
                <div className="flex items-center gap-2">
                    <span className={`font-['Syne'] font-medium text-lg tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>PLP</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-indicator"></div>
                </div>

                {/* Species Switcher */}
                <div className="flex-1 overflow-x-auto no-scrollbar mx-3 select-none">
                    <div className="flex gap-2 w-max">
                        {speciesList.map((s) => {
                            const isActive = (!poultryType && s.id === 'poulet') || s.id === poultryType;
                            return (
                                <button 
                                    key={s.id}
                                    onClick={() => handleSpeciesSelect(s.id)} 
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 text-sm ${
                                        isActive 
                                            ? isDarkMode 
                                                ? 'bg-zinc-100 border-zinc-100 text-zinc-900 shadow-sm scale-105'
                                                : 'bg-gray-900 border-gray-900 text-white shadow-sm scale-105' 
                                            : isDarkMode 
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-['Syne'] font-medium tracking-tight ${
                                        isActive 
                                            ? isDarkMode ? 'bg-zinc-900/20 text-zinc-900' : 'bg-white/20 text-white'
                                            : isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {s.abbr}
                                    </span>
                                    <span className={`text-xs ${isActive ? 'font-medium' : 'font-light'}`}>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Actions: Dark Mode + Notifications */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleDarkMode}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-zinc-800 text-amber-400 hover:bg-zinc-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    aria-label="Basculer le mode sombre"
                  >
                    <iconify-icon 
                      icon={isDarkMode ? "solar:sun-bold-duotone" : "solar:moon-linear"} 
                      class="text-lg"
                    ></iconify-icon>
                  </button>
                  {/* Notifications */}
                  <div className="relative">
                    <NotificationCenter />
                  </div>
                </div>
            </div>
        </header>

        {/* Main Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto no-scrollbar pt-20 pb-28 px-4 scroll-smooth">
            <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className={`absolute bottom-0 inset-x-0 z-50 backdrop-blur-md border-t pb-safe select-none transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800 shadow-[0_-1px_3px_rgba(0,0,0,0.2)]' : 'bg-white/90 border-gray-200 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]'}`}>
            <div className="flex justify-around items-center h-20 px-2 pb-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button 
                            key={item.id}
                            onClick={() => navigate(item.path)} 
                            className="nav-btn flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all duration-300 relative group"
                        >
                            <iconify-icon 
                              icon={item.icon} 
                              stroke-width="1.5" 
                              className={`text-2xl transition-colors ${
                                isActive 
                                  ? isDarkMode ? 'text-zinc-100' : 'text-gray-900'
                                  : isDarkMode ? 'text-zinc-600' : 'text-gray-400'
                              }`}
                            ></iconify-icon>
                            <span className={`text-xs font-medium transition-colors ${
                              isActive 
                                ? isDarkMode ? 'text-zinc-100' : 'text-gray-900'
                                : isDarkMode ? 'text-zinc-600' : 'text-gray-400'
                            }`}>
                              {item.label}
                            </span>
                            <div className={`absolute -top-1 w-8 h-1 rounded-b-full transition-opacity ${
                              isActive 
                                ? isDarkMode ? 'bg-zinc-100 opacity-100' : 'bg-gray-900 opacity-100'
                                : 'opacity-0'
                            }`}></div>
                        </button>
                    )
                })}
            </div>
        </nav>
      </div>
    </div>
  );
}
