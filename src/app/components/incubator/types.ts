export interface IncubationBatch {
  id: string;
  name: string;
  species: 'poulet' | 'caille' | 'canard' | 'oie' | 'dinde';
  startDate: string;
  totalDays: number;
  incubatorName: string;
  incubatorType: 'automatic' | 'manual' | 'diy';
  incubatorCapacity: number;
  eggsCount: number;
  fertileCount: number;
  deadCount: number;
  investment: number;
  revenue: number;
  status: 'ongoing' | 'hatched' | 'cancelled';
  brooder: 'none' | 'on' | 'off';
  dailyChecks: boolean[];
  notes: string;
  lastUpdated: number;
}

export const SPECIES_CONFIG = {
  poulet: { label: 'Poulet', emoji: '🐔', totalDays: 21, tempC: 37.7, tempF: 99.9, humidity: '50-55%', humidityHatch: '65-75%' },
  caille:  { label: 'Caille', emoji: '🐦', totalDays: 17, tempC: 37.5, tempF: 99.5, humidity: '50-55%', humidityHatch: '65-70%' },
  canard:  { label: 'Canard', emoji: '🦆', totalDays: 28, tempC: 37.5, tempF: 99.5, humidity: '58-62%', humidityHatch: '70-75%' },
  oie:     { label: 'Oie', emoji: '🪿', totalDays: 30, tempC: 37.4, tempF: 99.3, humidity: '55-60%', humidityHatch: '70-75%' },
  dinde:   { label: 'Dinde', emoji: '🦃', totalDays: 28, tempC: 37.5, tempF: 99.5, humidity: '50-55%', humidityHatch: '70-75%' },
} as const;

export type SpeciesKey = keyof typeof SPECIES_CONFIG;

export function getDayTip(species: SpeciesKey, day: number, totalDays: number): string {
  const tips: Record<string, string> = {};
  if (species === 'poulet') {
    tips[1] = "Mise en place des œufs. Température 37.7°C, humidité 50-55%.";
    tips[2] = "Le blastoderme se développe. Ne pas ouvrir l'incubateur.";
    tips[3] = "Début de la formation du cœur et des vaisseaux sanguins.";
    tips[4] = "Le cœur commence à battre. Retournement 3x/jour minimum.";
    tips[5] = "Formation des yeux et des membres.";
    tips[7] = "🔦 Premier mirage recommandé. Retirer les œufs clairs.";
    tips[10] = "Les plumes commencent à se former.";
    tips[14] = "🔦 Deuxième mirage. La chambre à air doit être visible.";
    tips[18] = "⚠️ ARRÊT du retournement ! Augmenter l'humidité à 65-75%.";
    tips[19] = "Le poussin se positionne pour l'éclosion.";
    tips[20] = "Bréchage possible. Le sac vitellin est absorbé.";
    tips[21] = "🐣 Jour d'éclosion ! Ne pas ouvrir pendant le bréchage.";
  } else if (species === 'caille') {
    tips[1] = "Mise en place. Température 37.5°C, humidité 50-55%.";
    tips[7] = "🔦 Premier mirage. Retirer les œufs non fécondés.";
    tips[14] = "⚠️ ARRÊT du retournement ! Augmenter l'humidité à 65-70%.";
    tips[17] = "🐣 Jour d'éclosion des cailles !";
  } else if (species === 'canard') {
    tips[1] = "Mise en place. Température 37.5°C, humidité 58-62%.";
    tips[7] = "🔦 Premier mirage recommandé.";
    tips[14] = "🔦 Deuxième mirage.";
    tips[25] = "⚠️ ARRÊT du retournement ! Augmenter l'humidité à 70-75%.";
    tips[28] = "🐣 Jour d'éclosion des canetons !";
  } else if (species === 'dinde') {
    tips[1] = "Mise en place. Température 37.5°C, humidité 50-55%.";
    tips[8] = "🔦 Premier mirage recommandé.";
    tips[25] = "⚠️ ARRÊT du retournement ! Augmenter l'humidité à 70-75%.";
    tips[28] = "🦃 Jour d'éclosion des dindonneaux !";
  } else {
    tips[1] = "Mise en place. Température 37.4°C, humidité 55-60%.";
    tips[10] = "🔦 Premier mirage recommandé.";
    tips[27] = "⚠️ ARRÊT du retournement ! Augmenter l'humidité à 70-75%.";
    tips[30] = "🐣 Jour d'éclosion des oisons !";
  }
  return tips[day] || `Jour ${day}/${totalDays} — Continuer le retournement et surveiller la température.`;
}

export function getDaysElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function getDaysLeft(startDate: string, totalDays: number): number {
  return Math.max(0, totalDays - getDaysElapsed(startDate));
}

export function getExpectedHatchDate(startDate: string, totalDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + totalDays);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getHatchRate(fertile: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((fertile / total) * 1000) / 10;
}

export const FAQ_ITEMS = [
  {
    q: "Quelle température et humidité pour l'incubation ?",
    a: "Poulet : 37.7°C, 50-55% d'humidité (65-75% les 3 derniers jours). Caille : 37.5°C, mêmes taux. Canard : 37.5°C, 58-62% (70-75% en fin). Oie : 37.4°C, 55-60% (70-75% en fin). Dinde : 37.5°C, 50-55% (70-75% en fin)."
  },
  {
    q: "Comment installer les œufs dans l'incubateur ?",
    a: "Placez les œufs avec le gros bout vers le haut et le petit bout vers le bas. Minimum 6 œufs recommandé. Stabilisez la température 24h avant la mise en place."
  },
  {
    q: "Combien de jours d'incubation par espèce ?",
    a: "Poulet : 21 jours. Caille : 17 jours. Canard / Dinde : 28 jours. Oie : 28-30 jours."
  },
  {
    q: "Qu'est-ce que le mirage (Candling) ?",
    a: "Le mirage consiste à éclairer l'œuf avec une source lumineuse pour observer le développement embryonnaire. Recommandé aux jours 7 et 14. Les œufs clairs (non fécondés) doivent être retirés."
  },
  {
    q: "Qu'est-ce que le pré-éclosion ?",
    a: "Les 2-3 derniers jours avant l'éclosion, arrêtez le retournement, augmentez l'humidité et n'ouvrez plus l'incubateur. Le poussin perce la chambre à air puis la coquille (bréchage)."
  },
  {
    q: "À quelle fréquence retourner les œufs ?",
    a: "Minimum 3 fois par jour (idéalement 5). Un nombre impair est recommandé pour alterner la position de nuit. Les incubateurs automatiques le font toutes les 1-2 heures."
  }
];
