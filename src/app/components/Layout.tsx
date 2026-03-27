import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Logo } from "./Logo";
import { LayoutDashboard, Egg, ShoppingCart, Bird, Heart, Moon, LogOut } from "lucide-react";
import { useAuth } from "../AuthContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { poultryType, poultryBreed, clearSelection } = useAuth();
  
  const isCaille = poultryType === 'caille';
  const accentColor = isCaille ? "text-babs-emerald" : "text-babs-orange";
  const activeBg = isCaille ? "bg-babs-emerald-light" : "bg-babs-orange-light";

  const navigation = [
    { name: "TABLEAU", href: "/", icon: LayoutDashboard },
    { name: "VOLAILLES", href: "/inventory", icon: Bird },
    { name: "PRODUCTION", href: "/eggs", icon: Egg },
    { name: "ALIMENTATION", href: "/feed", icon: ShoppingCart },
    { name: "SANTÉ", href: "/health", icon: Heart },
  ];

  const handleSwitch = () => {
    clearSelection();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-babs-cream pb-20 sm:pb-0 sm:pt-0">
      {/* Dynamic Background Circle (Glassmorphism effect similar to screenshots) */}
      <div className="fixed top-0 left-0 w-full h-32 bg-white/50 backdrop-blur-md z-40 sm:hidden flex items-center justify-between px-6 border-b border-gray-100">
        <Logo className="w-14 h-14" />
        <div className="flex items-center gap-4">
          <Moon className="w-6 h-6 text-babs-brown/60" />
          <button 
            onClick={handleSwitch}
            className="p-2 bg-gray-100 rounded-xl text-babs-brown/80 hover:bg-gray-200 transition-colors"
            title="Changer d'espèce"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Desktop Header (Simplified) */}
      <header className="hidden sm:block bg-white shadow-premium border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12" />
            <h1 className="text-xl font-bold text-babs-brown">Sen Poulailler Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-sm font-medium ${accentColor} bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm`}>
              {poultryType === 'poulet' ? `Poulet ${poultryBreed || ''}` : 'Cailles'}
            </p>
            <button 
              onClick={handleSwitch}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Changer
            </button>
          </div>
        </div>
      </header>

      {/* Main content - Adjusted padding for top header on mobile */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-36 sm:pt-8 min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-2 py-3 z-50 flex items-center justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? `${accentColor} scale-110` : "text-gray-400"
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? activeBg : ""}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
