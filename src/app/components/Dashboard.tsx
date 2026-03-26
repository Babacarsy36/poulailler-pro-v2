import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Bird, Egg, TrendingUp, ShoppingCart } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useAuth } from "../AuthContext";

export function Dashboard() {
  const { poultryType, poultryBreed } = useAuth();
  const [stats, setStats] = useState({
    totalChickens: 0,
    eggsToday: 0,
    eggsThisWeek: 0,
    feedRemaining: 0,
  });

  const [eggData, setEggData] = useState<Array<{ day: string; eggs: number }>>([]);

  useEffect(() => {
    // Charger les données depuis localStorage
    const chickens = JSON.parse(localStorage.getItem("chickens") || "[]");
    const eggs = JSON.parse(localStorage.getItem("eggs") || "[]");
    const feed = JSON.parse(localStorage.getItem("feed") || "[]");

    // Calculer les statistiques
    const today = new Date().toDateString();
    const eggsToday = eggs.filter((e: any) => 
      new Date(e.date).toDateString() === today
    ).reduce((sum: number, e: any) => sum + e.quantity, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const eggsThisWeek = eggs.filter((e: any) => 
      new Date(e.date) >= oneWeekAgo
    ).reduce((sum: number, e: any) => sum + e.quantity, 0);

    const feedRemaining = feed.reduce((sum: number, f: any) => sum + f.quantity, 0);

    setStats({
      totalChickens: chickens.length,
      eggsToday,
      eggsThisWeek,
      feedRemaining,
    });

    // Préparer les données pour le graphique des 7 derniers jours
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      const eggsForDay = eggs.filter((e: any) => 
        new Date(e.date).toDateString() === dateStr
      ).reduce((sum: number, e: any) => sum + e.quantity, 0);

      chartData.push({
        day: dayName,
        eggs: eggsForDay,
      });
    }
    setEggData(chartData);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-orange-700">
        Tableau de bord - {poultryType === 'caille' ? 'Cailles' : `Poulets ${poultryBreed || ''}`}
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-orange-700 font-medium">
              Total {poultryType === 'caille' ? 'Cailles' : 'Poulets'}
            </CardTitle>
            <Bird className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{stats.totalChickens}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-yellow-700">Œufs aujourd'hui</CardTitle>
            <Egg className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-yellow-700">{stats.eggsToday}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-amber-700">Œufs cette semaine</CardTitle>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-amber-700">{stats.eggsThisWeek}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-green-700">Nourriture (kg)</CardTitle>
            <ShoppingCart className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-green-700">{stats.feedRemaining}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-700">Production d'œufs - 7 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eggData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="eggs" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
