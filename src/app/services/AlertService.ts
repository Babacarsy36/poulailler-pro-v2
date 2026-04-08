import { getDaysElapsed } from "../components/incubator/types";
import { StorageService } from "./StorageService";
import { Chicken, EggRecord, FeedEntry, HealthRecord } from "../types";
import { IncubationBatch } from "../components/incubator/types";

export interface Alert {
    id: string;
    type: 'egg-drop' | 'low-feed' | 'health-reminder' | 'hatchery-reminder';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    link: string;
    createdAt: number;
}

export const AlertService = {
    getAlerts(poultryType?: string, poultryBreed?: string): Alert[] {
        const alerts: Alert[] = [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Egg Drop Detection (>15% drop vs 7d average)
        const eggs = StorageService.getItem<EggRecord[]>("eggs") || [];
        const filteredEggs = eggs.filter((e) => !poultryType || e.poultryType === poultryType);
        
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (i + 1));
            const dStr = d.toISOString().split('T')[0];
            return filteredEggs.filter((e) => e.date === dStr).reduce((acc: number, e) => acc + (e.quantity || 0), 0);
        });

        const avg7Days = last7Days.reduce((a, b) => a + b, 0) / 7;
        const todayEggs = filteredEggs.filter((e) => e.date === todayStr).reduce((acc: number, e) => acc + (e.quantity || 0), 0);

        if (avg7Days > 10 && todayEggs < avg7Days * 0.85) {
            alerts.push({
                id: 'egg-drop-' + todayStr,
                type: 'egg-drop',
                severity: 'critical',
                title: 'Baisse de ponte détectée 📉',
                message: `La production est de ${todayEggs} œufs, soit une baisse de ${Math.round((1 - todayEggs/avg7Days)*100)}% par rapport à la moyenne. Vérifiez la santé du lot.`,
                link: '/eggs',
                createdAt: Date.now()
            });
        }

        // 2. Low Feed Detection (<3 days autonomy)
        const feed = StorageService.getItem<FeedEntry[]>("feed") || [];
        const chickens = StorageService.getItem<Chicken[]>("chickens") || [];
        const activeLots = chickens.filter((c) => c.status === 'active' && (!poultryType || c.poultryType === poultryType));
        
        const totalKg = feed.filter((f) => !poultryType || f.poultryType === poultryType).reduce((acc: number, f) => acc + (f.type === 'achat' ? (f.quantity || 0) : -(f.quantity || 0)), 0);
        
        const dailyCons = activeLots.reduce((acc: number, c) => {
            const breedCons = c.poultryType === 'caille' ? 0.03 : 0.12; 
            return acc + (breedCons * (Number(c.count) || 1));
        }, 0);

        if (dailyCons > 0) {
            const autonomy = totalKg / dailyCons;
            if (autonomy < 3) {
                alerts.push({
                    id: 'low-feed-' + todayStr,
                    type: 'low-feed',
                    severity: autonomy < 1 ? 'critical' : 'warning',
                    title: autonomy < 1 ? 'Rupture d\'aliment ! ⚠️' : 'Stock d\'aliment bas 🛒',
                    message: `Il vous reste environ ${Math.max(0, Math.floor(autonomy))} jours d'autonomy alimentaire (${Math.round(totalKg)}kg restants).`,
                    link: '/feed',
                    createdAt: Date.now()
                });
            }
        }

        // 3. Health Reminders (Today's tasks)
        // const health = StorageService.getItem<HealthRecord[]>("health") || [];

        // 4. Hatchery (Hatching today/tomorrow)
        const incubation = StorageService.getItem<IncubationBatch[]>("incubation") || [];
        const ongoing = incubation.filter((b) => b.status === 'incubating' || b.status === 'ongoing');
        
        ongoing.forEach((b) => {
            const elapsed = getDaysElapsed(b.startDate);
            const remaining = (b.totalDays || (b.species === 'caille' ? 17 : 21)) - elapsed;
            
            if (remaining <= 1 && remaining >= 0) {
                alerts.push({
                    id: 'hatchery-' + b.id,
                    type: 'hatchery-reminder',
                    severity: 'critical',
                    title: remaining === 0 ? 'Éclosion AUJOURD\'HUI ! 🐣' : 'Éclosion demain 🥚',
                    message: `Le lot "${b.name || b.species}" arrive à terme. Préparez l'espace de démarrage.`,
                    link: '/incubator',
                    createdAt: Date.now()
                });
            }
        });

        return alerts;
    }
};
