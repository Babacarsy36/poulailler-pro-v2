import { getDaysElapsed } from "../components/incubator/types";
import { StorageService } from "./StorageService";
import { Chicken, EggRecord, FeedEntry, HealthRecord } from "../types";
import { IncubationBatch } from "../components/incubator/types";
import { ProphylaxisService } from "./ProphylaxisService";

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
    getAlerts(poultryType?: string, selectedBreeds?: string[]): Alert[] {
        const alerts: Alert[] = [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const checkBreedMatch = (itemBreed?: string) => {
            if (!selectedBreeds || selectedBreeds.length === 0) return true;
            return selectedBreeds.some(sb => itemBreed?.toLowerCase() === sb?.toLowerCase());
        };

        // 1. Egg Drop Detection (>15% drop vs 7d average)
        const eggs = StorageService.getItem<EggRecord[]>("eggs") || [];
        const filteredEggs = eggs.filter((e) => {
            if (e._deleted) return false;
            const typeMatch = !poultryType || e.poultryType === poultryType || (poultryType === 'poulet' && !e.poultryType);
            const breedMatch = checkBreedMatch(e.poultryBreed);
            return typeMatch && breedMatch;
        });
        
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (i + 1));
            const dStr = d.toISOString().split('T')[0];
            return filteredEggs.filter((e) => e.date === dStr).reduce((acc: number, e) => acc + (e.quantity || 0), 0);
        });

        const avg7Days = last7Days.reduce((a, b) => a + b, 0) / 7;
        const todayEggs = filteredEggs.filter((e) => e.date === todayStr).reduce((acc: number, e) => acc + (e.quantity || 0), 0);
        const hasTodayEntry = filteredEggs.some((e) => e.date === todayStr);

        if (hasTodayEntry && avg7Days > 10 && todayEggs < avg7Days * 0.85) {
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
        const activeLots = chickens.filter((c) => {
            if (c._deleted || c.status !== 'active') return false;
            const typeMatch = !poultryType || c.poultryType === poultryType || (poultryType === 'poulet' && !c.poultryType);
            const breedMatch = checkBreedMatch(c.breed);
            return typeMatch && breedMatch;
        });
        
        const isGlobal = !poultryType || poultryType === 'all';
        
        const totalKg = feed.filter((f) => {
            if (f._deleted) return false;
            const typeMatch = isGlobal || f.poultryType === poultryType || (poultryType === 'poulet' && !f.poultryType);
            const breedMatch = isGlobal || checkBreedMatch(f.poultryBreed);
            return typeMatch && breedMatch;
        }).reduce((acc: number, f) => acc + (f.type === 'achat' ? (f.quantity || 0) : -(f.quantity || 0)), 0);
        
        const dailyCons = activeLots.filter(c => {
            if (isGlobal) return true;
            const typeMatch = c.poultryType === poultryType || (poultryType === 'poulet' && !c.poultryType);
            const breedMatch = checkBreedMatch(c.breed);
            return typeMatch && breedMatch;
        }).reduce((acc: number, c) => {
            const breedCons = c.poultryType === 'caille' ? 0.03 : 0.12; 
            return acc + (breedCons * (Number(c.count) || 1));
        }, 0);

        const feedEntriesCount = feed.filter((f) => !f._deleted).length;
        if (feedEntriesCount > 0 && dailyCons > 0) {
            const autonomy = totalKg / dailyCons;
            if (autonomy < 2 && totalKg >= 0) {
                alerts.push({
                    id: 'low-feed-' + todayStr,
                    type: 'low-feed',
                    severity: autonomy < 1 ? 'critical' : 'warning',
                    title: autonomy < 1 ? 'Rupture d\'aliment ! ⚠️' : 'Stock d\'aliment bas 🛒',
                    message: `Il vous reste environ ${Math.max(0, Math.floor(autonomy))} jours d'autonomie alimentaire (${Math.round(totalKg)}kg restants).`,
                    link: '/feed',
                    createdAt: Date.now()
                });
            }
        }

        // 3. Health Reminders (Today's tasks)
        const health = StorageService.getItem<HealthRecord[]>("health") || [];
        
        activeLots.forEach(lot => {
            if (!lot.arrivalDate) return;
            
            const birthDate = new Date(lot.arrivalDate);
            const diffTime = Math.abs(now.getTime() - birthDate.getTime());
            const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const breed = lot.breed || (lot.poultryType === 'caille' ? 'Caille' : 'Poulet de chair');
            const protocol = ProphylaxisService.getProtocolsForBreed(breed);
            
            // Look for steps due today or tomorrow
            protocol.forEach(step => {
                const isDueToday = step.day === ageInDays;
                const isDueTomorrow = step.day === ageInDays + 1;
                
                if (isDueToday || isDueTomorrow) {
                    // Check if already done
                    const stepDateObj = new Date(lot.arrivalDate!);
                    stepDateObj.setDate(stepDateObj.getDate() + (step.day - 1));
                    const stepDateStr = stepDateObj.toISOString().split("T")[0];
                    
                    const isAlreadyDone = health.some(h => 
                        h.date === stepDateStr && 
                        h.title.toLowerCase().includes(step.title.toLowerCase())
                    );
                    
                    if (!isAlreadyDone) {
                        alerts.push({
                            id: `health-${lot.id}-${step.day}`,
                            type: 'health-reminder',
                            severity: isDueToday ? 'critical' : 'warning',
                            title: isDueToday ? `Vaccin à faire AUJOURD'HUI ! 💉` : `Vaccin demain : ${step.title} 📅`,
                            message: `${step.title} pour le lot ${lot.breed || lot.id} (Âge: J${ageInDays}). ${step.description}`,
                            link: '/health',
                            createdAt: Date.now()
                        });
                    }
                }
            });
        });

        // 4. Hatchery (Hatching today/tomorrow)
        const incubation = StorageService.getItem<IncubationBatch[]>("incubation") || [];
        const ongoing = incubation.filter((b) => !b._deleted && (b.status === 'incubating' || b.status === 'ongoing'));
        
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

        // 5. Explicit Reminders (Added manually from Health Calendar)
        const vaccineReminders = StorageService.getItem<any[]>("vaccine_reminders") || [];
        vaccineReminders.forEach(rem => {
            const remDate = new Date(rem.date);
            if (now.getTime() - remDate.getTime() > 2 * 24 * 60 * 60 * 1000) return; // ignore ancient
            
            const diffTime = remDate.getTime() - new Date(todayStr).getTime();
            const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysRemaining === 0 || daysRemaining === 1) {
                const isDueToday = daysRemaining === 0;
                alerts.push({
                    id: `rem-u-${rem.id}`,
                    type: 'health-reminder',
                    severity: isDueToday ? 'critical' : 'warning',
                    title: isDueToday ? `Rappel : ${rem.title} AUJOURD'HUI ! 💊` : `Rappel : ${rem.title} demain 📅`,
                    message: `Soin programmé pour: ${rem.breed}. ${rem.description}`,
                    link: '/health',
                    createdAt: Date.now()
                });
            }
        });

        return alerts;
    }
};
