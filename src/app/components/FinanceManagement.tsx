import { useState, useEffect } from "react";
import { PlusCircle, MinusCircle, Wallet, TrendingUp, TrendingDown, Trash2, Printer } from "lucide-react";
import { useAuth } from "../AuthContext";
import { SyncService } from "../SyncService";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  batchId?: string;
  batchName?: string;
};

export function FinanceManagement() {
  const { poultryType, syncTrigger } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // form states
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('none');
  const [batches, setBatches] = useState<{id: string, name: string}[]>([]);

  const isCaille = poultryType === 'caille';
  const customColors = {
    income: isCaille ? "#10b981" : "#eab308", // emerald or yellow
    expense: "#ef4444", // red
    accent: isCaille ? "var(--babs-emerald)" : "var(--babs-orange)",
    bgAccent: isCaille ? "bg-babs-emerald" : "bg-babs-orange",
    textAccent: isCaille ? "text-babs-emerald" : "text-babs-orange",
  };

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("finances") || "[]");
    setTransactions(data);
    
    // Fetch chickens to link lots
    const chickens = JSON.parse(localStorage.getItem("chickens") || "[]");
    const activeLots = chickens.filter((c: any) => c.status === 'active' || c.count > 0).map((c: any) => ({
       id: c.id,
       name: c.breed ? `${c.breed} (${c.count}u)` : `Lot #${c.id.slice(-4)}`
    }));
    setBatches(activeLots);
  }, [syncTrigger]);

  const saveTransactions = async (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    await SyncService.saveCollection("finances", newTransactions);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Veuillez entrer un montant valide.");
      return;
    }

    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
    const finalCategory = category || currentCategories[0];

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: Number(amount),
      category: finalCategory,
      description,
      date,
      batchId: selectedBatchId === 'none' ? undefined : selectedBatchId,
      batchName: selectedBatchId === 'none' ? undefined : batches.find(b => b.id === selectedBatchId)?.name
    };

    const newTransactions = [newTransaction, ...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await saveTransactions(newTransactions);
    
    setAmount('');
    setDescription('');
    toast.success("Transaction enregistrée !");
  };

  const handleDelete = async (id: string) => {
    if(confirm("Supprimer cette transaction ?")) {
      const newTransactions = transactions.filter(t => t.id !== id);
      await saveTransactions(newTransactions);
      toast.success("Transaction supprimée.");
    }
  };

  // Stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart Data Preparation (last 7 or 14 days grouped by date)
  const chartDataMap: Record<string, any> = {};
  transactions.forEach(t => {
     if(!chartDataMap[t.date]) {
       chartDataMap[t.date] = { date: t.date, income: 0, expense: 0 };
     }
     if(t.type === 'income') chartDataMap[t.date].income += t.amount;
     else chartDataMap[t.date].expense += t.amount;
  });
  
  const chartData = Object.values(chartDataMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // predefined categories
  const expenseCategories = ["Alimentation", "Santé/Vaccins", "Matériel", "Achat Sujets", "Mortalité (Perte)", "Autre"];
  const incomeCategories = ["Vente d'œufs", "Vente de poulets/cailles", "Vente de fientes", "Autre"];
  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold text-babs-brown tracking-tight">Finances</h2>
          <p className="text-babs-brown/60 font-medium uppercase tracking-widest text-[10px]">
            Rentabilité & Suivi détaillé
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-white border-2 border-gray-100 text-gray-500 px-6 py-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold no-print"
        >
          <Printer className="w-5 h-5" /> Imprimer Rapport
        </button>
      </div>

      {/* Print-only Header */}
      <div className="print-only mb-8 border-b-2 border-gray-100 pb-6 w-full">
        <h1 className="text-3xl font-black text-black">POULAILLER PRO - RAPPORT FINANCIER</h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
          Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Print-only Header */}
      <div className="print-only mb-8 border-b-2 border-gray-100 pb-6">
        <h1 className="text-3xl font-black text-black">POULAILLER PRO - RAPPORT FINANCIER</h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
          Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

       {/* Summaries */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-50 flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div className="absolute top-6 right-6 p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
               <Wallet className={`w-6 h-6 ${customColors.textAccent}`} />
             </div>
             <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">Solde Total</p>
             <p className={`text-4xl mt-2 font-black ${balance >= 0 ? customColors.textAccent : 'text-red-500'}`}>
                {balance >= 0 ? '+' : ''}{balance.toLocaleString()} F
             </p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-50 flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div className="absolute top-6 right-6 p-3 bg-green-50 rounded-2xl group-hover:scale-110 transition-transform">
               <TrendingUp className="w-6 h-6 text-green-500" />
             </div>
             <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">Total Recettes</p>
             <p className="text-3xl mt-2 font-black text-babs-brown">{totalIncome.toLocaleString()} F</p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-50 flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div className="absolute top-6 right-6 p-3 bg-red-50 rounded-2xl group-hover:scale-110 transition-transform">
               <TrendingDown className="w-6 h-6 text-red-500" />
             </div>
             <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">Total Dépenses</p>
             <p className="text-3xl mt-2 font-black text-babs-brown">{totalExpense.toLocaleString()} F</p>
          </div>
       </div>

       {/* Main grids */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add form */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
               <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider mb-6">Enregistrer</h3>
               
               <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                  <button 
                    onClick={() => { setType('expense'); setCategory(''); }}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${type === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Dépense
                  </button>
                  <button 
                    onClick={() => { setType('income'); setCategory(''); }}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${type === 'income' ? `bg-white shadow-sm text-green-500` : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Recette
                  </button>
               </div>

               <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Montant (FCFA)</label>
                    <input 
                      type="number"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-gray-50 rounded-2xl py-4 px-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                      placeholder="Ex: 5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Catégorie</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-gray-50 rounded-2xl py-4 px-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 transition-all appearance-none"
                    >
                       <option value="" disabled>Sélectionner...</option>
                       {currentCategories.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                       ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Description / Note</label>
                    <input 
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-gray-50 rounded-2xl py-4 px-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                      placeholder="Facultatif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Date</label>
                    <input 
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-gray-50 rounded-2xl py-4 px-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Lier à un lot (Optionnel)</label>
                    <select
                      value={selectedBatchId}
                      onChange={e => setSelectedBatchId(e.target.value)}
                      className="w-full bg-gray-50 rounded-2xl py-4 px-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-orange-100 transition-all appearance-none"
                    >
                       <option value="none">Hors lot (Frais généraux)</option>
                       {batches.map(b => (
                         <option key={b.id} value={b.id}>{b.name}</option>
                       ))}
                    </select>
                  </div>
                  
                  <button 
                    type="submit"
                    className={`w-full text-white font-black rounded-2xl py-5 shadow-lg transition-all mt-4 flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {type === 'expense' ? <MinusCircle className="w-5 h-5"/> : <PlusCircle className="w-5 h-5"/>}
                    Ajouter {type === 'expense' ? 'la dépense' : 'la recette'}
                  </button>
               </form>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
              {/* Chart */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
                 <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider mb-6">Évolution</h3>
                 <div className="h-64 w-full">
                   {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day:'numeric', month: 'short' })}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                            tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#4b5563' }}
                            formatter={(value: number) => [`${value} F`, undefined]}
                          />
                          <Area type="monotone" dataKey="income" name="Recettes" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                          <Area type="monotone" dataKey="expense" name="Dépenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                         <p className="text-gray-400 font-bold text-sm">Pas encore de données</p>
                      </div>
                   )}
                 </div>
              </div>

              {/* History */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 relative overflow-hidden">
                 <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider mb-6">Transactions Récentes</h3>
                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    {transactions.length === 0 ? (
                       <div className="text-center py-8 text-gray-400 font-bold flex flex-col items-center">
                          <Wallet className="w-12 h-12 text-gray-200 mb-2"/>
                          Aucune transaction enregistrée
                       </div>
                    ) : (
                       transactions.map((t) => (
                         <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white border text-left border-transparent hover:border-gray-100 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                           <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-xl shadow-sm ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {t.type === 'income' ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
                             </div>
                             <div>
                               <p className="font-black text-babs-brown text-sm">{t.category}</p>
                               <p className="text-[10px] font-bold text-gray-400">{new Date(t.date).toLocaleDateString('fr-FR')} {t.description && `• ${t.description}`}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <p className={`font-black tracking-tight ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} F
                              </p>
                              <button 
                                onClick={() => handleDelete(t.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 no-print"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                         </div>
                       ))
                    )}
                 </div>
              </div>
          </div>
       </div>
    </div>
  );
}
