import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Logo } from "./Logo";
import { LayoutDashboard, Egg, ShoppingCart, Bird, LogOut } from "lucide-react";
import { useAuth } from "../AuthContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { poultryType, poultryBreed, clearSelection } = useAuth();
  
  const isCaille = poultryType === 'caille';
  const themeStyles = isCaille 
    ? "from-emerald-50 to-teal-50" 
    : "from-orange-50 to-yellow-50";
  const accentColor = isCaille ? "text-emerald-600" : "text-orange-600";
  const borderColor = isCaille ? "border-emerald-100" : "border-orange-100";
  const activeBorder = isCaille ? "border-emerald-500" : "border-orange-500";
  const hoverBorder = isCaille ? "hover:border-emerald-300" : "hover:border-orange-300";

  const navigation = [
    { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
    { name: isCaille ? "Mes Cailles" : "Inventaire", href: "/inventory", icon: Bird },
    { name: "Production d'œufs", href: "/eggs", icon: Egg },
    { name: "Alimentation", href: "/feed", icon: ShoppingCart },
  ];

  const handleLogout = () => {
    clearSelection();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles}`}>
      {/* Header */}
      <header className={`bg-white shadow-sm border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-12 h-12" />
              <div>
                <h1 className={`text-2xl ${accentColor} font-bold`}>
                  PoulaillerPro - {poultryType === 'poulet' ? `Poulets ${poultryBreed || ''}` : 'Cailles'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isCaille ? "Gestion de votre élevage de cailles" : "Gestion de votre poulailler"}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Changer de type
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`bg-white border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? `${activeBorder} ${accentColor}`
                      : `border-transparent text-gray-600 hover:${accentColor} ${hoverBorder}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
