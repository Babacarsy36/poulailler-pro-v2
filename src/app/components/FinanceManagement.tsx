import { useState, useEffect } from "react"; // BUILD_TRIGGER_170821_v5
import { Shield } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router";
import { StorageService } from "../services/StorageService";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useForm } from "react-hook-form";
import { Chicken } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { ProFeatureOverlay } from "./ui/ProFeatureOverlay";
import { breedList } from "../constants";

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  batchId?: string;
  batchName?: string;
  poultryType?: string;
  poultryBreed?: string;
  updatedAt?: number;
  _deleted?: boolean;
};

interface FinanceFormData {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
  selectedBatchId: string;
}

export function FinanceManagement() {
  const navigate = useNavigate();
  const { isItemActive, poultryTypes, activeSpeciesFilter, activeBreedFilter, selectedBreeds, syncTrigger, saveData, hasAccess, role, farmId, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [batches, setBatches] = useState<{id: string, name: string}[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const expenseCategories = ["Alimentation", "Santé/Vaccins", "Matériel", "Achat Sujets", "Mortalité (Perte)", "Autre"];
  const incomeCategories = ["Vente d'œufs", "Vente de poulets/cailles", "Vente de fientes", "Autre"];

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FinanceFormData & { breed: string }>({
    defaultValues: {
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      selectedBatchId: 'none',
      breed: selectedBreeds[0] || "",
    }
  });

  const formType = watch('type');
  const currentCategories = formType === 'expense' ? expenseCategories : incomeCategories;

  const isCaille = activeSpeciesFilter === 'caille';
  const isMixed = activeSpeciesFilter === 'all';
  const accentBorderLeft = isMixed ? "border-l-indigo-500" : isCaille ? "border-l-emerald-500" : "border-l-orange-500";
  const accentColor = isMixed ? "text-indigo-500" : isCaille ? "text-emerald-500" : "text-orange-500";

    const loadData = async () => {
      const targetId = farmId || user?.uid;
      const isFarm = !!farmId;
      if (targetId) {
        await SyncService.pullCloudToLocal(targetId, isFarm, "finances");
      }
      const data = StorageService.getItem<Transaction[]>("finances") || [];
      setTransactions(data);
      
      const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
      const activeLots = chickens
        .filter((c: Chicken) => {
            return (c.status === 'active' || Number(c.count) > 0) && isItemActive(c.poultryType, c.breed);
        })
        .map((c: Chicken) => ({
          id: c.id,
          name: c.breed ? `${c.breed} (${c.count}u)` : `Lot #${c.id.slice(-4)} (${c.count}u)`
        }));
      setBatches(activeLots);
    };

    loadData();
  }, [syncTrigger, activeSpeciesFilter, selectedBreeds]);

  const saveTransactions = async (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    await saveData("finances", newTransactions);
  };

  const onFormSubmit = async (data: FinanceFormData & { breed: string }) => {
    const now = Date.now();
    const finalCategory = data.category || currentCategories[0];
    
    if (editingTransaction) {
      const updatedTransaction: Transaction = {
        ...editingTransaction,
        type: data.type,
        amount: Number(data.amount),
        category: finalCategory,
        description: data.description,
        date: data.date,
        batchId: data.selectedBatchId === 'none' ? undefined : data.selectedBatchId,
        batchName: data.selectedBatchId === 'none' ? undefined : batches.find(b => b.id === data.selectedBatchId)?.name,
        poultryBreed: data.breed || selectedBreeds[0] || undefined,
        updatedAt: now
      };
      
      const updatedTransactions = transactions.map(t => t.id === editingTransaction.id ? updatedTransaction : t);
      await saveTransactions(updatedTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setEditingTransaction(null);
      toast.success("Transaction mise à jour !");
    } else {
      const isExpense = data.type === 'expense';
      const newTransaction: Transaction = {
        id: now.toString(),
        type: data.type,
        amount: Number(data.amount),
        category: finalCategory,
        description: data.description,
        date: data.date,
        batchId: data.selectedBatchId === 'none' ? undefined : data.selectedBatchId,
        batchName: data.selectedBatchId === 'none' ? undefined : batches.find(b => b.id === data.selectedBatchId)?.name,
        poultryType: isExpense ? 'global' : (activeSpeciesFilter !== 'all' ? activeSpeciesFilter : (data.breed?.toLowerCase() === 'caille' || breedList.caille.some(b => b.id === data.breed) ? 'caille' : 'poulet')),
        poultryBreed: isExpense ? 'global' : (data.breed || selectedBreeds[0] || undefined),
        updatedAt: now
      };
      const newTransactions = [newTransaction, ...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      await saveTransactions(newTransactions);
      toast.success("Transaction enregistrée !");
    }
    
    reset({ type: data.type, amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], selectedBatchId: 'none', breed: selectedBreeds[0] || "" });
    setIsAddOpen(false);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    reset({
      type: t.type,
      amount: t.amount.toString(),
      category: t.category,
      description: t.description || "",
      date: t.date,
      selectedBatchId: t.batchId || 'none',
      breed: t.poultryBreed || selectedBreeds[0] || ""
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(confirm("Supprimer cette transaction ?")) {
      await saveTransactions(transactions.map(t => t.id === id ? { ...t, _deleted: true, updatedAt: Date.now() } : t));
      toast.success("Transaction supprimée.");
    }
  };

  // Finances are GLOBAL: show all transactions for the month, regardless of species filter
  const filteredTransactions = transactions.filter(t => {
      if (t._deleted) return false;
      const typeFilterMatch = activeFilter === 'all' || t.type === activeFilter;
      const transMonth = t.date.substring(0, 7);
      if (transMonth !== selectedMonth) return false;
      return typeFilterMatch;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const chartDataMap: Record<string, any> = {};
  filteredTransactions.forEach(t => {
    if (!chartDataMap[t.date]) chartDataMap[t.date] = { date: t.date, income: 0, expense: 0 };
    if (t.type === 'income') chartDataMap[t.date].income += t.amount;
    else chartDataMap[t.date].expense += t.amount;
  });
  const chartData = Object.values(chartDataMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-14);

  const lotStats = batches.map(batch => {
    const batchTransactions = filteredTransactions.filter(t => t.batchId === batch.id);
    const income = batchTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = batchTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = income - expense;
    const countMatch = batch.name.match(/\((\d+)u\)/);
    const count = countMatch ? parseInt(countMatch[1]) : 1;
    const costPerBird = count > 0 ? Math.round(expense / count) : 0;
    return { ...batch, income, expense, profit, costPerBird, roi: expense > 0 ? Math.round((profit / expense) * 100) : 0 };
  }).filter(l => l.income > 0 || l.expense > 0);

  if (role === 'worker') {
    return (
      <div className="clean-card rounded-3xl py-16 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="font-['Syne'] text-lg font-semibold text-gray-900">Accès Restreint</h2>
          <p className="text-xs font-light text-gray-500 mt-1 max-w-xs">Votre rôle d'Employé ne permet pas de consulter les données financières.</p>
        </div>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium">
          Retour au Tableau de Bord
        </button>
      </div>
    );
  }

  return (
    <ProFeatureOverlay 
      title="Finances Avancées" 
      description="Prenez le contrôle total de votre rentabilité avec des graphiques détaillés, le suivi par lot et l'analyse du ROI."
      hasAccess={hasAccess('PRO')}
    >
    <section id="screen-finance" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex justify-between items-start w-full sm:w-auto">
          <div>
            <h1 className="font-['Syne'] text-xl font-semibold text-gray-900 tracking-tight">Finances</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs font-light text-gray-500">Suivi détaillé</p>
              <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <iconify-icon icon="solar:check-read-linear"></iconify-icon>
                  <span>Synchronisé</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => loadData()}
            className="sm:hidden p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-xl shadow-sm"
          >
            <iconify-icon icon="solar:refresh-linear" className={isSyncing ? "animate-spin" : ""}></iconify-icon>
          </button>
        </div>
        
        <div className="flex flex-col xs:flex-row justify-between items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-2 py-1 shadow-sm w-full xs:w-auto justify-between xs:justify-center">
                <button 
                  onClick={() => {
                    const [y, m] = selectedMonth.split('-').map(Number);
                    const d = new Date(y, m - 2, 1);
                    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 outline-none"
                >
                  <iconify-icon icon="solar:alt-arrow-left-linear"></iconify-icon>
                </button>
                <span className="text-[11px] font-black uppercase tracking-wider px-2 min-w-[90px] sm:min-w-[100px] text-center text-gray-700">
                  {new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => {
                    const [y, m] = selectedMonth.split('-').map(Number);
                    const d = new Date(y, m, 1);
                    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 outline-none"
                >
                  <iconify-icon icon="solar:alt-arrow-right-linear"></iconify-icon>
                </button>
            </div>

            <div className="flex gap-2 w-full xs:w-auto">
              <button onClick={() => window.print()} className="flex-1 xs:flex-none h-11 px-3 bg-white border border-gray-200 text-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors no-print outline-none">
                <iconify-icon icon="solar:printer-linear" class="text-xl"></iconify-icon>
              </button>
              <button onClick={() => { setEditingTransaction(null); reset({ type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], selectedBatchId: 'none', breed: selectedBreeds[0] || "" }); setIsAddOpen(true); }} className="flex-[2] xs:flex-none h-11 px-4 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-md transition-colors no-print outline-none">
                <iconify-icon icon="solar:add-circle-linear" class="text-xl sm:mr-2"></iconify-icon>
                <span className="font-medium text-sm">Transaction</span>
              </button>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`flex flex-col justify-center p-6 rounded-[2rem] relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-l-4 ${balance >= 0 ? accentBorderLeft : 'border-l-red-500'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full -mr-16 -mt-16 blur-2xl z-0"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Solde Total</p>
            <p className={`font-['JetBrains_Mono'] text-4xl sm:text-5xl font-medium tracking-tight ${balance >= 0 ? accentColor : 'text-red-500'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()} <span className="text-sm sm:text-base text-gray-400 font-normal">F</span>
            </p>
          </div>
          <div className="flex flex-row sm:flex-row gap-4 sm:gap-8 mt-6 pt-6 border-t border-gray-100/50 relative z-10 overflow-x-auto no-scrollbar">
            <div className="shrink-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recettes</p>
              <p className="font-['JetBrains_Mono'] text-sm sm:text-base font-medium text-emerald-600">+{totalIncome.toLocaleString()}</p>
            </div>
            <div className="w-px bg-gray-100 hidden sm:block"></div>
            <div className="shrink-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dépenses</p>
              <p className="font-['JetBrains_Mono'] text-sm sm:text-base font-medium text-red-500">-{totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="clean-card rounded-3xl p-5 select-none h-full bg-white/60 backdrop-blur-xl border border-white/40">
            <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900 mb-4">Évolution Financière</h2>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="finIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.2}></stop><stop offset="100%" stopColor="#22c55e" stopOpacity={0.0}></stop></linearGradient>
                    <linearGradient id="finExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}></stop><stop offset="100%" stopColor="#ef4444" stopOpacity={0.0}></stop></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', fontSize: '10px', fontFamily: 'DM Sans' }} formatter={(value: number) => [`${value.toLocaleString()} F`, undefined]} />
                  <Area type="monotone" dataKey="income" name="Recettes" stroke="#22c55e" strokeWidth={2} fill="url(#finIncome)" />
                  <Area type="monotone" dataKey="expense" name="Dépenses" stroke="#ef4444" strokeWidth={2} fill="url(#finExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3 ml-1">
          <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Analyse par Lot</h2>
          {!hasAccess('PRO') && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-medium flex items-center gap-1"><iconify-icon icon="solar:crown-star-linear"></iconify-icon> PRO</span>}
        </div>
        <div className={`space-y-3 ${!hasAccess('PRO') ? 'blur-sm grayscale opacity-30 select-none pointer-events-none' : ''}`}>
          {lotStats.length === 0 ? (
            <div className="clean-card rounded-2xl p-4 text-center py-8">
              <iconify-icon icon="solar:chart-line-duotone" class="text-2xl text-gray-300 block mb-1"></iconify-icon>
              <p className="text-xs font-light text-gray-500">Liez des transactions à des lots pour voir la rentabilité.</p>
            </div>
          ) : lotStats.map(stat => (
            <div key={stat.id} className="clean-card rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div><p className="text-sm font-medium text-gray-900 truncate">{stat.name}</p><p className="text-[10px] font-light text-gray-500 mt-0.5">Coût/sujet : <span className="font-['JetBrains_Mono'] font-medium">{stat.costPerBird.toLocaleString()} F</span></p></div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-medium ${stat.roi >= 20 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : stat.roi >= 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{stat.roi >= 0 ? '+' : ''}{stat.roi}% ROI</div>
              </div>
              <div className="flex gap-4 pt-3 border-t border-gray-50">
                <div><p className="text-[10px] text-gray-400 uppercase">Recettes</p><p className="font-['JetBrains_Mono'] text-xs font-medium text-emerald-600">+{stat.income.toLocaleString()} F</p></div>
                <div className="w-px bg-gray-100"></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Dépenses</p><p className="font-['JetBrains_Mono'] text-xs font-medium text-red-500">-{stat.expense.toLocaleString()} F</p></div>
                <div className="w-px bg-gray-100"></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Net</p><p className={`font-['JetBrains_Mono'] text-xs font-medium ${stat.profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{stat.profit >= 0 ? '+' : ''}{stat.profit.toLocaleString()} F</p></div>
              </div>
            </div>
          ))}
        </div>
        {!hasAccess('PRO') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-xl text-center max-w-[220px]">
              <iconify-icon icon="solar:crown-star-bold-duotone" class="text-3xl text-amber-500 mb-2 block"></iconify-icon>
              <p className="text-xs font-medium text-gray-700 mb-3">Débloquez l'analyse de rentabilité par lot</p>
              <button onClick={() => navigate('/?upgrade=true')} className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-medium">Devenir PRO 🚀</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 ml-1">
          <h2 className="font-['Syne'] text-base font-medium tracking-tight text-gray-900">Transactions</h2>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['all', 'income', 'expense'] as const).map(filter => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${activeFilter === filter ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{filter === 'all' ? 'Tous' : filter === 'income' ? 'Recettes' : 'Dépenses'}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filteredTransactions.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="clean-card rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors group overflow-hidden">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}><iconify-icon icon={t.type === 'income' ? "solar:arrow-down-bold-duotone" : "solar:arrow-up-bold-duotone"} class={`text-xl sm:text-2xl ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}></iconify-icon></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{t.category}</p>
                    {t.batchName && <span className="px-1.5 py-0.5 bg-gray-100 rounded-md text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-tighter truncate max-w-[80px]">{t.batchName}</span>}
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate mt-0.5">{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} {t.description && ` • ${t.description}`}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className={`font-['JetBrains_Mono'] font-bold text-sm sm:text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-[10px] font-normal opacity-60">F</span></p>
                  <div className="flex items-center gap-1 no-print">
                      <button onClick={() => handleEdit(t)} className="p-1 px-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 sm:border-none"><iconify-icon icon="solar:pen-linear" class="text-base"></iconify-icon></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 sm:border-none"><iconify-icon icon="solar:trash-bin-trash-linear" class="text-base"></iconify-icon></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTransactions.length === 0 && (<div className="clean-card rounded-3xl py-16 text-center border-dashed border-gray-200"><iconify-icon icon="solar:wallet-line-duotone" class="text-4xl text-gray-300 mb-2 block"></iconify-icon><p className="text-xs font-light text-gray-500">Aucune transaction enregistrée.</p></div>)}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <h3 className="font-['Syne'] text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">{editingTransaction ? "Modifier la Transaction" : "Nouvelle Transaction"}</h3>
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-5 gap-1">
              <button type="button" onClick={() => { setValue('type', 'expense'); setValue('category', ''); }} className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition-all ${formType === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>Dépense</button>
              <button type="button" onClick={() => { setValue('type', 'income'); setValue('category', ''); }} className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition-all ${formType === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>Recette</button>
            </div>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Montant (FCFA)</label>
                <input type="number" className={`w-full bg-gray-50 border rounded-xl p-3 text-sm font-['JetBrains_Mono'] font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors ${errors.amount ? 'border-red-300' : 'border-gray-200'}`} placeholder="Ex: 5000" {...register("amount", { required: "Montant requis", min: 1 })} />
                {errors.amount && <p className="text-red-500 text-[10px] font-medium">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Catégorie</label>
                <select className={`w-full bg-gray-50 border rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 appearance-none ${errors.category ? 'border-red-300' : 'border-gray-200'}`} {...register("category", { required: "Catégorie requise" })}><option value="" disabled>Sélectionner...</option>{currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Description / Note</label><input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors" placeholder="Facultatif" {...register("description")} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Date</label><input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors" {...register("date", { required: true })} /></div>
                {formType === 'income' && (<div className="space-y-1.5 animate-in slide-in-from-top-2"><label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Race de la récolte</label><select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 appearance-none" {...register("breed", { required: true })}>{selectedBreeds.map(b => (<option key={b} value={b}>{b === 'chair' ? 'Poulet de Chair' : b === 'fermier' ? 'Poulet Fermier' : b === 'ornement' ? "Poule d'Ornement" : b}</option>))}</select></div>)}
                <div className="space-y-1.5"><label className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Lier à un lot</label><select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 appearance-none" {...register("selectedBatchId")}><option value="none">Hors lot</option>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100"><button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Annuler</button><button type="submit" className={`flex-1 py-3 text-white rounded-xl text-sm font-medium shadow-md transition-colors ${formType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{editingTransaction ? "Appliquer les modifications" : "Ajouter"}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
    </ProFeatureOverlay>
  );
}
