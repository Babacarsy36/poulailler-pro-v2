import { Bell, AlertTriangle, Info, CheckCircle, ChevronRight, Egg, ShoppingCart, Activity } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { useState } from "react";
import { Link } from "react-router";
import * as Popover from '@radix-ui/react-popover';

export function NotificationCenter() {
  const { alerts } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
     switch(type) {
        case 'egg-drop': return <Egg className="w-4 h-4 text-orange-500" />;
        case 'low-feed': return <ShoppingCart className="w-4 h-4 text-blue-500" />;
        case 'health-reminder': return <Activity className="w-4 h-4 text-red-500" />;
        case 'hatchery-reminder': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        default: return <Info className="w-4 h-4 text-gray-400" />;
     }
  };

  const getSeverityColor = (sev: string) => {
     if (sev === 'critical') return 'bg-red-50 border-red-100 text-red-700';
     if (sev === 'warning') return 'bg-orange-50 border-orange-100 text-orange-700';
     return 'bg-blue-50 border-blue-100 text-blue-700';
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button className="relative p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-babs-brown transition-all group">
          <Bell className={`w-5 h-5 ${alerts.length > 0 ? 'animate-tada' : ''}`} />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content 
          className="z-[100] w-[350px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200"
          sideOffset={12}
          align="end"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-babs-brown uppercase tracking-widest">Alertes de Vigilance</h3>
            {alerts.length > 0 && <span className="text-[10px] font-bold text-gray-400">{alerts.length} active(s)</span>}
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                 <CheckCircle className="w-10 h-10 mb-2 text-emerald-500" />
                 <p className="text-xs font-black uppercase text-gray-400 tracking-widest text-center">Tout est sous contrôle !</p>
                 <p className="text-[10px] font-bold text-gray-400 mt-1">Aucune anomalie détectée</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Link 
                  key={alert.id}
                  to={alert.link}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-4 p-4 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 ${getSeverityColor(alert.severity)}`}
                >
                   <div className="p-2.5 bg-white/80 rounded-2xl shadow-sm mt-0.5">
                      {getIcon(alert.type)}
                   </div>
                   <div className="flex-1">
                      <p className="text-[11px] font-black leading-tight uppercase mb-1">{alert.title}</p>
                      <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-2">{alert.message}</p>
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                         <span>Vérifier</span>
                         <ChevronRight className="w-3 h-3" />
                      </div>
                   </div>
                </Link>
              ))
            )}
          </div>
          
          <Popover.Arrow className="fill-white dark:fill-gray-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
