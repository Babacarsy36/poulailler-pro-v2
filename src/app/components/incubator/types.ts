export interface IncubationBatch {
  id: string;
  name: string;
  species: 'poulet' | 'caille' | 'canard' | 'oie' | 'dinde' | 'pigeon';
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
  notes: string;
  lastUpdated: number;
  hatchedCount?: number;
  unhatchedCount?: number;
  [key: string]: any;
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
  const tips: Record<number, string> = {};
  if (species === 'poulet') {
    tips[1] = "🚀 MISE EN PLACE : Température 37.7°C, humidité 50-55%. Ne pas ouvrir pendant la stabilisation.";
    tips[4] = "🔄 RETOURNEMENT : Assurez-vous de tourner les œufs 3 à 5 fois par jour (nombre impair).";
    tips[7] = "🔦 MIRAGE : Premier mirage recommandé. Retirez impérativement les œufs clairs (non fécondés).";
    tips[10] = "🌡️ CONTRÔLE : Vérifiez la stabilité de la température. Le développement s'accélère.";
    tips[14] = "🔦 MIRAGE 2 : Deuxième mirage. Vérifiez la taille de la chambre à air.";
    tips[18] = "⚠️ ARRÊT BRUTAL du retournement ! Augmentez l'humidité à 65-75% pour l'éclosion.";
    tips[19] = "🤫 SILENCE : Ne plus ouvrir l'incubateur. Le poussin se prépare au bréchage.";
    tips[21] = "🐣 ÉCLOSION ! Laissez les poussins sécher (24h) avant de les sortir vers l'éleveuse.";
  } else if (species === 'caille' || species === 'pigeon') {
    tips[1] = "🚀 MISE EN PLACE : Température 37.5°C, humidité 50-60%.";
    tips[7] = "🔦 MIRAGE : Mirage recommandé. Les œufs de caille sont sombres, soyez attentif.";
    tips[14] = "⚠️ ARRÊT du retournement ! Transition vers l'éclosion, humidité à 65-70%.";
    tips[17] = "🐣 ÉCLOSION des cailles ! Bravo !";
  } else if (species === 'dinde' || species === 'canard') {
    tips[1] = "🚀 MISE EN PLACE : Température 37.5°C, humidité 55-60%.";
    tips[7] = "🔦 MIRAGE 1 : Premier contrôle de fertilité.";
    tips[25] = "⚠️ ARRÊT du retournement ! Augmentez l'humidité à 70-75% pour l'éclosion.";
    tips[28] = "🐣 ÉCLOSION prévue ! Surveillez le bréchage.";
  } else if (species === 'oie') {
    tips[1] = "🚀 MISE EN PLACE : Température 37.4°C, humidité 55-60%.";
    tips[10] = "🔦 MIRAGE : Vérifiez le développement.";
    tips[27] = "⚠️ ARRÊT du retournement ! Humidité 70-75% requise.";
    tips[30] = "🐣 ÉCLOSION des oisons !";
  }
  
  if (tips[day]) return tips[day];
  
  // Default advice
  if (day < totalDays - 3) return "🔄 Continuez le retournement régulier (3-5x/jour) et surveillez l'eau.";
  if (day >= totalDays - 3) return "⚠️ Période d'éclosion : Ne plus retourner les œufs et maintenir une humidité élevée.";
  
  return `Jour ${day}/${totalDays} — Suivi normal de l'incubation.`;
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
