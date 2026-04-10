import { Outlet, useLocation, useNavigate } from "react-router";
/** Version: 1.0.1 (Force Build Trigger) */
import { useAuth, PoultryType, PoultryBreed } from "../AuthContext";
import { NotificationCenter } from "./ui/NotificationCenter";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { poultryType, updatePoultrySelection, isDarkMode, toggleDarkMode } = useAuth();
  
  const speciesList = [
    { id: 'poulet' as PoultryType, abbr: 'PL', label: 'Poulet' },
    { id: 'caille' as PoultryType, abbr: 'CL', label: 'Caille' },
  ];

  const handleSpeciesSelect = async (type: PoultryType) => {
    await updatePoultrySelection(type, null as PoultryBreed);
    navigate("/");
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'solar:widget-linear', path: '/' },
    { id: 'inventory', label: 'Effectif', icon: 'solar:users-group-rounded-linear', path: '/inventory' },
    { id: 'eggs', label: 'Production', icon: 'solar:egg-bold-duotone', path: '/eggs' },
    { id: 'feed', label: 'Aliment', icon: 'solar:leaf-linear', path: '/feed' },
    { id: 'incubator', label: 'Couvaison', icon: 'solar:fire-linear', path: '/incubator' },
    { id: 'finance', label: 'Finances', icon: 'solar:wallet-linear', path: '/finances' },
    { id: 'health', label: 'Santé', icon: 'solar:heart-bold-duotone', path: '/health' },
    { id: 'settings', label: 'Équipe', icon: 'solar:settings-linear', path: '/team' },
  ];

  const accentColorClass = poultryType === 'caille' ? 'emerald' : 'orange';
  const accentHex = poultryType === 'caille' ? '#10B981' : '#F59E0B';

  return (
    <div className={`flex min-h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#E5E7EB] text-gray-900'}`}>
      
      {/* Sidebar - Desktop Only */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-screen border-r transition-colors duration-300 z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
        <div className="p-6 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-${accentColorClass}-500 flex items-center justify-center text-white shadow-lg shadow-${accentColorClass}-500/20`}>
                <span className="font-['Syne'] font-bold text-lg">P</span>
            </div>
            <span className="font-['Syne'] font-bold text-xl tracking-tight">Poulailler Pro</span>
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

        <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
            <button onClick={toggleDarkMode} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isDarkMode ? 'bg-zinc-800 text-amber-400' : 'bg-gray-100 text-gray-600'}`}>
                <iconify-icon icon={isDarkMode ? "solar:sun-bold-duotone" : "solar:moon-linear"} class="text-xl"></iconify-icon>
                <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`flex-1 relative flex flex-col min-h-screen md:pl-64 font-['DM_Sans'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-[#F9FAFB]'}`}>
          
        {/* Top Header - Fixed & Dynamic */}
        <header className={`fixed top-0 inset-x-0 md:left-64 z-40 backdrop-blur-md border-b pt-safe transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-100'}`}>
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4 h-16">
                {/* Mobile Menu Icon / Title */}
                <div className="flex items-center gap-3 md:hidden">
                    <span className={`font-['Syne'] font-bold text-lg text-${accentColorClass}-500`}>PLP</span>
                </div>

                {/* Species Switcher */}
                <div className="flex-1 overflow-x-auto no-scrollbar mx-3 select-none">
                    <div className="flex gap-2 w-max mx-auto">
                        {speciesList.map((s) => {
                            const isActive = (!poultryType && s.id === 'poulet') || s.id === poultryType;
                            return (
                                <button 
                                    key={s.id}
                                    onClick={() => handleSpeciesSelect(s.id)} 
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs sm:text-sm ${
                                        isActive 
                                            ? `bg-${accentColorClass}-500 border-${accentColorClass}-500 text-white shadow-lg shadow-${accentColorClass}-500/20 scale-105`
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

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="md:hidden">
                    <button onClick={toggleDarkMode} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800 text-amber-400' : 'bg-gray-100 text-gray-600'}`}>
                      <iconify-icon icon={isDarkMode ? "solar:sun-bold-duotone" : "solar:moon-linear"} class="text-lg"></iconify-icon>
                    </button>
                  </div>
                  <NotificationCenter />
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto pt-20 pb-28 md:pb-8 px-4 scroll-smooth min-h-screen">
            <Outlet />
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <nav className={`md:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-md border-t pb-safe transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]' : 'bg-white/90 border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]'}`}>
            <div className="flex justify-around items-center h-20 px-2 pb-2">
                {navItems.slice(0, 5).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button 
                            key={item.id}
                            onClick={() => navigate(item.path)} 
                            className="flex flex-col items-center gap-1 w-14 p-2 rounded-xl transition-all relative"
                        >
                            <iconify-icon 
                              icon={item.icon} 
                              className={`text-2xl ${isActive ? `text-${accentColorClass}-500` : isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}
                            ></iconify-icon>
                            <span className={`text-[10px] font-bold ${isActive ? `text-${accentColorClass}-500` : isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                              {item.label}
                            </span>
                            {isActive && <div className={`absolute -top-1 w-6 h-1 rounded-b-full bg-${accentColorClass}-500`}></div>}
                        </button>
                    )
                })}
            </div>
        </nav>
      </div>
    </div>
  );
}
